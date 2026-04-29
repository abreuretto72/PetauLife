# Prompt para Claude Code — IA Proativa do Pet (Camadas 5-8)

> **Pré-requisito:** as Camadas 1-4 devem estar implementadas e em produção (ver `prompt_claude_code_ia_proativa.md`). Este PR estende o módulo, reusando schema (`pet_insights`, `pet_baseline_metrics`, `pet_proactive_settings`) e infra (Edge Functions, jobs, feed UI).
>
> **Como usar:** copie a seção "PROMPT PARA O CLAUDE CODE" abaixo e cole na sua sessão do Claude Code. Os anexos no final são para sua referência (Belisario).

---

## PROMPT PARA O CLAUDE CODE

```
Você vai implementar as Camadas 5 a 8 do módulo de IA Proativa do Pet no
auExpert. As Camadas 1-4 JÁ existem em produção — você ESTENDE essa infra,
não recria.

═══════════════════════════════════════════════════════════════════════════
CONTEXTO E PRÉ-REQUISITOS
═══════════════════════════════════════════════════════════════════════════

Antes de qualquer coisa, leia este código que JÁ EXISTE:
- supabase/migrations/ — onde estão pet_insights, pet_baseline_metrics,
  pet_proactive_settings.
- supabase/functions/generate-deduced-reminders, compute-pet-baselines,
  detect-pet-anomalies, generate-contextual-insights, generate-longterm-
  insights — Edge Functions das Camadas 1-4.
- src/hooks/usePetInsights.ts e arquivos relacionados.
- app/insights/index.tsx, app/insights/[id].tsx, app/settings/proactive.tsx
- src/types/insights.ts e src/constants/insights.ts.

ESTE PR ESTENDE essa infra com 4 camadas novas. NÃO duplique tabelas, hooks
ou telas — REUSE. Quando fizer sentido criar nova categoria de insight,
encaixe no schema existente (`layer` nova vai de 5 a 8 no campo já existente
— sim, o check constraint precisará ser atualizado; faça isso com migration
explícita).

CONVENÇÕES OBRIGATÓRIAS (já consolidadas no projeto):
- Edge Functions com `verify_jwt: false`.
- FKs em `public.users`, NÃO `auth.users`.
- DIARY_MODULE_SELECT usa `select('*')`; FKs múltiplas pra mesma tabela
  usam constraint-name explícita.
- `notify pgrst, 'reload schema';` após mudanças de schema.
- Logs de debug permanecem até bugs visualmente confirmados.
- ZERO `<TextInput>` em telas novas. Voz, tap, ou input nativo do SO.
- Lente cards usam `extracted_data` como fonte primária.

Supabase project_id: peqpkzituzpwukzusgcq

═══════════════════════════════════════════════════════════════════════════
OBJETIVO DESTE PR
═══════════════════════════════════════════════════════════════════════════

Avançar do "diário inteligente" para "co-tutor verdadeiro". As 4 camadas:

CAMADA 5 — Coach pessoal por raça/idade/condição: orientação personalizada
combinando perfil do pet com conhecimento veterinário geral.

CAMADA 6 — Consciência multi-pet e multi-tutor: insights que percebem que
o tutor tem mais de um pet (Mana e Pico) OU que há co-tutoria (Anita).

CAMADA 7 — Antecipação prática (pet ops): estoque, documentação, viagens,
preparo de consulta — IA antecipa operação do dia a dia.

CAMADA 8 — Companhia emocional (com cuidado): marcos afetivos, doença
crônica, luto. A camada mais sensível — guard-rails extras.

═══════════════════════════════════════════════════════════════════════════
ESCOPO DETALHADO POR CAMADA
═══════════════════════════════════════════════════════════════════════════

CAMADA 5 — Coach pessoal por raça/idade/condição
─────────────────────────────────────────────────
A IA combina perfil do pet com conhecimento veterinário/comportamental
geral para sugerir cuidados específicos.

Subcategorias:
- Comportamental por raça: Border Collie precisa estimulação mental;
  Bulldog precisa atenção a respiração no calor; etc.
- Saúde preditiva por raça: predisposições conhecidas (Chihuahua →
  problemas dentários após 5 anos; Golden → displasia coxofemoral; gatos
  Persas → doença renal policística).
- Fase de vida: filhote, jovem, adulto, sênior, geriátrico — cada uma com
  recomendações específicas.
- Pós-procedimento: cirurgia, internação, doença aguda — sinais a observar
  nas primeiras semanas.
- Treinamento sugerido: tutor registrou comportamento desafiador (puxa
  coleira, late muito, ansiedade de separação) → sugestões práticas + se
  PR #2b existe, indicação de adestrador na região.

LIMITAÇÃO IMPORTANTE: o conhecimento da IA sobre raças/condições é
generalista. NÃO é substituto de consulta especializada. Disclaimer
permanente em todo insight da Camada 5.

CAMADA 6 — Consciência multi-pet e multi-tutor
─────────────────────────────────────────────────
DEPENDÊNCIA CRÍTICA: este PR pode requerer extensão do schema para suportar
múltiplos tutores por pet. Discovery (Fase 0) precisa resolver isso ANTES
de prosseguir.

Subcategorias:
- Comparação saudável entre pets do mesmo tutor: Mana caminhou metade do
  Pico — normal pra porte/idade dela, mas vale conferir.
- Vacinas/consultas em janelas próximas: agrupar visitas ao vet para
  economizar tempo do tutor.
- Coordenação multi-tutor (co-tutoria): "Anita registrou que Pico já comeu
  hoje. Não precisa repetir." — evita duplicação de cuidado.
- Distribuição de carga: "Você passeou 5 dias seguidos com Mana. Quer que
  eu pergunte pra Anita?"
- Padrões diferentes entre tutores: dado registrado por tutor A vs tutor B
  — pet pode comportar-se diferente conforme quem está com ele (útil para
  notar problema potencial ou só padrão social).

REGRA: se o pet só tem 1 tutor, subcategorias multi-tutor não disparam (não
mostrar mensagem genérica nem sugerir "convide co-tutor"). Se o tutor só
tem 1 pet, subcategorias multi-pet não disparam.

CAMADA 7 — Antecipação prática (pet ops)
─────────────────────────────────────────────────
DEPENDÊNCIA: integração mais rica se PR #2b (diretório de serviços) existir
em produção. Se não existir, alguns CTAs ficam desabilitados — IA mostra
o alerta mas não "abre pet shop". Discovery resolve.

Subcategorias:
- Estoque inteligente: ração, areia de gato, medicação contínua, antipulgas
  — aviso quando próximo de acabar baseado em padrão de consumo + estoque
  informado.
- Documentação preventiva: viagem em 45 dias detectada (módulo de viagem
  cria trip em status `planning`) → IA verifica se vacina antirrábica está
  válida pra entrada em destinos exigentes; se não, alerta.
- Antecipação de viagem: 60 dias antes de start_date, sugerir começar
  preparação. Tutor pode aceitar ou postergar.
- Rebalanceamento de rotina: tutor mencionou em diary que vai trabalhar
  mais → sugerir contatos de passeador/creche (PR #2b se existir).
- Preparo de consulta vet: véspera de consulta agendada (trip_consultations
  ou diary entry) → IA gera resumo do que aconteceu desde última consulta
  + perguntas sugeridas baseadas em padrões.
- Renovação de receitas: medicação contínua precisando de receita médica
  renovada antes de acabar.

CAMADA 8 — Companhia emocional (camada sensível, guard-rails extras)
─────────────────────────────────────────────────
ATENÇÃO: ESTA CAMADA REQUER REVISÃO HUMANA EM TODOS OS PROMPTS, EM TODOS OS
5 IDIOMAS, ANTES DE QUALQUER ATIVAÇÃO EM PRODUÇÃO. Não basta o disclaimer —
o tom em si é parte do produto.

Subcategorias:
- Marcos afetivos positivos: 1 ano da adoção, primeiro aniversário juntos,
  primeiro dia de lar (foto comparativa antes/depois). Tom: leve,
  celebrativo, NUNCA piegas, NUNCA com excesso de emojis.
- Doença crônica diagnosticada: pet com diagnóstico recente registrado.
  Modo "acompanhamento atento": tom diferente, sem positivismo forçado,
  sugestões práticas, recursos de apoio.
- Dificuldade temporária do tutor: detecta em diary entries quando o tutor
  expressa angústia, cansaço, sobrecarga. Não invasivo — apenas reconhece
  e oferece (não impõe) suporte: "Cuidar é difícil às vezes. Quer registrar
  o que está sentindo? Ou dicas pra dias difíceis?"
- Modo luto: SE o pet falecer (campo `deceased_at` na tabela `pets`, ou
  detectado por diary entries explícitas), o app TRANSFORMA-SE:
  * Notificações proativas SUSPENSAS imediatamente.
  * Lembretes de vacina/banho/etc. SUSPENSOS.
  * Tela do pet vira modo memorial (não "registre um momento hoje").
  * Oferece (uma única vez, com extremo cuidado) criação de "livro de
    memórias" — compilação da vida do pet.
  * Aniversários póstumos (1 ano, 2 anos) lembrados com leveza extrema —
    e SEMPRE com opção de "não me lembrar disso".
- Modo eutanásia em discussão: vet sugeriu eutanásia em consulta recente.
  Tom: máximo respeito, recursos de apoio, NUNCA opinião sobre a decisão.

PRINCÍPIOS DA CAMADA 8 (não negociáveis):
- A IA NÃO é amiga, NÃO finge empatia que não tem. Reconhece o que o
  tutor disse e oferece ferramentas concretas — sem teatro emocional.
- ZERO emojis em insights de luto, doença grave, ou sobrecarga
  emocional. Esses são contextos onde emoji vira ofensa.
- Sempre opcional: o tutor pode dizer "não me lembre" e a IA respeita
  permanentemente para aquele tema.
- Em luto: NUNCA sugerir "adquirir outro pet". JAMAIS. Mesmo se tutor
  perguntar diretamente, IA redireciona pra recursos profissionais.
- Disclaimer específico em saúde grave: "auExpert não substitui apoio
  profissional. Em sofrimento intenso, [recurso local de saúde mental
  pet, se existir, ou genérico]."

═══════════════════════════════════════════════════════════════════════════
PRINCÍPIOS NÃO-NEGOCIÁVEIS (recapitulando + adições para Camadas 5-8)
═══════════════════════════════════════════════════════════════════════════

(Mantém os 6 das Camadas 1-4: nunca diagnosticar, nunca substituir vet,
tom medido, opt-in granular, privacidade, não overload.)

ADIÇÕES PARA AS CAMADAS 5-8:

7. Conhecimento generalista da IA tem limites. Em insights da Camada 5
   (raça/condição), SEMPRE incluir frase tipo "Características gerais da
   raça/idade. Cada pet é único — observe seu pet e converse com vet."

8. Multi-tutor exige consentimento. Co-tutor só vê insights compartilhados
   se ambos os tutores opt-in pelo compartilhamento. Default: privado.

9. Camada 8 tem revisão humana obrigatória de todos os prompts em todos os
   5 idiomas antes de qualquer ativação. Sem isso, módulo fica desativado
   por feature flag.

10. Em luto: o app tem o DEVER de respeitar. Insights desse contexto
    NUNCA são triggados por job — são SEMPRE acionados por evento explícito
    (tutor marcou pet como `deceased`) ou por pedido direto do tutor.

11. Recursos externos referenciados em insights de saúde mental devem ser
    apropriados ao país do tutor. Discovery resolve quais recursos para
    pt-BR; outros locales ficam com placeholder até revisão regional.

═══════════════════════════════════════════════════════════════════════════
ENTREGA EM FASES (DENTRO DESTE PR)
═══════════════════════════════════════════════════════════════════════════

Fases mais longas que o PR anterior por causa da Camada 8 e da dependência
multi-tutor. PARE entre cada fase.

FASE 0 — Discovery (PARE AO FIM)
FASE 1 — Schema (extensões + multi-tutor se necessário)
FASE 2 — Camada 5 (coach por raça/idade/condição)
FASE 3 — Camada 6 (multi-pet e multi-tutor)
FASE 4 — Camada 7 (pet ops)
FASE 5 — Camada 8 (companhia emocional) — SUBDIVIDIDA
FASE 6 — UI: extensões no feed + tela memorial + settings novos
FASE 7 — Testes manuais guiados + checklist final

═══════════════════════════════════════════════════════════════════════════
FASE 0 — DISCOVERY
═══════════════════════════════════════════════════════════════════════════

REPORTE em 20-30 linhas cobrindo:

1. Schema multi-tutor: existe `pet_co_tutors`, `pet_shares`, ou tabela
   junction parecida? Se NÃO existe:
   - Listar como dependência crítica.
   - Propor design mínimo: tabela `pet_tutors (pet_id, tutor_id, role,
     accepted_at)` com roles 'primary' / 'co_tutor'.
   - DECISÃO: criar como parte deste PR ou bloquear até PR dedicado?
     (Recomendação: incluir versão mínima neste PR pra desbloquear
     Camada 6, mas marcar como "schema preliminar" — refinar em PR
     próprio depois.)

2. Estado do PR #2b (diretório de serviços pet): em produção? Beta? Não
   começou? Lista de Edge Functions e tabelas dele que existem hoje.
   - Se em produção: integrar livremente.
   - Se beta: integrar com feature flag.
   - Se não existe: marcar todos os CTAs dependentes como "TODO #2b" e
     mostrar insight sem CTA na UI.

3. Estado do módulo de viagem (PRs #1, #2, #3, #4): quais fases estão
   em produção? Camada 7 depende fortemente de `trips`, `trip_pets`,
   `trip_consultations`.

4. Tabela `pets` — campos relevantes pra Camada 8:
   - Existe `deceased_at`? Se não, propor adicionar.
   - Existe `chronic_conditions` ou similar? Se não, listar como
     dependência (pode estar em diary_entries com lente específica).

5. Sistema de feature flags: como ativar Camada 8 só pra testers? Já
   existe?

6. Recursos de apoio em pt-BR para saúde mental + luto pet: pesquisar
   organizações brasileiras (associações de medicina veterinária,
   serviços de luto pet específicos). Listar 2-3 candidatos para
   referenciar nos insights.

7. Custos estimados:
   - Camada 5 com Opus 4.7 quanto custa por execução? Quantas execuções
     por pet por mês esperadas?
   - Camada 8 (eventos raros) custo desprezível, mas validar.

8. Código existente das Camadas 1-4: confirmar que extends bem. Listar
   pontos de integração: feed UI, tela do pet, hooks.

NÃO PROSSIGA SEM CONFIRMAÇÃO ("Belisario disse: prossiga").

═══════════════════════════════════════════════════════════════════════════
FASE 1 — SCHEMA
═══════════════════════════════════════════════════════════════════════════

Migration única. Aplicar via MCP do Supabase ou arquivo, conforme padrão
do projeto.

A. ATUALIZAR pet_insights.layer constraint:
```sql
alter table public.pet_insights drop constraint if exists pet_insights_layer_check;
alter table public.pet_insights add constraint pet_insights_layer_check
  check (layer between 1 and 8);
```

B. ATUALIZAR pet_proactive_settings com novos toggles:
```sql
alter table public.pet_proactive_settings
  add column if not exists layer5_enabled boolean not null default true,
  add column if not exists layer5_categories jsonb not null default '{
    "breed_behavior": true,
    "breed_health_predisposition": true,
    "life_phase": true,
    "post_procedure": true,
    "training_suggestions": true
  }'::jsonb,
  add column if not exists layer6_enabled boolean not null default true,
  add column if not exists layer6_categories jsonb not null default '{
    "multi_pet_comparison": true,
    "multi_pet_consolidation": true,
    "co_tutor_coordination": true,
    "co_tutor_distribution": true
  }'::jsonb,
  add column if not exists layer7_enabled boolean not null default true,
  add column if not exists layer7_categories jsonb not null default '{
    "stock_management": true,
    "preventive_documentation": true,
    "trip_anticipation": true,
    "routine_rebalance": true,
    "vet_consultation_prep": true,
    "prescription_renewal": true
  }'::jsonb,
  add column if not exists layer8_enabled boolean not null default false,
  add column if not exists layer8_categories jsonb not null default '{
    "affective_milestones": true,
    "chronic_disease": true,
    "tutor_difficulty": false,
    "memorial_mode": true,
    "euthanasia_discussion": true
  }'::jsonb;
```

NOTAS sobre defaults:
- layer8_enabled DEFAULT FALSE — opt-in explícito por causa da
  sensibilidade. Tutor ativa nas settings.
- tutor_difficulty DEFAULT FALSE dentro da Camada 8 — padrão é não detectar
  dificuldade emocional do tutor. Tutor opt-in se quiser.

C. PETS: adicionar campos de saúde/luto se não existirem:
```sql
alter table public.pets
  add column if not exists deceased_at timestamptz,
  add column if not exists deceased_cause text,
  add column if not exists chronic_conditions jsonb default '[]'::jsonb;
  -- formato: [{"condition": "doença renal crônica", "diagnosed_at":
  --   "2024-08-12", "notes": "..."}]

create index if not exists idx_pets_deceased on public.pets(deceased_at)
  where deceased_at is not null;
```

D. MULTI-TUTOR (se Discovery indicou que precisa):
```sql
create table if not exists public.pet_tutors (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  tutor_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('primary', 'co_tutor')) default 'co_tutor',
  invited_by uuid references public.users(id),
  invited_at timestamptz,
  accepted_at timestamptz,
  share_insights boolean not null default false,
  created_at timestamptz not null default now(),
  unique (pet_id, tutor_id)
);

create index idx_pet_tutors_pet on public.pet_tutors(pet_id);
create index idx_pet_tutors_tutor on public.pet_tutors(tutor_id);

-- RLS
alter table public.pet_tutors enable row level security;

create policy "pet_tutors_self_or_pet_owner" on public.pet_tutors
  for select using (
    tutor_id = auth.uid()
    or exists (select 1 from public.pets p where p.id = pet_id and p.tutor_id = auth.uid())
  );
create policy "pet_tutors_pet_owner_manages" on public.pet_tutors
  for all using (
    exists (select 1 from public.pets p where p.id = pet_id and p.tutor_id = auth.uid())
  ) with check (
    exists (select 1 from public.pets p where p.id = pet_id and p.tutor_id = auth.uid())
  );
```

NOTA: a tabela `pets` continua tendo `tutor_id` apontando pro tutor
PRIMÁRIO. `pet_tutors` é a relação completa (incluindo o primário, pra
unificar consultas). NÃO migre os pets existentes ainda — fazer no PR
dedicado de multi-tutor depois.

E. TABELA pet_lifecycle_events: marcos importantes pra Camada 8.
```sql
create table public.pet_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references public.pets(id) on delete cascade,
  tutor_id uuid not null references public.users(id) on delete cascade,
  event_type text not null check (event_type in (
    'adoption', 'birthday', 'first_year_anniversary',
    'chronic_diagnosis', 'major_surgery', 'recovery',
    'euthanasia_discussion', 'deceased', 'memorial_anniversary'
  )),
  event_date date not null,
  notes text,
  related_diary_entry uuid references public.diary_entries(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_pet_lifecycle_pet on public.pet_lifecycle_events(pet_id);
create index idx_pet_lifecycle_date on public.pet_lifecycle_events(event_date);

alter table public.pet_lifecycle_events enable row level security;

create policy "pet_lifecycle_owner" on public.pet_lifecycle_events
  for all using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());
```

F. TABELA dismissal_persistence: tutor disse "nunca mais" pra um tipo de
insight — registro permanente.
```sql
create table public.insight_silenced_categories (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.users(id) on delete cascade,
  pet_id uuid references public.pets(id) on delete cascade,
  category text not null,
  subcategory text,
  silenced_until timestamptz,  -- null = permanente
  reason text,
  created_at timestamptz not null default now(),
  unique (tutor_id, pet_id, category, subcategory)
);

create index idx_insight_silenced_tutor on public.insight_silenced_categories(tutor_id);

alter table public.insight_silenced_categories enable row level security;

create policy "insight_silenced_owner" on public.insight_silenced_categories
  for all using (tutor_id = auth.uid()) with check (tutor_id = auth.uid());
```

NECESSÁRIA pra Camada 8: se tutor disser "não me lembre desse aniversário",
entrada permanente aqui evita recriação.

```sql
notify pgrst, 'reload schema';
```

PARE AO FIM DA FASE 1. Reporte tabelas atualizadas + criadas, RLS
aplicado, tipos TS regenerados. Espere "prossiga".

═══════════════════════════════════════════════════════════════════════════
FASE 2 — CAMADA 5 (COACH POR RAÇA/IDADE/CONDIÇÃO)
═══════════════════════════════════════════════════════════════════════════

EDGE FUNCTION: generate-breed-coaching-insights
───────────────────────────────────────────────
Em supabase/functions/generate-breed-coaching-insights/index.ts.
verify_jwt: false. Roda mensalmente por pet (cron) + sob demanda.

Recebe: { pet_id, tutor_id, trigger: 'scheduled' | 'on_demand' }

Fluxo:
1. Carrega perfil do pet: species, breed, age, weight, sex, neutered,
   chronic_conditions.
2. Carrega histórico recente (90 dias) de diary_entries pra contexto.
3. Verifica insight_silenced_categories — pula categorias silenciadas.
4. Chama Opus 4.7 com prompt rico (ver abaixo).
5. Cria insights com layer=5.

PROMPT (Opus 4.7):
```
Você é assistente de cuidado pet para tutores brasileiros. Gere até 3
sugestões PRÁTICAS de cuidado baseadas no perfil do pet.

Pet:
- Espécie: {species}
- Raça: {breed}
- Idade: {age_in_years} anos
- Peso: {weight_kg} kg
- Sexo: {sex}, castrado: {neutered}
- Condições crônicas: {chronic_conditions or "nenhuma registrada"}

Contexto recente (últimos 90 dias):
{recent_diary_summary}

Categorias possíveis (priorize as mais relevantes pro pet específico):
- breed_behavior: comportamento típico da raça e como atender
- breed_health_predisposition: predisposições conhecidas + sinais a observar
- life_phase: cuidados específicos da fase de vida atual
- post_procedure: se houve cirurgia/procedimento recente
- training_suggestions: se há comportamento desafiador no diário

REGRAS ABSOLUTAS:
- NUNCA diagnostique. Use linguagem como "predisposição da raça", "vale
  observar", "sinais que merecem atenção".
- INCLUA sempre na body: "Características gerais da raça/idade. Cada pet
  é único — observe e converse com vet."
- Tom: assistente competente, NÃO amigão. Sem emojis exceto se realmente
  cabível (raríssimo).
- Sugestões CONCRETAS, não genéricas. "Inclua brincadeira de inteligência
  20min/dia" e não "estimule mentalmente".
- Se já recomendou algo similar nos últimos 60 dias (verificar histórico
  de pet_insights), VARIE — não repita o mesmo conselho.
- Pt-BR.

Retornar APENAS JSON:
{
  "insights": [
    {
      "category": "breed_behavior" | "breed_health_predisposition" |
                  "life_phase" | "post_procedure" | "training_suggestions",
      "subcategory": "string específica (ex: 'mental_stimulation',
                     'dental_health', 'senior_joint_care')",
      "title": "frase 4-8 palavras",
      "body": "1-3 frases incluindo o disclaimer obrigatório",
      "severity": "info" | "consider",
      "cta_type": "log_diary" | "open_consultation" | "view_resources" |
                  "open_pet_finder" | "monitor",
      "evidence_summary": "por que sugerimos isso pra este pet"
    }
  ]
}
```

DEDUPLICAÇÃO:
- Antes de inserir, verificar se há insight pendente da mesma
  category+subcategory criado < 60 dias atrás. Se sim, pular.

LOGS: prefixo [generate-breed-coaching-insights]. Logar pet_id, breed,
quantos insights criados, quanto custou em tokens.

PARE AO FIM DA FASE 2. Demonstre: rodar pra Pico (Border Collie 3 anos)
e Mana (Chihuahua 5 anos) gera sugestões claramente diferentes e adequadas
às raças. Espere "prossiga".

═══════════════════════════════════════════════════════════════════════════
FASE 3 — CAMADA 6 (MULTI-PET E MULTI-TUTOR)
═══════════════════════════════════════════════════════════════════════════

EDGE FUNCTION: generate-multi-pet-tutor-insights
────────────────────────────────────────────────
Em supabase/functions/generate-multi-pet-tutor-insights/index.ts.
verify_jwt: false. Roda semanalmente (cron) por tutor.

Recebe: { tutor_id, trigger }

Fluxo:
1. Determina escopo do tutor:
   - Quantos pets tem? (1 → pula subcategorias multi-pet)
   - Quantos co-tutores tem? (0 → pula subcategorias multi-tutor)
2. MULTI-PET: para cada par de pets do mesmo tutor, comparar atividade
   recente (consultar pet_baseline_metrics):
   - Diferença significativa em walks_per_week ou meals_per_day?
   - Vacinas/consultas em janelas próximas (consolidação)?
3. MULTI-TUTOR: se há co-tutores ativos:
   - Verificar registros recentes de cada tutor.
   - Detectar duplicação (refeição registrada 2x próxima a mesma hora).
   - Detectar desbalanço de carga (1 tutor faz tudo nos últimos N dias).

LÓGICA:
- Comparações por regra estatística (sem LLM).
- LLM (Sonnet 4.6) usado APENAS pra frasear o insight de forma adequada
  ao contexto, sem soar acusatório/competitivo.

PROMPT (Sonnet 4.6, frasear):
```
Gere insight pt-BR sobre coordenação entre tutores ou comparação saudável
entre pets.

Dados:
{evidence_json}

REGRAS:
- Tom NEUTRO. Nunca acusatório ("você está deixando o Pico de lado") ou
  competitivo ("a Mana está pior").
- Comparações multi-pet: enquadrar como "vale conferir", não "é problema".
- Desbalanço multi-tutor: enquadrar como ferramenta de coordenação, não
  como cobrança.
- Se a diferença é facilmente explicável (Mana é mais velha, dorme mais
  por isso) — incluir essa nuance no body.

Retornar JSON:
{
  "title": "frase curta",
  "body": "1-3 frases, neutro",
  "severity": "info" | "consider",
  "cta_type": "log_diary" | "schedule_reminder" | "share_with_co_tutor"
}
```

CONSENTIMENTO:
- Insights que envolvem co-tutor SÓ são compartilhados se ambos
  tutorpet_tutors.share_insights = true.
- Default false. Tutor liga manualmente.

PARE AO FIM DA FASE 3. Demonstre: tutor com Mana e Pico, comparação
gera insight neutro. Tutor com co-tutor (Belisario + Anita): consolidação
de vacinas é detectada. Espere "prossiga".

═══════════════════════════════════════════════════════════════════════════
FASE 4 — CAMADA 7 (PET OPS)
═══════════════════════════════════════════════════════════════════════════

EDGE FUNCTION: generate-pet-ops-insights
────────────────────────────────────────
Em supabase/functions/generate-pet-ops-insights/index.ts. verify_jwt:
false. Roda diariamente.

Recebe: { tutor_id, trigger }

Subcategorias e lógica:

1. STOCK_MANAGEMENT:
   - Cruzar peso do pet × kg/dia esperado de ração (ou input direto do
     tutor) com estoque informado/detectado.
   - Aviso 5 dias antes de acabar.
   - CTA: se PR #2b existe e há pet shop ao redor, "open_vet_finder?cat=
     pet_shop". Senão, só lembrete.

2. PREVENTIVE_DOCUMENTATION:
   - Se trip está em status `planning` ou `preparing`, verificar pré-
     requisitos do destino (reusar useTravelRules do PR #1).
   - Cruzar com vacinas/exames do pet — alertar lacunas com 60d, 30d, 7d
     de antecedência.
   - CTA: open_consultation, ou abrir checklist da viagem (módulo PR #1).

3. TRIP_ANTICIPATION:
   - 60 dias antes de trip.start_date com status `planning`, sugerir
     começar preparação.
   - Severity: info aos 60d, consider aos 30d, attention aos 14d.

4. ROUTINE_REBALANCE:
   - Tutor escreveu em diary algo como "vou ter mais reuniões", "tô viajando
     muito a trabalho" → IA detecta e sugere passeador/creche se PR #2b
     tem essas categorias.
   - Esta detecção exige LLM (Sonnet 4.6) pra entender contexto.

5. VET_CONSULTATION_PREP:
   - Véspera de consulta vet (trip_consultations.scheduled_at OU
     diary_entry com lente 'consultation_scheduled') → IA gera resumo
     do que aconteceu desde última consulta + perguntas sugeridas.
   - Output rico: lista de tópicos pra discutir, dados que mudaram,
     sintomas observados.
   - Use Opus 4.7 (qualidade narrativa importa) — roda só nas vésperas,
     custo controlado.

6. PRESCRIPTION_RENEWAL:
   - Medicação contínua com receita registrada → alertar 7d antes da
     receita atual expirar (se tutor informou data) ou 7d antes da
     medicação acabar (precisa receita pra comprar mais).

INTEGRAÇÃO COM PR #2b:
- Antes de gerar CTA "open_pet_shop", verificar feature flag/existência
  do PR #2b. Se ausente, criar insight com CTA genérico
  "schedule_reminder".

LOGS: [generate-pet-ops-insights]. Logar quais subcategorias dispararam
para qual pet.

PARE AO FIM DA FASE 4. Demonstre: pet com viagem em 45 dias e vacina
antirrábica vencendo dispara insight de documentação preventiva. Tutor
com consulta vet amanhã recebe resumo bem feito. Espere "prossiga".

═══════════════════════════════════════════════════════════════════════════
FASE 5 — CAMADA 8 (COMPANHIA EMOCIONAL) — A MAIS SENSÍVEL
═══════════════════════════════════════════════════════════════════════════

DIVIDIR EM SUB-FASES. PARE entre cada uma.

FASE 5a — MARCOS AFETIVOS POSITIVOS
─────────────────────────────────────
Mais leve, comece por aqui.

EDGE FUNCTION: generate-affective-milestones
verify_jwt: false. Roda diariamente.

Categorias:
- 1 ano de adoção (pets.adoption_date + 365d)
- Aniversário N (pets.date_of_birth + N×365d)
- N meses juntos (a cada 6 meses do adoption_date, primeiros 2 anos)

LÓGICA:
- 7 dias antes do marco, criar insight severity=info, cta_type=
  'create_memory_post' (botão pra criar diary entry com prompt).
- Verificar insight_silenced_categories — tutor pode ter dito "não me
  lembre desse aniversário".
- Verificar pets.deceased_at — se preenchido, NÃO disparar marcos
  positivos (vai pra modo memorial).

PROMPT MÍNIMO (Sonnet 4.6):
```
Marco afetivo:
{milestone_type}: {milestone_label}
Pet: {pet_name}, {breed}.
Tempo juntos: {duration}

Gere mensagem em pt-BR para o tutor.

REGRAS:
- Tom: leve, sincero, NUNCA piegas.
- ZERO emojis exceto se essencial (regra: usar 0 emojis por padrão).
- Curta: 1-2 frases.
- Sem "celebrar com sua família peluda" e similares cringe.
- Bom exemplo: "Mana faz 6 anos amanhã. Que tal registrar uma foto
  do dia?"
- Mau exemplo: "🐾✨ Hoje é um dia ESPECIAL! Sua bebê peluda tá
  fazendo aninho 🎂🎉"

Retornar JSON: { "title": "...", "body": "..." }
```

PARE AO FIM DA FASE 5a. Mostre 3 exemplos de mensagens geradas pra 3
pets diferentes. Belisario VAI revisar texto e tom.

FASE 5b — DOENÇA CRÔNICA E EUTANÁSIA EM DISCUSSÃO
─────────────────────────────────────────────────
Trigger: pet.chronic_conditions é populado (manualmente pelo tutor ou via
diary com lente 'diagnosis') OU lifecycle event 'euthanasia_discussion'.

EDGE FUNCTION: generate-chronic-care-insights
verify_jwt: false. Roda mensalmente.

Categorias:
- chronic_disease: orientação geral sobre acompanhamento da condição.
- euthanasia_discussion: oferecer recursos, NUNCA opinião.

PROMPT (Opus 4.7 — sensibilidade requer melhor qualidade):
```
Pet: {pet_name}, {breed}, {age}.
Condição crônica registrada: {condition} desde {diagnosed_at}.
Notas: {notes}.

Tarefa: gerar insight de acompanhamento mensal em pt-BR.

REGRAS ABSOLUTAS:
- ZERO positivismo forçado. NÃO escreva "vocês vão superar isso!"
- ZERO emojis. Sem exceção.
- Tom: profissional, atento, respeitoso.
- Conteúdo: sinais a observar específicos da condição, sugestões práticas
  de monitoramento, reforço de manter contato com vet especializado.
- Sempre INCLUIR: "auExpert não substitui acompanhamento veterinário.
  Em dúvida ou piora, contate o vet."
- Se condição é avançada/terminal: tom AINDA mais cuidadoso. Reconhecer
  dificuldade. Oferecer recurso de apoio (referenciado no Discovery).
- NUNCA sugerir tratamentos específicos.
- NUNCA opinar sobre eutanásia se a categoria for euthanasia_discussion.
  Apenas reconhecer + oferecer recurso de apoio.

Retornar JSON:
{
  "title": "...",
  "body": "...",
  "support_resources": ["nome do recurso 1", ...],
  "severity": "info" | "consider" | "attention"
}
```

VALIDAÇÃO HUMANA:
- Os primeiros 20 insights gerados desta categoria FICAM EM REVISÃO
  (status='pending_review' em vez de 'pending'). Belisario aprova
  antes de virarem visíveis pro tutor. Tela de admin simples para isso.

PARE AO FIM DA FASE 5b. Espere revisão de Belisario antes de prosseguir.

FASE 5c — MODO LUTO
─────────────────────────────
Trigger: pets.deceased_at é preenchido (tutor marca no perfil do pet).

ESTA NÃO É UMA EDGE FUNCTION — é uma TRANSFORMAÇÃO DE ESTADO DO APP.
Quando deceased_at fica não-null:

1. Trigger SQL ou função pós-update suspende automaticamente:
   - layer1_enabled, layer2_enabled, layer3_enabled, layer5_enabled,
     layer7_enabled = false PARA AQUELE PET especificamente.
   - Insights pendentes daquele pet são marcados como expired.
   - Reminders agendados são cancelados.

2. Cria UM ÚNICO insight cuidadoso, layer=8, category='memorial_mode',
   severity='info' (não notifica push), com tom EXTREMAMENTE medido.

PROMPT (Opus 4.7, USO ÚNICO):
```
Tutor marcou que {pet_name} faleceu em {deceased_at}.
Tempo de vida do pet com o tutor: {duration}.

Tarefa: gerar mensagem ÚNICA de reconhecimento em pt-BR.

REGRAS ABSOLUTAS (essas serão revisadas por humano antes de qualquer
ativação):
- 2-3 frases, no MÁXIMO.
- Tom: simples, respeitoso, humano.
- ZERO emojis. ZERO emoji. Se incluir um emoji, é ofensa.
- NÃO use "anjo", "ponte do arco-íris", "agora descansa em paz", "estará
  sempre com você no coração" e similares clichês.
- NÃO sugira nada de ação imediata.
- NÃO mencione adquirir outro pet.
- NÃO prometa que "a dor passa".
- Você PODE oferecer (no fim, opcionalmente): "Quando quiser, podemos
  guardar memórias de {pet_name} aqui."
- Você PODE incluir 1 recurso de apoio (referenciado no Discovery).

Retornar JSON: { "body": "..." }
```

3. App muda visualmente para o pet:
   - Tela do pet: cabeçalho discreto "Em memória de {pet_name}".
   - Sem prompts de "registrar momento".
   - Acesso ao histórico completo: SIM. Tutor pode revisitar a qualquer
     momento.
   - Botão "Criar livro de memórias" — visível, mas NÃO insistente.
     Aparece UMA VEZ no insight inicial. Depois fica em settings.

4. Aniversários póstumos (1 ano, 2 anos, 5 anos, 10 anos):
   - Aviso 7 dias antes, com tom: "Faz quase 1 ano que {pet_name}
     partiu. Se quiser, podemos revisitar memórias juntas."
   - SEMPRE com botão sutil "não me lembrar disso" → adiciona em
     insight_silenced_categories permanentemente.

PARE AO FIM DA FASE 5c. Belisario VAI revisar todos os textos linha
por linha. Não pode haver pressa aqui.

FASE 5d — DIFICULDADE TEMPORÁRIA DO TUTOR (OPT-IN, default OFF)
─────────────────────────────────────────────────────────
Esta subcategoria começa DESLIGADA por padrão. Tutor liga em settings se
quiser. Mesmo ligada, é cautelosa.

EDGE FUNCTION: detect-tutor-emotional-context
Roda apenas para tutores que ativaram explicitamente.

Análise: rodar Sonnet 4.6 nos diary entries dos últimos 30 dias procurando
sinais de exaustão, sobrecarga, dificuldade emocional do tutor (não do
pet — do tutor).

PROMPT (Sonnet 4.6):
```
Você analisa anotações de diário pet do tutor (não do pet) para detectar
sinais de exaustão ou sobrecarga emocional. Tutor explicitamente ativou
essa análise.

Anotações recentes:
{recent_entries}

Detectar APENAS se houver sinais CLAROS e RECORRENTES:
- Menções de cansaço, exaustão, "não dou conta" repetidas.
- Tom progressivamente mais negativo nos últimos 30d vs 90d antes.
- Menção de eventos pessoais difíceis (separação, luto humano, doença).

NÃO ATIVE em casos:
- Frustração isolada com situação específica.
- Reclamação pontual.
- Linguagem informal de cansaço típica ("aff", "que dia").

Se detectado, retornar:
{
  "detected": true,
  "confidence": 0.0-1.0,
  "narrative": "Resumo discreto da observação",
  "suggestion": "Sugestão APENAS opcional, não invasiva"
}

Se NÃO detectado:
{ "detected": false }

REGRAS:
- Confidence < 0.75 → tratar como "não detectado".
- Mensagem gerada (se detectado) DEVE ser leve. Ex: "Cuidar é cansativo
  às vezes. Quer registrar como você está se sentindo? Sem pressão."
- ZERO papel de terapeuta. ZERO sugestão de "respira fundo". ZERO emojis.
```

INSIGHTS DESTA SUBCATEGORIA:
- Severity sempre 'info' — nunca notifica push.
- Aparecem só no feed.
- Sempre com opção "obrigado, prefiro não receber esses" → silencia
  permanentemente.

PARE AO FIM DA FASE 5d. Espere revisão.

═══════════════════════════════════════════════════════════════════════════
FASE 6 — UI: EXTENSÕES NO FEED + TELA MEMORIAL + SETTINGS
═══════════════════════════════════════════════════════════════════════════

REUSO MÁXIMO. Não recrie telas — estenda.

A. SETTINGS PROATIVAS (`app/settings/proactive.tsx`):
- Adicionar 4 seções novas (uma por camada 5/6/7/8) com mesmo padrão
  visual das 1-4.
- Camada 8: aviso explícito antes de ativar — "Esta camada toca em
  temas sensíveis. Você pode desligar a qualquer momento."
- Subcategoria 'tutor_difficulty' tem aviso adicional.
- Botão pra ver insights silenciados permanentemente + reativar.

B. FEED DE INSIGHTS (`app/insights/index.tsx`):
- Filtros: adicionar "Coach" (camada 5), "Família" (camada 6),
  "Operação" (camada 7), "Marcos" (camada 8 não-luto).
- Insights de luto/doença grave: estilo VISUAL distinto — fundo
  neutro, sem cores vivas, fonte normal (não alarmar).

C. TELA DE PET (`app/pets/[id]/index.tsx`):
- Se pets.deceased_at preenchido: layout muda completamente.
  - Header: "Em memória de {pet_name}" em fonte serifada, cor neutra.
  - Sem cards de "registrar momento".
  - Card destacado: "Memórias de {pet_name}" → abre álbum do diário.
  - Card sutil: "Livro de memórias" (acessível, não insistente).
  - Tabs do pet ainda funcionam, mas em modo somente-leitura.

D. TELA NOVA: LIVRO DE MEMÓRIAS (`app/pets/[id]/memorial.tsx`):
- Acessível só se pets.deceased_at preenchido OU tutor toca explicitamente.
- Compilação automática de melhores momentos da vida do pet:
  - Algoritmo: scoreia diary_entries por engajamento + variedade +
    cobertura temporal.
  - Tutor pode adicionar/remover.
- Layout: tipo álbum, foto + legenda + data.
- Exportável (PDF, link público temporário) — reusar infra do PR #4 se
  existir; senão, marcar como TODO.
- Tom da UI: silencioso, sem emojis, sem cores vibrantes.

E. TUTORIAL DE CAMADA 8 (`app/onboarding/proactive-emotional.tsx`):
- Tela pequena explicando: "Esta camada toca em temas como aniversários,
  doenças e perdas. Você controla o que receber. Pode desligar a
  qualquer momento."
- Botão "ativar" + botão "deixar desligada".
- Aparece UMA VEZ quando tutor entra em settings da camada 8.

I18N (pt-BR completo, outros 4 com placeholder + flag em
MISSING_TRANSLATIONS.md):
```
insights.feed.filter.coach
insights.feed.filter.family
insights.feed.filter.operations
insights.feed.filter.milestones

insights.settings.layer5.title
insights.settings.layer5.description
insights.settings.layer5.subcategory.breed_behavior
insights.settings.layer5.subcategory.breed_health_predisposition
insights.settings.layer5.subcategory.life_phase
insights.settings.layer5.subcategory.post_procedure
insights.settings.layer5.subcategory.training_suggestions

insights.settings.layer6.title
insights.settings.layer6.description
[...subcategorias...]

insights.settings.layer7.title
insights.settings.layer7.description
[...subcategorias...]

insights.settings.layer8.title
insights.settings.layer8.description
insights.settings.layer8.warning            # "Esta camada toca em temas sensíveis..."
insights.settings.layer8.subcategory.affective_milestones
insights.settings.layer8.subcategory.chronic_disease
insights.settings.layer8.subcategory.tutor_difficulty
insights.settings.layer8.subcategory.tutor_difficulty.warning  # aviso extra
insights.settings.layer8.subcategory.memorial_mode
insights.settings.layer8.subcategory.euthanasia_discussion

insights.silenced.title
insights.silenced.empty
insights.silenced.reactivate

memorial.header                              # "Em memória de {name}"
memorial.book_button
memorial.book.title                          # "Memórias de {name}"
memorial.book.export
memorial.book.add_memory
memorial.book.remove_memory

onboarding.proactive_emotional.title
onboarding.proactive_emotional.body
onboarding.proactive_emotional.activate
onboarding.proactive_emotional.skip

# DISCLAIMERS especiais — TODOS REVISÃO HUMANA OBRIGATÓRIA
insights.disclaimer.breed_general            # "Características gerais..."
insights.disclaimer.chronic_care             # "auExpert não substitui..."
insights.disclaimer.terminal_support_resources  # nomes dos recursos por país
insights.disclaimer.bereavement_resources    # recursos de luto pet
```

═══════════════════════════════════════════════════════════════════════════
FASE 7 — TESTES MANUAIS GUIADOS
═══════════════════════════════════════════════════════════════════════════

Estender supabase/seeds/proactive_test_data.sql com:
- Pet 4: Border Collie 3 anos com diary mencionando "puxa coleira",
  "muita energia", "sozinho durante o dia"
- Pet 5: Chihuahua 9 anos com diagnóstico recente registrado
- Pet 6: pet com deceased_at = 30 dias atrás
- Tutor com 2 pets (Mana + Pico)
- Tutor com co-tutor configurado
- Tutor com viagem em planejamento daqui 45 dias

Roteiro:
- [ ] Camada 5 pra Pet 4: gera sugestões de adestramento + estimulação
      mental + breed_behavior coerente com Border Collie.
- [ ] Camada 5 pra Mana (Chihuahua 5 anos): saúde dental e cuidados de
      raça pequena.
- [ ] Camada 6 multi-pet: comparação Mana vs Pico produz insight neutro.
- [ ] Camada 6 multi-tutor: consolidação de vacinas detectada.
- [ ] Camada 7 stock: pet com ração registrada acabando em 5 dias gera
      insight.
- [ ] Camada 7 trip prep: viagem em 45 dias dispara documentation check.
- [ ] Camada 7 vet prep: consulta vet amanhã gera resumo bem feito.
- [ ] Camada 8 milestones: aniversário em 7 dias gera mensagem leve
      (revisar texto).
- [ ] Camada 8 luto: marcar Pet 6 como deceased → app transforma layout,
      gera UM insight cuidadoso, suspende reminders.
- [ ] Camada 8 luto: 1 ano depois (simular pulo de data) → aniversário
      póstumo aparece com tom adequado, opção "não me lembrar".
- [ ] Camada 8 doença crônica: 20 primeiros insights ficam pending_review.
- [ ] Silenciar categoria → não recriado nos próximos N dias.
- [ ] Settings da camada 8 desligadas: nenhum insight da camada gerado.

═══════════════════════════════════════════════════════════════════════════
CHECKLIST FINAL DE ENTREGA
═══════════════════════════════════════════════════════════════════════════

- [ ] Discovery (Fase 0) executado e aprovado.
- [ ] Migration aplicada: layer constraint atualizada, settings
      estendidos, pet_lifecycle_events, insight_silenced_categories,
      pet_tutors (se necessário), pets.deceased_at + chronic_conditions.
- [ ] 5 Edge Functions deployadas com verify_jwt: false:
  - generate-breed-coaching-insights (Camada 5)
  - generate-multi-pet-tutor-insights (Camada 6)
  - generate-pet-ops-insights (Camada 7)
  - generate-affective-milestones (Camada 8a)
  - generate-chronic-care-insights (Camada 8b)
  - detect-tutor-emotional-context (Camada 8d, opt-in)
- [ ] Trigger / função SQL para modo luto (deceased_at → suspende camadas).
- [ ] Hooks React Query estendidos.
- [ ] Settings tela atualizada com 4 novas seções + tutorial Camada 8.
- [ ] Feed atualizado com novos filtros + estilo distinto pra luto/doença.
- [ ] Tela de pet adapta-se quando deceased_at preenchido.
- [ ] Tela memorial implementada.
- [ ] pt-BR completo, outros 4 com placeholder.
- [ ] MISSING_TRANSLATIONS.md atualizado com FLAGS EXPLÍCITOS:
  - "DISCLAIMERS DE SAÚDE: revisão humana obrigatória"
  - "PROMPTS DE LUTO: revisão humana linha a linha em todos os 5 idiomas"
  - "RECURSOS DE APOIO: validar adequação por país antes de ativar"
- [ ] Camada 8 default DESLIGADA (opt-in).
- [ ] Subcategoria tutor_difficulty default DESLIGADA.
- [ ] Os 20 primeiros insights de chronic_disease vão para pending_review.
- [ ] Logs de debug presentes, prefixos consistentes.
- [ ] Seed estendido + roteiro de validação manual passando.
- [ ] Sem `<TextInput>` em telas novas.
- [ ] Disclaimers obrigatórios visíveis nos pontos críticos.
- [ ] Custo estimado de IA documentado.
- [ ] Princípios não-negociáveis seguidos. Especialmente: nunca
      diagnosticar, tom medido, opt-in granular, respeito permanente
      ao silenciamento, modo luto cuidadoso.

═══════════════════════════════════════════════════════════════════════════
RESTRIÇÕES E GUARD-RAILS (REPETIDAS)
═══════════════════════════════════════════════════════════════════════════

- NÃO modifique código fora do escopo. Bug existente: anote, siga.
- NÃO remova debug logs.
- NÃO crie abstrações novas a menos que necessário.
- NÃO troque libs em uso.
- NÃO otimize prematuramente.
- Em DÚVIDA sobre padrão do projeto: PARE e pergunte ao Belisario.
- Sem `<TextInput>` em telas novas.
- pt-BR completo; outros 4 com placeholders + MISSING_TRANSLATIONS.md
  atualizado com flags de revisão obrigatória.
- CAMADA 8: nada vai pra produção sem revisão humana de Belisario nos
  prompts e nos textos gerados.

═══════════════════════════════════════════════════════════════════════════
COMO ENTREGAR
═══════════════════════════════════════════════════════════════════════════

Ao fim de cada fase: relatório curto (15-25 linhas) com:
1. O que foi feito.
2. Decisões tomadas e por quê.
3. Coisas não feitas e por quê.
4. Próximos passos.
5. Bloqueios ou dúvidas.

Para Camada 8 (Fases 5a, 5b, 5c, 5d): SEMPRE incluir 3-5 exemplos de
mensagens geradas em pt-BR, tom precisa ser revisado humano.

Não una fases. Espere "prossiga" entre cada uma — especialmente entre
sub-fases da Fase 5.

PR final: descrição clara, lista de arquivos, vídeo curto dos fluxos
sensíveis (modo luto, milestones, settings da camada 8), custos
observados, lista de testes manuais executados, FLAG explícito sobre
o que precisa de revisão humana antes de go-live.

Em caso de bloqueio: PARE E PERGUNTE.
```

---

## Anexos opcionais (referência para Belisario)

### A. Por que Camada 8 merece tanto cuidado

Esta camada é onde a IA pode fazer o maior bem ou o maior mal. Casos reais que motivam o cuidado:

- **App de lembretes que continua tocando depois da morte do pet** — relatos comuns em fóruns. Tutor enlutado recebe "está na hora da vacina do Rex" semanas depois da morte. Causa dor real e desinstalação.
- **Mensagens "feel good" inadequadas** — "Vamos juntos celebrar mais um aninho! 🎂🐾✨" para um pet com câncer terminal. Faz tutor sentir que o app "não entende".
- **Pressão por engajamento em modo luto** — "Faz tempo que você não posta sobre Rex! Compartilhe uma memória 💕". Notificações em modo memorial são uma forma de tortura pra tutor enlutado.
- **Sugestão de "outro pet"** — qualquer recomendação algorítmica que insinue substituição é ofensiva.

A solução técnica é simples (suspender camadas, adaptar UI), mas a solução de **tom** é difícil. Por isso a revisão humana obrigatória.

### B. Custo estimado destas camadas

- **Camada 5** com Opus 4.7 mensal por pet: ~$0.15/pet/mês.
- **Camada 6** com Sonnet 4.6 semanal: ~$0.05/tutor/mês.
- **Camada 7** com Sonnet 4.6 + Opus para vet_prep: ~$0.10/pet/mês.
- **Camada 8** essencialmente desprezível (eventos raros, milestone único).

Total adicional: ~$0.30/tutor/mês com 1 pet, ~$0.50/tutor/mês com 2 pets. Somado ao custo das Camadas 1-4, fica em ~$1-2.50/tutor/mês. Decisão de modelo de negócio: monetizar (assinatura premium ativa camadas 5-8) ou absorver (incluído gratuito como diferencial).

### C. Testes mais críticos antes de go-live

1. **Modo luto**: simular morte de Pet 6 e verificar que TUDO suspende. Nenhuma notificação. UI muda. Insights pendentes expiram.
2. **Aniversários póstumos**: 1 ano depois, mensagem aparece com tom certo. "Não me lembrar" funciona permanentemente.
3. **Doença crônica progressiva**: pet com piora registrada — tom de insight escalation com a gravidade.
4. **Multi-tutor sem consentimento**: Belisario adiciona Anita, mas share_insights=false. Anita NÃO vê insights de Mana.
5. **Tutor difficulty falsa positivo**: tutor reclama de dia de chuva — IA não infere "exaustão emocional".

### D. Próximos passos depois deste PR

- Painel admin pra Belisario revisar insights pending_review da Camada 8.
- Sistema de feedback estruturado: tutor avalia qualidade de insights (rating + texto).
- A/B testing de variações de tom dentro dos guardrails.
- Localização completa em es-MX, es-AR, en-US, pt-PT com revisão regional especialmente de Camadas 5 (saúde) e 8 (emocional).
- Integração mais profunda com PR #2b (vet finder) e PR #4 (memorial de viagem) — o "livro de memórias" da Camada 8 pode reusar infra do PR #4.

### E. Riscos remanescentes que vão exigir monitoramento contínuo

- **Drift da IA ao longo do tempo**: Anthropic atualiza modelos, comportamento muda. Reavaliar prompts a cada mudança de modelo.
- **Casos não previstos**: tutor com situação rara (3+ pets, 2 co-tutores, pet com 4 condições crônicas). IA precisa degradar com graça.
- **Falsos positivos custosos**: insight de luto disparando incorretamente (tutor digitou "Rex morreu" como expressão coloquial — improvável mas possível). Trigger só por evento explícito (campo deceased_at preenchido manualmente), nunca por inferência de texto.
- **Conformidade regulatória**: dependendo de quão grande o app fica, pode atrair atenção de regulação de saúde/bem-estar animal em alguns países. Documentar tudo desde já.
