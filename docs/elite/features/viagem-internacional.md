# Viagem Internacional — spec

> **Pilar 6.4** do plano de posicionamento Elite
> **Status:** spec pronta, não implementada
> **Prioridade:** média-alta — diferencial brutal pro tutor elite cosmopolita

---

## 1. Conceito

Feature "**Prepare a viagem com [nome]**". Tutor seleciona país de destino, e o app devolve:

1. Lista de **vacinas obrigatórias** com status (em dia / vencida / não aplicada)
2. **Check de microchip** (compatibilidade ISO 11784/11785)
3. Lista de **documentos necessários** (atestado internacional, CVI, testes sorológicos)
4. **Companhias aéreas pet-friendly** com regras específicas (peso máximo, cabine/porão, custo estimado)
5. **Ficha clínica traduzida** (em inglês, espanhol etc. — usa IA)
6. **Clínicas veterinárias de referência** no destino (puxa do `circulo_vets_directory` se disponível)

Saída: tela interativa + PDF exportável (em PT + idioma do destino, lado a lado).

---

## 2. Por que é diferencial

Elite viaja com pet. Descobrir requisitos de cada país hoje leva 3-5 horas de pesquisa em sites oficiais (MAPA, USDA, DEFRA, cada autoridade é um portal). O app entrega isso em 1 toque. **Retenção alta**: depois da primeira viagem facilitada, churn vira muito baixo.

---

## 3. Modelo de dados

### Tabela de regras por país (curada, atualizada por editor)

```sql
CREATE TABLE country_travel_rules (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code          text NOT NULL,        -- ISO 3166-1 alpha-2
  country_name          jsonb NOT NULL,       -- { "pt-BR": "Estados Unidos", "en": "United States", "es": "Estados Unidos" }
  
  -- Regras de entrada por espécie
  rules_dog             jsonb,
  rules_cat             jsonb,
  
  -- Estrutura de rules_*:
  -- {
  --   "vaccines_required": [
  --     { "name": "Rabies", "min_days_before_travel": 21, "max_validity_days": 365, "notes": "..." },
  --     ...
  --   ],
  --   "microchip_required": true,
  --   "microchip_standard": "ISO 11784/11785",
  --   "health_certificate": { "name": "CVI", "issued_by": "MAPA", "validity_days": 10, "download_url": "..." },
  --   "additional_tests": [{"name": "Rabies titer", "when_applicable": "EU entry from non-listed country"}],
  --   "quarantine": { "required": false, "duration_days": null },
  --   "banned_breeds": ["Pitbull", "Tosa Inu"],
  --   "notes_md": "markdown com observações extras"
  -- }
  
  airlines_pet_policy   jsonb,       -- [{ "airline": "LATAM", "cabin_allowed": true, "max_weight_kg": 7, "cost_usd": 200, "url": "..." }]
  recommended_vets      jsonb,       -- [{ "partner_id": "uuid if in circulo_partners", "city": "Lisboa", ... }]
  
  last_updated_at       timestamptz NOT NULL,
  updated_by            text,        -- nome do curador
  source_urls           jsonb,       -- referências oficiais consultadas
  is_active             boolean DEFAULT true,
  created_at            timestamptz DEFAULT NOW()
);

CREATE UNIQUE INDEX country_travel_rules_code_idx ON country_travel_rules(country_code) WHERE is_active;
```

### Tabela de planos de viagem do tutor

```sql
CREATE TABLE pet_travel_plans (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id            uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES public.users(id),
  destination_code  text NOT NULL REFERENCES country_travel_rules(country_code),
  travel_date       date,
  return_date       date,
  
  -- Snapshot do status no momento da geração
  readiness_status  jsonb,    -- { "vaccines_ok": true, "vaccines_pending": [...], "microchip_ok": true, "docs_pending": [...] }
  
  pdf_url           text,
  is_active         boolean DEFAULT true,
  created_at        timestamptz DEFAULT NOW(),
  updated_at        timestamptz DEFAULT NOW()
);
```

---

## 4. Edge Functions

### `compute-travel-readiness`

**Input:** `{ pet_id, destination_code, travel_date? }`

**Processo:**
1. Fetch `country_travel_rules` do destino
2. Fetch vacinas/alergias/microchip do pet
3. Cross-reference: pra cada vacina obrigatória, checar se existe na tabela de vacinas do pet com data válida (considerando `min_days_before_travel`)
4. Retornar report estruturado

**Output:**
```json
{
  "pet_id": "...",
  "destination": "US",
  "readiness_percent": 75,
  "checks": [
    { "type": "rabies_vaccine", "status": "ok", "detail": "Aplicada em 2026-01-15, válida até 2027-01-15" },
    { "type": "microchip", "status": "ok", "detail": "ISO 11784/11785 compatible" },
    { "type": "cvi_certificate", "status": "pending", "detail": "Emitir no MAPA até 10 dias antes da viagem" },
    { "type": "airline_fit", "status": "warning", "detail": "Pet acima de 7kg — terá que ir no porão em LATAM" }
  ],
  "actions_suggested": [
    "Emitir CVI no MAPA 10 dias antes da viagem",
    "Considerar companhias que aceitam pet no porão com conforto (Air France, KLM)"
  ]
}
```

### `generate-travel-plan-pdf`

**Input:** `{ pet_id, destination_code, travel_date }`

**Output:** PDF bilíngue (PT + idioma do destino) com:
- Capa: nome do pet + destino + data prevista
- Página 1: ficha do pet traduzida (nome, raça, idade, microchip, peso)
- Página 2-3: requisitos do país
- Página 4: vacinas com status
- Página 5: companhias aéreas
- Página 6: clínicas recomendadas no destino
- Página 7: emergência — 3 clínicas 24h no destino + telefone da embaixada brasileira

Traduções via Claude (mesmo Claude usado em `translate-strings`).

### `translate-pet-chart`

Subset do `translate-strings` — pega ficha clínica do pet (vacinas, alergias, medicações, condições) e traduz literal + técnico (sem registro literário — aqui é tecnicismo veterinário) para o idioma do destino.

---

## 5. Telas

**`/pet/[id]/travel`** — hub:
- Seletor de país (autocomplete por nome)
- Planos anteriores (se houver)
- CTA "Preparar nova viagem"

**`/pet/[id]/travel/new`** — wizard:
- Step 1: seleciona país
- Step 2: data prevista de viagem (e volta, se aplicável)
- Step 3: app calcula `readiness` e mostra report visual com semáforos (verde/amarelo/vermelho)
- Step 4: gera PDF + salva plano

**`/pet/[id]/travel/[plan_id]`** — detalhes do plano:
- Status de cada check
- Timeline de ações pendentes
- Export PDF (via `PdfActionModal`)

---

## 6. Curadoria de `country_travel_rules`

**Não é automatizado.** Começar com **10-12 países prioritários** (EUA, Portugal, Espanha, França, Itália, Reino Unido, Alemanha, Argentina, México, Uruguai, Chile, Canadá). Cada país leva ~2-3 horas de curadoria inicial + 30 min de atualização trimestral.

Curador: editor contratado (mesmo do Círculo, se houver). Alternativa: consultoria especializada em agenciamento de viagens com pets (empresas como Pet Travel Brasil) — parceria com 5-10% de comissão em cada viagem facilitada.

---

## 7. i18n

```json
"travel.title": "Viagens com {{name}}",
"travel.new.title": "Preparar nova viagem",
"travel.new.destinationLabel": "Destino",
"travel.new.dateLabel": "Data prevista",
"travel.readiness.title": "Preparação: {{percent}}%",
"travel.check.ok": "Em dia",
"travel.check.pending": "Pendente",
"travel.check.warning": "Atenção",
"travel.check.notApplicable": "Não aplicável",
"travel.action.vaccineExpired": "Vacina {{name}} está vencida. Agendar reforço.",
"travel.action.microchipMissing": "Microchip não registrado. Consultar veterinário.",
"travel.action.cviPending": "CVI (Certificado Veterinário Internacional) deve ser emitido até {{days}} dias antes da viagem.",
"travel.pdf.cta": "Exportar plano de viagem",
"travel.emergency.title": "Emergências no destino",
"travel.airline.cabin": "Permitido na cabine",
"travel.airline.hold": "Porão com ambiente climatizado",
"travel.airline.notAllowed": "Não aceita pets"
```

Registro Elite: tom seco, factual, útil. Nada literário aqui — é documento operacional.

---

## 8. Estimativa

- Curadoria inicial de 12 países: **~30 horas** de editor (trabalho contínuo, não dev)
- Migration + RLS: 1 dia
- EF `compute-travel-readiness`: 2 dias
- EF `generate-travel-plan-pdf` + template: 3 dias (template bilíngue é complexo)
- EF `translate-pet-chart`: 1 dia
- Telas: 3 dias
- QA: 1 dia

**Total dev: ~11 dias.** Curadoria de conteúdo roda em paralelo.

---

## 9. Decisões em aberto

1. **Quantos países no MVP?** Sugestão: 12 prioritários (lista acima), expandir trimestralmente.
2. **Modelo de atualização das regras.** Editor fixo? Parceria com consultoria? Community-sourced?
3. **Monetização adicional?** Agência de viagens pet (curadoria + booking concierge) como add-on de R$ 300/viagem. Fora do escopo Elite inicial.
4. **Integração com carteira de vacinas física?** OCR já existe — tutor fotografa carteirinha e app importa. Reuso imediato aqui.
