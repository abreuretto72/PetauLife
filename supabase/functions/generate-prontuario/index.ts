/**
 * generate-prontuario
 *
 * Generates a structured pet medical record (prontuário) using Claude.
 * Reads diary_entries, vaccines, medications, exams, allergies, and
 * consultations for the given pet, then produces a Prontuario JSON object
 * that is stored in the prontuario_cache table.
 *
 * Called by: hooks/useProntuario.ts → supabase.functions.invoke(...)
 * Auth: Bearer JWT required
 * Body: { pet_id: string, language?: string }
 * Response: { prontuario: Prontuario, cached: boolean }
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getAIConfig } from "../_shared/ai-config.ts";
import { validateAuth } from "../_shared/validate-auth.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CACHE_TTL_HOURS = 24;

const LANG_NAMES: Record<string, string> = {
  "pt-BR": "Brazilian Portuguese",
  pt: "Brazilian Portuguese",
  en: "English",
  "en-US": "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese (Simplified)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function isExpired(generatedAt: string): boolean {
  const generated = new Date(generatedAt).getTime();
  const now = Date.now();
  return now - generated > CACHE_TTL_HOURS * 60 * 60 * 1000;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const authResult = await validateAuth(req, CORS_HEADERS);
    if (authResult instanceof Response) return authResult;
    const { userId } = authResult;

    if (!ANTHROPIC_API_KEY) {
      console.error("[generate-prontuario] ANTHROPIC_API_KEY not configured");
      return json({ error: "ANTHROPIC_API_KEY not configured" }, 500);
    }

    const body = await req.json();
    const { pet_id, language = "pt-BR", force_refresh = false } = body as {
      pet_id: string;
      language?: string;
      force_refresh?: boolean;
    };

    if (!pet_id) return json({ error: "pet_id is required" }, 400);

    console.log(
      "[generate-prontuario] START | pet_id:",
      pet_id.slice(-8),
      "user:",
      userId.slice(-8),
      "lang:",
      language,
      "force:",
      force_refresh,
    );

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Check cache ──────────────────────────────────────────────────────────
    console.log("[generate-prontuario] checking cache...");
    if (!force_refresh) {
      const { data: cached } = await sb
        .from("prontuario_cache")
        .select("data, generated_at, emergency_token, is_stale")
        .eq("pet_id", pet_id)
        .eq("is_active", true)
        .maybeSingle();

      if (
        cached &&
        !cached.is_stale &&
        !isExpired(cached.generated_at)
      ) {
        console.log("[generate-prontuario] cache hit — returning cached data");
        return json({
          prontuario: { ...cached.data, emergency_token: cached.emergency_token },
          cached: true,
        });
      }
    }

    // ── Fetch pet data ───────────────────────────────────────────────────────
    const [petRes, vaccinesRes, medsRes, examsRes, allergiesRes, consRes, diaryRes] =
      await Promise.all([
        sb.from("pets").select("*").eq("id", pet_id).single(),
        sb
          .from("vaccines")
          .select("*")
          .eq("pet_id", pet_id)
          .eq("is_active", true)
          .order("next_due_date", { ascending: true }),
        sb
          .from("medications")
          .select("*")
          .eq("pet_id", pet_id)
          .eq("is_active", true)
          .order("start_date", { ascending: false }),
        sb
          .from("exams")
          .select("*")
          .eq("pet_id", pet_id)
          .eq("is_active", true)
          .order("date", { ascending: false })
          .limit(10),
        sb
          .from("allergies")
          .select("*")
          .eq("pet_id", pet_id)
          .eq("is_active", true),
        sb
          .from("consultations")
          .select("*")
          .eq("pet_id", pet_id)
          .eq("is_active", true)
          .order("date", { ascending: false })
          .limit(5),
        sb
          .from("diary_entries")
          .select(
            "id, content, entry_date, classifications, mood_id, is_special",
          )
          .eq("pet_id", pet_id)
          .eq("is_active", true)
          .order("entry_date", { ascending: false })
          .limit(30),
      ]);

    console.log("[generate-prontuario] DB queries done | petErr:", petRes.error?.message ?? "none", "| vaccinesErr:", vaccinesRes.error?.message ?? "none", "| medsErr:", medsRes.error?.message ?? "none", "| examsErr:", examsRes.error?.message ?? "none", "| allergiesErr:", allergiesRes.error?.message ?? "none", "| consErr:", consRes.error?.message ?? "none", "| diaryErr:", diaryRes.error?.message ?? "none");

    if (petRes.error || !petRes.data) {
      console.error("[generate-prontuario] pet not found:", petRes.error?.message);
      return json({ error: "Pet not found: " + (petRes.error?.message ?? "no data") }, 404);
    }

    const pet = petRes.data;
    const vaccines = vaccinesRes.data ?? [];
    const medications = medsRes.data ?? [];
    const exams = examsRes.data ?? [];
    const allergies = allergiesRes.data ?? [];
    const consultations = consRes.data ?? [];
    const diaryEntries = diaryRes.data ?? [];

    console.log("[generate-prontuario] data counts | vaccines:", vaccines.length, "meds:", medications.length, "exams:", exams.length, "allergies:", allergies.length, "consultations:", consultations.length, "diary:", diaryEntries.length);

    // ── Fetch tutor name ─────────────────────────────────────────────────────
    const { data: tutorUser } = await sb
      .from("users")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle();

    // ── Resolve existing emergency token ────────────────────────────────────
    const { data: existing } = await sb
      .from("prontuario_cache")
      .select("emergency_token")
      .eq("pet_id", pet_id)
      .eq("is_active", true)
      .maybeSingle();

    // ── Build context for Claude ─────────────────────────────────────────────
    const langName = LANG_NAMES[language] ?? "Brazilian Portuguese";
    const now = new Date().toISOString().split("T")[0];

    const vaccineLines = vaccines
      .map((v) => {
        const status = v.next_due_date
          ? new Date(v.next_due_date) < new Date()
            ? "OVERDUE"
            : "current"
          : "no_next_date";
        return `- ${v.name} | batch: ${v.batch_number ?? "N/A"} | last: ${v.date_administered ?? "N/A"} | next: ${v.next_due_date ?? "N/A"} | status: ${status}`;
      })
      .join("\n");

    const medLines = medications
      .map(
        (m) =>
          `- ${m.name} | dosage: ${m.dosage ?? "N/A"} | frequency: ${m.frequency ?? "N/A"} | start: ${m.start_date ?? "N/A"} | end: ${m.end_date ?? "ongoing"}`,
      )
      .join("\n");

    const allergyLines = allergies
      .map(
        (a) =>
          `- ${a.allergen} | reaction: ${a.reaction ?? "N/A"} | severity: ${a.severity ?? "N/A"}`,
      )
      .join("\n");

    const examLines = exams
      .map(
        (e) =>
          `- ${e.name} | date: ${e.date ?? "N/A"} | result: ${e.result ?? "N/A"} | lab: ${e.laboratory ?? "N/A"}`,
      )
      .join("\n");

    const consLines = consultations
      .map(
        (c) =>
          `- ${c.date ?? "N/A"} | vet: ${c.veterinarian ?? "N/A"} | clinic: ${c.clinic ?? "N/A"} | diagnosis: ${c.diagnosis ?? "N/A"} | notes: ${c.notes ?? "N/A"}`,
      )
      .join("\n");

    const diaryLines = diaryEntries
      .slice(0, 15)
      .map((e) => `- [${e.entry_date}] ${e.content?.slice(0, 200) ?? ""}`)
      .join("\n");

    // Count moods from diary
    const moodCounts: Record<string, number> = {};
    diaryEntries.forEach((e) => {
      if (e.mood_id) moodCounts[e.mood_id] = (moodCounts[e.mood_id] ?? 0) + 1;
    });
    const dominantMood =
      Object.entries(moodCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

    // Calculate pet age label
    const ageMonths = pet.estimated_age_months ?? 0;
    const ageLabel =
      ageMonths >= 12
        ? `${Math.floor(ageMonths / 12)} year${Math.floor(ageMonths / 12) !== 1 ? "s" : ""}`
        : `${ageMonths} month${ageMonths !== 1 ? "s" : ""}`;

    const PROMPT = `You are a veterinary assistant AI generating a structured medical record (prontuário) for a pet.

PET INFORMATION:
- Name: ${pet.name}
- Species: ${pet.species}
- Breed: ${pet.breed ?? "unknown"}
- Age: ${ageLabel}
- Weight: ${pet.weight_kg ? `${pet.weight_kg} kg` : "unknown"}
- Neutered/Spayed: ${pet.is_neutered ? "yes" : pet.is_neutered === false ? "no" : "unknown"}
- Microchip: ${pet.microchip ?? "not registered"}
- Tutor: ${tutorUser?.full_name ?? "unknown"}
- Today: ${now}

VACCINES:
${vaccineLines || "None recorded"}

ACTIVE MEDICATIONS:
${medLines || "None"}

ALLERGIES:
${allergyLines || "None recorded"}

RECENT EXAMS (last 10):
${examLines || "None"}

RECENT CONSULTATIONS (last 5):
${consLines || "None"}

RECENT DIARY ENTRIES (last 15):
${diaryLines || "None"}

DOMINANT MOOD (from ${diaryEntries.length} diary entries): ${dominantMood ?? "insufficient data"}

---
Generate a JSON object with EXACTLY this structure (no extra fields, no markdown, just raw JSON):
{
  "ai_summary": "<2-3 sentence summary of pet's current health status in simple language for the tutor>",
  "ai_summary_vet": "<2-3 sentence clinical summary appropriate for a veterinarian, using clinical terminology>",
  "alerts": [
    {
      "type": "critical|warning|info",
      "message": "<alert message>",
      "action": "<recommended action>"
    }
  ],
  "vaccines_status": "current|partial|overdue|none",
  "chronic_conditions": ["<condition1>", "<condition2>"],
  "usual_vet": "<name of most frequently mentioned veterinarian or null>",
  "weight_trend": "stable|gaining|losing|unknown",
  "last_exam_date": "<ISO date of most recent exam or null>",
  "last_consultation_date": "<ISO date of most recent consultation or null>"
}

Rules:
- alerts: max 3 items; only include if actionable and relevant
- vaccines_status: "current" if all up-to-date, "partial" if some overdue, "overdue" if all/most overdue, "none" if no vaccines
- chronic_conditions: conditions mentioned repeatedly across diary/consultations; empty array if none
- Respond in ${langName}. All string values in the JSON must be in ${langName}.
- Return ONLY raw JSON, no explanation, no code fences.`;

    // ── Call Claude ──────────────────────────────────────────────────────────
    const aiConfig = await getAIConfig(sb);
    console.log("[generate-prontuario] calling Claude | model:", aiConfig.model_insights, "| anthropic_version:", aiConfig.anthropic_version);

    const claudeResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY!,
        "anthropic-version": aiConfig.anthropic_version,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: aiConfig.model_insights,
        max_tokens: 1024,
        messages: [{ role: "user", content: PROMPT }],
      }),
    });

    console.log("[generate-prontuario] Claude HTTP status:", claudeResp.status);
    if (!claudeResp.ok) {
      const errText = await claudeResp.text();
      console.error("[generate-prontuario] Claude error status:", claudeResp.status, "body:", errText.slice(0, 500));
      return json({ error: "AI generation failed: HTTP " + claudeResp.status + " — " + errText.slice(0, 200) }, 502);
    }

    const claudeData = await claudeResp.json();
    const rawText = claudeData.content?.[0]?.text?.trim() ?? "{}";
    console.log("[generate-prontuario] Claude response tokens:", claudeData.usage?.output_tokens, "| raw preview:", rawText.slice(0, 100));

    let aiData: Record<string, unknown> = {};
    try {
      aiData = JSON.parse(rawText);
      console.log("[generate-prontuario] JSON parsed OK | keys:", Object.keys(aiData).join(", "));
    } catch {
      console.error("[generate-prontuario] JSON parse failed:", rawText.slice(0, 300));
      aiData = { ai_summary: rawText.slice(0, 500), alerts: [], vaccines_status: "unknown", chronic_conditions: [] };
    }

    // ── Build full Prontuario data object ───────────────────────────────────
    const prontuarioData = {
      pet_id,
      age_label: ageLabel,
      weight_kg: pet.weight_kg ?? null,
      is_neutered: pet.is_neutered ?? null,
      microchip: pet.microchip ?? null,
      tutor_name: tutorUser?.full_name ?? null,
      ai_summary: (aiData.ai_summary as string) ?? null,
      ai_summary_vet: (aiData.ai_summary_vet as string) ?? null,
      alerts: (aiData.alerts as unknown[]) ?? [],
      vaccines_status: (aiData.vaccines_status as string) ?? "none",
      vaccines: vaccines.map((v) => ({
        id: v.id,
        name: v.name,
        date_administered: v.date_administered,
        next_due_date: v.next_due_date,
        batch_number: v.batch_number,
        veterinarian: v.veterinarian,
        is_overdue: v.next_due_date
          ? new Date(v.next_due_date) < new Date()
          : false,
      })),
      active_medications: medications
        .filter((m) => !m.end_date || new Date(m.end_date) >= new Date())
        .map((m) => ({
          id: m.id,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          start_date: m.start_date,
          end_date: m.end_date,
        })),
      allergies: allergies.map((a) => ({
        id: a.id,
        allergen: a.allergen,
        reaction: a.reaction,
        severity: a.severity,
      })),
      chronic_conditions: (aiData.chronic_conditions as string[]) ?? [],
      consultations: consultations.map((c) => ({
        id: c.id,
        date: c.date,
        veterinarian: c.veterinarian,
        clinic: c.clinic,
        diagnosis: c.diagnosis,
        notes: c.notes,
        consult_type: c.consult_type,
      })),
      last_consultation: consultations[0] ?? null,
      last_exam_date: (aiData.last_exam_date as string) ?? null,
      last_consultation_date: (aiData.last_consultation_date as string) ?? null,
      total_entries: diaryEntries.length,
      period_label: `${now}`,
      weight_history: [],
      mood_distribution: moodCounts,
      dominant_mood: dominantMood,
      usual_vet: (aiData.usual_vet as string) ?? null,
      weight_trend: (aiData.weight_trend as string) ?? "unknown",
      generated_at: new Date().toISOString(),
      is_stale: false,
    };

    // ── Save cache (INSERT first time, UPDATE on regeneration) ───────────────
    // NOTE: cannot use .upsert({ onConflict: "pet_id" }) here because the
    // unique index on pet_id is a partial index (WHERE is_active = true).
    // PostgreSQL's ON CONFLICT clause cannot target partial indexes without
    // specifying the WHERE predicate, which PostgREST/Supabase client does
    // not support. Using explicit INSERT vs UPDATE avoids this issue and also
    // correctly preserves the existing emergency_token on re-generation.
    let saveError: { message?: string; details?: string } | null = null;

    if (existing) {
      // Row exists — UPDATE only data fields, emergency_token is untouched
      const { error } = await sb
        .from("prontuario_cache")
        .update({
          user_id: userId,
          data: prontuarioData,
          generated_at: new Date().toISOString(),
          is_stale: false,
          is_active: true,
        })
        .eq("pet_id", pet_id)
        .eq("is_active", true);
      saveError = error;
    } else {
      // First time — INSERT, DB DEFAULT generates emergency_token automatically
      const { error } = await sb
        .from("prontuario_cache")
        .insert({
          pet_id,
          user_id: userId,
          data: prontuarioData,
          generated_at: new Date().toISOString(),
          is_stale: false,
          is_active: true,
        });
      saveError = error;
    }

    if (saveError) {
      console.error("[generate-prontuario] save error:", saveError.message, saveError.details);
    } else {
      console.log("[generate-prontuario] save OK");
    }

    // Fetch the saved token
    const { data: saved } = await sb
      .from("prontuario_cache")
      .select("emergency_token")
      .eq("pet_id", pet_id)
      .eq("is_active", true)
      .maybeSingle();

    console.log("[generate-prontuario] generated and cached for pet:", pet_id.slice(-8));
    return json({
      prontuario: {
        ...prontuarioData,
        emergency_token: saved?.emergency_token ?? existing?.emergency_token ?? "",
      },
      cached: false,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : "";
    console.error("[generate-prontuario] UNEXPECTED ERROR:", msg, "\nStack:", stack);
    return json({ error: "Internal server error: " + msg }, 500);
  }
});
