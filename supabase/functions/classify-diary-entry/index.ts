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
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

import { corsResponse, jsonResponse, errorResponse } from './modules/cors.ts';
import { validateAuth } from './modules/auth.ts';
import { fetchPetContext } from './modules/context.ts';
import { classifyEntry } from './modules/classifier.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ── Main handler ──

Deno.serve(async (req: Request) => {
  // Preflight
  if (req.method === 'OPTIONS') {
    return corsResponse();
  }

  try {
    // 1. Validate API key exists
    if (!Deno.env.get('ANTHROPIC_API_KEY')) {
      return errorResponse('ANTHROPIC_API_KEY not configured', 500);
    }

    // 2. Authenticate — required (verify_jwt disabled at gateway level due to ES256/HS256
    // mismatch; auth is enforced here via getUser() which handles ES256 correctly)
    const user = await validateAuth(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    // 3. Parse and validate input
    const body = await req.json();
    const {
      pet_id,
      text,
      photo_base64,           // legacy single photo (kept for backward compat)
      photos_base64,          // new: array of up to 5 photos
      pdf_base64,             // PDF document for pdf_upload input type
      audio_url,              // public URL of pet audio for pet_audio input type
      audio_duration_seconds, // duration of the audio recording in seconds
      video_url,              // public URL of uploaded video for video input type
      input_type = 'text',
      language = 'pt-BR',
    } = body;

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

    // 4. Fetch pet context (profile + RAG memories — passes text for vector search)
    const petContext = await fetchPetContext(pet_id, text ?? undefined);
    if (!petContext) {
      return errorResponse('Pet not found', 404);
    }

    // 5. Classify with Claude
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
    });

    // 6. Auto-save allergy classifications to the allergies table — fire-and-forget
    // When the tutor mentions an allergy in the diary, it should automatically appear
    // in the health screen's Allergies section without manual data entry.
    const allergyClassifications = (result.classifications ?? []).filter(
      (c: { type: string; confidence: number; extracted_data: Record<string, unknown> }) =>
        c.type === 'allergy' && c.confidence >= 0.7 && c.extracted_data?.allergen,
    );
    if (allergyClassifications.length > 0 && user?.id) {
      const supabaseAllergy = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      // Fetch existing allergens for this pet to avoid duplicates (case-insensitive)
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
        existingLower.add(allergen.toLowerCase()); // prevent double-insert within same request
      }
    }

    // 7. Record anonymized training data — fire-and-forget, consent checked inside DB function
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

    // 8. Return structured result
    return jsonResponse(result);

  } catch (err) {
    console.error('[classify-diary-entry] Unhandled error:', err);
    return errorResponse('Internal error', 500, { message: String(err) });
  }
});
