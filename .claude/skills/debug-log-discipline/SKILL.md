---
name: debug-log-discipline
description: |
  Use when: removing console.log, cleaning code, refactoring, removing debug
  logs, lint warnings about console, "clean up", "remove logs", "remove debug",
  eslint console warnings, code cleanup, removing temporary code.
  Trigger with: console.log, debug log, remove log, clean code, refactor,
  cleanup, lint, eslint, debugging, log removal.
---

# Debug Log Discipline — auExpert

## A REGRA

> **Logs de debug só são removidos APÓS confirmar visualmente que o bug
> associado está resolvido** — tutor testou no app e confirmou funcionamento.

---

## Quando Claude tenta remover logs

```
❌ Não aceitar: "Removi os console.logs desnecessários"
❌ Não aceitar: "Fiz uma limpeza, removi os logs de debug"
❌ Não aceitar: "O bug está corrigido, podemos remover"

✅ Aceitar: "Mantive os logs — avise quando confirmar o fix"
✅ Aceitar: "Logs do [módulo X] ainda ativos para monitorar"
```

---

## Logs ativos — não remover sem confirmação

```typescript
// fetchDiaryEntries — zero results
console.log('[fetchDiaryEntries] count:', data?.length, 'pet:', petId);
console.error('[fetchDiaryEntries] error:', error);

// handleSubmitText — null crash com vídeo sem foto
console.log('[handleSubmitText] media:', mediaAttachments.map(m => m.type));

// Edge Functions — erros de invocação
console.error('[analyze-photo] invoke error:', error);
console.log('[analyze-photo] result:', data?.extracted_data);

// Auth — race condition
console.log('[auth] onAuthStateChange event:', event);

// Cache — API totals em 0
console.log('[apiTotals] data:', data, 'isLoading:', isLoading);
```

---

## Logs que podem ser removidos

```typescript
// Dados sensíveis — remover imediatamente:
console.log('senha:', password);        // ❌ AGORA
console.log('api key:', key);           // ❌ AGORA

// Logs de teste pontual:
console.log('teste 123');              // ✅ pode remover
console.log('chegou aqui');            // ✅ pode remover
```
