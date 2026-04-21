-- Migration: nutrition_cardapio_history
-- Stores every generated AI menu for a pet (one row per generation).
-- The cache table (nutrition_cardapio_cache) continues to hold the latest;
-- this table holds the full history so tutors can revisit past menus.

CREATE TABLE IF NOT EXISTS nutrition_cardapio_history (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id        UUID        NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  modalidade    TEXT        NOT NULL,
  data          JSONB       NOT NULL,
  is_fallback   BOOLEAN     NOT NULL DEFAULT false,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cardapio_history_pet_id
  ON nutrition_cardapio_history (pet_id, generated_at DESC);

ALTER TABLE nutrition_cardapio_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own cardapio history"
  ON nutrition_cardapio_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cardapio history"
  ON nutrition_cardapio_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can insert cardapio history"
  ON nutrition_cardapio_history FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Users can soft-delete own cardapio history"
  ON nutrition_cardapio_history FOR UPDATE
  USING (auth.uid() = user_id);
