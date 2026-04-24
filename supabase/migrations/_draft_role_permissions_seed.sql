-- ═══════════════════════════════════════════════════════════════════════════
-- DRAFT — NÃO APLICAR ATÉ REVISÃO APROVADA
-- Fase 1.6 — Seed da matriz role_permissions (10 papéis × 8 permissões)
-- Projeto: peqpkzituzpwukzusgcq
-- Data da proposta: 2026-04-21
-- Depende de: 20260421_professional_module_fase1.sql aplicado
-- ═══════════════════════════════════════════════════════════════════════════
-- Princípios:
--   • Fail-closed: toda combinação é explícita (true OU false) — 80 linhas
--   • Idempotente: ON CONFLICT atualiza allowed (permite ajuste via migration)
--   • Mudanças futuras da matriz = nova migration com UPDATE/UPSERT — nunca
--     DELETE físico (is_active não existe aqui; matriz é append/update-only)
--   • role e permission seguem os CHECKs declarados em fase1 — qualquer valor
--     novo precisa alterar o CHECK antes deste seed
-- ═══════════════════════════════════════════════════════════════════════════
-- Matriz aprovada (ver CLAUDE.md / histórico de decisões):
--
--   Papel           | R_cln W_cln S_cln | R_dry W_dry | R_ctc | Req_acc Exp_dat
--   ----------------|-------------------|-------------|-------|----------------
--   vet_full        |  T     T     T    |  T     T    |  T    |  T       T
--   vet_read        |  T     F     F    |  T     F    |  T    |  T       T
--   vet_tech        |  T     T     F    |  T     T    |  T    |  T       F
--   groomer         |  T     F     F    |  F     T    |  T    |  T       F
--   trainer         |  T     F     F    |  T     T    |  T    |  T       F
--   walker          |  T     F     F    |  F     T    |  T    |  F       F
--   sitter          |  T     F     F    |  T     T    |  T    |  T       F
--   boarding        |  T     F     F    |  T     T    |  T    |  T       F
--   shop_employee   |  F     F     F    |  F     F    |  T    |  F       F
--   ong_member      |  T     F     F    |  T     T    |  T    |  T       T
--
-- Total 'true' = 48 / 80
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- Idempotência: se o seed já foi aplicado e precisar ser ajustado, usa UPSERT.
-- UNIQUE (role, permission) foi declarado em fase1.

INSERT INTO public.role_permissions (role, permission, allowed) VALUES
  -- ───────────────────────── vet_full (pleno) ─────────────────────────
  ('vet_full',       'read_clinical',   true),
  ('vet_full',       'write_clinical',  true),
  ('vet_full',       'sign_clinical',   true),
  ('vet_full',       'read_diary',      true),
  ('vet_full',       'write_diary',     true),
  ('vet_full',       'read_contact',    true),
  ('vet_full',       'request_access',  true),
  ('vet_full',       'export_data',     true),

  -- ────────────────────── vet_read (somente leitura) ──────────────────
  ('vet_read',       'read_clinical',   true),
  ('vet_read',       'write_clinical',  false),
  ('vet_read',       'sign_clinical',   false),
  ('vet_read',       'read_diary',      true),
  ('vet_read',       'write_diary',     false),
  ('vet_read',       'read_contact',    true),
  ('vet_read',       'request_access',  true),
  ('vet_read',       'export_data',     true),

  -- ──────── vet_tech (escreve clínico, NÃO assina — cadeia DVM) ───────
  ('vet_tech',       'read_clinical',   true),
  ('vet_tech',       'write_clinical',  true),
  ('vet_tech',       'sign_clinical',   false),
  ('vet_tech',       'read_diary',      true),
  ('vet_tech',       'write_diary',     true),
  ('vet_tech',       'read_contact',    true),
  ('vet_tech',       'request_access',  true),
  ('vet_tech',       'export_data',     false),

  -- ───────── groomer (alergias impactam banho; registra sessão) ────────
  ('groomer',        'read_clinical',   true),
  ('groomer',        'write_clinical',  false),
  ('groomer',        'sign_clinical',   false),
  ('groomer',        'read_diary',      false),
  ('groomer',        'write_diary',     true),
  ('groomer',        'read_contact',    true),
  ('groomer',        'request_access',  true),
  ('groomer',        'export_data',     false),

  -- ─────── trainer (comportamento central — precisa ler diário) ───────
  ('trainer',        'read_clinical',   true),
  ('trainer',        'write_clinical',  false),
  ('trainer',        'sign_clinical',   false),
  ('trainer',        'read_diary',      true),
  ('trainer',        'write_diary',     true),
  ('trainer',        'read_contact',    true),
  ('trainer',        'request_access',  true),
  ('trainer',        'export_data',     false),

  -- ──────── walker (mínimo operacional: alergias + contato + log) ─────
  ('walker',         'read_clinical',   true),
  ('walker',         'write_clinical',  false),
  ('walker',         'sign_clinical',   false),
  ('walker',         'read_diary',      false),
  ('walker',         'write_diary',     true),
  ('walker',         'read_contact',    true),
  ('walker',         'request_access',  false),
  ('walker',         'export_data',     false),

  -- ──── sitter (cuidador prolongado: rotina + meds + contato) ─────────
  ('sitter',         'read_clinical',   true),
  ('sitter',         'write_clinical',  false),
  ('sitter',         'sign_clinical',   false),
  ('sitter',         'read_diary',      true),
  ('sitter',         'write_diary',     true),
  ('sitter',         'read_contact',    true),
  ('sitter',         'request_access',  true),
  ('sitter',         'export_data',     false),

  -- ──── boarding (hotelzinho: rotina + meds + contato + request) ──────
  ('boarding',       'read_clinical',   true),
  ('boarding',       'write_clinical',  false),
  ('boarding',       'sign_clinical',   false),
  ('boarding',       'read_diary',      true),
  ('boarding',       'write_diary',     true),
  ('boarding',       'read_contact',    true),
  ('boarding',       'request_access',  true),
  ('boarding',       'export_data',     false),

  -- ──────── shop_employee (apenas contato para entregas/recado) ───────
  ('shop_employee',  'read_clinical',   false),
  ('shop_employee',  'write_clinical',  false),
  ('shop_employee',  'sign_clinical',   false),
  ('shop_employee',  'read_diary',      false),
  ('shop_employee',  'write_diary',     false),
  ('shop_employee',  'read_contact',    true),
  ('shop_employee',  'request_access',  false),
  ('shop_employee',  'export_data',     false),

  -- ──── ong_member (cuidador não-clínico + export p/ prestação) ───────
  ('ong_member',     'read_clinical',   true),
  ('ong_member',     'write_clinical',  false),
  ('ong_member',     'sign_clinical',   false),
  ('ong_member',     'read_diary',      true),
  ('ong_member',     'write_diary',     true),
  ('ong_member',     'read_contact',    true),
  ('ong_member',     'request_access',  true),
  ('ong_member',     'export_data',     true)

ON CONFLICT (role, permission)
DO UPDATE SET
  allowed    = EXCLUDED.allowed,
  updated_at = NOW();

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════════
-- Verificações pós-aplicação (rodar manualmente, não são parte da migration):
--
--   -- 1. Contagem total
--   SELECT COUNT(*) AS total FROM public.role_permissions;  -- esperado: 80
--
--   -- 2. Contagem de 'true'
--   SELECT COUNT(*) AS allowed_true FROM public.role_permissions
--    WHERE allowed = true;                                  -- esperado: 48
--
--   -- 3. Pivot visual (confere contra a matriz deste arquivo)
--   SELECT role,
--          BOOL_OR(allowed) FILTER (WHERE permission='read_clinical')   AS r_cln,
--          BOOL_OR(allowed) FILTER (WHERE permission='write_clinical')  AS w_cln,
--          BOOL_OR(allowed) FILTER (WHERE permission='sign_clinical')   AS s_cln,
--          BOOL_OR(allowed) FILTER (WHERE permission='read_diary')      AS r_dry,
--          BOOL_OR(allowed) FILTER (WHERE permission='write_diary')     AS w_dry,
--          BOOL_OR(allowed) FILTER (WHERE permission='read_contact')    AS r_ctc,
--          BOOL_OR(allowed) FILTER (WHERE permission='request_access')  AS req,
--          BOOL_OR(allowed) FILTER (WHERE permission='export_data')     AS exp
--     FROM public.role_permissions
--    GROUP BY role
--    ORDER BY role;
--
--   -- 4. Sanity: cada papel tem exatamente 8 linhas
--   SELECT role, COUNT(*) FROM public.role_permissions
--    GROUP BY role HAVING COUNT(*) <> 8;                    -- esperado: 0 linhas
-- ═══════════════════════════════════════════════════════════════════════════
