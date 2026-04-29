# PR #1 — Módulo Viagem (Fases 1 + 2) — rev. 2

> Este documento é a especificação completa para o primeiro PR do módulo de viagem do auExpert. Leia tudo antes de começar a implementar. Use a seção **Discovery** abaixo para entender o projeto antes de gerar qualquer código.
>
> **Revisão 2** adiciona sistema de fallback para países não catalogados (catálogo estático de 5 países + geração on-demand via IA + checklist genérica internacional).

---

## 0. Discovery — faça isso antes de qualquer coisa

Antes de escrever uma linha de código, você (Claude Code) deve:

1. **Ler `package.json`** para confirmar versões exatas do Expo, React Native, React Query, Zustand, Expo Router, e qualquer biblioteca de UI usada (Tamagui, Gluestack, NativeBase, ou componentes próprios). Reporte o que encontrou.
2. **Mapear a estrutura de pastas** do projeto — listar `app/`, `src/`, `components/`, `hooks/`, `services/`, `stores/`, `lib/`, `supabase/` (qualquer que exista). Identificar onde ficam:
   - Componentes reutilizáveis
   - Hooks de React Query
   - Stores Zustand
   - Edge Functions Supabase
   - Migrations SQL
   - Arquivos de tradução i18n
3. **Localizar o `PetCard`** atual — qual arquivo, quais props recebe, como está estilizado. Vamos modificá-lo.
4. **Ler 2 ou 3 hooks de React Query existentes** (ex: `useDiaryEntries`, `usePets`) para imitar o padrão exato — nomenclatura de query keys, tratamento de erro, invalidação de cache.
5. **Ler 1 ou 2 Edge Functions existentes** (ex: `analyze-pet-photo`, `generate-embedding`) para imitar o padrão de prompt, parsing de resposta, error handling, e estrutura de retorno.
6. **Ler a migration SQL mais recente** em `supabase/migrations/` para imitar o padrão de naming, comentários, RLS policies, índices.
7. **Verificar como i18n está configurado** — qual lib (i18n-js, i18next, expo-localization), onde ficam os arquivos de tradução, qual a estrutura de chaves. Os 5 idiomas alvo são: `pt-BR`, `en-US`, `es-MX`, `es-AR`, `pt-PT`.

**Saída do Discovery:** antes de implementar, escreva um resumo curto de 5-10 linhas reportando o que encontrou. Se algo divergir significativamente do que esta spec assume, **pare e pergunte** antes de prosseguir.

---

## 1. Contexto e objetivo

O auExpert é um diário inteligente de pets para o mercado brasileiro/lusófono/hispânico. Vamos adicionar um **módulo de viagem** que permite ao tutor planejar e preparar viagens com seu pet. Este PR cobre as **Fases 1 (Planejamento) e 2 (Preparação)**. Fases 3 (Durante), 4 (Volta), 5 (Conclusão) virão em PRs futuros.

**Princípios que governam a implementação:**

- **Digitação zero**: tutor cria e preenche tudo via voz, foto, scan ou tap. Texto livre é último recurso e sempre opcional.
- **Reaproveitamento**: máximo de reuso de componentes, hooks, padrões e Edge Functions já existentes. Crie novos apenas quando necessário.
- **Debug discipline**: mantenha logs de debug em todo código novo até confirmação visual de funcionamento. Não remova logs especulativamente.
- **Multilíngue**: toda string visível ao usuário deve estar nos 5 arquivos de i18n.
- **PostgREST visibility**: FKs em tabelas com relação ao usuário devem apontar para `public.users`, não `auth.users` (regra estabelecida do projeto).
- **Edge Functions com `verify_jwt: false`** são a regra do projeto para funções que recebem token via header customizado.

---

## 2. Schema Supabase

Crie a migration `YYYYMMDDHHMMSS_create_trips_module.sql` (timestamp atual). Use o estilo das migrations existentes.

### 2.1 Tabela `trips`

```sql
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.users(id) on delete cascade,
  destination_country_code text not null,        -- ISO 3166-1 alpha-2 (ex: 'DE', 'PT')
  destination_city text,                          -- opcional, pode ser preenchido depois
  start_date date not null,
  end_date date not null,
  actual_return_date date,                        -- preenchido na Fase 4
  transport_mode text not null check (transport_mode in ('plane', 'car', 'ship', 'train', 'other')),
  purpose text not null check (purpose in ('tourism', 'relocation', 'competition', 'treatment', 'other')),
  status text not null default 'planning' check (status in ('planning', 'preparing', 'active', 'returning', 'completed', 'archived')),
  checklist_state jsonb not null default '{}'::jsonb,  -- estado dos itens do checklist
  metadata jsonb not null default '{}'::jsonb,         -- futura extensibilidade
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_trips_tutor_id on public.trips(tutor_id);
create index idx_trips_status on public.trips(status);
create index idx_trips_dates on public.trips(start_date, end_date);
```

### 2.2 Tabela `trip_pets` (junction N:N)

```sql
create table public.trip_pets (
  trip_id uuid not null references public.trips(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (trip_id, pet_id)
);

create index idx_trip_pets_pet_id on public.trip_pets(pet_id);
```

### 2.3 Tabela `trip_documents`

```sql
create table public.trip_documents (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete cascade,        -- doc pode ser do pet específico ou geral da viagem
  document_type text not null,                                      -- 'rabies_vaccine', 'health_certificate', 'microchip', 'flight_ticket', etc
  storage_path text not null,                                       -- path no Supabase Storage
  extracted_data jsonb not null default '{}'::jsonb,                -- dados estruturados extraídos pela IA
  issued_date date,
  expires_at date,
  status text not null default 'pending_review' check (status in ('pending_review', 'confirmed', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_trip_documents_trip_id on public.trip_documents(trip_id);
create index idx_trip_documents_pet_id on public.trip_documents(pet_id);
create index idx_trip_documents_type on public.trip_documents(document_type);
```

### 2.4 Alteração em `diary_entries`

```sql
alter table public.diary_entries
  add column if not exists trip_id uuid references public.trips(id) on delete set null;

create index if not exists idx_diary_entries_trip_id on public.diary_entries(trip_id);
```

`on delete set null` em vez de `cascade` — se a viagem for excluída, as entradas do diário continuam mas perdem o vínculo. Tutor não perde o conteúdo registrado.

### 2.5 Tabela `travel_rules_generated` (cache global de regras IA-geradas)

Esta tabela é **global** (não por tutor) — armazena checklists geradas por IA pra países que não estão no catálogo estático. Primeiro tutor que viaja pra um país desconhecido dispara geração; demais reaproveitam o cache.

```sql
create table public.travel_rules_generated (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,                          -- ISO 3166-1 alpha-2
  pet_species text not null check (pet_species in ('dog', 'cat', 'all')),
  origin_country_code text not null default 'BR',      -- regras dependem da origem
  rules_data jsonb not null,                           -- estrutura idêntica a TravelRule do catálogo estático
  confidence_level text not null check (confidence_level in ('high', 'medium', 'low')),
  sources jsonb not null default '[]'::jsonb,          -- array de URLs/citações quando disponível
  model_used text not null,                            -- 'claude-opus-4-7' etc.
  generated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '90 days'),
  community_validations jsonb not null default '[]'::jsonb,  -- pra futuro feedback comunitário
  created_at timestamptz not null default now(),
  unique (country_code, pet_species, origin_country_code)
);

create index idx_travel_rules_country on public.travel_rules_generated(country_code);
create index idx_travel_rules_expires on public.travel_rules_generated(expires_at);
```

**Importante:** essa tabela tem **leitura pública autenticada** (qualquer tutor logado pode ler regras geradas pra reaproveitar cache), mas **escrita apenas via Edge Function service role** (tutor não escreve direto).

### 2.6 RLS Policies

Imitar o padrão existente nas outras tabelas. Tutor só vê suas próprias viagens. Pets devem pertencer ao tutor pra serem associados via `trip_pets`. Documentos só visíveis ao tutor da trip.

```sql
alter table public.trips enable row level security;
alter table public.trip_pets enable row level security;
alter table public.trip_documents enable row level security;
alter table public.travel_rules_generated enable row level security;

-- trips: tutor vê e edita apenas as suas
create policy "trips_owner_all" on public.trips
  for all using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());

-- trip_pets: visível se a trip pertence ao tutor
create policy "trip_pets_via_trip" on public.trip_pets
  for all using (exists (select 1 from public.trips t where t.id = trip_id and t.tutor_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_id and t.tutor_id = auth.uid()));

-- trip_documents: idem
create policy "trip_documents_via_trip" on public.trip_documents
  for all using (exists (select 1 from public.trips t where t.id = trip_id and t.tutor_id = auth.uid()))
  with check (exists (select 1 from public.trips t where t.id = trip_id and t.tutor_id = auth.uid()));

-- travel_rules_generated: leitura por qualquer tutor autenticado (cache compartilhado), escrita só via service role
create policy "travel_rules_read_authenticated" on public.travel_rules_generated
  for select using (auth.role() = 'authenticated');
-- (não criar policy de INSERT/UPDATE/DELETE — apenas service_role escreve via Edge Function)
```

### 2.7 Trigger de `updated_at`

Imitar trigger existente no projeto se houver. Caso contrário:

```sql
create trigger trips_updated_at before update on public.trips
  for each row execute function public.handle_updated_at();

create trigger trip_documents_updated_at before update on public.trip_documents
  for each row execute function public.handle_updated_at();
```

(Se a função `handle_updated_at` não existir no projeto, criar uma idêntica ao padrão Supabase.)

### 2.8 Notificação PostgREST

Ao final da migration:

```sql
notify pgrst, 'reload schema';
```

(Regra do projeto após mudanças de FK.)

---

## 3. Types TypeScript

Após aplicar a migration, regenerar os types do Supabase no projeto (provavelmente há um script `npm run gen:types` ou similar — descubra no Discovery). Os types `Trip`, `TripPet`, `TripDocument` devem ser exportados pelo arquivo de types do Supabase.

Adicione em `src/types/trip.ts` (ou onde for o padrão do projeto):

```ts
export type TransportMode = 'plane' | 'car' | 'ship' | 'train' | 'other';
export type TripPurpose = 'tourism' | 'relocation' | 'competition' | 'treatment' | 'other';
export type TripStatus = 'planning' | 'preparing' | 'active' | 'returning' | 'completed' | 'archived';

export type DocumentType =
  | 'rabies_vaccine'
  | 'health_certificate'
  | 'microchip'
  | 'eu_pet_passport'
  | 'flight_ticket'
  | 'hotel_reservation'
  | 'prescription'
  | 'lab_result'
  | 'other';

export type DocumentStatus = 'pending_review' | 'confirmed' | 'rejected';

// Schema do checklist_state (jsonb na tabela)
export type ChecklistItemState = {
  status: 'pending' | 'in_progress' | 'completed' | 'not_applicable';
  document_id?: string;
  notes?: string;
  completed_at?: string;
};

export type ChecklistState = Record<string, ChecklistItemState>;

// Origem das regras: estática (catálogo) ou IA (geradas + cache)
export type RulesSource = 'static_catalog' | 'ai_generated' | 'generic_fallback';

export type GeneratedRulesConfidence = 'high' | 'medium' | 'low';

export type GeneratedRulesCitation = {
  title: string;
  url?: string;
  authority?: string;  // 'USDA APHIS', 'Embaixada do Brasil em X', 'IATA'
};
```

---

## 4. Catálogo de regras + estratégia de fallback

O sistema tem **três fontes de regras**, em ordem de prioridade:

1. **Catálogo estático** (`static_catalog`) — **25 países hardcoded** com regras curadas. Fonte mais confiável.
2. **IA gerada com cache** (`ai_generated`) — qualquer país fora do catálogo dispara geração via Edge Function que salva em `travel_rules_generated`. Próximas viagens reaproveitam cache se ainda válido (< 90 dias).
3. **Checklist genérica internacional** (`generic_fallback`) — usado se a Edge Function falhar OU enquanto a geração está em andamento. Lista de itens universais que valem pra quase qualquer destino.

### 4.1 Catálogo estático — 25 países

**Estrutura de pastas:**

```
src/data/travelRules/
├── index.ts                  # exporta TRAVEL_RULES e tipos
├── types.ts                  # TravelRule, TravelRequirement
├── shared/
│   ├── euCommon.ts           # requirements compartilhados pela UE
│   ├── mercosulCommon.ts     # requirements compartilhados Mercosul
│   ├── auOceaniaCommon.ts    # requirements pra Austrália/NZ
│   └── strictRabies.ts       # requirements pra países com regras antirrábicas estritas
├── countries/
│   ├── BR.ts
│   ├── AR.ts
│   ├── ... (25 arquivos, um por país)
├── genericInternational.ts   # fallback universal
└── resolver.ts               # função de resolução
```

**Lista completa dos 25 países** (agrupados por região):

| Grupo | Países |
|-------|--------|
| Brasil (doméstico) | `BR` |
| América do Sul | `AR`, `UY`, `PY`, `CL`, `CO` |
| União Europeia | `PT`, `ES`, `FR`, `IT`, `DE`, `NL`, `BE`, `AT`, `IE`, `GR`, `SE` |
| Reino Unido | `GB` |
| América do Norte | `US`, `CA`, `MX` |
| Ásia/Oceania | `JP`, `AU`, `NZ` |
| Outros | `AE` (Emirados), `CH` (Suíça) |

**Total: 25 países cobrindo ~95% dos destinos do tutor brasileiro de elite.**

### 4.2 Tipos

```ts
export type TravelRule = {
  countryCode: string;          // 'DE'
  countryNameKey: string;       // chave i18n: 'travel.country.DE'
  flag: string;                  // emoji 🇩🇪
  region: 'BR' | 'SA' | 'EU' | 'GB' | 'NA' | 'AS_OC' | 'OTHER';
  requirements: TravelRequirement[];
  source: RulesSource;           // 'static_catalog' para os hardcoded
  lastReviewed: string;          // ISO date — '2026-04'
  generalNotesKey?: string;      // chave i18n opcional pra notas adicionais
};

export type TravelRequirement = {
  id: string;                    // 'eu_rabies_vaccine'
  documentType: DocumentType;
  titleKey: string;              // 'travel.req.eu_rabies_vaccine.title'
  descriptionKey: string;        // 'travel.req.eu_rabies_vaccine.description'
  daysBeforeTravel: {
    min: number;
    max: number;
  };
  appliesTo: ('dog' | 'cat' | 'all')[];
  mandatory: boolean;
  category: 'vaccination' | 'documentation' | 'identification' | 'transport' | 'preparation' | 'testing';
};
```

### 4.3 Requirements compartilhados

**`shared/euCommon.ts`** — requirements da UE compartilhados pelos 11 países UE:

```ts
export const EU_COMMON_REQUIREMENTS: TravelRequirement[] = [
  {
    id: 'eu_microchip_iso',
    documentType: 'microchip',
    titleKey: 'travel.req.eu_microchip_iso.title',
    descriptionKey: 'travel.req.eu_microchip_iso.description',
    daysBeforeTravel: { min: 0, max: 99999 },  // só precisa estar implantado, não tem janela
    appliesTo: ['all'],
    mandatory: true,
    category: 'identification',
  },
  {
    id: 'eu_rabies_vaccine',
    documentType: 'rabies_vaccine',
    titleKey: 'travel.req.eu_rabies_vaccine.title',
    descriptionKey: 'travel.req.eu_rabies_vaccine.description',
    daysBeforeTravel: { min: 21, max: 365 },  // entre 21 dias e 1 ano antes
    appliesTo: ['all'],
    mandatory: true,
    category: 'vaccination',
  },
  {
    id: 'eu_health_certificate',
    documentType: 'health_certificate',
    titleKey: 'travel.req.eu_health_certificate.title',
    descriptionKey: 'travel.req.eu_health_certificate.description',
    daysBeforeTravel: { min: 0, max: 10 },  // até 10 dias antes
    appliesTo: ['all'],
    mandatory: true,
    category: 'documentation',
  },
  {
    id: 'br_cvi_export',
    documentType: 'health_certificate',
    titleKey: 'travel.req.br_cvi_export.title',
    descriptionKey: 'travel.req.br_cvi_export.description',
    daysBeforeTravel: { min: 0, max: 60 },  // CVI MAPA pra exportação
    appliesTo: ['all'],
    mandatory: true,
    category: 'documentation',
  },
];

// Requirement adicional pra Echinococcus (cães entrando em IE, FI, MT, NO)
export const EU_ECHINOCOCCUS: TravelRequirement = {
  id: 'eu_echinococcus_treatment',
  documentType: 'prescription',
  titleKey: 'travel.req.eu_echinococcus_treatment.title',
  descriptionKey: 'travel.req.eu_echinococcus_treatment.description',
  daysBeforeTravel: { min: 1, max: 5 },  // entre 24h e 120h antes
  appliesTo: ['dog'],
  mandatory: true,
  category: 'preparation',
};
```

**`shared/mercosulCommon.ts`** — pra Argentina, Uruguai, Paraguai, Chile (Chile não é Mercosul mas tem regras parecidas):

```ts
export const MERCOSUL_COMMON_REQUIREMENTS: TravelRequirement[] = [
  {
    id: 'mercosul_cvi',
    documentType: 'health_certificate',
    titleKey: 'travel.req.mercosul_cvi.title',
    descriptionKey: 'travel.req.mercosul_cvi.description',
    daysBeforeTravel: { min: 0, max: 60 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'documentation',
  },
  {
    id: 'mercosul_rabies_vaccine',
    documentType: 'rabies_vaccine',
    titleKey: 'travel.req.mercosul_rabies_vaccine.title',
    descriptionKey: 'travel.req.mercosul_rabies_vaccine.description',
    daysBeforeTravel: { min: 30, max: 365 },
    appliesTo: ['all'],
    mandatory: true,
    category: 'vaccination',
  },
  {
    id: 'mercosul_microchip',
    documentType: 'microchip',
    titleKey: 'travel.req.mercosul_microchip.title',
    descriptionKey: 'travel.req.mercosul_microchip.description',
    daysBeforeTravel: { min: 0, max: 99999 },
    appliesTo: ['all'],
    mandatory: false,  // recomendado mas nem sempre obrigatório
    category: 'identification',
  },
];
```

**`shared/auOceaniaCommon.ts`** — pra Austrália e Nova Zelândia (regras estritas, quarentena obrigatória, exames adicionais). Modele com base em conhecimento geral, marque cada item como `mandatory: true`, e adicione comentário explícito:

```ts
// ATENÇÃO: Austrália e Nova Zelândia têm das regras MAIS RIGOROSAS do mundo
// pra importação de pets. Inclui quarentena, exames de doenças específicas,
// pré-aprovação por permit. PROCESSO DE 6+ MESES.
// Esta lista é orientativa — tutor DEVE consultar autoridade oficial:
// AU: https://www.agriculture.gov.au/biosecurity-trade/cats-dogs
// NZ: https://www.mpi.govt.nz/import/live-animals/cats-and-dogs/
```

Inclua: pré-aprovação (Import Permit), microchip ISO, antirrábica + teste de titulação RNATT (mín 180 dias antes), exames específicos (leishmaniose, brucelose canina pra cães, etc.), tratamento parasitário, atestado oficial, quarentena no destino.

**`shared/strictRabies.ts`** — pra Japão (regras antirrábicas estritas com janela de 180 dias):

```ts
// Japão exige PROTOCOLO DE 180+ DIAS após teste antirrábico positivo (RNATT)
// antes do embarque. Processo conhecido por ser um dos mais demorados do mundo.
```

### 4.4 Definições por país

Cada arquivo em `countries/` tem o formato:

```ts
// countries/DE.ts
import { EU_COMMON_REQUIREMENTS } from '../shared/euCommon';

export const DE: TravelRule = {
  countryCode: 'DE',
  countryNameKey: 'travel.country.DE',
  flag: '🇩🇪',
  region: 'EU',
  requirements: EU_COMMON_REQUIREMENTS,
  source: 'static_catalog',
  lastReviewed: '2026-04',
};
```

```ts
// countries/IE.ts (Irlanda — UE + Echinococcus pra cães)
import { EU_COMMON_REQUIREMENTS, EU_ECHINOCOCCUS } from '../shared/euCommon';

export const IE: TravelRule = {
  countryCode: 'IE',
  countryNameKey: 'travel.country.IE',
  flag: '🇮🇪',
  region: 'EU',
  requirements: [...EU_COMMON_REQUIREMENTS, EU_ECHINOCOCCUS],
  source: 'static_catalog',
  lastReviewed: '2026-04',
};
```

```ts
// countries/AR.ts (Argentina — Mercosul base)
import { MERCOSUL_COMMON_REQUIREMENTS } from '../shared/mercosulCommon';

export const AR: TravelRule = {
  countryCode: 'AR',
  countryNameKey: 'travel.country.AR',
  flag: '🇦🇷',
  region: 'SA',
  requirements: MERCOSUL_COMMON_REQUIREMENTS,
  source: 'static_catalog',
  lastReviewed: '2026-04',
};
```

**Observações específicas por país:**

- **`BR`**: domestic-only — vacinação em dia + atestado de saúde pra voos domésticos. NÃO tem CVI (CVI é pra exportação).
- **`UY`, `PY`, `CL`, `CO`**: Mercosul base. Chile tem requisito adicional de tratamento antiparasitário interno/externo.
- **UE (`PT`, `ES`, `FR`, `IT`, `DE`, `NL`, `BE`, `AT`, `GR`, `SE`)**: usar `EU_COMMON_REQUIREMENTS` direto.
- **`IE`**: UE + Echinococcus pra cães.
- **`GB`** (Reino Unido pós-Brexit): regras próprias, similares à UE mas com Animal Health Certificate (AHC) em vez de EU Pet Passport. EU Pet Passport não é mais aceito pra entrada no Reino Unido.
- **`US`**: USDA APHIS Health Certificate (10 dias antes), antirrábica obrigatória pra cães vindos de países considerados de alto risco — Brasil **é considerado país de alto risco pelo CDC** desde 2021, exige protocolos adicionais (titulação + permit em alguns casos).
- **`CA`**: CFIA. Mais simples que EUA — vacinação antirrábica + atestado.
- **`MX`**: SENASICA. Atestado de saúde + vacinação básica.
- **`JP`**: protocolo de 180+ dias após teste RNATT positivo. Inclui notificação prévia (40 dias antes), microchip, vacinação antirrábica em duas doses, teste de titulação. Use `shared/strictRabies.ts`.
- **`AU`, `NZ`**: usar `shared/auOceaniaCommon.ts`. Processo de 6+ meses, quarentena obrigatória.
- **`AE`** (Emirados): import permit, antirrábica, microchip, atestado.
- **`CH`** (Suíça, não-UE mas EFTA): regras quase idênticas à UE — pode usar `EU_COMMON_REQUIREMENTS` com nota.

### 4.5 Estratégia de tradução — apenas pt-BR neste PR

**Toda string visível ao usuário** que vier do catálogo (titleKey, descriptionKey, countryNameKey) **deve estar traduzida em pt-BR neste PR**. Os outros 4 idiomas (`en-US`, `es-MX`, `es-AR`, `pt-PT`) ficam pra um PR de i18n separado.

**Implementação prática:**

1. Todas as chaves i18n aparecem no arquivo `locales/pt-BR.json` (ou padrão do projeto) com tradução completa em português brasileiro.
2. Nos outros 4 arquivos de locale (`en-US.json`, `es-MX.json`, `es-AR.json`, `pt-PT.json`), as chaves novas são adicionadas com **placeholder** seguindo o padrão `[TODO-{LOCALE}] {texto em pt-BR}`. Exemplo em `en-US.json`:
   ```json
   "travel.req.eu_rabies_vaccine.title": "[TODO-EN] Vacina antirrábica europeia"
   ```
3. Criar `MISSING_TRANSLATIONS.md` na raiz do projeto listando todas as chaves que precisam tradução, agrupadas por idioma e arquivo. Inclui contagem total de strings pendentes.

Isso garante que:
- O app não quebra em outros idiomas (chave existe, mostra placeholder visível)
- É fácil identificar o que falta traduzir
- O PR de i18n posterior é puramente tradução, sem mexer em código

**Estimativa:** ~30 países × 5-8 requirements + nomes de países = **~250 chaves novas**. Em pt-BR, são ~250 strings traduzidas com qualidade.

### 4.6 Catálogo principal — `index.ts`

```ts
// src/data/travelRules/index.ts
// Regras revisadas em abril/2026.
// IMPORTANTE: validar com fontes oficiais antes do lançamento e revisar a cada 6 meses.
// Tutor sempre deve confirmar com vet, embaixada/consulado e companhia aérea.

import { BR } from './countries/BR';
import { AR } from './countries/AR';
// ... 25 imports

export const TRAVEL_RULES: Record<string, TravelRule> = {
  BR, AR, UY, PY, CL, CO,
  PT, ES, FR, IT, DE, NL, BE, AT, IE, GR, SE,
  GB,
  US, CA, MX,
  JP, AU, NZ,
  AE, CH,
};

export function isInStaticCatalog(countryCode: string): boolean {
  return countryCode in TRAVEL_RULES;
}

export function getStaticRule(countryCode: string): TravelRule | undefined {
  return TRAVEL_RULES[countryCode];
}
```

### 4.7 Checklist genérica internacional (`generic_fallback`)

Crie `src/data/travelRules/genericInternational.ts`. É um `TravelRule` com `countryCode: '__GENERIC__'` e itens que valem pra quase todo destino internacional saindo do Brasil:

- Microchip ISO 11784/11785 (universal)
- Vacina antirrábica em dia (universal — quase todos os países exigem)
- Atestado de saúde veterinária recente (entre 7 e 30 dias antes da viagem)
- CVI (Certificado Veterinário Internacional) emitido pelo MAPA — exigido pra qualquer saída internacional do Brasil
- Vacinação V8/V10 (cães) ou V4/V5 (gatos) em dia
- Vermífugo em dia
- Documentação de transporte (bilhete pet aéreo, declaração de companhia)
- Caixa de transporte adequada (IATA standards pra voo)

Cada item tem `daysBeforeTravel` com janelas conservadoras (ex: atestado de saúde min 7 max 30 dias).

### 4.8 Função de resolução de regras

Crie `src/data/travelRules/resolver.ts` com a função:

```ts
export type ResolvedRules = {
  rule: TravelRule;
  source: RulesSource;
  generatedRulesId?: string;     // se source = 'ai_generated', id da row em travel_rules_generated
  warnings: string[];            // i18n keys pra mostrar ao usuário
};

export async function resolveTravelRules(
  countryCode: string,
  petSpecies: 'dog' | 'cat',
  options?: { skipAIGeneration?: boolean }
): Promise<ResolvedRules>
```

**Lógica:**

1. Se `countryCode` ∈ catálogo estático → retorna direto, `source: 'static_catalog'`, sem warnings.
2. Senão → consulta `travel_rules_generated` no Supabase via cache do React Query (key: `['travel-rules', countryCode, petSpecies]`):
   - Se cache existe e `expires_at > now()` → retorna, `source: 'ai_generated'`, warning sobre origem IA.
   - Se cache não existe ou expirou:
     - Se `options.skipAIGeneration` → retorna `generic_fallback` imediatamente.
     - Senão → dispara `generate-travel-rules` Edge Function (fire-and-forget, retorna `generic_fallback` enquanto gera).
3. Quando a geração termina, invalida a query `['travel-rules', countryCode, petSpecies]` e UI atualiza automaticamente (push notification opcional).

### 4.9 Disclaimer obrigatório

Toda tela que renderizar checklist com `source !== 'static_catalog'` **deve mostrar banner de disclaimer** com cor de atenção (amarelo/laranja, não vermelho) e ícone informativo:

- `ai_generated`: "Esta lista foi gerada por IA com base em fontes públicas. Confirme com seu veterinário, embaixada/consulado e companhia aérea antes da viagem."
- `generic_fallback`: "Regras específicas pra {país} ainda não estão disponíveis. Esta é uma lista genérica pra viagens internacionais. **Consulte um veterinário e a embaixada/consulado do destino antes de viajar.**"

Banner não pode ser fechado/dispensado nas telas de planejamento e checklist.

**Mesmo no catálogo estático**, mostrar banner mais sutil de revisão:

- "Última revisão: abril/2026. Regras podem mudar — confirme com vet e autoridade do destino antes de viajar."

Esse banner é pequeno, no rodapé da checklist, sem cor de alerta.

### 4.10 Validação obrigatória antes do lançamento

Adicione um arquivo `src/data/travelRules/VALIDATION_REQUIRED.md` com aviso explícito:

```markdown
# Validação obrigatória das regras de viagem antes do lançamento

Este catálogo foi gerado em abril/2026 com base em conhecimento geral.
Antes do release público, cada um dos 25 países DEVE ser validado contra:

1. Site oficial da autoridade sanitária do destino
2. Embaixada/consulado brasileiro no destino
3. Site da companhia aérea (regras IATA pra animais)
4. Vet especialista em viagens internacionais

Países críticos que mais mudam regras (revisar primeiro):
- US (CDC mudou regras em 2024 pra cães)
- GB (pós-Brexit, regras mudaram em 2021 e podem mudar novamente)
- AU, NZ, JP (regras estritas, processos longos)

Lista de checagem por país: [criar Trello/Linear board com 25 cards]

Responsável: [definir]
Prazo: antes do go-live
```

---

## 5. Hooks React Query

Em `src/hooks/` (ou padrão do projeto), criar:

### `useTrips.ts`

```ts
// Lista todas as viagens do tutor logado, com filtro opcional por status
export function useTrips(options?: { status?: TripStatus[] }) { ... }

// Busca uma viagem específica por id, com pets e documentos relacionados
export function useTrip(tripId: string) { ... }

// Cria uma nova viagem
export function useCreateTrip() { ... }

// Atualiza uma viagem (status, checklist_state, etc.)
export function useUpdateTrip() { ... }

// Remove uma viagem (soft? hard? — usar hard delete neste PR, RLS protege)
export function useDeleteTrip() { ... }
```

Padrão das query keys: imitar o existente no projeto. Sugestão: `['trips', tutorId]`, `['trip', tripId]`.

Invalidação: ao criar/atualizar trip, invalidar `['trips']` e `['trip', id]`. Imitar o padrão do `useDiaryEntries` que vocês já têm.

### `useTripDocuments.ts`

```ts
export function useTripDocuments(tripId: string) { ... }
export function useCreateTripDocument() { ... }
export function useUpdateTripDocument() { ... }
export function useDeleteTripDocument() { ... }
```

### `useTravelRules.ts`

Hook que resolve as regras de um país (catálogo estático ou IA gerada com cache):

```ts
export function useTravelRules(
  countryCode: string,
  petSpecies: 'dog' | 'cat'
): {
  data: ResolvedRules | undefined;
  isLoading: boolean;
  isGenerating: boolean;   // true enquanto IA está gerando regras pro país
  error: Error | null;
}
```

Internamente:
- Se `countryCode` está no catálogo estático → retorna síncrono.
- Senão → `useQuery` com key `['travel-rules', countryCode, petSpecies]` que:
  1. Busca em `travel_rules_generated` no Supabase
  2. Se não encontrar ou expirou, dispara mutation `generate-travel-rules` (não bloqueia — retorna `generic_fallback` enquanto isso)
  3. Quando geração termina (subscription Realtime ou polling), invalida e re-busca
- Cache local agressivo: `staleTime: 1 hora`, `cacheTime: 24 horas`.

### Select strategy

Seguir a regra do projeto — **`select('*')`** simples. Se precisar de joins, usar a sintaxe explícita de FK constraint name (`trip_pets!trip_pets_pet_id_fkey(...)`) — **não confiar em joins implícitos**.

---

## 6. Edge Function: `extract-travel-document`

Crie em `supabase/functions/extract-travel-document/index.ts`. Imitar o padrão de `analyze-pet-photo`:

- `verify_jwt: false` no `config.toml` ou inline
- Recebe via POST: `{ image_base64: string, document_type_hint?: DocumentType, target_locale?: string }`
- Chama Claude (Sonnet 4.6 por padrão; Opus 4.7 se hint = `health_certificate` ou `rabies_vaccine` por serem críticos)
- Retorna `{ extracted_data: object, confidence: number, document_type_detected: DocumentType, suggested_status: 'pending_review' | 'confirmed' }`

**Schema do `extracted_data` por tipo:**

```ts
// rabies_vaccine
{ pet_name?: string, vaccine_brand?: string, batch?: string, applied_date?: string, expires_at?: string, vet_name?: string, vet_crmv?: string }

// health_certificate
{ pet_name?: string, microchip_number?: string, vet_name?: string, issued_date?: string, expires_at?: string, destination_country?: string }

// microchip
{ chip_number: string, implant_date?: string }

// flight_ticket
{ airline?: string, flight_number?: string, departure_date?: string, route?: string, pet_compartment?: 'cabin' | 'cargo' }
```

**Prompt sugerido (Sonnet 4.6):**

```
Você é um assistente especializado em extrair informações estruturadas de documentos veterinários e de viagem com pets.

Tarefa: extrair os campos do documento mostrado na imagem em formato JSON.

Tipo de documento esperado: {document_type_hint || 'detectar automaticamente'}.
Idioma da resposta: {target_locale || 'pt-BR'}.

Regras:
- Retorne APENAS JSON válido, sem markdown, sem comentários.
- Use null para campos não encontrados, não invente.
- Datas em formato ISO YYYY-MM-DD.
- Para vacinas, prefira nome genérico (DCI/INN) ao nome comercial quando óbvio.
- Estime "confidence" entre 0 e 1 baseado na nitidez e completude dos dados visíveis.

Schema esperado:
{ "document_type_detected": "rabies_vaccine" | "health_certificate" | ..., "extracted_data": {...}, "confidence": 0.0-1.0 }
```

**Logs de debug:** logar request body (sem image_base64), tempo de resposta do Claude, e response final. Usar prefixo `[extract-travel-document]` em todos os logs.

---

## 7. Edge Function: `parse-travel-intent`

Crie em `supabase/functions/parse-travel-intent/index.ts`. Esta função recebe a transcrição de voz da Fase 1 (Planejamento) e extrai a intenção estruturada de viagem.

- Recebe via POST: `{ transcript: string, locale: string, current_step: 'destination' | 'dates' | 'transport' | 'purpose' | 'free_form' }`
- Chama Sonnet 4.6
- Retorna campos extraídos do transcript

**Exemplo:**

Input transcript: "Vou pra Berlim na Alemanha do dia 15 de julho até 30 de julho de avião"
Output:
```json
{
  "destination_country_code": "DE",
  "destination_country_name": "Alemanha",
  "destination_city": "Berlim",
  "start_date": "2026-07-15",
  "end_date": "2026-07-30",
  "transport_mode": "plane",
  "confidence": 0.95
}
```

**Prompt:** explicar contexto (auExpert, módulo de viagem com pets), retornar JSON puro, considerar data atual ({{current_date}}) para resolver datas relativas ("daqui a 3 meses").

---

## 8. Edge Function: `generate-travel-rules`

Crie em `supabase/functions/generate-travel-rules/index.ts`. Esta função gera dinamicamente regras de viagem para países que não estão no catálogo estático.

**Configuração:** `verify_jwt: false`. Função usa service_role key internamente pra escrever em `travel_rules_generated`.

**Recebe via POST:**
```ts
{
  country_code: string;          // 'TH'
  pet_species: 'dog' | 'cat';
  origin_country_code?: string;  // default 'BR'
  target_locale?: string;         // default 'pt-BR'
}
```

**Fluxo:**

1. **Verifica cache primeiro**: SELECT em `travel_rules_generated` por `(country_code, pet_species, origin_country_code)`. Se existe e `expires_at > now()`, retorna direto. Não chama IA.

2. **Se cache miss ou expirado**: chama Claude Opus 4.7 (qualidade > custo neste caso) com prompt especializado.

3. **Salva resultado** em `travel_rules_generated` com `expires_at = now() + 90 days`.

4. **Retorna**:
```ts
{
  success: boolean;
  source: 'cache_hit' | 'newly_generated' | 'failed';
  rule: TravelRule;              // estrutura idêntica ao catálogo estático
  confidence_level: 'high' | 'medium' | 'low';
  sources: GeneratedRulesCitation[];
  generated_at: string;
}
```

**Prompt sugerido (Opus 4.7):**

```
Você é um especialista em regulamentações internacionais de transporte de animais de estimação. Sua tarefa é gerar uma checklist estruturada de requisitos para viajar com um pet de {origin_country} para {country_code}.

Espécie do pet: {pet_species}
Idioma de resposta: {target_locale}

Considere as fontes oficiais que você conhece:
- Autoridades sanitárias do país de destino (Ministério da Agricultura, USDA, etc.)
- Embaixada/Consulado de {origin_country} em {country_code}
- Regulamentação IATA pra transporte aéreo de animais
- Regras da União Europeia (se aplicável)

Retorne APENAS JSON válido com esta estrutura:

{
  "country_name": { "pt-BR": "...", "en-US": "...", "es-MX": "...", "es-AR": "...", "pt-PT": "..." },
  "flag_emoji": "🇹🇭",
  "confidence_level": "high" | "medium" | "low",
  "requirements": [
    {
      "id": "rabies_vaccine",
      "document_type": "rabies_vaccine",
      "title": { "pt-BR": "...", ... },
      "description": { "pt-BR": "...", ... },
      "days_before_travel_min": 21,
      "days_before_travel_max": 365,
      "applies_to": ["dog", "cat"],
      "mandatory": true,
      "category": "vaccination"
    }
  ],
  "sources": [
    { "title": "USDA APHIS Pet Travel", "url": "https://...", "authority": "USDA APHIS" }
  ],
  "general_notes": { "pt-BR": "...", ... }
}

REGRAS CRÍTICAS:
- "confidence_level": "high" só se você tem alta certeza sobre TODOS os requisitos. "medium" se há dúvidas sobre detalhes (janelas de tempo, dosagens). "low" se você está extrapolando de regras gerais regionais.
- Se não souber sobre o país, prefira "low" e seja generoso com requisitos (melhor incluir algo opcional que omitir algo obrigatório).
- Para países da União Europeia, sempre incluir EU Pet Passport / EU Health Certificate.
- Para qualquer destino internacional saindo do Brasil, sempre incluir CVI emitido pelo MAPA.
- Para voos, sempre incluir requisito IATA de caixa de transporte adequada.
- Datas em "days_before_travel" são CONSERVADORAS — janelas mais apertadas que o mínimo legal.
- Retorne entre 5 e 12 requirements. Menos é incompleto, mais é overwhelming.
- NÃO invente fontes. Se não tem certeza da URL, omita o campo "url" mas mantenha "title" e "authority".
```

**Tratamento de falha:**

Se Claude retornar JSON malformado ou erro de API:
- Logar erro com `[generate-travel-rules]` prefix
- Retornar `{ success: false, source: 'failed', ... }`
- Cliente deve fallback automático pra `generic_fallback`

**Logs de debug:** request body completo, tempo de resposta do Claude, status de cache (hit/miss), JSON gerado, validação do schema antes de salvar. Usar prefixo `[generate-travel-rules]` em todos os logs.

**Custo estimado:** ~3000 input tokens + ~2000 output tokens × Opus 4.7 = ~US$ 0.06 por geração nova. Cache de 90 dias amortiza muito — primeiro tutor que vai pra Tailândia paga R$ 0,30; próximos 100 tutores reaproveitam de graça.

---

## 9. Componentes UI

### 8.1 Modificação no `PetCard`

**Localizar o arquivo no Discovery.** Adicionar:

- Ícone de avião (✈️ ou ícone de biblioteca como `lucide-react-native` se usado, `@expo/vector-icons` MaterialCommunityIcons `airplane` se for o padrão) no canto superior direito do card.
- Posição: absolute top-right com padding.
- Tap no ícone navega para `/trips/new?petId={pet.id}` (ou padrão de routing do projeto via Expo Router).
- Acessibilidade: `accessibilityLabel` traduzido ("Iniciar nova viagem com {petName}").
- Se houver trip ativa pra este pet (status `active`), mostrar badge sutil sobre o ícone.

**Não quebrar nada do PetCard atual.** Diff mínimo. Se o card estiver muito acoplado, criar um wrapper.

### 8.2 Tela `app/trips/new.tsx` (ou padrão do projeto)

Tela de criação por **fluxo conversacional voz-first**.

**Estrutura:**

- Header com botão de fechar (X) e título "Nova viagem"
- Área central grande com:
  - Avatar/foto do pet selecionado (ou seletor de pets se múltiplos)
  - Pergunta atual em texto grande
  - Botão de microfone grande e centralizado (estado: idle / listening / processing)
  - Resposta transcrita aparece em cima do botão conforme STT processa
  - Botão "Próxima pergunta" só aparece quando há resposta confirmada
- Footer com indicador de progresso (4 passos: destino, datas, transporte, motivo)

**Steps:**

1. **Destino**: pergunta por voz. Resposta → chama `parse-travel-intent` com `current_step: 'destination'`. Resultado mostra país com bandeira em card grande. Se não reconhecido (confidence < 0.7), fallback para grid de bandeiras dos 5 países do catálogo.
2. **Datas**: pergunta "Quando vai e volta?". Mesma mecânica. Fallback: 2 date pickers nativos.
3. **Transporte**: cards visuais (avião, carro, navio, trem, outro) — tap direto, voz é alternativa.
4. **Motivo**: cards visuais (turismo, mudança, competição, tratamento, outro) — idem.

**Após o último step:** tela de confirmação com resumo. Botão "Criar viagem" → `useCreateTrip` → navega para a tela de detalhe da viagem.

**Digitação zero é regra inviolável.** Não há nenhum `<TextInput>` na tela. Cada step tem 3 caminhos: voz (primário), tap em card (alternativo), input nativo do SO (date picker, último recurso).

### 8.3 Tela `app/trips/[id].tsx` (detalhe e checklist)

**Header:**
- País + bandeira + datas + status badge
- Botão de editar (futuro PR — desabilitado neste, mostrar mas com opacidade)

**Body:**
- Tabs ou seções:
  - **Visão geral**: contagem regressiva de dias, próximos itens da checklist, cards de pets na viagem
  - **Checklist**: lista de requisitos do país (do catálogo). Cada item tem:
    - Ícone do tipo
    - Título e descrição (i18n)
    - Status visual (pendente / em andamento / concluído / não aplicável)
    - Janela temporal ("entre 21 e 365 dias antes da viagem")
    - Botão "Anexar documento" → abre câmera direto

**Anexar documento — fluxo digitação zero:**

1. Tap em "Anexar documento" no item da checklist
2. Câmera abre via `expo-image-picker` (ou padrão do projeto)
3. Foto tirada → preview → tap "Usar"
4. Upload pra Supabase Storage (bucket `trip-documents/{trip_id}/`)
5. Chama `extract-travel-document` com `document_type_hint` baseado no item da checklist
6. Mostra dados extraídos em card de revisão
7. Tutor toca "Confirmar" (status → `confirmed`) ou "Refazer" (volta ao step 2)
8. Item da checklist atualiza para `completed`, `document_id` salvo no `checklist_state`

**Validação automática** (lógica client-side ou em hook):

Para cada item com janela temporal: se documento confirmado tem `issued_date` fora da janela, mostrar warning visual. Não bloquear, apenas alertar.

### 8.4 Componente `VoiceInputButton`

Componente reutilizável que encapsula:
- Permissão de microfone (com tratamento de erro)
- Gravação via `expo-av` ou `expo-audio`
- Upload pra Supabase Storage
- Chamada à Edge Function de STT existente (descobrir no Discovery — pode ser `transcribe` ou similar)
- Estados visuais: idle, recording, processing, error

**Props mínimas:**
```ts
{
  onTranscript: (text: string) => void;
  onError?: (error: Error) => void;
  maxDurationSeconds?: number; // default 30
  size?: 'small' | 'large';
}
```

Se o projeto já tiver algo similar, **reutilizar e estender ao invés de criar do zero**.

---

## 10. i18n — chaves de tradução

**Estratégia: pt-BR completo agora, outros 4 idiomas com placeholders pra PR de tradução posterior.**

### 10.1 Chaves a criar

**No `locales/pt-BR.json`** (ou padrão do projeto): traduzir tudo abaixo com qualidade nativa.

**Nos `locales/en-US.json`, `es-MX.json`, `es-AR.json`, `pt-PT.json`**: cada chave recebe placeholder `[TODO-{LOCALE}] {valor pt-BR}`. Exemplo:

```json
// pt-BR.json
{ "travel.req.eu_rabies_vaccine.title": "Vacina antirrábica" }

// en-US.json
{ "travel.req.eu_rabies_vaccine.title": "[TODO-EN] Vacina antirrábica" }

// es-MX.json
{ "travel.req.eu_rabies_vaccine.title": "[TODO-ES-MX] Vacina antirrábica" }
```

Isso garante que o app não quebra em outros idiomas, mostra placeholder visível, e é fácil identificar o que falta.

### 10.2 Estrutura completa de chaves

```
# Telas e fluxo de criação
travel.title
travel.new.title
travel.new.step.destination.question
travel.new.step.dates.question
travel.new.step.transport.question
travel.new.step.purpose.question
travel.new.confirm.title
travel.new.confirm.create

# Modos de transporte
travel.transport.plane
travel.transport.car
travel.transport.ship
travel.transport.train
travel.transport.other

# Motivos de viagem
travel.purpose.tourism
travel.purpose.relocation
travel.purpose.competition
travel.purpose.treatment
travel.purpose.other

# Status
travel.status.planning
travel.status.preparing
travel.status.active
travel.status.returning
travel.status.completed
travel.status.archived

# Checklist
travel.checklist.title
travel.checklist.attach_document
travel.checklist.no_items
travel.checklist.last_reviewed
travel.checklist.item_status.pending
travel.checklist.item_status.in_progress
travel.checklist.item_status.completed
travel.checklist.item_status.not_applicable
travel.checklist.category.vaccination
travel.checklist.category.documentation
travel.checklist.category.identification
travel.checklist.category.transport
travel.checklist.category.preparation
travel.checklist.category.testing
travel.checklist.window.between        # "Entre {min} e {max} dias antes da viagem"
travel.checklist.window.until          # "Até {max} dias antes da viagem"
travel.checklist.window.from           # "A partir de {min} dias antes da viagem"

# Revisão de documentos
travel.document.review.title
travel.document.review.confirm
travel.document.review.retake
travel.document.extracting             # "Extraindo informações..."
travel.document.extraction_failed

# Disclaimers (críticos)
travel.disclaimer.ai_generated
travel.disclaimer.generic_fallback
travel.disclaimer.static_review
travel.disclaimer.consult_vet

# Geração IA
travel.ai_generation.in_progress       # "Gerando lista para {countryName}..."
travel.ai_generation.completed
travel.ai_generation.failed
travel.ai_generation.confidence.high
travel.ai_generation.confidence.medium
travel.ai_generation.confidence.low

# === REQUIREMENTS COMPARTILHADOS ===

# União Europeia (compartilhado por 11 países UE + Suíça)
travel.req.eu_microchip_iso.title
travel.req.eu_microchip_iso.description
travel.req.eu_rabies_vaccine.title
travel.req.eu_rabies_vaccine.description
travel.req.eu_health_certificate.title
travel.req.eu_health_certificate.description
travel.req.eu_pet_passport.title
travel.req.eu_pet_passport.description
travel.req.eu_echinococcus_treatment.title
travel.req.eu_echinococcus_treatment.description

# Mercosul (AR, UY, PY, CL, CO)
travel.req.mercosul_cvi.title
travel.req.mercosul_cvi.description
travel.req.mercosul_rabies_vaccine.title
travel.req.mercosul_rabies_vaccine.description
travel.req.mercosul_microchip.title
travel.req.mercosul_microchip.description
travel.req.cl_parasitic_treatment.title       # Chile específico
travel.req.cl_parasitic_treatment.description

# CVI MAPA (compartilhado por todas as saídas internacionais do BR)
travel.req.br_cvi_export.title
travel.req.br_cvi_export.description

# Reino Unido (pós-Brexit)
travel.req.gb_animal_health_certificate.title
travel.req.gb_animal_health_certificate.description
travel.req.gb_microchip.title
travel.req.gb_microchip.description
travel.req.gb_rabies_vaccine.title
travel.req.gb_rabies_vaccine.description
travel.req.gb_tapeworm_treatment.title
travel.req.gb_tapeworm_treatment.description

# EUA (USDA APHIS + CDC)
travel.req.us_aphis_health_certificate.title
travel.req.us_aphis_health_certificate.description
travel.req.us_cdc_high_risk_protocol.title    # Brasil é país de alto risco
travel.req.us_cdc_high_risk_protocol.description
travel.req.us_rabies_titer.title              # Titulação RNATT pra países alto risco
travel.req.us_rabies_titer.description
travel.req.us_microchip.title
travel.req.us_microchip.description

# Canadá (CFIA)
travel.req.ca_rabies_vaccine.title
travel.req.ca_rabies_vaccine.description
travel.req.ca_health_certificate.title
travel.req.ca_health_certificate.description

# México (SENASICA)
travel.req.mx_health_certificate.title
travel.req.mx_health_certificate.description
travel.req.mx_rabies_vaccine.title
travel.req.mx_rabies_vaccine.description

# Japão (estrito — protocolo 180 dias)
travel.req.jp_advance_notification.title       # Notificação 40 dias antes
travel.req.jp_advance_notification.description
travel.req.jp_microchip.title
travel.req.jp_microchip.description
travel.req.jp_rabies_two_doses.title
travel.req.jp_rabies_two_doses.description
travel.req.jp_rabies_titer.title               # RNATT
travel.req.jp_rabies_titer.description
travel.req.jp_180_days_wait.title              # Período de espera
travel.req.jp_180_days_wait.description
travel.req.jp_export_certificate.title
travel.req.jp_export_certificate.description

# Austrália / Nova Zelândia
travel.req.au_import_permit.title
travel.req.au_import_permit.description
travel.req.au_microchip.title
travel.req.au_microchip.description
travel.req.au_rabies_vaccine.title
travel.req.au_rabies_vaccine.description
travel.req.au_rnatt.title                      # Titulação 180 dias
travel.req.au_rnatt.description
travel.req.au_disease_tests.title              # Brucelose, leishmaniose, etc
travel.req.au_disease_tests.description
travel.req.au_parasitic_treatment.title
travel.req.au_parasitic_treatment.description
travel.req.au_quarantine.title
travel.req.au_quarantine.description

# Emirados Árabes Unidos
travel.req.ae_import_permit.title
travel.req.ae_import_permit.description
travel.req.ae_rabies_vaccine.title
travel.req.ae_rabies_vaccine.description
travel.req.ae_microchip.title
travel.req.ae_microchip.description
travel.req.ae_health_certificate.title
travel.req.ae_health_certificate.description

# === GENÉRICO INTERNACIONAL ===
travel.req.generic_microchip.title
travel.req.generic_microchip.description
travel.req.generic_rabies.title
travel.req.generic_rabies.description
travel.req.generic_health_certificate.title
travel.req.generic_health_certificate.description
travel.req.generic_vaccines.title
travel.req.generic_vaccines.description
travel.req.generic_dewormer.title
travel.req.generic_dewormer.description
travel.req.generic_transport_doc.title
travel.req.generic_transport_doc.description
travel.req.generic_iata_crate.title
travel.req.generic_iata_crate.description

# === BRASIL DOMÉSTICO ===
travel.req.br_domestic_health.title
travel.req.br_domestic_health.description
travel.req.br_domestic_vaccines.title
travel.req.br_domestic_vaccines.description

# === NOMES DE PAÍSES (25 países) ===
travel.country.BR
travel.country.AR
travel.country.UY
travel.country.PY
travel.country.CL
travel.country.CO
travel.country.PT
travel.country.ES
travel.country.FR
travel.country.IT
travel.country.DE
travel.country.NL
travel.country.BE
travel.country.AT
travel.country.IE
travel.country.GR
travel.country.SE
travel.country.GB
travel.country.US
travel.country.CA
travel.country.MX
travel.country.JP
travel.country.AU
travel.country.NZ
travel.country.AE
travel.country.CH

# === COMPONENTES ===
petCard.startTrip.label                # "Iniciar nova viagem com {petName}"
petCard.activeTrip.badge               # "Viagem ativa"
```

### 10.3 Arquivo `MISSING_TRANSLATIONS.md`

Criar na raiz do projeto após gerar todos os locales:

```markdown
# Traduções pendentes — módulo de viagem

**Status:** pt-BR completo. Outros 4 idiomas com placeholders.

## Pendente em en-US.json
[lista todas as chaves do módulo travel.* — copiar do pt-BR]

## Pendente em es-MX.json
[idem]

## Pendente em es-AR.json
[idem — atenção: voseo, "vos" em vez de "tú"]

## Pendente em pt-PT.json
[idem — atenção: vocabulário PT-PT difere de PT-BR ("ficheiro" vs "arquivo", "rato" vs "mouse" etc.)]

**Total estimado:** ~250 chaves × 4 idiomas = ~1000 strings a traduzir.

**Sugestão de processo:** PR de i18n separado, traduções via tradutor profissional ou ferramenta de tradução em massa, com revisão nativa.
```

---

## 11. Critérios de aceite

O PR está pronto quando:

- [ ] Discovery executado e reportado antes de qualquer código.
- [ ] Migration aplica sem erros e gera as 4 tabelas (trips, trip_pets, trip_documents, travel_rules_generated) + alteração em diary_entries + RLS + indexes.
- [ ] Types TypeScript regenerados e exportados (incluindo `RulesSource`, `GeneratedRulesConfidence`, `GeneratedRulesCitation`).
- [ ] Catálogo dos **25 países** implementado, tipado, com requirements compartilhados (UE, Mercosul, AU/NZ, strictRabies) sem duplicação.
- [ ] Função `resolveTravelRules` retorna corretamente: `static_catalog` pra países do catálogo, `ai_generated` pra cache hit, `generic_fallback` pra países desconhecidos.
- [ ] Hooks `useTrips`, `useTripDocuments` e `useTravelRules` funcionam — testar manualmente com 1 trip pra país do catálogo + 1 trip pra país fora do catálogo.
- [ ] Edge Functions `extract-travel-document`, `parse-travel-intent` e `generate-travel-rules` deployadas com `verify_jwt: false` e funcionando — testar com curl ou no app.
- [ ] `generate-travel-rules` salva resultado em `travel_rules_generated` e segunda chamada pro mesmo país retorna `source: 'cache_hit'`.
- [ ] Ícone de avião aparece no `PetCard` e navega para a tela de nova viagem.
- [ ] Fluxo de criação por voz funciona ponta a ponta (testado pelo menos 1 vez): voz → STT → parse → confirma → trip salva no banco com `status: 'planning'`.
- [ ] Tela de detalhe carrega checklist do país correto e permite anexar documento via câmera + IA extrai dados.
- [ ] Banner de disclaimer aparece nas telas com `source !== 'static_catalog'` e não pode ser fechado nas telas de planejamento/checklist.
- [ ] Banner de revisão (`lastReviewed`) aparece sutil mesmo nas telas com `static_catalog`.
- [ ] **pt-BR**: todas as ~250 chaves traduzidas com qualidade nativa.
- [ ] **Outros 4 idiomas**: chaves existem com placeholder `[TODO-{LOCALE}] ...` (app não quebra ao mudar idioma).
- [ ] `MISSING_TRANSLATIONS.md` criado na raiz com listagem completa.
- [ ] `VALIDATION_REQUIRED.md` criado em `src/data/travelRules/` com checklist de validação.
- [ ] Logs de debug mantidos em todo código novo (não remover).
- [ ] Sem `<TextInput>` em qualquer tela do módulo de viagem.

---

## 12. Não fazer neste PR

Para evitar scope creep, **não** implementar:

- Tradutor de consulta em tempo real (Fase 3)
- Compartilhamento com vet estrangeiro
- Resumo automático de viagem com IA
- Memorial de viagem
- Lembretes push baseados em timeline
- Custos consolidados
- Edição de viagem após criação (botão pode existir desabilitado)
- Catálogo de países além dos 5 listados
- Compartilhamento social
- Notificações de mudanças regulatórias

Esses entram em PRs futuros. Se a tentação de "só adicionar isso aqui" aparecer, anote em comentário `// TODO: PR-2 ou PR-3` e siga em frente.

---

## 13. Restrições e guard rails

- **Não modificar** código fora do escopo deste PR. Se encontrar bug em código existente, anotar em comentário e seguir.
- **Não remover** debug logs existentes do projeto (Belisario tem disciplina explícita sobre isso).
- **Não otimizar** prematuramente. Código verbose com logs é preferível neste momento.
- **Não criar abstrações** novas (HOCs, contextos, providers) a menos que estritamente necessário — usar o que o projeto já tem.
- **Não trocar libs** já em uso por equivalentes "melhores".
- **Em caso de dúvida sobre padrão do projeto**, parar e perguntar ao Belisario antes de chutar.

---

## 14. Como entregar

Ao terminar, gere um sumário do PR contendo:

1. Lista de arquivos criados/modificados
2. Comandos para testar localmente (rodar migration, deploy de Edge Functions, etc.)
3. Capturas de tela ou descrição visual do fluxo (se possível)
4. Checklist de aceite (seção 10) marcado
5. Bugs ou limitações conhecidos
6. Sugestões para o PR seguinte

Boa implementação. Em caso de bloqueio, **pare e pergunte** — é melhor que adivinhar.
