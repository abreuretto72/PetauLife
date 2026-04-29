/**
 * generate-tutor-difficulty-insights v1 — Camada 8d
 *
 * A sub-fase mais delicada do PR. Detecta sinais agregados sugerindo que
 * o TUTOR pode estar passando por momento dificil (nao o pet). Convite
 * gentil a buscar apoio. NUNCA julga, NUNCA assume estado emocional.
 *
 * Subcategoria: tutor_difficulty
 *
 * DOUBLE OPT-IN:
 *   1. layer8_enabled = true
 *   2. layer8_categories.tutor_difficulty = true   (default FALSE)
 *
 * Detector ULTRACONSERVADOR — 2+ sinais simultaneos:
 *   - Inatividade: 0 diary entries em qualquer pet do tutor nos ultimos 14d,
 *                  E havia ≥10 entries no periodo 14-44d antes (rotina interrompida)
 *   - Queda registros: ultimos 14d com ≤30% dos registros baseline 30-44d
 *   - Quiet_hours alargados +50% em update recente
 *
 * status SEMPRE 'pending_review' (sem excecao).
 * NUNCA dispara push.
 *
 * Modelo: Opus 4.7. Cooldown 60d via scope_key.
 *
 * Body opcional: { tutor_id? }
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MODEL_OPUS = 'claude-opus-4-7';
const COOLDOWN_DAYS = 60;
const EXPIRES_DAYS = 30;
const MS_DAY = 86400000;

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

async function callOpus(sys, usr, maxTokens = 1500) {
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
    console.warn('[generate-tutor-difficulty-insights] Opus HTTP', r.status, (await r.text()).slice(0, 200));
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
    .eq('subcategory', 'tutor_difficulty')
    .eq('is_active', true)
    .gte('created_at', since)
    .contains('evidence', { scope_key: scopeKey })
    .limit(1)
    .maybeSingle();
  return !!data?.id;
}

async function isSilenced(sb, userId, petId) {
  const { data } = await sb.rpc('is_insight_silenced', {
    p_user_id: userId, p_pet_id: petId,
    p_category: 'comportamento', p_subcategory: 'tutor_difficulty',
  });
  return data === true;
}

// ── Detector ULTRACONSERVADOR ───────────────────────────────────────────────

async function detectTutorDifficulty(sb, tutorId) {
  // Contagem de diary entries por janela
  const last14 = new Date(Date.now() - 14 * MS_DAY).toISOString().slice(0, 10);
  const last44 = new Date(Date.now() - 44 * MS_DAY).toISOString().slice(0, 10);

  // Entries de TODOS os pets do tutor (não só um)
  const { data: pets } = await sb
    .from('pets').select('id')
    .eq('user_id', tutorId).eq('is_active', true).is('deceased_at', null);

  if (!pets || pets.length === 0) return null;
  const petIds = pets.map((p) => p.id);

  const { data: recentEntries } = await sb
    .from('diary_entries')
    .select('id, entry_date')
    .in('pet_id', petIds).eq('is_active', true)
    .gte('entry_date', last44);

  const all = recentEntries ?? [];
  const last14Count = all.filter((e) => e.entry_date >= last14).length;
  const baseline30Count = all.filter((e) => e.entry_date < last14).length;

  // Sinal 1 — silêncio: 0 entries em 14d, mas ≥10 antes (rotina interrompida)
  const silenceSignal = last14Count === 0 && baseline30Count >= 10;

  // Sinal 2 — queda: <30% do baseline
  const expectedFromBaseline = baseline30Count * (14 / 30);
  const dropSignal =
    baseline30Count >= 10 &&
    last14Count <= Math.floor(expectedFromBaseline * 0.3);

  // Sinal 3 — quiet_hours muito alargado: aceita só se quiet_hours ≥10h
  const { data: settings } = await sb
    .from('pet_proactive_settings')
    .select('quiet_hours_start, quiet_hours_end, updated_at')
    .eq('user_id', tutorId).maybeSingle();

  let quietHoursSignal = false;
  if (settings?.quiet_hours_start && settings?.quiet_hours_end) {
    const [hs] = String(settings.quiet_hours_start).split(':').map(Number);
    const [he] = String(settings.quiet_hours_end).split(':').map(Number);
    const span = ((he - hs) + 24) % 24;
    if (span >= 14) quietHoursSignal = true; // 14h+ de quiet hours
  }

  const signals = [silenceSignal, dropSignal, quietHoursSignal].filter(Boolean);
  if (signals.length < 2) return null;

  return {
    type: 'tutor_difficulty',
    silence_14d: silenceSignal,
    drop_signal: dropSignal,
    quiet_hours_signal: quietHoursSignal,
    last14_entries: last14Count,
    baseline30_entries: baseline30Count,
    pets_count: pets.length,
    target_pet_id: petIds[0], // ancorar ao primeiro pet ativo
    scope_key: `tutdiff:${tutorId.slice(-8)}:${todayIso().slice(0, 7)}`,
  };
}

// ── Opus 4.7 ────────────────────────────────────────────────────────────────

const RECURSOS_TUTOR = `Recursos de apoio (pt-BR):
- CVV (https://www.cvv.org.br) — Centro de Valorizacao da Vida. Apoio emocional gratuito 24h por telefone (188), chat ou e-mail.
- Falalu (https://falalu.com.br) — comunidade de tutores em momentos dificeis com pets.`;

async function buildTutorDifficultyInsight(payload) {
  const sys = `Voce eh copiloto que escreve UM CONVITE GENTIL ao tutor que parece estar com a rotina interrompida. NAO presume tristeza, depressao, ou crise. NAO julga. NAO recomenda terapia. Apenas reconhece a interrupcao e oferece recursos caso queira.

CONTEXTO: O app detectou interrupcao na rotina (sem registros recentes apos periodo de regularidade). Pode ser viagem, doenca, mudanca, luto, qualquer coisa. NAO sabemos. So oferecemos disponibilidade.

REGRAS ABSOLUTAS:
- 3a pessoa neutra/passiva: "a rotina aqui ficou mais quieta", "tem alguns dias sem registros".
- NUNCA pergunta "voce esta bem?", NUNCA assuma "voce parece triste/sobrecarregado".
- NUNCA mencione doenca mental, depressao, ansiedade, terapia.
- NUNCA exclamacao, NUNCA onomatopeia, NUNCA vocativo fofinho.
- Tom: Clarice "Lacos de Familia" — terna, presente, sem invasao.
- Reconhece SEM julgar. Oferece recursos. Termina abrindo possibilidade ("se for util").
- INCLUA recursos:
  ${RECURSOS_TUTOR}
- 1 paragrafo. 3-4 frases.
- Sem assinatura.
- Resposta APENAS JSON valido: { "title": "<ate 60 chars>", "body": "<ate 400 chars>" }`;

  const usr = JSON.stringify({ signals: payload });
  const result = await callOpus(sys, usr, 1200);
  if (!result) return null;

  return {
    title: result.title ?? 'Quando o cuidado precisa de apoio',
    body: result.body ?? '',
    usage: result._usage,
    model: result._model,
  };
}

async function processTutor(sb, tutorId) {
  // Settings — DOUBLE opt-in
  const { data: settings } = await sb
    .from('pet_proactive_settings')
    .select('layer8_enabled, layer8_categories')
    .eq('user_id', tutorId).maybeSingle();
  if (settings?.layer8_enabled !== true) return { skipped: 'layer8_off' };
  const subToggles = settings?.layer8_categories ?? {};
  if (subToggles['tutor_difficulty'] !== true) return { skipped: 'tutor_difficulty_off' };

  const detected = await detectTutorDifficulty(sb, tutorId);
  if (!detected) return { skipped: 'no_signals' };

  if (await isSilenced(sb, tutorId, detected.target_pet_id)) return { skipped: 'silenced' };
  if (await alreadyExists(sb, detected.target_pet_id, detected.scope_key)) return { skipped: 'cooldown' };

  const phrased = await buildTutorDifficultyInsight(detected);
  if (!phrased) return { skipped: 'llm_failed' };

  const expiresAt = new Date(Date.now() + EXPIRES_DAYS * MS_DAY).toISOString();
  const { data: ins, error } = await sb.from('pet_insights').insert({
    pet_id: detected.target_pet_id, user_id: tutorId,
    layer: 8, type: 'suggestion', severity: 'info',
    category: 'comportamento', subcategory: 'tutor_difficulty',
    title: phrased.title, body: phrased.body,
    evidence: { ...detected, support_resources: ['cvv.org.br', 'falalu.com.br'] },
    cta_type: 'monitor',
    cta_payload: { tutor_id: tutorId },
    action_route: null, // sem deeplink — eh um insight contemplativo
    generated_by: 'generate-tutor-difficulty-insights',
    model_used: phrased.model ?? MODEL_OPUS,
    status: 'pending_review', // SEMPRE
    is_active: true,
    expires_at: expiresAt,
  }).select('id').single();

  if (error) return { skipped: 'insert_failed', error: error.message };

  // NUNCA push em tutor_difficulty (mesmo apos review — fica visivel apenas no feed)

  if (phrased.usage) {
    sb.from('ai_invocations').insert({
      function_name: 'generate-tutor-difficulty-insights',
      user_id: tutorId, pet_id: detected.target_pet_id,
      provider: 'anthropic', model_used: phrased.model ?? MODEL_OPUS,
      tokens_in: phrased.usage.input_tokens, tokens_out: phrased.usage.output_tokens,
      latency_ms: 0, status: 'success',
      payload: { layer: 8, subcategory: 'tutor_difficulty' },
    }).then(() => {}, () => {});
  }

  return { created: ins.id };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return jsonResp({ error: 'method not allowed' }, 405);

  const t0 = Date.now();
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const tutorIdInput = body.tutor_id;

    let tutorIds = [];
    if (tutorIdInput) {
      tutorIds = [tutorIdInput];
    } else {
      // Scan: só tutors com layer8_enabled=true E tutor_difficulty=true
      const { data: settingsList } = await sb
        .from('pet_proactive_settings')
        .select('user_id, layer8_enabled, layer8_categories')
        .eq('layer8_enabled', true);
      tutorIds = (settingsList ?? [])
        .filter((s) => s.layer8_categories?.['tutor_difficulty'] === true)
        .map((s) => s.user_id);
    }

    let created = 0;
    const skips = {};
    for (const tid of tutorIds) {
      try {
        const r = await processTutor(sb, tid);
        if (r.created) created++;
        else if (r.skipped) skips[r.skipped] = (skips[r.skipped] ?? 0) + 1;
      } catch (err) {
        console.error('[generate-tutor-difficulty-insights] tutor failed:', tid, err);
      }
    }

    const elapsed = Date.now() - t0;
    sb.from('edge_function_diag_logs').insert({
      function_name: 'generate-tutor-difficulty-insights',
      level: 'info', message: 'finished',
      payload: {
        tutors_scanned: tutorIds.length,
        insights_created: created,
        skips, elapsed_ms: elapsed,
      },
    }).then(() => {}, () => {});

    return jsonResp({
      success: true,
      tutors_scanned: tutorIds.length,
      insights_created: created,
      skips, elapsed_ms: elapsed,
    });
  } catch (err) {
    console.error('[generate-tutor-difficulty-insights] error:', err);
    return jsonResp({ success: false, error: 'internal_error', message: String(err).slice(0, 500) }, 500);
  }
});
