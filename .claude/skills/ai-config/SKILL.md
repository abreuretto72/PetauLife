---
name: ai-config
description: |
  Use when: calling Claude API, AI model, getAIConfig, model name, claude-sonnet,
  claude-haiku, hardcoded model, Edge Function AI call, narration, classification,
  vision, audio analysis, chat, insights, ai_model_classify, ai_model_vision,
  ai_model_audio, callClaude, modelOverride, app_config table.
  Trigger with: model, claude-sonnet, claude-haiku, getAIConfig, AI call,
  narration, classification, vision, audio, callClaude, ai_model.
---

# AI Config — auExpert

## ⛔ NUNCA hardcodar nome do modelo

```typescript
// ❌ ABSOLUTAMENTE PROIBIDO:
model: 'claude-sonnet-4-20250514'
model: 'claude-haiku-4-5-20251001'
model: 'claude-sonnet-4-6'

// ✅ SEMPRE via getAIConfig:
const aiConfig = await getAIConfig(supabase);
model: aiConfig.ai_model_vision
```

---

## Helper: `getAIConfig`

```typescript
// supabase/functions/_shared/ai-config.ts
import { getAIConfig } from '../_shared/ai-config.ts';

// Uso em qualquer Edge Function:
const supabase = createSupabaseClient(req);
const cfg = await getAIConfig(supabase);

// Campos disponíveis:
cfg.ai_model_classify   // classificação de texto/entrada
cfg.ai_model_vision     // análise de foto/imagem (supports vision)
cfg.ai_model_chat       // conversa/resposta ao tutor
cfg.ai_model_narrate    // narração na voz do pet (Caveat font)
cfg.ai_model_insights   // análise de padrões, tendências
cfg.ai_model_simple     // tarefas simples (haiku — mais barato)
cfg.ai_model_audio      // análise de áudio (modelos 4.5+ apenas)
```

### Modelos atuais no banco (`app_config`)
```sql
ai_model_classify  → claude-sonnet-4-20250514
ai_model_vision    → claude-sonnet-4-20250514
ai_model_chat      → claude-sonnet-4-20250514
ai_model_narrate   → claude-sonnet-4-20250514
ai_model_insights  → claude-sonnet-4-20250514
ai_model_simple    → claude-haiku-4-5-20251001
ai_model_audio     → claude-sonnet-4-6  (suporta audio input)
```

**Para mudar o modelo: 1 UPDATE no banco, zero redeploy.**

---

## Padrão `callClaude` com `modelOverride`

```typescript
// supabase/functions/_shared/callClaude.ts
export const callClaude = async (
  messages: MessageParam[],
  cfg: AIConfig,
  options?: {
    modelOverride?: string;   // para audio — usa cfg.model_audio
    system?: string;
    maxTokens?: number;
  }
) => {
  const model = options?.modelOverride ?? cfg.ai_model_classify;

  return await anthropic.messages.create({
    model,
    max_tokens: options?.maxTokens ?? 1024,
    system: options?.system,
    messages,
  });
};

// Uso para áudio (modelo específico que suporta audio blocks):
const response = await callClaude(messages, cfg, {
  modelOverride: cfg.ai_model_audio,
});

// Uso para visão:
const response = await callClaude(messages, cfg, {
  modelOverride: cfg.ai_model_vision,
});
```

---

## Análise de Foto (vision)

```typescript
// Edge Function: supabase/functions/analyze-photo/index.ts
Deno.serve(async (req) => {
  const { imageBase64, petId, diaryEntryId, lensTypes, petInfo } = await req.json();

  const cfg = await getAIConfig(supabase);

  const response = await anthropic.messages.create({
    model: cfg.ai_model_vision,   // ← nunca hardcoded
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
        },
        { type: 'text', text: buildPrompt(lensTypes, petInfo) },
      ],
    }],
  });

  return new Response(JSON.stringify({ extracted_data: parseResponse(response) }));
}, { verify_jwt: false });
```

---

## Análise de Áudio

```typescript
// Audio: modelos 4.5+ APENAS (sonnet-4-6 ou superior)
// Verificação de MIME real por magic bytes:
// detectAudioMimeFromBytes() lê primeiros 8 bytes para identificar formato real
// Supabase Storage reporta .mp4 como video/mp4 — magic bytes detectam MP3/WAV/etc

const audioMime = await detectAudioMimeFromBytes(audioBytes);

const response = await callClaude(
  [{
    role: 'user',
    content: [{
      type: 'document',
      source: { type: 'base64', media_type: audioMime, data: audioBase64 },
    }],
  }],
  cfg,
  { modelOverride: cfg.ai_model_audio }  // ← modelo específico para áudio
);
```

### MIME types suportados pela Anthropic API (áudio)
```typescript
// DocumentPicker filtra apenas estes:
const SUPPORTED_AUDIO_MIMES = [
  'audio/mpeg',      // MP3
  'audio/mp4',       // M4A/AAC
  'audio/wav',       // WAV
  'audio/ogg',       // OGG
  'audio/flac',      // FLAC
  'audio/webm',      // WebM
  // + 4 outros
];
```

---

## Narração na voz do pet

```typescript
// Modelo: cfg.ai_model_narrate
// Sistema de narração: 3ª pessoa, voz do pet
// SEMPRE em 3ª pessoa: "O Rex foi ao parque" — nunca "Fui ao parque"
// Exibição: fonte Caveat (cursiva) — diferencia da UI normal

const narrateEntry = async (entryText: string, petInfo: PetInfo, cfg: AIConfig) => {
  const response = await callClaude(
    [{
      role: 'user',
      content: `Narra em 3ª pessoa, na voz do pet ${petInfo.name}
                (${petInfo.species}, ${petInfo.breed}): "${entryText}"`,
    }],
    cfg,
    {
      modelOverride: cfg.ai_model_narrate,
      system: `Você é ${petInfo.name}, um ${petInfo.species}.
               Narre SEMPRE em 3ª pessoa: "O ${petInfo.name}..." nunca "Eu..."`,
    }
  );
  return response.content[0].text;
};
```

---

## RAG por Pet — Isolamento absoluto

```typescript
// SEMPRE filtrar por pet_id — NUNCA misturar memórias de pets diferentes:
const memories = await supabase
  .from('pet_memories')
  .select('*')
  .eq('pet_id', petId)   // ← obrigatório
  .eq('is_active', true)
  .order('importance', { ascending: false });

// Importâncias por tipo:
// allergy 0.95, vaccine 0.9, medication 0.85,
// consultation 0.8, symptom 0.8, exam 0.75,
// weight 0.7, food 0.6, moment 0.5, expense 0.4
```

---

## Cache do getAIConfig

O helper cacheia por 5 minutos com fallback seguro.
Se o banco estiver indisponível, usa valores padrão do código (nunca deixa sem modelo).
