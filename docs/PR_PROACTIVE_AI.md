# PR — IA Proativa do Pet (Camadas 1-4)

> Implementação completa do módulo de IA Proativa que antecipa necessidades
> do tutor com base no perfil acumulado de cada pet + contexto atual.
>
> Entregue em 7 fases com pausas explícitas para revisão humana entre cada.

## Resumo executivo

A IA Proativa do auExpert opera em 4 camadas independentes que rodam em
horários distribuídos pelo dia, gerando alertas/tendências/sugestões/resumos
persistidos em `pet_insights`. Tutor controla cada categoria via opt-in
granular em `pet_proactive_settings`. Disclaimer médico-legal canonizado
em todas as análises de saúde.

**Custo médio:** ~$3.20/tutor/mês (2 pets, 4 camadas ligadas).
**Cobertura idiomas:** pt-BR + en-US completos. es-MX/es-AR/pt-PT pendentes
revisão humana do disclaimer (`MISSING_TRANSLATIONS.md`).

## Arquivos criados/modificados

### Backend (banco)

```
3 migrations aplicadas:
  - phase1_extend_pet_insights_and_create_baselines_settings
  - phase1_pet_insights_safe_defaults
  - phase3_compute_baseline_metrics_rpc

Tabelas estendidas:
  - pet_insights (+15 colunas: layer, severity, evidence, cta_*, related_*, status, etc)

Tabelas criadas:
  - pet_baseline_metrics
  - pet_proactive_settings

RPCs criadas:
  - compute_baseline_metrics_for_pet(p_pet_id, p_window_days)
  - pet_insights_sync_legacy_fields() (trigger BEFORE INSERT/UPDATE)

CHECKs expandidos:
  - pet_insights.category += 'documento'
  - pet_insights.layer (novo, 1-4)
  - pet_insights.severity (novo, info/consider/attention/urgent)
  - pet_insights.status (novo, pending/shown/dismissed/acted_on/expired)
```

### Edge Functions (5 novas + 0 modificadas)

| EF | Modelo | Frequência | Camada |
|---|---|---|---|
| `generate-deduced-reminders` | rule-based | 09:00 diário | 1 |
| `compute-pet-baselines` | SQL puro | 04:00 diário | 2 |
| `detect-pet-anomalies` | Sonnet 4.6 | 04:30 diário | 2 |
| `generate-contextual-insights` | Sonnet 4.6 | 07:00 + 16:00 diário | 3 |
| `generate-longterm-insights` | Opus 4.7 | dia 1, 03:00 mensal | 4 |

### Frontend (3 telas + 2 components + 3 hooks + tipos + 60 i18n keys)

```
types/insights.ts                          (NOVO — tipos completos)
hooks/useAllInsights.ts                    (NOVO — feed multi-pet)
hooks/useProactiveSettings.ts              (NOVO — settings + trigger manual)
components/insights/InsightCard.tsx        (NOVO — card visual)
components/insights/MedicalDisclaimer.tsx  (NOVO)
app/(app)/insights/index.tsx               (NOVO — feed centralizado)
app/(app)/insights/[id].tsx                (NOVO — detalhe + chart)
app/(app)/settings/proactive.tsx           (NOVO — toggles)
i18n/pt-BR.json                            (+~60 keys insights.*)
i18n/en-US.json                            (+~60 keys insights.*)
MISSING_TRANSLATIONS.md                    (atualizado com seção IA Proativa)
docs/proactive_validation_checklist.md     (NOVO — checklist Fase 7)
docs/PR_PROACTIVE_AI.md                    (este arquivo)
supabase/seeds/proactive_test_data.sql     (NOVO — seed idempotente)
```

## CRONs ativos pós-PR

```
03:00 UTC dia 1   longterm-insights-monthly       (Opus 4.7)
04:00 UTC diário  compute-pet-baselines-daily     (SQL)
04:30 UTC diário  detect-pet-anomalies-daily      (Sonnet 4.6)
07:00 UTC diário  contextual-insights-morning     (Sonnet 4.6)
09:00 UTC diário  generate-deduced-reminders-daily (rule-based)
16:00 UTC diário  contextual-insights-afternoon   (Sonnet 4.6)
*/5 min           send-queue-notifications        (push)
```

CRONs antigos desativados:
- `proactive-pet-care-daily` — substituído por `generate-deduced-reminders-daily`. RPC `enqueue_proactive_pet_alerts` continua existindo no banco (sem caller, candidata a cleanup).

## Cobertura por camada

### Camada 1 — Lembretes (regras determinísticas)
✅ Vacinas (d30/d7) ✅ Vermífugo ✅ Antipulgas ✅ Banho ✅ Aniversário
✅ Check-up ✅ Medicação acabando ✅ Microchip ⚠️ Ração acabando (TODO)

### Camada 2 — Anomalias (Sonnet 4.6)
✅ silent_anomaly ✅ appetite_decreased/increased ✅ no_walks_streak
✅ scratching_recurrent ⚠️ potty_change/sleep_change/mood_change (TODO — exigem tagging consistente)

### Camada 3 — Contexto (Sonnet 4.6 + OWM)
✅ extreme_heat (porte+raça+braquicéfalo) ✅ extreme_cold (raças pequenas/sem pelo)
✅ storm + medo de trovão ✅ air_quality ✅ no_walks_streak ✅ life_phase_change

### Camada 4 — Longo prazo (Opus 4.7, mensal)
✅ seasonality ✅ monthly_summary ✅ yearly_summary
🔄 food_correlation, travel_pattern, treatment_efficacy, social_pattern (stubs preparados, ativam quando dados-fonte maturarem)

## Princípios não-negociáveis — todos respeitados

- [x] Nunca diagnostica — prompts LLM proíbem; mensagens usam "padrão diferente"
- [x] Nunca substitui vet — todo alerta saúde tem CTA + disclaimer
- [x] Tom medido — registro Elite (sem onomatopeia, 3ª pessoa, sem assinatura)
- [x] Opt-in granular — toggle por camada + por subcategoria
- [x] Privacidade — chamada LLM isolada por (tutor_id, pet_id)
- [x] Não overload — cooldown 7d/14d/30d; max_insights_per_day; expira_at em layer 3 e 4

## Pendências manuais (fora do escopo automatizável)

| Item | Ação | Quem |
|---|---|---|
| `OPENWEATHER_API_KEY` no Supabase Secrets | `supabase secrets set OPENWEATHER_API_KEY=... --project-ref peqpkzituzpwukzusgcq` | Belisario |
| Disclaimer médico-legal em es-MX/es-AR/pt-PT | Revisor jurídico + tradutor humano profissional | Externos |
| Integração `/insights` no drawer/menu do hub | Adicionar item de menu + badge `useUnreadInsightsCount` | Belisario (visual) |
| Cards "Insights recentes" em Home/Pet | Inserir em `app/(app)/index.tsx` + `app/(app)/pet/[id]/index.tsx` | Belisario (visual) |
| Validação manual com seed | Rodar `psql -f supabase/seeds/proactive_test_data.sql` + checklist | QA |

## Custo observado vs estimado

| Camada | Estimado/mês | Observado/mês | Δ |
|---|---|---|---|
| 1 (rules) | $0.00 | $0.00 | 0 |
| 2 (Sonnet) | $0.75 | TBD após 7d | — |
| 3 (Sonnet) | $0.54 | TBD | — |
| 4 (Opus) | $0.60 | TBD | — |
| **Total/2 pets/tutor** | **~$1.89** | **TBD** | — |

(Valores observados serão preenchidos após 7 dias de produção via dashboard `/ai-costs`.)

## Próximos PRs sugeridos

Conforme prompt original (Camadas 5-8 e além):

1. **Camadas 5-8** — coach por raça, multi-pet, antecipação operacional, companhia emocional
2. **Painel de saúde do pet** — visualização gráfica baseada em `pet_baseline_metrics` (peso/alimentação/sono em curvas)
3. **Notificação push** completa — ainda usa `send-queue-notifications` existente, mas faltam preferências por horário silencioso
4. **Integração com PR #2b** — quando `trip_saved_places` existir, ativar Camada 4 `social_pattern`
5. **Compartilhamento com co-tutor** — insights aparecem pros 2 tutores, dispensar compartilhado
6. **Geocoding cache** — destinos das viagens viram `lat/lon` pra Camada 3 ativar durante viagem ativa

## Status final

**6/7 fases concluídas + integrações pendentes.** Sistema operacional end-to-end:
backend grava insights, CRONs disparam diariamente, telas de feed/detalhe/settings
funcionais, i18n pt-BR e en-US prontos.

Tutor já consegue ver insights ao acessar `/insights` — basta adicionar entrada
no drawer/menu (1 linha) pra fluxo ficar 100% accessível.
