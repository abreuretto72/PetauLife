-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 038 — Root concept: only the founding owner can promote/demote owners
--
-- Terminology (fixed):
--
--   ROOT       = pets.user_id
--                The tutor who created the pet. Immovable. The only one who can
--                grant or revoke the 'owner' role to/from other tutors.
--                Has full admin powers on this pet.
--
--   CO-OWNER   = pet_members.role = 'owner'
--                Designated by the root. Has the same operational powers as root
--                (can deactivate others' entries, manage co-parents/caregivers/viewers)
--                but CANNOT promote other tutors to owner, and CANNOT remove owners.
--                Their own membership can be revoked by root at any time.
--
--   CO-PARENT  = pet_members.role = 'co_parent'
--                Can create diary entries, manage caregivers/viewers.
--
--   CAREGIVER  = pet_members.role = 'caregiver'
--                Can create diary entries only.
--
--   VIEWER     = pet_members.role = 'viewer'
--                Read-only access.
--
-- Permission matrix:
--   Action                          ROOT  CO-OWNER  CO-PARENT  CAREGIVER  VIEWER
--   Create diary entries             ✅      ✅         ✅          ✅        ❌
--   Edit/delete own entries          ✅      ✅         ✅          ✅        ❌
--   Deactivate others' entries       ✅      ✅         ❌          ❌        ❌
--   Invite co-owners                 ✅      ❌         ❌          ❌        ❌
--   Remove co-owners                 ✅      ❌         ❌          ❌        ❌
--   Invite co-parents                ✅      ✅         ✅          ❌        ❌
--   Invite caregivers/viewers        ✅      ✅         ✅          ❌        ❌
--   Remove caregivers/viewers        ✅      ✅         ✅          ❌        ❌
--   Delete / transfer the pet        ✅      ❌         ❌          ❌        ❌
--
-- Scoping: ALL permissions above are restricted to the specific pet.
--   Being owner of pet A gives zero privileges on pet B.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Helper: is the user the ROOT of a given pet? ─────────────────────────────

CREATE OR REPLACE FUNCTION _is_pet_root(p_pet_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM pets WHERE id = p_pet_id AND user_id = auth.uid()
  );
$$;

-- ── RLS — pet_members INSERT: root grants owner; any owner grants the rest ────

DROP POLICY IF EXISTS "pet_members_insert" ON pet_members;
CREATE POLICY "pet_members_insert" ON pet_members
  FOR INSERT WITH CHECK (
    -- Only root can grant role = 'owner'
    (role = 'owner' AND _is_pet_root(pet_id))
    OR
    -- Any owner (root or co-owner) can invite co_parent / caregiver / viewer
    (role != 'owner' AND _is_pet_owner(pet_id))
  );

-- ── RLS — pet_members UPDATE: root can change anything; others limited ────────

DROP POLICY IF EXISTS "pet_members_update" ON pet_members;
CREATE POLICY "pet_members_update" ON pet_members
  FOR UPDATE
  USING (
    _is_pet_owner(pet_id) OR user_id = auth.uid()
  )
  WITH CHECK (
    -- Root can set any role
    _is_pet_root(pet_id)
    OR (
      -- Co-owners can update non-owner rows only (cannot promote to owner)
      role != 'owner'
      AND _is_pet_owner(pet_id)
    )
    OR (
      -- Member accepting/updating their own row
      user_id = auth.uid()
    )
  );

GRANT EXECUTE ON FUNCTION _is_pet_root(UUID) TO authenticated;
