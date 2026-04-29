# Traduções pendentes — módulo de viagem (PR1)

**Status (2026-04-28):** pt-BR completo. en-US tem chaves visíveis ao usuário ainda em PT com prefixo `[TODO-EN]`. es-MX, es-AR, pt-PT são traduzidos dinamicamente em runtime via `lib/translationCache.ts` (não há JSON estático para esses locales).

---

## Como funciona o i18n no auExpert

- **`i18n/pt-BR.json`** — fonte de verdade. Todas as chaves do app vivem aqui.
- **`i18n/en-US.json`** — fallback estático para qualquer locale não-pt-BR. Bundle no app.
- **es-MX, es-AR, pt-PT** — traduzidos via IA em background no primeiro start em cada idioma. Cache persistido em AsyncStorage. Implementação em `i18n/index.ts` + `lib/translationCache.ts`.

---

## Pendente — `i18n/en-US.json`

Todas as chaves abaixo estão com valor `[TODO-EN] {valor pt-BR}`. Substituir pela tradução natural em inglês americano.

### travel.* (~120 chaves)

#### Estrutura geral
- `travel.title` — "Trips" ✓ (já em EN)
- `travel.new.*` — fluxo de criação ✓
- `travel.transport.*` — modos ✓
- `travel.purpose.*` — motivos ✓
- `travel.status.*` — status ✓
- `travel.checklist.*` — checklist UI ✓ (parcial)
- `travel.country.*` — 26 nomes de países ✓

#### Pendentes em PT
- `travel.document.extraction_failed`
- `travel.disclaimer.ai_generated`
- `travel.disclaimer.generic_fallback`
- `travel.disclaimer.static_review`
- `travel.disclaimer.consult_vet`
- `travel.ai_generation.in_progress`
- `travel.ai_generation.completed`
- `travel.ai_generation.failed`
- `travel.ai_generation.confidence.{high,medium,low}`
- `travel.generic.notes`
- `travel.general_notes.{US,JP,AU,NZ}`
- `travel.req.*.title` (49 chaves de título de requirement)
- `travel.req.*.description` (49 chaves de descrição de requirement)

**Total:** ~110 chaves marcadas com `[TODO-EN]` em `i18n/en-US.json`.

---

## Pendente — es-MX, es-AR, pt-PT (tradução dinâmica)

Estes locales são traduzidos automaticamente via `lib/translationCache.ts` quando o usuário muda o idioma no dispositivo. **Atenção pra reviewers nativos:**

### es-AR
- Usar voseo (`vos` em vez de `tú`) em frases conversacionais
- "Vacuna antirrábica" é equivalente neutro pra ES — ok
- "Cachorro" em es-AR = "perro" (cachorro é "cachorrito")

### es-MX
- "Maleta de transporte" pra crate IATA
- "Vacuna antirrábica" — ok
- "Aerolínea" pra "companhia aérea"

### pt-PT
- "Comboio" em vez de "trem" (já estaria certo se a tradução IA conhecer pt-PT)
- "Casa de banho" não se aplica aqui; cuidado com "ficheiro" vs "arquivo" se aparecer
- "Vacina antirrábica" — equivalente

---

## Como tirar o app dos placeholders `[TODO-EN]`

### Opção 1 — Tradução manual por humano nativo
Editar `i18n/en-US.json` e substituir cada string `[TODO-EN] ...` por tradução natural.

### Opção 2 — Tradução em massa via IA
Rodar script (a criar) que:
1. Lê todas as chaves marcadas `[TODO-EN]` em `en-US.json`
2. Manda ao Claude Sonnet 4.6 com prompt "traduza pt-BR → en-US natural"
3. Substitui no JSON

### Opção 3 — Aproveitar a infra de tradução dinâmica
A infra `translationCache` já consegue traduzir um JSON inteiro. Bastaria:
1. Adicionar locale `en-US` à lista de tradução dinâmica
2. Remover bundle estático
3. App pediria tradução em background no primeiro start

**Decisão pendente:** qual abordagem usar para PR de tradução posterior. Sugestão pessoal: Opção 1 (humano nativo) pra qualidade premium, dado que os requirements de viagem são críticos e mistraduções podem causar problemas reais.

---

## Estimativa de esforço

- en-US (110 chaves): ~3h tradutor profissional, ~30min Claude Sonnet
- es-MX (review nativo se IA traduzir): ~1h
- es-AR (review nativo se IA traduzir, voseo): ~1h
- pt-PT (review nativo se IA traduzir): ~1h

**Total aproximado:** 6h se 100% humano, 2h se IA + review.

---

# IA Proativa do Pet (Camadas 1-4) — adicionado em 2026-04-28

## Status atual por idioma

| Locale | Status do namespace `insights.*` |
|---|---|
| pt-BR | ✅ Completo |
| en-US | ✅ Completo |
| es-MX | ❌ **Pendente revisão humana** — usa fallback `defaultValue` em runtime |
| es-AR | ❌ **Pendente revisão humana** — usa fallback `defaultValue` em runtime |
| pt-PT | ❌ **Pendente revisão humana** — usa fallback `defaultValue` em runtime |

## ~60 chaves novas adicionadas

```
insights.feed.{title,empty,empty_desc,error_loading,confirm_dismiss,dismissed,regenerated}
insights.feed.filter.{all,health,reminders,patterns,milestones}
insights.card.{dismiss,see_evidence}
insights.cta.{default,open_consultation,open_vet_finder,log_diary,schedule_reminder,view_chart,
              open_pharmacy_finder,open_health_screen,open_pet_screen,open_trip_screen,monitor}
insights.detail.{title,evidence,history,chart,not_found}
insights.severity.{info,consider,attention,urgent}
insights.subcategory.{32 chaves cobrindo subcategorias das 4 camadas}
insights.settings.{title,intro,expand,collapse,max_per_day,regenerate_now,dismissed_history,footer}
insights.settings.quiet_hours.{start,end}
insights.settings.layer{1,2,3,4}.{title,description}
insights.disclaimer.not_diagnosis  ⚠️ MÉDICO-LEGAL — REVISÃO OBRIGATÓRIA
```

## ⚠️ Disclaimer médico-legal (CRÍTICO antes de go-live)

A chave `insights.disclaimer.not_diagnosis` aparece em **toda análise de saúde** (categoria `saude` ou `vacina`). Texto canonizado em pt-BR:

> "Esta análise não substitui avaliação veterinária. Em caso de dúvida ou sintoma persistente, consulte um veterinário."

**Antes de ativar a IA Proativa nos locales es-MX/es-AR/pt-PT:**
- ✅ **Revisor jurídico** familiarizado com regulamentação médico-veterinária do país (CFMV-equivalente, COFEPRIS-MX, SENASA-AR).
- ✅ **Tradutor humano profissional** (não automatizado) para preservar tom medido + valor jurídico.

## Disclaimers de outras subcategorias

Análises Camada 4 (sazonalidade, correlação alimentar, eficácia de tratamento) também trazem implicação clínica e merecem disclaimer revisado pelo veterinário-consultor antes de go-live.

## Como ativar nos outros locales

Mesmo procedimento das outras chaves:
1. Copiar bloco `insights.*` de `i18n/en-US.json`
2. Inserir em `i18n/<locale>.json`
3. Traduzir respeitando registro Elite + revisar disclaimer com profissional
4. Build + smoke test em dispositivo no idioma

