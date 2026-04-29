# Incidente — pet `Caranguejo_seed_8d` inserido sem origem identificada

**Data do incidente:** 2026-04-29 03:14:14.826987 UTC (00:14 horário Brasília)
**Detectado em:** 2026-04-29, durante depuração do erro `[validate:fetchPets:owned]` no Hub
**Investigado por:** sessão Cowork Claude
**Status:** removido fisicamente do banco em transação atômica única (ver SQL abaixo)

---

## Sumário

Pet `Caranguejo_seed_8d` (ID `6519abc0-cd66-489a-a320-3505dcafb98d`) apareceu na conta do tutor real (`1f7e2b91-91dd-400b-be03-0c82ba2b1b3e`) sem nenhuma ação por parte dele.

**Inserido junto com o pet, no mesmíssimo timestamp (mesma transação):**

- 12 linhas em `diary_entries` — conteúdo idêntico `"Rotina ativa."`, `mood_id='calm'`, `entry_date` espaçada a cada 2 dias entre 23/03 e 14/04
- 12 linhas em `mood_logs` — `score=65`, `mood_id='calm'`, `source='ai_diary'`

Atualizado às 13:21:43 UTC do mesmo dia (operação não identificada — possivelmente backfill em background).

## Assinatura técnica do bypass

Em todas as 12 entradas de diário:

- `created_by` = NULL
- `registered_by` = NULL
- `updated_by` = NULL

O fluxo normal do app preenche esses campos automaticamente (via `useDiaryEntry.ts` e `AddPetModal`).
NULL nesses três campos = inserção via **service-role key** (bypass de RLS).

## Vetores possíveis (em ordem de probabilidade)

1. **Sessão de agente IA (Claude/Cursor/MCP) com `SUPABASE_SERVICE_ROLE_KEY` configurada** — o sufixo `_seed_8d` casa exatamente com a nomenclatura interna das Camadas 8 da IA Proativa (`8a`, `8b`, `8c`, `8d`); 12 entries com texto sintético idêntico espaçadas a cada 2 dias é padrão clássico para alimentar baseline/silent_anomaly.
2. **Insert manual via Supabase Studio** — dificilmente alguém digitaria `_seed_8d` à mão, mas SQL pode ter sido colado.
3. **Script local não versionado** — git status não mostra nada novo, mas pode ter sido apagado depois.
4. **Acesso indevido (conta comprometida)** — improvável dado o padrão de teste inócuo.

## Confirmação por logs Supabase

- Zero `ai_invocations` no intervalo 03:00–03:30 UTC do dia 29 para esse user_id.
- Zero `edge_function_diag_logs` no intervalo.
- Zero registros em `auth.audit_log_entries` (Supabase faz purge curta dessa tabela).

## Confirmação no repositório

- String `Caranguejo` não existe em código, docs, testes, scripts, histórico Git nem em stash.
- Padrão `_seed_<n>d` não existe em lugar nenhum.
- Único `INSERT INTO pets` versionado é em `supabase/seeds/proactive_test_data.sql` (cria a Frida, não a Caranguejo).
- E2E (`scripts/e2e_block_*.ts`) cria pets `Pet-XXXXXX` em tutores de teste novos, nunca no user_id real.

## Snapshot da evidência (preservado antes do delete)

O JSON completo do pet + 12 diary_entries + 12 mood_logs foi capturado via SELECT
e está documentado neste arquivo (campos críticos abaixo).

### Pet
- id: `6519abc0-cd66-489a-a320-3505dcafb98d`
- user_id: `1f7e2b91-91dd-400b-be03-0c82ba2b1b3e`
- name: `Caranguejo_seed_8d`
- species: `cat`
- breed: `SRD`
- sex: `unknown`
- weight_kg: 4.5
- birth_date: `2020-01-01`
- estimated_age_months: 75
- happiness_score: 65
- current_mood: `calm`
- created_at: `2026-04-29T03:14:14.826987+00:00`
- updated_at: `2026-04-29T13:21:43.967333+00:00`

### Diary entries (12) — IDs
```
101a0e8c-2edd-49ea-9218-e4a829bab2c3 (entry_date 2026-04-14)
b6d3cbb6-225c-433e-9763-22cad6cd13a7 (entry_date 2026-04-12)
6e987d3b-60a2-4116-aeb1-a04c3e381220 (entry_date 2026-04-10)
23346308-0af8-4c6e-8666-126f15568d74 (entry_date 2026-04-08)
009704d3-e84c-4b9c-bfdf-8b19e7f14600 (entry_date 2026-04-06)
361af12b-8f0b-4d24-9d0b-88264859bca7 (entry_date 2026-04-04)
7ed3af69-6bf4-4141-b000-3a241d1b46f4 (entry_date 2026-04-02)
c5f17b99-0aed-4414-85e1-773c247413f8 (entry_date 2026-03-31)
7cda9a6b-4322-487b-ba4b-1127f39b8545 (entry_date 2026-03-29)
1ff48591-707b-4542-83e1-049a020a071b (entry_date 2026-03-27)
e6478fdf-746a-4d09-a979-4bc509789aa9 (entry_date 2026-03-25)
1f34c499-cd9d-42f9-a09a-38e165cf1d1d (entry_date 2026-03-23)
```

### Mood logs (12) — IDs
```
eb53ae68-ecd3-4fe3-83ec-538efa1d5193
4a0dd4a3-4eff-4cdc-8a08-587458e3874c
a43a7020-7dcb-4025-a4a7-8997882d9ecc
63cc184d-a469-4fb7-9bd1-c6da46103293
72e339fe-83db-42d9-8a8b-b04e3393ce76
09ab19e0-a05f-4a86-9c22-adb16ee9cf6b
3923aafa-936b-47fa-86fb-bf6f7df183a6
383a24ca-ffbf-4fa4-b352-8a65c891c198
b402ded7-8edf-4e1f-acba-06598fc46acf
cd1c63c6-d11f-4787-b7c8-4142d3770a65
a6c6990f-770a-4f17-857f-3e41262db2ad
a7684b9c-4d2c-44b7-aaa7-44944d5dd8fe
```

## Ação executada

```sql
BEGIN;
DELETE FROM mood_logs     WHERE pet_id = '6519abc0-cd66-489a-a320-3505dcafb98d';
DELETE FROM diary_entries WHERE pet_id = '6519abc0-cd66-489a-a320-3505dcafb98d';
DELETE FROM pets          WHERE id     = '6519abc0-cd66-489a-a320-3505dcafb98d';
COMMIT;
```

(Resultado registrado no item "Salvaguardas implementadas" abaixo.)

## Escopo total do incidente (descoberto via `audit_log`)

Janela do incidente: 02:43–03:19 UTC do dia 29/04 (≈36 minutos).
Todos os eventos com `auth.uid() = NULL` (assinatura de bypass via service-role).

| Hora UTC | Evento | Pet | Conta afetada |
|---|---|---|---|
| 02:43:32 | INSERT | `Bartolomeu_seed_8c` (dog) + 3 entries | Belisario (`1f7e2b91…`) |
| 02:45:28 | DELETE | `Bartolomeu_seed_8c` + 3 entries | Belisario (cleanup OK) |
| 03:14:14 | INSERT | `Caranguejo_seed_8d` (cat) + 12 entries + 12 mood_logs + 107 embeddings | Belisario (cleanup esquecido) |
| 03:17:34 | INSERT | `Pirata_seed_8d` (cat) + 12 entries | Conta descartável (`9e75cc81…`) |
| 03:19:20 | DELETE | `Pirata_seed_8d` + 12 entries | Conta descartável (cleanup OK) |
| 13:21:43 | UPDATE (auth.uid=Belisario) | Caranguejo — sync de idade pelo app | Belisario abrindo o Hub |
| 21:09:50 | DELETE | Caranguejo + dependências (107 embeddings + 12 entries + 12 mood_logs) | Operação SQL desta sessão |

**Tutores afetados:**

- `1f7e2b91-91dd-400b-be03-0c82ba2b1b3e` — Belisario (Abreu, dono real do app). 2 pets ghost.
- `9e75cc81-d5b0-4db8-a41d-0592d3ca5735` — **conta descartável que não existe mais** em auth.users nem em public.users. Provavelmente criada pelo próprio agente que fez o seed e deletada após o teste.

**Nenhum outro tutor real** foi afetado neste incidente. Roberta Naddeo (beta-tester real) tem 2 deletes em 18/04 19:24:30 sob a mesma assinatura, mas:
- 11 dias antes do incidente
- Pets nomeados "Mana" (não `_seed_*`)
- Ocorrem 15 minutos após criação da conta dela
- Padrão consistente com cleanup de duplicata durante onboarding, não com este teste

## Conclusão sobre o autor do incidente

Quase certamente um **agente IA automatizado** (Claude Code, Cursor ou similar) com MCP do Supabase configurado com a `SUPABASE_SERVICE_ROLE_KEY`. Indicadores:

- Timing de madrugada (00:14–00:19 Brasília)
- Padrão sistemático: 8c → 8d em duas contas
- Cleanup parcial (típico de agente que processa em paralelo e perde uma task)
- Sofisticação técnica (populou também os 107 embeddings RAG, indicando que rodou o backfill-pet-rag)
- Conhecimento profundo da nomenclatura interna do projeto (`8c`, `8d` = sub-fases L8 da IA Proativa que vocês entregaram nesse mesmo PR)

## Salvaguardas implementadas pós-incidente

Aplicadas via migration `20260429_post_caranguejo_safeguards`:

1. **CHECK constraint `pets_name_no_seed_pattern`** em `pets`: bloqueia qualquer insert/update com `_seed_` no nome (regex `name !~* '_seed_'`). Validado em produção: tentativa de inserir `TesteCheck_seed_999` via service-role retorna `ERROR 23514`. Mesmo bypass de RLS não passa por CHECK.
2. **`audit_log` estendido** com colunas `jwt_role TEXT` e `jwt_claims JSONB`. A função `trg_fn_audit_log` agora captura o role do JWT em cada evento — `service_role_or_unknown` em bypass, `authenticated` em sessão real.
3. **Trigger `trg_audit_mood_logs`** adicionado em `mood_logs` (gap detectado: a tabela estava sem auditoria; o incidente populou 12 mood_logs sem registro).
4. **Index parcial `audit_log_bypass_idx`** em `audit_log (table_name, action, created_at DESC) WHERE user_id IS NULL` — torna queries forenses de bypass instantâneas.

## Inventário da `SUPABASE_SERVICE_ROLE_KEY` (29/04, pós-mitigação)

Resultado da varredura no repo local:

| Arquivo | Conteúdo | gitignored |
|---|---|---|
| `.env` | só `EXPO_PUBLIC_SUPABASE_ANON_KEY` (chave anon, pública) | ✅ |
| `.env.local` | `EXPO_PUBLIC_SUPABASE_ANON_KEY`, ANTHROPIC, GEMINI, GOOGLE, REVENUECAT, OPENAI, PEXELS, OPENWEATHER | ✅ |
| `admin-dashboard/.env.local` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` (chave anon, pública) | ✅ |
| `admin-dashboard/.env.example` | apenas template, sem valores | ❌ (template é commitado) |
| `package-lock.json` | hashes de integridade (não são keys) | ❌ (lockfile é commitado) |

**A `SUPABASE_SERVICE_ROLE_KEY` não está em arquivo nenhum do projeto.** Logo:

- Não houve vazamento via repositório.
- O agente que fez o incidente usou a chave a partir de **fonte externa ao repo** — provavelmente:
  - configuração MCP do Supabase em algum cliente IA (Claude Code, Cursor, Claude Desktop) instalado na máquina do dev
  - variável de ambiente do SO
  - Supabase Studio (autenticação própria, não persiste chave)

## Recomendações pós-incidente

1. **Verificar configs MCP** em Claude Code / Cursor / Claude Desktop / outros clientes IA que rodam localmente — qualquer agente com MCP do Supabase tem o poder de repetir esse incidente.
2. **Considerar rotacionar a service-role key** no Supabase Dashboard mesmo sem evidência de leak no repo — custo baixo (zero atualizações no projeto, só nos MCPs externos onde estiver configurada) e elimina o risco residual.
3. **Auditoria periódica** com query simples:
   ```sql
   SELECT table_name, action, COUNT(*) AS bypass_events
     FROM audit_log
    WHERE user_id IS NULL
      AND jwt_role = 'service_role_or_unknown'
      AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY table_name, action
    ORDER BY bypass_events DESC;
   ```
   Roda em qualquer momento — agora com index `audit_log_bypass_idx`, é instantânea.

## Observação sobre os triggers BEFORE INSERT existentes (`audit_diary_entries`, `delete_audit_diary`)

Esses triggers populam os campos `created_by`/`updated_by`/`deleted_by` em `diary_entries` quando há `auth.uid()` disponível. No incidente, ficaram NULL — isso significa que a função `set_audit_fields` faz `IF auth.uid() IS NULL THEN return NEW;` sem preencher, deixando os campos NULL silenciosamente. Não é bug — é comportamento esperado pra acomodar EFs legítimas em background — mas é a razão pela qual o bypass passou por esse trigger sem deixar rastro nesses campos. O `audit_log` da função `trg_fn_audit_log` é o mecanismo definitivo de rastreamento, e foi onde encontramos a evidência forense.
