-- Migration: fix_sync_allergies_extracted_data_path
-- Fixes the JSON path in sync_allergies_from_diary.
-- Previous version used c->>'allergen' (root of classification object)
-- but the classifier stores allergen inside extracted_data:
--   { "type": "allergy", "confidence": 0.x,
--     "extracted_data": { "allergen": "...", "reaction_type": "...", ... } }
-- Correct path: c->'extracted_data'->>'allergen'

CREATE OR REPLACE FUNCTION sync_allergies_from_diary(p_pet_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted INTEGER := 0;
  v_user_id  UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM pets WHERE id = p_pet_id LIMIT 1;
  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  INSERT INTO allergies (pet_id, user_id, allergen, reaction, severity, diagnosed_date, diagnosed_by, is_active)
  SELECT DISTINCT ON (lower(trim(c->'extracted_data'->>'allergen')))
    p_pet_id,
    v_user_id,
    trim(c->'extracted_data'->>'allergen'),
    NULLIF(trim(c->'extracted_data'->>'reaction_type'), ''),
    CASE
      WHEN c->'extracted_data'->>'severity' IN ('mild', 'moderate', 'severe') THEN (c->'extracted_data'->>'severity')
      ELSE 'mild'
    END,
    CASE
      WHEN c->'extracted_data'->>'first_observed' ~ '^\d{4}-\d{2}-\d{2}$'
        THEN (c->'extracted_data'->>'first_observed')::DATE
      ELSE NULL
    END,
    NULL,
    true
  FROM diary_entries e,
       jsonb_array_elements(e.classifications) AS c
  WHERE e.pet_id    = p_pet_id
    AND e.is_active  = true
    AND (e.classifications IS NOT NULL AND jsonb_array_length(e.classifications) > 0)
    AND c->>'type'   = 'allergy'
    AND (c->>'confidence')::float >= 0.6
    AND trim(c->'extracted_data'->>'allergen') IS NOT NULL
    AND trim(c->'extracted_data'->>'allergen') <> ''
    AND NOT EXISTS (
      SELECT 1
      FROM allergies a
      WHERE a.pet_id   = p_pet_id
        AND lower(a.allergen) = lower(trim(c->'extracted_data'->>'allergen'))
        AND a.is_active = true
    );

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$$;

REVOKE ALL ON FUNCTION sync_allergies_from_diary(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION sync_allergies_from_diary(UUID) TO authenticated;
