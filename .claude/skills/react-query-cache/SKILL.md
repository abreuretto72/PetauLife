---
name: react-query-cache
description: |
  Use when: React Query, cache invalidation, useQuery, useMutation,
  invalidateQueries, refetch, fetchDiaryEntries, Zustand store, cache,
  stale data, cache not updating, diary entries not loading, API totals zero,
  queryClient, is_active filter, hooks order, early return, hook before return.
  Trigger with: React Query, useQuery, useMutation, invalidateQueries,
  cache, refetch, fetchDiaryEntries, Zustand, queryClient, hooks, early return.
---

# React Query + Zustand — auExpert

## Stack
- **TanStack Query (React Query)** — server state, data fetching, cache
- **Zustand** — UI state APENAS
- **lib/api.ts** — funções puras de fetch (separadas do estado)
- **lib/queryClient.ts** — QueryClient centralizado

---

## ⛔ Hooks SEMPRE antes de early returns

```typescript
// ❌ PROIBIDO — hook depois de early return (viola rules of hooks):
const PetDashboard = ({ petId }: Props) => {
  if (!petId) return null;          // early return
  const { data } = usePet(petId);   // ← hook DEPOIS do return — ERRO
};

// ✅ CORRETO — todos os hooks ANTES de qualquer return:
const PetDashboard = ({ petId }: Props) => {
  const { data, isLoading } = usePet(petId);   // hook ANTES
  const { handleOpenPdf } = useDiary(petId);   // hook ANTES

  if (!petId || isLoading) return <Skeleton />; // early return DEPOIS
  return <View>...</View>;
};
```

---

## Regra crítica — Não invalidar cache quando resultado vazio

```typescript
// ❌ ERRADO — setTimeout + invalidate causava race condition e cache zerado:
setTimeout(() => queryClient.invalidateQueries({ queryKey }), 1000);

// ✅ CORRETO — refetch condicional (só atualiza se resultado não-vazio):
const refetchSafe = async (queryKey: string[]) => {
  const result = await queryClient.fetchQuery({
    queryKey,
    queryFn: () => fetchDiaryEntries(petId),
  });

  if (result && result.length > 0) {
    queryClient.setQueryData(queryKey, result);
  } else {
    console.log('[refetch] Vazio — mantendo cache existente');
    // Não limpar cache com resultado vazio
  }
};
```

---

## Padrão após mutation (salvar entrada do diário)

```typescript
const { mutate: saveDiaryEntry } = useMutation({
  mutationFn: diaryApi.save,
  onSuccess: async (savedEntry) => {
    // 1. Otimisticamente ao cache local:
    queryClient.setQueryData(
      QUERY_KEYS.diaryEntries(petId),
      (old: DiaryEntry[] = []) => [savedEntry, ...old]
    );

    // 2. Refetch seguro (só substitui se não-vazio):
    await refetchSafe(QUERY_KEYS.diaryEntries(petId));
  },
  onError: (error) => {
    console.error('[saveDiaryEntry] Error:', error);
    toast(t('errors.saveFailed'), 'error');  // toast, nunca Alert.alert
  },
});
```

---

## Query Keys padronizadas

```typescript
// constants/queryKeys.ts
export const QUERY_KEYS = {
  diaryEntries: (petId: string) => ['diary-entries', petId] as const,
  diaryEntry: (id: string) => ['diary-entry', id] as const,
  pets: (userId: string) => ['pets', userId] as const,
  pet: (petId: string) => ['pet', petId] as const,
  vaccines: (petId: string) => ['vaccines', petId] as const,
  allergies: (petId: string) => ['allergies', petId] as const,
  moods: (petId: string) => ['moods', petId] as const,
} as const;
```

---

## DIARY_MODULE_SELECT — select('*') simples

```typescript
// Não adicionar JOINs sem validar constraints PostgREST:
const DIARY_MODULE_SELECT = '*';

export const fetchDiaryEntries = async (petId: string) => {
  const { data, error } = await supabase
    .from('diary_entries')
    .select(DIARY_MODULE_SELECT)
    .eq('pet_id', petId)
    .eq('is_active', true)          // soft delete do auExpert
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchDiaryEntries] Error:', error);
    throw error;
  }

  console.log('[fetchDiaryEntries] count:', data?.length, 'pet:', petId);
  return data ?? [];
};
```

---

## O que vai no Zustand vs React Query

```typescript
// ZUSTAND — UI state APENAS:
interface UIStore {
  isDrawerOpen: boolean;
  selectedPetId: string | null;
  language: 'pt-BR' | 'en-US';
}

// ZUSTAND — Auth state:
interface AuthStore {
  user: User | null;
  session: Session | null;
}

// REACT QUERY — server state (tudo que vem do Supabase):
// ✅ pets, diary entries, vaccines, allergies, moods, health data
// ❌ Nunca salvar dados do servidor no Zustand
```

---

## QueryClient centralizado (lib/queryClient.ts)

```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,     // 5 min
      gcTime: 1000 * 60 * 30,       // 30 min
      retry: 2,
      refetchOnWindowFocus: false,   // mobile — não refetch ao focar
      refetchOnReconnect: true,      // sync ao reconectar (offline first)
    },
    mutations: {
      retry: 1,
    },
  },
});
```

---

## API layer (lib/api.ts) — funções puras

```typescript
// lib/api.ts — separado do estado (sem hooks, sem store):
export const diaryApi = {
  getEntries: (petId: string) => fetchDiaryEntries(petId),
  getEntry: (id: string) => fetchDiaryEntry(id),
  save: (entry: NewDiaryEntry) => saveDiaryEntry(entry),
  update: (id: string, data: Partial<DiaryEntry>) => updateDiaryEntry(id, data),
  delete: (id: string) => softDeleteEntry(id),  // is_active = false
};
```

---

## Hooks disponíveis (hooks/)

```
useAuth.ts          auth state + biometria
usePets.ts          CRUD pets + cache
useDiary.ts         diary entries + mutations
useHealth.ts        vaccines, allergies, moods
useNotifications    push + scheduling
useResponsive.ts    rs(), fs(), wp(), hp()
useNetworkStatus.ts online/offline status
useSyncQueue.ts     fila de mutações offline
usePetMembers.ts    co-tutores + roles
useMyPetRole.ts     papel do usuário no pet
```
