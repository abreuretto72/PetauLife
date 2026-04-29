# Roadmap do Módulo Viagem — Fases 3, 4 e 5 (PRs #2, #3 e #4)

> Este documento estende o **PR #1** (Fases 1 e 2 — Planejamento e Preparação) e define as três fases restantes do módulo de viagem do auExpert. Mesmo nível de detalhe; mesmos princípios; mesmas disciplinas estabelecidas no PR #1.
>
> **Premissa:** ler o PR #1 antes deste. Esse doc assume conhecimento das tabelas (`trips`, `trip_pets`, `trip_documents`, `travel_rules_generated`), dos hooks (`useTrips`, `useTripDocuments`, `useTravelRules`), das Edge Functions já criadas (`extract-travel-document`, `parse-travel-intent`, `generate-travel-rules`) e das convenções do projeto (`verify_jwt: false`, FKs em `public.users`, `select('*')` simples + FK explícita por nome quando há joins, `notify pgrst, 'reload schema'` após mudanças de FK, debug logs preservados, digitação zero, multilíngue pt-BR primeiro).

---

## 0. Mapa de fases e transições de status

```
┌──────────┐    ┌───────────┐    ┌─────────┐    ┌───────────┐    ┌───────────┐    ┌──────────┐
│ planning │ -> │ preparing │ -> │ active  │ -> │ returning │ -> │ completed │ -> │ archived │
│  Fase 1  │    │  Fase 2   │    │  Fase 3 │    │  Fase 4   │    │  Fase 5   │    │  Fase 5+ │
│  PR #1   │    │  PR #1    │    │  PR #2  │    │  PR #3    │    │  PR #4    │    │  PR #4   │
└──────────┘    └───────────┘    └─────────┘    └───────────┘    └───────────┘    └──────────┘
   voz +          checklist        prontuário      retorno          memorial         arquivo
   intent         + docs           + tradutor      + reentrada      + insights
                                   + diário leve
```

**Transições (todas confirmadas pelo tutor — nunca silenciosas):**

| De → Para | Trigger | Ator |
|-----------|---------|------|
| `planning` → `preparing` | Tutor anexa primeiro documento OU tutor toca "começar preparação" | Tutor |
| `preparing` → `active` | Tutor toca "Embarquei" (botão grande visível a partir de `start_date - 1d`) | Tutor |
| `active` → `returning` | Tutor toca "Voltando para casa" (visível a partir de `end_date - 2d`) | Tutor |
| `returning` → `completed` | Tutor toca "Cheguei em casa" → grava `actual_return_date` | Tutor |
| `completed` → `archived` | Job diário: 30 dias após `actual_return_date` OU tutor arquiva manualmente | Sistema / tutor |

Toda transição mostra um sheet/modal de confirmação visual (ícone grande, frase única, botão único). Sem texto livre.

---

# PR #2 — Fase 3: Durante a viagem (status `active`)

> **Objetivo:** o tutor está no destino com o pet. Pode ser que tudo corra perfeito (e nesse caso o app vira diário leve da viagem). Pode ser que o pet precise de atendimento veterinário (e nesse caso o app é a diferença entre confusão total e consulta produtiva). **A feature âncora desta fase é a ferramenta de consulta com vet estrangeiro: prontuário traduzido + conversa em tempo real.**

## 0. Discovery (PR #2)

Antes de qualquer código:

1. Mapear onde estão os **dados de saúde do pet** que vão alimentar o prontuário: tabela `pets`, `vaccinations` (se existir), `medications` em uso (se existir), alergias, condições crônicas. Listar campos exatos disponíveis hoje. Se faltar campo crítico, propor migration mínima antes de prosseguir.
2. Verificar se há infraestrutura de **TTS (text-to-speech)** e **STT (speech-to-text)** já em uso no app. STT já existe (mencionado no PR #1 para `parse-travel-intent`). TTS — pode ser nativo do Expo (`expo-speech`) ou via API externa.
3. Verificar se o projeto já tem geração de PDF (talvez via Edge Function que renderiza HTML → PDF, ou lib client-side). Se não tem, decidir abordagem antes de codar — não bloquear o PR esperando isso, pode usar Web Share da tela em vez de PDF na primeira iteração.
4. Confirmar que `useDiaryEntries` aceita filtro/criação com `trip_id` (já adicionado como FK no PR #1).
5. Reportar achados em 5-10 linhas antes de começar.

## 1. Schema (incrementos)

### 1.1 Coluna em `trips`

```sql
alter table public.trips
  add column if not exists active_started_at timestamptz,    -- timestamp da transição preparing→active
  add column if not exists return_started_at timestamptz;    -- timestamp da transição active→returning
```

### 1.2 Tabela `trip_moments` (registros leves do dia-a-dia)

Diferente de `diary_entries` (entrada "pesada" com lente/IA/análise), `trip_moments` é log rápido durante a viagem. Pode virar `diary_entry` ao final (Fase 5 promove em batch), mas começa leve para zero fricção.

```sql
create table public.trip_moments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete cascade,
  tutor_id uuid not null references public.users(id) on delete cascade,
  moment_type text not null check (moment_type in (
    'meal', 'potty', 'sleep', 'walk', 'play', 'first_time', 'concern', 'photo_only', 'other'
  )),
  notes text,                                  -- transcrito de voz, opcional
  voice_recording_path text,                   -- áudio original opcional, no storage
  photo_paths text[] default '{}',
  promoted_to_diary_entry_id uuid references public.diary_entries(id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_trip_moments_trip_id on public.trip_moments(trip_id);
create index idx_trip_moments_created_at on public.trip_moments(created_at desc);
```

### 1.3 Tabela `pet_medical_records_translated` (cache do prontuário traduzido)

O prontuário muda pouco em curto prazo. Cache global por (pet_id, target_locale, content_hash) economiza chamadas de IA e dá resposta instantânea quando o tutor abre a tela com o vet na frente.

```sql
create table public.pet_medical_records_translated (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  tutor_id uuid not null references public.users(id) on delete cascade,
  target_locale text not null,                  -- 'en-US', 'de-DE', 'ja-JP', etc.
  content_hash text not null,                   -- hash dos dados de saúde do pet no momento da geração
  record_data jsonb not null,                   -- estrutura traduzida (ver seção 2.1)
  rendered_html text,                           -- HTML estilizado, pronto pra exibir/PDF
  model_used text not null,
  generated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '60 days'),
  unique (pet_id, target_locale, content_hash)
);

create index idx_pet_medical_records_pet on public.pet_medical_records_translated(pet_id);
create index idx_pet_medical_records_expires on public.pet_medical_records_translated(expires_at);
```

**Política de invalidação:** trigger em `pets` (e em `vaccinations`, `medications` se existirem) que zera o cache do pet quando dados de saúde mudam. Implementação simples: deletar rows com aquele `pet_id` quando dado-fonte muda.

### 1.4 Tabela `trip_consultations` (histórico de consulta vet)

Salva o histórico de uma consulta vet durante a viagem — útil pro tutor revisitar depois e pra promover a `diary_entry` ao final.

```sql
create table public.trip_consultations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete cascade,
  vet_name text,                                -- preenchido depois, opcional
  vet_clinic text,
  vet_locale text not null,                     -- idioma falado pelo vet
  reason_summary text,                          -- "vômito 24h" — gerado por IA do histórico
  conversation_log jsonb not null default '[]', -- array de turns (ver seção 2.2)
  medical_record_snapshot_id uuid references public.pet_medical_records_translated(id) on delete set null,
  shared_via text,                              -- 'screen', 'pdf', 'public_link', null
  public_link_token text,                       -- se compartilhou via link público
  public_link_expires_at timestamptz,
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create index idx_trip_consultations_trip on public.trip_consultations(trip_id);
create index idx_trip_consultations_pet on public.trip_consultations(pet_id);
create unique index idx_trip_consultations_token on public.trip_consultations(public_link_token)
  where public_link_token is not null;
```

### 1.5 RLS

Padrão idêntico ao PR #1: tutor só vê o que é seu, via FK em `trips`.

```sql
alter table public.trip_moments enable row level security;
alter table public.pet_medical_records_translated enable row level security;
alter table public.trip_consultations enable row level security;

create policy "trip_moments_via_trip" on public.trip_moments
  for all using (exists (select 1 from public.trips t where t.id = trip_id and t.tutor_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_id and t.tutor_id = auth.uid()));

create policy "pet_medical_records_owner" on public.pet_medical_records_translated
  for all using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());

create policy "trip_consultations_via_trip" on public.trip_consultations
  for all using (exists (select 1 from public.trips t where t.id = trip_id and t.tutor_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_id and t.tutor_id = auth.uid()));

notify pgrst, 'reload schema';
```

**Importante (link público):** consultas compartilhadas via link público (token) precisam de **endpoint próprio** (Edge Function `get-shared-consultation`) que valida o token e retorna o conteúdo sem auth — RLS não cobre esse caso. Token expira em 24h por padrão.

## 2. Funcionalidade âncora — Atendimento veterinário

### 2.1 Edge Function `generate-pet-medical-record`

Gera o prontuário traduzido do pet em idioma alvo. Em `supabase/functions/generate-pet-medical-record/index.ts`. `verify_jwt: false`.

**Recebe:**
```ts
{
  pet_id: string;
  target_locale: string;          // 'en-US', 'de-DE', 'ja-JP', 'fr-FR', etc.
  trip_id?: string;               // opcional, para contexto
  force_regenerate?: boolean;     // ignora cache (default false)
}
```

**Fluxo:**

1. Service role busca dados de saúde do pet: `pets`, vacinas, medicações em uso, alergias, condições crônicas, microchip, vet de origem (CRMV se houver), peso, idade.
2. Calcula `content_hash` dos dados.
3. Verifica cache em `pet_medical_records_translated` por (pet_id, target_locale, content_hash). Se hit válido (`expires_at > now()`), retorna direto.
4. Se cache miss: chama **Claude Opus 4.7** (terminologia médica é crítica — não economizar aqui) com prompt especializado em prontuário veterinário.
5. Salva resultado no cache + retorna.

**Estrutura de retorno (`record_data`):**

```ts
{
  pet: {
    name: string;
    species_label: string;        // "Dog" / "Hund" / "犬" — traduzido
    breed: string;
    sex_label: string;
    date_of_birth: string;        // ISO
    age_label: string;            // "5 years and 3 months" — traduzido
    weight_kg: number;
    color_label: string;
    microchip_number: string | null;
  };
  health: {
    allergies: { item: string; severity_label: string; notes?: string }[];
    chronic_conditions: { name: string; since: string; notes?: string }[];
    current_medications: {
      name_brand: string;
      name_generic?: string;       // DCI/INN — preferido se disponível
      dosage: string;
      frequency_label: string;     // "twice a day" — traduzido
      since: string;
      reason?: string;
    }[];
  };
  vaccinations: {
    vaccine_name: string;          // nome genérico no idioma alvo
    last_dose_date: string;
    valid_until: string | null;
    batch?: string;
  }[];
  origin_vet: {
    name: string | null;
    clinic: string | null;
    crmv: string | null;
    phone: string | null;
    email: string | null;
  };
  tutor_contact: {
    name: string;
    phone: string;
    email: string;
    home_country: string;          // 'Brazil' traduzido
  };
  travel_context: {                // se trip_id fornecido
    origin_country: string;
    destination_country: string;
    travel_dates: { start: string; end: string };
  } | null;
  generated_at: string;
  language_note: string;           // "Translated medical record. Original data in Portuguese." — traduzido
  disclaimer: string;              // disclaimer médico-legal traduzido
}
```

**Prompt (Opus 4.7):**

```
Você é um especialista em terminologia veterinária multilíngue. Sua tarefa é gerar
um prontuário clínico traduzido de um animal de estimação para apresentação a um
veterinário no destino de viagem.

Idioma alvo: {target_locale}
Tutor está fora do país de origem ({origin_country}) e pode precisar de atendimento.

Dados originais (em português):
{json com todos os dados do pet}

REGRAS CRÍTICAS:
- Use TERMINOLOGIA VETERINÁRIA CORRETA do idioma alvo, não tradução literal.
  Exemplo: "vermífugo" → "anthelmintic" (não "wormicide").
- Para vacinas, use nomes internacionais reconhecidos: V10 → "DHPP-L"
  (Distemper-Hepatitis-Parvo-Parainfluenza + Leptospirose) com nota explicativa.
- Para medicações: prefira DCI/INN (nome genérico internacional) ao nome comercial
  brasileiro, mas mantenha o nome comercial entre parênteses. Exemplo:
  "Vetnil (firocoxib)" se aplicável.
- Datas no formato local apropriado.
- Pesos e medidas: kg para a maior parte do mundo, lb para US.
- Idade calculada a partir de date_of_birth e a data atual ({current_date}).
- "language_note" e "disclaimer" devem estar no idioma alvo, com a frase clara
  de que este é um prontuário traduzido a partir de registros em português.
- Disclaimer médico-legal: deixar claro que o documento é informativo, gerado
  pelo tutor a partir de registros pessoais, e que o vet do destino deve fazer
  sua própria avaliação clínica.

Retorne APENAS JSON válido conforme schema fornecido.
```

**Renderização HTML:** após receber JSON, a Edge Function gera também um `rendered_html` que é uma página estilizada (sóbria, alta legibilidade, fonte grande) pronta pra exibir ao vet ou converter em PDF. HTML inline com CSS minimalista — sem dependências externas.

**Logs de debug:** `[generate-pet-medical-record]` em todos os logs. Logar: cache hit/miss, idioma alvo, tempo de resposta do Claude, hash dos dados, tamanho do JSON gerado. Manter logs (regra do projeto).

### 2.2 Edge Function `translate-vet-conversation`

Tradutor de conversa em tempo real. Otimizado para velocidade (Sonnet 4.6 — Opus seria desnecessariamente lento aqui).

**Recebe:**
```ts
{
  consultation_id?: string;        // se existe, anexa ao histórico
  trip_id: string;
  utterance_audio_base64: string;  // áudio bruto
  source_locale: 'tutor' | 'vet';  // qual lado falou
  tutor_locale: string;            // ex: 'pt-BR'
  vet_locale: string;              // ex: 'de-DE'
  context_summary?: string;        // últimas 3-5 turns para contexto
}
```

**Fluxo:**

1. STT do áudio no idioma do falante (reusa Edge Function de STT existente do projeto).
2. Tradução com Claude Sonnet 4.6, prompt focado em consulta veterinária.
3. TTS do texto traduzido (decisão técnica no Discovery — Expo native, ElevenLabs, ou Google TTS).
4. Atualiza `conversation_log` da consulta (ver schema abaixo).
5. Retorna texto original + texto traduzido + URL do áudio TTS.

**Schema de `conversation_log` em `trip_consultations`:**

```ts
{
  turns: [
    {
      id: string;
      speaker: 'tutor' | 'vet';
      timestamp: string;
      original_text: string;
      original_locale: string;
      translated_text: string;
      translated_locale: string;
      audio_in_path?: string;       // áudio original do falante
      audio_out_path?: string;      // áudio TTS no idioma do ouvinte
    }
  ];
  summary?: string;                 // gerado por IA ao fim da consulta
}
```

**Prompt de tradução (Sonnet 4.6):**

```
Você é um intérprete especializado em consultas veterinárias.
Traduza a fala abaixo do idioma {source_locale} para {target_locale}.

Contexto: tutor brasileiro está em consulta com vet em {target_locale}.
Pet em questão: {pet_species_breed_age}.
Últimas falas (contexto): {last_3_turns}

Fala atual ({speaker}):
"{utterance_text}"

REGRAS:
- Preserve TERMINOLOGIA MÉDICA. Não simplifique demais ("emese" pode virar
  "vômito" se o falante usou linguagem leiga; mas se o vet disse "emesis",
  manter "vômito" também é leigo demais — adaptar ao registro).
- Se o tutor usar nome comercial brasileiro de medicamento, busque equivalente
  internacional (DCI/INN) e inclua entre parênteses.
- Se o vet usar termo desconhecido pro tutor leigo, traduzir para termo simples
  + termo técnico entre parênteses. Exemplo: "anorexia" → "falta de apetite (anorexia)".
- Tom: profissional mas caloroso. Vet falando ao tutor estrangeiro = paciente.
- Retornar APENAS o texto traduzido, sem aspas, sem comentário, sem nada extra.
```

**Logs de debug:** `[translate-vet-conversation]` — logar locale, latência STT, latência tradução, latência TTS, total. **Não logar o texto traduzido em nível INFO** (privacidade médica) — usar DEBUG e configurar nível adequado em produção.

### 2.3 Edge Function `summarize-consultation`

Ao final da consulta (tutor toca "encerrar consulta"), gera resumo em pt-BR pra tutor revisitar depois e pra promover a `diary_entry`.

**Recebe:** `{ consultation_id: string }`

**Fluxo:** lê `conversation_log` completo, pede ao Sonnet 4.6 um resumo estruturado:

```ts
{
  reason: string;                  // motivo da consulta
  symptoms_reported: string[];
  vet_assessment: string;          // o que o vet falou
  prescriptions: { medication: string; dosage: string; duration: string }[];
  follow_up_recommended: string | null;
  red_flags: string[];             // sinais de alerta mencionados
  full_summary_pt_br: string;      // 2-3 parágrafos
}
```

Salva em `trip_consultations.reason_summary` + outras colunas se quisermos expandir.

## 3. UI — Atendimento veterinário

Tela `app/trips/[id]/consultation.tsx`.

### 3.1 Tela inicial — escolha de idioma

Quando tutor abre "Atendimento veterinário", a primeira pergunta é: **"Qual idioma fala o veterinário?"**.

- Cards visuais grandes com bandeira + nome do idioma. Top 8 candidatos baseados no `destination_country_code` da trip:
  - Se `DE` → alemão como primeiro card, depois inglês.
  - Se `JP` → japonês primeiro, depois inglês.
  - Sempre incluir inglês como fallback universal.
- Botão pequeno "outro idioma" → bottom sheet com lista completa.

Idioma escolhido fica salvo na consulta. Pode trocar depois.

### 3.2 Tela ativa — três modos

Layout com tab switcher grande no topo: **📋 Prontuário** | **🎙️ Conversa** | **📞 Compartilhar**.

#### Modo "Prontuário" (default)

- Carrega `generate-pet-medical-record` (cache hit é instantâneo; cache miss mostra spinner com mensagem traduzida no idioma alvo: "Preparing medical record...").
- Renderiza o `rendered_html` em fullscreen, **alta legibilidade** (fonte 16-18pt, contraste alto, layout limpo).
- Header sticky com:
  - Foto do pet
  - Botão "🔊 Falar em [idioma]" → TTS lê o prontuário em voz alta (útil se o vet preferir ouvir).
  - Botão "↻ Atualizar" → força regeneração (`force_regenerate: true`).

**Princípio de design:** essa tela é literalmente passada ou apontada para o vet. O vet vai ler. Otimizar para leitura externa, não para o tutor.

#### Modo "Conversa"

UI tipo **walkie-talkie de dois botões grandes**:

```
┌─────────────────────────────────────┐
│                                     │
│    Última fala (em destaque)       │
│    ────────────────────────────    │
│    "O Pico está vomitando desde    │
│     ontem e parou de comer."       │
│                                     │
│    Tradução para o vet:            │
│    "Pico has been vomiting since   │
│     yesterday and stopped eating." │
│                                     │
│    [▶ Reproduzir tradução]         │
│                                     │
└─────────────────────────────────────┘
┌──────────────────┬──────────────────┐
│   🇧🇷 Eu falo    │   🇩🇪 Vet fala   │
│   (segure)        │   (segure)       │
└──────────────────┴──────────────────┘
```

- Push-to-talk (segura o botão, fala, solta).
- Enquanto grava: animação de onda + timer.
- Ao soltar: status "traduzindo..." → mostra texto + reproduz TTS automaticamente.
- Histórico das turns aparece em scroll acima — bolha tipo chat, mas com idioma original + tradução em cada turn.
- Botão flutuante "📋 Mostrar prontuário" volta ao modo prontuário rapidamente.

**Latência alvo:** < 4s do "soltar" até áudio traduzido tocar. STT + tradução + TTS em paralelo onde possível.

**Fallback de rede:** se a Edge Function falhar (sem internet, timeout), avisar com banner amarelo "Tradução offline indisponível — registrando áudio para depois". Salva o turn sem tradução; tradução é tentada de novo quando reconectar.

#### Modo "Compartilhar"

Para casos em que o vet quer levar o prontuário ou o tutor quer enviar para alguém (vet do Brasil, co-tutor):

- **📱 Mostrar tela** — fullscreen do prontuário traduzido. Vet pode ler ou fotografar.
- **📄 Exportar PDF** — gera arquivo via Edge Function que renderiza o `rendered_html` em PDF. Salva no device + opção de share nativo.
- **🔗 Link público temporário** — gera token único + URL pública (ex: `https://auexpert.com.br/c/{token}`). Token salva em `trip_consultations.public_link_token`, expira em 24h por padrão (configurável: 1h, 24h, 7d). Ao acessar a URL, vet vê uma página somente-leitura do prontuário, sem precisar de conta.
- **📲 Enviar via mensagem** — usa share intent do SO (WhatsApp, email, etc.) com link público pré-gerado.

**Endpoint público:** Edge Function `get-shared-consultation` em `supabase/functions/get-shared-consultation/index.ts`, `verify_jwt: false`. Recebe token via path/query, valida expiração, retorna `rendered_html`. **Não retorna dados crus do JSON** — só HTML renderizado, para reduzir superfície de exposição.

### 3.3 Encerrar consulta

Botão "Encerrar consulta" no header. Abre sheet com:

- Tutor pode preencher (opcional, por voz) nome do vet, clínica, motivo principal.
- Toca "salvar" → `summarize-consultation` é chamado → resumo gerado em pt-BR.
- Consulta vira card no histórico da viagem (módulo de timeline da Fase 5 também usa).

## 4. Funcionalidade secundária — Diário leve da viagem

Para os dias em que tudo corre bem e o tutor só quer registrar memória.

### 4.1 Componente `<TripMomentLogger />`

Card grande no dashboard da viagem ativa (`app/trips/[id]/active.tsx`). Layout:

```
┌─────────────────────────────────────┐
│   Dia 3 de 8 em Berlim 🇩🇪          │
│                                     │
│   ┌───────────────────────────────┐ │
│   │    🎤 Registrar momento      │ │
│   │       (toque para falar)      │ │
│   └───────────────────────────────┘ │
│                                     │
│   Atalhos rápidos:                  │
│   🍽️ Comeu  💧 Banheiro  😴 Dormiu │
│   🚶 Passeio  🎉 1ª vez  📸 Foto   │
│                                     │
└─────────────────────────────────────┘
```

**Comportamento:**

- **Tap em atalho** (🍽️ 💧 😴 🚶 🎉 📸) → cria `trip_moment` com `moment_type` correspondente, `created_at` agora, sem mais nada. Toast confirma. Zero fricção.
- **Tap longo em atalho** → overlay com gravação de voz para nota + opção de foto. Voz transcrita vira `notes`.
- **Tap em "🎤 Registrar momento"** → grava voz, IA classifica o `moment_type` automaticamente (Edge Function `parse-trip-moment` — usa Sonnet 4.6, prompt simples).
- **Foto:** sempre adiciona ao moment atual ou cria novo `photo_only`.

**Princípio:** zero `<TextInput>`. Texto vem só de voz transcrita.

### 4.2 Edge Function `parse-trip-moment`

Em `supabase/functions/parse-trip-moment/index.ts`. `verify_jwt: false`.

**Recebe:** `{ transcript: string, locale: string }`

**Retorna:**
```ts
{
  moment_type: 'meal' | 'potty' | 'sleep' | 'walk' | 'play' | 'first_time' | 'concern' | 'other';
  notes_clean: string;             // texto limpo, opcional reescrito para clareza
  confidence: number;
}
```

Prompt curto: dado o transcript, classifica em uma das categorias e retorna texto limpo. Se confidence < 0.7, retorna `other` e mantém transcript original.

### 4.3 Timeline da viagem ativa

Tab "Linha do tempo" na tela ativa. Lista cronológica reversa de `trip_moments` + `diary_entries` com `trip_id` desta trip + `trip_consultations`. Cada item:

- Ícone do tipo
- Hora local + dia da viagem ("Dia 3, 14:32")
- Snippet (texto + foto thumb se houver)
- Tap → expande / abre

## 5. Hooks (PR #2)

```ts
// useTripMoments.ts
export function useTripMoments(tripId: string) { ... }
export function useCreateTripMoment() { ... }

// usePetMedicalRecord.ts
export function usePetMedicalRecord(petId: string, targetLocale: string, tripId?: string) { ... }
export function useRegeneratePetMedicalRecord() { ... }

// useTripConsultation.ts
export function useTripConsultation(consultationId: string) { ... }
export function useCreateConsultation() { ... }
export function useTranslateConversationTurn() { ... }   // mutation
export function useEndConsultation() { ... }              // chama summarize-consultation
export function useShareConsultation() { ... }            // gera token público
```

Padrão de query keys, invalidação e error handling — seguir convenção do projeto (idêntico ao PR #1).

## 6. i18n (PR #2)

Estratégia idêntica ao PR #1: pt-BR completo agora, outros 4 idiomas com placeholder `[TODO-{LOCALE}]`. Atualizar `MISSING_TRANSLATIONS.md`.

Chaves novas principais:

```
travel.active.dashboard.title
travel.active.day_counter            # "Dia {current} de {total} em {city}"
travel.active.start_consultation
travel.active.log_moment
travel.active.timeline.title

travel.consultation.choose_vet_language
travel.consultation.tabs.record
travel.consultation.tabs.conversation
travel.consultation.tabs.share
travel.consultation.preparing_record
travel.consultation.share.show_screen
travel.consultation.share.export_pdf
travel.consultation.share.public_link
travel.consultation.share.public_link.expiry.1h
travel.consultation.share.public_link.expiry.24h
travel.consultation.share.public_link.expiry.7d
travel.consultation.conversation.tutor_button
travel.consultation.conversation.vet_button
travel.consultation.conversation.translating
travel.consultation.conversation.offline_warning
travel.consultation.end.title
travel.consultation.end.confirm

travel.moment.type.meal
travel.moment.type.potty
travel.moment.type.sleep
travel.moment.type.walk
travel.moment.type.play
travel.moment.type.first_time
travel.moment.type.concern
travel.moment.type.photo_only
travel.moment.type.other
travel.moment.shortcut.meal
travel.moment.shortcut.potty
[...]

# Disclaimers (críticos — precisão jurídica)
travel.consultation.disclaimer.medical_legal      # "Documento informativo. Vet local deve fazer avaliação independente."
travel.consultation.disclaimer.translation_quality # "Tradução automática. Confirmar termos críticos."
```

**O `disclaimer.medical_legal` precisa ser revisado por humano antes do go-live em todos os 5 idiomas.** Adicionar nota em `MISSING_TRANSLATIONS.md` flagando isso.

## 7. Critérios de aceite (PR #2)

- [ ] Discovery executado e reportado.
- [ ] Migration aplica e gera 3 tabelas novas (`trip_moments`, `pet_medical_records_translated`, `trip_consultations`) + colunas novas em `trips` + RLS + índices + `notify pgrst`.
- [ ] Edge Functions deployadas com `verify_jwt: false`: `generate-pet-medical-record`, `translate-vet-conversation`, `summarize-consultation`, `parse-trip-moment`, `get-shared-consultation`.
- [ ] `generate-pet-medical-record` com cache funcionando (segunda chamada é instantânea).
- [ ] Tela de prontuário renderiza HTML legível em pelo menos 3 idiomas testados (en, de, ja).
- [ ] Modo conversa funciona ponta a ponta: tutor fala PT → traduz para idioma alvo → TTS reproduz → vet fala → traduz para PT → TTS reproduz. Latência média < 5s.
- [ ] Compartilhamento via link público funciona — link expira em 24h por default.
- [ ] Atalhos de moment criam registros instantâneos.
- [ ] Trip muda de `preparing` → `active` via botão "Embarquei" (visível a partir de `start_date - 1d`).
- [ ] Diary entries criadas durante trip ativa recebem `trip_id` automaticamente.
- [ ] pt-BR completo. Outros 4 com placeholder. `MISSING_TRANSLATIONS.md` atualizado, com flag explícita de que disclaimers médico-legais precisam revisão humana.
- [ ] Logs de debug mantidos.
- [ ] Sem `<TextInput>` em qualquer tela do PR.

---

# PR #3 — Fase 4: Volta (status `returning`)

> **Objetivo:** o tutor está retornando para o país de origem (ou já voltou e ainda não confirmou). Estado mental: viagem terminando, mas há etapas burocráticas dependendo do destino e do país de origem. Em alguns casos (UE → BR, US → BR, AU → BR) há documentação de retorno; em outros (Mercosul → BR), é simples. **A feature âncora desta fase é o checklist de reentrada + confirmação de chegada segura.**

## 0. Discovery (PR #3)

1. Confirmar que `useTravelRules` do PR #1 pode ser invocado com **direção invertida** (origem = país de destino atual da viagem; destino = país de origem do tutor). Se não estiver pronto, estender.
2. Verificar se o `resolveTravelRules` aceita `origin_country` e `target_country` como parâmetros separados — necessário para regras de retorno.
3. Reportar achados em 5-10 linhas.

## 1. Schema (incrementos)

### 1.1 Coluna em `trips`

```sql
alter table public.trips
  add column if not exists return_checklist_state jsonb not null default '{}'::jsonb;
-- estrutura idêntica a checklist_state, mas para itens de retorno
```

`actual_return_date` já existe (criado no PR #1).

### 1.2 Reuso de `trip_documents`

Documentos de retorno (ex: CVI emitido pelo país de destino para retorno ao Brasil) usam a tabela `trip_documents` existente, com `document_type` específico:

- `return_health_certificate`
- `return_export_permit`
- `return_flight_ticket`

Não precisa schema novo.

### 1.3 Migration

```sql
-- Apenas a coluna de checklist e o notify
notify pgrst, 'reload schema';
```

## 2. Funcionalidade — Checklist de retorno

### 2.1 Lógica de geração

Quando trip muda para `returning`, o app dispara `useTravelRules` invertido:

```ts
// Direção: do destino atual de volta ao país de origem do tutor
const returnRules = useTravelRules(
  tutorHomeCountry,           // 'BR' tipicamente
  petSpecies,
  { originCountry: trip.destination_country_code }   // país de partida desta vez
);
```

A função `resolveTravelRules` precisa aceitar `originCountry` como parâmetro para gerar regras corretas. Por exemplo, voltando da UE para o BR:

- CVI/atestado emitido pela autoridade do país de destino para entrada no BR
- Vacinação antirrábica em dia
- Microchip ISO
- Documentação de transporte (passagem de retorno)

Para viagens **domésticas** (BR → BR), o checklist de retorno é vazio ou só com itens leves (verificar saúde do pet, retomar rotina).

### 2.2 Tela `app/trips/[id]/return.tsx`

Layout em 3 seções verticais:

**Seção A — "Voltando para casa"**

Card grande com:
- Bandeira do destino + bandeira do origem com seta entre eles
- "Em {X} dias você volta para {origem}"
- Botão "Cheguei em casa 🏠" (visível desde `end_date`, mas só fica enabled de fato quando tutor confirma)

**Seção B — Checklist de retorno**

Reutiliza `<ChecklistView />` do PR #1, mas com `returnChecklistState` e regras invertidas. Mesma UX de anexar documento via câmera + IA extrai dados (`extract-travel-document` do PR #1).

Banner de disclaimer no topo (mesmas regras do PR #1):
- Se regras de retorno são `static_catalog`: banner sutil de revisão.
- Se `ai_generated`: banner amarelo "consulte vet e autoridade local".
- Se `generic_fallback`: banner laranja mais firme.

**Seção C — Memórias da viagem (preview)**

Pequeno card "Sua viagem em números":
- Quantidade de momentos registrados
- Quantidade de fotos
- Se houve consultas vet, mostra discreto
- Botão "Ver memorial completo" → desabilitado até `actual_return_date` ser preenchido (Fase 5)

Esse card é antecipação da Fase 5 — gera curiosidade sem entregar a feature ainda.

### 2.3 Confirmação de chegada

Tap em "Cheguei em casa 🏠":

1. Modal de confirmação fullscreen com ilustração + frase ("{Pet} chegou bem em {origem}?").
2. Tutor confirma → grava `actual_return_date = now()`, status muda para `completed`.
3. Tela transiciona com animação para a Fase 5 (memorial).

## 3. Funcionalidade secundária — Pré-curadoria do memorial

Enquanto o tutor está no avião de volta (ou nas últimas horas da viagem), o app pode **pré-gerar highlights** para o memorial da Fase 5, em background, para que ao chegar em casa o memorial já esteja pronto.

### 3.1 Edge Function `suggest-trip-highlights`

Em `supabase/functions/suggest-trip-highlights/index.ts`. `verify_jwt: false`.

**Recebe:** `{ trip_id: string }`

**Fluxo:**

1. Lê todos os `trip_moments`, `diary_entries` com `trip_id`, `trip_consultations` da viagem.
2. Pede ao Sonnet 4.6 que selecione 5-10 momentos mais marcantes, considerando:
   - Variedade (não 5 fotos da mesma cena).
   - Primeiras vezes (`first_time` é prioritário).
   - Marcos do dia a dia (primeira refeição no destino, primeiro passeio, etc.).
   - Diversidade de mídia (fotos, áudios, textos).
3. Retorna array de IDs com explicação curta de por que cada um foi selecionado.
4. Salva preview em `trips.metadata.highlights_preview`.

**Trigger:** chamada automática quando `return_started_at` é preenchido + ao tutor abrir a tela de "volta", se ainda não tiver sido chamada.

## 4. Hooks (PR #3)

```ts
// Reutilização do useTravelRules com direção invertida — a maior parte já existe.
// Hook novo:

// useReturnChecklist.ts
export function useReturnChecklist(tripId: string) { ... }
export function useUpdateReturnChecklistItem() { ... }

// useTripHighlightsPreview.ts
export function useTripHighlightsPreview(tripId: string) { ... }
```

## 5. i18n (PR #3)

```
travel.return.dashboard.title
travel.return.coming_home_in_days       # "Em {days} dias você volta para {country}"
travel.return.arrived_button
travel.return.arrived_confirm.title
travel.return.arrived_confirm.message
travel.return.checklist.title
travel.return.preview_memorial.title
travel.return.preview_memorial.locked   # "Confirme a chegada para ver"
travel.return.stats.moments
travel.return.stats.photos
travel.return.stats.consultations

# Categorias de requirement de retorno (algumas reaproveitam do PR #1)
travel.req.return_health_certificate.title
travel.req.return_health_certificate.description
travel.req.return_export_permit.title
travel.req.return_export_permit.description
```

## 6. Critérios de aceite (PR #3)

- [ ] Discovery executado e reportado.
- [ ] Migration aplica + `notify pgrst`.
- [ ] `resolveTravelRules` invertido funciona para BR como destino com pelo menos 3 origens testadas (UE, US, Mercosul).
- [ ] Tela `return.tsx` carrega checklist correto. Anexar documento funciona via câmera + extract-travel-document (reuso do PR #1).
- [ ] Botão "Cheguei em casa" muda status para `completed` e grava `actual_return_date`.
- [ ] Edge Function `suggest-trip-highlights` deployada com `verify_jwt: false` e popula `trips.metadata.highlights_preview`.
- [ ] pt-BR completo. Outros 4 com placeholder. `MISSING_TRANSLATIONS.md` atualizado.
- [ ] Disclaimers de retorno mostrados conforme `source` das regras.
- [ ] Logs de debug mantidos.
- [ ] Sem `<TextInput>`.

---

# PR #4 — Fase 5: Conclusão e Memorial (status `completed` → `archived`)

> **Objetivo:** a viagem terminou. O tutor está em casa. O app virou arquivo emocional + ferramenta de aprendizado para próximas viagens. **Duas features âncoras: o memorial gerado por IA (que é o "presente" do app pelo trabalho do tutor) e os insights práticos (que melhoram a próxima viagem).**

## 0. Discovery (PR #4)

1. Verificar se há infraestrutura de export PDF / share nativo no projeto (provavelmente já decidido no PR #2).
2. Verificar se há sistema de jobs/cron (Supabase scheduled functions) para o auto-archive de 30 dias.
3. Reportar achados.

## 1. Schema (incrementos)

### 1.1 Coluna em `trips`

```sql
alter table public.trips
  add column if not exists memorial_data jsonb,
  add column if not exists insights_data jsonb,
  add column if not exists archived_at timestamptz;
```

`memorial_data` é a estrutura completa do memorial gerado. `insights_data` são aprendizados práticos. Mantemos como JSONB em `trips` (não tabela separada) porque é 1:1 com a viagem e raramente queryado fora do contexto da própria trip.

### 1.2 Trigger / job de auto-archive

```sql
-- Função que arquiva trips completed há mais de 30 dias
create or replace function public.auto_archive_old_trips()
returns void
language plpgsql
security definer
as $$
begin
  update public.trips
  set status = 'archived',
      archived_at = now()
  where status = 'completed'
    and actual_return_date < (now() - interval '30 days')
    and archived_at is null;
end;
$$;

-- Schedule via pg_cron (se disponível) ou Edge Function diária
```

Se `pg_cron` não estiver disponível, criar Edge Function `archive-old-trips` que roda via Supabase Scheduled Functions diariamente.

```sql
notify pgrst, 'reload schema';
```

## 2. Funcionalidade âncora — Memorial

### 2.1 Edge Function `generate-trip-memorial`

Em `supabase/functions/generate-trip-memorial/index.ts`. `verify_jwt: false`. Usa **Claude Opus 4.7** — qualidade emocional importa, e isso roda apenas uma vez por viagem.

**Recebe:** `{ trip_id: string, regenerate?: boolean }`

**Fluxo:**

1. Lê dados completos da viagem: `trips`, `trip_moments`, `diary_entries` com `trip_id`, `trip_consultations`, `trip_documents`, `highlights_preview` (se já gerado na Fase 4).
2. Lê dados dos pets associados via `trip_pets`.
3. Pede ao Opus 4.7 um memorial estruturado.

**Prompt:**

```
Você é um escritor que ajuda tutores de pets a celebrarem memórias de viagens
com seus animais. Tom: caloroso, sincero, pessoal — nunca exagerado, nunca piegas.

Dados da viagem:
- Pet(s): {pets_summary}
- Origem: {origin_country}
- Destino: {destination_country}, {destination_city}
- Datas: {start_date} a {actual_return_date} ({total_days} dias)
- Motivo: {purpose_label}

Momentos registrados ({n_moments}):
{moments_chronological_json}

Entradas de diário ({n_entries}):
{diary_entries_summarized}

Consultas vet (se houver):
{consultations_summary}

Tarefa: gere o memorial com a estrutura abaixo, em pt-BR.

Estrutura JSON:
{
  "title": "Título evocativo curto, 5-8 palavras",
  "subtitle": "Frase de subtítulo, ~12 palavras",
  "opening_paragraph": "Parágrafo de abertura, 3-5 frases. Tom pessoal, dirigido ao tutor.",
  "highlights": [
    {
      "moment_id": "id do trip_moment ou diary_entry",
      "caption": "Legenda curta, 1-2 frases",
      "why_special": "Por que selecionei (1 frase, opcional)"
    }
  ],
  "stats": {
    "total_days": numero,
    "total_moments": numero,
    "total_photos": numero,
    "first_times": ["primeira vez vendo neve", "primeiro voo"],
    "consultations": numero
  },
  "closing_paragraph": "Parágrafo de fechamento, 2-4 frases. Dirigido ao tutor e ao pet pelo nome.",
  "shareable_summary": "Versão curta (1 parágrafo) para compartilhar em redes sociais sem dados pessoais sensíveis."
}

REGRAS:
- Nunca invente fatos. Se o dado não está nos registros, não mencione.
- Use o nome do pet com naturalidade, sem repetição forçada.
- Selecione 5-10 highlights, com variedade (foto, áudio, texto, primeira vez, consulta vet se relevante).
- Se houve consulta vet, mencione com leveza apropriada (não dramatizar; mas reconhecer que houve cuidado extra).
- Para `shareable_summary`, omitir dados sensíveis (saúde, locais específicos como hotel).
- Resposta: APENAS JSON válido.
```

4. Salva resultado em `trips.memorial_data`.
5. Retorna estrutura ao cliente.

**Custo estimado:** ~5000 input tokens + ~2000 output tokens × Opus 4.7 = ~US$ 0.10 por memorial. Roda uma vez por viagem (cache permanente; regeneração manual pelo tutor é opt-in com aviso).

### 2.2 Edge Function `generate-trip-insights`

Em `supabase/functions/generate-trip-insights/index.ts`. `verify_jwt: false`. **Sonnet 4.6** (insights práticos não exigem o nível emocional do memorial).

**Recebe:** `{ trip_id: string }`

**Retorna:**

```ts
{
  insights: [
    {
      category: 'transport' | 'lodging' | 'food' | 'health' | 'behavior' | 'documentation' | 'other';
      observation: string;          // o que aconteceu
      suggestion: string;           // o que considerar na próxima viagem
      severity: 'info' | 'consider' | 'important';
    }
  ];
  next_trip_checklist_additions: string[];   // itens para adicionar a futuros checklists deste tutor/pet
}
```

**Prompt:** dado o histórico da viagem, extrair padrões observáveis. Exemplos:

- "Mana não comeu nas primeiras 24h após o voo" → sugestão: testar comida levada de casa nos primeiros dias / considerar carro em viagens curtas.
- "Pico vomitou no dia 2" → consultar vet sobre enjoo de movimento antes da próxima viagem aérea.
- "Gastou 3 dias resolvendo CVI no destino porque chegou sem cópia" → adicionar "carregar cópia digital do CVI" ao próximo checklist.

Salva em `trips.insights_data`.

### 2.3 Tela `app/trips/[id]/memorial.tsx`

Visualização tipo "story de Instagram horizontal" — fullscreen com swipe entre slides.

**Slides na ordem:**

1. **Capa** — foto principal (mais "votada" por IA) + título + subtitle + nome do pet.
2. **Abertura** — `opening_paragraph` em fonte grande sobre fundo escuro com foto desfocada.
3. **Stats** — visual com números grandes ("8 dias", "47 momentos", "12 fotos", "1 primeira vez vendo neve").
4. **Highlights** — um slide por highlight, com mídia + caption + opcionalmente `why_special` em rodapé sutil.
5. **Fechamento** — `closing_paragraph` + assinatura sutil "auExpert".

**Interações:**

- Swipe horizontal entre slides.
- Tap longo em um slide → opções: "remover do memorial", "trocar foto principal", "editar legenda" (por voz).
- Botão "compartilhar" no topo direito → opções:
  - **Vídeo curto** (montagem automática dos slides, ~15s) — gerado por Edge Function ou client-side com `react-native-video-processing` ou similar. Decisão técnica no Discovery.
  - **PDF** — versão estática.
  - **Link público** — token + URL pública (similar ao link de consulta, mas para memorial).
  - **Compartilhar nativo** — share intent com `shareable_summary` (versão sem dados sensíveis).

### 2.4 Tela `app/trips/[id]/insights.tsx`

Lista simples e prática. Layout:

```
┌─────────────────────────────────────┐
│   Aprendizados desta viagem         │
│                                     │
│   🚗 Transporte                     │
│   • Mana ficou estressada no voo    │
│     longo. Considere carro para     │
│     viagens < 8h na próxima.        │
│                                     │
│   🩺 Saúde                          │
│   • Pico precisou de atendimento    │
│     no dia 2. Considere consulta    │
│     pré-viagem na próxima.          │
│                                     │
│   📋 Documentação                   │
│   • Faltou cópia digital do CVI.    │
│     Adicionado ao seu checklist     │
│     padrão para futuras viagens.    │
│                                     │
│   [✓ Aplicar todas as sugestões]    │
│                                     │
└─────────────────────────────────────┘
```

Botão final "aplicar sugestões" salva os `next_trip_checklist_additions` em uma preferência do tutor (ex: `users.metadata.checklist_extras`) que será mesclada nos próximos checklists.

### 2.5 Promoção de momentos para diary_entries

Tela `app/trips/[id]/promote.tsx` (acessível via menu da viagem):

- Lista todos os `trip_moments` da viagem que ainda não foram promovidos.
- Tutor pode:
  - **Selecionar todos** → cria `diary_entry` para cada moment (em batch, com confirmação).
  - **Selecionar individualmente** → idem, mas escolhendo.
  - **Pular** → momentos ficam só no contexto da trip.
- Cada `trip_moment` promovido recebe `promoted_to_diary_entry_id` preenchido.

Promoção é **idempotente** — se tentar promover de novo, já tem o link e não duplica.

## 3. Arquivamento

### 3.1 Auto-archive

Função `auto_archive_old_trips` (definida na seção 1.2) roda diariamente. Trips em `completed` há mais de 30 dias viram `archived`.

### 3.2 Archive manual

Botão "Arquivar viagem" no header da tela de detalhe (visível só em `completed`). Modal de confirmação ("Arquivar não apaga nada — só sai da lista principal"). Tutor confirma → status muda para `archived`, `archived_at = now()`.

### 3.3 UI de viagens arquivadas

Lista principal de viagens (`app/trips/index.tsx`) mostra apenas trips com status != `archived`. Botão sutil no rodapé "Ver viagens arquivadas" → tela separada que lista as antigas. Tap em arquivada abre a mesma tela de detalhe (memorial + insights ainda acessíveis).

## 4. Hooks (PR #4)

```ts
// useTripMemorial.ts
export function useTripMemorial(tripId: string) { ... }                 // read
export function useGenerateTripMemorial() { ... }                       // mutation, chama Edge Function
export function useRegenerateTripMemorial() { ... }                     // opt-in, com confirmação

// useTripInsights.ts
export function useTripInsights(tripId: string) { ... }
export function useGenerateTripInsights() { ... }
export function useApplyInsightsToProfile() { ... }                     // salva em users.metadata

// useArchiveTrip.ts
export function useArchiveTrip() { ... }

// usePromoteMomentsToDiary.ts
export function usePromoteMomentsToDiary() { ... }
```

## 5. i18n (PR #4)

```
travel.memorial.title
travel.memorial.generating                  # "Preparando seu memorial..."
travel.memorial.share.video
travel.memorial.share.pdf
travel.memorial.share.public_link
travel.memorial.share.native
travel.memorial.regenerate
travel.memorial.regenerate.confirm
travel.memorial.slide.cover
travel.memorial.slide.opening
travel.memorial.slide.stats
travel.memorial.slide.highlights
travel.memorial.slide.closing
travel.memorial.stats.days
travel.memorial.stats.moments
travel.memorial.stats.photos
travel.memorial.stats.first_times
travel.memorial.stats.consultations

travel.insights.title
travel.insights.category.transport
travel.insights.category.lodging
travel.insights.category.food
travel.insights.category.health
travel.insights.category.behavior
travel.insights.category.documentation
travel.insights.category.other
travel.insights.severity.info
travel.insights.severity.consider
travel.insights.severity.important
travel.insights.apply_all

travel.archive.button
travel.archive.confirm.title
travel.archive.confirm.message
travel.archive.list.title
travel.archive.list.see_archived

travel.promote.title
travel.promote.select_all
travel.promote.skip
travel.promote.applied
```

## 6. Critérios de aceite (PR #4)

- [ ] Discovery executado.
- [ ] Migration aplica (colunas em `trips` + função de auto-archive + `notify pgrst`).
- [ ] Edge Functions deployadas: `generate-trip-memorial`, `generate-trip-insights`, `archive-old-trips` (se via Edge Function).
- [ ] Memorial gerado para uma viagem teste de pelo menos 3 dias com 10+ moments + 1 consulta vet — output emocionalmente apropriado, sem invenções.
- [ ] Tela de memorial navegável via swipe, mídia carrega, share funciona (PDF + link público + share nativo). Vídeo opcional pode ficar para iteração 2.
- [ ] Insights gerados retornam pelo menos 2-3 itens práticos para a viagem teste. "Aplicar sugestões" salva em `users.metadata.checklist_extras`.
- [ ] Promoção de moments → diary_entries funciona em batch + idempotente.
- [ ] Auto-archive funciona (testar com viagem completed datada de 31 dias atrás).
- [ ] Archive manual funciona com confirmação.
- [ ] Tela de viagens arquivadas separada, acessível mas discreta.
- [ ] pt-BR completo. Outros 4 com placeholder. `MISSING_TRANSLATIONS.md` atualizado.
- [ ] Memorial regenerável (com confirmação que substitui o anterior).
- [ ] Logs de debug mantidos.
- [ ] Sem `<TextInput>` (edição de legenda no memorial é por voz).

---

# Considerações transversais (PRs #2, #3 e #4)

## A. Notificações push

Vão ser necessárias em todas as fases:

- **Fase 2 → 3:** lembrete no dia anterior à viagem ("Tudo pronto para o embarque amanhã?").
- **Fase 3:** lembretes opcionais de registro ("Já alimentou o {pet} hoje?") — desligáveis por padrão para não virar app chato.
- **Fase 3 → 4:** "Sua viagem termina amanhã. Já está com a documentação de retorno?".
- **Fase 4 → 5:** "{Pet} chegou bem em casa? Toque para finalizar a viagem."
- **Fase 5:** "Seu memorial está pronto."

Sistema de notificações pode ser **PR à parte** se ainda não existir infra. Anotar dependência.

## B. Compartilhamento com co-tutor (Anita-style)

Belisario tem co-tutora (Anita). Convém pensar em sharing de viagem entre dois tutores do mesmo pet — não obrigatório nesses PRs, mas estrutura do schema deve permitir extensão futura sem dor.

**Anotação:** `trips.tutor_id` é singular hoje. Para compartilhar futuramente, criar `trip_tutors` (junction) sem quebrar compatibilidade. **Não fazer agora**, mas documentar no PR #4 como follow-up natural.

## C. Edição de viagem após criação

Botão de editar viagem aparece desabilitado no PR #1. Habilitar essa edição é PR #5+ (separado). Cada fase tem suas regras de edição (em `planning` pode-se editar tudo; em `active` só certas coisas; etc.).

## D. Notificações de mudanças regulatórias

Se as regras de um país mudam entre planejamento e viagem (ex: CDC muda regras de cães entrando nos EUA), avisar tutores afetados. Implementação: ao atualizar `travel_rules_generated` ou ao revisar `static_catalog`, comparar checksum com versão usada por cada trip ativa e disparar notificação se mudou. **PR à parte, pós-Fase 5.**

## E. Privacidade do compartilhamento público

Todos os links públicos (consulta vet, memorial) precisam:

- Token aleatório de pelo menos 32 chars (UUID v4 ou similar).
- Expiração default razoável (consulta: 24h; memorial: 7d configurável).
- Endpoint público que **não** retorna dados crus — só HTML renderizado.
- Botão para revogar antes da expiração.
- Nada de dados financeiros ou de identidade do tutor além do necessário.

Adicionar tabela `public_share_tokens` se quiser unificar gestão entre consulta e memorial (opcional, pode ficar tabela-por-feature inicialmente).

---

# Ordem sugerida de implementação

1. **PR #1** (já especificado) — Fases 1 e 2.
2. **PR #2** — Fase 3, **prioridade alta na feature de prontuário + tradutor** (é a feature de maior valor único do app).
3. **PR Notificações Push** — pré-requisito para alguns alertas dos próximos PRs. Pode rodar paralelo ao #2.
4. **PR #3** — Fase 4 (relativamente leve; reusa muito).
5. **PR #4** — Fase 5 (memorial + insights + arquivamento).
6. **PR #5** — Edição de viagem após criação.
7. **PR #6** — Compartilhamento com co-tutor.
8. **PR #7** — Notificações de mudanças regulatórias.

Cada PR deve ser auto-contido, com Discovery próprio, e referenciar este roadmap como contexto.

---

# Restrições e guard rails (válidos para todos os PRs)

Mesmas regras do PR #1, repetidas aqui para evitar drift:

- **Não modificar** código fora do escopo do PR. Se encontrar bug em código existente, anotar em comentário e seguir.
- **Não remover** debug logs existentes.
- **Não otimizar** prematuramente.
- **Não criar abstrações** (HOCs, contextos, providers) novas a menos que estritamente necessário.
- **Não trocar libs** já em uso por equivalentes "melhores".
- **Em caso de dúvida sobre padrão do projeto**, parar e perguntar ao Belisario.
- **Sem `<TextInput>`** em telas de viagem. Voz, tap, ou input nativo do SO (date picker) — nessa ordem.
- **pt-BR completo** em cada PR; outros 4 idiomas com placeholders + `MISSING_TRANSLATIONS.md` atualizado.
- **Disclaimers médicos e jurídicos** precisam revisão humana antes de go-live.
