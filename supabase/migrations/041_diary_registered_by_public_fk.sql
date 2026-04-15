-- Migration 041: Redirecionar FK de registered_by de auth.users para public.users
-- Motivo: PostgREST só consegue fazer JOIN em tabelas do schema public.
--         Com a FK apontando para auth.users, a query
--         registered_by_user:users!registered_by(full_name,email) retornava null.
--
-- Os UUIDs são idênticos entre auth.users e public.users (Supabase os sincroniza),
-- então a integridade referencial é mantida.

ALTER TABLE diary_entries
  DROP CONSTRAINT IF EXISTS diary_entries_registered_by_fkey;

ALTER TABLE diary_entries
  ADD CONSTRAINT diary_entries_registered_by_fkey
    FOREIGN KEY (registered_by) REFERENCES public.users(id) ON DELETE SET NULL;
