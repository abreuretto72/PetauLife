# Carta ao Pet — spec

> **Pilar 6.2** do plano de posicionamento Elite
> **Status:** spec pronta, não implementada
> **Prioridade:** média — feature íntima que reforça vínculo

---

## 1. Conceito

Funcionalidade discreta no menu de configurações do pet: **"Escrever uma carta para [nome]"**. Tutor escreve um texto longo (sem limite prático), o app arquiva com data. Cartas aparecem em três momentos:

1. No **aniversário do pet** (notificação "Rex faz 5 anos hoje. Lembra do que você escreveu há 2 anos?")
2. Na **retrospectiva anual** como seção "Cartas que o tutor deixou"
3. No **Plano de Legado** (Pilar 6.3) como anexo

É tutor-to-pet, não app-to-tutor. Reforça o vínculo emocional sem passar pela IA.

---

## 2. Modelo de dados

```sql
CREATE TABLE pet_letters (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id          uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.users(id),
  title           text,                         -- opcional, default "Carta de {{data}}"
  body            text NOT NULL,                -- texto completo (markdown leve aceito)
  written_at      timestamptz NOT NULL DEFAULT NOW(),
  occasion        text CHECK (occasion IN ('random', 'birthday', 'adoption_anniversary', 'milestone', 'farewell')),
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT NOW()
);

CREATE INDEX pet_letters_pet_id_idx ON pet_letters(pet_id) WHERE is_active;
```

RLS: só o tutor que escreveu lê e edita. Outros tutores (co-parent, caregiver) **não** têm acesso — cartas são íntimas.

---

## 3. Edge Functions

Nenhuma EF nova necessária. É CRUD simples via Supabase client no app.

Opcional: `suggest-letter-prompt` — se tutor abrir carta vazia, IA pode sugerir um prompt literário ("Escreva sobre um momento deste mês que você quer que Rex leia quando tiver 10 anos"). Baixa prioridade.

---

## 4. Telas

**`/pet/[id]/letters`** — índice de cartas:
- Lista cronológica
- Cada item: título (ou "Carta de DD/MM/AAAA") + primeiras palavras + data
- CTA "Escrever nova carta"

**`/pet/[id]/letters/[letter_id]`** — leitura da carta:
- Tipografia: Playfair para títulos, Inter 15px para corpo, lineHeight 1.8 (leitura confortável)
- Sem UI extra — a carta é o conteúdo

**`/pet/[id]/letters/new`** — editor:
- TextArea expansível (sem limite)
- Campo título opcional
- Campo ocasião (chip selector: Aleatória, Aniversário, Marco, Despedida)
- Botão "Guardar"
- Mic STT disponível (regra AI-first do CLAUDE.md §1.1)

---

## 5. Integrações

- **Retrospectiva anual**: `generate-yearly-retrospective` lê `pet_letters` do ano e inclui uma seção "Cartas deste ano" no final do PDF.
- **Plano de Legado**: `pet_letters` com `occasion='farewell'` viram anexo do PDF de legado.
- **Notificação de aniversário**: CRON diário verifica aniversário do pet → se houver cartas no histórico, push "Tem cartas guardadas esperando serem lidas de novo".

---

## 6. i18n

```json
"letters.title": "Cartas para {{name}}",
"letters.empty": "Ainda não há cartas para {{name}}.",
"letters.new.title": "Escrever uma carta",
"letters.new.placeholder": "O que gostaria de dizer a {{name}} hoje?",
"letters.new.occasion": "Ocasião",
"letters.occasion.random": "Momento aleatório",
"letters.occasion.birthday": "Aniversário",
"letters.occasion.milestone": "Marco",
"letters.occasion.farewell": "Despedida",
"letters.save": "Guardar carta",
"letters.saved": "Carta guardada.",
"letters.list.defaultTitle": "Carta de {{date}}",
```

---

## 7. Estimativa

- Migration: 0.5 dia
- Telas (index + leitura + editor): 2 dias
- Integração com retrospectiva: 0.5 dia
- Integração com legado: 0.5 dia
- i18n + QA: 0.5 dia

**Total: ~4 dias**.

---

## 8. Decisões em aberto

1. **Edição depois de salva?** Sugestão: sim, mas com aviso discreto (uma carta "publicada" para o pet idealmente não muda).
2. **Compartilhamento?** Uma carta poderia ser compartilhada com co-parent? Sugestão: **não**. Carta é íntima, e intimidade individual não é transferível.
3. **Limite de tamanho?** Sugestão: sem limite. Se um tutor escrever 20 mil palavras, que escreva.
