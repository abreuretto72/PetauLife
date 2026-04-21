-- Migration: add last_accessed_at to pets
-- Tracks the most recent activity related to a pet for "Recentes" section.
--
-- Tabelas com pet_id confirmadas no schema:
--   diary_entries, vaccines, photo_analyses, mood_logs,
--   consultations (011_health_tables), medications (011_health_tables),
--   expenses (013_expenses_table), body_condition_scores, parasite_control

-- 1. Coluna (idempotente via IF NOT EXISTS)
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ DEFAULT NOW();

-- Preencher retroativamente com updated_at para pets existentes
UPDATE public.pets
  SET last_accessed_at = updated_at
  WHERE last_accessed_at IS NULL;

-- 2. Índice (ordenação DESC frequente)
CREATE INDEX IF NOT EXISTS idx_pets_last_accessed_at
  ON public.pets (user_id, last_accessed_at DESC);

-- 3. Função genérica de touch
CREATE OR REPLACE FUNCTION public.touch_pet_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.pets
    SET last_accessed_at = NOW()
    WHERE id = NEW.pet_id;
  RAISE NOTICE 'touched pet %', NEW.pet_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Triggers (DROP IF EXISTS para ser re-runável)

DROP TRIGGER IF EXISTS trg_diary_entries_touch_pet ON public.diary_entries;
CREATE TRIGGER trg_diary_entries_touch_pet
  AFTER INSERT ON public.diary_entries
  FOR EACH ROW EXECUTE FUNCTION public.touch_pet_last_accessed();

DROP TRIGGER IF EXISTS trg_vaccines_touch_pet ON public.vaccines;
CREATE TRIGGER trg_vaccines_touch_pet
  AFTER INSERT ON public.vaccines
  FOR EACH ROW EXECUTE FUNCTION public.touch_pet_last_accessed();

DROP TRIGGER IF EXISTS trg_photo_analyses_touch_pet ON public.photo_analyses;
CREATE TRIGGER trg_photo_analyses_touch_pet
  AFTER INSERT ON public.photo_analyses
  FOR EACH ROW EXECUTE FUNCTION public.touch_pet_last_accessed();

DROP TRIGGER IF EXISTS trg_consultations_touch_pet ON public.consultations;
CREATE TRIGGER trg_consultations_touch_pet
  AFTER INSERT ON public.consultations
  FOR EACH ROW EXECUTE FUNCTION public.touch_pet_last_accessed();

DROP TRIGGER IF EXISTS trg_medications_touch_pet ON public.medications;
CREATE TRIGGER trg_medications_touch_pet
  AFTER INSERT ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.touch_pet_last_accessed();

DROP TRIGGER IF EXISTS trg_expenses_touch_pet ON public.expenses;
CREATE TRIGGER trg_expenses_touch_pet
  AFTER INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.touch_pet_last_accessed();

DROP TRIGGER IF EXISTS trg_body_condition_touch_pet ON public.body_condition_scores;
CREATE TRIGGER trg_body_condition_touch_pet
  AFTER INSERT ON public.body_condition_scores
  FOR EACH ROW EXECUTE FUNCTION public.touch_pet_last_accessed();

DROP TRIGGER IF EXISTS trg_parasite_control_touch_pet ON public.parasite_control;
CREATE TRIGGER trg_parasite_control_touch_pet
  AFTER INSERT ON public.parasite_control
  FOR EACH ROW EXECUTE FUNCTION public.touch_pet_last_accessed();

-- 5. Reload PostgREST
NOTIFY pgrst, 'reload schema';
