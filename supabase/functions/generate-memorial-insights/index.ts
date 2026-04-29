/**
 * generate-memorial-insights v1 — Camada 8c
 *
 * Modo luto. Dois eventos:
 *
 *   - memorial_mode         — insight ÚNICO disparado quando deceased_at é
 *                             populado pela primeira vez. Carta de despedida
 *                             contemplativa do app pro tutor. Sempre push
 *                             (1 só), mas só se layer8_enabled=true.
 *
 *   - memorial_anniversary  — anualmente, na data do óbito, lembrança suave.
 *                             severity=info. Sem push se layer8_enabled=false.
 *
 * Modelo: Opus 4.7 (sensibilidade absoluta).
 * Tom: Clarice "Laços de Família" — terna, contemplativa, presente.
 * NUNCA Clarice "A Hora da Estrela" (peso/tragédia/sofrimento).
 *
 * Body opcional:
 *   { pet_id?, mode?: 'memorial' | 'anniversary' }
 *   Sem pet_id + sem mode = scan de aniversários para todos os pets falecidos.
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MODEL_OPUS = 'claude-opus-4-7';
const EXPIRES_DAYS = 365;
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
    console.warn('[generate-memorial-insights] Opus HTTP', r.status, (await r.text()).slice(0, 200));
    return null;
  }
  const j = await r.json();
  const text = j.content?.find((c) => c.type === 'text')?.text ?? '';
  const parsed = extractJson(text);
  return parsed.ok ? { ...parsed.value, _usage: j.usage, _model: j.model } : null;
}

function todayIso() { return new Date().toISOString().slice(0, 10); }
function ymdParts(iso) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return { y, m, d };
}

async function alreadyExistsMemorial(sb, petId, scopeKey) {
  const { data } = await sb
    .from('pet_insights')
    .select('id')
    .eq('pet_id', petId)
    .eq('layer', 8)
    .eq('is_active', true)
    .contains('evidence', { scope_key: scopeKey })
    .limit(1)
    .maybeSingle();
  return !!data?.id;
}

// ── Top moments (entries com narração ou maior mood_score) ──────────────────
async function fetchTopMoments(sb, petId, limit = 5) {
  const { data: entries } = await sb
    .from('diary_entries')
    .select('entry_date, content, narration, primary_type, mood_score')
    .eq('pet_id', petId)
    .eq('is_active', true)
    .not('narration', 'is', null)
    .order('mood_score', { ascending: false, nullsFirst: false })
    .limit(limit);
  return entries ?? [];
}

// ── Memorial mode (carta de despedida) ──────────────────────────────────────

async function buildMemorialMode(pet, topMoments) {
  const sys = `Voce eh copiloto que escreve UMA carta breve e ternissima do app para o tutor que acabou de perder um pet. Tom: Clarice Lispector em "Lacos de Familia" — contemplativa, presente, sensorial, sem peso, sem dramatizacao, sem desespero. Pt-BR.

REGRAS ABSOLUTAS:
- 3a pessoa sobre o pet (nao na voz dele).
- NUNCA use "ate logo", "ate sempre" — evita falsa esperanca de reencontro.
- NUNCA use a palavra "morte" diretamente. Use "partida", "encerramento", "ultimo capitulo".
- NUNCA use exclamacao, onomatopeia, vocativo fofinho.
- NUNCA promete coisas (ele esta em paz, virou estrela). So registra.
- 1 paragrafo curto. 3-4 frases.
- Reconhece a perda. Nomeia o pet. Sugere folhear as memorias guardadas no app.
- Sem assinatura textual.
- Resposta APENAS JSON valido: { "title": "<ate 60 chars>", "body": "<ate 500 chars>" }`;

  const usr = JSON.stringify({
    pet: { name: pet.name, species: pet.species, breed: pet.breed },
    deceased_at: pet.deceased_at,
    top_moments: topMoments.map((m) => ({
      date: m.entry_date,
      narration: m.narration?.slice(0, 200),
    })),
  });

  const result = await callOpus(sys, usr, 1200);
  if (!result) return null;

  return {
    title: result.title ?? `Em memória de ${pet.name}`,
    body: result.body ?? '',
    usage: result._usage,
    model: result._model,
  };
}

// ── Memorial anniversary (lembrança anual) ──────────────────────────────────

async function buildMemorialAnniversary(pet, yearsSince, topMoments) {
  const sys = `Voce eh copiloto que escreve UMA mensagem breve e ternissima para o tutor no aniversario do dia em que perdeu seu pet. Tom: Clarice Lispector em "Lacos de Familia" — contemplativa, presente, sensorial, sem peso. Pt-BR.

REGRAS ABSOLUTAS:
- 3a pessoa sobre o pet.
- NUNCA use exclamacao, onomatopeia, vocativo fofinho, dramatizacao.
- NUNCA assuma como o tutor esta se sentindo. Apenas reconhece a data.
- 2-3 frases curtas. Convida a folhear as memorias do livro do pet.
- Sem assinatura.
- Resposta APENAS JSON valido: { "title": "<ate 60 chars>", "body": "<ate 280 chars>" }`;

  const usr = JSON.stringify({
    pet: { name: pet.name, species: pet.species, breed: pet.breed },
    years_since: yearsSince,
    sample_memories: topMoments.slice(0, 3).map((m) => m.narration?.slice(0, 150)),
  });

  const result = await callOpus(sys, usr, 600);
  if (!result) return null;

  return {
    title: result.title ?? `${yearsSince} ano(s) sem ${pet.name}`,
    body: result.body ?? '',
    usage: result._usage,
    model: result._model,
  };
}

// ── Pipeline ────────────────────────────────────────────────────────────────

async function processMemorialMode(sb, pet) {
  const scopeKey = `memorial_mode:${pet.id.slice(-8)}`;
  if (await alreadyExistsMemorial(sb, pet.id, scopeKey)) {
    return { skipped: 'already_exists' };
  }

  const topMoments = await fetchTopMoments(sb, pet.id, 5);
  const phrased = await buildMemorialMode(pet, topMoments);
  if (!phrased) return { skipped: 'llm_failed' };

  // Layer8 default OFF — mas memorial_mode é EXCEÇÃO: sempre cria. Apenas o
  // push respeita layer8_enabled.
  const { data: settings } = await sb
    .from('pet_proactive_settings')
    .select('layer8_enabled')
    .eq('user_id', pet.user_id)
    .maybeSingle();
  const sendPush = settings?.layer8_enabled === true;

  const expiresAt = new Date(Date.now() + EXPIRES_DAYS * MS_DAY).toISOString();
  const { data: ins, error } = await sb.from('pet_insights').insert({
    pet_id: pet.id, user_id: pet.user_id,
    layer: 8, type: 'suggestion', severity: 'info',
    category: 'comportamento', subcategory: 'memorial_mode',
    title: phrased.title, body: phrased.body,
    evidence: {
      type: 'memorial_mode',
      scope_key: scopeKey,
      deceased_at: pet.deceased_at,
      top_moments: topMoments.map((m) => ({ date: m.entry_date })),
    },
    cta_type: 'view_chart',
    cta_payload: { pet_id: pet.id, view: 'memorial' },
    action_route: `/pet/${pet.id}/memorial`,
    generated_by: 'generate-memorial-insights',
    model_used: phrased.model ?? MODEL_OPUS,
    status: 'pending',
    is_active: true,
    expires_at: expiresAt,
  }).select('id').single();

  if (error) return { skipped: 'insert_failed', error: error.message };

  if (sendPush) {
    sb.from('notifications_queue').insert({
      user_id: pet.user_id, pet_id: pet.id, type: 'ai_insight',
      title: phrased.title, body: phrased.body.slice(0, 140),
      data: { insight_id: ins.id, subcategory: 'memorial_mode', layer: 8, pet_id: pet.id },
      scheduled_for: new Date().toISOString(), is_active: true,
    }).then(() => {}, () => {});
  }

  if (phrased.usage) {
    sb.from('ai_invocations').insert({
      function_name: 'generate-memorial-insights',
      user_id: pet.user_id, pet_id: pet.id,
      provider: 'anthropic', model_used: phrased.model ?? MODEL_OPUS,
      tokens_in: phrased.usage.input_tokens, tokens_out: phrased.usage.output_tokens,
      latency_ms: 0, status: 'success',
      payload: { layer: 8, subcategory: 'memorial_mode' },
    }).then(() => {}, () => {});
  }

  return { created: ins.id, sent_push: sendPush };
}

async function processMemorialAnniversary(sb, pet) {
  if (!pet.deceased_at) return { skipped: 'not_deceased' };
  const today = new Date();
  const dec = ymdParts(pet.deceased_at);
  const tom = ymdParts(today.toISOString());

  // Mesmo m+d, ano diferente, ≥1 ano
  if (tom.m !== dec.m || tom.d !== dec.d) return { skipped: 'not_anniversary' };
  const yearsSince = tom.y - dec.y;
  if (yearsSince < 1) return { skipped: 'not_yet_first_year' };

  const scopeKey = `memorial_anniversary:${pet.id.slice(-8)}:${tom.y}`;
  if (await alreadyExistsMemorial(sb, pet.id, scopeKey)) {
    return { skipped: 'already_exists' };
  }

  // Settings — anniversary respeita layer8_enabled (opt-in)
  const { data: settings } = await sb
    .from('pet_proactive_settings')
    .select('layer8_enabled, layer8_categories')
    .eq('user_id', pet.user_id)
    .maybeSingle();
  if (settings?.layer8_enabled !== true) return { skipped: 'layer8_off' };
  const subToggles = settings?.layer8_categories ?? {};
  if (subToggles['memorial_anniversary'] === false) return { skipped: 'subcategory_off' };

  const topMoments = await fetchTopMoments(sb, pet.id, 3);
  const phrased = await buildMemorialAnniversary(pet, yearsSince, topMoments);
  if (!phrased) return { skipped: 'llm_failed' };

  const expiresAt = new Date(Date.now() + 30 * MS_DAY).toISOString();
  const { data: ins, error } = await sb.from('pet_insights').insert({
    pet_id: pet.id, user_id: pet.user_id,
    layer: 8, type: 'suggestion', severity: 'info',
    category: 'comportamento', subcategory: 'memorial_anniversary',
    title: phrased.title, body: phrased.body,
    evidence: { type: 'memorial_anniversary', scope_key: scopeKey, years_since: yearsSince, deceased_at: pet.deceased_at },
    cta_type: 'view_chart',
    cta_payload: { pet_id: pet.id, view: 'memorial' },
    action_route: `/pet/${pet.id}/memorial`,
    generated_by: 'generate-memorial-insights',
    model_used: phrased.model ?? MODEL_OPUS,
    status: 'pending',
    is_active: true,
    expires_at: expiresAt,
  }).select('id').single();

  if (error) return { skipped: 'insert_failed', error: error.message };

  // Anniversary: registrar lifecycle event
  sb.from('pet_lifecycle_events').insert({
    pet_id: pet.id, user_id: pet.user_id,
    event_type: 'memorial_anniversary',
    event_date: todayIso(),
    notes: `${yearsSince} ano(s) desde a partida`,
    metadata: { source: 'generate-memorial-insights', insight_id: ins.id, years_since: yearsSince },
    is_active: true,
  }).then(() => {}, () => {});

  // Push respeita layer8_enabled (já validado acima)
  sb.from('notifications_queue').insert({
    user_id: pet.user_id, pet_id: pet.id, type: 'ai_insight',
    title: phrased.title, body: phrased.body.slice(0, 140),
    data: { insight_id: ins.id, subcategory: 'memorial_anniversary', layer: 8, pet_id: pet.id },
    scheduled_for: new Date().toISOString(), is_active: true,
  }).then(() => {}, () => {});

  if (phrased.usage) {
    sb.from('ai_invocations').insert({
      function_name: 'generate-memorial-insights',
      user_id: pet.user_id, pet_id: pet.id,
      provider: 'anthropic', model_used: phrased.model ?? MODEL_OPUS,
      tokens_in: phrased.usage.input_tokens, tokens_out: phrased.usage.output_tokens,
      latency_ms: 0, status: 'success',
      payload: { layer: 8, subcategory: 'memorial_anniversary', years_since: yearsSince },
    }).then(() => {}, () => {});
  }

  return { created: ins.id, years_since: yearsSince };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return jsonResp({ error: 'method not allowed' }, 405);

  const t0 = Date.now();
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const petIdInput = body.pet_id;
    const mode = body.mode; // 'memorial' | 'anniversary' | undefined

    // CASO 1: pet_id + mode='memorial' — disparado pelo trigger de óbito
    if (petIdInput && mode === 'memorial') {
      const { data: pet } = await sb.from('pets')
        .select('id, user_id, name, species, breed, deceased_at')
        .eq('id', petIdInput).maybeSingle();
      if (!pet || !pet.deceased_at) return jsonResp({ success: false, error: 'pet_not_deceased' });
      const r = await processMemorialMode(sb, pet);
      return jsonResp({ success: true, mode: 'memorial', ...r, elapsed_ms: Date.now() - t0 });
    }

    // CASO 2: pet_id + mode='anniversary' — chamada manual ou debug
    if (petIdInput && mode === 'anniversary') {
      const { data: pet } = await sb.from('pets')
        .select('id, user_id, name, species, breed, deceased_at')
        .eq('id', petIdInput).maybeSingle();
      if (!pet) return jsonResp({ success: false, error: 'pet_not_found' });
      const r = await processMemorialAnniversary(sb, pet);
      return jsonResp({ success: true, mode: 'anniversary', ...r, elapsed_ms: Date.now() - t0 });
    }

    // CASO 3: scan periódico de aniversários (CRON diário)
    const { data: deceasedPets } = await sb.from('pets')
      .select('id, user_id, name, species, breed, deceased_at')
      .not('deceased_at', 'is', null);

    let anniversariesCreated = 0;
    const skips = {};
    for (const pet of deceasedPets ?? []) {
      try {
        const r = await processMemorialAnniversary(sb, pet);
        if (r.created) anniversariesCreated++;
        else if (r.skipped) skips[r.skipped] = (skips[r.skipped] ?? 0) + 1;
      } catch (err) {
        console.error('[generate-memorial-insights] pet failed:', pet.id, err);
      }
    }

    const elapsed = Date.now() - t0;
    sb.from('edge_function_diag_logs').insert({
      function_name: 'generate-memorial-insights',
      level: 'info', message: 'cron_scan_finished',
      payload: {
        deceased_pets_scanned: (deceasedPets ?? []).length,
        anniversaries_created: anniversariesCreated,
        skips, elapsed_ms: elapsed,
      },
    }).then(() => {}, () => {});

    return jsonResp({
      success: true, mode: 'cron_scan',
      deceased_pets_scanned: (deceasedPets ?? []).length,
      anniversaries_created: anniversariesCreated,
      skips, elapsed_ms: elapsed,
    });
  } catch (err) {
    console.error('[generate-memorial-insights] error:', err);
    return jsonResp({ success: false, error: 'internal_error', message: String(err).slice(0, 500) }, 500);
  }
});
