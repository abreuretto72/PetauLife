/**
 * generate-pet-ops-insights v1 — Camada 7 (pet ops)
 *
 * Antecipação operacional. Detectores determinísticos + LLM apenas pra
 * fraseado neutro. Briefing pré-consulta usa Opus 4.7 (resumo agregado).
 *
 * Subcategorias ativas no MVP:
 *   - prescription_renewal       — medicação ativa com end_date em ≤14d
 *   - vet_consultation_prep      — consulta de retorno em ≤5d (Opus 4.7)
 *   - trip_anticipation          — viagem em planning/upcoming, start_date 5..21d
 *   - preventive_documentation   — vacina vencendo + viagem próxima
 *
 * Postergadas:
 *   - stock_management           (overlap c/ L1 medication_running_out)
 *   - routine_rebalance          (overlap c/ L6 co_tutor_distribution)
 *
 * CRON: 1x/dia 06:30 UTC.
 * Cooldown: 7d via evidence.scope_key.
 * Push: severity=consider/attention.
 *
 * Body opcional: { pet_id?, tutor_id? }
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MODEL_SONNET = 'claude-sonnet-4-6';
const MODEL_OPUS = 'claude-opus-4-7';

const COOLDOWN_DAYS = 7;
const EXPIRES_DAYS = 14;
const MS_DAY = 86400000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResp(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), {
    status: s,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ── Parser robusto ──────────────────────────────────────────────────────────
function extractJson(raw: string): { ok: boolean; value?: any; error?: string } {
  let s = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  const fb = s.indexOf('{'); const lb = s.lastIndexOf('}');
  if (fb < 0 || lb < fb) return { ok: false, error: 'no_braces' };
  s = s.slice(fb, lb + 1);
  try { return { ok: true, value: JSON.parse(s) }; }
  catch (_e1) {
    const noTrail = s.replace(/,(\s*[}\]])/g, '$1');
    try { return { ok: true, value: JSON.parse(noTrail) }; }
    catch (e2) { return { ok: false, error: String(e2).slice(0, 200) }; }
  }
}

async function callAnthropic(model: string, sys: string, usr: string, maxTokens = 600): Promise<any | null> {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model, max_tokens: maxTokens, system: sys,
      messages: [{ role: 'user', content: usr }],
    }),
  });
  if (!r.ok) {
    console.warn('[generate-pet-ops-insights] LLM HTTP', r.status, (await r.text()).slice(0, 200));
    return null;
  }
  const j = await r.json();
  const text = j.content?.find((c: any) => c.type === 'text')?.text ?? '';
  const parsed = extractJson(text);
  return parsed.ok ? { ...parsed.value, _usage: j.usage, _model: j.model } : null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function todayIso(): string { return new Date().toISOString().slice(0, 10); }
function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z').getTime();
  const db = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((db - da) / MS_DAY);
}

async function alreadyExists(sb: any, petId: string, scopeKey: string): Promise<boolean> {
  const since = new Date(Date.now() - COOLDOWN_DAYS * MS_DAY).toISOString();
  const { data } = await sb
    .from('pet_insights')
    .select('id')
    .eq('pet_id', petId)
    .eq('layer', 7)
    .eq('is_active', true)
    .gte('created_at', since)
    .contains('evidence', { scope_key: scopeKey })
    .limit(1)
    .maybeSingle();
  return !!data?.id;
}

async function isSilenced(sb: any, userId: string, petId: string, category: string, subcategory: string): Promise<boolean> {
  const { data } = await sb.rpc('is_insight_silenced', {
    p_user_id: userId, p_pet_id: petId, p_category: category, p_subcategory: subcategory,
  });
  return data === true;
}

// ── Detectores determinísticos ──────────────────────────────────────────────

async function detectPrescriptionRenewal(sb: any, petId: string) {
  const today = todayIso();
  const limit = new Date(Date.now() + 14 * MS_DAY).toISOString().slice(0, 10);

  const { data: meds } = await sb.from('medications')
    .select('id, name, end_date, frequency, reason')
    .eq('pet_id', petId).eq('is_active', true)
    .not('end_date', 'is', null)
    .gte('end_date', today).lte('end_date', limit);

  return (meds ?? []).map((m: any) => ({
    subcategory: 'prescription_renewal',
    medication_id: m.id,
    medication_name: m.name,
    end_date: m.end_date,
    days_remaining: daysBetween(today, m.end_date),
    frequency: m.frequency,
    reason: m.reason,
    scope_key: `presc:${petId.slice(-8)}:${m.id.slice(-8)}`,
  }));
}

async function detectVetConsultationPrep(sb: any, petId: string) {
  const today = todayIso();
  const min = new Date(Date.now() + 1 * MS_DAY).toISOString().slice(0, 10);
  const max = new Date(Date.now() + 5 * MS_DAY).toISOString().slice(0, 10);

  const { data: consults } = await sb.from('consultations')
    .select('id, date, follow_up_at, veterinarian, clinic, type, summary, diagnosis')
    .eq('pet_id', petId).eq('is_active', true)
    .not('follow_up_at', 'is', null)
    .gte('follow_up_at', min).lte('follow_up_at', max)
    .order('follow_up_at', { ascending: true });

  return (consults ?? []).map((c: any) => ({
    subcategory: 'vet_consultation_prep',
    consultation_id: c.id,
    follow_up_at: c.follow_up_at,
    days_until: daysBetween(today, c.follow_up_at),
    last_visit: c.date,
    veterinarian: c.veterinarian,
    clinic: c.clinic,
    type: c.type,
    last_summary: c.summary,
    last_diagnosis: c.diagnosis,
    scope_key: `vetprep:${petId.slice(-8)}:${c.id.slice(-8)}`,
  }));
}

async function detectTripAnticipation(sb: any, petId: string) {
  const today = todayIso();
  const min = new Date(Date.now() + 5 * MS_DAY).toISOString().slice(0, 10);
  const max = new Date(Date.now() + 21 * MS_DAY).toISOString().slice(0, 10);

  const { data: tripPets } = await sb.from('trip_pets')
    .select('trip_id, trips!inner(id, start_date, end_date, destination_country_code, destination_city, transport_mode, status)')
    .eq('pet_id', petId)
    .in('trips.status', ['planning', 'upcoming'])
    .gte('trips.start_date', min).lte('trips.start_date', max);

  return (tripPets ?? []).map((tp: any) => {
    const t = tp.trips;
    return {
      subcategory: 'trip_anticipation',
      trip_id: t.id,
      start_date: t.start_date,
      days_until: daysBetween(today, t.start_date),
      destination: `${t.destination_city ?? ''} ${t.destination_country_code ?? ''}`.trim() || 'destino',
      transport_mode: t.transport_mode,
      status: t.status,
      scope_key: `trip:${petId.slice(-8)}:${t.id.slice(-8)}`,
    };
  });
}

async function detectPreventiveDocumentation(sb: any, petId: string) {
  const today = todayIso();
  const vaxLimit = new Date(Date.now() + 30 * MS_DAY).toISOString().slice(0, 10);
  const tripMax = new Date(Date.now() + 45 * MS_DAY).toISOString().slice(0, 10);

  const { data: vax } = await sb.from('vaccines')
    .select('id, name, next_due_date')
    .eq('pet_id', petId).eq('is_active', true)
    .not('next_due_date', 'is', null)
    .gte('next_due_date', today).lte('next_due_date', vaxLimit);

  if (!vax || vax.length === 0) return [];

  const { data: trips } = await sb.from('trip_pets')
    .select('trip_id, trips!inner(id, start_date, destination_city, status)')
    .eq('pet_id', petId)
    .in('trips.status', ['planning', 'upcoming'])
    .gte('trips.start_date', today).lte('trips.start_date', tripMax);

  if (!trips || trips.length === 0) return [];

  const trip = trips[0].trips;
  return [{
    subcategory: 'preventive_documentation',
    vaccines_pending: vax.map((v: any) => ({ name: v.name, next_due_date: v.next_due_date })),
    trip_id: trip.id,
    trip_start_date: trip.start_date,
    destination: trip.destination_city,
    days_until_trip: daysBetween(today, trip.start_date),
    scope_key: `prevdoc:${petId.slice(-8)}:${trip.id.slice(-8)}`,
  }];
}

// ── Briefing pré-consulta (Opus 4.7) ────────────────────────────────────────

async function buildVetPrepBriefing(sb: any, pet: any, payload: any) {
  const since = new Date(Date.now() - 30 * MS_DAY).toISOString().slice(0, 10);

  const [{ data: entries }, { data: meds }, { data: baselines }] = await Promise.all([
    sb.from('diary_entries')
      .select('entry_date, content, narration, primary_type, mood_score, tags')
      .eq('pet_id', pet.id).eq('is_active', true)
      .gte('entry_date', since)
      .order('entry_date', { ascending: false }).limit(8),
    sb.from('medications')
      .select('name, frequency, reason, start_date, end_date')
      .eq('pet_id', pet.id).eq('is_active', true),
    sb.from('pet_baseline_metrics')
      .select('metric_key, mean, stddev, sample_count, window_days')
      .eq('pet_id', pet.id),
  ]);

  const sys = `Voce eh copiloto que prepara o tutor para uma consulta veterinaria de retorno.
Tom: registro Elite (3a pessoa, sem onomatopeia, sem assinatura, sem exclamacao). Pt-BR.

REGRAS CRITICAS:
- NUNCA diagnostique. Use "considere mencionar", "vale comentar", "padrao observado".
- Briefing eh PRA O TUTOR LEVAR PRA CONSULTA, nao substitui o vet.
- Liste 3-5 pontos objetivos do que mudou desde a ultima consulta.
- Inclua: medicacoes em curso, mudancas de humor/apetite/comportamento, dados quantificaveis.
- Resposta APENAS JSON valido, sem markdown:
  { "title": "Preparacao para retorno em <data>", "body": "<texto curto ate 220 chars>", "talking_points": ["ponto 1","ponto 2",...] }
- Body curto. Talking_points 3-5 itens.`;

  const usr = JSON.stringify({
    pet: { name: pet.name, species: pet.species, breed: pet.breed, weight_kg: pet.weight_kg },
    follow_up: payload,
    recent_entries: entries ?? [],
    active_medications: meds ?? [],
    baselines: baselines ?? [],
  });

  const result = await callAnthropic(MODEL_OPUS, sys, usr, 800);
  if (!result) return null;

  // Telemetria
  if (result._usage) {
    sb.from('ai_invocations').insert({
      function_name: 'generate-pet-ops-insights',
      user_id: pet.user_id, pet_id: pet.id,
      provider: 'anthropic', model_used: result._model ?? MODEL_OPUS,
      tokens_in: result._usage.input_tokens, tokens_out: result._usage.output_tokens,
      latency_ms: 0, status: 'success',
      payload: { layer: 7, subcategory: 'vet_consultation_prep' },
    }).then(() => {}, () => {});
  }

  return {
    title: result.title ?? `Retorno em ${payload.follow_up_at}`,
    body: result.body ?? '',
    talking_points: Array.isArray(result.talking_points) ? result.talking_points : [],
  };
}

// ── Fraseado (Sonnet 4.6) pras outras 3 subcategorias ──────────────────────

async function phraseInsight(payload: any, sub: string): Promise<{ title: string; body: string }> {
  const sys = `Voce reescreve um alerta operacional em linguagem natural e calma. Tom Elite (3a pessoa, sem onomatopeia, sem assinatura, sem "!"). Pt-BR.
Resposta APENAS JSON valido: { "title": "<ate 60 chars>", "body": "<ate 200 chars>" }
NUNCA invente datas/dosagens. NUNCA diagnostique.`;

  const usr = JSON.stringify({ subcategory: sub, ...payload });
  const result = await callAnthropic(MODEL_SONNET, sys, usr, 350);
  if (!result) return { title: '', body: '' };
  return { title: result.title ?? '', body: result.body ?? '' };
}

function defaultTitle(sub: string, c: any): string {
  if (sub === 'prescription_renewal') return `${c.medication_name} acaba em ${c.days_remaining}d`;
  if (sub === 'trip_anticipation') return `Viagem em ${c.days_until}d para ${c.destination}`;
  if (sub === 'preventive_documentation') return `Documentos pendentes para a viagem`;
  return 'Pet ops';
}
function defaultBody(sub: string, c: any): string {
  if (sub === 'prescription_renewal')
    return `${c.medication_name} termina em ${c.end_date}. Vale renovar receita ou repor o estoque.`;
  if (sub === 'trip_anticipation')
    return `Viagem em ${c.days_until} dias. Vale revisar checklist do prontuario e antiparasitarios.`;
  if (sub === 'preventive_documentation') {
    const vaxNames = (c.vaccines_pending ?? []).map((v: any) => v.name).join(', ');
    return `Vacinacao pendente (${vaxNames}) antes da viagem em ${c.days_until_trip}d. Considere antecipar.`;
  }
  return '';
}

// ── Pipeline por pet ────────────────────────────────────────────────────────

async function processPet(sb: any, pet: any, settings: any) {
  const created: any[] = [];

  const allCandidates = [
    ...(await detectPrescriptionRenewal(sb, pet.id)),
    ...(await detectVetConsultationPrep(sb, pet.id)),
    ...(await detectTripAnticipation(sb, pet.id)),
    ...(await detectPreventiveDocumentation(sb, pet.id)),
  ];

  for (const cand of allCandidates) {
    const sub = cand.subcategory as string;

    // Toggle por subcategoria
    const subToggles = (settings?.layer7_categories ?? {}) as Record<string, boolean>;
    if (subToggles[sub] === false) continue;

    // Silenced?
    const silencedCat = sub === 'preventive_documentation' ? 'documento' : 'saude';
    if (await isSilenced(sb, pet.user_id, pet.id, silencedCat, sub)) continue;

    // Cooldown 7d
    if (await alreadyExists(sb, pet.id, cand.scope_key)) continue;

    // Severity
    let severity: 'info' | 'consider' | 'attention' = 'consider';
    if (sub === 'vet_consultation_prep' && (cand as any).days_until <= 1) severity = 'attention';
    if (sub === 'prescription_renewal' && (cand as any).days_remaining <= 3) severity = 'attention';
    if (sub === 'preventive_documentation' && (cand as any).days_until_trip <= 14) severity = 'attention';

    // Categoria pro CHECK do banco
    let category = 'saude';
    if (sub === 'trip_anticipation') category = 'comportamento';
    if (sub === 'preventive_documentation') category = 'documento';

    // Title/body
    let title = '';
    let body = '';
    let evidence: any = { ...cand, type: sub };
    let cta_type: string | null = null;
    let cta_payload: any = {};
    let action_route: string | null = null;
    let modelUsed = MODEL_SONNET;

    if (sub === 'vet_consultation_prep') {
      const briefing = await buildVetPrepBriefing(sb, pet, cand);
      title = briefing?.title || `Retorno em ${(cand as any).follow_up_at}`;
      body = briefing?.body || `Consulta de retorno em ${(cand as any).days_until} dia(s).`;
      evidence.talking_points = briefing?.talking_points ?? [];
      cta_type = 'open_health_screen';
      action_route = `/pet/${pet.id}/health`;
      modelUsed = MODEL_OPUS;
    } else {
      const phrased = await phraseInsight(cand, sub);
      title = phrased.title || defaultTitle(sub, cand);
      body = phrased.body || defaultBody(sub, cand);

      if (sub === 'prescription_renewal') {
        cta_type = 'open_pharmacy_finder';
        cta_payload = { medication_id: (cand as any).medication_id };
        action_route = `/pet/${pet.id}/health`;
      } else if (sub === 'trip_anticipation') {
        cta_type = 'open_trip_screen';
        cta_payload = { trip_id: (cand as any).trip_id };
        action_route = `/trips/${(cand as any).trip_id}`;
      } else if (sub === 'preventive_documentation') {
        cta_type = 'open_health_screen';
        action_route = `/pet/${pet.id}/health`;
      }
    }

    const expiresAt = new Date(Date.now() + EXPIRES_DAYS * MS_DAY).toISOString();

    const { data: ins, error } = await sb.from('pet_insights').insert({
      pet_id: pet.id,
      user_id: pet.user_id,
      layer: 7,
      type: 'suggestion',
      severity,
      category,
      subcategory: sub,
      title,
      body,
      evidence,
      cta_type,
      cta_payload,
      action_route,
      generated_by: 'generate-pet-ops-insights',
      model_used: modelUsed,
      status: 'pending',
      is_active: true,
      expires_at: expiresAt,
    }).select('id').single();

    if (error) {
      console.warn('[generate-pet-ops-insights] insert failed:', sub, error.message);
      continue;
    }

    created.push({ id: ins.id, subcategory: sub, severity });

    // Push pra severity ≥ consider
    if (severity === 'consider' || severity === 'attention') {
      sb.from('notifications_queue').insert({
        user_id: pet.user_id,
        pet_id: pet.id,
        type: 'ai_insight',
        title,
        body: body.slice(0, 140),
        data: { insight_id: ins.id, subcategory: sub, layer: 7, pet_id: pet.id },
        scheduled_for: new Date().toISOString(),
        is_active: true,
      }).then(() => {}, () => {});
    }
  }

  return created;
}

// ── HTTP entrypoint ─────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return jsonResp({ error: 'method not allowed' }, 405);

  const t0 = Date.now();
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const petIdInput: string | undefined = body.pet_id;
    const tutorIdInput: string | undefined = body.tutor_id;

    let petsQuery = sb
      .from('pets')
      .select('id, user_id, name, species, breed, weight_kg')
      .eq('is_active', true)
      .is('deceased_at', null);

    if (petIdInput) petsQuery = petsQuery.eq('id', petIdInput);
    if (tutorIdInput) petsQuery = petsQuery.eq('user_id', tutorIdInput);

    const { data: pets } = await petsQuery;
    if (!pets || pets.length === 0) {
      return jsonResp({ success: true, pets_processed: 0, insights_created: 0, by_subcategory: {} });
    }

    const userIds = Array.from(new Set(pets.map((p: any) => p.user_id)));
    const { data: settingsList } = await sb
      .from('pet_proactive_settings')
      .select('user_id, layer7_enabled, layer7_categories')
      .in('user_id', userIds);
    const settingsMap = new Map((settingsList ?? []).map((s: any) => [s.user_id, s]));

    const allCreated: any[] = [];
    const bySub: Record<string, number> = {};
    let processed = 0;

    for (const pet of pets) {
      const settings = settingsMap.get(pet.user_id);
      if (settings?.layer7_enabled === false) continue;
      try {
        const created = await processPet(sb, pet, settings);
        for (const c of created) {
          allCreated.push(c);
          bySub[c.subcategory] = (bySub[c.subcategory] ?? 0) + 1;
        }
        processed++;
      } catch (err) {
        console.error('[generate-pet-ops-insights] pet failed:', pet.id, err);
      }
    }

    const elapsed = Date.now() - t0;
    sb.from('edge_function_diag_logs').insert({
      function_name: 'generate-pet-ops-insights',
      level: 'info',
      message: 'finished',
      payload: {
        pets_processed: processed,
        insights_created: allCreated.length,
        by_subcategory: bySub,
        elapsed_ms: elapsed,
      },
    }).then(() => {}, () => {});

    console.log('[generate-pet-ops-insights] done | pets:', processed, '| insights:', allCreated.length, '| elapsed:', elapsed, 'ms');
    return jsonResp({
      success: true,
      pets_processed: processed,
      insights_created: allCreated.length,
      by_subcategory: bySub,
      elapsed_ms: elapsed,
    });
  } catch (err) {
    console.error('[generate-pet-ops-insights] error:', err);
    return jsonResp({ success: false, error: 'internal_error', message: String(err).slice(0, 500) }, 500);
  }
});
