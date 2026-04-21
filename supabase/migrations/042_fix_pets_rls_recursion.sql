-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 042 — Fix infinite RLS recursion on pets table
--
-- Root cause:
--   pets_select policy (migration 034) queries pet_members via subquery.
--   pet_members_owner policy (migration 034) queries pets via direct subquery.
--   This creates a circular dependency:
--     pets → pet_members (via pets_select) → pets (via pet_members_owner) → ∞
--
-- Fix:
--   Replace pet_members_owner's direct `pets` subquery with _is_pet_root(),
--   which is SECURITY DEFINER and bypasses pets RLS, breaking the loop.
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop the policy that causes the recursion
DROP POLICY IF EXISTS pet_members_owner ON pet_members;

-- Recreate using SECURITY DEFINER function to avoid circular RLS reference
-- _is_pet_root() checks pets.user_id = auth.uid() with SECURITY DEFINER,
-- so it does NOT trigger the pets RLS policies.
CREATE POLICY pet_members_owner ON pet_members
  FOR ALL
  USING (_is_pet_root(pet_id));
