-- Migration: add ai_evaluation_updated_at to nutrition_profiles
-- Tracks when the AI evaluation was last generated (for 7-day cache TTL).

ALTER TABLE nutrition_profiles
  ADD COLUMN IF NOT EXISTS ai_evaluation_updated_at TIMESTAMPTZ;
