/**
 * compare-photo-analysis — EF TEMPORÁRIA para auditoria de qualidade.
 *
 * Dispara DUAS chamadas paralelas à Anthropic sobre a MESMA foto:
 *   A) SUPERFICIAL — Opus 4.7 + prompt curto (isolar variável PROMPT) + prompt curto + max_tokens 2500 (estilo v44)
 *   B) ELITE       — Opus 4.7 + prompt profundo + max_tokens 8000 (estilo v46)
 *
 * Retorna { superficial, elite, metrics } para comparação direta.
 *
 * Body: { photo_url: string, species: "dog"|"cat" }
 *   photo_url pode ser URL pública (Supabase storage) ou data URL base64
 *
 * Depois da auditoria, apagar a EF (comando no final do arquivo).
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Prompt A: SUPERFICIAL (v44-style) ────────────────────────────────────────
const PROMPT_SUPERFICIAL = `You are a veterinary AI for a pet care app.
Analyze this pet photo and return a JSON with basic info.
Keep it short — 2-3 sentences per prose field.

Return ONLY this JSON structure, NO markdown, NO code fences:

{
  "breed": "string",
  "size": "small|medium|large",
  "age_category": "puppy|young|adult|senior",
  "body_condition": "underweight|ideal|overweight|obese",
  "mood": "happy|calm|anxious|sad|playful|alert",
  "coat": "string",
  "observations": ["short string"],
  "alerts": [{ "message": "string", "severity": "info|attention|concern" }],
  "description": "2-3 sentence summary"
}

Never diagnose. Use hedged language.`;

// ── Prompt B: ELITE (v46-style) ──────────────────────────────────────────────
const PROMPT_ELITE = `You are a board-certified veterinary AI running on Claude Opus 4.7 for high-end pet parents ("Elite"). Apply specialist-level reasoning: link every visual cue to pathophysiology, breed predisposition, age-stage, welfare framework.

FRAMEWORKS: BCS 1-9 WSAVA, MCS, UNESP-Botucatu pain, skin lesion nomenclature (primary/secondary), AVDC periodontal grades, Bristol fecal 1-7, ASPCA toxicology, Five Domains welfare, breed-specific genetics (BOAS, hip dysplasia, HCM, PKD, etc).

Return ONLY this JSON. No markdown, no code fences. Rich values, not type annotations:

{
  "identification": {
    "breed": { "primary": "string", "confidence": 0.0, "is_mixed": false },
    "size": "small|medium|large",
    "age_category": "puppy|young|adult|senior",
    "estimated_age_months": 36,
    "estimated_weight_kg": 10.5,
    "coat": { "color": "string", "pattern": "string", "quality": "string", "length": "short|medium|long" }
  },
  "health": {
    "body_condition_score": 5,
    "body_condition": "ideal",
    "muscle_condition_score": "normal|mild_loss|moderate_loss|severe_loss",
    "skin_coat": [{ "observation": "string", "severity": "normal|attention|concern", "rationale": "visual cue observed", "clinical_significance": "pathophysiology link" }],
    "eyes": [{ "observation": "string", "severity": "string", "rationale": "string", "clinical_significance": "string" }],
    "ears": [{ "observation": "string", "severity": "string", "rationale": "string", "clinical_significance": "string" }],
    "mouth_teeth": [{ "observation": "string", "severity": "string", "periodontal_grade": "0-4", "rationale": "string", "clinical_significance": "string" }],
    "posture_body": [{ "observation": "string", "severity": "string", "rationale": "string", "clinical_significance": "string" }]
  },
  "mood": {
    "primary": "string",
    "confidence": 0.0,
    "signals": ["string"],
    "body_language_reading": "Extended prose on ears, tail, eyes, stance.",
    "stress_indicators": ["string"],
    "arousal_level": "low|moderate|high",
    "welfare_flags": ["Five Domains concerns"]
  },
  "alerts": [{
    "message": "string",
    "severity": "info|attention|concern",
    "category": "health|safety|care|toxicity|behavior",
    "why_it_matters": "pathophysiology reasoning 1-2 sentences",
    "what_to_monitor": ["specific sign"],
    "red_flags": ["emergency trigger"],
    "time_frame": "monitor 24h | see vet within 1 week | urgent"
  }],
  "description": "5-8 sentences of specialist-grade clinical prose integrating BCS/MCS, pain signals, dermatology, dental grade, posture, coat, welfare reading.",
  "clinical_reasoning": "Chain-of-inference 3-5 sentences: I observe X, combined with Y and breed Z-predisposition, consistent with H because...",
  "differential_considerations": [{ "hypothesis": "string", "likelihood": "low|moderate|high", "distinguishing_features": "what would confirm/rule out", "recommended_test": "what a vet would order" }],
  "breed_specific_context": "Genetic predispositions and conformational concerns of this breed that touch the visible findings.",
  "age_specific_context": "How age-stage physiology modulates interpretation.",
  "follow_up_questions": ["Specific question that would refine analysis"],
  "recommendations": {
    "immediate": ["concrete 24h action"],
    "short_term": ["2-4 week actions"],
    "preventive": ["long-horizon care"]
  },
  "prognostic_outlook": "1-2 sentences on expected trajectory.",
  "sources": ["WSAVA BCS 2021", "..."]
}

Hedged language only. Never diagnose. Populate EVERY field — empty means wasted capacity.`;

interface AnthropicCall {
  model: string;
  maxTokens: number;
  systemPrompt: string;
  messages: unknown[];
}

async function callAnthropic(opts: AnthropicCall): Promise<{ text: string; ms: number; usage: unknown; stop_reason: string }> {
  const t0 = Date.now();
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens,
      system: [{ type: "text", text: opts.systemPrompt }],
      messages: opts.messages,
    }),
  });
  const ms = Date.now() - t0;
  const body = await resp.json();
  if (!resp.ok) {
    throw new Error(`Anthropic ${resp.status} [${opts.model}]: ${JSON.stringify(body).slice(0, 300)}`);
  }
  const textContent = body.content?.find((c: { type: string }) => c.type === "text");
  return {
    text: textContent?.text ?? "",
    ms,
    usage: body.usage ?? {},
    stop_reason: body.stop_reason ?? "unknown",
  };
}

function parseJson(raw: string): unknown {
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  try { return JSON.parse(text); } catch { return { _parse_error: true, _raw: text.slice(0, 2000) }; }
}

async function toBase64(photoUrl: string): Promise<{ base64: string; mediaType: string }> {
  if (photoUrl.startsWith("data:")) {
    const [prefix, b64] = photoUrl.split(",");
    const mediaType = prefix.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
    return { base64: b64, mediaType };
  }
  const resp = await fetch(photoUrl);
  if (!resp.ok) throw new Error(`fetch photo failed: ${resp.status}`);
  const mediaType = resp.headers.get("content-type") ?? "image/jpeg";
  const buf = new Uint8Array(await resp.arrayBuffer());
  // Base64 encode
  let binary = "";
  for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
  const base64 = btoa(binary);
  return { base64, mediaType: mediaType.startsWith("image/") ? mediaType : "image/jpeg" };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY missing" }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
  try {
    const { photo_url, species = "dog" } = await req.json();
    if (!photo_url) {
      return new Response(JSON.stringify({ error: "photo_url required" }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const { base64, mediaType } = await toBase64(photo_url);
    const speciesWord = species === "cat" ? "cat" : "dog";
    const userTextSuperficial = `Perform a quick clinical assessment of this photo for a ${speciesWord}. Write in pt-BR.`;
    const userTextElite = `Perform a specialist-grade clinical veterinary assessment of this photo for a ${speciesWord}. Deliver full depth: clinical_reasoning, differential_considerations, breed_specific_context, age_specific_context, follow_up_questions, recommendations, prognostic_outlook. Each health observation must have rationale + clinical_significance. Each alert must have why_it_matters + what_to_monitor + red_flags + time_frame. Do not truncate. Write in pt-BR.`;

    const imageBlock = { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } };

    const [superficialRes, eliteRes] = await Promise.allSettled([
      callAnthropic({
        model: "claude-opus-4-7",
        maxTokens: 2500,
        systemPrompt: PROMPT_SUPERFICIAL,
        messages: [{ role: "user", content: [imageBlock, { type: "text", text: userTextSuperficial }] }],
      }),
      callAnthropic({
        model: "claude-opus-4-7",
        maxTokens: 8000,
        systemPrompt: PROMPT_ELITE,
        messages: [{ role: "user", content: [imageBlock, { type: "text", text: userTextElite }] }],
      }),
    ]);

    const superficial = superficialRes.status === "fulfilled"
      ? { ok: true, json: parseJson(superficialRes.value.text), ms: superficialRes.value.ms, usage: superficialRes.value.usage, stop_reason: superficialRes.value.stop_reason, text_chars: superficialRes.value.text.length }
      : { ok: false, error: String(superficialRes.reason) };
    const elite = eliteRes.status === "fulfilled"
      ? { ok: true, json: parseJson(eliteRes.value.text), ms: eliteRes.value.ms, usage: eliteRes.value.usage, stop_reason: eliteRes.value.stop_reason, text_chars: eliteRes.value.text.length }
      : { ok: false, error: String(eliteRes.reason) };

    return new Response(JSON.stringify({ superficial, elite }, null, 2), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});

// DEPOIS DA AUDITORIA, remover: supabase functions delete compare-photo-analysis --project-ref peqpkzituzpwukzusgcq
