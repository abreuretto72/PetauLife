# Documentation Updates — 2026-04-06

## Summary of Changes to ARCHITECTURE.md

This document captures the architecture updates reflecting code changes made to:
- `hooks/useDiaryEntry.ts`
- `supabase/functions/analyze-pet-photo/index.ts`
- `components/diary/DiaryModuleCard.tsx`

---

## Updated Sections

### 1. **Header & Timestamp**
- Updated last modified date to **2026-04-06**
- Added status: "Photo Analysis Enhancements"

### 2. **Diário Module Section** (Queries, Mutations, IA Classification)

#### New Queries:
- `useDeletedRecords(petId)` — Queries deleted diary entries (soft delete audit trail)

#### Enhanced Mutations:
- `addEntry()` — Now uses IA classification instead of older narration-first approach
- `deleteEntry()` — Now explicitly includes soft delete with audit trail (deleted_by, deleted_at)
- `restoreEntry()` — New mutation to restore deleted entries (owner/co_parent only)

#### New Subsections:

**IA Classification & Module Extraction:**
- Documents `classifyDiaryEntry()` return structure
- Explains `saveToModule()` loop that writes to appropriate health tables
- Documents `createFutureEvent()` for scheduled appointments
- Explains RAG embedding pipeline

**Photo Analysis Pipeline:**
- Documents `_photoAnalysis()` flow in `hooks/useDiaryEntry.ts`
- Key insight: **videoThumbnailUrl extracted from video (frame 1), NOT tutor's photo**
- Explains `bgSession` token fetching for background invocations (prevents 401 JWT errors)
- Documents `analyze-pet-photo` parameters: photo_base64, species, language, media_type
- Explains `photoResultsRaw` array: **must use `.map()` not `.filter()` to preserve indices**
- Documents [DIAG] logging for analysis debugging

**DiaryModuleCard — buildModuleValue():**
- Explains mapping strategy: tries moduleRow (DB) first, fallback to extracted_data (IA)
- Documents special cases:
  - `weight`: includes `d.current_weight` fallback
  - `symptom`: handles array of strings, joins with ', '
  - `consultation`/`return_visit`: adds 'provider' to fallback chain

### 3. **New Section: AI Analysis Pipeline — Photo + Text Classification**

Inserted comprehensive section documenting:

#### Photo Analysis Flow (Vision)
- Complete flow diagram (9 steps)
- Detailed API contract for `analyze-pet-photo` function
- Key technical details:
  - Video frame extraction (NOT tutor's photo)
  - Species parameter criticality
  - Language parameter localization
  - JWT handling for background invocations
  - Index preservation in arrays

#### Text Classification Flow (Diary Entry)
- Entry point: `hooks/useDiaryEntry.ts` → `savePending()`
- Classification types and module routing

#### Module Extraction & Display
- Documents all classification types
- Explains `buildModuleValue()` fallback strategy
- Describes DiaryCard UI patterns (edit, delete buttons)

### 4. **Edge Functions Table** (Major Overhaul)

Reorganized and enhanced the Edge Functions table:

**Changed `analyze-pet-photo` row:**
- FROM: `| analyze-pet-photo | foto base64 + pet | raça, humor, saúde |`
- TO: `| analyze-pet-photo | { photo_base64, species, language, media_type } | { identification, health, mood, environment, alerts, toxicity_check, description } |`

**Added detailed enhancements subsection:**
```
**analyze-pet-photo Enhancements (2026-04-06):**
- Content-aware: Detects non-pet content (feces, plants, wounds, food, objects)
- Required description field: never null
- Toxicity check with severity levels
- Feces identification with color/consistency guide
- Species parameter for context-aware analysis
- Language parameter for localized responses
- JWT handling without --no-verify-jwt flag
- bgAuthHeader for background invocations
```

---

## Key Technical Insights Documented

### Video Thumbnail Extraction
The `videoThumbnailUrl` is extracted from video frame 1 and sent to the AI, NOT the user's profile picture. This prevents confusion in photo analysis.

### Array Index Preservation
`photoResultsRaw` must use `.map()` not `.filter()` to maintain positional alignment:
```
photos[0] ↔ photoResultsRaw[0]
photos[1] ↔ photoResultsRaw[1]
```

### Background Invocation Authentication
Background `invoke()` calls fetch a `bgSession` token before calling the Edge Function to prevent 401 JWT expiration errors.

### Content-Aware Photo Analysis
The `analyze-pet-photo` Edge Function now handles:
- Direct pet photos
- Feces/excrement (clinical identification)
- Plants (toxicity)
- Wounds
- Food items
- Objects
- Environment

Each type gets a clinically relevant description in the tutor's language.

### Module Extraction Strategy
When displaying module summaries, the system tries:
1. moduleRow (DB record) — source of truth
2. extracted_data (IA suggestions) — fallback

This ensures editable values always show, with IA as secondary reference.

---

## Files Modified

- **`docs/CODEMAPS/ARCHITECTURE.md`** — 800+ lines updated/expanded

---

## Related Implementation Files

These changes reflect work in:
- **`hooks/useDiaryEntry.ts`** — Video thumbnail, array indexing, species parameter, JWT handling
- **`supabase/functions/analyze-pet-photo/index.ts`** — Content-aware analysis, required description, toxicity check, feces guide
- **`components/diary/DiaryModuleCard.tsx`** — buildModuleValue() logic, fallback chains

---

## Next Steps

1. Verify all updated section links in ARCHITECTURE.md are correct
2. Cross-reference with CLAUDE.md for consistency
3. Update INDEX.md if section structure changed
4. Consider creating separate PHOTO_ANALYSIS.md if this section grows beyond 100 lines

