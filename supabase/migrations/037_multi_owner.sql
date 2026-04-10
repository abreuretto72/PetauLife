-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 037 — Multiple owners per pet (Option C)
--
-- A pet can have N owners simultaneously. All owners share the same admin
-- powers (can deactivate / restore any record from any co-tutor).
--
-- Rule: only existing owners can grant the owner role to new members.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Helper: is the current user an owner of a given pet? ─────────────────────
--
-- Replaces the version in migration 036 to also check pet_members.role = 'owner'
-- (previously only checked pets.user_id).

CREATE OR REPLACE FUNCTION _is_pet_owner(p_pet_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    -- Original creator
    SELECT 1 FROM pets WHERE id = p_pet_id AND user_id = auth.uid()
  )
  OR EXISTS (
    -- Any accepted pet_members row with role = 'owner'
    SELECT 1 FROM pet_members
    WHERE pet_id    = p_pet_id
      AND user_id   = auth.uid()
      AND role      = 'owner'
      AND is_active  = TRUE
      AND accepted_at IS NOT NULL
  );
$$;

-- ── RLS — pet_members ─────────────────────────────────────────────────────────

-- INSERT: any owner can invite any role (including other owners)
-- Previously: only pets.user_id could invite co_parents.
DROP POLICY IF EXISTS "pet_members_insert" ON pet_members;
CREATE POLICY "pet_members_insert" ON pet_members
  FOR INSERT WITH CHECK (
    _is_pet_owner(pet_id)
  );

-- UPDATE: any owner can update member rows (change role, deactivate, etc.)
-- Co-parents can only update their own row (accept invite, etc.)
DROP POLICY IF EXISTS "pet_members_update" ON pet_members;
CREATE POLICY "pet_members_update" ON pet_members
  FOR UPDATE USING (
    -- Any owner of this pet
    _is_pet_owner(pet_id)
    OR
    -- Member updating their own row (accepting invite)
    user_id = auth.uid()
  );

-- SELECT: any member of the pet sees all other members (unchanged)
DROP POLICY IF EXISTS "pet_members_select" ON pet_members;
CREATE POLICY "pet_members_select" ON pet_members
  FOR SELECT USING (
    _is_pet_owner(pet_id)
    OR EXISTS (
      SELECT 1 FROM pet_members pm2
      WHERE pm2.pet_id    = pet_members.pet_id
        AND pm2.user_id   = auth.uid()
        AND pm2.is_active  = TRUE
        AND pm2.accepted_at IS NOT NULL
    )
  );

-- DELETE: soft-delete only (is_active = false via UPDATE), physical DELETE blocked
DROP POLICY IF EXISTS "pet_members_delete" ON pet_members;
CREATE POLICY "pet_members_delete" ON pet_members
  FOR DELETE USING (FALSE);
