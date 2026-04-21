---
name: lens-card-creation
description: |
  Use when: creating lens card, ModuleCard, lente, lens type, extracted_data,
  LensCard component, analysis result, 20 lenses, help panel Painel tab,
  analyzed photo in card, diary module card, LentesTab, IATab, media in lens,
  media size limits display, pet health score.
  Trigger with: lens, lente, ModuleCard, LensCard, extracted_data, LentesTab,
  IATab, análise, Painel tab, help modal, media size, health score.
---

# Lens Cards — auExpert

## Arquitetura

### `extracted_data` é a fonte PRIMÁRIA — nunca JOINs para lens cards

```typescript
// ✅ CORRETO — usar extracted_data (JSONB persistido):
const lensData = lensAnalysis.extracted_data;

// ❌ ERRADO — JOINs instáveis com múltiplas FKs:
const lensData = entry.diary_module?.health_data;
```

---

## Componentes de lens no projeto

```
components/
  pet/
    LentesTab.tsx    ← lista de todos os ModuleCards do pet
    IATab.tsx        ← análises IA do pet
  lenses/
    AgendaLensContent.tsx ← conteúdo da lente de agenda
  diary/
    TimelineCards.tsx ← cards na timeline do diário
```

---

## Estrutura de ModuleCard (lente)

```typescript
interface ModuleCardProps {
  lensType: LensType;
  extractedData: Record<string, unknown>;  // JSONB do banco
  photoUri?: string;             // ← MOSTRAR no card (feature pendente)
  petName: string;
  analyzedAt: string;
  onEdit?: () => void;
  onDelete?: () => void;         // ← soft delete is_active = false
}
```

### Hierarquia de ações no ModuleCard
```
✏️ + 🗑️ lado a lado → editar ou excluir o módulo
Ícone: Edit + Trash2 (Lucide)
Cor Trash2: danger (#E74C3C)
SEMPRE confirm() antes de excluir
```

---

## Feature pendente: foto analisada no card resultado

```typescript
// Mostrar thumbnail da foto que foi analisada:
const analyzedPhoto = entry.media_attachments
  ?.find((m: MediaItem) => m.type === 'photo');

// No card resultado:
{analyzedPhoto && (
  <Image
    source={{ uri: analyzedPhoto.url }}
    style={{ width: rs(60), height: rs(60), borderRadius: rs(8) }}
    resizeMode="cover"
  />
)}
```

---

## Feature pendente: media size limits na UI

```typescript
// Exibir limites antes de selecionar mídia (InputSelector):
const MEDIA_LIMITS = {
  photo: { maxSizeMB: 10, formats: ['jpg', 'jpeg', 'png', 'heic', 'webp'] },
  video: { maxSizeMB: 100, maxDurationSec: 60, formats: ['mp4', 'mov'] },
  audio: { maxSizeMB: 25, maxDurationSec: 300, formats: ['mp3', 'm4a', 'wav'] },
};

// Texto via i18n:
t('diary.mediaLimitPhoto', { size: MEDIA_LIMITS.photo.maxSizeMB })
t('diary.mediaLimitVideo', { size: MEDIA_LIMITS.video.maxSizeMB, duration: 60 })
```

---

## Painel Tab do Help Modal — 20 lentes

```typescript
// Feature pendente: listar as 20 lentes com ícones Lucide + descrições i18n
// Componente: components/diary/HelpModal/PainelTab.tsx

// Ícones Lucide mapeados por tipo:
const LENS_ICONS = {
  health_visual: Eye,
  body_condition: Scale,
  vital_signs: Heart,
  symptoms: AlertTriangle,
  wound_assessment: Bandage,
  medication_tracker: Pill,
  vaccination: Syringe,
  behavior_analysis: Brain,
  mood_tracker: Smile,
  play_activity: Gamepad2,
  social_interaction: Users,
  nutrition: Apple,
  hydration: Droplets,
  exercise: Activity,
  weight_tracking: TrendingUp,
  environment: Home,
  grooming: Scissors,
  sleep_pattern: Moon,
  stress_level: Zap,
  general_diary: BookOpen,
} as const satisfies Record<LensType, LucideIcon>;

// Textos via i18n (nunca hardcoded):
{lensTypes.map(type => (
  <LensListItem
    key={type}
    icon={LENS_ICONS[type]}
    title={t(`diary.lens.${type}.title`)}
    description={t(`diary.lens.${type}.description`)}
  />
))}
```

---

## Regras de UI para lens cards

```typescript
// 1. NUNCA emojis — sempre Lucide:
<Syringe size={rs(20)} color={colors.accent} />   // ✅
<Text>💉</Text>                                    // ❌

// 2. NUNCA strings hardcoded:
<Text>{t('diary.lens.vaccination.title')}</Text>   // ✅
<Text>Vacinação</Text>                             // ❌

// 3. NUNCA pixels fixos:
style={{ width: rs(60), padding: rs(12) }}         // ✅
style={{ width: 60, padding: 12 }}                 // ❌

// 4. Fallbacks para extracted_data ausente:
const score = extractedData?.overall_score ?? '—';
const issues = extractedData?.visible_issues ?? [];

// 5. Health Score display:
// 0-100 calculado pela IA
// cores: success (≥70), warning (40-69), danger (<40)

// 6. Narração IA — fonte Caveat:
<Text style={{ fontFamily: 'Caveat', fontSize: fs(16) }}>
  {entry.ai_narration}
</Text>
```

---

## Mood types (constants/moods.ts)

```typescript
type Mood = 'ecstatic' | 'happy' | 'calm' | 'tired' | 'anxious' | 'sad' | 'playful' | 'sick';
// Cada mood tem: cor, label i18n, ícone Lucide
```
