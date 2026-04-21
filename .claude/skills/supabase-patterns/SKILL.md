---
name: supabase-patterns
description: |
  Use when: Supabase query, RLS, migration, soft delete, is_active, storage,
  bucket, edge function, RPC, trigger, view, policy, ALTER TABLE, CREATE TABLE,
  pgvector, embedding, offline sync, auth state change, real-time subscription.
  Trigger with: Supabase, RLS, migration, is_active, soft delete, storage,
  bucket, SQL, trigger, view, policy, pgvector, embedding, auth.
---

# Supabase Patterns — auExpert

## Banco de dados
- **13 tabelas** · **30 RLS policies** · **25 indexes**
- **6 functions** · **10 triggers** · **5 views**
- **2 storage buckets**
- **Project ID:** verificar no `.env.local` (EXPO_PUBLIC_SUPABASE_URL)

---

## ⛔ Soft Delete — `is_active = false`

```typescript
// ❌ DELETE físico — PROIBIDO:
await supabase.from('diary_entries').delete().eq('id', id)

// ✅ Soft delete — SEMPRE:
await supabase.from('diary_entries')
  .update({ is_active: false })
  .eq('id', id)

// ✅ Queries SEMPRE filtram is_active:
.eq('is_active', true)

// ✅ Migrations usam is_active (não deleted_at):
ALTER TABLE public.diary_entries
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;
CREATE INDEX ON public.diary_entries(is_active);
```

---

## ⛔ Verificar nomes reais ANTES de qualquer query

```sql
-- Colunas de uma tabela:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'diary_entries' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Todas as tabelas:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- RPCs/Functions:
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public';

-- Constraints FK:
SELECT conname, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f' AND conrelid = 'public.diary_entries'::regclass;
```

---

## RLS — Row Level Security

```sql
-- Habilitar em tabelas novas:
ALTER TABLE public.minha_tabela ENABLE ROW LEVEL SECURITY;

-- Policy padrão — tutor vê apenas dados dos seus pets:
CREATE POLICY "tutor_sees_own_pets_data"
  ON public.diary_entries FOR SELECT
  USING (
    pet_id IN (
      SELECT id FROM public.pets WHERE owner_id = auth.uid()
    )
    AND is_active = true
  );

-- Policy INSERT:
CREATE POLICY "tutor_inserts_own_pets_data"
  ON public.diary_entries FOR INSERT
  WITH CHECK (
    pet_id IN (
      SELECT id FROM public.pets WHERE owner_id = auth.uid()
    )
  );

-- Policy UPDATE (soft delete incluso):
CREATE POLICY "tutor_updates_own_data"
  ON public.diary_entries FOR UPDATE
  USING (
    pet_id IN (
      SELECT id FROM public.pets WHERE owner_id = auth.uid()
    )
  );
```

---

## Migrations — Estrutura padrão

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_descricao.sql

-- Verificar antes: nomes reais das colunas
-- Usar is_active para soft delete (não deleted_at)
-- Terminar com NOTIFY se houver FK

ALTER TABLE public.diary_entries
  ADD COLUMN IF NOT EXISTS photo_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS video_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS audio_size_bytes BIGINT;

-- Índices:
CREATE INDEX IF NOT EXISTS idx_diary_entries_pet_active
  ON public.diary_entries(pet_id, is_active);

-- SEMPRE ao final se houve FK:
NOTIFY pgrst, 'reload schema';
```

---

## Storage Buckets

```typescript
// 2 buckets disponíveis:
// 'media' — fotos, vídeos, áudios do diário
// 'avatars' — fotos de perfil de pets e tutores

// Upload de foto:
const { data, error } = await supabase.storage
  .from('media')
  .upload(`${petId}/${entryId}/photo_${timestamp}.webp`, file, {
    contentType: 'image/webp',
    upsert: false,
  });

// URL pública:
const { data: { publicUrl } } = supabase.storage
  .from('media')
  .getPublicUrl(path);

// Thumbnail de vídeo (gerado com expo-video-thumbnails):
// Armazenado separado: `${petId}/${entryId}/thumb_${videoName}.jpg`
```

---

## Tabelas principais (verificar schema real antes de usar)

```
users              espelho de auth.users para PostgREST
pets               cães e gatos (species: 'dog'|'cat')
diary_entries      entradas do diário (is_active, ai_narration)
vaccines           vacinas (is_active)
allergies          alergias (is_active)
moods              registros de humor (8 tipos)
pet_memories       embeddings para RAG por pet
pet_members        co-tutores, papéis, tokens de convite
app_config         configurações globais (modelos de IA)
user_consents      LGPD/GDPR
ai_training_dataset dados anonimizados (particionada)
pet_insights       alertas proativos gerados por CRONs
```

---

## Auth — Race Condition Fix

```typescript
// _layout.tsx — sincroniza authStore com sessão real:
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      authStore.setSession(session);
      authStore.setUser(session?.user ?? null);
    }
  );
  return () => subscription.unsubscribe();
}, []);

// NÃO confiar apenas em useAuth sem o listener do layout
```

---

## Offline First

```typescript
// Regra: salvar LOCALMENTE primeiro, sync depois
// lib/localDb.ts       — cache persistente local
// hooks/useSyncQueue.ts — fila de mutações offline
// hooks/useNetworkStatus.ts — detecta conectividade

// Nunca bloquear o tutor por falta de internet
// OfflineBanner exibe estado de rede
```

---

## CRONs — Assistente Proativo

```
check-scheduled-events  2x/dia (07h + 20h)  vacinas, medicamentos, aniversários
analyze-health-patterns 1x/dia (07:30h)      peso, humor, sintomas, exames
preventive-care-alerts  1x/semana (seg)      alertas por raça/idade
financial-monitor       1x/mês (dia 1)       gastos acima da média
weather-alerts          2x/dia (06h + 18h)   clima + alertas regionais
```
Todos os insights → tabela `pet_insights` + push notification.

---

## pgvector — RAG por Pet

```sql
-- Instalar extensão:
CREATE EXTENSION IF NOT EXISTS vector;

-- Campo embedding:
ALTER TABLE public.pet_memories
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Busca semântica:
SELECT *, embedding <=> $1::vector AS distance
FROM pet_memories
WHERE pet_id = $2 AND is_active = true
ORDER BY distance
LIMIT 10;
```

```typescript
// SEMPRE filtrar por pet_id — nunca misturar pets:
.eq('pet_id', petId)   // ← obrigatório em qualquer query RAG
```
