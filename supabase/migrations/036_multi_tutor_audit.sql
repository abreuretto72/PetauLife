-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 036 — Multi-tutor audit trail + ownership-based permissions
--
-- Rules implemented:
--   • Every write is stamped with who + when (created_by / updated_by / deleted_by)
--   • Soft delete only — is_active = false, never physical DELETE
--   • Only the record creator OR the pet owner (root) can UPDATE/DELETE
--   • Co-parents and caregivers have read-only access to others' records
--   • Triggers auto-fill audit columns so the app never needs to set them manually
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Audit columns ──────────────────────────────────────────────────────────

ALTER TABLE diary_entries
  ADD COLUMN IF NOT EXISTS created_by   UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS updated_by   UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS deleted_by   UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;

-- Back-fill created_by from the existing user_id column (original creator)
UPDATE diary_entries
  SET created_by = user_id
  WHERE created_by IS NULL AND user_id IS NOT NULL;

-- ── 2. Trigger: auto-stamp created_by on INSERT ───────────────────────────────

CREATE OR REPLACE FUNCTION _diary_set_created_by()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Use registered_by when available (co-tutor created the entry);
  -- fall back to auth.uid() otherwise.
  NEW.created_by := COALESCE(NEW.registered_by, auth.uid());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS diary_entries_created_by ON diary_entries;
CREATE TRIGGER diary_entries_created_by
  BEFORE INSERT ON diary_entries
  FOR EACH ROW EXECUTE FUNCTION _diary_set_created_by();

-- ── 3. Trigger: auto-stamp updated_by + updated_at on UPDATE ─────────────────

CREATE OR REPLACE FUNCTION _diary_set_updated_by()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Track who made the last edit
  NEW.updated_by := auth.uid();
  NEW.updated_at := NOW();

  -- When the entry is being soft-deleted, stamp deleted_by + deleted_at
  IF NEW.is_active = FALSE AND OLD.is_active = TRUE THEN
    NEW.deleted_by := auth.uid();
    NEW.deleted_at := NOW();
  END IF;

  -- When the entry is being restored, clear the deletion stamp
  IF NEW.is_active = TRUE AND OLD.is_active = FALSE THEN
    NEW.deleted_by := NULL;
    NEW.deleted_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS diary_entries_updated_by ON diary_entries;
CREATE TRIGGER diary_entries_updated_by
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW EXECUTE FUNCTION _diary_set_updated_by();

-- ── 4. Helper: is current user the pet owner (root tutor)? ───────────────────
--
-- Used in RLS policies below.
-- Returns TRUE if auth.uid() owns the pet directly (pets.user_id)
-- OR has role = 'owner' in pet_members.

CREATE OR REPLACE FUNCTION _is_pet_owner(p_pet_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM pets WHERE id = p_pet_id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM pet_members
    WHERE pet_id   = p_pet_id
      AND user_id  = auth.uid()
      AND role     = 'owner'
      AND is_active = TRUE
      AND accepted_at IS NOT NULL
  );
$$;

-- ── 5. RLS — diary_entries ────────────────────────────────────────────────────

ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- SELECT: any active+accepted member of the pet (all roles including viewer)
DROP POLICY IF EXISTS "diary_entries_select" ON diary_entries;
CREATE POLICY "diary_entries_select" ON diary_entries
  FOR SELECT USING (
    -- entry creator always sees their own entries (including soft-deleted for their records)
    created_by = auth.uid()
    OR
    -- any accepted member sees active entries
    (
      is_active = TRUE
      AND EXISTS (
        SELECT 1 FROM pet_members pm
        WHERE pm.pet_id      = diary_entries.pet_id
          AND pm.user_id     = auth.uid()
          AND pm.is_active   = TRUE
          AND pm.accepted_at IS NOT NULL
      )
    )
    OR
    -- original owner always sees all entries for their pet
    EXISTS (
      SELECT 1 FROM pets p
      WHERE p.id = diary_entries.pet_id AND p.user_id = auth.uid()
    )
  );

-- INSERT: owner, co_parent, caregiver (NOT viewer)
DROP POLICY IF EXISTS "diary_entries_insert" ON diary_entries;
CREATE POLICY "diary_entries_insert" ON diary_entries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM pet_members pm
      WHERE pm.pet_id    = diary_entries.pet_id
        AND pm.user_id   = auth.uid()
        AND pm.role      IN ('owner', 'co_parent', 'caregiver')
        AND pm.is_active  = TRUE
        AND pm.accepted_at IS NOT NULL
    )
    OR EXISTS (
      SELECT 1 FROM pets p
      WHERE p.id = diary_entries.pet_id AND p.user_id = auth.uid()
    )
  );

-- UPDATE: only the record creator OR the pet owner (root)
--   • Record creator → can edit content, narration, mood, tags, etc.
--   • Pet owner      → can toggle is_active (deactivate / restore any entry)
DROP POLICY IF EXISTS "diary_entries_update" ON diary_entries;
CREATE POLICY "diary_entries_update" ON diary_entries
  FOR UPDATE USING (
    -- Record creator
    created_by = auth.uid()
    OR
    -- Pet owner / root admin
    _is_pet_owner(pet_id)
  );

-- DELETE (physical): nobody — soft delete only via UPDATE is_active = false
DROP POLICY IF EXISTS "diary_entries_delete" ON diary_entries;
CREATE POLICY "diary_entries_delete" ON diary_entries
  FOR DELETE USING (FALSE);

-- ── 6. Expose audit fields in the API select ──────────────────────────────────
--
-- No schema change needed — the columns are already on the table.
-- The app's lib/api.ts select string must include:
--   created_by, updated_by, deleted_by, deleted_at
-- (done in the corresponding app-side changes)

-- ── 7. Grant execute on helper function ──────────────────────────────────────

GRANT EXECUTE ON FUNCTION _is_pet_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION _diary_set_created_by() TO authenticated;
GRANT EXECUTE ON FUNCTION _diary_set_updated_by() TO authenticated;
