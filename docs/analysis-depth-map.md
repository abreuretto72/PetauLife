# Mapa das 4 Fases de Análise IA — auExpert

**Atualizado:** 2026-04-24
**Aplicação:** entrada no diário (pipeline inteiro — classify + photo + narration)
**Regra-raiz:** **modelos NÃO mudam entre fases.** O que varia é `prompt + max_tokens + lista de campos exigidos`.

---

## Visão geral dos 4 níveis

| Fase | Chip | Chamadas IA | Tempo total (texto+foto) | Custo/entry |
|---|---|---|---|---|
| **Off** | `Sem` | nenhuma | ~3s (só uploads + DB) | $0 |
| **Fast** | `Rápida` | 3 EFs c/ prompts compactos | ~45s | ~$0,04 |
| **Balanced** | `Moderada` | 3 EFs c/ prompts médios | ~60s | ~$0,15 |
| **Deep** | `Profunda` | 3 EFs c/ prompts Elite | ~150s (2min30s) | ~$0,55 |

> Tempos para entrada completa: **1 vídeo + 2 fotos + 1 áudio + 1 scanner + 5 métricas clínicas + narração**.
> Gargalo varia por fase: Fast = vídeo Gemini; Balanced = classify com 5 métricas clínicas; Deep = analyze-pet-photo com Opus 4.7 Elite + classify completo.
> Entradas leves (texto-puro) são muito mais rápidas.

Os 3 callers que mudam por fase:
1. **classify-diary-entry** (texto + classificação + narração breve + tags)
2. **analyze-pet-photo** (foto do pet quando anexada)
3. **generate-diary-narration** (narração expandida quando ativada)

---

## FASE 1 — OFF (Sem)

**Intent:** registro cronológico puro. Tutor só quer arquivar a entrada.

### Comportamento
- Nenhuma EF de IA é chamada.
- Entry persiste normalmente em `diary_entries` com:
  - `narration: null`
  - `classifications: []`
  - `photo_analysis_data: null`
  - `tags_suggested: []`
  - `mood: 'calm'` (default, ou o que o tutor selecionou manualmente)
- Fotos/áudios continuam sendo armazenados no Supabase Storage e mostrados no card, **sem análise**.
- Card do diário na timeline vira "done" imediatamente (sem passar por "processing").

### Frontend
- `hooks/_diary/backgroundClassify.ts` detecta `depth === 'off'` e rota para `skipAIPath` (já existe).
- Nenhuma chamada a Anthropic API.

### Custo
- $0
- Ideal para: momentos cotidianos, conectividade ruim, economia de bateria/dados.

---

## FASE 2 — FAST (Rápida)

**Intent:** classificação objetiva em segundos. "O que é essa entrada e como ela se parece?"

### classify-diary-entry
- **Modelo:** `claude-sonnet-4-6` (cadeia atual)
- **max_tokens:** `2000` (espaço pra até 5 métricas clínicas estruturadas)
- **Prompt:** versão COMPACTA
  - Pede identificar até 5 `classifications` com `type + confidence` apenas (nada de `extracted_data` rico)
  - `primary_type`, `mood`, `urgency`
  - `narration`: 1 a 2 frases (max 50 palavras), 3ª pessoa, factual, registro Elite
  - `tags_suggested`: máx 3 tags, curtas
  - **Não pede:** `clinical_metrics`, `suggestions`, `validation_warning`, `extracted_data.rationale`

### analyze-pet-photo
- **Modelo:** `claude-opus-4-7` (com fallback 4-6 → sonnet-4-6)
- **max_tokens:** `1500`
- **Prompt:** versão COMPACTA
  - `identification` completa (raça, porte, idade, peso, sexo, pelagem)
  - `mood.primary` com confidence (sem `signals`, sem `body_language_reading`)
  - 2 a 3 `alerts` com `message + severity` apenas
  - `description`: 2 frases clínicas objetivas
  - **Não pede:** `health.skin_coat/eyes/ears/...`, `clinical_reasoning`, `differentials`, `breed_specific_context`, `recommendations`, `follow_up_questions`

### generate-diary-narration
- **Modelo:** `claude-sonnet-4-6`
- **max_tokens:** `500`
- **Prompt:** super compacto
  - 1 a 2 frases factuais, 3ª pessoa, sem ornamento literário
  - Sem referência a RAG, sem predisposições de raça

### Tempo & custo
- Text-only entry: **~8s** ($0,005)
- Entry com foto: **~25s** ($0,025)
- Entry com foto + áudio: **~30s** ($0,03)

---

## FASE 3 — BALANCED (Moderada, default)

**Intent:** sweet spot — contexto suficiente pra ser útil clinicamente sem gastar tempo/custo de Elite.

### classify-diary-entry
- **Modelo:** `claude-sonnet-4-6`
- **max_tokens:** `3500`
- **Prompt:** MÉDIO
  - Pede `classifications` com `type + confidence + extracted_data` (campos-chave por tipo, sem rationale)
  - `narration`: 80-120 palavras, 3ª pessoa contemplativa (registro Elite Clarice)
  - `mood + urgency + clinical_metrics` (peso, temperatura, etc. se mencionados)
  - `suggestions`: 2-3 itens curtos
  - `tags_suggested`: 4-6 tags
  - **Pula:** `validation_warning` avançado, cadeia de raciocínio clínico, referências

### analyze-pet-photo
- **Modelo:** `claude-opus-4-7`
- **max_tokens:** `3500`
- **Prompt:** MÉDIO
  - `identification` completa
  - `health` com `body_condition_score`, `skin_coat + eyes + ears + mouth_teeth + posture_body` — cada um com `observation + severity + confidence` (sem `rationale` nem `clinical_significance`)
  - `mood` com `primary + confidence + signals` (sem `body_language_reading` profundo)
  - `environment` básico
  - `alerts`: 3-5, cada um com `message + severity + category + why_it_matters`
  - `description`: 4-6 frases integrando achados
  - **Não pede:** `clinical_reasoning`, `differentials`, `breed_specific_context`, `age_specific_context`, `follow_up_questions`, `recommendations` estruturadas, `prognostic_outlook`, `sources`

### generate-diary-narration
- **Modelo:** `claude-sonnet-4-6`
- **max_tokens:** `1000`
- **Prompt:** padrão atual (Elite Clarice, 80-120 palavras, 3ª pessoa, contemplativa)
- Pode referenciar 2-3 memórias recentes via RAG

### Tempo & custo
- Text-only entry: **~25s** ($0,015)
- Entry com foto: **~50s** ($0,12)
- Entry com foto + áudio: **~60s** ($0,15)

---

## FASE 4 — DEEP (Profunda)

**Intent:** laudo specialist-grade. Justificativa: quando há preocupação real de saúde ou o tutor quer máximo valor.

### classify-diary-entry
- **Modelo:** `claude-sonnet-4-6`
- **max_tokens:** `6000`
- **Prompt:** ELITE ATUAL inteiro
  - Todos os campos: `classifications` com `extracted_data` rico + rationale
  - `narration`: até 150 palavras contextualizadas com RAG
  - `clinical_metrics`, `suggestions` estruturadas, `validation_warning`, `differential_hypotheses` quando aplicável
  - Tags temáticas + narrativas

### analyze-pet-photo
- **Modelo:** `claude-opus-4-7`
- **max_tokens:** `8000`
- **Prompt:** ELITE ATUAL inteiro (v46)
  - Identificação + `health` com `rationale + clinical_significance` em cada observação
  - `mood` completo com `body_language_reading`, `stress_indicators`, `welfare_flags`
  - `alerts` com `why_it_matters + what_to_monitor + red_flags + time_frame`
  - `clinical_reasoning` (chain-of-inference)
  - `differential_considerations` com `likelihood + distinguishing_features + recommended_test`
  - `breed_specific_context` + `age_specific_context`
  - `follow_up_questions` (2-4)
  - `recommendations` (immediate / short_term / preventive)
  - `prognostic_outlook`
  - `sources` (referências científicas citadas)

### generate-diary-narration
- **Modelo:** `claude-sonnet-4-6`
- **max_tokens:** `1500`
- **Prompt:** ELITE
  - ~150 palavras, registro Clarice Lispector
  - Integra RAG (últimas 5 memórias relevantes do pet)
  - Pode referenciar contexto de raça/idade
  - Sensorial, contemplativa, nunca melodramática

### Tempo & custo
- Text-only entry: **~50s** ($0,06)
- Entry com foto: **~120s** ($0,48)
- Entry com foto + áudio: **~130s** ($0,50)

---

## Propagação end-to-end

1. **UI** (`app/(app)/pet/[id]/diary/new.tsx`): 4 chips + ícone `Info` + modal
2. **Store** (`stores/diaryAIToggleStore.ts`): `depth: 'off' | 'fast' | 'balanced' | 'deep'`, default `balanced`
3. **Handler** (`components/diary/new/handleSubmitText.ts`): passa `depth` via `params`
4. **Orchestrator** (`hooks/_diary/backgroundClassify.ts`): propaga `depth` pras 3 rotinas
5. **Callers** (`lib/ai.ts`):
   - `classifyDiaryEntry({ ..., analysis_depth })` → body da invoke
   - `analyzePetPhoto({ ..., analysis_depth })` → idem
   - `narrateDiaryEntry({ ..., analysis_depth })` → idem
6. **EFs** leem `body.analysis_depth`, selecionam prompt correspondente + `max_tokens`, e executam.

## Defaults & fallbacks

**Regra por contexto:**
- **Cadastro de novo pet (AddPetModal)** → sempre `deep` (não exposto ao tutor; onboarding único merece análise Elite pra popular raça, peso, idade, etc. com máximo rigor)
- **Entrada de diário (diary/new.tsx)** → configurável via seletor; default na primeira instalação = `fast`

**Migração de versões antigas:**
- `enabled: true` legado → `fast` (novo default, não `deep`, pra evitar surpresa de tempo longo)
- `enabled: false` legado → `off`

**Fallback no backend:**
- Se EF recebe `analysis_depth` inválido/faltante → aplica `balanced` silenciosamente

## Ícone Info + Modal

Visual:
- Ícone `Info` (lucide) ao lado do título "Profundidade da análise"
- Toque abre Modal centralizado com 4 cards (um por fase) contendo:
  - Ícone + título + tempo estimado
  - Descrição: o que é entregue
  - Quando usar
- Botão "Entendi" fecha

---

## Próximos passos da implementação (4 fases)

1. ✅ **Store + i18n** — feito
2. **UI + Modal** — tela `diary/new.tsx` + componente `AnalysisDepthInfoModal`
3. **Propagação** — `lib/ai.ts`, `hooks/_diary/*`, `components/diary/new/handleSubmitText.ts`
4. **EFs** — 3 deploys com prompts variantes + params

---

*Documento de referência. Atualizar quando os prompts finais forem redigidos.*
