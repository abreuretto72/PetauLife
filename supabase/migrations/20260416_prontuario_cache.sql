-- Migration: prontuario_cache
-- Stores AI-generated pet medical records (prontuário).
-- One record per pet, cached with 24h TTL.
-- Regenerated on-demand by the generate-prontuario Edge Function.

CREATE TABLE IF NOT EXISTS prontuario_cache (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id            UUID        NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- JSONB blob: full Prontuario object (see hooks/useProntuario.ts)
  data              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  -- Token for public emergency QR access (no auth required)
  emergency_token   TEXT        NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_stale          BOOLEAN     NOT NULL DEFAULT false,
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One cache entry per pet (upsert target)
CREATE UNIQUE INDEX IF NOT EXISTS prontuario_cache_pet_id_idx
  ON prontuario_cache (pet_id)
  WHERE is_active = true;

-- Emergency token must also be unique (used for public QR URL)
CREATE UNIQUE INDEX IF NOT EXISTS prontuario_cache_emergency_token_idx
  ON prontuario_cache (emergency_token);

-- ── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE prontuario_cache ENABLE ROW LEVEL SECURITY;

-- Owners can read their own prontuários
CREATE POLICY "prontuario_cache_select"
  ON prontuario_cache
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT pm.user_id FROM pet_members pm
      WHERE pm.pet_id = prontuario_cache.pet_id
        AND pm.is_active = true
        AND pm.accepted_at IS NOT NULL
    )
  );

-- Only owner (or service role) can insert/update
CREATE POLICY "prontuario_cache_insert"
  ON prontuario_cache
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "prontuario_cache_update"
  ON prontuario_cache
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Notify PostgREST schema cache on change
NOTIFY pgrst, 'reload schema';
