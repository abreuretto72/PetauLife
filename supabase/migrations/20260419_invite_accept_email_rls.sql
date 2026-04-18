-- Migration: email-based invite auto-accept
-- Replaces the permissive token-based policies with email-scoped ones.
-- Users can only read/accept invites addressed to their own email.

-- Drop old permissive policies
DROP POLICY IF EXISTS "authenticated_can_read_pending_invites" ON pet_members;
DROP POLICY IF EXISTS "authenticated_can_accept_invites"       ON pet_members;

-- SELECT: user can only see pending invites addressed to their email
CREATE POLICY "users_can_read_own_email_invites"
ON pet_members FOR SELECT
TO authenticated
USING (
  email = (auth.jwt() ->> 'email')
  AND user_id IS NULL
  AND accepted_at IS NULL
  AND is_active = TRUE
);

-- UPDATE: user can only accept invites addressed to their email
-- WITH CHECK ensures they can only set user_id to their own uid
CREATE POLICY "users_can_accept_own_email_invites"
ON pet_members FOR UPDATE
TO authenticated
USING (
  email = (auth.jwt() ->> 'email')
  AND user_id IS NULL
  AND accepted_at IS NULL
  AND is_active = TRUE
)
WITH CHECK (
  user_id = auth.uid()
);
