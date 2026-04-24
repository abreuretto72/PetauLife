# Plano — Simplificação MVP do Módulo Profissional

**Data:** 2026-04-22
**Status:** DRAFT — aguardando aprovação para execução
**Origem:** conversa de revisão do fluxo de convite de profissionais

**Atualização 2026-04-22 (pós-audit):** nomes reais do schema confirmados — coluna de autoria é `user_id` (não `registered_by`); funções helpers existentes são `is_pet_owner()` / `is_pet_member()` / `can_write_pet()` (não existe `is_tutor_of_pet()`); apenas 5 das 8 tabelas clínicas precisam de upgrade RLS (3 já estão no padrão Opção B).

---

## 1. Decisões firmadas

Quatro decisões tomadas na conversa (registradas em memória):

1. **Papéis veterinários colapsam em um só.** Os três papéis `vet_full`, `vet_read`, `vet_tech` viram um único `vet`. Dropdown final tem 8 opções: Veterinário, Adestrador, Banho e tosa, Passeador, Pet sitter, Hospedagem, Pet shop, ONG.
2. **Tela de convite segue o Formato C.** Mantém pet + papel + email + prazo + scope/notas + resumo. O único campo que sai é o toggle "Pode ver finanças".
3. **Finanças são invioláveis para profissionais.** Nenhum papel, em nenhuma circunstância, acessa dados financeiros do tutor. O campo `can_see_finances` de `access_invites` e `access_grants` deixa de existir no produto (vira sempre `false`, ou é removido).
4. **Mutação por ownership (Opção B).** Qualquer profissional com grant ativo **cria** registros clínicos livremente. Para **editar/excluir**: só o autor original (`user_id = auth.uid()`) ou o tutor do pet (`is_pet_owner(pet_id)`). Outros profissionais leem mas não mexem.

**Nota de escopo:** `pet_members.can_see_finances` (co-parentalidade) fica intacto — é feature diferente, fora desta simplificação.

---

## 2. Escopo da mudança

### Muda
- `access_grants.role` — CHECK passa de 10 valores a 8
- `access_invites.role` — CHECK passa de 10 valores a 8
- `role_permissions` — deleta linhas de `vet_full`, `vet_read`, `vet_tech`; insere 1 linha `vet` (herda permissões de vet_full hoje)
- RLS de UPDATE/DELETE em **5 das 8 tabelas clínicas** (Gen 1 → Gen 2) — passa a exigir `is_pet_owner(pet_id) OR (can_write_pet(pet_id) AND user_id = auth.uid())`. As outras 3 tabelas (body_condition_scores, parasite_control, chronic_conditions) já usam esse padrão desde a migration `20260420_prontuario_vet_grade.sql`.
- `can_see_finances` em `access_grants` e `access_invites` — removido (ou forçado a `false` permanente, ver §8)
- Edge Functions: `professional-invite-create`, `professional-invite-accept` — removem leitura e escrita de `can_see_finances`, aceitam role `vet`
- Tutor UI: `partnerships/invite.tsx` — dropdown novo, remove toggle de finanças
- Tutor UI: `partnerships/index.tsx` — remove renderização de badge "Vê finanças"
- Pro UI: `invite/[token].tsx`, `pro/pet/[id].tsx` — removem exibição de "Pode ver finanças"
- Pro UI: `useMyPatients.ts` — remove campo do tipo
- i18n: remove `roles.vet_full/vet_read/vet_tech`; adiciona `roles.vet`; remove `invite.canSeeFinances` / `partnerships.canSeeFinances`

### NÃO muda
- `professionals.professional_type` — enum de "o que a pessoa é profissionalmente" fica com `veterinarian`, `vet_tech`, etc. É identidade, não permissão.
- `pet_members.can_see_finances` — feature de co-parentalidade fica intocada.
- `has_pet_access()` RPC — continua fazendo o join de `access_grants` com `role_permissions`. Vai funcionar igual, só que a matriz tem menos linhas.
- `get_pet_clinical_bundle` RPC — sem mudança.
- CRON `expire-pending-invites-hourly` — sem mudança.
- Fluxo de aceite do convite (deep-link) — mesmo.
- Funções helpers `is_pet_owner()`, `is_pet_member()`, `can_write_pet()` — já existem, apenas reaproveitadas.
- RLS de body_condition_scores, parasite_control, chronic_conditions — já implementam Opção B corretamente.

---

## 3. Migration SQL (review-only)

Arquivo proposto: `supabase/migrations/20260423_access_role_simplification.sql`

```sql
BEGIN;

-- 3.1 Migrar dados existentes antes de apertar o CHECK
UPDATE public.access_grants
   SET role = 'vet'
 WHERE role IN ('vet_full', 'vet_read', 'vet_tech');

UPDATE public.access_invites
   SET role = 'vet'
 WHERE role IN ('vet_full', 'vet_read', 'vet_tech');

-- 3.2 Trocar CHECK de access_grants.role
ALTER TABLE public.access_grants
  DROP CONSTRAINT IF EXISTS access_grants_role_check;
ALTER TABLE public.access_grants
  ADD CONSTRAINT access_grants_role_check CHECK (role IN (
    'vet', 'groomer', 'trainer', 'walker',
    'sitter', 'boarding', 'shop_employee', 'ong_member'
  ));

-- 3.3 Trocar CHECK de access_invites.role
ALTER TABLE public.access_invites
  DROP CONSTRAINT IF EXISTS access_invites_role_check;
ALTER TABLE public.access_invites
  ADD CONSTRAINT access_invites_role_check CHECK (role IN (
    'vet', 'groomer', 'trainer', 'walker',
    'sitter', 'boarding', 'shop_employee', 'ong_member'
  ));

-- 3.4 Reciclar role_permissions — remove os 3 vets, insere 1 vet unificado
DELETE FROM public.role_permissions
 WHERE role IN ('vet_full', 'vet_read', 'vet_tech');

INSERT INTO public.role_permissions (role, permission, allowed) VALUES
  ('vet', 'read_clinical',  true),
  ('vet', 'write_clinical', true),
  ('vet', 'sign_clinical',  true),
  ('vet', 'read_diary',     true),
  ('vet', 'write_diary',    true),
  ('vet', 'read_contact',   true),
  ('vet', 'request_access', true),
  ('vet', 'export_data',    true);

-- 3.5 Zerar can_see_finances (já que UI não envia mais)
-- Decisão: manter coluna por compatibilidade, mas força default false e zera existentes.
-- Se preferir DROP COLUMN, ver §8.
UPDATE public.access_grants  SET can_see_finances = false WHERE can_see_finances = true;
UPDATE public.access_invites SET can_see_finances = false WHERE can_see_finances = true;

-- 3.6 RLS — upgrade Gen 1 → Gen 2 em 5 tabelas clínicas
-- (as outras 3 — body_condition_scores, parasite_control, chronic_conditions —
-- já usam o padrão Gen 2 desde 20260420_prontuario_vet_grade.sql)
--
-- Tabelas a alterar: consultations, medications, exams, surgeries, clinical_metrics
-- Padrão (exemplo para consultations):
--
--   -- Drop Gen 1 (autor simples)
--   DROP POLICY IF EXISTS consultations_update ON public.consultations;
--   DROP POLICY IF EXISTS consultations_delete ON public.consultations;
--
--   -- Create Gen 2 (tutor OR autor-com-write-access)
--   CREATE POLICY consultations_update ON public.consultations
--     FOR UPDATE TO authenticated
--     USING (
--       is_pet_owner(pet_id)
--       OR (can_write_pet(pet_id) AND user_id = auth.uid())
--     );
--
--   CREATE POLICY consultations_delete ON public.consultations
--     FOR DELETE TO authenticated
--     USING (
--       is_pet_owner(pet_id)
--       OR (can_write_pet(pet_id) AND user_id = auth.uid())
--     );
--
-- (Repetir para medications, exams, surgeries, clinical_metrics. Lista completa na §4.)

NOTIFY pgrst, 'reload schema';

COMMIT;
```

**Reload obrigatório** após commit: `NOTIFY pgrst, 'reload schema'` (já incluso).

---

## 4. Policies RLS — lista completa por tabela

**Funções helpers (já existentes no schema — não criar):**
- `is_pet_owner(pet_id UUID) RETURNS BOOLEAN` — true se `auth.uid()` é owner (tutor principal)
- `is_pet_member(pet_id UUID) RETURNS BOOLEAN` — true se `auth.uid()` é co-parent via `pet_members`
- `can_write_pet(pet_id UUID) RETURNS BOOLEAN` — true se tem permissão de escrita (owner, co-parent com write, ou profissional com grant ativo + `write_clinical`)

**Coluna de autoria:** todas as 8 tabelas clínicas usam `user_id` (não existe `registered_by` nessas tabelas).

### Tabelas que PRECISAM do upgrade (5 — Gen 1 → Gen 2)

Estas têm hoje o padrão simples `auth.uid() = user_id`:

1. `consultations` (72 registros)
2. `medications` (3 registros)
3. `exams` (12 registros)
4. `surgeries` (0 registros)
5. `clinical_metrics` (64 registros)

Para cada uma:
- `DROP POLICY IF EXISTS <tabela>_update ON public.<tabela>`
- `DROP POLICY IF EXISTS <tabela>_delete ON public.<tabela>`
- `CREATE POLICY <tabela>_update` com `USING (is_pet_owner(pet_id) OR (can_write_pet(pet_id) AND user_id = auth.uid()))`
- `CREATE POLICY <tabela>_delete` idem

### Tabelas que JÁ ESTÃO CORRETAS (3 — nenhuma alteração)

Já usam o padrão Gen 2 desde `20260420_prontuario_vet_grade.sql`:

6. `chronic_conditions` (0 registros)
7. `parasite_control` (0 registros)
8. `body_condition_scores` (0 registros)

### SELECT / INSECT

Policies de SELECT e INSERT ficam intactas em todas as 8 tabelas:
- SELECT: já funciona via `has_pet_access` ou `is_pet_owner OR is_pet_member`
- INSERT: já exige `can_write_pet(pet_id) AND user_id = auth.uid()` (nas Gen 2) ou `auth.uid() = user_id` (nas Gen 1 — suficiente pro MVP; quem pode escrever precisa já ter acesso, validado no cliente e no JOIN)

### Auditoria de órfãos (rodada 2026-04-22)

| Tabela | total | sem_autor |
|---|---|---|
| exams | 12 | 0 |
| medications | 3 | 0 |
| consultations | 72 | 0 |
| surgeries | 0 | 0 |
| clinical_metrics | 64 | 0 |
| body_condition_scores | 0 | 0 |
| parasite_control | 0 | 0 |
| chronic_conditions | 0 | 0 |

**Resultado:** 151 registros totais, zero órfãos. A FK `user_id NOT NULL` manteve integridade desde o início. Sem cleanup necessário.

---

## 5. Edge Functions

### `professional-invite-create/index.ts`
- Remover aceitação de `can_see_finances` no body (linhas ~143, ~270, ~297)
- Validar `role` contra a lista nova de 8
- Inserir no DB com `can_see_finances: false` hardcoded (até coluna ser dropada em fase futura)
- Testar: payload sem `can_see_finances` ainda deve funcionar (default já é false)

### `professional-invite-accept/index.ts`
- Remover `can_see_finances` da projeção de SELECT (linha ~134)
- Remover do response body (linhas ~229, ~341)
- Sem mais mudanças

### `professional-invite-cancel/index.ts`
- Auditoria — não toca em role nem em finances. Sem mudança.

### `professional-invite-expire/index.ts`
- Idem — sem mudança.

### `invite-pet-member/index.ts` (co-parentalidade)
- NÃO TOCAR. É feature diferente, mantém `can_see_finances`.

---

## 6. Tutor UI

### `app/(app)/partnerships/invite.tsx`
- Zod schema: remove `can_see_finances` (linha 82)
- Form state: remove `canSeeFinances` useState + handler
- JSX: remove toggle de finanças + hint "Este papel não tem acesso a finanças"
- JSX: remove card de summary de finanças
- Dropdown de papel: 8 opções em vez de 10
- submit: remove `can_see_finances` do payload (linha 169)

### `app/(app)/partnerships/index.tsx`
- Remove renderização de badge "Vê finanças" nos cards de grant (linha 160) e de invite (linha 247)
- Sem mais mudanças

### `app/(app)/pro/pet/[id].tsx`
- Remove linha que mostra "Pode ver finanças" (linha 238)

### `app/(app)/invite/[token].tsx` (pro side — deep link)
- Remove exibição de `can_see_finances` (linhas 369-370)

### `hooks/useMyPatients.ts`
- Remove campo `can_see_finances` do tipo Patient (linha 44)

### `hooks/useTutorPartnerships.ts`
- Auditar — se tipa `can_see_finances`, remover

---

## 7. i18n

### Chaves a remover (pt-BR.json + en-US.json)
- `roles.vet_full`
- `roles.vet_read`
- `roles.vet_tech`
- `partnerships.canSeeFinances`
- `partnerships.invite.financesLabel`
- `partnerships.invite.financesHint`
- `partnerships.invite.financesDisabled`
- `invite.canSeeFinances` (pro deep-link)
- `invite.cannotSeeFinances` (pro deep-link)

### Chaves a adicionar
- `roles.vet` → "Veterinário" / "Veterinarian"

Total: **-9 chaves, +1 chave** em cada arquivo i18n.

---

## 8. Compatibilidade retroativa / pontos de decisão

### Decisão A — `can_see_finances`: dropar ou zerar?

**Opção 1 — Dropar coluna (mais limpo):**
```sql
ALTER TABLE public.access_grants DROP COLUMN can_see_finances;
ALTER TABLE public.access_invites DROP COLUMN can_see_finances;
```
Ganha: schema limpo, menos código morto. Perde: quebra qualquer deploy antigo das EFs que ainda referencia a coluna. Requer deploy das EFs novas ANTES da migration.

**Opção 2 — Zerar sem dropar (padrão do plano atual):**
Mantém coluna, força `false`. Código novo ignora. Em fase futura, dropa a coluna.
Ganha: zero risco, rollback trivial. Perde: coluna morta no schema.

**Recomendação:** Opção 2 pro MVP. Dropa depois quando estabilizar.

### Decisão B — Grants existentes com role antigo

A UPDATE da §3.1 renomeia todos `vet_full/vet_read/vet_tech` para `vet`. Efeito real:
- Profissional que tinha `vet_read` (leitura só) agora tem `vet` (escreve, assina). **Promoção silenciosa.**
- Profissional que tinha `vet_tech` (escreve mas não assina) agora assina.

No MVP em que ainda não tem base real com esses grants, é irrelevante. Mas **se houver dados de teste** com esses papéis, essa promoção acontece. Auditar `access_grants` e `access_invites` antes da migration:
```sql
SELECT role, COUNT(*) FROM public.access_grants GROUP BY role;
SELECT role, COUNT(*) FROM public.access_invites GROUP BY role;
```

### Decisão C — Registros antigos sem autor — RESOLVIDA (2026-04-22)

A coluna real de autoria é `user_id` (`NOT NULL`, FK para `users`), não `registered_by`. A integridade foi garantida pelo schema desde o início.

**Audit rodada:** 151 registros totais nas 8 tabelas, zero órfãos. Tabela completa na §4. Nenhuma mitigação necessária.

---

## 9. Ordem de execução proposta

1. ~~**Audit pré-migration**~~ — **CONCLUÍDO 2026-04-22:** 151 registros, zero órfãos; access_grants/access_invites vazios; nomes reais de coluna/função confirmados (ver §2 e §4).
2. ~~**Verificar/criar `is_tutor_of_pet()`**~~ — **N/A:** as funções `is_pet_owner()`, `is_pet_member()` e `can_write_pet()` já existem no schema. Nada a criar.
3. **Escrever migration completa** (§3 + §4) (20 min): `20260423_access_role_simplification.sql`.
4. **Aplicar em dev + NOTIFY pgrst** (5 min).
5. **Regenerar types** (`types/database.ts`) (2 min).
6. **Atualizar Edge Functions** (§5) (15 min): 2 EFs tocam.
7. **Deploy das EFs** (5 min).
8. **Atualizar UI** (§6) (30 min): 5 arquivos.
9. **Atualizar i18n** (§7) (5 min): 2 arquivos.
10. **`tsc --noEmit`** (2 min).
11. **Smoke test manual** (15 min): criar invite com role `vet`, aceitar, criar uma consulta, verificar que outro pro não consegue editar.
12. **Commit único** — `refactor(pro-module): simplify roles to 8 + tighten clinical mutations`.

**Total estimado:** ~1h40min (audit + função helper já resolvidos).

---

## 10. Riscos e mitigações

| Risco | Mitigação |
|-------|-----------|
| Migration aplica mas EFs antigas quebram | Aplicar migration ANTES de trocar tela — EFs leem role antigo ainda funcionam via CHECK já atualizado; mas payload com role antigo (ex: `vet_full`) falha. Solução: tutor UI já só manda os 8 novos. |
| Policy RLS bloqueia tutor | As funções `is_pet_owner()` e `can_write_pet()` já estão em produção (4 tabelas da Gen 2 as usam). Teste SQL confirmando que tutor consegue editar consulta criada por profissional antes do commit. |
| `pet_members.can_see_finances` ser confundido com acesso pro | Memória já distingue. Ninguém toca nesse campo na migration. |
| Regressão no deep-link de accept | EF `professional-invite-accept` ainda lê `can_see_finances` do invite e retorna no body. Remoção tem que ser sincronizada com o tipo em `app/(app)/invite/[token].tsx`. |
| TSC quebrar em hook não-listado | Rodar grep final antes do commit: `grep -rn "can_see_finances\|vet_full\|vet_read\|vet_tech" app/ hooks/ lib/ components/` — zero resultados esperados. |

---

## 11. Critério de aceite

- [ ] Migration aplicada, `NOTIFY pgrst` feito, zero CHECK violation em dados existentes
- [ ] `SELECT * FROM role_permissions WHERE role LIKE 'vet%'` retorna só 8 linhas (role=`vet`)
- [ ] Tutor consegue criar invite com role `vet`, passeador, sitter, etc.
- [ ] Tela de convite tem 8 opções no dropdown, sem toggle de finanças
- [ ] Profissional A cria consulta → profissional B (com grant ativo no mesmo pet) NÃO consegue editar (RLS bloqueia) → tutor consegue editar (RLS passa)
- [ ] Nas 5 tabelas alteradas (consultations, medications, exams, surgeries, clinical_metrics), UPDATE/DELETE policies exigem `is_pet_owner(pet_id) OR (can_write_pet(pet_id) AND user_id = auth.uid())`
- [ ] `tsc --noEmit` zero erros
- [ ] `grep -rn "vet_full\|vet_read\|vet_tech\|can_see_finances" app/ hooks/ lib/` retorna só comentários / arquivos não-TS

---

## 12. Fora do escopo (adiado pra depois)

- DROP COLUMN `can_see_finances` (faz em fase seguinte, quando o código estiver estabilizado)
- Unificar `professional_type` — é identidade do profissional, não permissão. Fica como está.
- UI de "transferência de responsabilidade" entre vets (cenário em que um tutor quer que outro vet edite os registros do antigo). Fora do MVP.
- Granularidade de permissão volta (futuro B2B clínica): separar `sign_clinical` por DVM vs tech de novo.

---

## 13. Aprovação

Ao aprovar este plano, o passo 1 (audit pré-migration) é o primeiro trigger. Nada é tocado antes dos COUNTs da §8.2.
