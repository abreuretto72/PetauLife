-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 043 — Definitive fix for pets RLS circular recursion
--
-- Root cause (revisited):
--   pets_select queries pet_members DIRECTLY via a subquery.
--   Any pet_members SELECT policy that references pets (even via SECURITY DEFINER)
--   can still trigger the recursion detection because PostgreSQL tracks the
--   table-access chain at the query level, not the policy level.
--
-- Definitive fix:
--   Wrap the pet_members check inside pets_select in a SECURITY DEFINER function.
--   SECURITY DEFINER functions run as the function owner (postgres superuser).
--   Queries inside the function run in a SEPARATE security context, completely
--   bypassing RLS on ALL tables accessed inside the function.
--   This breaks the chain: pets_select no longer makes a DIRECT subquery to
--   pet_members — it calls a function, which is a different context.
--
-- Also: add SET search_path to all _is_pet_* functions (security hardening).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. New SECURITY DEFINER function for pets_select membership check ─────────

CREATE OR REPLACE FUNCTION _auth_user_is_pet_member(p_pet_id UUID)
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

GRANT EXECUTE ON FUNCTION _auth_user_is_pet_member(UUID) TO authenticated;

-- ── 2. Rewrite pets_select — no more direct subquery to pet_members ───────────

DROP POLICY IF EXISTS pets_select ON pets;

CREATE POLICY pets_select ON pets
  FOR SELECT USING (
    auth.uid() = user_id
    OR _auth_user_is_pet_member(id)
  );

-- ── 3. Harden existing SECURITY DEFINER functions with SET search_path ────────
--      (prevents search_path injection and ensures correct table resolution)

CREATE OR REPLACE FUNCTION _is_pet_owner(p_pet_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM pets WHERE id = p_pet_id AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM pet_members
    WHERE pet_id    = p_pet_id
      AND user_id   = auth.uid()
      AND role      = 'owner'
      AND is_active  = TRUE
      AND accepted_at IS NOT NULL
  );
$$;

CREATE OR REPLACE FUNCTION _is_pet_root(p_pet_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = public, pg_catalog
AS $$
  SELECT EXISTS (
    SELECT 1 FROM pets WHERE id = p_pet_id AND user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION _is_pet_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION _is_pet_root(UUID) TO authenticated;
