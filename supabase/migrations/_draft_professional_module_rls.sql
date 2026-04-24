-- ═══════════════════════════════════════════════════════════════════════════
-- DRAFT — NÃO APLICAR ATÉ REVISÃO APROVADA
-- Fase 1 — RLS policies das 5 tabelas do módulo profissional
-- Projeto: peqpkzituzpwukzusgcq
-- Data da proposta: 2026-04-21
-- Depende de:
--   • _draft_professional_module_infra.sql (tabelas + RLS enabled)
--   • _draft_has_pet_access_function.sql (função de autorização)
-- ═══════════════════════════════════════════════════════════════════════════
-- Princípios:
--   • Tudo negado por default; policies liberam casos específicos
--   • Sem DELETE direto em lugar nenhum (soft delete via is_active=false)
--   • Signatures e audit_log são append-only (imutáveis)
--   • Matriz role_permissions é "read-only para todos, escrita só via migration"
--   • Policies usam has_pet_access() sempre que a regra envolver o pet
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. professionals
-- ───────────────────────────────────────────────────────────────────────────
-- Visibilidade: o próprio profissional vê o próprio perfil. Tutores que têm
-- grant ativo vêem o perfil do profissional convidado (para listar "meus
-- profissionais" no app do tutor).
-- Criação/edição: apenas self. Sem DELETE — soft delete via is_active=false.

-- SELECT: self OR tutor que tem grant ativo apontando pra esse profissional
CREATE POLICY "professionals_select_self_or_grantor"
  ON public.professionals
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
        FROM public.access_grants ag
        JOIN public.pets p ON p.id = ag.pet_id
       WHERE ag.professional_id = professionals.id
         AND ag.is_active = true
         AND p.user_id = auth.uid()
    )
  );

-- INSERT: apenas self
CREATE POLICY "professionals_insert_self"
  ON public.professionals
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- UPDATE: apenas self
CREATE POLICY "professionals_update_self"
  ON public.professionals
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE: ninguém via API. Soft delete é via UPDATE is_active=false.


-- ───────────────────────────────────────────────────────────────────────────
-- 2. access_grants
-- ───────────────────────────────────────────────────────────────────────────
-- Visibilidade: o tutor dono do pet, o profissional convidado e membros ativos
-- do círculo de cuidado (co_parent precisa ver quem mais tem acesso).
-- INSERT: apenas o tutor dono do pet.
-- UPDATE: tutor dono (revogar, expirar, ajustar escopo) OU profissional
--         convidado (aceitar/recusar → preencher accepted_at).
-- DELETE: ninguém — soft delete via is_active=false.

-- SELECT: owner OR member OR profissional alvo
CREATE POLICY "access_grants_select_stakeholders"
  ON public.access_grants
  FOR SELECT
  TO authenticated
  USING (
    public.is_pet_owner(pet_id)
    OR public.is_pet_member(pet_id)
    OR EXISTS (
      SELECT 1 FROM public.professionals pr
       WHERE pr.id = access_grants.professional_id
         AND pr.user_id = auth.uid()
    )
  );

-- INSERT: só o tutor dono do pet concede acesso
CREATE POLICY "access_grants_insert_owner_only"
  ON public.access_grants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_pet_owner(pet_id)
    AND granted_by = auth.uid()
  );

-- UPDATE: tutor dono (revogar/ajustar) OU profissional alvo (aceitar)
-- Não dá para restringir por coluna via RLS direta (precisaria de trigger);
-- no app, garantir que o profissional só pode tocar em accepted_at/revoked_at
-- quando revoked_at = NULL.
CREATE POLICY "access_grants_update_owner_or_target"
  ON public.access_grants
  FOR UPDATE
  TO authenticated
  USING (
    public.is_pet_owner(pet_id)
    OR EXISTS (
      SELECT 1 FROM public.professionals pr
       WHERE pr.id = access_grants.professional_id
         AND pr.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_pet_owner(pet_id)
    OR EXISTS (
      SELECT 1 FROM public.professionals pr
       WHERE pr.id = access_grants.professional_id
         AND pr.user_id = auth.uid()
    )
  );

-- DELETE: ninguém.


-- ───────────────────────────────────────────────────────────────────────────
-- 3. role_permissions (tabela de referência — editável só via service_role)
-- ───────────────────────────────────────────────────────────────────────────
-- Qualquer autenticado lê (para o app mostrar "o que esse papel pode fazer").
-- Ninguém escreve via API — updates vêm por migration com service_role.

CREATE POLICY "role_permissions_select_all_authenticated"
  ON public.role_permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Sem INSERT/UPDATE/DELETE para authenticated. Service_role bypassa RLS.


-- ───────────────────────────────────────────────────────────────────────────
-- 4. professional_signatures (append-only, imutável)
-- ───────────────────────────────────────────────────────────────────────────
-- Visibilidade: qualquer um que já tem acesso ao pet pode ver os selos dos
-- seus registros (has_pet_access com read_clinical).
-- INSERT: só o próprio profissional, sob um grant válido, com permissão
--         sign_clinical na role. Todo o resto cai em write_clinical via
--         policies dos clínicos (fora do escopo desta Fase 1).
-- UPDATE/DELETE: ninguém. Selo é imutável por design.

CREATE POLICY "professional_signatures_select_with_pet_read"
  ON public.professional_signatures
  FOR SELECT
  TO authenticated
  USING (public.has_pet_access(pet_id, 'read_clinical'));

CREATE POLICY "professional_signatures_insert_by_professional"
  ON public.professional_signatures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- a) O profissional existe e é o próprio auth.uid()
    EXISTS (
      SELECT 1 FROM public.professionals pr
       WHERE pr.id = professional_signatures.professional_id
         AND pr.user_id = auth.uid()
         AND pr.is_active = true
    )
    -- b) O grant referenciado é válido
    AND EXISTS (
      SELECT 1 FROM public.access_grants ag
       WHERE ag.id              = professional_signatures.access_grant_id
         AND ag.professional_id = professional_signatures.professional_id
         AND ag.pet_id          = professional_signatures.pet_id
         AND ag.is_active       = true
         AND ag.accepted_at     IS NOT NULL
         AND ag.revoked_at      IS NULL
         AND (ag.expires_at IS NULL OR ag.expires_at > NOW())
    )
    -- c) A role do grant tem permissão sign_clinical
    AND public.has_pet_access(pet_id, 'sign_clinical')
  );

-- Sem UPDATE/DELETE. Imutável.


-- ───────────────────────────────────────────────────────────────────────────
-- 5. access_audit_log (append-only, imutável)
-- ───────────────────────────────────────────────────────────────────────────
-- Visibilidade: tutor dono do pet, membros do círculo E o próprio profissional
-- envolvido (pra poder ver seu histórico de atividade).
-- INSERT: quem está fazendo a ação registra seu próprio evento — policy checa
--         que actor_user_id = auth.uid(). Pragmática para MVP; futuro: mover
--         para SECURITY DEFINER helper log_access_event() para blindar forjas.
-- UPDATE/DELETE: ninguém.

CREATE POLICY "access_audit_log_select_stakeholders"
  ON public.access_audit_log
  FOR SELECT
  TO authenticated
  USING (
    public.is_pet_owner(pet_id)
    OR public.is_pet_member(pet_id)
    OR (
      professional_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.professionals pr
         WHERE pr.id = access_audit_log.professional_id
           AND pr.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "access_audit_log_insert_self_as_actor"
  ON public.access_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_user_id = auth.uid());

-- Sem UPDATE/DELETE. Imutável.


COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- Pontos conhecidos a revisitar pós-MVP:
--   • access_grants UPDATE: profissional pode tocar em qualquer coluna via
--     RLS pura. No app, gate por coluna (só permitir mudar accepted_at/
--     invite_token via edge function dedicada) OU usar trigger BEFORE UPDATE
--     para rejeitar mudanças indevidas quando auth.uid() != tutor.
--   • access_audit_log INSERT: permitir authenticated registrar seu próprio
--     evento é pragmático mas falsificável (cliente pode inventar event_type).
--     Produção: substituir por SECURITY DEFINER log_access_event() que
--     valida event_type contra contexto real.
--   • professionals SELECT: marketplace público de profissionais (listar vets
--     por região sem grant existente) fica para pós-MVP via view
--     public.professional_directory com colunas limitadas.
-- ═══════════════════════════════════════════════════════════════════════════
