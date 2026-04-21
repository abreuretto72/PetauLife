/**
 * get-nutricao
 *
 * Aggregates all nutrition-related data for a pet into a single Nutricao object.
 * Reads from: pets, nutrition_records, nutrition_profiles.
 * Does NOT call Claude — pure DB aggregation for fast initial load.
 *
 * Called by: hooks/useNutricao.ts
 * Auth: Bearer JWT required
 * Body: { pet_id: string, language?: string }
 * Response: { nutricao: Nutricao }
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

// ── Life stage calculation ─────────────────────────────────────────────────────

function calcLifeStage(
  species: string,
  ageMonths: number,
  size: string | null,
): { life_stage: string; age_label: string } {
  let life_stage = "adult";
  let age_label = "";

  if (species === "dog") {
    const puppyEnd = size === "large" ? 18 : size === "medium" ? 15 : 12;
    const seniorStart = size === "large" ? 60 : size === "medium" ? 84 : 96;
    if (ageMonths < puppyEnd) life_stage = "puppy";
    else if (ageMonths >= seniorStart) life_stage = "senior";
    else life_stage = "adult";
  } else {
    // cat
    if (ageMonths < 12) life_stage = "puppy"; // kitten
    else if (ageMonths >= 120) life_stage = "senior";
    else life_stage = "adult";
  }

  if (ageMonths < 12) {
    age_label = `${ageMonths}m`;
  } else {
    const years = Math.floor(ageMonths / 12);
    const months = ageMonths % 12;
    age_label = months > 0 ? `${years}a ${months}m` : `${years}a`;
  }

  return { life_stage, age_label };
}

function ageMonthsFromPet(pet: Record<string, unknown>): number {
  if (pet.birth_date) {
    const birth = new Date(pet.birth_date as string);
    const now = new Date();
    return Math.max(
      0,
      (now.getFullYear() - birth.getFullYear()) * 12 +
        (now.getMonth() - birth.getMonth()),
    );
  }
  return (pet.estimated_age_months as number | null) ?? 24;
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

    const { pet_id } = await req.json();
    if (!pet_id) return json({ error: "pet_id required" }, 400);

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── 1. Pet info ───────────────────────────────────────────────────────────
    const { data: pet, error: petErr } = await sb
      .from("pets")
      .select("id, name, species, breed, birth_date, estimated_age_months, weight_kg, size, neutered, user_id")
      .eq("id", pet_id)
      .eq("user_id", userId)
      .eq("is_active", true)
      .single();

    if (petErr || !pet) return json({ error: "pet not found" }, 404);

    // ── 1b. Weight fallback: clinical_metrics if pets.weight_kg is null ────────
    let weightKg: number | null = pet.weight_kg;
    if (weightKg == null) {
      const { data: latestWeight } = await sb
        .from("clinical_metrics")
        .select("value")
        .eq("pet_id", pet_id)
        .eq("metric_type", "weight")
        .eq("is_active", true)
        .order("measured_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latestWeight) {
        weightKg = latestWeight.value;
      }
    }

    // ── 2. Nutrition profile ──────────────────────────────────────────────────
    const { data: profile } = await sb
      .from("nutrition_profiles")
      .select("*")
      .eq("pet_id", pet_id)
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();

    // ── 3. Current food ───────────────────────────────────────────────────────
    const { data: currentFoods } = await sb
      .from("nutrition_records")
      .select("id, product_name, brand, category, portion_grams, daily_portions, calories_kcal, started_at, notes, extracted_data")
      .eq("pet_id", pet_id)
      .eq("record_type", "food")
      .eq("is_current", true)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1);

    // ── 4. Food history ───────────────────────────────────────────────────────
    const { data: foodHistory } = await sb
      .from("nutrition_records")
      .select("id, product_name, brand, category, portion_grams, calories_kcal, started_at, ended_at, notes")
      .eq("pet_id", pet_id)
      .eq("record_type", "food")
      .eq("is_active", true)
      .order("started_at", { ascending: false })
      .limit(10);

    // ── 5. Restrictions / intolerances ────────────────────────────────────────
    const { data: restrictions } = await sb
      .from("nutrition_records")
      .select("id, product_name, notes, created_at")
      .eq("pet_id", pet_id)
      .in("record_type", ["restriction", "intolerance"])
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    // ── 6. Active supplements ─────────────────────────────────────────────────
    const { data: supplements } = await sb
      .from("nutrition_records")
      .select("id, product_name, brand, portion_grams, daily_portions, notes")
      .eq("pet_id", pet_id)
      .eq("record_type", "supplement")
      .eq("is_current", true)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    // ── Compute life stage ────────────────────────────────────────────────────
    const ageMonths = ageMonthsFromPet(pet as Record<string, unknown>);
    const { life_stage, age_label } = calcLifeStage(
      pet.species,
      ageMonths,
      pet.size,
    );

    // ── Build alerts ──────────────────────────────────────────────────────────
    const alerts: Array<{ type: string; message_key: string; severity: string }> = [];

    const currentFood = currentFoods?.[0] ?? null;

    if (!currentFood) {
      alerts.push({ type: "no_food", message_key: "nutrition.alertNoFood", severity: "warning" });
    } else {
      // Check if food category matches life stage
      const cat = currentFood.category;
      if (life_stage === "puppy" && !cat?.includes("puppy") && cat !== "prescription") {
        alerts.push({ type: "life_stage_mismatch", message_key: "nutrition.alertLifeStageMismatch", severity: "info" });
      } else if (life_stage === "senior" && !cat?.includes("senior") && cat !== "prescription") {
        alerts.push({ type: "life_stage_mismatch", message_key: "nutrition.alertLifeStageMismatch", severity: "info" });
      }
    }

    if (restrictions && restrictions.length > 0) {
      alerts.push({ type: "has_restrictions", message_key: "nutrition.alertHasRestrictions", severity: "info" });
    }

    // ── Compose response ──────────────────────────────────────────────────────
    const nutricao = {
      life_stage,
      age_label,
      weight_kg: weightKg,
      modalidade: profile?.modalidade ?? "so_racao",
      natural_pct: profile?.natural_pct ?? 0,
      current_food: currentFood,
      food_history: foodHistory ?? [],
      restrictions: restrictions ?? [],
      supplements: supplements ?? [],
      alerts,
      ai_evaluation: profile?.ai_evaluation ?? null,
      ai_evaluation_updated_at: profile?.ai_evaluation_updated_at ?? null,
    };

    return json({ nutricao });
  } catch (err) {
    console.error("[get-nutricao] error:", err);
    return json({ error: "internal error" }, 500);
  }
});
