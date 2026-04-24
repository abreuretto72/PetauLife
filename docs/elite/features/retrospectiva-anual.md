# Retrospectiva Anual — spec

> **Pilar 6.1** do plano de posicionamento Elite (`docs/elite/posicionamento/2026-04-22_plano_elite_auexpert.md`)
> **Status:** spec pronta, não implementada
> **Prioridade:** alta — é uma das features que justifica R$ 129/mês

---

## 1. Conceito

No dia **31 de dezembro** (e alternativamente no **aniversário do pet**, se registrado), o app gera automaticamente uma **retrospectiva editorial** do ano, com foto-capa, 12 páginas (uma por mês), narrativa literária por mês, estatísticas discretas e exportação PDF luxuosa + opção de imprimir como livro via parceiro (Photobook, Umbrella Books, Mimo).

Substitui com elegância a gamificação removida (XP, badges): a retrospectiva é **o** reconhecimento do ano.

---

## 2. Conteúdo da retrospectiva

Para cada um dos 12 meses:
- **Foto escolhida** — a mais admirada do mês (ou marcada manualmente pelo tutor durante o ano via toggle "marcar momento")
- **Narrativa literária** gerada pela IA (registro Elite, 3ª pessoa, Clarice) — ~80-120 palavras por mês, observando os momentos daquele mês a partir das entradas do diário
- **Estatísticas discretas** integradas na narrativa — "Nesse mês, o Rex passou 3 manhãs na cozinha, olhando o tutor preparar o café. Cruzou o caminho de 12 cachorros na rua."

Primeira página: capa com foto do pet + título "O ano de [Nome] em [Ano]" em Playfair.

Última página: página de encerramento com estatística anual agregada (dias com registro, entradas mais memoráveis, humores predominantes) e frase de fechamento literária.

---

## 3. Modelo de dados

```sql
-- Tabela nova
CREATE TABLE pet_retrospectives (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id            uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  year              int NOT NULL,            -- 2026, 2027, etc.
  status            text NOT NULL CHECK (status IN ('queued', 'generating', 'ready', 'error')),
  cover_photo_id    uuid REFERENCES pet_photos(id),
  content_md        text,                     -- markdown completo da retrospectiva
  months_data       jsonb,                    -- { "01": { "photo_id": ..., "narration": ..., "stats": ... }, ..., "12": {...} }
  stats_annual      jsonb,                    -- { "entries_count": 284, "days_with_entries": 221, "top_moods": [...], ... }
  generated_at      timestamptz,
  error             text,
  pdf_url           text,                     -- URL no Supabase Storage quando ready
  print_order_id    text,                     -- se tutor pediu impressão
  is_active         boolean DEFAULT true,
  created_at        timestamptz DEFAULT NOW()
);

-- Índice pra consultas rápidas por pet+ano
CREATE UNIQUE INDEX pet_retrospectives_pet_year_unique ON pet_retrospectives(pet_id, year) WHERE is_active;

-- Coluna em pet_photos para marcar momentos especiais
ALTER TABLE pet_photos ADD COLUMN is_annual_moment boolean DEFAULT false;
```

RLS: tutor só acessa retrospectivas dos próprios pets. SECURITY DEFINER em geração pra CRON funcionar.

---

## 4. Edge Functions

### `generate-yearly-retrospective`

**Quando roda:** chamada pelo CRON `pet-year-end-cron` (01/01 de cada ano, 04:00) OU sob demanda pelo app (`/pet/[id]/retrospective?year=2026`).

**Input:** `{ pet_id, year }`

**Processo:**
1. Fetch entries, moods, photos do pet naquele ano
2. Agrupar por mês
3. Pra cada mês: escolher foto hero (maior `admire_count` ou marcada `is_annual_moment=true`), gerar narração IA (Opus 4.6 + extended thinking + prompt registro Elite)
4. Gerar stats anuais
5. Chamar `compose-retrospective-pdf` pra gerar PDF
6. Upload no Storage, atualizar `pet_retrospectives` com URL

**Output:** `{ retrospective_id, pdf_url, months_data, stats_annual }`

**Custo estimado:** ~12 chamadas Opus 4.6 com extended thinking × R$ ~0.50 = **~R$ 6 por retrospectiva**. Aceitável dado tier R$ 129/mês.

### `compose-retrospective-pdf`

Template HTML → PDF via `expo-print` (server-side via Puppeteer ou Chromium headless). Template:
- Capa: foto grande + título Playfair + subtítulo Inter
- Índice: mini-thumbnails dos 12 meses
- 12 páginas/mês: foto 2/3 da página + narração 1/3 com capitular
- Página final: estatísticas em grid minimalista + frase de encerramento

Identidade visual: Elite completo (Ametista & Jade, Inter + Playfair, sem onomatopeia).

### `ship-retrospective-to-printer`

Integração opcional com parceiro de photobook. Input: `retrospective_id, printer_partner, shipping_address`. Output: `order_id, tracking_url`. Modelo: affiliate link, comissão do parceiro, auExpert não toca em cartão.

---

## 5. Telas

**`/pet/[id]/retrospective/[year]`** — visualiza a retrospectiva do ano:
- Hero com capa
- Carrossel de 12 meses
- Botão "Exportar PDF" (via `PdfActionModal`)
- Botão "Imprimir como livro" (abre link do parceiro)

**`/pet/[id]/retrospective`** — índice de retrospectivas (2024, 2025, 2026...):
- Lista cronológica
- Cada item mostra foto-capa + ano + "ver retrospectiva"

---

## 6. CRONs

```sql
-- pg_cron
SELECT cron.schedule(
  'pet-year-end-retrospective',
  '0 4 1 1 *',  -- 01/01 às 04:00
  $$SELECT net.http_post(
    url := 'https://peqpkzituzpwukzusgcq.supabase.co/functions/v1/generate-yearly-retrospective-batch',
    body := '{"trigger":"year_end"}'::jsonb
  );$$
);

-- Alternativa: disparar também no aniversário de adoção ou nascimento do pet
SELECT cron.schedule(
  'pet-birthday-retrospective',
  '0 4 * * *',  -- diariamente às 04:00
  $$SELECT net.http_post(
    url := 'https://peqpkzituzpwukzusgcq.supabase.co/functions/v1/check-pet-birthdays-retrospective',
    body := '{}'::jsonb
  );$$
);
```

---

## 7. i18n (chaves novas — registro Elite)

```json
"retrospective.title": "O ano de {{name}} em {{year}}",
"retrospective.subtitle": "Um ano em registros",
"retrospective.cta.export": "Exportar PDF",
"retrospective.cta.print": "Imprimir como livro",
"retrospective.month.january": "Janeiro",
"retrospective.stats.entries": "{{count}} entradas",
"retrospective.stats.daysRegistered": "{{count}} dias com registro",
"retrospective.stats.moodDominant": "Humor predominante: {{mood}}",
"retrospective.empty": "Ainda não há registros suficientes para a retrospectiva.",
"retrospective.generating": "Compondo a retrospectiva de {{name}}...",
```

---

## 8. Estimativa

- EF `generate-yearly-retrospective`: 2 dias
- EF `compose-retrospective-pdf`: 1.5 dias (template HTML)
- Telas: 1 dia
- CRON + migration: 0.5 dia
- Integração parceiro de impressão: 1 dia (depende do parceiro escolhido)
- Testes com dataset real (usar Mana ou Pico): 0.5 dia

**Total: ~6-7 dias** de dev focado.

---

## 9. Decisões em aberto

1. **Parceiro de impressão.** Photobook Brasil / Umbrella Books / Mimo — afeta custo e acabamento.
2. **Aniversário ou 31/12?** Default: 31/12 (ano civil). Alternativa: aniversário do pet. Plano original sugere **ambos**.
3. **Quando começar?** Quantas entradas mínimas? Sugestão: 50 entradas no ano pra garantir narrativa mínima.
4. **Preço do print físico.** Se affiliate, tutor paga direto ao parceiro. Se auExpert embute, precisa cartão próprio.
