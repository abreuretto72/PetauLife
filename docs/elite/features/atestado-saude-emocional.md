# Atestado de Saúde Emocional — spec

> **Pilar 6.5** do plano de posicionamento Elite
> **Status:** spec pronta, não implementada
> **Prioridade:** média — feature simples, de utilidade prática alta

---

## 1. Conceito

**PDF sóbrio e oficial-looking** pra apresentar em hotéis pet-friendly, pet-shops de destino, creches, cursos de adestramento. Conteúdo:

> *"Rex é um cão equilibrado, socialmente adaptado, sem histórico de agressividade. Vacinas em dia. Tutor responsável desde 2022."*

Gerado com um clique. **Sem promessa clínica, sem diagnóstico** — é basicamente um resumo afetivo com data e identidade visual do auExpert, que ganha peso simbólico de documento.

Utilidade: o hotel pet-friendly ou o pet-shop costuma pedir "alguma comprovação de que o pet é dócil". Um PDF bem diagramado com headers e assinatura visual serve como ponto de partida.

---

## 2. O que o atestado AFIRMA (baseado em dados reais)

**Somente afirma o que o app sabe.** Nenhuma fabricação:

- **Identificação**: nome, raça, idade, microchip, foto
- **Saúde**: vacinas em dia, alergias conhecidas, condições crônicas ativas
- **Comportamento**: humor predominante no diário dos últimos 90 dias, entradas mais recentes relacionadas a socialização
- **Histórico de tutoria**: "Tutor [Nome] desde DD/MM/AAAA" (baseado em `pets.created_at`)
- **Disclaimer obrigatório**: "Este documento é uma síntese gerada automaticamente a partir do diário e prontuário do tutor. Não substitui avaliação veterinária ou comportamental profissional."

**O que NÃO afirma:**
- Não diz "manso", "dócil", "inofensivo" — porque o app não pode atestar isso
- Não diz "adestrado" sem registro específico
- Não carimba nenhum veredito clínico

---

## 3. Modelo de dados

Simples — nenhuma tabela nova. O atestado é gerado **on-demand** a partir de dados existentes:

- `pets` (identificação)
- `vaccines` (status)
- `allergies` (lista)
- `chronic_conditions` (lista, se existir)
- `diary_entries` filtrado últimos 90 dias (humor predominante, tags sociais)

Opcional, pra cache:

```sql
CREATE TABLE pet_attestations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id         uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES public.users(id),
  generated_at   timestamptz NOT NULL DEFAULT NOW(),
  snapshot_data  jsonb,         -- snapshot completo pra reimpressão fidedigna
  pdf_url        text,
  is_active      boolean DEFAULT true
);
```

Mantem snapshot pra caso tutor imprimiu há 3 meses e quer a mesma versão. Mas o fluxo default é "gerar novo toda vez que pedir".

---

## 4. Edge Function

### `generate-pet-attestation-pdf`

**Input:** `{ pet_id }`

**Processo:**
1. Fetch pet + vacinas + alergias + condições
2. Fetch últimas 90 dias de diário, computar mood predominante
3. Compose HTML template bilíngue (PT-BR + EN-US lado a lado no rodapé, pra utilidade internacional)
4. Converte HTML → PDF via puppeteer/chromium headless ou `expo-print`
5. Upload no Storage, retorna `pdf_url`

**Output:** `{ pdf_url, generated_at }`

Custo: zero (não usa IA, só lê banco + renderiza template).

---

## 5. Template do PDF (1 página A4)

```
┌─────────────────────────────────────────────────┐
│ [Logo auExpert]          Emitido em DD/MM/AAAA  │
│                                                   │
│            Identificação do Pet                  │
│                                                   │
│            [Foto do pet — 4x4cm]                 │
│                                                   │
│  Nome: Rex                                       │
│  Raça: Golden Retriever                          │
│  Idade: 5 anos                                   │
│  Microchip: 900123456789012                      │
│  Tutor responsável: Belisario Retto              │
│  Desde: DD/MM/AAAA                               │
│                                                   │
│            Estado de Saúde                       │
│                                                   │
│  Vacinas em dia: V10, Antirrábica, Leishmaniose  │
│  Alergias conhecidas: nenhuma                    │
│  Condições crônicas: nenhuma                     │
│                                                   │
│            Comportamento Registrado              │
│                                                   │
│  Humor predominante nos últimos 90 dias: calmo   │
│  Entradas de socialização recentes:              │
│    • 12/03 — conviveu com outros cães no parque  │
│    • 28/03 — visita ao pet shop sem incidente    │
│                                                   │
│            Disclaimer                            │
│                                                   │
│  Este documento é uma síntese gerada            │
│  automaticamente a partir do diário e            │
│  prontuário do tutor no auExpert. Não            │
│  substitui avaliação veterinária ou              │
│  comportamental profissional.                    │
│                                                   │
│  auexpert.com.br · Emitido por Multiverso        │
│  Digital · Documento verificável via QR abaixo   │
│                                                   │
│  [QR Code pra endpoint público de verificação]   │
└─────────────────────────────────────────────────┘
```

Tipografia: Inter + Playfair. Paleta: Elite (Ametista em acentos, sem frescura). Logo + QR pra dar peso institucional.

### Verificação via QR

QR Code aponta pra `auexpert.com.br/verify/:attestation_id?sig=...` — tela pública que mostra "Este atestado foi emitido em DD/MM/AAAA e é válido" ou "Este atestado foi revogado/está obsoleto". Serve pra hotel/pet-shop verificar autenticidade.

Implementação: URL assinada com HMAC curto (8-12 chars). Baixíssima carga.

---

## 6. Telas

**`/pet/[id]/attestation`** — preview + download:
- Preview HTML renderizado na tela
- Botão "Exportar PDF" (via `PdfActionModal`)
- Botão "Atualizar" (regera com dados mais recentes)
- Histórico: últimas 3 emissões com data

Fluxo inteiro em 1 tela. Sem wizard.

---

## 7. i18n (bilíngue nativo — chaves duplicadas PT/EN no PDF)

```json
"attestation.title": "Atestado do auExpert",
"attestation.titleEn": "auExpert Attestation",
"attestation.issuedAt": "Emitido em {{date}}",
"attestation.issuedAtEn": "Issued on {{date}}",
"attestation.section.identification": "Identificação do Pet",
"attestation.section.identificationEn": "Pet Identification",
"attestation.section.health": "Estado de Saúde",
"attestation.section.healthEn": "Health Status",
"attestation.section.behavior": "Comportamento Registrado",
"attestation.section.behaviorEn": "Recorded Behavior",
"attestation.disclaimer": "Este documento é uma síntese gerada automaticamente a partir do diário e prontuário do tutor no auExpert. Não substitui avaliação veterinária ou comportamental profissional.",
"attestation.disclaimerEn": "This document is an automatically generated summary based on the tutor's diary and medical record in auExpert. It does not replace professional veterinary or behavioral evaluation.",
"attestation.verify.cta": "Verificar autenticidade",
"attestation.verify.ctaEn": "Verify authenticity",
"attestation.cta.generate": "Gerar atestado"
```

---

## 8. Regra de integridade

Cada atestado registra:
- `generated_at` — timestamp exato
- `snapshot_data` — todos os dados exibidos no PDF (imutáveis depois de emitir)
- `signature_hash` — HMAC do snapshot + secret do auExpert

Se tutor tentar reemitir, gera **novo atestado com novo ID**. Jamais edita um atestado existente. Isso garante que o QR de verificação remeta a um documento fiel.

---

## 9. Estimativa

- Migration (opcional, cache): 0.5 dia
- EF `generate-pet-attestation-pdf` + template HTML: 2 dias
- Endpoint público `/verify/:id`: 0.5 dia
- Tela `/pet/[id]/attestation`: 1 dia
- QA + teste visual do PDF: 0.5 dia

**Total: ~4-5 dias.** Mais barato das 5 features aspiracionais.

---

## 10. Decisões em aberto

1. **QR de verificação pública.** Sugestão: sim — dá peso institucional. Custo é quase zero.
2. **Expiração.** Atestado tem validade? Sugestão: **30 dias** (dados podem desatualizar). Depois disso, o `/verify` retorna "obsoleto — pedir novo".
3. **Assinatura digital ICP-Brasil?** Fora de escopo MVP. Futuro: tutor que quiser pode pagar add-on pra assinar o PDF com certificado digital.
4. **Uso comercial.** Hotel/pet-shop pode virar parceiro validador (recebe acesso a dashboard de atestados vistoriados)? Fora de escopo inicial.
