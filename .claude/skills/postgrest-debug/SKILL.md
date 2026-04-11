---
name: postgrest-debug
description: |
  Use when: debugging Supabase PostgREST queries, JOIN errors, FK constraint
  failures, zero results, PGRST errors, relationship errors, schema reload,
  fetchDiaryEntries, diary_entries queries, is_active filter, SELECT on Supabase,
  "Could not find a relationship", "ambiguous FK", PostgREST 400/401.
  Trigger with: PostgREST, PGRST, JOIN, FK, Supabase query, fetchDiaryEntries,
  zero results, relationship error, select(), NOTIFY pgrst, is_active.
---

# PostgREST Debug — auExpert

## REGRA 1 — JOIN com múltiplas FKs para a mesma tabela

Quando `diary_entries` tem mais de uma FK para a mesma tabela, PostgREST retorna
erro de ambiguidade. Usar o nome exato da constraint:

```typescript
// ✅ CORRETO — nome exato da constraint FK:
.select('*, profiles!diary_entries_user_id_fkey(name, avatar_url)')

// ❌ ERRADO — ambíguo quando há múltiplas FKs para a mesma tabela:
.select('*, profiles(name)')
```

### Descobrir o nome da constraint
```sql
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f'
  AND conrelid = 'public.diary_entries'::regclass;
```

---

## REGRA 2 — `select('*')` para evitar erros de relationship

O `DIARY_MODULE_SELECT` usa `'*'` simples. Não reintroduzir JOINs sem validar constraints.

```typescript
const DIARY_MODULE_SELECT = '*';

const { data, error } = await supabase
  .from('diary_entries')
  .select(DIARY_MODULE_SELECT)
  .eq('pet_id', petId)
  .eq('is_active', true)          // ← SEMPRE filtrar soft delete
  .order('created_at', { ascending: false });
```

---

## REGRA 3 — FKs para `public.users`, NUNCA `auth.users`

FKs apontando para `auth.users` são **invisíveis ao PostgREST**.

```sql
-- ❌ Invisível ao PostgREST:
REFERENCES auth.users(id)

-- ✅ Visível ao PostgREST:
REFERENCES public.users(id)

-- Verificar FK incorreta:
SELECT conname, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f'
  AND conrelid = 'public.diary_entries'::regclass
  AND confrelid::regclass::text LIKE 'auth%';

-- Corrigir:
ALTER TABLE public.diary_entries
  DROP CONSTRAINT diary_entries_user_id_fkey;
ALTER TABLE public.diary_entries
  ADD CONSTRAINT diary_entries_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id);
NOTIFY pgrst, 'reload schema';
```

---

## REGRA 4 — `NOTIFY pgrst, 'reload schema'` obrigatório após FK migrations

**Quando rodar:**
- Após qualquer `ADD CONSTRAINT FOREIGN KEY`
- Após `DROP CONSTRAINT`
- Após criar tabelas com FKs
- Quando query funcionava e passou a dar erro de relationship

```sql
-- Sempre o último passo de migrations com FK:
ALTER TABLE public.diary_entries ADD COLUMN ...;
NOTIFY pgrst, 'reload schema';
```

---

## REGRA 5 — Soft delete: `is_active = false` (não `deleted_at`)

```typescript
// ❌ Projeto usa is_active, não deleted_at:
.is('deleted_at', null)

// ✅ Correto para auExpert:
.eq('is_active', true)

// Soft delete correto:
await supabase
  .from('diary_entries')
  .update({ is_active: false })
  .eq('id', id)
```

---

## REGRA 6 — `execute_sql` do MCP não suporta `UNION ALL` bare

```sql
-- ❌ Falha no execute_sql:
SELECT * FROM table_a UNION ALL SELECT * FROM table_b;

-- ✅ Com subquery wrapper:
SELECT * FROM (
  SELECT * FROM table_a
  UNION ALL
  SELECT * FROM table_b
) combined;
```

---

## REGRA 7 — Verificar nomes REAIS antes de qualquer query

Nunca inventar nomes de colunas ou tabelas.

```sql
-- Colunas de uma tabela:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'diary_entries' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Todas as tabelas:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- RPCs disponíveis:
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public';
```

---

## Diagnóstico rápido de zero results

```typescript
// 1. Verificar is_active (mais comum):
.eq('is_active', true)   // ← esquecer isso = zero results

// 2. Verificar pet_id (UUID correto):
console.log('[fetchDiaryEntries] pet_id:', petId, typeof petId);

// 3. Testar no SQL Editor:
SELECT * FROM diary_entries WHERE pet_id = 'uuid' AND is_active = true LIMIT 5;

// 4. Ver RLS policies:
SELECT * FROM pg_policies WHERE tablename = 'diary_entries';

// 5. Forçar erro visível:
const { data, error } = await supabase
  .from('diary_entries')
  .select('*')
  .eq('pet_id', petId)
  .eq('is_active', true)
  .throwOnError();
console.log('[debug] count:', data?.length, 'error:', error);
```
