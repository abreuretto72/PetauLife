# Prompt para Claude Code — IA Proativa do Pet (Camadas 1-4)

> **Como usar este documento:** copie a seção "PROMPT PARA O CLAUDE CODE" abaixo e cole na sua sessão do Claude Code. Os anexos no final são para sua referência (Belisario) — você pode adicioná-los como contexto extra se quiser, mas o prompt principal já é auto-contido.

---

## PROMPT PARA O CLAUDE CODE

```
Você vai implementar o módulo de IA Proativa do Pet no auExpert, cobrindo as
Camadas 1 a 4 do roadmap de proatividade. Este é um PR grande e crítico — leia
TUDO antes de começar a codar.

═══════════════════════════════════════════════════════════════════════════
CONTEXTO DO PROJETO (NÃO IGNORE)
═══════════════════════════════════════════════════════════════════════════

auExpert é um app de diário inteligente para pets, mercado brasileiro, React
Native + Expo SDK 52+, TypeScript, Supabase (PostgreSQL + Edge Functions),
Claude API, React Query, Zustand, Expo Router v4. Multilíngue: pt-BR, en-US,
es-MX, es-AR, pt-PT.

Supabase project_id: peqpkzituzpwukzusgcq

CONVENÇÕES OBRIGATÓRIAS (não negociar — projeto já tem essas regras consolidadas):
- Edge Functions sempre com `verify_jwt: false` no config.
- FKs em diary_entries e tabelas relacionadas apontam para `public.users`,
  NÃO `auth.users` (necessário pra visibilidade do PostgREST).
- DIARY_MODULE_SELECT usa `select('*')` simples; quando há múltiplas FKs pra
  mesma tabela, usar sintaxe de constraint-name explícita:
  `table!constraint_name(columns)`.
- Após qualquer mudança de FK ou schema: `notify pgrst, 'reload schema';`
- Limites de mídia: foto 5MB, vídeo 60s/50MB, áudio 30s/5MB, doc 10MB.
- Logs de debug DEVEM permanecer no código até bugs visualmente confirmados —
  não remover especulativamente.
- ZERO `<TextInput>` em telas novas. Voz, tap, ou input nativo do SO.
- Lente cards usam `extracted_data` como fonte primária.

═══════════════════════════════════════════════════════════════════════════
OBJETIVO DESTE PR
═══════════════════════════════════════════════════════════════════════════

Implementar IA proativa que ANTECIPA necessidades do tutor com base no perfil
acumulado do pet específico (Mana, Pico, etc.) + contexto atual (hora, lugar,
clima, viagem). Diferente de "responder quando perguntado" — aqui é "perceber
e avisar antes do tutor perceber".

Cobertura: Camadas 1, 2, 3 e 4 (definidas na seção abaixo).

═══════════════════════════════════════════════════════════════════════════
ESCOPO DETALHADO POR CAMADA
═══════════════════════════════════════════════════════════════════════════

CAMADA 1 — Lembretes deduzidos automaticamente
─────────────────────────────────────────────
A IA gera lembretes mesmo se o tutor NÃO criou manualmente, deduzindo dos
dados existentes (carteirinha de vacinação anexada, registros de medicação,
consultas vet, etc.).

Tipos cobertos:
- Vacinas vencendo (30d e 7d antes)
- Vermífugo (6 meses adultos, 15 dias filhotes)
- Antipulgas/carrapatos (30 dias após última aplicação)
- Banho (com base na frequência observada do tutor)
- Aniversário do pet (data de nascimento ou adoção)
- Consulta de rotina (anual adultos, semestral filhotes/idosos)
- Medicação contínua acabando (5 dias antes do estoque acabar)
- Ração acabando (com base em padrão de consumo + estoque informado)

CAMADA 2 — Detecção de padrões e anomalias
─────────────────────────────────────────────
A IA olha série temporal de diary_entries + trip_moments e detecta mudanças.

Detectores:
- Mudança de apetite (>20% pra cima ou pra baixo em 5+ dias)
- Mudança de banheiro (cocô líquido 3+ dias, ou frequência fora do padrão)
- Mudança de sono (muito mais ou muito menos que o histórico)
- Mudança de peso (tendência fora do esperado entre pesagens)
- Mudança de humor (palavras-chave nos diary entries indicando apatia,
  agitação, etc., recorrentes)
- Coceira/lambedura recorrente (>3 menções em 7 dias)
- Anomalia silenciosa (pet que registrava 2+ entradas/dia parou há X dias)

CAMADA 3 — Sugestões contextuais (lugar/hora/clima)
─────────────────────────────────────────────
A IA cruza estado do pet × estado do mundo no momento.

Triggers:
- Calor extremo previsto (>30°C dependendo da raça/porte)
- Frio extremo (especialmente raças pequenas/sem pelo)
- Tempestade prevista (se houve registro anterior de medo de trovão)
- Qualidade do ar ruim (AQI alto)
- Final de semana/3+ dias sem passeio registrado
- Aniversário ou marcos etários (filhote→jovem, adulto→sênior)
- Mudança de fase (ex: completou 1 ano → muda recomendações)

CAMADA 4 — Insights de longo prazo
─────────────────────────────────────────────
Análises que só dão pra fazer com 3+ meses de histórico.

Tipos:
- Sazonalidade (alergia em primavera repetida em anos diferentes)
- Correlação alimentar (marca X → cocô mole, repetido N vezes)
- Padrão de viagem (sempre come menos no primeiro dia)
- Padrão social (ambientes movimentados → agitação)
- Eficácia de tratamento (medicação X reduziu sintoma Y de A pra B)
- Resumo mensal e anual (quando tutor solicita ou em datas-chave)

═══════════════════════════════════════════════════════════════════════════
PRINCÍPIOS NÃO-NEGOCIÁVEIS (não confundir com sugestões)
═══════════════════════════════════════════════════════════════════════════

1. NUNCA diagnosticar. "Padrão diferente do normal" sim; "Pico está com
   gastrite" JAMAIS. Em qualquer alerta de saúde: incluir frase explícita
   "considere conversar com veterinário".

2. NUNCA substituir o vet. Todo alerta de saúde tem CTA pra ação concreta:
   abrir consulta, ligar pro vet, registrar no diário pra discutir depois.

3. Tom medido. SEM "Oi tutor! Como vocês estão hoje? 🐾💕". SIM "Pico está
   comendo menos nos últimos dias. Quer registrar como foi hoje?"

4. Opt-in granular. CADA categoria de proatividade liga/desliga
   independentemente. Tela de configurações com toggles por camada e por
   subcategoria.

5. Privacidade. Dados do pet NUNCA vão pra IA agregada/treinamento. Cada
   chamada de IA é isolada por (tutor_id, pet_id).

6. Não overload. Se a IA gerou 5 insights hoje, mostra os 2-3 mais relevantes;
   o resto fica no histórico/feed acessível mas não notifica.

═══════════════════════════════════════════════════════════════════════════
ENTREGA EM FASES (DENTRO DESTE PR)
═══════════════════════════════════════════════════════════════════════════

Este PR é grande. Para garantir qualidade, divida em etapas e PARE pra
revisão humana entre cada uma. Não emende as fases — espere confirmação.

FASE 0 — Discovery e proposta (PARE AO FIM E REPORTE)
FASE 1 — Schema + RLS + tipos
FASE 2 — Camada 1 (lembretes deduzidos)
FASE 3 — Camada 2 (anomalias)
FASE 4 — Camada 3 (contexto)
FASE 5 — Camada 4 (longo prazo)
FASE 6 — UI unificada (feed de insights, settings, integrações)
FASE 7 — Testes manuais guiados + checklist final

═══════════════════════════════════════════════════════════════════════════
FASE 0 — DISCOVERY (FAZER PRIMEIRO, PARAR AO FIM)
═══════════════════════════════════════════════════════════════════════════

Antes de qualquer linha de código, INVESTIGUE e REPORTE em 15-25 linhas
cobrindo:

1. Tabelas existentes que vão alimentar a IA: pets (campos atuais — date_of_
   birth, breed, species, weight, etc.), diary_entries (estrutura de
   extracted_data por lente), trip_moments, trip_consultations,
   trip_saved_places (se PR #2b já foi implementado).

2. Estado do schema sobre saúde: já existe tabela vaccinations? medications?
   allergies? chronic_conditions? Se NÃO existem, listar quais precisam ser
   criadas ANTES (mas não criar agora — só listar).

3. Sistema de notificações push: existe? Que lib? Está configurado pra os 5
   locales? Se não existe, este PR NÃO inclui setup — apenas grava insights
   em tabela pra ser entregue quando push existir.

4. Sistema de jobs/cron: pg_cron está disponível? Supabase scheduled functions
   estão configuradas? (Análise de longo prazo da Camada 4 precisa rodar em
   batch.)

5. Lib de gráficos pra UI: existe alguma (Victory, Skia, react-native-svg-
   charts)? Insights da Camada 4 vão ser ricos visualmente.

6. Settings/preferências do usuário: onde ficam hoje? users.metadata?
   tabela própria? Vou precisar adicionar opt-in granular.

7. Feature flags: como ativar este módulo gradualmente? Já tem sistema?

8. Custo estimado de IA por tutor/mês: estimar com base em frequência de
   análise × modelo usado.

REPORTE TUDO. NÃO PRESSUPONHA — PERGUNTE se algo for ambíguo. Não passe pra
Fase 1 sem confirmação humana ("Belisario disse: prossiga").

═══════════════════════════════════════════════════════════════════════════
FASE 1 — SCHEMA, RLS, TIPOS
═══════════════════════════════════════════════════════════════════════════

Migration única em `supabase/migrations/`. Aplicar via MCP do Supabase
quando apropriado, ou gerar arquivo .sql se workflow do projeto for por
arquivo.

TABELA: pet_insights
─────────────────────
Insights gerados pela IA. Persiste tudo, mostra alguns.

```sql
create table public.pet_insights (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  tutor_id uuid not null references public.users(id) on delete cascade,
  layer integer not null check (layer between 1 and 4),
  category text not null,                       -- ex: 'vaccine_due', 'appetite_change'
  subcategory text,                             -- ex: 'V10', 'antipulgas'
  severity text not null check (severity in ('info', 'consider', 'attention', 'urgent')),
  title text not null,                          -- pt-BR
  body text not null,                           -- pt-BR, 1-3 frases
  evidence jsonb not null default '{}'::jsonb,  -- dados que suportam o insight
  cta_type text,                                -- 'open_consultation','open_vet_finder',
                                                -- 'log_diary','schedule_reminder',
                                                -- 'view_chart', etc.
  cta_payload jsonb default '{}'::jsonb,        -- params pra ação
  related_entries uuid[] default '{}',          -- diary_entries citados como evidência
  related_moments uuid[] default '{}',          -- trip_moments citados
  generated_by text not null,                   -- nome da Edge Function
  model_used text,                              -- 'sonnet-4-6', 'opus-4-7', 'rule-based'
  status text not null default 'pending'
    check (status in ('pending','shown','dismissed','acted_on','expired')),
  shown_at timestamptz,
  dismissed_at timestamptz,
  acted_on_at timestamptz,
  expires_at timestamptz,
  generated_at timestamptz not null default now(),
  unique (pet_id, category, subcategory, generated_at)
);

create index idx_pet_insights_pet on public.pet_insights(pet_id);
create index idx_pet_insights_status on public.pet_insights(status)
  where status in ('pending','shown');
create index idx_pet_insights_severity on public.pet_insights(severity);
create index idx_pet_insights_expires on public.pet_insights(expires_at)
  where expires_at is not null;
```

TABELA: pet_baseline_metrics
────────────────────────────
Linha de base estatística por pet — recalculada periodicamente. A IA usa
esses números pra detectar desvios.

```sql
create table public.pet_baseline_metrics (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  metric_key text not null,                     -- 'meals_per_day','sleep_hours_avg',
                                                -- 'walks_per_week', etc.
  window_days integer not null,                 -- janela usada (30, 90, 365)
  mean numeric,
  median numeric,
  stddev numeric,
  min numeric,
  max numeric,
  sample_count integer not null,
  computed_at timestamptz not null default now(),
  unique (pet_id, metric_key, window_days)
);

create index idx_pet_baseline_pet on public.pet_baseline_metrics(pet_id);
```

TABELA: pet_proactive_settings
──────────────────────────────
Opt-in granular por tutor (não por pet — preferências de notificação são do
tutor).

```sql
create table public.pet_proactive_settings (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.users(id) on delete cascade,
  layer1_enabled boolean not null default true,
  layer1_categories jsonb not null default '{
    "vaccine_due": true,
    "vermifuge": true,
    "antipulgas": true,
    "bath": true,
    "birthday": true,
    "routine_checkup": true,
    "medication_running_out": true,
    "food_running_out": true
  }'::jsonb,
  layer2_enabled boolean not null default true,
  layer2_categories jsonb not null default '{
    "appetite_change": true,
    "potty_change": true,
    "sleep_change": true,
    "weight_change": true,
    "mood_change": true,
    "scratching_recurrent": true,
    "silent_anomaly": true
  }'::jsonb,
  layer3_enabled boolean not null default true,
  layer3_categories jsonb not null default '{
    "extreme_heat": true,
    "extreme_cold": true,
    "storm": true,
    "air_quality": true,
    "no_walks_streak": true,
    "birthdays_milestones": true,
    "life_phase_change": true
  }'::jsonb,
  layer4_enabled boolean not null default true,
  layer4_categories jsonb not null default '{
    "seasonality": true,
    "food_correlation": true,
    "travel_pattern": true,
    "social_pattern": true,
    "treatment_efficacy": true,
    "monthly_summary": true,
    "yearly_summary": true
  }'::jsonb,
  quiet_hours_start time default '22:00',
  quiet_hours_end time default '08:00',
  max_insights_per_day integer not null default 3,
  updated_at timestamptz not null default now(),
  unique (tutor_id)
);
```

RLS:
```sql
alter table public.pet_insights enable row level security;
alter table public.pet_baseline_metrics enable row level security;
alter table public.pet_proactive_settings enable row level security;

create policy "pet_insights_owner" on public.pet_insights
  for all using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());

create policy "pet_baseline_metrics_via_pet" on public.pet_baseline_metrics
  for select using (
    exists (select 1 from public.pets p where p.id = pet_id and p.tutor_id = auth.uid())
  );

create policy "pet_proactive_settings_owner" on public.pet_proactive_settings
  for all using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());

notify pgrst, 'reload schema';
```

TIPOS TYPESCRIPT:
- Gerar via `supabase gen types typescript` se o projeto usa esse fluxo.
- Criar tipos derivados em `src/types/insights.ts`:
  - `PetInsight`, `InsightSeverity`, `InsightCategory`, `InsightCTA`
  - `PetBaselineMetric`, `PetProactiveSettings`
- Enums em `src/constants/insights.ts` com chaves consistentes com o schema.

PARE AO FIM DA FASE 1. Reporte: tabelas criadas, RLS aplicado, tipos
gerados, exemplos de inserção testados manualmente. Espere "prossiga".

═══════════════════════════════════════════════════════════════════════════
FASE 2 — CAMADA 1 (LEMBRETES DEDUZIDOS)
═══════════════════════════════════════════════════════════════════════════

A maior parte da Camada 1 é regra simples (datas + cálculos), NÃO precisa de
LLM. Use LLM apenas pra parsing inicial de carteirinha (já existente no
projeto, reusar) e pra fraseado bonito quando o lembrete dispara.

EDGE FUNCTION: generate-deduced-reminders
─────────────────────────────────────────
Em `supabase/functions/generate-deduced-reminders/index.ts`. `verify_jwt:
false`. Roda diariamente por job + sob demanda quando dado relevante
muda.

Recebe:
```ts
{
  pet_id?: string;        // se omitido, processa todos os pets do tutor
  tutor_id: string;
  trigger: 'scheduled' | 'on_demand' | 'data_change';
}
```

Lógica (regras determinísticas, sem LLM no core):

1. VACINAS:
   - Ler vaccinations do pet (ou extracted_data de diary_entries com lente
     'vaccination' se tabela ainda não existir — Discovery deve ter
     resolvido isso).
   - Pra cada vacina com data de próxima dose: se está a 30d ou 7d, criar
     pet_insight com category='vaccine_due', subcategory=nome_vacina,
     severity='consider' (30d) ou 'attention' (7d).
   - cta_type='schedule_reminder', cta_payload={vaccine_name, due_date}.

2. VERMÍFUGO:
   - Buscar último registro (diary_entry com lente 'medication' tipo
     'vermifugo' ou tabela específica).
   - Calcular próxima dose: 6 meses (adultos), 15 dias (filhotes < 6m).
   - Mesma lógica de antecipação.

3. ANTIPULGAS:
   - Buscar última aplicação. 30 dias depois → insight.

4. BANHO:
   - Olhar diary_entries com lente 'bath' nos últimos 90 dias.
   - Calcular intervalo médio entre banhos.
   - Se passou 1.3× a média sem banho → sugestão suave (severity='info').

5. ANIVERSÁRIO:
   - pets.date_of_birth ou pets.adoption_date → 7d antes, criar insight com
     severity='info', tom afetivo (mas medido).

6. CONSULTA DE ROTINA:
   - Última consulta vet (trip_consultations OU diary_entries lente 'vet').
   - Adultos: 12 meses. Filhotes: 6 meses. Sêniores (>7 anos cães grandes,
     >9 anos cães pequenos, >10 gatos): 6 meses.
   - Se passou: severity='consider'.

7. MEDICAÇÃO ACABANDO:
   - Tutor registrou "comprei N comprimidos, dose Y/dia".
   - Calcular data de fim. 5 dias antes: insight severity='attention',
     cta_type='open_pharmacy_finder' (vai pro PR #2b se existir).

8. RAÇÃO ACABANDO:
   - Mesma lógica, baseado em padrão observado (peso do pet × kg/dia
     médio) ou input direto do tutor.

PROMPT MÍNIMO DE LLM (apenas se precisar parsear/refinar):
- Se há dados ambíguos numa carteirinha já parseada e a confiança é baixa,
  chamar Sonnet 4.6 pra revisar. Caso contrário, regras puras.

DEDUPLICAÇÃO:
- Antes de inserir um insight, verificar se já existe um pendente da mesma
  category+subcategory pro mesmo pet com generated_at < 7 dias. Se sim,
  atualizar em vez de duplicar.

LOGS DE DEBUG:
Prefixo `[generate-deduced-reminders]`. Logar: pet_id processado, regras
disparadas, regras puladas (e por quê), tempo total. Manter em produção.

HOOK:
```ts
// src/hooks/usePetInsights.ts
export function usePetInsights(petId: string, options?: { layer?: number; status?: string })
export function useDismissInsight()
export function useMarkActedOn()
```

PARE AO FIM DA FASE 2. Demonstre: rodando a Edge Function pra um pet de
teste com vacinação atrasada, gera o insight correto. Espere "prossiga".

═══════════════════════════════════════════════════════════════════════════
FASE 3 — CAMADA 2 (DETECÇÃO DE ANOMALIAS)
═══════════════════════════════════════════════════════════════════════════

EDGE FUNCTION: compute-pet-baselines
────────────────────────────────────
Roda em batch (job diário). Calcula pet_baseline_metrics pra cada pet
ativo. Sem LLM — estatística pura.

Métricas calculadas:
- meals_per_day (janelas 30 e 90)
- walks_per_week (30 e 90)
- sleep_quality_score (derivado de menções no diário)
- weight_kg (curva, se houver pesagens)
- diary_entries_per_week (engajamento — usado pra detectar silêncio)
- trip_moments_per_day (durante viagens)

Implementação: SQL query agregando `diary_entries` por lente, com
extração de tipos via JSONB. Pra cada métrica calcular mean, median,
stddev, sample_count.

EDGE FUNCTION: detect-pet-anomalies
───────────────────────────────────
Roda diariamente após compute-pet-baselines. AQUI usa LLM (Sonnet 4.6)
pra cruzar baseline + dados recentes + textos livres dos diary_entries.

Recebe: { pet_id: string, tutor_id: string }

Fluxo:
1. Carrega baseline_metrics do pet.
2. Carrega últimos 14 dias de diary_entries + trip_moments.
3. Pré-filtra com regras determinísticas:
   - "comeu menos" se média 7 dias < (baseline.mean - 1×stddev)
   - "não registrou nada" se últimas 48h sem entry e baseline > 1/dia
   - etc.
4. Pra cada anomalia detectada por regra, chama Sonnet 4.6 pra:
   - Validar (descartar falso-positivo óbvio: viajou, então padrão diferente é ok)
   - Frasear em pt-BR, tom medido
   - Sugerir CTA apropriado (registrar diário / abrir consulta / monitorar)
5. Cria pet_insight com layer=2, evidence={dados que suportam},
   related_entries=[ids dos diary_entries citados].

PROMPT (Sonnet 4.6):
```
Você analisa dados longitudinais de um pet e identifica mudanças relevantes.

Pet: {pet_summary}
Linha de base: {baseline_json}
Últimos 14 dias: {recent_entries_summary}
Anomalia detectada por regra: {anomaly_rule}

Tarefa: confirmar se a anomalia merece atenção do tutor OU se há explicação
contextual óbvia que descarte (viagem, mudança de casa, mudança de marca de
ração registrada).

REGRAS:
- NUNCA diagnostique. "Padrão diferente" sim; "está doente" jamais.
- Tom medido: SEM "Oi tutor!" ou emojis em excesso. Profissional e atencioso.
- Em alertas de saúde, INCLUIR sempre a frase "considere conversar com vet"
  ou equivalente.
- Se houver explicação contextual clara, retornar "skip": true.

Retornar APENAS JSON:
{
  "skip": false,
  "title": "frase curta, 4-8 palavras, pt-BR",
  "body": "1-3 frases, pt-BR",
  "severity": "info" | "consider" | "attention",
  "cta_type": "log_diary" | "open_consultation" | "view_chart" | "monitor",
  "evidence_summary": "resumo do que sustenta o insight"
}
```

GUARD-RAIL DE FALSO-POSITIVO:
- Se mesmo insight (category+subcategory) já foi criado e dispensado pelo
  tutor nos últimos 14 dias, NÃO recriar. Tutor disse "não me incomoda".
- Se LLM retornar skip:true, registrar no log mas não criar insight.

PARE AO FIM DA FASE 3. Demonstre: pet com 30 dias de dados sintéticos
mostrando anomalia clara. Espere "prossiga".

═══════════════════════════════════════════════════════════════════════════
FASE 4 — CAMADA 3 (CONTEXTO LUGAR/HORA/CLIMA)
═══════════════════════════════════════════════════════════════════════════

EDGE FUNCTION: generate-contextual-insights
───────────────────────────────────────────
Roda 2× por dia (manhã 7h, tarde 16h, hora local do tutor) por job.

Inputs externos necessários:
- API de clima: OpenWeatherMap (free tier ok pro MVP) ou similar.
  Discovery deve ter validado se já há integração.
- AQI: incluído na maior parte das APIs de clima modernas.
- Localização do tutor: trips.current_location se viagem ativa, OU
  users.home_location.

Lógica:
1. Pra cada pet ativo, determinar localização atual.
2. Buscar previsão das próximas 12h.
3. Aplicar regras:
   - Heat alert: temp > limite_por_porte (cães grandes 28°C, pequenos 30°C,
     braquicéfalos 26°C). Severity baseado em quão acima.
   - Cold alert: temp < 12°C pra raças pequenas/sem pelo, < 5°C geral.
     Verificar breed do pet em pets.breed.
   - Storm: chance > 70% E pet tem registro de medo de trovão (procurar em
     diary_entries por palavras-chave nos últimos 365 dias).
   - AQI > 150: reduzir tempo ao ar livre.
   - No walks streak: 3+ dias sem entry com lente 'walk' OU sem
     trip_moment tipo 'walk'.
4. Marcos etários:
   - Filhote → jovem (1 ano)
   - Adulto → sênior (varia por raça, usar tabela mental do LLM)
   - Aniversário (7d antes)
5. Pra cada disparo, criar insight com layer=3.

LLM (Sonnet 4.6) usado pra:
- Frasear o aviso de forma adequada à raça + idade + contexto.
- Sugerir ações concretas (não genéricas tipo "tome cuidado").

PROMPT:
```
Pet: {pet_name}, {breed}, {age}, {weight_kg}kg.
Contexto detectado: {context_summary}
(ex: "previsão de 36°C às 14h, Salto-SP, pet é Border Collie de 30kg")

Gere alerta proativo em pt-BR.
- Tom: assistente atento, NÃO amigão. Sem emojis exceto se essencial.
- Concreto: ações específicas, NÃO genéricas.
- Ajustado a raça/porte/idade.

Retornar JSON:
{
  "title": "...",
  "body": "...",
  "severity": "info" | "consider" | "attention",
  "actions": ["ação 1", "ação 2"]
}
```

PARE AO FIM DA FASE 4. Demonstre: simulando 36°C pra um Chihuahua e pra
um Border Collie, alertas saem diferentes. Espere "prossiga".

═══════════════════════════════════════════════════════════════════════════
FASE 5 — CAMADA 4 (INSIGHTS DE LONGO PRAZO)
═══════════════════════════════════════════════════════════════════════════

ESTA É A MAIS PESADA DE LLM. Use Opus 4.7 — vale o custo, roda raramente.

EDGE FUNCTION: generate-longterm-insights
─────────────────────────────────────────
Roda mensalmente por pet (cron) + sob demanda.

Análises:
1. Sazonalidade: olhar diary_entries dos últimos 24+ meses, agrupar por
   mês/estação, detectar padrões repetidos (ex: coceira recorrente em
   set/out).
2. Correlações alimentares: cruzar mudanças de marca/tipo de ração com
   padrões de banheiro/digestão nos dias seguintes.
3. Padrões de viagem: olhar trip_moments + trip_consultations agrupados
   por viagem, detectar padrões consistentes.
4. Padrões sociais/ambientais: cruzar mood/comportamento com locais
   visitados (trip_saved_places se PR #2b existir).
5. Eficácia de tratamento: medication_started_at + sintomas antes vs
   depois.
6. Resumos mensais e anuais: gerados sob demanda (tutor toca "ver minha
   resenha do ano") OU automaticamente em datas-chave (1º de janeiro,
   aniversário do pet, aniversário de adoção).

ESTRUTURA DE PROMPT (Opus 4.7):
- Input: agregação estruturada (não textos crus — pré-resumir client-side
  ou em SQL pra economizar tokens).
- Output: estrutura rica com gráfico_data quando aplicável (eixos,
  pontos, linhas) pra renderizar visualmente na UI.

EXEMPLO DE PROMPT (sazonalidade):
```
Pet: {pet_summary}
Entries dos últimos 24 meses agrupadas por mês:
{aggregated_data}

Identifique padrões sazonais REPETIDOS em pelo menos 2 anos diferentes.
Ignorar padrões de 1 único ano (sem evidência de recorrência).

Retornar JSON:
{
  "patterns": [
    {
      "pattern_name": "Coceira em primavera",
      "evidence": "12 menções em set-out/2024 e 9 em set-out/2025",
      "confidence": 0.85,
      "narrative": "Pode ser alergia sazonal. Vale conversar com vet antes
       da próxima primavera (cerca de 4 meses).",
      "chart_data": {
        "type": "bar_by_month",
        "data": [...],
        "highlight_months": [9, 10]
      },
      "suggested_action": "schedule_preventive_consultation"
    }
  ]
}
```

LIMITES:
- Máximo 5 padrões por análise (priorizar confidence alta).
- Confidence < 0.6 → descartar.
- Cada análise consumindo X tokens — logar custo por execução pra
  monitoramento.

CACHE: insights de longo prazo expiram em 30 dias. Não rerodar se há
versão fresca, exceto sob demanda do tutor.

PARE AO FIM DA FASE 5. Demonstre: pet com 6+ meses de dados sintéticos
gerando pelo menos 2 padrões. Espere "prossiga".

═══════════════════════════════════════════════════════════════════════════
FASE 6 — UI UNIFICADA
═══════════════════════════════════════════════════════════════════════════

ANTES DE COMEÇAR ESTA FASE: ler /mnt/skills/public/frontend-design/SKILL.md
se este projeto consumir esse skill.

TELA: Feed de Insights (entrada principal)
──────────────────────────────────────────
Rota: `app/insights/index.tsx` (e botão visível no home dashboard).

Layout:
- Header com filtros (chips horizontais): Tudo / Saúde / Lembretes /
  Padrões / Marcos.
- Lista de cards de insights ordenados por:
  1. Severity desc (urgent > attention > consider > info).
  2. generated_at desc.
- Cada card mostra:
  - Ícone correspondente à categoria.
  - Title em destaque.
  - Body em texto regular.
  - Evidência expansível ("ver dados" → mostra related_entries com link).
  - Botões CTA conforme cta_type.
  - Botão "dispensar" sutil.
- Ao tocar no card: marca status='shown' (se ainda 'pending').
- Pull-to-refresh: dispara on-demand das Edge Functions relevantes.

TELA: Detalhe de Insight
───────────────────────
Rota: `app/insights/[id].tsx`.

- Title + body completo.
- Gráfico (se layer=4 e tem chart_data) — usar a lib confirmada na Fase 0.
- Evidência detalhada com referências a diary_entries (tap abre a entry).
- CTAs grandes.
- Histórico: insights anteriores da mesma category (mostra que isso é
  recorrente, não isolado).

TELA: Configurações de Proatividade
───────────────────────────────────
Rota: `app/settings/proactive.tsx`.

- 4 seções, uma por camada.
- Cada seção: toggle master + toggles por subcategoria.
- Sliders: max_insights_per_day (1-10), quiet_hours_start, quiet_hours_end.
- Botão "ver insights dispensados recentemente" (acesso a histórico).
- Botão "regenerar insights agora" (dispara on_demand).

INTEGRAÇÕES COM TELAS EXISTENTES:
- Home dashboard: card "Atenção do dia" mostra até 1 insight de severity
  >= 'consider'. Tap leva ao feed.
- Tela do pet (`app/pets/[id]/index.tsx`): seção "Insights recentes" com
  últimos 3 + link pro feed filtrado.
- Tela de viagem ativa (PR #2): se há insight ativo durante viagem, badge
  pequeno no topo. Insights gerados durante viagem têm prioridade.
- Diary entry creation: após criar uma entry, se o conteúdo aciona
  detecção de anomalia imediata (ex: tutor mencionou "vomitou" pela 3ª vez
  em 7 dias), insight aparece como banner na tela seguinte.

NOTIFICAÇÕES PUSH (apenas se infra existir — Discovery resolveu):
- Insights severity='attention' ou 'urgent' notificam imediatamente.
- 'consider' agregam até 1 notificação/dia, fora de quiet_hours.
- 'info' nunca notificam — só aparecem no feed.

ZERO `<TextInput>`. Filtros = chips. Configurações = toggles. Notas = voz.

I18N (pt-BR completo, outros 4 com placeholder em MISSING_TRANSLATIONS.md):
```
insights.feed.title
insights.feed.empty
insights.feed.filter.all
insights.feed.filter.health
insights.feed.filter.reminders
insights.feed.filter.patterns
insights.feed.filter.milestones
insights.card.dismiss
insights.card.see_evidence
insights.card.cta.open_consultation
insights.card.cta.log_diary
insights.card.cta.schedule_reminder
insights.card.cta.view_chart
insights.card.cta.open_vet_finder
insights.card.cta.monitor
insights.detail.title
insights.detail.evidence
insights.detail.history
insights.severity.info
insights.severity.consider
insights.severity.attention
insights.severity.urgent
insights.settings.title
insights.settings.layer1.title
insights.settings.layer1.description
insights.settings.layer2.title
insights.settings.layer2.description
insights.settings.layer3.title
insights.settings.layer3.description
insights.settings.layer4.title
insights.settings.layer4.description
insights.settings.max_per_day
insights.settings.quiet_hours.start
insights.settings.quiet_hours.end
insights.settings.regenerate_now
insights.settings.dismissed_history
insights.disclaimer.not_diagnosis            # SEMPRE visível em insights de saúde
```

DISCLAIMER PERMANENTE em insights de saúde, em fonte menor mas legível:
"Esta análise não substitui avaliação veterinária. Em caso de dúvida ou
sintoma persistente, consulte um veterinário."

═══════════════════════════════════════════════════════════════════════════
FASE 7 — TESTES MANUAIS GUIADOS
═══════════════════════════════════════════════════════════════════════════

Crie scripts de seed em `supabase/seeds/proactive_test_data.sql`:
- Pet 1: Mana (Chihuahua, 5 anos), 90 dias de diary entries com vacina
  vencendo em 5 dias, último banho há 30 dias.
- Pet 2: Pico (Border Collie, 3 anos), 365 dias de dados, com padrão de
  coceira reincidente em set-out de dois anos diferentes, mudança de
  marca de ração em mês X com cocô mole posterior.
- Pet 3: pet idoso com registros recentes de apatia.

Roteiro de validação manual:
- [ ] Rodar generate-deduced-reminders pra Mana: deve gerar 2-3 insights
      (vacina vencendo, banho atrasado).
- [ ] Rodar detect-pet-anomalies pro Pet 3: deve detectar mudança de humor.
- [ ] Simular previsão de 36°C: gera alerta de calor pra Mana mais
      conservador que pro Pico.
- [ ] Rodar generate-longterm-insights pro Pico: detecta sazonalidade de
      coceira E correlação com troca de ração.
- [ ] Tela de feed mostra todos os insights ordenados corretamente.
- [ ] Toggles de configurações silenciam categorias específicas e
      novos insights respeitam o opt-out.
- [ ] Dispensar um insight: não recriado nos próximos 14 dias.
- [ ] Insight de saúde: disclaimer visível, CTA "abrir consulta" presente.

═══════════════════════════════════════════════════════════════════════════
CHECKLIST FINAL DE ENTREGA
═══════════════════════════════════════════════════════════════════════════

- [ ] Discovery (Fase 0) executado e aprovado.
- [ ] Migration aplicada com 3 tabelas + RLS + índices + notify pgrst.
- [ ] Tipos TS gerados/atualizados.
- [ ] 5 Edge Functions deployadas com verify_jwt: false:
  - generate-deduced-reminders
  - compute-pet-baselines
  - detect-pet-anomalies
  - generate-contextual-insights
  - generate-longterm-insights
- [ ] Jobs/cron configurados (ou documentação clara se infra ainda não
      existir).
- [ ] Hooks React Query criados, padrão consistente com projeto.
- [ ] Tela de feed, detalhe e settings implementadas.
- [ ] Integrações no home, tela do pet, viagem ativa.
- [ ] pt-BR completo. Outros 4 com placeholder. MISSING_TRANSLATIONS.md
      atualizado, com flag em disclaimer médico-legal pra revisão humana.
- [ ] Logs de debug presentes em todas as Edge Functions, prefixos
      consistentes.
- [ ] Seed de teste + roteiro de validação manual passando.
- [ ] Sem `<TextInput>` em qualquer tela nova.
- [ ] Disclaimer médico-legal visível em insights de saúde.
- [ ] Custo estimado de IA por tutor/mês documentado e dentro do orçamento.
- [ ] Princípios não-negociáveis (ver topo) seguidos. Não diagnóstico,
      não substituição vet, tom medido, opt-in granular, privacidade,
      não overload.

═══════════════════════════════════════════════════════════════════════════
RESTRIÇÕES E GUARD-RAILS (REPETIDAS — VALEM SEMPRE)
═══════════════════════════════════════════════════════════════════════════

- NÃO modifique código fora do escopo do PR. Bug em código existente:
  anote em comentário e siga.
- NÃO remova debug logs existentes.
- NÃO crie abstrações novas (HOCs, contextos) a menos que estritamente
  necessário.
- NÃO troque libs em uso por equivalentes "melhores".
- NÃO otimize prematuramente.
- Em caso de DÚVIDA sobre padrão do projeto: PARE e pergunte ao Belisario.
  Não invente.
- Sem `<TextInput>` em telas novas. Voz, tap, ou input nativo do SO.
- pt-BR completo; outros 4 idiomas com placeholders + MISSING_TRANSLATIONS.md
  atualizado.
- Disclaimers médicos precisam revisão humana antes de go-live em todos
  os 5 idiomas.

═══════════════════════════════════════════════════════════════════════════
COMO ENTREGAR
═══════════════════════════════════════════════════════════════════════════

Ao fim de cada fase: relatório curto (10-20 linhas) com:
1. O que foi feito.
2. Decisões tomadas e por quê.
3. Coisas que não foram feitas e por quê.
4. Próximos passos / o que pretende fazer na próxima fase.
5. Bloqueios ou dúvidas pra resolver com Belisario.

Não una fases. Espere "prossiga" entre cada uma.

PR final: descrição clara, lista de arquivos, vídeo curto ou capturas
dos 3 fluxos principais (feed, detalhe, settings), custos observados
em testes, lista de testes manuais executados.

Em caso de bloqueio: PARE E PERGUNTE.
```

---

## Anexos opcionais (referência para Belisario, não obrigatório enviar pro Claude Code)

### A. Justificativas das decisões de modelo

- **Camada 1 majoritariamente sem LLM**: lembretes de vacina/vermífugo/banho são datas + cálculos. LLM aqui é desperdício de custo + latência + não-determinismo. Reservado pra "fraseado bonito" se necessário.
- **Camada 2 com Sonnet 4.6**: detecção de anomalia precisa de discernimento contextual ("comeu menos porque viajamos" vs "comeu menos sem motivo claro"). Sonnet acerta isso bem com custo razoável.
- **Camada 3 com Sonnet 4.6**: alerta contextual pede personalização (raça, porte, idade) mas é tarefa estruturada — não precisa de Opus.
- **Camada 4 com Opus 4.7**: análise de longo prazo cruza muitas variáveis e narrativas. Roda raramente (mensal por pet). Vale pagar Opus.

### B. Tópicos pra discussão antes do go-live

1. **Custo por tutor/mês**: depende muito de quantos pets e qual frequência. Estimativa inicial: $0.50-2.00/tutor/mês com as 4 camadas ativas. Vale rodar com 10 tutores beta antes de generalizar.
2. **Quem revisa disclaimers em outros idiomas**: contratar revisor humano pra es-MX, es-AR, en-US, pt-PT antes de ativar nesses locales.
3. **Política de incidente**: o que fazer se a IA gerar um insight enganoso que leva o tutor a uma decisão ruim? Documentar processo de feedback e correção.
4. **Métrica de sucesso**: tutores estão acionando os CTAs? Dispensando muito? Quantos insights por dia em média? Definir KPIs antes de lançar.

### C. Próximos PRs sugeridos depois deste

- **Camadas 5-8** (coach por raça, multi-pet, antecipação operacional, companhia emocional) — ordem sugerida no documento de proatividade original.
- **Painel de saúde do pet**: visualização gráfica de tendências (peso, alimentação, sono) com base em pet_baseline_metrics.
- **Sistema de notificação push** (se ainda não existir).
- **Integração com PR #2b**: insights que sugerem "abrir vet finder" levam direto pro mapa do PR #2b.
- **Compartilhamento com co-tutor (Anita)**: insights aparecem pros dois tutores, dispensar é compartilhado.
