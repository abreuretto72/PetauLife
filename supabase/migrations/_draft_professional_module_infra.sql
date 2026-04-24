-- ═══════════════════════════════════════════════════════════════════════════
-- DRAFT — NÃO APLICAR ATÉ REVISÃO APROVADA
-- Fase 1 — Infraestrutura do módulo profissional (5 tabelas + RLS-on)
-- Projeto: peqpkzituzpwukzusgcq
-- Data da proposta: 2026-04-21
-- ═══════════════════════════════════════════════════════════════════════════
-- Princípios seguidos:
--   • Soft delete universal (is_active BOOLEAN DEFAULT true)
--   • FK convention: {tabela}_{coluna}_fkey (regra PostgREST do CLAUDE.md)
--   • Reuso dos helpers RLS existentes (is_pet_owner, is_pet_member, can_write_pet)
--   • Shape de access_grants espelha pet_members (accepted_at + expires_at + is_active)
--   • Modelo declarativo internacional — sem validação externa no MVP
--   • Hash SHA-256 para assinatura clínica (PKI real fica para pós-MVP)
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ───────────────────────────────────────────────────────────────────────────
-- 1. professionals — perfil profissional declarativo (internacional)
-- ───────────────────────────────────────────────────────────────────────────
-- Um registro por user que atua profissionalmente. users.role permanece
-- 'tutor_owner' — "ser profissional" é definido por existir aqui.
-- Dados de conselho/fiscal são DECLARADOS; verified_at fica NULL até o
-- Selo Verificado (feature futura) confirmar via adapter do país.

CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,

  -- Taxonomia fechada (10 valores)
  professional_type TEXT NOT NULL CHECK (professional_type IN (
    'veterinarian',   -- Médico veterinário
    'vet_tech',       -- Técnico / auxiliar veterinário
    'groomer',        -- Tosador / banhista
    'trainer',        -- Adestrador
    'walker',         -- Passeador / dog walker
    'sitter',         -- Pet sitter / cuidador em residência
    'boarding',       -- Hotelaria / hospedagem
    'shop_employee',  -- Funcionário de pet shop
    'ong_member',     -- Membro de ONG / protetor
    'breeder'         -- Criador
  )),

  -- Identificação internacional (declarativa — preservar como texto)
  country_code CHAR(2) NOT NULL,        -- ISO 3166-1 alpha-2 (BR, US, GB, MX, AR, PT, ES…)
  council_name TEXT,                     -- CRMV-SP, RCVS, AVMA, Colegio, OMV…
  council_number TEXT,                   -- número declarado
  fiscal_id_type TEXT,                   -- CNPJ, EIN, VAT, CUIT, NIPC…
  fiscal_id_value TEXT,                  -- valor declarado (máscara do país)

  -- Perfil público
  display_name TEXT NOT NULL,
  bio TEXT,
  languages TEXT[] DEFAULT ARRAY['pt-BR'],
  specialties TEXT[],                    -- livre: cardiology, dermatology…

  -- Selo Verificado (NULL = só declaração)
  verified_at TIMESTAMPTZ,
  verified_by TEXT,                      -- 'brasil_api', 'consulta_crm', 'manual_review'…
  verification_payload JSONB,

  -- Soft delete + auditoria
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX professionals_user_id_idx
  ON public.professionals(user_id) WHERE is_active = true;

CREATE INDEX professionals_type_country_idx
  ON public.professionals(professional_type, country_code) WHERE is_active = true;

COMMENT ON TABLE public.professionals IS
  'Perfil profissional declarativo internacional. Sem validação externa no MVP; '
  'verified_at preenchido apenas quando o Selo Verificado (feature futura) confirmar '
  'via adapter do país.';


-- ───────────────────────────────────────────────────────────────────────────
-- 2. access_grants — acesso tutor → profissional sobre um pet
-- ───────────────────────────────────────────────────────────────────────────
-- Espelha pet_members (role/accepted_at/expires_at/is_active) para que o
-- fluxo de convite-aceite-expiração seja idêntico ao círculo de cuidado
-- já existente.

CREATE TABLE public.access_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES public.users(id),  -- tutor que concedeu

  -- Role determina permissões (JOIN com role_permissions)
  role TEXT NOT NULL CHECK (role IN (
    'vet_full',       -- veterinário com escrita clínica
    'vet_read',       -- veterinário com leitura de histórico
    'vet_tech',       -- técnico (leitura + anotações limitadas)
    'groomer',
    'trainer',
    'walker',
    'sitter',
    'boarding',
    'shop_employee',
    'ong_member'
  )),

  -- Fluxo convite-aceite (idêntico a pet_members)
  invite_token TEXT UNIQUE,
  invite_sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,

  -- Escopo pontual (overrides)
  scope_notes TEXT,                      -- livre: "só durante internação 15-22/abr"
  can_see_finances BOOLEAN DEFAULT false,

  -- Soft delete + auditoria
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Um único grant ativo por (pet, profissional) — histórico de revogados fica
-- preservado com is_active=false (partial unique index permite múltiplos inativos)
CREATE UNIQUE INDEX access_grants_unique_active_idx
  ON public.access_grants(pet_id, professional_id)
  WHERE is_active = true;

CREATE INDEX access_grants_pet_valid_idx
  ON public.access_grants(pet_id)
  WHERE is_active = true AND accepted_at IS NOT NULL AND revoked_at IS NULL;

CREATE INDEX access_grants_professional_valid_idx
  ON public.access_grants(professional_id)
  WHERE is_active = true AND accepted_at IS NOT NULL AND revoked_at IS NULL;

CREATE INDEX access_grants_invite_token_idx
  ON public.access_grants(invite_token)
  WHERE invite_token IS NOT NULL;

COMMENT ON TABLE public.access_grants IS
  'Acesso concedido pelo tutor a um profissional sobre um pet. Role determina '
  'permissões via role_permissions. Mesmo shape de pet_members para UX consistente.';


-- ───────────────────────────────────────────────────────────────────────────
-- 3. role_permissions — matriz role × permission (seed no sub-passo 1.6)
-- ───────────────────────────────────────────────────────────────────────────
-- Canônica. has_pet_access() consulta aqui. Ajustável via UPDATE sem deploy.

CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,           -- bate com access_grants.role
  permission TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT false,

  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (role, permission),
  CHECK (permission IN (
    'read_clinical',    -- vacinas, exames, consultas, medicações, cirurgias
    'write_clinical',   -- criar registros clínicos (exige sign_clinical no write)
    'sign_clinical',    -- assinar digitalmente (hash SHA-256)
    'read_diary',
    'write_diary',
    'read_contact',     -- telefone/email do tutor
    'request_access',   -- pedir upgrade de role
    'export_data'       -- baixar PDF do prontuário
  ))
);

CREATE INDEX role_permissions_role_idx ON public.role_permissions(role);

COMMENT ON TABLE public.role_permissions IS
  'Matriz papel × permissão consultada por has_pet_access(). Editável via UPDATE — zero deploy.';


-- ───────────────────────────────────────────────────────────────────────────
-- 4. professional_signatures — selo SHA-256 em registros clínicos
-- ───────────────────────────────────────────────────────────────────────────
-- Imutabilidade clínica sem PKI complexa no MVP. Registro criado/editado
-- sob um grant ativo gera signature (hash do payload + contexto assinado).

CREATE TABLE public.professional_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id),
  access_grant_id UUID NOT NULL REFERENCES public.access_grants(id),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,

  -- Registro-alvo (polimórfico)
  target_table TEXT NOT NULL CHECK (target_table IN (
    'vaccines', 'allergies', 'exams', 'consultations',
    'medications', 'surgeries', 'chronic_conditions',
    'parasite_control', 'clinical_metrics', 'body_condition_scores',
    'photo_analyses', 'diary_entries'
  )),
  target_id UUID NOT NULL,

  -- Selo
  payload_hash TEXT NOT NULL,              -- SHA-256 hex (64 chars)
  payload_snapshot JSONB NOT NULL,         -- snapshot do registro no momento
  signature_version TEXT NOT NULL DEFAULT 'sha256-v1',

  -- Contexto assinado (snapshot do perfil — não muda se o profissional editar)
  signed_display_name TEXT NOT NULL,
  signed_council_name TEXT,
  signed_council_number TEXT,
  signed_as_declared BOOLEAN NOT NULL DEFAULT true,  -- true=declaração; false=Selo Verificado

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (target_table, target_id, payload_hash)
);

CREATE INDEX professional_signatures_target_idx
  ON public.professional_signatures(target_table, target_id);

CREATE INDEX professional_signatures_pet_idx
  ON public.professional_signatures(pet_id);

COMMENT ON TABLE public.professional_signatures IS
  'Selo SHA-256 de registros clínicos. MVP: hash + snapshot (declarativo). '
  'Futuro: PKI real com X.509.';


-- ───────────────────────────────────────────────────────────────────────────
-- 5. access_audit_log — auditoria estreita de eventos profissionais
-- ───────────────────────────────────────────────────────────────────────────
-- Complementar a audit_log (LGPD geral). Permite query "quem mexeu no
-- prontuário do Rex?" em uma tabela só.

CREATE TABLE public.access_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES public.users(id),
  professional_id UUID REFERENCES public.professionals(id),
  access_grant_id UUID REFERENCES public.access_grants(id),

  event_type TEXT NOT NULL CHECK (event_type IN (
    'grant_created',       -- tutor criou grant (convite enviado)
    'grant_accepted',      -- profissional aceitou
    'grant_rejected',      -- profissional recusou
    'grant_revoked',       -- tutor revogou
    'grant_expired',       -- expires_at atingido
    'clinical_read',       -- leu histórico clínico
    'clinical_write',      -- criou/alterou registro clínico
    'clinical_sign',       -- gerou signature
    'diary_read',
    'diary_write',
    'export_pdf'
  )),

  target_table TEXT,
  target_id UUID,
  context JSONB,                         -- livre: ip, user_agent, scope_notes snapshot…

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX access_audit_log_pet_idx
  ON public.access_audit_log(pet_id, created_at DESC);

CREATE INDEX access_audit_log_professional_idx
  ON public.access_audit_log(professional_id, created_at DESC)
  WHERE professional_id IS NOT NULL;

CREATE INDEX access_audit_log_event_idx
  ON public.access_audit_log(event_type, created_at DESC);

COMMENT ON TABLE public.access_audit_log IS
  'Auditoria estreita de eventos de acesso profissional (complementa audit_log). '
  'Responde rapidamente "quem acessou/mexeu no prontuário do Rex?".';


-- ───────────────────────────────────────────────────────────────────────────
-- Ativar RLS (policies vêm no sub-passo 1.4 — tabelas ficam TRANCADAS até lá)
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE public.professionals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_grants           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_audit_log        ENABLE ROW LEVEL SECURITY;


-- ───────────────────────────────────────────────────────────────────────────
-- Triggers de updated_at
-- ───────────────────────────────────────────────────────────────────────────
-- ATENÇÃO: verificar no sub-passo 1.5 se já existe public.set_updated_at() no
-- projeto. Se existir, descomentar só os CREATE TRIGGER. Se não existir,
-- criar a função antes.
--
-- CREATE TRIGGER professionals_set_updated_at
--   BEFORE UPDATE ON public.professionals
--   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--
-- CREATE TRIGGER access_grants_set_updated_at
--   BEFORE UPDATE ON public.access_grants
--   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--
-- CREATE TRIGGER role_permissions_set_updated_at
--   BEFORE UPDATE ON public.role_permissions
--   FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;

-- ───────────────────────────────────────────────────────────────────────────
-- Pós-aplicação (roda no sub-passo 1.5 depois de todas as migrations da Fase 1):
--   NOTIFY pgrst, 'reload schema';
-- ───────────────────────────────────────────────────────────────────────────
