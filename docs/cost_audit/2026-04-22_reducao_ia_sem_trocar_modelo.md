---
Data: 2026-04-22
Escopo: reduzir custo de IA (Claude + Gemini) do auExpert **sem alterar os modelos atuais**
        e **sem degradar qualidade** das análises entregues ao tutor.
Modelos preservados: Sonnet 4.6 (classify/vision/chat/narrate/insights),
                     Haiku 4.5 (simple), Gemini 3-flash (audio/video).
Premissa: cada alavanca abaixo é revisada para que a *saída ao tutor*
          permaneça idêntica ou melhor.
---

# Sumário executivo

A análise combinou (a) leitura das 12 Edge Functions que chamam IA,
(b) medição dos prompts reais, (c) contagem empírica dos últimos 30 dias
no Supabase. O gargalo de custo está concentrado em três lugares:

1. **classify-diary-entry** — executado em 71 entradas/30d (≈55% com foto).
   Prompt de sistema de ~7 800 tokens. Já usa prompt caching; o trabalho
   é **elevar a taxa de hit** e **reduzir a fração não-cacheável**.
2. **pet-assistant** — prompt reconstruído em cada turno, o que impede
   cache hit a partir do 2º turno. O system prompt contém dados do pet
   (vacinas, alergias, RAG etc.) que variam pouco dentro de uma sessão.
3. **8 outras Edge Functions que não têm `cache_control` algum**:
   `generate-ai-insight`, `generate-prontuario`, `generate-cardapio`,
   `evaluate-nutrition`, `translate-strings`, `generate-personality`,
   `bridge-health-to-diary`, `pet-assistant`. Cada chamada paga
   100% do input toda vez — mesmo quando o system é quase imutável.

O plano abaixo é ordenado por ROI, com **impacto estimado em %
de tokens de input cobrados**. Nenhuma alavanca mexe em modelo ou em
max_tokens de forma que reduza o tamanho máximo de saída atualmente
usado pelo app.

---

## Dados empíricos (últimos 30 dias)

| Métrica | Valor |
|---|---|
| diary_entries | 71 |
| entries com foto | 39 (55%) |
| ocr_scan / pet_audio / video / pdf_upload | 16 / 7 / 5 / 0 |
| photo_analyses (fluxo dedicado) | 18 |
| pet_insights (diário automático) | 18 |
| assistant_turns (pet-assistant) | 16 |
| rag_conversations | 0 (não está sendo gravado) |
| prontuario_cache gerado | 1 |
| tutores ativos / pets ativos | 4 / 8 |
| entradas por pet/mês (avg / p50 / p90 / max) | 8,9 / 2 / 20 / 58 |
| fotos por entry: distribuição | 1 foto = 28 · 2 fotos = 9 · 3 fotos = 1 · 4 fotos = 1 |

Observação: o limite atual do código em entradas do diário é de
**5 fotos permitidas** na UI, mas o classifier recorta para no máximo
**2 imagens** antes de chamar Claude. O p99 real de fotos enviadas é 2.

---

## Alavanca 1 — Ativar `cache_control` nas 8 funções sem caching (maior ROI)

**Diagnóstico.** Apenas 4 EFs hoje passam `system[].cache_control`:
`analyze-pet-photo`, `generate-diary-narration`, `ocr-document`, e a
`callClaude.ts` do classifier. As outras 8 mandam o system prompt sem
cache — Claude cobra input cheio em toda chamada.

**Ação sugerida.** Para cada EF, fazer duas edições cirúrgicas:

(i) Separar o **núcleo estável** do **núcleo variável**. Hoje, várias EFs
interpolam nome do pet, raça, mood dominante etc. direto no system.
Isso *invalida o cache a cada chamada* — o hash do prefixo muda.

(ii) Reescrever em duas camadas:

```ts
// ANTES — system muda a cada chamada, cache nunca bate
system: `Você é o assistente de ${pet.name}. Vacinas: ...\nAlergias:...`

// DEPOIS — system fixo (cacheado), dados do pet vão na primeira user message
system: [
  {
    type: 'text',
    text: STATIC_SYSTEM_RULES,              // regras, formato de saída, tom
    cache_control: { type: 'ephemeral' },
  },
],
messages: [
  { role: 'user', content: `PET PROFILE:\n...\nPERGUNTA: ${msg}` },
]
```

**Impacto esperado em input tokens cobrados:**

| Função | System total | Parte cacheável | Economia em input cobrado |
|---|---:|---:|---:|
| pet-assistant | ~2 000 tok | ~700 tok (regras) | –45% a –90%* |
| generate-ai-insight | ~350 tok | ~180 tok | –50% |
| generate-personality | ~500 tok | ~220 tok | –45% |
| bridge-health-to-diary | ~400 tok | ~180 tok | –45% |
| translate-strings | ~280 tok | 100% cacheável | –85% |
| generate-prontuario | (prompt grande) | maior parte cacheável | a confirmar ao medir |
| generate-cardapio | — | maior parte cacheável | a confirmar |
| evaluate-nutrition | — | maior parte cacheável | a confirmar |

\*No pet-assistant a economia vai muito além do 45% quando a sessão tiver
≥2 turnos (ver Alavanca 2).

**Qualidade.** Zero mudança. O conteúdo entregue ao modelo é literalmente
o mesmo — só reordenado (regras no system, dados na user message).
Cache é prefixo: Claude lê o system do cache e processa só a user
message. Mesma resposta.

**Risco.** Cache TTL é ~5 min. Se a EF for chamada esporadicamente, cada
primeira chamada paga **+25% sobre o input cacheável** (custo de escrita
de cache). Ou seja: vale para EFs com frequência ≥ 1 chamada / 5 min por
conteúdo. Para `translate-strings` (usada em build/setup), vale a pena
mesmo assim: o desconto de leitura é 90%.

---

## Alavanca 2 — Reaproveitar o system do pet-assistant entre turnos

**Diagnóstico.** Hoje, em cada turno, `pet-assistant/index.ts` refaz
fetchs paralelos (pet, vacinas, alergias, meds, consultas, diário, RAG)
e reconstrói o system prompt *do zero*. Resultado:

- Turno 1 paga input completo (~2 000 + dados do pet).
- Turnos 2..N pagam de novo o input completo — zero aproveitamento,
  apesar de 90% do conteúdo do system ser idêntico ao turno anterior.
- O `conversation_history` já é enviado, mas o cache só bate se o **prefix
  do system** for idêntico.

**Ação sugerida.** Três mudanças cumulativas:

1. Marcar o system com `cache_control` (Alavanca 1).
2. **Mover os dados do pet (profile, vacinas, alergias, meds, consultas,
   diário, RAG) do system prompt para uma "system-like" user message
   inicial**, também marcada com `cache_control`, mantida através do
   `conversation_history`. Claude cacheia até o último bloco com
   `cache_control` encontrado no prefixo.
3. Cachear em memória (ou no DB `pet_conversations`) um "snapshot" dos
   dados do pet por N minutos, com invalidação por evento (nova vacina,
   novo diary entry). Evita refazer 7 queries + 1 search-rag por turno.

**Impacto.** Hoje 16 turnos/30d custam como 16 prompts completos.
Assumindo sessões típicas de 3-5 turnos, **redução em 70-85% dos tokens
de input cobrados em turnos ≥ 2**. A busca RAG (que chama outra EF)
também cai proporcionalmente.

**Qualidade.** Inalterada — o modelo vê o mesmo conteúdo, na mesma ordem.

---

## Alavanca 3 — Fatiar o system prompt do `classify-diary-entry`

**Diagnóstico.** O `buildSystemPrompt` do classifier tem ~7 800 tokens
e é montado monoliticamente (regras gerais + schema JSON + regras
específicas por `input_type` + regras de expense inference +
rules de scheduled_event + exemplos). O prompt *inteiro* vai a toda
chamada — mesmo quando o tutor só gravou um áudio curto.

O cache já protege o prefixo (prompt caching ativo em `callClaude.ts`),
mas:
- A **primeira chamada** do dia paga os 7 800 tokens + 25% de write.
- Se dois `input_type` diferentes alternam (texto e depois ocr_scan),
  o prefixo muda e o cache não bate no segundo.

**Ação sugerida.** Reestruturar `prompts/system.ts` em 2 camadas:

1. **Prefácio universal cacheável** (~3 500 tokens): identidade do
   agente, formato JSON de saída, regras de 3ª pessoa, regras de tom,
   regras de tags, schema mandatório — tudo que **não varia** entre
   `input_type`s.
2. **Apêndice especializado por input_type** (~1 500 tokens): só o que
   é específico do modo (OCR: regras de extração; pet_audio: regras
   para classificar o som; PDF: regras de import_count; etc.).

O `callClaude` manda os dois blocos, com `cache_control` no primeiro.
Resultado:
- Tamanho total por chamada: mais ou menos o mesmo (7 800 → 5 000 tok),
  mas o prefixo de 3 500 tok **bate em 100% das chamadas de qualquer
  tipo** — hoje só bate quando o `input_type` repete.
- Duas chamadas de tipos diferentes economizam tokens do prefácio
  compartilhado em vez de pagá-lo duas vezes.

**Impacto.** 30-50% menos tokens cobrados no classifier em média,
dependendo da mistura de `input_type` do tutor. No mix atual
(text:43 | photo:39 | ocr:16 | audio:7 | video:5) a redução estimada
fica perto de 35%.

**Qualidade.** Exatamente igual, desde que o apêndice especializado
contenha 1-para-1 as mesmas regras que hoje estão no prompt monolítico
para aquele `input_type`. É uma reorganização, não uma remoção.

---

## Alavanca 4 — Deduplicar `analyze-pet-photo` do fluxo de diário com foto

**Diagnóstico.** Quando o tutor posta um diary entry com foto:
- `classify-diary-entry` já analisa a foto (Vision) para inferir mood,
  narração e observações de saúde.
- Em seguida, `mediaRoutines.ts` chama `analyze-pet-photo` **sobre a
  mesma foto** para rodar o framework clínico detalhado (raça, score,
  env, disclaimer).

Duas chamadas Vision na mesma imagem. ~3 000 tok Vision × 2 =
~6 000 tok de image-encoding pagos por entry com foto.

**Ação sugerida (opção conservadora, sem perda).** Antes de chamar
`analyze-pet-photo`, verificar se o classifier já produziu
`visual_analysis` com confidence ≥ 0.7. Se sim, usar o resultado
existente; se não, chamar o analyze-pet-photo como fallback.

**Ação alternativa (mais econômica).** Fazer o classifier emitir
**também** os campos do analyze-pet-photo quando `input_type === 'photo'`
— consolidar em uma única chamada Vision. Isso requer ampliar o schema
JSON do classifier e o UI passar a ler os mesmos campos.

**Impacto.** 39 entries com foto/30d. Se 70% tiverem qualidade
suficiente via classifier, elimina ~27 chamadas de Vision/mês
(–50% das chamadas de photo_analyses pela rota de diário).

**Qualidade.** Cuidar para que o framework clínico não degrade. A
opção conservadora (fallback) é zero-risco.

---

## Alavanca 5 — Bater no `photos.slice(0, 2)` em outros pontos

**Diagnóstico.** O classifier já corta em 2 imagens (bom). Mas:
- O frontend permite até 5 fotos no diário.
- O `analyze-pet-photo` aceita o que for enviado.

Hoje 97% das entries com foto têm ≤2 fotos (dados reais). Mas o código
permite 5, o que expõe custo desnecessário em outliers.

**Ação sugerida.** Hard-cap em 2 no upload da UI do diário (o 3ª+ é
descartado ou pedido ao tutor para escolher). Zero impacto no mix
atual e elimina picos futuros.

**Qualidade.** Imperceptível. A 3ª/4ª/5ª foto raramente é informativa
para a IA — são duplicatas do mesmo momento.

---

## Alavanca 6 — Mover cargas assíncronas para Batch API (50% desconto)

**Diagnóstico.** Três cargas são naturalmente assíncronas e poderiam
rodar em batch (não afetam o tutor em tempo real):

- `generate-ai-insight` — insight diário/semanal (CRON).
- `generate-prontuario` — regenerar em lote quando o TTL de 24h estiver
  prestes a expirar para todos os pets ativos.
- `generate-personality` — regenerar periodicamente por pet ativo.

A Messages Batches API cobra **50%** do preço normal e devolve resultados
em <24h (P95 bem menor).

**Impacto.** –50% em ~37 chamadas/mês (18 insights + ~1 prontuário +
~18 personality, projetando). Em escala, torna-se relevante.

**Qualidade.** Idêntica — mesmo modelo, mesmo prompt, mesma resposta.
Só o canal de entrega é assíncrono.

---

## Alavanca 7 — `max_tokens` calibrado

**Diagnóstico.** Alguns valores estão provisionados acima do que a regra
do próprio prompt autoriza.

| Função | max_tokens atual | Teto real observado | Recomendação |
|---|---:|---:|---:|
| pet-assistant | 1024 | 2-4 frases → ~120 | 384 |
| generate-personality | 512 | ~150 | 320 |
| generate-ai-insight | 256 | ~80 | manter |
| classify-diary-entry (default) | MAX_TOKENS | — | validar |

**Impacto.** Claude cobra só o que é *gerado*, não o teto; logo a
economia é marginal. Mas reduz downside em caso de loop de saída
indevido e corta leve de ceiling calculado por algumas integrações.

**Qualidade.** Zero. Os novos tetos são ~3× acima da maior saída vista.

---

## Alavanca 8 — Guarda anti-trivial no pet-assistant

**Diagnóstico.** Mensagens como "oi", "ok", "obrigado", "tchau" não
precisam de IA nem de RAG. Hoje, cada uma custa uma chamada Claude
completa (~2 000 tok input + output).

**Ação sugerida.** Antes de invocar Claude, filtrar mensagens com
≤10 caracteres contra uma lista curta (~20 strings por idioma) e
responder localmente com frases pré-definidas ("Oi, tutor! Em que
posso ajudar com *{petName}* hoje?").

**Impacto.** Varia; historicamente 5-15% dos turnos em chats com pets
são saudações ou afirmações curtas. Com 16 turnos/30d hoje, é 1-2
chamadas/mês evitadas. Em escala (1 k MAU × 5 turnos/mês), ~750-2 250
chamadas/mês.

**Qualidade.** Melhor, não pior: resposta é **instantânea** em vez de
esperar 2 s.

---

## Alavanca 9 — Reuso do RAG dentro da mesma conversa

**Diagnóstico.** `pet-assistant` chama `search-rag` a cada turno.
O RAG retorna contexto semântico baseado na pergunta, mas o **contexto
persistente do pet** muda pouco dentro de uma sessão (minutos).

**Ação sugerida.** Cachear os top-8 resultados de RAG por `(pet_id,
conversation_id)` por 5 min. Nas perguntas seguintes, só re-executar
RAG se a mensagem trouxer um termo novo que não estava no contexto já
carregado (checagem simples por tokens-chave).

**Impacto.** –40% nas chamadas de `search-rag` em sessões de 3+ turnos
(menos DB e menos tokens de contexto RAG injetados no prompt). Ajuda
indiretamente a Alavanca 2.

**Qualidade.** Zero impacto para perguntas relacionadas. Caso de borda:
se a pergunta mudar radicalmente de tópico, o RAG é refrescado pela
heurística de termos novos.

---

## Alavanca 10 — TTL do `prontuario_cache` para 72h + invalidação por evento

**Diagnóstico.** Hoje TTL = 24h, mas o prontuário raramente muda em 24h
— só muda quando há um novo evento clínico (vacina, consulta, exame,
medicação, alergia).

**Ação sugerida.** Subir TTL para 72h **e** invalidar explicitamente
o cache via trigger ao inserir nas tabelas clínicas. Combina o melhor
dos dois mundos: menos regenerações periódicas + atualização imediata
quando importa.

**Impacto.** –60% nas gerações de prontuário no steady state. Em escala
(milhares de prontuários/mês em MAU alto), relevante.

**Qualidade.** Melhor — prontuário nunca fica desatualizado porque é
invalidação-por-evento.

---

## Alavanca 11 — Não regenerar `generate-personality` se o diário não cresceu

**Diagnóstico.** O endpoint pode ser chamado repetidamente mesmo quando
as últimas N entradas são as mesmas. Isso custa ~500 tok × 20 entries =
chamada cara redundante.

**Ação sugerida.** Persistir em `pets.ai_personality_generated_at` e em
`pets.ai_personality_n_entries`. Só regerar se `new_entries >= 5` ou
passou `>= 30 dias`.

**Impacto.** Depende do padrão de uso; em piloto atual (20 entries/pet
a cada 30d no p90) regenera ~1×/mês por pet ativo = ok. Evita explosão
em escala.

---

## Alavanca 12 — Respostas locais para estados sem dados

**Diagnóstico.** `generate-ai-insight` já tem fallback se não há
entradas/moods suficientes. Bom. O mesmo padrão pode ser estendido em
outros endpoints (personality, prontuario) — retornar uma resposta
pré-definida quando não há dados, sem chamar Claude.

**Ação sugerida.** Auditar cada EF para ter early-return com resposta
não-IA quando `entries.length < MIN_ENTRIES`. Alguns já têm; generalizar.

**Impacto.** Protege o custo contra "chamadas vazias".

---

# Ordem de execução sugerida (do maior ROI para o menor)

1. **Alavanca 1** — ativar `cache_control` nas 8 EFs + reorganizar
   system ↔ user message.  (semana 1)
2. **Alavanca 2** — reuso de contexto no `pet-assistant`.  (semana 1)
3. **Alavanca 3** — fatiar system do `classify-diary-entry`.  (semana 2)
4. **Alavanca 10** — TTL 72h + invalidação do prontuario.  (semana 2)
5. **Alavanca 4** — dedup analyze-pet-photo ↔ classifier.  (semana 3,
   requer decisão de produto sobre a opção conservadora vs consolidada)
6. **Alavanca 6** — Batch API para cargas assíncronas.  (semana 3)
7. **Alavancas 5, 7, 8, 9, 11, 12** — otimizações incrementais.  (semana 4)

# Métricas para acompanhar a regressão

Instrumentar, por Edge Function:

- `input_tokens` (total)
- `cache_read_input_tokens` e `cache_creation_input_tokens` (Claude
  devolve nos headers)
- `output_tokens`
- custo estimado = input × preço_input + cache_read × 0.1 × preço_input
  + cache_write × 1.25 × preço_input + output × preço_output

Salvar em `ai_usage_log` (tabela nova: `{ ef_name, pet_id, user_id,
model, input_tokens, cache_read, cache_write, output_tokens, created_at }`).
Um dashboard semanal responde "o plano funcionou?".

# O que NÃO está no escopo

- Trocar Sonnet por Haiku em qualquer rota (modelos atuais são preservados).
- Remover funcionalidades ou simplificar respostas do app.
- Reduzir profundidade de análise clínica ou de narração.
- Cortar idiomas, persistência, RAG, narração na voz do pet.

O objetivo é extrair a mesma qualidade com menos tokens pagos.
