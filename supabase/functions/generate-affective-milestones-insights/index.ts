/**
 * generate-affective-milestones-insights v1 — Camada 8a
 *
 * Marcos afetivos positivos. Detecta datas que merecem celebração e
 * convida o tutor a registrar/lembrar. NUNCA alarmista, NUNCA urgente.
 *
 * Subcategorias:
 *   - affective_milestones (subtipos via evidence.milestone_type):
 *     - birthday              (aniversário do pet)
 *     - adoption_anniversary  (aniversário de adoção registrado em pet_lifecycle_events)
 *     - first_year_with_us    (1 ano que o pet entrou no app — único, criado 1x)
 *     - routine_streak        (15/30/60/90/180/365 dias seguidos com diário)
 *
 * Tom: Clarice Lispector contemplativa, terna, sem cartoon. Português
 * brasileiro. severity SEMPRE 'info' (celebração não é urgente).
 *
 * Push: APENAS se layer8_enabled=true (default OFF — opt-in explícito).
 *
 * CRON: 1x/dia 09:00 UTC (manhã, momento leve).
 * Cooldown: 365d via scope_key (aniversário acontece 1x/ano).
 *
 * Body opcional: { pet_id?, tutor_id? }
 */

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const MODEL_SONNET = 'claude-sonnet-4-6';

const COOLDOWN_DAYS = 365;
const EXPIRES_DAYS = 14;
const MS_DAY = 86400000;

const STREAK_MILESTONES = [15, 30, 60, 90, 180, 365];

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

async function callAnthropic(model, sys, usr, maxTokens = 350) {
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
    console.warn('[generate-affective-milestones-insights] LLM HTTP', r.status, (await r.text()).slice(0, 200));
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
    p_user_id: userId, p_pet_id: petId, p_category: 'comportamento', p_subcategory: sub,
  });
  return data === true;
}

// ── Detectores ──────────────────────────────────────────────────────────────

function detectBirthday(pet) {
  if (!pet.birth_date) return null;
  const today = new Date();
  const tom = ymdParts(today.toISOString());
  const bd = ymdParts(pet.birth_date);

  // Hoje?
  if (tom.m === bd.m && tom.d === bd.d) {
    const ageYears = tom.y - bd.y;
    return {
      milestone_type: 'birthday',
      pet_age_years: ageYears,
      birth_date: pet.birth_date,
      when: 'today',
      scope_key: `birthday:${pet.id.slice(-8)}:${tom.y}`,
    };
  }
  // +7 dias (aviso pra preparar)
  const in7 = new Date(today.getTime() + 7 * MS_DAY);
  const p7 = ymdParts(in7.toISOString());
  if (p7.m === bd.m && p7.d === bd.d) {
    const ageYears = p7.y - bd.y;
    return {
      milestone_type: 'birthday',
      pet_age_years: ageYears,
      birth_date: pet.birth_date,
      when: 'in_7d',
      scope_key: `birthday7:${pet.id.slice(-8)}:${p7.y}`,
    };
  }
  return null;
}

async function detectAdoptionAnniversary(sb, petId) {
  const { data: events } = await sb
    .from('pet_lifecycle_events')
    .select('event_date')
    .eq('pet_id', petId)
    .eq('event_type', 'adoption')
    .eq('is_active', true)
    .order('event_date', { ascending: true })
    .limit(1);

  const ev = (events ?? [])[0];
  if (!ev) return null;

  const today = new Date();
  const tom = ymdParts(today.toISOString());
  const ad = ymdParts(ev.event_date);
  if (tom.y === ad.y) return null; // mesmo ano da adoção, não conta

  if (tom.m === ad.m && tom.d === ad.d) {
    const yearsTogether = tom.y - ad.y;
    return {
      milestone_type: 'adoption_anniversary',
      adoption_date: ev.event_date,
      years_together: yearsTogether,
      scope_key: `adoption:${petId.slice(-8)}:${tom.y}`,
    };
  }
  return null;
}

function detectFirstYearWithUs(pet) {
  if (!pet.created_at) return null;
  const today = new Date();
  const created = new Date(pet.created_at);
  const days = Math.floor((today.getTime() - created.getTime()) / MS_DAY);
  if (days === 365) {
    return {
      milestone_type: 'first_year_with_us',
      created_at: pet.created_at,
      scope_key: `firstyear:${pet.id.slice(-8)}`,
    };
  }
  return null;
}

async function detectRoutineStreak(sb, petId) {
  // Pega últimas 400 entradas, computa streak consecutivo terminando ontem ou hoje
  const since = new Date(Date.now() - 400 * MS_DAY).toISOString().slice(0, 10);
  const { data: entries } = await sb
    .from('diary_entries')
    .select('entry_date')
    .eq('pet_id', petId).eq('is_active', true)
    .gte('entry_date', since)
    .order('entry_date', { ascending: false });

  if (!entries || entries.length === 0) return null;

  const dates = new Set(entries.map((e) => e.entry_date));
  const today = todayIso();
  // Aceita streak terminando hoje OU ontem (margem)
  let cursor = new Date();
  if (!dates.has(today)) cursor = new Date(Date.now() - MS_DAY);

  let streak = 0;
  while (dates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor = new Date(cursor.getTime() - MS_DAY);
  }

  // Só dispara em milestone exato (15, 30, 60, 90, 180, 365)
  if (!STREAK_MILESTONES.includes(streak)) return null;

  return {
    milestone_type: 'routine_streak',
    streak_days: streak,
    scope_key: `streak:${petId.slice(-8)}:${streak}`,
  };
}

// ── Fraseado contemplativo (Sonnet 4.6) ─────────────────────────────────────

async function phraseMilestone(petName, payload) {
  const sys = `Voce escreve um lembrete afetuoso e contemplativo para o tutor sobre um marco do pet. Tom: registro Elite, inspiracao Clarice Lispector em "Lacos de Familia" — terna, sensorial, proxima, sem derrame emocional.

REGRAS CRITICAS:
- 3a pessoa (sobre o pet, nao na voz dele).
- SEM exclamacao, SEM onomatopeia, SEM vocativo fofinho ("humano", "amigao"), SEM assinatura.
- SEM gerar acoes de risco (nao sugerir festa com bolo de chocolate, etc).
- 1-3 frases curtas. Nem solene, nem cartoonesco.
- Pt-BR.
- Resposta APENAS JSON valido: { "title": "<ate 60 chars>", "body": "<ate 200 chars>" }`;

  const usr = `Pet: ${petName}\nMarco: ${JSON.stringify(payload)}`;
  const result = await callAnthropic(MODEL_SONNET, sys, usr, 350);
  if (!result) return { title: '', body: '' };
  return { title: result.title ?? '', body: result.body ?? '' };
}

function defaultTitle(petName, payload) {
  const t = payload.milestone_type;
  if (t === 'birthday') {
    if (payload.when === 'today') return `Aniversário hoje: ${payload.pet_age_years} anos do ${petName}`;
    return `Aniversário do ${petName} em 7 dias`;
  }
  if (t === 'adoption_anniversary') return `${payload.years_together} ano(s) juntos com ${petName}`;
  if (t === 'first_year_with_us') return `Primeiro ano do ${petName} no diário`;
  if (t === 'routine_streak') return `${payload.streak_days} dias seguidos no diário do ${petName}`;
  return 'Marco afetivo';
}

function defaultBody(petName, payload) {
  const t = payload.milestone_type;
  if (t === 'birthday') {
    if (payload.when === 'today') return `Hoje completa ${payload.pet_age_years} anos. Vale registrar uma foto recente para a linha do tempo.`;
    return `Em 7 dias o ${petName} completa ${payload.pet_age_years} anos. Tempo para preparar.`;
  }
  if (t === 'adoption_anniversary') {
    return `Hoje marca ${payload.years_together} ano(s) desde a chegada do ${petName} em casa.`;
  }
  if (t === 'first_year_with_us') {
    return `Há um ano o ${petName} entrou no diário. Vale folhear o histórico.`;
  }
  if (t === 'routine_streak') {
    return `${payload.streak_days} dias consecutivos com registros sobre o ${petName}.`;
  }
  return '';
}

// ── Pipeline por pet ────────────────────────────────────────────────────────

async function processPet(sb, pet, settings) {
  const created = [];

  const candidates = [];
  const bd = detectBirthday(pet); if (bd) candidates.push(bd);
  const ad = await detectAdoptionAnniversary(sb, pet.id); if (ad) candidates.push(ad);
  const fy = detectFirstYearWithUs(pet); if (fy) candidates.push(fy);
  const st = await detectRoutineStreak(sb, pet.id); if (st) candidates.push(st);

  if (candidates.length === 0) return [];

  // Toggle layer8 — DEFAULT OFF (opt-in)
  if (settings?.layer8_enabled !== true) {
    return [];
  }
  const subToggles = (settings?.layer8_categories ?? {});

  for (const cand of candidates) {
    const sub = 'affective_milestones';
    const milestoneType = cand.milestone_type;

    // Toggle por subtipo dentro de layer8_categories
    if (subToggles[milestoneType] === false) continue;
    if (subToggles[sub] === false) continue;

    // Silenced?
    if (await isSilenced(sb, pet.user_id, pet.id, sub)) continue;

    // Cooldown 365d
    if (await alreadyExists(sb, pet.id, cand.scope_key)) continue;

    // Fraseado
    let title, body;
    const phrased = await phraseMilestone(pet.name, cand);
    title = phrased.title || defaultTitle(pet.name, cand);
    body = phrased.body || defaultBody(pet.name, cand);

    const expiresAt = new Date(Date.now() + EXPIRES_DAYS * MS_DAY).toISOString();

    const { data: ins, error } = await sb.from('pet_insights').insert({
      pet_id: pet.id,
      user_id: pet.user_id,
      layer: 8,
      type: 'suggestion',
      severity: 'info',
      category: 'comportamento',
      subcategory: sub,
      title, body,
      evidence: { ...cand, type: sub },
      cta_type: 'log_diary',
      cta_payload: { pet_id: pet.id, prefill_topic: milestoneType },
      action_route: `/pet/${pet.id}/diary/new`,
      generated_by: 'generate-affective-milestones-insights',
      model_used: MODEL_SONNET,
      status: 'pending',
      is_active: true,
      expires_at: expiresAt,
    }).select('id').single();

    if (error) {
      console.warn('[generate-affective-milestones-insights] insert failed:', milestoneType, error.message);
      continue;
    }

    created.push({ id: ins.id, milestone_type: milestoneType });

    // Push só pra layer8_enabled=true. Severity info, mas tutor optou-in explicito.
    sb.from('notifications_queue').insert({
      user_id: pet.user_id,
      pet_id: pet.id,
      type: 'ai_insight',
      title,
      body: body.slice(0, 140),
      data: { insight_id: ins.id, subcategory: sub, milestone_type: milestoneType, layer: 8, pet_id: pet.id },
      scheduled_for: new Date().toISOString(),
      is_active: true,
    }).then(() => {}, () => {});

    // Também registra em pet_lifecycle_events (exceto routine_streak — não é evento de vida)
    if (milestoneType === 'birthday' || milestoneType === 'first_year_anniversary' || milestoneType === 'first_year_with_us') {
      const eventType = milestoneType === 'birthday' ? 'birthday' : 'first_year_anniversary';
      sb.from('pet_lifecycle_events').insert({
        pet_id: pet.id,
        user_id: pet.user_id,
        event_type: eventType,
        event_date: todayIso(),
        notes: `Auto-detectado pela camada 8 (${milestoneType})`,
        metadata: { source: 'generate-affective-milestones-insights', insight_id: ins.id },
        is_active: true,
      }).then(() => {}, () => {});
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
      .select('id, user_id, name, species, breed, birth_date, created_at')
      .eq('is_active', true)
      .is('deceased_at', null);

    if (petIdInput) petsQuery = petsQuery.eq('id', petIdInput);
    if (tutorIdInput) petsQuery = petsQuery.eq('user_id', tutorIdInput);

    const { data: pets } = await petsQuery;
    if (!pets || pets.length === 0) {
      return jsonResp({ success: true, pets_processed: 0, insights_created: 0, by_milestone: {} });
    }

    const userIds = Array.from(new Set(pets.map((p) => p.user_id)));
    const { data: settingsList } = await sb
      .from('pet_proactive_settings')
      .select('user_id, layer8_enabled, layer8_categories')
      .in('user_id', userIds);
    const settingsMap = new Map((settingsList ?? []).map((s) => [s.user_id, s]));

    let allCreated = 0;
    const byMilestone = {};
    let processed = 0;

    for (const pet of pets) {
      const settings = settingsMap.get(pet.user_id);
      try {
        const created = await processPet(sb, pet, settings);
        for (const c of created) {
          allCreated++;
          byMilestone[c.milestone_type] = (byMilestone[c.milestone_type] ?? 0) + 1;
        }
        processed++;
      } catch (err) {
        console.error('[generate-affective-milestones-insights] pet failed:', pet.id, err);
      }
    }

    const elapsed = Date.now() - t0;
    sb.from('edge_function_diag_logs').insert({
      function_name: 'generate-affective-milestones-insights',
      level: 'info',
      message: 'finished',
      payload: {
        pets_processed: processed,
        insights_created: allCreated,
        by_milestone: byMilestone,
        elapsed_ms: elapsed,
      },
    }).then(() => {}, () => {});

    console.log('[generate-affective-milestones-insights] done | pets:', processed, '| insights:', allCreated, '| elapsed:', elapsed, 'ms');
    return jsonResp({
      success: true,
      pets_processed: processed,
      insights_created: allCreated,
      by_milestone: byMilestone,
      elapsed_ms: elapsed,
    });
  } catch (err) {
    console.error('[generate-affective-milestones-insights] error:', err);
    return jsonResp({ success: false, error: 'internal_error', message: String(err).slice(0, 500) }, 500);
  }
});
