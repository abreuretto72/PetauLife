/**
 * generate-chronic-care-insights v1 — Camada 8b
 *
 * Cenários sensíveis: orientação de manejo de doença crônica diagnosticada
 * pelo vet, e — em casos extremos — convite delicado para conversa sobre
 * qualidade de vida quando há indicadores múltiplos de declínio terminal.
 *
 * Subcategorias:
 *   - chronic_disease         — orientação de manejo (não diagnóstico)
 *   - euthanasia_discussion   — convite à conversa, NUNCA recomendação
 *
 * REGRAS ABSOLUTAS:
 *   1. NUNCA diagnostica. Só orienta manejo do que JÁ foi diagnosticado
 *      pelo vet (chronic_conditions ativas).
 *   2. NUNCA sugere eutanásia. Linguagem é "qualidade de vida", "conversa
 *      com o vet", "escala de avaliação".
 *   3. Os primeiros 20 insights de chronic_disease vão pra status='pending_review'
 *      (admin valida antes de exibir ao tutor).
 *   4. euthanasia_discussion SEMPRE vai pra pending_review (sem exceção).
 *   5. Recursos de apoio em pt-BR incluídos no body: Falalu + Anclivepa.
 *
 * Modelo: Opus 4.7 (sensibilidade alta justifica custo).
 *
 * Push: APENAS se layer8_enabled=true E status='pending' (após review).
 *   - Insights pending_review NUNCA disparam push.
 *
 * CRON: 1x/semana segunda 04:00 UTC.
 * Cooldown: 90d via scope_key (manejo crônico não é semanal).
 *
 * Body opcional: { pet_id?, tutor_id? }
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MODEL_OPUS = 'claude-opus-4-7';
const COOLDOWN_DAYS = 90;
const EXPIRES_DAYS = 60;
const MS_DAY = 86400000;

// Limite de pending_review pra chronic_disease (primeiros 20 globais)
const CHRONIC_PENDING_REVIEW_LIMIT = 20;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResp(d, s = 200) {
  return new Response(JSON.stringify(d), {
    status: s,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

function extractJson(raw) {
  let s = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
  const fb = s.indexOf('{'); const lb = s.lastIndexOf('}');
  if (fb < 0 || lb < fb) return { ok: false };
  s = s.slice(fb, lb + 1);
  try { return { ok: true, value: JSON.parse(s) }; }
  catch (_e1) {
    const noTrail = s.replace(/,(\s*[}\]])/g, '$1');
    try { return { ok: true, value: JSON.parse(noTrail) }; }
    catch (_e2) { return { ok: false }; }
  }
}

async function callOpus(sys, usr, maxTokens = 1200) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL_OPUS, max_tokens: maxTokens, system: sys,
      messages: [{ role: 'user', content: usr }],
    }),
  });
  if (!r.ok) {
    console.warn('[generate-chronic-care-insights] Opus HTTP', r.status, (await r.text()).slice(0, 200));
    return null;
  }
  const j = await r.json();
  const text = j.content?.find((c) => c.type === 'text')?.text ?? '';
  const parsed = extractJson(text);
  return parsed.ok ? { ...parsed.value, _usage: j.usage, _model: j.model } : null;
}

function todayIso() { return new Date().toISOString().slice(0, 10); }

async function alreadyExists(sb, petId, scopeKey) {
  const since = new Date(Date.now() - COOLDOWN_DAYS * MS_DAY).toISOString();
  const { data } = await sb
    .from('pet_insights')
    .select('id')
    .eq('pet_id', petId)
    .eq('layer', 8)
    .eq('is_active', true)
    .gte('created_at', since)
    .contains('evidence', { scope_key: scopeKey })
    .limit(1)
    .maybeSingle();
  return !!data?.id;
}

async function isSilenced(sb, userId, petId, sub) {
  const { data } = await sb.rpc('is_insight_silenced', {
    p_user_id: userId, p_pet_id: petId, p_category: 'saude', p_subcategory: sub,
  });
  return data === true;
}

async function chronicPendingReviewCount(sb) {
  const { count } = await sb
    .from('pet_insights')
    .select('id', { count: 'exact', head: true })
    .eq('layer', 8)
    .eq('subcategory', 'chronic_disease')
    .eq('status', 'pending_review');
  return count ?? 0;
}

// ── Geriatric threshold (mesma lógica da L5) ────────────────────────────────
function isGeriatric(pet) {
  if (!pet.estimated_age_months && !pet.birth_date) return false;
  const today = new Date();
  const ageMonths = pet.estimated_age_months
    ?? Math.floor((today.getTime() - new Date(pet.birth_date).getTime()) / (30.44 * MS_DAY));
  if (!ageMonths) return false;
  const isCat = pet.species === 'cat';
  const w = pet.weight_kg ?? 10;
  // Senior baseline; geriatric = senior + 24m
  const seniorMonths = isCat ? 120 : (w >= 25 ? 84 : 108);
  const geriatricMonths = seniorMonths + 24;
  return ageMonths >= geriatricMonths;
}

// ── Detector euthanasia: 3+ sinais SIMULTÂNEOS, conservador ─────────────────
async function detectEuthanasiaSignals(sb, pet) {
  if (!isGeriatric(pet)) return null;

  const since = new Date(Date.now() - 30 * MS_DAY).toISOString().slice(0, 10);
  const [{ data: entries }, { data: weights }, { data: chronic }] = await Promise.all([
    sb.from('diary_entries')
      .select('entry_date, content, narration, mood_score, tags')
      .eq('pet_id', pet.id).eq('is_active', true)
      .gte('entry_date', since)
      .order('entry_date', { ascending: false }).limit(100),
    sb.from('weight_records')
      .select('weight_kg, recorded_at').eq('pet_id', pet.id).eq('is_active', true)
      .order('recorded_at', { ascending: false }).limit(20).maybeSingle()
      .then(() => sb.from('weight_records')
        .select('weight_kg, recorded_at').eq('pet_id', pet.id).eq('is_active', true)
        .order('recorded_at', { ascending: false }).limit(20))
      .catch(() => ({ data: [] })),
    sb.from('chronic_conditions')
      .select('name, severity, status').eq('pet_id', pet.id).eq('is_active', true),
  ]);

  if (!entries || entries.length < 5) return null;

  // Sinal 1 — mood médio <40 nos últimos 30d
  const moods = entries.filter((e) => typeof e.mood_score === 'number').map((e) => e.mood_score);
  const moodAvg = moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : 100;
  const moodSignal = moods.length >= 5 && moodAvg < 40;

  // Sinal 2 — múltiplas menções de dor/dificuldade nas tags ou narração
  const painKeywords = ['dor', 'doendo', 'mancando', 'dificuldade', 'cansado', 'apatia', 'tremendo', 'nao come', 'recusa', 'nao anda', 'nao levanta', 'sofrendo'];
  let painMentions = 0;
  for (const e of entries) {
    const content = `${e.content ?? ''} ${e.narration ?? ''} ${(e.tags ?? []).join(' ')}`.toLowerCase();
    if (painKeywords.some((kw) => content.includes(kw))) painMentions++;
  }
  const painSignal = painMentions >= 5;

  // Sinal 3 — chronic conditions com severity 'severe' ou 'terminal'
  const severeChronic = (chronic ?? []).filter((c) => ['severe', 'terminal'].includes((c.severity ?? '').toLowerCase()));
  const chronicSignal = severeChronic.length >= 1;

  // Sinal 4 — perda de peso >10% se há ≥2 weight_records
  let weightSignal = false;
  let weightTrend = null;
  if (Array.isArray(weights) && weights.length >= 2) {
    const latest = weights[0].weight_kg;
    const oldest = weights[weights.length - 1].weight_kg;
    if (latest && oldest && oldest > 0) {
      const dropPct = ((oldest - latest) / oldest) * 100;
      weightTrend = { latest, oldest, drop_pct: Math.round(dropPct) };
      if (dropPct > 10) weightSignal = true;
    }
  }

  const signals = [moodSignal, painSignal, chronicSignal, weightSignal].filter(Boolean);
  if (signals.length < 3) return null; // 3+ obrigatório

  return {
    type: 'euthanasia_discussion',
    age_months: pet.estimated_age_months,
    mood_avg: Math.round(moodAvg),
    pain_mentions: painMentions,
    severe_chronic: severeChronic.map((c) => c.name),
    weight_trend: weightTrend,
    signals_count: signals.length,
    scope_key: `eutanasia:${pet.id.slice(-8)}:${todayIso().slice(0, 7)}`,
  };
}

// ── Manejo de doença crônica ────────────────────────────────────────────────
async function detectChronicDisease(sb, petId) {
  const { data: chronic } = await sb
    .from('chronic_conditions')
    .select('id, name, code, severity, status, treatment_summary, diagnosed_date')
    .eq('pet_id', petId).eq('is_active', true);

  if (!chronic || chronic.length === 0) return [];

  return chronic.map((c) => ({
    type: 'chronic_disease',
    condition_id: c.id,
    condition_name: c.name,
    code: c.code,
    severity: c.severity,
    status: c.status,
    treatment_summary: c.treatment_summary,
    diagnosed_date: c.diagnosed_date,
    scope_key: `chronic:${petId.slice(-8)}:${c.id.slice(-8)}`,
  }));
}

// ── Opus 4.7 prompts ────────────────────────────────────────────────────────

const RECURSOS_APOIO = `Recursos de apoio em luto e cuidado terminal de pets (pt-BR):
- Falalu (https://falalu.com.br) — comunidade de tutores em situações difíceis.
- Anclivepa-SP (https://anclivepa-sp.com.br) — orientação clínica.
Fora do Brasil, considere a Lap of Love (lapoflove.com).`;

async function buildChronicDiseaseInsight(pet, chronic) {
  const sys = `Voce eh copiloto que orienta tutores no MANEJO DIARIO de uma doenca cronica JA DIAGNOSTICADA pelo veterinario. Tom: registro Elite (Clarice Lispector — terna, sensorial, sem derrame emocional). Pt-BR.

REGRAS ABSOLUTAS:
- NUNCA diagnostique. A condicao JA foi diagnosticada — voce so orienta como conviver.
- NUNCA prescreva medicacao, dose, tratamento. So mencione "siga o que o vet indicou".
- NUNCA use "voce deveria", "tem que". Use "vale considerar", "muitos tutores observam que ajuda".
- 3a pessoa sobre o pet, sem assinatura, sem onomatopeia, sem exclamacao.
- Inclua sugestoes pratico-observacionais: o que vale anotar no diario, sinais que merecem atencao, pequenas adaptacoes de rotina.
- Body curto (200-280 chars). Talking_points 3-4 itens praticos.
- Resposta APENAS JSON valido: { "title": "<ate 60 chars>", "body": "<texto>", "talking_points": ["...", "..."] }`;

  const usr = JSON.stringify({
    pet: { name: pet.name, species: pet.species, breed: pet.breed, age_months: pet.estimated_age_months },
    chronic_condition: chronic,
  });

  const result = await callOpus(sys, usr, 1000);
  if (!result) return null;

  return {
    title: result.title ?? `Manejo de ${chronic.condition_name}`,
    body: result.body ?? `Manejo da condicao cronica ${chronic.condition_name}. Siga o tratamento indicado pelo vet.`,
    talking_points: Array.isArray(result.talking_points) ? result.talking_points : [],
    usage: result._usage,
    model: result._model,
  };
}

async function buildEuthanasiaInsight(pet, payload) {
  const sys = `Voce eh copiloto que escreve UM CONVITE DELICADO para o tutor conversar com o vet sobre QUALIDADE DE VIDA do pet idoso. NAO eh recomendacao de eutanasia. NAO eh diagnostico. Eh apenas um convite a refletir e buscar orientacao profissional.

CONTEXTO: O pet eh geriatrico e os sinais agregados (humor baixo, dor recorrente, condicao cronica severa, perda de peso) sugerem que vale a pena ter essa conversa com o vet.

REGRAS ABSOLUTAS:
- NUNCA mencione a palavra "eutanasia". Use "qualidade de vida", "decisao dificil", "conversa com o vet".
- NUNCA use linguagem fria/clinica. Tom: Clarice Lispector — terna, contemplativa, presente.
- NUNCA assuma que o pet vai morrer. Apenas convide a refletir junto com o vet.
- Pergunte (no body) sobre observacoes que so o tutor sabe — apetite, alegria, interacao social.
- INCLUA recursos de apoio:
  ${RECURSOS_APOIO}
- 3a pessoa sobre o pet, sem assinatura, sem onomatopeia, sem exclamacao.
- Body 250-380 chars (eh um momento que merece tempo). Talking_points 4-5 perguntas reflexivas.
- Resposta APENAS JSON valido: { "title": "<ate 60 chars>", "body": "<texto>", "talking_points": ["pergunta 1","pergunta 2",...] }`;

  const usr = JSON.stringify({
    pet: { name: pet.name, species: pet.species, breed: pet.breed, age_months: pet.estimated_age_months },
    indicators_aggregate: payload,
  });

  const result = await callOpus(sys, usr, 1500);
  if (!result) return null;

  return {
    title: result.title ?? `Uma conversa com o vet sobre ${pet.name}`,
    body: result.body ?? '',
    talking_points: Array.isArray(result.talking_points) ? result.talking_points : [],
    usage: result._usage,
    model: result._model,
  };
}

// ── Pipeline por pet ────────────────────────────────────────────────────────

async function processPet(sb, pet, settings, runtimeState) {
  const created = [];

  if (settings?.layer8_enabled !== true) return [];
  const subToggles = (settings?.layer8_categories ?? {});

  // 1. chronic_disease (todas conditions ativas)
  const chronicCands = await detectChronicDisease(sb, pet.id);
  for (const cand of chronicCands) {
    if (subToggles['chronic_disease'] === false) continue;
    if (await isSilenced(sb, pet.user_id, pet.id, 'chronic_disease')) continue;
    if (await alreadyExists(sb, pet.id, cand.scope_key)) continue;

    const phrased = await buildChronicDiseaseInsight(pet, cand);
    if (!phrased) continue;

    // pending_review nos primeiros 20 globais
    const status = runtimeState.chronicPendingCount < CHRONIC_PENDING_REVIEW_LIMIT
      ? 'pending_review'
      : 'pending';
    if (status === 'pending_review') runtimeState.chronicPendingCount++;

    const expiresAt = new Date(Date.now() + EXPIRES_DAYS * MS_DAY).toISOString();
    const { data: ins, error } = await sb.from('pet_insights').insert({
      pet_id: pet.id,
      user_id: pet.user_id,
      layer: 8,
      type: 'suggestion',
      severity: 'consider',
      category: 'saude',
      subcategory: 'chronic_disease',
      title: phrased.title,
      body: phrased.body,
      evidence: { ...cand, talking_points: phrased.talking_points },
      cta_type: 'open_consultation',
      cta_payload: { pet_id: pet.id, condition_id: cand.condition_id },
      action_route: `/pet/${pet.id}/health`,
      generated_by: 'generate-chronic-care-insights',
      model_used: phrased.model ?? MODEL_OPUS,
      status,
      is_active: true,
      expires_at: expiresAt,
    }).select('id').single();

    if (error) {
      console.warn('[generate-chronic-care-insights] insert chronic failed:', error.message);
      continue;
    }
    created.push({ id: ins.id, subcategory: 'chronic_disease', status });

    // Push só pra status='pending'. pending_review NAO dispara push.
    if (status === 'pending') {
      sb.from('notifications_queue').insert({
        user_id: pet.user_id, pet_id: pet.id, type: 'ai_insight',
        title: phrased.title, body: phrased.body.slice(0, 140),
        data: { insight_id: ins.id, subcategory: 'chronic_disease', layer: 8, pet_id: pet.id },
        scheduled_for: new Date().toISOString(), is_active: true,
      }).then(() => {}, () => {});
    }

    // ai_invocations
    if (phrased.usage) {
      sb.from('ai_invocations').insert({
        function_name: 'generate-chronic-care-insights',
        user_id: pet.user_id, pet_id: pet.id,
        provider: 'anthropic', model_used: phrased.model ?? MODEL_OPUS,
        tokens_in: phrased.usage.input_tokens, tokens_out: phrased.usage.output_tokens,
        latency_ms: 0, status: 'success',
        payload: { layer: 8, subcategory: 'chronic_disease' },
      }).then(() => {}, () => {});
    }
  }

  // 2. euthanasia_discussion (sinais agregados, conservador)
  const eu = await detectEuthanasiaSignals(sb, pet);
  if (eu && subToggles['euthanasia_discussion'] !== false) {
    const silenced = await isSilenced(sb, pet.user_id, pet.id, 'euthanasia_discussion');
    const dup = await alreadyExists(sb, pet.id, eu.scope_key);
    if (!silenced && !dup) {
      const phrased = await buildEuthanasiaInsight(pet, eu);
      if (phrased) {
        const expiresAt = new Date(Date.now() + EXPIRES_DAYS * MS_DAY).toISOString();
        // SEMPRE pending_review pra eutanásia (sem exceção)
        const { data: ins, error } = await sb.from('pet_insights').insert({
          pet_id: pet.id,
          user_id: pet.user_id,
          layer: 8,
          type: 'suggestion',
          severity: 'consider',
          category: 'saude',
          subcategory: 'euthanasia_discussion',
          title: phrased.title,
          body: phrased.body,
          evidence: { ...eu, talking_points: phrased.talking_points, support_resources: ['falalu.com.br', 'anclivepa-sp.com.br'] },
          cta_type: 'open_consultation',
          cta_payload: { pet_id: pet.id },
          action_route: `/pet/${pet.id}/health`,
          generated_by: 'generate-chronic-care-insights',
          model_used: phrased.model ?? MODEL_OPUS,
          status: 'pending_review', // SEMPRE
          is_active: true,
          expires_at: expiresAt,
        }).select('id').single();

        if (error) {
          console.warn('[generate-chronic-care-insights] insert eutanasia failed:', error.message);
        } else {
          created.push({ id: ins.id, subcategory: 'euthanasia_discussion', status: 'pending_review' });
          // NUNCA push pra eutanásia

          if (phrased.usage) {
            sb.from('ai_invocations').insert({
              function_name: 'generate-chronic-care-insights',
              user_id: pet.user_id, pet_id: pet.id,
              provider: 'anthropic', model_used: phrased.model ?? MODEL_OPUS,
              tokens_in: phrased.usage.input_tokens, tokens_out: phrased.usage.output_tokens,
              latency_ms: 0, status: 'success',
              payload: { layer: 8, subcategory: 'euthanasia_discussion' },
            }).then(() => {}, () => {});
          }
        }
      }
    }
  }

  return created;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return jsonResp({ error: 'method not allowed' }, 405);

  const t0 = Date.now();
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const petIdInput = body.pet_id;
    const tutorIdInput = body.tutor_id;

    let petsQuery = sb
      .from('pets')
      .select('id, user_id, name, species, breed, weight_kg, estimated_age_months, birth_date')
      .eq('is_active', true)
      .is('deceased_at', null);

    if (petIdInput) petsQuery = petsQuery.eq('id', petIdInput);
    if (tutorIdInput) petsQuery = petsQuery.eq('user_id', tutorIdInput);

    const { data: pets } = await petsQuery;
    if (!pets || pets.length === 0) {
      return jsonResp({ success: true, pets_processed: 0, insights_created: 0, by_subcategory: {} });
    }

    const userIds = Array.from(new Set(pets.map((p) => p.user_id)));
    const { data: settingsList } = await sb
      .from('pet_proactive_settings')
      .select('user_id, layer8_enabled, layer8_categories')
      .in('user_id', userIds);
    const settingsMap = new Map((settingsList ?? []).map((s) => [s.user_id, s]));

    // Estado runtime — quantos chronic_disease pending_review já existem globalmente
    const runtimeState = {
      chronicPendingCount: await chronicPendingReviewCount(sb),
    };

    const allCreated = [];
    const bySub = {};
    let processed = 0;

    for (const pet of pets) {
      const settings = settingsMap.get(pet.user_id);
      try {
        const created = await processPet(sb, pet, settings, runtimeState);
        for (const c of created) {
          allCreated.push(c);
          bySub[c.subcategory] = (bySub[c.subcategory] ?? 0) + 1;
        }
        processed++;
      } catch (err) {
        console.error('[generate-chronic-care-insights] pet failed:', pet.id, err);
      }
    }

    const elapsed = Date.now() - t0;
    sb.from('edge_function_diag_logs').insert({
      function_name: 'generate-chronic-care-insights',
      level: 'info',
      message: 'finished',
      payload: {
        pets_processed: processed,
        insights_created: allCreated.length,
        by_subcategory: bySub,
        chronic_pending_review_total: runtimeState.chronicPendingCount,
        elapsed_ms: elapsed,
      },
    }).then(() => {}, () => {});

    console.log('[generate-chronic-care-insights] done | pets:', processed, '| insights:', allCreated.length, '| elapsed:', elapsed, 'ms');
    return jsonResp({
      success: true,
      pets_processed: processed,
      insights_created: allCreated.length,
      by_subcategory: bySub,
      chronic_pending_review_total: runtimeState.chronicPendingCount,
      elapsed_ms: elapsed,
    });
  } catch (err) {
    console.error('[generate-chronic-care-insights] error:', err);
    return jsonResp({ success: false, error: 'internal_error', message: String(err).slice(0, 500) }, 500);
  }
});
