---
name: edge-function-deploy
description: |
  Use when: Supabase Edge Function, deploy, Deno, verify_jwt, background call,
  CORS, 401 error, function not found, getAIConfig, callClaude, narration,
  analyze-photo, OCR, audio analysis, supabase functions deploy, timeout,
  edge function error, shared helpers, _shared folder.
  Trigger with: Edge Function, Deno, verify_jwt, deploy, CORS, 401,
  getAIConfig, callClaude, narration, OCR, analyze, supabase functions.
---

# Edge Functions — auExpert

## ⛔ Modelo de IA nunca hardcoded em Edge Functions

```typescript
// ❌ PROIBIDO — hardcodar modelo:
model: 'claude-sonnet-4-20250514'

// ✅ CORRETO — sempre via getAIConfig:
import { getAIConfig } from '../_shared/ai-config.ts';
const cfg = await getAIConfig(supabase);
model: cfg.ai_model_vision   // ou classify, narrate, audio, etc
```

---

## REGRA CRÍTICA — `verify_jwt: false` para background invocations

Funções chamadas em background (após salvar uma entrada, sem usuário na tela)
precisam de `verify_jwt: false` para evitar erro 401 silencioso.

```typescript
// Configuração no final da Edge Function:
Deno.serve(async (req) => {
  // ... handler
}, { verify_jwt: false });

// OU via config.toml:
// [functions.analyze-photo]
// verify_jwt = false
```

---

## Estrutura das Edge Functions

```
supabase/functions/
  _shared/
    ai-config.ts      ← getAIConfig(supabase) — SEMPRE usar isso
    callClaude.ts     ← callClaude(messages, cfg, options?)
    supabase.ts       ← createSupabaseClient(req)
    cors.ts           ← corsHeaders + OPTIONS handler
  analyze-photo/      ← análise de foto/imagem (vision)
  narrate-entry/      ← narração IA na voz do pet
  classify-entry/     ← classificação de texto + gastos
  generate-embedding/ ← embeddings para RAG
  anonymize-entry/    ← anonimização LGPD
  check-scheduled-events/
  analyze-health-patterns/
  preventive-care-alerts/
  financial-monitor/
  weather-alerts/
```

---

## Template base de Edge Function

```typescript
// supabase/functions/minha-funcao/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAIConfig } from '../_shared/ai-config.ts';
import { callClaude } from '../_shared/callClaude.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  // CORS preflight:
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Supabase client:
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 2. AI config — NUNCA hardcodar modelo:
    const cfg = await getAIConfig(supabase);

    // 3. Dados da requisição:
    const { petId, entryId, data } = await req.json();

    // 4. Chamar Claude via callClaude (model de cfg):
    const response = await callClaude(
      [{ role: 'user', content: data }],
      cfg,
      { modelOverride: cfg.ai_model_classify }
    );

    // 5. Salvar resultado no banco com is_active = true:
    await supabase.from('minha_tabela').insert({
      pet_id: petId,
      result: response.content[0].text,
      is_active: true,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[minha-funcao] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}, { verify_jwt: false });
```

---

## CORS headers (_shared/cors.ts)

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};
```

---

## Deploy (PowerShell / terminal VS Code)

```powershell
# Login (1x só):
supabase login

# Deploy de função específica:
supabase functions deploy analyze-photo --project-ref $env:SUPABASE_PROJECT_REF

# Deploy de todas:
supabase functions deploy --project-ref $env:SUPABASE_PROJECT_REF

# Secrets (variáveis de ambiente da função):
supabase secrets set ANTHROPIC_API_KEY=sk-ant-... --project-ref $env:SUPABASE_PROJECT_REF

# Listar secrets:
supabase secrets list --project-ref $env:SUPABASE_PROJECT_REF
```

---

## Troubleshooting

### 401 Unauthorized
```
Causa: verify_jwt não está false em invocação background
Fix:   Adicionar verify_jwt: false → redeploy → aguardar ~30s
```

### 404 Function Not Found
```
Causa: nome diferente entre pasta e chamada no app
Fix:   Verificar nome da pasta em supabase/functions/
       A chamada no app: supabase.functions.invoke('nome-exato', ...)
```

### Timeout (524)
```
Causa: análise de imagem > 60s (limite padrão)
Fix:   Processar de forma assíncrona (salvar ID + webhook)
       Ou quebrar análise em partes menores
```

### Áudio rejeitado pela API
```
Causa: Supabase Storage reporta todos .mp4 como video/mp4
Fix:   detectAudioMimeFromBytes() — lê magic bytes reais
       Verificar se modelo suporta áudio (usar cfg.ai_model_audio)
```

---

## Chamar Edge Function do app

```typescript
// lib/ai.ts ou hooks/useDiary.ts:
const { data, error } = await supabase.functions.invoke('analyze-photo', {
  body: {
    imageBase64,
    petId,
    diaryEntryId,
    lensTypes,
  },
});

if (error) {
  console.error('[analyze-photo] invoke error:', error);
  toast(t('errors.analysisFailed'), 'error');
  return;
}

console.log('[analyze-photo] result:', data?.extracted_data);
```

---

## Testar localmente

```powershell
# Subir Supabase local:
supabase start

# Servir função:
supabase functions serve analyze-photo --env-file .env.local

# Testar (PowerShell):
$body = @{ petId = "uuid"; data = "teste" } | ConvertTo-Json
Invoke-WebRequest `
  -Uri "http://localhost:54321/functions/v1/analyze-photo" `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body $body
```
