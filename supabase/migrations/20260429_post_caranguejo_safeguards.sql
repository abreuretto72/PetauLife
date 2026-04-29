-- ════════════════════════════════════════════════════════════════════════
-- Migration: post_caranguejo_safeguards
-- Aplicada via MCP em 2026-04-29 ~21:30 UTC.
-- Razão: Incidente em 2026-04-29 — agente IA com SUPABASE_SERVICE_ROLE_KEY
--        inseriu 3 pets ghost (`Bartolomeu_seed_8c`, `Caranguejo_seed_8d`,
--        `Pirata_seed_8d`) com 12+ diary_entries cada e populou embeddings RAG
--        em conta real (Belisario) e conta descartável (deletada). Cleanup
--        parcial deixou o Caranguejo orfão até descoberta pelo tutor.
-- Detalhes em: docs/incidents/2026-04-29_caranguejo_seed_8d.md
-- ════════════════════════════════════════════════════════════════════════

-- 1. CHECK constraint anti _seed_ em pets
ALTER TABLE public.pets
  ADD CONSTRAINT pets_name_no_seed_pattern
  CHECK (name !~* '_seed_');

-- 2. Estender audit_log com colunas forenses (jwt_role + jwt_claims)
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS jwt_role TEXT;
ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS jwt_claims JSONB;

-- 3. Estender a função de auditoria existente (CREATE OR REPLACE = não dropa triggers)
CREATE OR REPLACE FUNCTION public.trg_fn_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_changes JSONB;
  v_user_id UUID;
  v_record_id UUID;
  v_jwt_claims JSONB;
  v_jwt_role TEXT;
BEGIN
  v_user_id := auth.uid();

  -- Captura role JWT (NULL ou 'service_role' = bypass; 'authenticated' = sessão real)
  BEGIN
    v_jwt_claims := current_setting('request.jwt.claims', true)::jsonb;
    v_jwt_role := v_jwt_claims->>'role';
  EXCEPTION WHEN OTHERS THEN
    v_jwt_claims := NULL;
    v_jwt_role := NULL;
  END;

  IF TG_OP = 'INSERT' THEN
    v_record_id := NEW.id;
    v_changes := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_record_id := NEW.id;
    SELECT jsonb_object_agg(key, value) INTO v_changes
    FROM jsonb_each(to_jsonb(NEW))
    WHERE to_jsonb(NEW) ->> key IS DISTINCT FROM to_jsonb(OLD) ->> key;
  ELSIF TG_OP = 'DELETE' THEN
    v_record_id := OLD.id;
    v_changes := to_jsonb(OLD);
  END IF;

  IF v_changes IS NOT NULL AND v_changes != '{}'::jsonb THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, changes, jwt_role, jwt_claims)
    VALUES (
      v_user_id,
      TG_OP,
      TG_TABLE_NAME,
      v_record_id,
      v_changes,
      COALESCE(v_jwt_role, 'service_role_or_unknown'),
      v_jwt_claims
    );
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$function$;

-- 4. Adicionar trigger de auditoria em mood_logs (gap detectado no incidente)
DROP TRIGGER IF EXISTS trg_audit_mood_logs ON public.mood_logs;
CREATE TRIGGER trg_audit_mood_logs
  AFTER INSERT OR UPDATE OR DELETE ON public.mood_logs
  FOR EACH ROW EXECUTE FUNCTION public.trg_fn_audit_log();

-- 5. Index pra forense rápida (encontrar inserts via service-role/bypass)
CREATE INDEX IF NOT EXISTS audit_log_bypass_idx
  ON public.audit_log (table_name, action, created_at DESC)
  WHERE user_id IS NULL;

-- 6. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
