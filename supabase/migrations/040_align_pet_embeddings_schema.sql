-- Migration 040: Align pet_embeddings schema with generate-embedding Edge Function
--
-- The Edge Function inserts: pet_id, user_id, diary_entry_id, content_text,
-- embedding, importance, category, is_active.
--
-- The original table (002_core_tables) had: content_type NOT NULL,
-- content_id NOT NULL — neither of which the Edge Function provides.
-- This caused all insert attempts to fail with a constraint violation (non-2xx).
--
-- Since the table has been effectively empty (OPENAI_API_KEY was never configured,
-- and the Supabase AI gte-small pipeline only just activated), we can safely
-- restructure: make the legacy columns nullable and add the three new columns.

BEGIN;

-- 1. Drop the content_type CHECK constraint so we can alter the column
ALTER TABLE pet_embeddings
  DROP CONSTRAINT IF EXISTS pet_embeddings_content_type_check;

-- 2. Make legacy NOT NULL columns nullable
--    (table is empty in practice; constraint no longer matches the write path)
ALTER TABLE pet_embeddings
  ALTER COLUMN content_type DROP NOT NULL,
  ALTER COLUMN content_id   DROP NOT NULL;

-- 3. Add the three columns the Edge Function actually writes
ALTER TABLE pet_embeddings
  ADD COLUMN IF NOT EXISTS user_id        UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS diary_entry_id UUID REFERENCES diary_entries(id),
  ADD COLUMN IF NOT EXISTS category       TEXT;

-- 4. Index for fast per-pet + category lookups
CREATE INDEX IF NOT EXISTS idx_pet_embeddings_category
  ON pet_embeddings (pet_id, category)
  WHERE is_active = true;

COMMIT;
