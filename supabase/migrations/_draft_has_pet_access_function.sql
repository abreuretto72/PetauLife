-- ═══════════════════════════════════════════════════════════════════════════
-- DRAFT — NÃO APLICAR ATÉ REVISÃO APROVADA
-- Fase 1 — Função central de autorização: has_pet_access(pet_id, permission)
-- Projeto: peqpkzituzpwukzusgcq
-- Data da proposta: 2026-04-21
-- Depende de: _draft_professional_module_infra.sql ter sido aplicado antes
-- ═══════════════════════════════════════════════════════════════════════════
-- Princípios:
--   • Single source of truth para autorização nas 5 tabelas novas e em policies
--     futuras dos clínicos existentes (vaccines, consultations, etc.)
--   • Delegação (não duplicação) aos helpers já existentes:
--       - is_pet_owner(p_pet_id) → tutor dono
--       - is_pet_member(p_pet_id) → círculo de cuidado (co_parent/caregiver)
--   • Profissionais resolvem via JOIN access_grants → role_permissions
--   • SECURITY DEFINER + STABLE + search_path fixo (padrão dos helpers atuais)
--   • Fail-closed: qualquer caminho que não passe nos checks retorna false
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

CREATE OR REPLACE FUNCTION public.has_pet_access(
  p_pet_id     UUID,
  p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = 'public, pg_catalog'
AS $function$
DECLARE
  v_user_id   UUID := auth.uid();
  v_allowed   BOOLEAN;
BEGIN
  -- 1. Sem auth.uid() → sem acesso (fail-closed)
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- 2. Owner do pet: curto-circuita tudo (tutor tem acesso pleno ao próprio pet)
  IF public.is_pet_owner(p_pet_id) THEN
    RETURN true;
  END IF;

  -- 3. Membro do círculo de cuidado (pet_members ativo+aceito+não expirado):
  --    delega ao helper existente. Hoje só 'co_parent' está em uso — são
  --    "quase-tutores", portanto acesso pleno ao pet.
  --    Nota: quando pet_members ganhar roles mais restritas (ex.: 'visitor'),
  --    refatorar este ramo para delegar a can_write_pet / helper granular.
  IF public.is_pet_member(p_pet_id) THEN
    RETURN true;
  END IF;

  -- 4. Profissional: encontrar grant válido e checar matriz role × permission
  SELECT COALESCE(rp.allowed, false)
    INTO v_allowed
    FROM public.professionals pr
    JOIN public.access_grants ag
      ON ag.professional_id = pr.id
     AND ag.pet_id          = p_pet_id
     AND ag.is_active       = true
     AND ag.accepted_at     IS NOT NULL
     AND ag.revoked_at      IS NULL
     AND (ag.expires_at IS NULL OR ag.expires_at > NOW())
    JOIN public.role_permissions rp
      ON rp.role       = ag.role
     AND rp.permission = p_permission
   WHERE pr.user_id   = v_user_id
     AND pr.is_active = true
   LIMIT 1;

  RETURN COALESCE(v_allowed, false);
END;
$function$;

COMMENT ON FUNCTION public.has_pet_access(UUID, TEXT) IS
  'Autorização central para acesso a dados do pet. '
  'Owner e membros do círculo de cuidado curto-circuitam (acesso pleno). '
  'Profissionais resolvem via access_grants ativo+aceito+não expirado JOIN role_permissions. '
  'Permissões válidas: read_clinical, write_clinical, sign_clinical, read_diary, '
  'write_diary, read_contact, request_access, export_data.';

-- Permissão de execução: authenticated (padrão das funções RLS do projeto).
-- Supabase executa helpers em RLS policies via o role "authenticated".
GRANT EXECUTE ON FUNCTION public.has_pet_access(UUID, TEXT) TO authenticated;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- Teste manual depois de aplicar (ainda em 1.8, não agora):
--   SELECT public.has_pet_access('<pet_uuid>', 'read_clinical');
--   -- rodando como tutor do pet → true
--   -- rodando como profissional sem grant → false
--   -- rodando como profissional com grant 'vet_full' e permissão existente → true
-- ═══════════════════════════════════════════════════════════════════════════
