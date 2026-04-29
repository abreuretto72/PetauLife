# Checklist de validação manual — IA Proativa do Pet

> Como rodar: aplicar o seed em `supabase/seeds/proactive_test_data.sql` e
> seguir os passos abaixo. Cada checkbox idealmente passa em ambiente de
> staging antes de promover para produção.

## Pré-requisitos

- [ ] Migrations aplicadas (Fase 1 + Fase 3 RPC + Fase 0 expand category)
- [ ] EFs deployadas: `generate-deduced-reminders`, `compute-pet-baselines`, `detect-pet-anomalies`, `generate-contextual-insights`, `generate-longterm-insights`
- [ ] CRONs ativos: 04:00, 04:30, 07:00, 09:00, 16:00, dia 1 às 03:00 (mensal)
- [ ] Secret `OPENWEATHER_API_KEY` configurado no Supabase
- [ ] Pets de teste criados (Mana, Pico, Frida) via seed
- [ ] App rodando em dev client (não Expo Go — push notifications precisam)

## Camada 1 — Lembretes deduzidos

- [ ] **Vacina vencendo (Mana)** — Rodar `generate-deduced-reminders` pra Mana. Esperado: 1 insight `category=vacina, subcategory=vaccine_due_d7_*, severity=attention, title="Vacina V10 vence em 5d — Mana"`.
- [ ] **Banho atrasado (Mana)** — Confirmar insight `subcategory=bath_overdue, severity=info` com mensagem citando o intervalo médio observado.
- [ ] **Microchip ausente** — Se Mana não tiver microchip cadastrado, confirmar `subcategory=microchip_missing`.
- [ ] **Aniversário** — Se algum pet tem `birth_date` em ≤7d, deve disparar `birthday_upcoming`.
- [ ] **Dedup 7d** — Rodar a EF duas vezes seguidas; segunda chamada deve retornar `insights_created: 0`.

## Camada 2 — Anomalias

- [ ] **Baselines (Mana, Pico, Frida)** — Rodar `compute-pet-baselines`. Esperado: 5 métricas × 2 janelas = 10 linhas em `pet_baseline_metrics` por pet com dados.
- [ ] **Apetite (Mana)** — Mana não tem entries de `meal` recentes vs baseline. Esperado: insight `subcategory=appetite_decreased, severity=attention`.
- [ ] **Silent anomaly (Mana)** — Se últimas 48h sem entry, esperado `subcategory=silent_anomaly`.
- [ ] **Coceira recorrente (Pico)** — Pico tem 20 menções de coceira em 12 meses. Em janela 14d se houver 3+, dispara `subcategory=scratching_recurrent`.
- [ ] **Mudança de humor (Frida)** — Frida tem 14 dias de apatia recente. Esperado dispara `mood_change` ou similar (LLM Sonnet decide o subcategory).
- [ ] **Guard-rail dispense** — Dispensar um insight pelo app, rodar EF de novo no mesmo dia, confirmar que NÃO recria.

## Camada 3 — Contexto (clima/lugar/hora)

- [ ] **Heat alert** — Localização do tutor com previsão >30°C nas próximas 12h. Esperado: insight `extreme_heat` com mensagem ajustada à raça.
- [ ] **Diferença raça** — Simular previsão de 28°C: Chihuahua (limite 30°C) NÃO dispara, Border Collie (limite 28°C exato) NÃO dispara, Pug (braquicéfalo, limite 26°C) DISPARA.
- [ ] **No walks streak (Mana)** — Mana sem entries de passeio. Esperado: `no_walks_streak, severity=consider`.
- [ ] **AQI alto** — Se localização tem AQI ≥4: insight `air_quality`.
- [ ] **Storm + medo** — Se previsão de tempestade E pet tem histórico de medo (regex em diary): `storm, severity=attention`.
- [ ] **Expira em 24h** — Insight de Camada 3 deve ter `expires_at` ≤24h após criação.

## Camada 4 — Longo prazo

- [ ] **Sazonalidade (Pico)** — Pico tem 20 menções de coceira em set-out 2024+2025. Rodar `generate-longterm-insights {analysis_type:'seasonality'}`. Esperado: pelo menos 1 padrão `subcategory=seasonality, confidence ≥0.6`.
- [ ] **Resumo mensal (qualquer pet)** — Rodar `{analysis_type:'monthly_summary', force:true}`. Esperado: insight `subcategory=monthly_summary` com `evidence.chart_data.type='summary_pills'`.
- [ ] **Cache 30d** — Rodar a mesma análise 2x sem `force`. Segunda deve retornar 0 (cache hit).
- [ ] **Confidence threshold** — LLM com confidence <0.6 deve ser descartado (não cria insight).

## UI (Fase 6)

- [ ] **Feed `/insights`** — Abrir tela. Esperado: cards ordenados por severity (urgent → info), depois data desc.
- [ ] **Filtro chips** — Tocar "Saúde" → apenas categorias `saude` e `vacina`. Tocar "Padrões" → apenas layer=2. Tocar "Lembretes" → apenas layer=1.
- [ ] **Pull-to-refresh** — Puxar lista pra baixo deve refazer query. Botão "Verificar agora" dispara as 4 EFs em paralelo.
- [ ] **Detalhe `/insights/[id]`** — Tocar card abre tela com title + body + evidência expandida + chart (se layer=4).
- [ ] **Disclaimer médico** — Em insight de saúde (categoria `saude` ou `vacina`), disclaimer aparece visível em italic.
- [ ] **CTA primária** — Tocar "Ver detalhes" / "Cadastrar vacina" / etc. → navega para `action_route` E marca `acted_on_at`.
- [ ] **Dispensar (card)** — Tocar X no card → confirm → some do feed.
- [ ] **Settings `/settings/proactive`** — Toggles ligam/desligam camadas. Ao desligar L2, anomalias param de ser geradas (próxima execução respeita).
- [ ] **Toggle de subcategoria** — Expandir "Camada 2" → desligar `silent_anomaly` → próxima execução não cria insights desse subcategory.
- [ ] **Max insights/dia** — Mudar slider para 1 → sistema deve respeitar (ainda não implementado no MVP — TODO Fase 7+).
- [ ] **i18n** — Trocar idioma do dispositivo pra en-US → todas as strings traduzem (não fica em PT cru).

## Princípios não-negociáveis (auditoria)

- [ ] **Nunca diagnostica** — Lendo todos os insights gerados, NENHUM contém "tem doença X" ou "está com Y" como afirmação. Linguagem deve ser "padrão diferente do habitual", "considere conversar com vet".
- [ ] **Disclaimer permanente** — Insights de saúde têm disclaimer visível em pelo menos um lugar (card OU detalhe).
- [ ] **Tom medido** — Sem onomatopeia ("Eba!", "Xi!"), sem assinatura "— seu pet", sem vocativo fofinho.
- [ ] **Opt-in granular respeitado** — Camada desligada NÃO gera insights, mesmo no CRON.
- [ ] **Privacidade** — Cada chamada LLM contém apenas dados do pet específico (filter `pet_id` + `user_id`).
- [ ] **Não overload** — Cooldown 7d em todas as camadas; insights em layer 4 expiram em 30-60d.

## Observabilidade

- [ ] **`edge_function_diag_logs`** tem entries de cada execução das EFs, com `pets_processed`, `insights_created`, `elapsed_ms`.
- [ ] **`ai_invocations`** registra cada chamada LLM com tokens e custo derivado.
- [ ] **Logs `[generate-deduced-reminders]`** etc. presentes nos logs Supabase com prefixo consistente.

## Camada 5 — Coach por raça/idade/condição (Opus 4.7, mensal dia 5)

- [ ] **Setup** — settings em `pet_proactive_settings.layer5_enabled=true` (default ligado).
- [ ] **Frida senior + displasia** — rodar `generate-breed-coaching-insights {pet_id: frida}`. Esperado: 1-3 insights de subcategorias `life_phase` (senior care) e/ou `breed_health_predisposition`. Tom Clarice. NUNCA prescreve dose.
- [ ] **Mana puppy_late** — rodar pra Mana (Chihuahua 8m). Esperado: insights `puppy_late_socialization`, `thermoregulation_toy_breed`, `hypoglycemia_small_breed_puppy`.
- [ ] **Cache 60d** — rodar 2x sem `force`. Segunda chamada não duplica nenhuma subcategoria.
- [ ] **Disclaimer obrigatório** — body de qualquer insight L5 contém frase tipo "cada pet é único — observe e converse com vet".

## Camada 6 — Multi-pet e multi-tutor (Sonnet 4.6, semanal segunda 05:00)

- [ ] **Setup** — `pet_proactive_settings.layer6_enabled=true`. Tutor com ≥2 pets ativos no seed (Mana + Pico).
- [ ] **multi_pet_comparison** — rodar EF. Esperado: 1+ insight comparando metricas (meals/walks/diary_entries) com fraseado neutro, sem competição.
- [ ] **multi_pet_consolidation** — se houver vacinas em janela 14d entre pets, dispara consolidação.
- [ ] **co_tutor_*** — só dispara se houver `pet_members.share_insights=true` E ≥1 co-tutor aceito. Skip silencioso se 0 co-tutores.
- [ ] **Cooldown 7d via scope_key** — rodar 2x. Segunda retorna `insights_created:0` em <2s.
- [ ] **Skip silencioso 1 pet** — testar com tutor que tem 1 pet ativo. Esperado: skip sem inserts.

## Camada 7 — Pet ops (Sonnet 4.6 + Opus 4.7 pra vet_prep, diário 06:30)

- [ ] **Setup** — `pet_proactive_settings.layer7_enabled=true`.
- [ ] **prescription_renewal (Mana)** — Apoquel termina em 4d. Esperado: subcategoria `prescription_renewal`, severity=`consider`, CTA=`open_pharmacy_finder`.
- [ ] **Severity attention ≤3d** — ajustar end_date pra +3d. Esperado severity=`attention`.
- [ ] **vet_consultation_prep (Mana)** — consulta retorno em 3d. Briefing Opus 4.7 com `talking_points` 3-5 itens incluindo medicações em curso, mudanças observadas, dados quantificáveis.
- [ ] **trip_anticipation** — viagem RJ em 12d. Insight `trip_anticipation` com CTA=`open_trip_screen` e route=`/trips/{id}`.
- [ ] **preventive_documentation** — vacina vencendo em ≤30d + viagem em ≤45d. Cruzamento dispara insight category=`documento`.
- [ ] **Cooldown 7d** — rodar 2x. Cache hit confirmado.

## Camada 8a — Marcos afetivos (Sonnet 4.6, diário 09:00)

- [ ] **Default OFF** — sem `layer8_enabled=true`, EF retorna 0 inserts mesmo com aniversário hoje.
- [ ] **Opt-in explícito** — ativar `layer8_enabled=true` no UI dispara `confirm()` antes de salvar.
- [ ] **birthday hoje** — ajustar `pets.birth_date` pra mesmo dia/mês de hoje. Esperado: insight `affective_milestones`, milestone_type=`birthday`, severity=`info`. Tom Clarice.
- [ ] **birthday +7d** — aniversário em 7d. Esperado mesma subcategoria mas `when='in_7d'`.
- [ ] **adoption_anniversary** — `pet_lifecycle_events.event_type='adoption'` com mesmo m+d em ano anterior. Esperado: insight com `years_together`.
- [ ] **first_year_with_us** — `pets.created_at` exatamente 365 dias atrás. Esperado: insight único.
- [ ] **routine_streak** — N=15/30/60/90/180/365 dias seguidos com diary entries. Dispara apenas em milestone exato.
- [ ] **lifecycle event criado** — birthday/first_year geram registro em `pet_lifecycle_events`.

## Camada 8b — Doença crônica + eutanásia (Opus 4.7, semanal segunda 04:00)

- [ ] **Setup** — `layer8_enabled=true` + condição crônica ativa.
- [ ] **chronic_disease (Frida)** — displasia ativa. Esperado: insight `chronic_disease`, severity=`consider`, status=`pending_review` (primeiros 20). Body com frase observacional + reforço "siga o tratamento indicado pelo vet".
- [ ] **Talking points** — 3-4 itens práticos: o que anotar no diário, gatilhos a observar, manutenção do tratamento, sinais que merecem contato com vet.
- [ ] **Pending review = no push** — checar `notifications_queue`: 0 push pra `subcategory='chronic_disease'` enquanto status=`pending_review`.
- [ ] **euthanasia_discussion** — pet geriátrico com 3+ sinais simultâneos (mood<40, ≥5 dor mentions, condição severa, perda peso >10%). Esperado: status SEMPRE pending_review, body NUNCA contém "eutanásia", evidence inclui Falalu + Anclivepa-SP.
- [ ] **Detector conservador** — pet adulto (não geriátrico) com mesmos sinais NÃO dispara.
- [ ] **Cooldown 90d via scope_key** — rodar 2x. Segunda não recria insight da mesma condição.

## Camada 8c — Modo luto (trigger SQL automático + scan diário 10:00)

- [ ] **Trigger automático** — `UPDATE pets SET deceased_at=NOW(), deceased_cause='...'`. Em ≤30s, EF é invocada via pg_net.
- [ ] **memorial_mode insight** — Opus 4.7 gera carta de despedida usando top moments do diário. Tom Clarice "Laços de Família". NUNCA "morte"/"até logo"/"em paz". 3ª pessoa.
- [ ] **Trigger fan-out** — após óbito: insights L1-3,5,7 expirados, notifications canceladas, `insight_silenced_categories` populado pras 7 categorias, `pet_lifecycle_events.deceased` criado.
- [ ] **Push respeita layer8_enabled** — se OFF, insight criado mas 0 push enfileirado.
- [ ] **memorial_anniversary (cron)** — pet falecido há ≥1 ano com mesmo m+d hoje. Cria insight + lifecycle event `memorial_anniversary`.
- [ ] **Anniversary opt-in** — sem `layer8_categories.memorial_anniversary=true`, retorna `skipped:'subcategory_off'`.
- [ ] **UI memorial** — `/pet/{id}/memorial` carrega: hero com datas, carta memorial, livro de memórias, linha do tempo.

## Camada 8d — Tutor difficulty (Opus 4.7, semanal segunda 03:00)

- [ ] **DOUBLE opt-in** — sem `layer8_enabled=true` E `layer8_categories.tutor_difficulty=true`, EF retorna `skipped:'layer8_off'` ou `'tutor_difficulty_off'`.
- [ ] **Detector ULTRACONSERVADOR** — exige 2+ sinais simultâneos: silence_14d (0 entries 14d + ≥10 antes), drop_signal (≤30% baseline), quiet_hours_signal (span ≥14h).
- [ ] **Tutor sintético isolado** — criar tutor com 1 pet, 12 entries em 14-44d, 0 nas últimas 14d, double opt-in ON. EF dispara insight.
- [ ] **status SEMPRE pending_review** — independente do contador global de pending_review (diferente de chronic_disease).
- [ ] **Body sem invasão** — NUNCA "você está bem?", NUNCA assume estado emocional, NUNCA menciona depressão/ansiedade/terapia. Recursos: CVV (188) + Falalu.
- [ ] **NUNCA push** — mesmo com double opt-in ON, 0 enqueue em `notifications_queue` para `subcategory='tutor_difficulty'`.

## UI L5-L8 (Fase 6)

- [ ] **Settings 8 toggles** — `/settings/proactive` mostra 8 cards de camada (L1-L8).
- [ ] **L8 confirm() obrigatório** — ao tentar ligar L8, modal pergunta antes de salvar.
- [ ] **Sub-toggles** — expandir cada card mostra subcategorias com toggle individual.
- [ ] **`tutor_difficulty` default OFF** — abrir L8, expandir, confirmar que `tutor_difficulty` aparece desligado mesmo com `layer8_enabled=true`.
- [ ] **Filtros novos no `/insights`** — chips: Coach, Família, Operação, Companhia, Longo prazo.
- [ ] **Tela memorial** — `/pet/{id}/memorial` redireciona com mensagem amigável se pet ainda ativo.
- [ ] **i18n** — alternar device pra en-US: chips, settings labels, memorial copy traduzem.

## Custo observado em produção (preencher após 7 dias)

| Métrica | Esperado | Observado |
|---|---|---|
| Insights criados / pet / semana | 5-15 | _____ |
| Tokens Sonnet 4.6 / pet / semana | ~20k | _____ |
| Tokens Opus 4.7 / pet / mês | ~13k | _____ |
| Custo total / tutor 2 pets / mês | $1.50-3.50 | _____ |
| % insights dispensados | <40% | _____ |
| % insights com `acted_on` | >15% | _____ |
| Insights L8 em pending_review | <5% | _____ |
| % opt-in L8 | manual (Belisario aprova) | _____ |
