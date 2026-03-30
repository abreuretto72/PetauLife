-- ══════════════════════════════════════════════════════════════
-- Migration 009: Diary Spec Upgrade
-- Aligns diary_entries, mood_logs, and pets tables with the
-- complete diary specification (diary_spec_completa.md)
-- ══════════════════════════════════════════════════════════════

-- ── 1. ADD MISSING COLUMNS TO diary_entries ──

ALTER TABLE diary_entries
  ADD COLUMN IF NOT EXISTS input_method VARCHAR(10) NOT NULL DEFAULT 'text'
    CHECK (input_method IN ('voice', 'photo', 'text')),
  ADD COLUMN IF NOT EXISTS mood_score INTEGER CHECK (mood_score >= 0 AND mood_score <= 100),
  ADD COLUMN IF NOT EXISTS mood_source VARCHAR(15) DEFAULT 'manual'
    CHECK (mood_source IN ('manual', 'ai_suggested')),
  ADD COLUMN IF NOT EXISTS entry_type VARCHAR(20) NOT NULL DEFAULT 'manual'
    CHECK (entry_type IN ('manual','photo_analysis','vaccine','allergy','ai_insight','milestone','mood_change')),
  ADD COLUMN IF NOT EXISTS linked_photo_analysis_id UUID REFERENCES photo_analyses(id),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill updated_at for existing rows
UPDATE diary_entries SET updated_at = created_at WHERE updated_at = NOW();

-- ── 2. ADD MISSING COLUMNS TO mood_logs ──

ALTER TABLE mood_logs
  ADD COLUMN IF NOT EXISTS source_id UUID;

-- ── 3. ADD MISSING COLUMNS TO pets ──

ALTER TABLE pets
  ADD COLUMN IF NOT EXISTS current_mood_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_diary_entries INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_photos INTEGER NOT NULL DEFAULT 0;

-- Backfill total_diary_entries from existing data
UPDATE pets p SET total_diary_entries = (
  SELECT COUNT(*) FROM diary_entries de
  WHERE de.pet_id = p.id AND de.is_active = true
);

-- ── 4. INDEXES FOR NEW COLUMNS ──

CREATE INDEX IF NOT EXISTS idx_diary_entries_mood ON diary_entries(pet_id, mood_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_type ON diary_entries(pet_id, entry_type);
CREATE INDEX IF NOT EXISTS idx_diary_entries_special ON diary_entries(pet_id, is_special) WHERE is_special = true;

-- ── 5. TRIGGER: auto-update updated_at on diary_entries ──

CREATE OR REPLACE FUNCTION trg_fn_diary_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_diary_updated_at ON diary_entries;
CREATE TRIGGER trigger_diary_updated_at
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_diary_set_updated_at();

-- ── 6. TRIGGER: increment diary count + photos on pets ──

CREATE OR REPLACE FUNCTION trg_fn_increment_diary_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    UPDATE pets SET
      total_diary_entries = total_diary_entries + 1,
      total_photos = total_photos + jsonb_array_length(COALESCE(NEW.photos, '[]'::jsonb)),
      updated_at = NOW()
    WHERE id = NEW.pet_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_increment_diary_count ON diary_entries;
CREATE TRIGGER trigger_increment_diary_count
  AFTER INSERT ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_increment_diary_count();

-- ── 7. TRIGGER: update pet mood + mood_updated_at on mood_log insert ──

CREATE OR REPLACE FUNCTION trg_fn_update_pet_mood_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE pets SET
    current_mood = NEW.mood_id,
    current_mood_updated_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.pet_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_update_pet_mood_v2 ON mood_logs;
CREATE TRIGGER trigger_update_pet_mood_v2
  AFTER INSERT ON mood_logs
  FOR EACH ROW
  EXECUTE FUNCTION trg_fn_update_pet_mood_v2();

-- ── 8. FUNCTION: create diary entry (atomic: entry + mood_log) ──

CREATE OR REPLACE FUNCTION fn_create_diary_entry(
  p_pet_id UUID,
  p_author_id UUID,
  p_content TEXT,
  p_input_method VARCHAR(10),
  p_mood_id VARCHAR(20),
  p_mood_score INTEGER DEFAULT NULL,
  p_mood_source VARCHAR(15) DEFAULT 'manual',
  p_entry_type VARCHAR(20) DEFAULT 'manual',
  p_tags JSONB DEFAULT '[]',
  p_is_special BOOLEAN DEFAULT false,
  p_photos JSONB DEFAULT '[]',
  p_linked_photo_analysis_id UUID DEFAULT NULL,
  p_entry_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entry_id UUID;
  v_score INTEGER;
BEGIN
  -- Validations
  IF LENGTH(p_content) < 3 THEN
    RAISE EXCEPTION 'content must have at least 3 characters';
  END IF;
  IF LENGTH(p_content) > 2000 THEN
    RAISE EXCEPTION 'content must have at most 2000 characters';
  END IF;
  IF jsonb_array_length(COALESCE(p_photos, '[]'::jsonb)) > 5 THEN
    RAISE EXCEPTION 'Maximum 5 photos per entry';
  END IF;

  -- Insert diary entry
  INSERT INTO diary_entries (
    pet_id, user_id, content, input_method,
    mood_id, mood_score, mood_source, entry_type,
    tags, is_special, photos,
    linked_photo_analysis_id, entry_date
  ) VALUES (
    p_pet_id, p_author_id, p_content, p_input_method,
    p_mood_id, p_mood_score, p_mood_source, p_entry_type,
    p_tags, p_is_special, p_photos,
    p_linked_photo_analysis_id, p_entry_date
  ) RETURNING id INTO v_entry_id;

  -- Calculate mood score from mood_id if not provided
  v_score := COALESCE(p_mood_score, CASE p_mood_id
    WHEN 'ecstatic' THEN 100
    WHEN 'happy' THEN 80
    WHEN 'playful' THEN 70
    WHEN 'calm' THEN 60
    WHEN 'tired' THEN 40
    WHEN 'anxious' THEN 25
    WHEN 'sad' THEN 10
    WHEN 'sick' THEN 15
    ELSE 50
  END);

  -- Insert mood log
  INSERT INTO mood_logs (pet_id, user_id, mood_id, score, source, source_id)
  VALUES (p_pet_id, p_author_id, p_mood_id, v_score, 'ai_diary', v_entry_id);

  RETURN v_entry_id;
END;
$$;

-- ── 9. FUNCTION: update diary narration (called by Edge Function) ──

CREATE OR REPLACE FUNCTION fn_update_diary_narration(
  p_entry_id UUID,
  p_narration TEXT,
  p_mood_score INTEGER DEFAULT NULL,
  p_tags JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE diary_entries SET
    narration = p_narration,
    mood_score = COALESCE(p_mood_score, mood_score),
    tags = COALESCE(p_tags, tags),
    updated_at = NOW()
  WHERE id = p_entry_id;
END;
$$;

-- ── 10. FUNCTION: paginated diary timeline ──

CREATE OR REPLACE FUNCTION fn_get_diary_timeline(
  p_pet_id UUID,
  p_page INTEGER DEFAULT 1,
  p_per_page INTEGER DEFAULT 20,
  p_entry_type VARCHAR(20) DEFAULT NULL,
  p_mood VARCHAR(20) DEFAULT NULL,
  p_only_special BOOLEAN DEFAULT false,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  input_method VARCHAR(10),
  narration TEXT,
  mood_id VARCHAR(20),
  mood_score INTEGER,
  entry_type VARCHAR(20),
  tags JSONB,
  is_special BOOLEAN,
  photos JSONB,
  entry_date DATE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  photo_count INTEGER,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_offset INTEGER;
BEGIN
  v_offset := (p_page - 1) * p_per_page;

  RETURN QUERY
  SELECT
    de.id,
    de.content,
    de.input_method,
    de.narration,
    de.mood_id,
    de.mood_score,
    de.entry_type,
    de.tags,
    de.is_special,
    de.photos,
    de.entry_date,
    de.created_at,
    de.updated_at,
    jsonb_array_length(COALESCE(de.photos, '[]'::jsonb))::INTEGER AS photo_count,
    COUNT(*) OVER()::BIGINT AS total_count
  FROM diary_entries de
  WHERE de.pet_id = p_pet_id
    AND de.is_active = true
    AND (p_entry_type IS NULL OR de.entry_type = p_entry_type)
    AND (p_mood IS NULL OR de.mood_id = p_mood)
    AND (p_only_special = false OR de.is_special = true)
    AND (p_date_from IS NULL OR de.entry_date >= p_date_from)
    AND (p_date_to IS NULL OR de.entry_date <= p_date_to)
  ORDER BY de.entry_date DESC, de.created_at DESC
  LIMIT p_per_page
  OFFSET v_offset;
END;
$$;

-- ── 11. VIEW: mood statistics (last 30 days) ──

CREATE OR REPLACE VIEW v_mood_stats AS
SELECT
  ml.pet_id,
  ml.mood_id,
  COUNT(*) AS count,
  ROUND(AVG(ml.score)) AS avg_score,
  MAX(ml.created_at) AS last_logged,
  ROUND(
    COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (PARTITION BY ml.pet_id), 0),
    1
  ) AS percentage
FROM mood_logs ml
WHERE ml.created_at >= NOW() - INTERVAL '30 days'
  AND ml.is_active = true
GROUP BY ml.pet_id, ml.mood_id
ORDER BY count DESC;

-- ── 12. VIEW: monthly diary summary ──

CREATE OR REPLACE VIEW v_diary_monthly_summary AS
SELECT
  de.pet_id,
  DATE_TRUNC('month', de.entry_date)::DATE AS month,
  COUNT(*) AS total_entries,
  COUNT(*) FILTER (WHERE de.entry_type = 'manual') AS manual_entries,
  COUNT(*) FILTER (WHERE de.entry_type = 'photo_analysis') AS photo_entries,
  COUNT(*) FILTER (WHERE de.is_special = true) AS special_moments,
  ROUND(AVG(de.mood_score)) AS avg_mood_score,
  MODE() WITHIN GROUP (ORDER BY de.mood_id) AS dominant_mood,
  SUM(jsonb_array_length(COALESCE(de.photos, '[]'::jsonb))) AS total_photos
FROM diary_entries de
WHERE de.is_active = true
GROUP BY de.pet_id, DATE_TRUNC('month', de.entry_date)
ORDER BY month DESC;
