import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Verify caller identity via JWT
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const userId = user.id;
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Soft-delete all pets and cascade
    const { data: pets } = await admin
      .from('pets')
      .select('id')
      .eq('user_id', userId);

    const petIds = (pets ?? []).map((p: { id: string }) => p.id);

    if (petIds.length > 0) {
      // Soft-delete everything related to each pet
      const tables = [
        'diary_entries', 'mood_logs', 'photo_analyses',
        'vaccines', 'allergies', 'pet_embeddings',
        'scheduled_events', 'pet_insights',
        'clinical_metrics', 'expenses',
        'nutrition_records', 'pet_connections',
        'pet_plans', 'achievements', 'travels',
      ];

      for (const table of tables) {
        await admin.from(table).update({ is_active: false }).in('pet_id', petIds);
      }

      // Soft-delete pets themselves
      await admin.from('pets').update({ is_active: false }).in('id', petIds);
    }

    // Soft-delete user record
    await admin.from('users').update({ is_active: false }).eq('id', userId);

    // Delete auth user (hard delete — auth record must go for LGPD/GDPR)
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('[delete-account] auth.admin.deleteUser failed:', deleteError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to delete account', details: deleteError.message }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    console.log('[delete-account] SUCCESS — userId:', userId, 'pets soft-deleted:', petIds.length);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );

  } catch (err) {
    console.error('[delete-account] error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error', message: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
