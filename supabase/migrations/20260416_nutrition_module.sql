-- Migration: nutrition module
-- Creates nutrition_profiles (per-pet modalidade + AI eval)
-- and nutrition_cardapio_cache (cached weekly menu per pet)

-- ── nutrition_profiles ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nutrition_profiles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id          UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id),
    modalidade      VARCHAR(20) DEFAULT 'so_racao'
                    CHECK (modalidade IN ('so_racao', 'racao_natural', 'so_natural')),
    natural_pct     INTEGER DEFAULT 0    -- % of natural food (0-100, used in racao_natural)
                    CHECK (natural_pct BETWEEN 0 AND 100),
    ai_evaluation   JSONB,               -- { score, summary, pros, cons, recommendation }
    notes           TEXT,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Only one active profile per pet
CREATE UNIQUE INDEX IF NOT EXISTS idx_nutrition_profiles_active
    ON nutrition_profiles(pet_id)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_nutrition_profiles_pet
    ON nutrition_profiles(pet_id);

ALTER TABLE nutrition_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY nutrition_profiles_own ON nutrition_profiles
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ── nutrition_cardapio_cache ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nutrition_cardapio_cache (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id          UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES auth.users(id),
    modalidade      VARCHAR(20) NOT NULL
                    CHECK (modalidade IN ('so_racao', 'racao_natural', 'so_natural')),
    data            JSONB NOT NULL,      -- full Cardapio JSON
    generated_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (pet_id)
);

CREATE INDEX IF NOT EXISTS idx_nutrition_cardapio_pet
    ON nutrition_cardapio_cache(pet_id);

ALTER TABLE nutrition_cardapio_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY nutrition_cardapio_own ON nutrition_cardapio_cache
    FOR ALL USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ── updated_at trigger for nutrition_profiles ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_nutrition_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_nutrition_profile_updated
    BEFORE UPDATE ON nutrition_profiles
    FOR EACH ROW EXECUTE FUNCTION update_nutrition_profile_timestamp();
