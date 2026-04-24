# Prompt para Claude Code — Tela "Minhas Estatísticas" no app mobile auExpert

> **Como usar:** Abra Claude Code dentro de `E:\aa_projetos_claude\auExpert` (raiz do app mobile, NÃO dentro de admin-dashboard) e cole este arquivo inteiro como primeira mensagem.

---

## ⚠️ ATENÇÃO ANTES DE COMEÇAR — onde você está rodando

O repositório `auExpert` em `E:\aa_projetos_claude\auExpert` contém **DOIS projetos diferentes** que coexistem:

```
E:\aa_projetos_claude\auExpert\          ← raiz do REPO
│
├── app/                                  ← app MOBILE (React Native + Expo) ← TRABALHE AQUI
├── components/                           ← componentes RN
├── src/ ou hooks/ ou similar             ← código RN
├── package.json                          ← deps do app mobile (expo, react-native, etc.)
├── tsconfig.json                         ← tsconfig do app mobile
├── app.json                              ← config Expo
│
└── admin-dashboard/                      ← dashboard ADMIN WEB (Next.js 15) ← NÃO MEXA AQUI
    ├── app/
    ├── package.json                      ← outro package.json (next, react-dom, etc.)
    └── tsconfig.json                     ← outro tsconfig
```

**Esta tarefa é exclusivamente sobre o app MOBILE (React Native).** Não toque em nada dentro de `admin-dashboard/` — é um projeto Next.js separado, deployado na Vercel, fora do escopo desta tarefa.

**Sinais de que você está no projeto certo (mobile):**
- `package.json` da raiz tem `"expo"`, `"react-native"`, `"expo-router"`
- Existe `app.json` ou `app.config.ts` com config Expo
- Pasta `app/` da raiz tem rotas Expo Router (não Next.js App Router)

**Se você se confundir e abrir um arquivo dentro de `admin-dashboard/`, pare imediatamente.** Esse não é o lugar.

---

## Tarefa

Adicionar a tela **"Minhas Estatísticas"** ao app mobile auExpert. A tela deve aparecer no drawer lateral, mostrar dados reais consumindo uma RPC já existente no Supabase, e o login do usuário deve registrar uma entrada em audit_log via outra RPC já existente.

**Backend está pronto.** Você não precisa mexer no Supabase. Só código React Native.

## Contexto do projeto mobile

- **Caminho local:** `E:\aa_projetos_claude\auExpert` (raiz, não a subpasta)
- **Stack:** React Native + Expo SDK 52+, Expo Router v4, TypeScript, Supabase (`@supabase/supabase-js`), `@tanstack/react-query`, Zustand
- **Brand kit Elite (já em uso no app):** dark `#0D0E16`, ametista `#8F7FA8`, jade `#4FA89E`, texto `#F0EDF5`
- **Idioma:** strings em **pt-BR hardcoded** nesta tarefa (i18n vem em outra etapa)
- **Repo:** `github.com/abreuretto72/auExpert` na branch `main`

## RPCs disponíveis no Supabase (NÃO mexer no banco)

### `get_user_stats(p_year int, p_month int)` → jsonb

Retorna estatísticas do tutor autenticado para o mês solicitado. Defaults para mês atual. Validada e funcionando.

**Shape do retorno:**

```ts
{
  period: {
    year: number;
    month: number;        // 1-12
    label: string;        // ex: "Abril 2026"
    start: string;        // ISO timestamp
    end: string;
  };
  ai_usage: {
    images: number;       // photo_analyses do mês
    videos: number;       // diary_entries com video_url
    audios: number;       // diary_entries com audio_url
    scanners: number;     // diary_entries com ocr_data
    cardapios: number;    // nutrition_cardapio_history
    prontuarios: number;  // prontuario_cache
  };
  pets: { dogs: number; cats: number; total: number };
  people: {
    tutors: number;
    co_parents: number;
    caregivers: number;
    visitors: number;
    total: number;
  };
  professionals: {
    by_type: Record<string, number>;   // {vet: 2, groomer: 1, ...}
    total: number;
    pending_invites: number;
  };
  activity: {
    logins_days_count: number;
    last_login_at: string | null;
  };
}
```

**Valores reais para o user `abreu@multiversodigital.com.br` em abril/2026** (use pra validar):
7 cães, 1 gato, 5 co-tutores, 7 imagens, 16 vídeos, 8 áudios, 7 cardápios, 1 prontuário.

### `record_user_login(p_platform text, p_device text, p_auth_method text)` → void

Insere uma linha em `audit_log` com `action='login'`. Todos os parâmetros são opcionais. Sem essa chamada após login, o card "Dias ativos no mês" fica zerado.

## Passo 0 — Verificação de localização (faça PRIMEIRO antes de tudo)

Antes de qualquer outra coisa, **confirme que você está no projeto mobile correto**, não no admin web. Rode:

```bash
ls -la
```

Deve aparecer (entre outras coisas):
- `app.json` ou `app.config.ts` (config Expo)
- `package.json` na raiz
- Uma pasta `admin-dashboard/` (que você vai IGNORAR)

Abra o `package.json` da raiz e confirme que tem `"expo"` e `"react-native"` nas deps. Se NÃO tiver (ex: aparecer `"next"`), você está no projeto errado — pare e reporte.

## Passo 1 — Investigação (FAÇA antes de criar arquivos)

**Pare antes de gerar qualquer código.** Investigue o app mobile (raiz, não admin-dashboard) e me reporte:

1. **`tsconfig.json` da raiz** — quais aliases existem em `compilerOptions.paths`? (ex: `"@/*": ["./*"]` ou `"@/*": ["./src/*"]`)

2. **Cliente Supabase** — encontre o arquivo onde `createClient` do `@supabase/supabase-js` é instanciado, **dentro do projeto mobile** (não em `admin-dashboard/`). Reporte o path exato e como ele é importado em outros arquivos do projeto (ex: `import { supabase } from '@/lib/supabase'` ou `import { supabase } from '../utils/supabase'`).

3. **Drawer layout** — encontre o `_layout.tsx` que usa `<Drawer>` de `expo-router/drawer`. Tipicamente em `app/(app)/_layout.tsx`, `app/(drawer)/_layout.tsx` ou `app/_layout.tsx`. **Mostre o conteúdo INTEIRO do arquivo** — preciso ver os `<Drawer.Screen>` existentes pra adicionar o novo no padrão certo.

4. **Fluxo de login** — encontre TODOS os pontos onde acontece autenticação bem-sucedida no app mobile. Procure por:
   - `supabase.auth.signInWithPassword`
   - `supabase.auth.signInWithOAuth`
   - `supabase.auth.signInWithOtp` (magic link)
   - `LocalAuthentication.authenticateAsync` (biometria com `expo-local-authentication`)
   - Restoração de sessão via `supabase.auth.setSession`

   Para cada ponto, me mostre o trecho de código (5-10 linhas de contexto). Liste todos os arquivos.

5. **Dependências** — confirme no `package.json` da raiz se já existem:
   - `@tanstack/react-query` (qualquer versão >= 5.x)
   - `expo-router` (v4.x ou superior)
   - `lucide-react-native`
   - `react-native-safe-area-context`

   Se faltar alguma, **NÃO instale ainda**. Reporte e aguarde minha confirmação.

6. **Estrutura de pastas existente** — me diga se o projeto mobile usa:
   - Pasta `src/` para tipos/hooks/lib (ex: `src/types/`, `src/hooks/`, `src/lib/`)
   - Ou tudo direto na raiz (ex: `types/`, `hooks/`, `lib/`)
   - Ou outro padrão (ex: `features/stats/...`)

**Apresente os 6 achados num resumo conciso e AGUARDE minha aprovação antes de prosseguir.**

## Passo 2 — Criar 4 arquivos novos

Adapte os paths conforme a estrutura real descoberta no Passo 1. **Todos os arquivos vão dentro do projeto mobile (raiz), nunca dentro de `admin-dashboard/`.**

### Arquivo A: `<paths>/types/userStats.ts`

```typescript
// Tipos do painel de estatísticas do tutor.

export interface UserStatsPeriod {
  year: number;
  month: number;
  label: string;
  start: string;
  end: string;
}

export interface UserStatsAIUsage {
  images: number;
  videos: number;
  audios: number;
  scanners: number;
  cardapios: number;
  prontuarios: number;
}

export interface UserStatsPets {
  dogs: number;
  cats: number;
  total: number;
}

export interface UserStatsPeople {
  tutors: number;
  co_parents: number;
  caregivers: number;
  visitors: number;
  total: number;
}

export interface UserStatsProfessionals {
  by_type: Record<string, number>;
  total: number;
  pending_invites: number;
}

export interface UserStatsActivity {
  logins_days_count: number;
  last_login_at: string | null;
}

export interface UserStats {
  period: UserStatsPeriod;
  ai_usage: UserStatsAIUsage;
  pets: UserStatsPets;
  people: UserStatsPeople;
  professionals: UserStatsProfessionals;
  activity: UserStatsActivity;
}

/** Tradução de professional_type em labels amigáveis. */
export const PROFESSIONAL_TYPE_LABELS: Record<string, string> = {
  vet:           'Veterinário',
  groomer:       'Banho & Tosa',
  trainer:       'Adestrador',
  walker:        'Passeador',
  sitter:        'Pet sitter',
  nutritionist:  'Nutricionista',
  physio:        'Fisioterapeuta',
  dentist:       'Dentista',
  behaviorist:   'Comportamentalista',
  daycare:       'Creche',
  hotel:         'Hotel',
};
```

### Arquivo B: `<paths>/hooks/useUserStats.ts`

> ⚠️ **Ajuste o import do `supabase` conforme descoberto no Passo 1.**

```typescript
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';   // AJUSTE conforme Passo 1
import type { UserStats } from '@/types/userStats';

interface Params {
  year: number;
  month: number;
  enabled?: boolean;
}

export function useUserStats({ year, month, enabled = true }: Params):
  UseQueryResult<UserStats, Error> {
  return useQuery({
    queryKey: ['user-stats', year, month],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_user_stats', {
        p_year: year,
        p_month: month,
      });
      if (error) throw new Error(error.message);
      return data as UserStats;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime:   15 * 60 * 1000,
  });
}

export function getCurrentYearMonth() {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function getLastNMonths(n = 12) {
  const fmt = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });
  const result: Array<{ year: number; month: number; label: string }> = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      year:  d.getFullYear(),
      month: d.getMonth() + 1,
      label: fmt.format(d).replace(/^\w/, c => c.toUpperCase()),
    });
  }
  return result;
}
```

### Arquivo C: `<paths>/lib/recordUserLogin.ts`

> ⚠️ **Ajuste o import do `supabase` conforme descoberto no Passo 1.**

```typescript
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';   // AJUSTE conforme Passo 1

export async function recordUserLogin(
  authMethod: 'password' | 'biometric' | 'oauth' | 'magic_link' | 'social' = 'password',
): Promise<void> {
  try {
    const { error } = await supabase.rpc('record_user_login', {
      p_platform:    Platform.OS,
      p_device:      Platform.Version ? String(Platform.Version) : null,
      p_auth_method: authMethod,
    });
    if (error) {
      console.warn('[recordUserLogin] falhou:', error.message);
    }
  } catch (err) {
    console.warn('[recordUserLogin] exception:', err);
  }
}
```

### Arquivo D: tela `stats.tsx` no diretório do drawer

> ⚠️ **Localização depende de onde está o drawer.** Se o drawer está em `app/(app)/_layout.tsx`, o arquivo vai em `app/(app)/stats.tsx`. Se está em `app/(drawer)/_layout.tsx`, vai em `app/(drawer)/stats.tsx`. **NUNCA** em `admin-dashboard/`.

```tsx
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  Camera, Video, Mic, ScanLine, UtensilsCrossed, FileText,
  Dog, Cat, Users, Stethoscope, Calendar, ChevronDown,
} from 'lucide-react-native';
import {
  useUserStats,
  getCurrentYearMonth,
  getLastNMonths,
} from '@/hooks/useUserStats';
import { PROFESSIONAL_TYPE_LABELS } from '@/types/userStats';

const COLORS = {
  bg: '#0D0E16',
  card: '#161826',
  border: '#2A2D3E',
  text: '#F0EDF5',
  textMuted: '#A89FB5',
  textDim: '#6B6478',
  ametista: '#8F7FA8',
  jade: '#4FA89E',
};

const StatCard = ({
  icon: Icon, label, value, hint, color = COLORS.jade,
}: {
  icon: any; label: string; value: number | string; hint?: string; color?: string;
}) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <Icon size={18} color={color} strokeWidth={1.5} />
      <Text style={styles.cardLabel}>{label}</Text>
    </View>
    <Text style={[styles.cardValue, { color }]}>{value}</Text>
    {hint ? <Text style={styles.cardHint}>{hint}</Text> : null}
  </View>
);

const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

export default function UserStatsScreen() {
  const [{ year, month }, setPeriod] = useState(getCurrentYearMonth);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const months = useMemo(() => getLastNMonths(12), []);

  const { data, isLoading, isError, error, refetch, isRefetching } =
    useUserStats({ year, month });

  const currentLabel = useMemo(() => {
    return months.find(m => m.year === year && m.month === month)?.label
      ?? `${month}/${year}`;
  }, [months, year, month]);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Stack.Screen options={{ title: 'Minhas Estatísticas' }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={COLORS.jade} />
        }
      >
        <Pressable onPress={() => setShowMonthPicker(v => !v)} style={styles.monthSelector}>
          <Calendar size={16} color={COLORS.ametista} strokeWidth={1.5} />
          <Text style={styles.monthSelectorText}>{currentLabel}</Text>
          <ChevronDown size={16} color={COLORS.ametista} strokeWidth={1.5} />
        </Pressable>

        {showMonthPicker && (
          <View style={styles.monthPicker}>
            {months.map(m => {
              const selected = m.year === year && m.month === month;
              return (
                <Pressable
                  key={`${m.year}-${m.month}`}
                  onPress={() => {
                    setPeriod({ year: m.year, month: m.month });
                    setShowMonthPicker(false);
                  }}
                  style={[styles.monthOption, selected && styles.monthOptionSelected]}
                >
                  <Text style={[styles.monthOptionText, selected && styles.monthOptionTextSelected]}>
                    {m.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={COLORS.jade} />
          </View>
        ) : isError ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Não foi possível carregar.</Text>
            <Text style={styles.errorHint}>{error?.message}</Text>
          </View>
        ) : data ? (
          <>
            <SectionHeader title="Uso de inteligência artificial" />
            <View style={styles.grid}>
              <StatCard icon={Camera}          label="Imagens analisadas"   value={data.ai_usage.images} />
              <StatCard icon={Video}           label="Vídeos analisados"    value={data.ai_usage.videos} />
              <StatCard icon={Mic}             label="Áudios analisados"    value={data.ai_usage.audios} />
              <StatCard icon={ScanLine}        label="Scanners (OCR)"       value={data.ai_usage.scanners} />
              <StatCard icon={UtensilsCrossed} label="Cardápios criados"    value={data.ai_usage.cardapios} />
              <StatCard icon={FileText}        label="Prontuários gerados"  value={data.ai_usage.prontuarios} />
            </View>

            <SectionHeader title="Meus pets" />
            <View style={styles.grid}>
              <StatCard icon={Dog} label="Cães"  value={data.pets.dogs} color={COLORS.ametista} />
              <StatCard icon={Cat} label="Gatos" value={data.pets.cats} color={COLORS.ametista} />
            </View>

            <SectionHeader title="Pessoas vinculadas aos seus pets" />
            <View style={styles.grid}>
              <StatCard icon={Users} label="Co-tutores" value={data.people.co_parents} color={COLORS.ametista} />
              <StatCard icon={Users} label="Cuidadores" value={data.people.caregivers} color={COLORS.ametista} />
              <StatCard icon={Users} label="Visitantes" value={data.people.visitors}   color={COLORS.ametista} />
              <StatCard icon={Users} label="Total"       value={data.people.total}      color={COLORS.jade} />
            </View>

            <SectionHeader title="Profissionais convidados" />
            {data.professionals.total === 0 && data.professionals.pending_invites === 0 ? (
              <Text style={styles.empty}>Nenhum profissional convidado ainda.</Text>
            ) : (
              <View style={styles.grid}>
                {Object.entries(data.professionals.by_type).map(([type, count]) => (
                  <StatCard
                    key={type}
                    icon={Stethoscope}
                    label={PROFESSIONAL_TYPE_LABELS[type] ?? type}
                    value={count as number}
                    color={COLORS.ametista}
                  />
                ))}
                {data.professionals.pending_invites > 0 && (
                  <StatCard
                    icon={Stethoscope}
                    label="Convites pendentes"
                    value={data.professionals.pending_invites}
                    hint="Aguardando aceite"
                    color={COLORS.textDim}
                  />
                )}
              </View>
            )}

            <SectionHeader title="Sua atividade" />
            <View style={styles.grid}>
              <StatCard
                icon={Calendar}
                label="Dias ativos no mês"
                value={data.activity.logins_days_count}
                hint={
                  data.activity.last_login_at
                    ? `Último login: ${new Date(data.activity.last_login_at).toLocaleDateString('pt-BR')}`
                    : 'Logue novamente pra registrar'
                }
              />
            </View>

            <View style={{ height: 32 }} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { padding: 16, paddingBottom: 40 },
  centered: { padding: 32, alignItems: 'center' },
  errorText: { color: COLORS.text, fontSize: 15, textAlign: 'center' },
  errorHint: { color: COLORS.textDim, fontSize: 12, marginTop: 8, textAlign: 'center' },
  monthSelector: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, marginBottom: 16,
  },
  monthSelectorText: { color: COLORS.text, fontSize: 14, fontWeight: '500' },
  monthPicker: {
    backgroundColor: COLORS.card, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, padding: 4, marginBottom: 16,
  },
  monthOption: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  monthOptionSelected: { backgroundColor: 'rgba(79, 168, 158, 0.14)' },
  monthOptionText: { color: COLORS.textMuted, fontSize: 13 },
  monthOptionTextSelected: { color: COLORS.jade, fontWeight: '600' },
  sectionHeader: {
    color: COLORS.ametista, fontSize: 12, fontWeight: '500',
    textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 20, marginBottom: 10,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    flexBasis: '48%', flexGrow: 1, backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 14, padding: 14,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  cardLabel: {
    color: COLORS.textMuted, fontSize: 11, textTransform: 'uppercase',
    letterSpacing: 0.5, fontWeight: '500',
  },
  cardValue: { fontSize: 28, fontWeight: '500', lineHeight: 32 },
  cardHint: { color: COLORS.textDim, fontSize: 11, marginTop: 6 },
  empty: { color: COLORS.textDim, fontSize: 13, fontStyle: 'italic', paddingVertical: 8 },
});
```

## Passo 3 — Editar o `_layout.tsx` do drawer

No arquivo do drawer descoberto no Passo 1 (sempre na raiz, nunca em `admin-dashboard/`), **adicione UMA nova entrada `<Drawer.Screen>` seguindo o mesmo padrão das entradas existentes**.

**Trecho a adicionar:**

```tsx
import { BarChart3 } from 'lucide-react-native';

// Junto dos outros Drawer.Screen, dentro do componente:
<Drawer.Screen
  name="stats"
  options={{
    title: 'Minhas Estatísticas',
    drawerLabel: 'Minhas Estatísticas',
    drawerIcon: ({ color }) => <BarChart3 size={20} color={color} strokeWidth={1.5} />,
  }}
/>
```

**Regras críticas:**

1. O `name="stats"` DEVE bater exatamente com o nome do arquivo criado. Se você criou `app/(app)/stats.tsx`, o name é `stats`.

2. **Preserve TODAS as outras `<Drawer.Screen>` e configurações existentes.** Não remova, não reordene sem motivo, não altere outras opções. Só adicione a nova entrada.

3. Se o drawer já tem alguma convenção de ordem (alfabética, ou por categoria), encaixe nessa convenção. Se não tem ordem clara, adicione no final.

4. Se houver `screenOptions` global com cores/estilo, o ícone vai herdar — não duplicar config.

## Passo 4 — Instrumentar TODOS os fluxos de login

Para cada ponto identificado no Passo 1 onde acontece autenticação bem-sucedida (no app mobile), adicione a chamada `recordUserLogin`.

### Padrão de inserção

**Antes:**
```tsx
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
if (error) {
  // tratar erro
  return;
}
router.replace('/(app)');   // ou navegação equivalente
```

**Depois:**
```tsx
import { recordUserLogin } from '@/lib/recordUserLogin';

const { data, error } = await supabase.auth.signInWithPassword({ email, password });
if (error) {
  // tratar erro
  return;
}
await recordUserLogin('password');   // <-- nova linha
router.replace('/(app)');
```

### Mapeamento de fluxos para o auth_method

| Fluxo | `authMethod` |
|---|---|
| `signInWithPassword` | `'password'` |
| `signInWithOAuth` (Google, Apple, etc.) | `'oauth'` |
| `signInWithOtp` (magic link) | `'magic_link'` |
| Login biométrico (`LocalAuthentication`) que restaura sessão | `'biometric'` |

### Regras críticas

1. `recordUserLogin` **nunca lança exceção** — é best-effort e usa `console.warn` em caso de falha. Não envolva em try/catch.

2. Sempre **antes do redirect** (`router.replace` / `router.push`), assim a chamada termina antes do app sair da tela de login.

3. Se houver biometria que **só restaura sessão** sem chamar `signIn` de novo (caso clássico: app armazena refresh token e usa `setSession`), também chame `recordUserLogin('biometric')` quando a sessão for restaurada com sucesso.

4. **Não chame `recordUserLogin` em refresh automático de token** — só em login explícito do usuário.

## Passo 5 — Validação

Depois de tudo, execute na raiz do projeto mobile:

```powershell
npx expo start
```

### Checklist

- [ ] App carrega sem erros de import
- [ ] Console limpo (sem `Cannot find module` ou warnings de TS)
- [ ] Faça **logout e login** com `abreu@multiversodigital.com.br`
- [ ] No console deve aparecer (apenas se houver erro): `[recordUserLogin] falhou: ...` — se aparecer, reporte. Se sucesso, fica silencioso.
- [ ] Abra o drawer lateral → "Minhas Estatísticas" aparece com ícone de barras (BarChart3)
- [ ] Toque no item → tela carrega com spinner jade, depois mostra os cards
- [ ] **Os números devem bater:** 7 cães, 1 gato, 5 co-tutores, 7 imagens, 16 vídeos, 8 áudios, 7 cardápios, 1 prontuário (para abril/2026 do user abreu)
- [ ] Card **"Dias ativos no mês"** mostra **pelo menos 1** (do login que você acabou de fazer)
- [ ] Toque no seletor de mês → muda para março/2026 → dados recarregam (provavelmente zerados se não houve atividade)
- [ ] Pull-to-refresh funciona (puxe pra baixo no topo da tela)
- [ ] Visual segue o brand kit Elite (dark + ametista + jade)

## Troubleshooting

| Sintoma | Causa provável | Fix |
|---|---|---|
| `Cannot find module '@/hooks/useUserStats'` | Alias do tsconfig não aponta pra onde os arquivos foram criados | Verificar `paths` no tsconfig e ajustar imports nos arquivos novos |
| `Cannot find module '@/lib/supabase'` | Path do client Supabase é diferente | Ajustar imports nos Arquivos B e C |
| Erro `PGRST202 could not find function get_user_stats` | Cache PostgREST | Reportar pra mim — eu rodo `NOTIFY pgrst, 'reload schema'` via MCP |
| Cards todos com 0 | Está vendo o mês errado, ou user logado não é o `abreu` | Trocar mês no seletor; conferir `auth.uid()` |
| "Dias ativos no mês" continua 0 após login | Algum fluxo de login não foi instrumentado | Revisar Passo 4 — pode ter login biométrico/OAuth não tratado |
| Tela não aparece no drawer | `name` no `<Drawer.Screen>` não bate com nome do arquivo | Conferir que `name="stats"` e arquivo é `stats.tsx` na mesma pasta do `_layout.tsx` |
| Tela aparece mas leva pra tela vazia/erro 404 | Arquivo no diretório errado | Mover pra pasta correta do drawer (`app/(app)/`, `app/(drawer)/`, etc.) |
| Você se viu editando algo dentro de `admin-dashboard/` | Você se confundiu de projeto | PARE. `admin-dashboard/` é um projeto Next.js separado. Saia dela. |
| TypeScript reclama do retorno de `supabase.rpc` | É `any` por padrão | Cast `as UserStats` já tá no hook; se reclamar em outro lugar, fazer cast manual |

## Regras de execução

1. **NUNCA toque em arquivos dentro de `E:\aa_projetos_claude\auExpert\admin-dashboard\`.** É um projeto Next.js separado, fora do escopo desta tarefa.

2. **NÃO comece o Passo 2 sem antes me apresentar os achados do Passo 1 e receber minha aprovação.** Paths errados aqui geram cascata de bugs.

3. **NÃO instale dependências** sem me avisar antes (todas devem já estar no projeto, mas se faltar alguma, reporte).

4. **NÃO mexa em arquivos não listados.** Especialmente: não toque em Edge Functions, schema do Supabase, outras telas do app, fluxos de cadastro, store de Zustand, providers de query.

5. **Ao editar arquivos existentes** (`_layout.tsx`, fluxos de login), **preserve TUDO o que já está lá**. Só adicione/instrumente o necessário.

6. **Se algo do projeto for diferente do esperado**, pare e pergunte. Não adapte o código sem confirmar.

7. **Faça commits granulares** se já tiver costume de commit:
   - `feat: add user stats types and hook`
   - `feat: add login tracking helper`
   - `feat: add Minhas Estatísticas screen`
   - `feat: register stats screen in drawer`
   - `feat: instrument login flows with recordUserLogin`

   Se preferir um commit único: `feat: add user stats screen with login tracking`

## Resultado esperado

- ✅ 4 arquivos novos criados no projeto MOBILE (types, hook, helper, tela)
- ✅ 1 entrada nova no `<Drawer>` do `_layout.tsx` do projeto MOBILE
- ✅ Chamadas `recordUserLogin(...)` adicionadas em todos os fluxos de login bem-sucedido do app MOBILE
- ✅ `npx expo start` roda sem erros
- ✅ Tela "Minhas Estatísticas" navegável pelo drawer e com dados reais
- ✅ Pasta `admin-dashboard/` permanece intocada

---

**Comece pelo Passo 0** (verificação de localização), depois Passo 1 (investigação). Apresente os 6 achados antes de criar arquivos.
