-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 20260418 — Fix invite acceptance RLS
--
-- Problem (migration 044 regression):
--   pet_members_select: `user_id = auth.uid()` fails for pending invites
--     because pending invites have user_id IS NULL.
--   pet_members_update: same condition blocks the accepting co-tutor from
--     running UPDATE SET user_id=uid, accepted_at=now().
--
-- Fix: add a third condition to both policies that matches pending invite rows
-- accessible to any authenticated user who holds the token (token is a secret).
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Drop and recreate the two broken policies ─────────────────────────────────

DROP POLICY IF EXISTS pet_members_select ON pet_members;
DROP POLICY IF EXISTS pet_members_update ON pet_members;

-- SELECT: root sees all, active members see their pet rows, user sees own rows,
--         AND any authenticated user can read a pending (not yet accepted) invite row.
--         The token is treated as a capability — knowing it grants read access.
CREATE POLICY pet_members_select ON pet_members
  FOR SELECT USING (
    _is_pet_root(pet_id)
    OR _auth_user_is_active_member(pet_id)
    OR user_id = auth.uid()
    OR (
      user_id     IS NULL
      AND invite_token IS NOT NULL
      AND accepted_at  IS NULL
      AND is_active    = TRUE
    )
  );

-- UPDATE: any pet owner, the member themselves, OR the accepting co-tutor
--         updating a still-pending invite row (user_id will become auth.uid()).
CREATE POLICY pet_members_update ON pet_members
  FOR UPDATE USING (
    _is_pet_owner(pet_id)
    OR user_id = auth.uid()
    OR (
      user_id     IS NULL
      AND invite_token IS NOT NULL
      AND accepted_at  IS NULL
      AND is_active    = TRUE
    )
  );
