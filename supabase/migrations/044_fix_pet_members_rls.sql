-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 044 — Fix pet_members RLS infinite recursion
--
-- Root cause: Multiple pet_members SELECT policies contain self-referential
-- subqueries (SELECT ... FROM pet_members pm2 WHERE ...). Combined with
-- cross-table references, PostgreSQL detects infinite recursion (42P17).
--
-- Fix: Drop ALL pet_members policies. Rewrite using SECURITY DEFINER functions
-- only — no direct subqueries, no self-references in policy conditions.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Drop ALL existing pet_members policies ─────────────────────────────────

DROP POLICY IF EXISTS pet_members_owner  ON pet_members;
DROP POLICY IF EXISTS pet_members_self   ON pet_members;
DROP POLICY IF EXISTS pet_members_accept ON pet_members;
DROP POLICY IF EXISTS "pet_members_insert"  ON pet_members;
DROP POLICY IF EXISTS "pet_members_update"  ON pet_members;
DROP POLICY IF EXISTS "pet_members_select"  ON pet_members;
DROP POLICY IF EXISTS "pet_members_delete"  ON pet_members;

-- ── 2. SECURITY DEFINER helper: is user an active accepted member? ────────────

CREATE OR REPLACE FUNCTION _auth_user_is_active_member(p_pet_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM pet_members
    WHERE pet_id      = p_pet_id
      AND user_id     = auth.uid()
      AND is_active   = TRUE
      AND accepted_at IS NOT NULL
      AND (expires_at IS NULL OR expires_at > NOW())
  );
$$;

GRANT EXECUTE ON FUNCTION _auth_user_is_active_member(UUID) TO authenticated;

-- ── 3. Clean policies — NO subqueries, NO self-references ────────────────────

-- SELECT: root sees all, active members see their pet's rows, pending invitees see own row
CREATE POLICY pet_members_select ON pet_members
  FOR SELECT USING (
    _is_pet_root(pet_id)
    OR _auth_user_is_active_member(pet_id)
    OR user_id = auth.uid()
  );

-- INSERT: any owner (root or co-owner) can invite members
CREATE POLICY pet_members_insert ON pet_members
  FOR INSERT WITH CHECK (
    _is_pet_owner(pet_id)
  );

-- UPDATE: any owner OR the member themselves (accepting invite, updating own row)
CREATE POLICY pet_members_update ON pet_members
  FOR UPDATE USING (
    _is_pet_owner(pet_id) OR user_id = auth.uid()
  );

-- DELETE: soft delete only via is_active = false
CREATE POLICY pet_members_delete ON pet_members
  FOR DELETE USING (FALSE);
