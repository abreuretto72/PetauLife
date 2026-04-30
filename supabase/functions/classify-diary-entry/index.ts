/**
 * classify-diary-entry — Edge Function
 *
 * Unified AI classifier for auExpert diary entries.
 * Receives text and/or photo, returns:
 *   - Classifications (multiple types with confidence)
 *   - 3rd person narration
 *   - Mood detection
 *   - Urgency level
 *   - Clinical metrics extracted
 *   - Suggestions for the tutor
 *
 * Modules:
 *   cors.ts       — CORS headers and response helpers
 *   auth.ts       — JWT validation
 *   context.ts    — Pet profile + recent memories (RAG)
 *   classifier.ts — Prompt builder + Claude API + JSON parser
 *
 * Telemetria (Fase 1 admin dashboard):
 *   recordAiInvocation chamado no final (sucesso ou erro). Best-effort, nunca
 *   bloqueia. Alimenta tabela ai_invocations consumida pelas RPCs admin.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

import { corsResponse, jsonResponse, errorResponse } from './modules/cors.ts';
import { validateAuth } from './modules/auth.ts';
import { fetchPetContext } from './modules/context.ts';
import { classifyEntry } from './modules/classifier.ts';
import { getAIConfig } from './modules/_classifier/ai-config.ts';
import {
  recordAiInvocation,
  categorizeError,
  statusFromCategory,
} from '../_shared/recordAiInvocation.ts';
import { estimateAiCost } from '../_shared/estimateAiCost.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const FUNCTION_NAME = 'classify-diary-entry';

// ── Main handler ──

Deno.serve(async (req: Request) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return corsResponse();
  }

  // Telemetria — captura de inicio pra latencia + contexto pra recordAiInvocation
  const t0 = Date.now();
  const ctx: {
    user_id: string | null;
    pet_id: string | null;
    input_type: string | null;
    analysis_depth: string | null;
  } = { user_id: null, pet_id: null, input_type: null, analysis_depth: null };

  // Cliente service_role pra logar em ai_invocations (bypassa RLS)
  const telemetryClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 1. Validate API key exists
    if (!Deno.env.get('ANTHROPIC_API_KEY')) {
      return errorResponse('ANTHROPIC_API_KEY not configured', 500);
    }

    // 2. Authenticate
    const user = await validateAuth(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }
    ctx.user_id = user.id;

    // 3. Parse and validate input
    const body = await req.json();
    const {
      pet_id,
      text,
      photo_base64,
      photos_base64,
      pdf_base64,
      audio_url,
      audio_duration_seconds,
      video_url,
      input_type = 'text',
      language = 'pt-BR',
      analysis_depth = 'balanced',
    } = body;
    ctx.pet_id = pet_id ?? null;
    ctx.input_type = input_type;
    ctx.analysis_depth = analysis_depth;

    const hasPhoto = !!photo_base64 || (Array.isArray(photos_base64) && photos_base64.length > 0);
    const hasPDF = !!pdf_base64;
    const hasAudio = !!audio_url;
    const hasVideo = !!video_url;

    console.log('[classify-diary-entry] pet_id:', pet_id,
      '| input_type:', input_type,
      '| text_len:', text?.length ?? 0,
      '| photos:', photos_base64?.length ?? (photo_base64 ? 1 : 0),
      '| pdf:', hasPDF,
      '| audio:', hasAudio,
      '| video_url:', hasVideo,
      '| lang:', language,
      '| user:', user?.id ?? 'service',
    );

    if (!pet_id || (!text && !hasPhoto && !hasPDF && !hasAudio)) {
      return errorResponse('pet_id and (text, photo, pdf, or audio_url) are required', 400);
    }

    // 4. Fetch pet context
    const petContext = await fetchPetContext(pet_id, text ?? undefined);
    if (!petContext) {
      return errorResponse('Pet not found', 404);
    }

    // 5. Classify
    const result = await classifyEntry({
      text,
      photo_base64,
      photos_base64: Array.isArray(photos_base64) ? photos_base64 : undefined,
      pdf_base64: pdf_base64 ?? undefined,
      audio_url: audio_url ?? undefined,
      audio_duration_seconds: typeof audio_duration_seconds === 'number' ? audio_duration_seconds : undefined,
      video_url: video_url ?? undefined,
      input_type,
      language,
      petContext,
      analysisDepth: analysis_depth,
    });

    // 6. Auto-save allergy classifications — fire-and-forget
    const allergyClassifications = (result.classifications ?? []).filter(
      (c: { type: string; confidence: number; extracted_data: Record<string, unknown> }) =>
        c.type === 'allergy' && c.confidence >= 0.7 && c.extracted_data?.allergen,
    );
    if (allergyClassifications.length > 0 && user?.id) {
      const supabaseAllergy = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { data: existing } = await supabaseAllergy
        .from('allergies')
        .select('allergen')
        .eq('pet_id', pet_id)
        .eq('is_active', true);
      const existingLower = new Set((existing ?? []).map((r: { allergen: string }) => r.allergen.toLowerCase()));

      for (const c of allergyClassifications) {
        const d = c.extracted_data as Record<string, unknown>;
        const allergen = String(d.allergen ?? '').trim();
        if (!allergen || existingLower.has(allergen.toLowerCase())) continue;
        supabaseAllergy
          .from('allergies')
          .insert({
            pet_id,
            user_id: user.id,
            allergen,
            reaction: d.reaction_type ? String(d.reaction_type) : null,
            severity: (['mild', 'moderate', 'severe'].includes(String(d.severity ?? ''))
              ? String(d.severity)
              : 'mild'),
            diagnosed_date: d.first_observed ? String(d.first_observed) : null,
            diagnosed_by: null,
            is_active: true,
          })
          .then(() => {
            console.log('[classify-diary-entry] allergy auto-saved:', allergen, '| pet:', pet_id);
          })
          .catch((err: unknown) => {
            console.warn('[classify-diary-entry] allergy insert skipped:', String(err));
          });
        existingLower.add(allergen.toLowerCase());
      }
    }

    // 6.5. Auto-save scheduled events — fire-and-forget
    //
    // O prompt instrui a IA a tagear date+time futuros em consultations,
    // vaccines, exams, etc. Aqui detectamos esses casos e criamos a row
    // em scheduled_events pra que o evento apareça na agenda do pet.
    //
    // Tipos suportados (mapeados pra event_type da tabela):
    //   consultation → consultation
    //   return_visit → return_visit
    //   vaccine      → vaccine
    //   exam         → exam
    //   surgery      → surgery
    //   medication   → medication_dose (quando tem date+time específicos)
    //   grooming     → grooming
    //   travel       → travel_checklist
    //
    // Critério: extracted_data.date é YYYY-MM-DD futuro (> hoje no fuso UTC)
    // OU extracted_data.next_visit é uma data futura.
    // Mapeia classification.type (do classificador IA) → event_type da agenda.
    // Cobre os 36 tipos do CHECK constraint após migração 20260430.
    const SCHEDULABLE_TYPES_MAP: Record<string, string> = {
      // Saúde
      consultation:    'consultation',
      return_visit:    'return_visit',
      vaccine:         'vaccine',
      exam:            'exam',
      surgery:         'surgery',
      // Medicação
      medication:      'medication_dose',
      // Cuidados / serviços
      grooming:        'grooming',
      boarding:        'boarding',
      pet_sitter:      'pet_sitter',
      dog_walker:      'dog_walker',
      training:        'training',
      // Alimentação (vincula troca de ração futura à agenda)
      food:            'food_change',
      // Viagem
      travel:          'travel_checklist',
      // Administrativo
      plan:            'plan_payment',
      insurance:       'insurance_renewal',
    };

    if (user?.id) {
      const supabaseEvents = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const todayMidnightUtc = new Date();
      todayMidnightUtc.setUTCHours(0, 0, 0, 0);

      for (const c of (result.classifications ?? []) as Array<{
        type: string;
        confidence: number;
        extracted_data: Record<string, unknown>;
      }>) {
        const eventType = SCHEDULABLE_TYPES_MAP[c.type];
        if (!eventType || c.confidence < 0.6) continue;

        const d = c.extracted_data ?? {};

        // Resolve a data: prioriza `date`, depois `next_visit`.
        const rawDate = String(d.date ?? d.next_visit ?? '').trim();
        if (!rawDate || !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) continue;

        // Resolve hora: aceita HH:MM ou HH:MM:SS, default 09:00 (manhã)
        // quando ausente. Se ausente, marca all_day=true.
        const rawTime = String(d.time ?? '').trim();
        const hasTime = /^\d{2}:\d{2}(:\d{2})?$/.test(rawTime);
        const time    = hasTime ? (rawTime.length === 5 ? `${rawTime}:00` : rawTime) : '09:00:00';

        const scheduledFor = new Date(`${rawDate}T${time}`);
        if (Number.isNaN(scheduledFor.getTime())) continue;

        // Filtro: só agenda se for futuro (>= hoje 00:00 UTC).
        if (scheduledFor < todayMidnightUtc) continue;

        // Título amigável: usa label da extracted_data quando houver, senão fallback por tipo.
        const title = String(
          d.title ??
          d.name ??
          d.vaccine_name ??
          d.exam_type ??
          d.medication_name ??
          d.summary ??
          { consultation: 'Consulta veterinária',
            return_visit: 'Retorno veterinário',
            vaccine: 'Vacina',
            exam: 'Exame',
            surgery: 'Cirurgia',
            medication: 'Medicação',
            grooming: 'Banho e tosa',
            boarding: 'Hotel pet',
            pet_sitter: 'Pet sitter',
            dog_walker: 'Dog walker',
            training: 'Adestramento',
            food: 'Troca de ração',
            travel: 'Viagem',
            plan: 'Pagamento de plano',
            insurance: 'Renovação de seguro' }[c.type] ?? 'Compromisso',
        );

        const description = String(d.description ?? d.notes ?? '').trim() || null;
        const professional = String(d.veterinarian ?? d.professional ?? d.vet_name ?? '').trim() || null;
        const location = String(d.location ?? d.clinic ?? d.place ?? '').trim() || null;

        supabaseEvents
          .from('scheduled_events')
          .insert({
            pet_id,
            user_id:     user.id,
            event_type:  eventType,
            title,
            description,
            professional,
            location,
            scheduled_for: scheduledFor.toISOString(),
            all_day:       !hasTime,
            status:        'scheduled',
            is_active:     true,
          })
          .then(() => {
            console.log(
              `[classify-diary-entry] scheduled event created | pet:${pet_id} | type:${eventType} | for:${scheduledFor.toISOString()} | title:"${title}"`,
            );
          })
          .catch((err: unknown) => {
            console.warn('[classify-diary-entry] scheduled_events insert skipped:', String(err));
          });
      }
    }

    // 7. Record anonymized training data — fire-and-forget
    if (user?.id) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      supabase.rpc('anonymize_and_insert_training_record', {
        p_user_id: user.id,
        p_pet_id: pet_id,
        p_input_text: text ?? null,
        p_input_type: input_type,
        p_language: language,
        p_classifications: result.classifications ?? [],
        p_primary_type: result.primary_type,
        p_mood: result.mood ?? null,
        p_urgency: result.urgency,
        p_narration: result.narration ?? null,
        p_model_used: 'claude-sonnet-4-20250514',
        p_tokens_used: result.tokens_used,
      }).then(() => {
        console.log('[classify-diary-entry] training record queued for user:', user.id);
      }).catch((err: unknown) => {
        console.warn('[classify-diary-entry] training insert skipped (non-critical):', String(err));
      });
    }

    // ── Telemetria: registrar invocacao bem-sucedida em ai_invocations ──
    // Captura usage REAL via result._telemetry (anexado pelo classifier).
    // Quando ausente, cai em fallback do ai-config.
    {
      const t = result._telemetry;
      const cfg = await getAIConfig();
      const fallbackModel =
        input_type === 'pet_audio' ? cfg.model_audio :
        input_type === 'video'     ? cfg.model_video :
                                     cfg.model_classify;
      const modelUsed = t?.actual_model ?? fallbackModel;
      const provider: 'anthropic' | 'google' = t?.provider ?? 'anthropic';

      // Tokens reais por provider; sem mais null em tokens_in.
      let tokensIn = 0;
      let tokensOut = 0;
      let cacheRead = 0;
      let cacheWrite = 0;
      if (t?.claude_usage) {
        tokensIn   = t.claude_usage.input_tokens;
        tokensOut  = t.claude_usage.output_tokens;
        cacheRead  = t.claude_usage.cache_read_input_tokens;
        cacheWrite = t.claude_usage.cache_creation_input_tokens;
      } else if (t?.gemini_usage) {
        // Para Gemini, prompt_tokens ja exclui cached (subtraido em callGemini).
        tokensIn  = t.gemini_usage.prompt_tokens;
        tokensOut = t.gemini_usage.candidates_tokens;
        cacheRead = t.gemini_usage.cached_tokens;
      } else {
        // Fallback legado: tokens_used era apenas output em Claude.
        tokensOut = result.tokens_used ?? 0;
      }

      // Image/audio counts pra auditoria (custo ja incluso em tokens).
      const imageCount =
        Array.isArray(photos_base64) ? photos_base64.length :
        photo_base64 ? 1 :
        input_type === 'video' ? 1 :  // thumbnail fallback
        null;
      const audioSeconds =
        input_type === 'pet_audio' && typeof audio_duration_seconds === 'number'
          ? audio_duration_seconds : null;

      recordAiInvocation(telemetryClient, {
        function_name: FUNCTION_NAME,
        user_id: ctx.user_id,
        pet_id: ctx.pet_id,
        provider,
        model_used: modelUsed,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cache_read_tokens: cacheRead,
        cache_write_tokens: cacheWrite,
        image_count: imageCount,
        audio_seconds: audioSeconds,
        latency_ms: Date.now() - t0,
        // cost_estimated_usd descontinuado — RPC calcula via ai_pricing.
        // Mantemos call ao estimateAiCost por compat de log local.
        cost_estimated_usd: estimateAiCost(modelUsed, tokensIn, tokensOut),
        status: 'success',
        payload: {
          input_type: ctx.input_type,
          analysis_depth: ctx.analysis_depth,
          primary_type: result.primary_type,
          classifications_count: (result.classifications ?? []).length,
        },
      }).catch(() => {});
    }

    // 8. Return structured result
    return jsonResponse(result);

  } catch (err) {
    console.error('[classify-diary-entry] Unhandled error:', err);

    // ── Telemetria: registrar invocacao com erro ──
    const cat = categorizeError(err);
    recordAiInvocation(telemetryClient, {
      function_name: FUNCTION_NAME,
      user_id: ctx.user_id,
      pet_id: ctx.pet_id,
      model_used: null,
      latency_ms: Date.now() - t0,
      status: statusFromCategory(cat),
      error_category: cat,
      error_message: String(err).slice(0, 1000),
      user_message: 'Algo nao saiu como esperado. Tente novamente.',
      payload: { input_type: ctx.input_type, analysis_depth: ctx.analysis_depth },
    }).catch(() => {});

    return errorResponse('Internal error', 500, { message: String(err) });
  }
});
