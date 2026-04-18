/**
 * generate-cardapio
 *
 * Generates an AI-powered weekly nutrition menu for a pet using Claude.
 * Considers life stage, modalidade (so_racao / racao_natural / so_natural),
 * current food, restrictions, and supplements.
 *
 * Results are cached in nutrition_cardapio_cache (invalidated manually or by modalidade change).
 *
 * Called by: hooks/useNutricao.ts
 * Auth: Bearer JWT required
 * Body: { pet_id: string, force?: boolean, language?: string }
 * Response: { cardapio: Cardapio, cached: boolean }
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { getAIConfig } from "../_shared/ai-config.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const CACHE_TTL_HOURS = 72; // 3 days

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LANG_NAMES: Record<string, string> = {
  "pt-BR": "Brazilian Portuguese", pt: "Brazilian Portuguese",
  en: "English", "en-US": "English",
  es: "Spanish", fr: "French", de: "German",
  it: "Italian", ja: "Japanese", ko: "Korean",
  zh: "Chinese (Simplified)",
};

const WEEKDAYS_PT = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const WEEKDAYS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function isExpired(generatedAt: string): boolean {
  return Date.now() - new Date(generatedAt).getTime() > CACHE_TTL_HOURS * 3_600_000;
}

function ageMonthsFromPet(pet: Record<string, unknown>): number {
  if (pet.birth_date) {
    const birth = new Date(pet.birth_date as string);
    const now = new Date();
    return Math.max(0, (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth()));
  }
  return (pet.estimated_age_months as number | null) ?? 24;
}

function calcLifeStage(species: string, ageMonths: number, size: string | null): string {
  if (species === "dog") {
    const puppyEnd = size === "large" ? 18 : size === "medium" ? 15 : 12;
    const seniorStart = size === "large" ? 60 : size === "medium" ? 84 : 96;
    if (ageMonths < puppyEnd) return "puppy";
    if (ageMonths >= seniorStart) return "senior";
    return "adult";
  }
  if (ageMonths < 12) return "kitten";
  if (ageMonths >= 120) return "senior";
  return "adult";
}

// ── Fallback menu when Claude is unavailable ────────────────────────────────

function computeModalidadeLabel(modalidade: string, naturalPct: number, isPortuguese: boolean): string {
  if (modalidade === 'racao_natural') {
    const racaoPct = 100 - naturalPct;
    return isPortuguese
      ? `${racaoPct}% Ração + ${naturalPct}% Natural`
      : `${racaoPct}% Kibble + ${naturalPct}% Natural`;
  }
  if (modalidade === 'so_natural') return isPortuguese ? 'Só natural' : 'Natural only';
  return isPortuguese ? 'Só ração' : 'Dry kibble only';
}

function buildFallbackCardapio(
  petName: string,
  modalidade: string,
  naturalPct: number,
  weekdays: string[],
  isPortuguese: boolean,
): unknown {
  return {
    pet_name: petName,
    modalidade_label: computeModalidadeLabel(modalidade, naturalPct, isPortuguese),
    days: weekdays.map((day, i) => ({
      weekday: day,
      title: `Rotina ${day}`,
      description: "Cardápio gerado pelo sistema. Consulte um veterinário nutricionista para personalização.",
      ingredients: [],
      recipes: [],
    })),
    generated_at: new Date().toISOString(),
    is_fallback: true,
  };
}

// ── Build Claude prompt ─────────────────────────────────────────────────────

function buildPrompt(ctx: {
  petName: string;
  species: string;
  breed: string | null;
  ageMonths: number;
  lifeStage: string;
  weightKg: number | null;
  neutered: boolean;
  modalidade: string;
  naturalPct: number;
  currentFood: Record<string, unknown> | null;
  restrictions: string[];
  supplements: string[];
  language: string;
}): string {
  const lang = LANG_NAMES[ctx.language] ?? "Brazilian Portuguese";
  const modDesc: Record<string, string> = {
    so_racao: "dry kibble only",
    racao_natural: `mixed: ${ctx.naturalPct}% natural food + ${100 - ctx.naturalPct}% kibble`,
    so_natural: "natural/BARF diet only (no kibble)",
  };

  return `You are a veterinary nutrition specialist. Create a 7-day weekly meal plan for a pet.

PET PROFILE:
- Name: ${ctx.petName}
- Species: ${ctx.species}
- Breed: ${ctx.breed ?? "mixed breed"}
- Age: ${ctx.ageMonths} months (life stage: ${ctx.lifeStage})
- Weight: ${ctx.weightKg ? ctx.weightKg + " kg" : "unknown"}
- Neutered: ${ctx.neutered ? "yes" : "no"}
- Diet type: ${modDesc[ctx.modalidade] ?? ctx.modalidade}
- Current food: ${ctx.currentFood ? `${ctx.currentFood.product_name ?? "unknown"} (${ctx.currentFood.category ?? ""})` : "not specified"}
- Known restrictions/intolerances: ${ctx.restrictions.length > 0 ? ctx.restrictions.join(", ") : "none"}
- Active supplements: ${ctx.supplements.length > 0 ? ctx.supplements.join(", ") : "none"}

INSTRUCTIONS:
- Create a 7-day plan (Monday through Sunday)
- Each day has a title and description
- For natural/BARF days, include specific recipes with ingredients, steps, and storage info
- For kibble-only days, provide portion tips and enrichment ideas (lick mats, puzzle feeders, toppers)
- Respect all dietary restrictions
- Include variety across the week
- NEVER include toxic foods (chocolate, grapes, onion, garlic, xylitol, macadamia, etc.)
- Mark recipes as is_safe: true only if safe for the pet's profile
- Respond in ${lang}

Return ONLY valid JSON in this exact format (no markdown):
{
  "pet_name": "${ctx.petName}",
  "modalidade_label": "...",
  "days": [
    {
      "weekday": "...",
      "title": "...",
      "description": "...",
      "ingredients": ["item1", "item2"],
      "recipes": [
        {
          "name": "...",
          "prep_minutes": 15,
          "servings": 1,
          "portion_g": 150,
          "is_safe": true,
          "ingredients": ["100g item", "50g item"],
          "steps": ["step 1", "step 2"],
          "storage_fridge": "2 days",
          "storage_freezer": "30 days",
          "ai_tip": "..."
        }
      ]
    }
  ],
  "generated_at": "${new Date().toISOString()}"
}`;
}

// ── Main handler ──────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const anonSb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user } } = await anonSb.auth.getUser(token);
    if (!user) return json({ error: "unauthorized" }, 401);
    const userId = user.id;

    const { pet_id, force = false, language = "pt-BR" } = await req.json();
    if (!pet_id) return json({ error: "pet_id required" }, 400);

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Check cache ───────────────────────────────────────────────────────────
    if (!force) {
      const { data: cached } = await sb
        .from("nutrition_cardapio_cache")
        .select("data, generated_at, modalidade")
        .eq("pet_id", pet_id)
        .maybeSingle();

      if (cached && !isExpired(cached.generated_at)) {
        return json({ cardapio: cached.data, cached: true });
      }
    }

    // ── Gather pet data ───────────────────────────────────────────────────────
    const { data: pet } = await sb
      .from("pets")
      .select("id, name, species, breed, birth_date, estimated_age_months, weight_kg, size, neutered, user_id")
      .eq("id", pet_id)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (!pet) return json({ error: "pet not found" }, 404);

    const { data: profile } = await sb
      .from("nutrition_profiles")
      .select("modalidade, natural_pct")
      .eq("pet_id", pet_id)
      .eq("is_active", true)
      .maybeSingle();

    const { data: currentFoods } = await sb
      .from("nutrition_records")
      .select("product_name, brand, category, portion_grams, calories_kcal")
      .eq("pet_id", pet_id)
      .eq("record_type", "food")
      .eq("is_current", true)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1);

    const { data: restrictionRows } = await sb
      .from("nutrition_records")
      .select("product_name, notes")
      .eq("pet_id", pet_id)
      .in("record_type", ["restriction", "intolerance"])
      .eq("is_active", true);

    const { data: supplementRows } = await sb
      .from("nutrition_records")
      .select("product_name")
      .eq("pet_id", pet_id)
      .eq("record_type", "supplement")
      .eq("is_current", true)
      .eq("is_active", true);

    const ageMonths = ageMonthsFromPet(pet as Record<string, unknown>);
    const lifeStage = calcLifeStage(pet.species, ageMonths, pet.size);
    const modalidade = profile?.modalidade ?? "so_racao";
    const naturalPct = profile?.natural_pct ?? 0;
    const isPortuguese = language.startsWith("pt");
    const weekdays = isPortuguese ? WEEKDAYS_PT : WEEKDAYS_EN;

    // ── Call Claude ───────────────────────────────────────────────────────────
    let cardapio: unknown;
    let fallbackReason: string | null = null;

    if (!ANTHROPIC_API_KEY) {
      fallbackReason = "NO_ANTHROPIC_API_KEY";
      console.error("[generate-cardapio] FATAL: ANTHROPIC_API_KEY not set");
      cardapio = buildFallbackCardapio(pet.name, modalidade, naturalPct, weekdays, isPortuguese);
    } else {
      try {
        console.log("[generate-cardapio] calling getAIConfig...");
        const aiConfig = await getAIConfig(sb);
        console.log("[generate-cardapio] model:", aiConfig.model_insights, "| version:", aiConfig.anthropic_version);

        const prompt = buildPrompt({
          petName: pet.name,
          species: pet.species,
          breed: pet.breed,
          ageMonths,
          lifeStage,
          weightKg: pet.weight_kg,
          neutered: pet.neutered ?? false,
          modalidade,
          naturalPct,
          currentFood: currentFoods?.[0] ?? null,
          restrictions: (restrictionRows ?? []).map(
            (r) => r.product_name ?? r.notes ?? "unknown",
          ),
          supplements: (supplementRows ?? []).map((s) => s.product_name ?? "supplement"),
          language,
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120_000);

        console.log("[generate-cardapio] fetching Claude API...");
        let claudeResp: Response;
        try {
          claudeResp = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": ANTHROPIC_API_KEY,
              "anthropic-version": aiConfig.anthropic_version,
            },
            body: JSON.stringify({
              model: aiConfig.model_insights,
              max_tokens: 8192,
              messages: [{ role: "user", content: prompt }],
            }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeoutId);
        }

        console.log("[generate-cardapio] Claude status:", claudeResp.status);
        if (!claudeResp.ok) {
          const errBody = await claudeResp.text();
          throw new Error(`Claude API ${claudeResp.status}: ${errBody.slice(0, 300)}`);
        }

        const claudeData = await claudeResp.json();
        const rawText = claudeData.content?.[0]?.text ?? "";
        console.log("[generate-cardapio] rawText length:", rawText.length, "| first200:", rawText.slice(0, 200).replace(/\n/g, "\\n"));

        // Multi-strategy JSON extraction
        let jsonText = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
        if (!jsonText.startsWith("{")) {
          const match = jsonText.match(/\{[\s\S]*\}/);
          if (match) jsonText = match[0];
        }
        cardapio = JSON.parse(jsonText);
        // Always override modalidade_label — AI may hallucinate it when naturalPct is 0
        (cardapio as Record<string, unknown>).modalidade_label =
          computeModalidadeLabel(modalidade, naturalPct, isPortuguese);
        console.log("[generate-cardapio] parsed OK, days:", (cardapio as Record<string, unknown>)?.days ? "yes" : "no");
      } catch (aiErr) {
        fallbackReason = String(aiErr);
        console.error("[generate-cardapio] FALLBACK REASON:", fallbackReason);
        cardapio = buildFallbackCardapio(pet.name, modalidade, naturalPct, weekdays, isPortuguese);
      }
    }

    // ── Upsert cache ──────────────────────────────────────────────────────────
    const { data: existingCache } = await sb
      .from("nutrition_cardapio_cache")
      .select("id")
      .eq("pet_id", pet_id)
      .maybeSingle();

    if (existingCache) {
      await sb
        .from("nutrition_cardapio_cache")
        .update({ data: cardapio, modalidade, generated_at: new Date().toISOString(), user_id: userId })
        .eq("pet_id", pet_id);
    } else {
      await sb
        .from("nutrition_cardapio_cache")
        .insert({ pet_id, user_id: userId, modalidade, data: cardapio });
    }

    // ── Save to history (only real AI-generated menus, not fallback) ──────────
    if (!fallbackReason) {
      await sb
        .from("nutrition_cardapio_history")
        .insert({
          pet_id,
          user_id: userId,
          modalidade,
          data: cardapio,
          is_fallback: false,
        });
    }

    return json({ cardapio, cached: false, fallback_reason: fallbackReason });
  } catch (err) {
    console.error("[generate-cardapio] error:", err);
    return json({ error: "internal error" }, 500);
  }
});
