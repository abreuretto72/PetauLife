---
name: design-system
description: |
  Use when: creating UI component, styling, colors, fonts, spacing, shadows,
  responsive layout, fixed pixels, rs(), fs(), wp(), hp(), dark theme,
  Lucide icons, emojis in code, Sora font, JetBrains Mono, Caveat,
  narration style, design tokens, colors.ts, spacing.ts, shadows.ts,
  alert.alert(), toast, component Button Input Card Badge Modal Skeleton.
  Trigger with: style, color, font, spacing, rs(), fs(), Lucide, dark theme,
  responsive, component, UI, layout, padding, margin, fontSize, icon.
---

# Design System — auExpert

## Tema: Dark Premium

```typescript
// constants/colors.ts — cores base:
const colors = {
  // Fundos
  background: '#0F1923',      // azul petróleo — fundo principal
  surface: '#162231',         // surface cards
  surfaceAlt: '#1C2B3A',     // surface alternativo

  // Marca
  accent: '#E8813A',          // laranja — ação primária
  petrol: '#2A5F7F',          // azul petróleo claro — info

  // Semânticas
  success: '#27AE60',         // saúde, ok
  danger: '#E74C3C',          // erro, exclusão (ícone Trash2)
  warning: '#F39C12',         // aviso
  purple: '#8E44AD',          // IA, narração

  // Texto
  textPrimary: '#E8EDF2',
  textSecondary: '#8FA3B3',
  textMuted: '#4A6274',
};
```

---

## ⛔ Responsividade — NUNCA pixels fixos

```typescript
import { rs, fs, wp, hp } from '@/hooks/useResponsive';
// ou: import { rs, fs, wp, hp } from '@/lib/responsive';

// ❌ PROIBIDO — pixels fixos:
style={{ padding: 16, fontSize: 14, width: 200 }}

// ✅ CORRETO — sempre responsivo:
style={{ padding: rs(16), fontSize: fs(14), width: wp(50) }}

// Exceções (NÃO precisam de rs/fs):
flex: 1
'100%'        // percentuais
borderWidth: 1  // bordas finas 1-2px
// cores, opacidade
```

### Helpers disponíveis
```typescript
rs(n)   // responsive size — espaços, padding, margin, borderRadius, icon sizes
fs(n)   // font size — SEMPRE para fontSize
wp(n)   // width percentage — larguras relativas à tela
hp(n)   // height percentage — alturas relativas à tela

// Layout helpers (lib/responsive.ts):
useContentWidth()       // largura do conteúdo sem safe areas
useCalendarCellWidth()  // células de calendário
useGridColumnWidth(n)   // colunas de grid
useSafeBottom()         // safe area inferior (iPhone home indicator)
useFontScale()          // escala de acessibilidade
```

---

## Tipografia

```typescript
// constants/fonts.ts
const fonts = {
  sora: 'Sora',           // UI — títulos, labels, botões, corpo
  mono: 'JetBrainsMono',  // dados — datas, IDs, números, código
  caveat: 'Caveat',       // narração IA — texto na voz do pet
};

// Uso:
fontFamily: 'Sora'          // UI padrão
fontFamily: 'JetBrainsMono' // dados (datas, pesos, etc)
fontFamily: 'Caveat'        // APENAS narração IA gerada pelo Claude
```

---

## ⛔ Ícones — Sempre Lucide React Native

```typescript
import {
  Trash2,      // exclusão (cor: danger #E74C3C)
  Edit,        // edição
  Plus,        // adicionar
  Heart,       // saúde/favorito
  Camera,      // câmera
  Mic,         // microfone STT
  ChevronRight,
  X,           // fechar
  // ... etc
} from 'lucide-react-native';

// ❌ PROIBIDO — emojis no código:
<Text>🗑️</Text>
<Text>📷</Text>

// ✅ CORRETO:
<Trash2 size={rs(20)} color={colors.danger} />
<Camera size={rs(24)} color={colors.accent} />
```

---

## ⛔ Toasts — Nunca Alert.alert()

```typescript
import { useToast } from '@/components/Toast';

// ❌ PROIBIDO:
Alert.alert('Erro ao salvar')
Alert.alert('Sucesso', 'Salvo com sucesso')

// ✅ CORRETO:
const { toast } = useToast();
toast(t('toast.entrySaved'), 'success')
toast(t('errors.saveFailed'), 'error')
toast(t('toast.warning'), 'warning')
toast(t('toast.info'), 'info')

// Tom: voz do pet — empático, nunca técnico
// "Xi, algo deu errado. Tenta de novo?" ✅
// "Error 500" ❌
```

---

## ⛔ Confirm antes de excluir

```typescript
// SEMPRE confirm() antes de soft delete:
import { confirm } from '@/components/ui/confirm'; // ou similar

confirm({
  title: t('common.confirmDelete'),
  message: t('diary.confirmDeleteEntry'),
  onConfirm: () => softDelete(id),
});

// ícone de exclusão: Trash2, cor danger
<Trash2 size={rs(20)} color={colors.danger} />
```

---

## Componentes UI disponíveis

```
components/ui/
  Input        label, ícone, mic STT (exceto senha), erro, focus glow, rs()
  Button       primary (gradiente), secondary, danger, loading state
  Card         surface color, border, borderRadius rs()
  Badge        pills coloridos, semânticos
  Modal        bottom sheet animado, spring animation
  Skeleton     PetCardSkeleton, HubSkeleton + responsivo
  Alert        (não confundir com Alert.alert — este é componente visual)
  OfflineBanner banner offline/online (NetworkGuard)

components/
  ErrorBoundary   global crash recovery, i18n via i18n.t() (class component)
  Toast           4 variantes + animação + patinha colorida
  AuExpertLogo    3 tamanhos: large, normal, small
  PetBottomNav    tab navigation fixa + safe area insets
  DrawerMenu      animado com Animated.View, useWindowDimensions (NÃO Dimensions.get())
  InputSelector   modal 8 métodos de entrada, help modal
```

---

## Hierarquia de exclusão (lixeira)

```
Timeline card:        ❌ Sem lixeira — só botão ✏️
Tela de edição:       ✅ Trash2 no header → soft delete entry inteira
                      ✅ Trash2 na narração → zera ai_narration
Cada ModuleCard (lente): ✅ ✏️ + Trash2 lado a lado
```

**Ícone:** `Trash2` (Lucide), **cor:** `danger` (#E74C3C)
**Sempre:** confirm() → soft delete (`is_active = false`)

---

## Moods disponíveis (constants/moods.ts)

```typescript
// 8 humores com cores + labels i18n:
ecstatic | happy | calm | tired | anxious | sad | playful | sick
```

---

## Sombras semânticas (constants/shadows.ts)

```typescript
import { shadows } from '@/constants/shadows';

// Sombra colorida por espécie/ação:
shadows.dog     // laranja — cão
shadows.cat     // roxo — gato
shadows.accent  // laranja — ação primária
shadows.danger  // vermelho — destruição
```

---

## Animações

```typescript
// Drawer: Animated.View (300ms, translateX)
// Bottom sheet: spring animation
// Glow: gradiente laranja sutil no topo do Hub
// NUNCA: useWindowDimensions ← Dimensions.get()
//        Sempre: useWindowDimensions() do React Native
```
