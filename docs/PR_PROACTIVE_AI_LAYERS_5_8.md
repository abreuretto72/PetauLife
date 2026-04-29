# PR — IA Proativa do Pet (Camadas 5-8)

> Continuação do PR de Camadas 1-4 (`PR_PROACTIVE_AI.md`). Adiciona quatro
> novas camadas de proatividade: coach pessoal, família multi-pet/multi-tutor,
> operação do dia a dia e companhia emocional.
>
> Entregue em 7 fases com pausa explícita pra revisão humana entre cada,
> com pausa adicional **dentro** da Camada 8 entre as 4 sub-fases sensíveis.

## Resumo executivo

L5-L8 elevam a proatividade do app de "anomalias e padrões" para um
companheiro narrativo que reconhece o ciclo de vida do pet — desde puppy
até luto. Diferente de L1-L4 (regras + LLM pra fraseado), L5-L8 dependem
fortemente de Opus 4.7 pelos cenários sensíveis e pela exigência de tom
literário Clarice Lispector.

**Filosofia central:**

- **L5 (Coach)** — sugestões personalizadas por raça/idade/condição. Mensal.
- **L6 (Família)** — comparações neutras entre pets do tutor + coordenação de co-tutores. Semanal.
- **L7 (Operação)** — antecipação operacional 7-21 dias à frente. Diário.
- **L8 (Companhia emocional)** — marcos afetivos, doença crônica, modo luto, tutor difficulty. Múltiplas frequências, **opt-in obrigatório**, com salvaguardas em camadas.

**Cobertura idiomas:** pt-BR completo. en-US parcial (settings + filtros + memorial).
es-MX/es-AR/pt-PT pendentes revisão humana.

**Custo médio adicional estimado:** ~$2.10/tutor/mês (2 pets, 4 camadas novas).

## Arquivos criados/modificados

### Backend (banco)

```
1 migration aplicada:
  - phase5c_extend_deceased_trigger_invoke_memorial_ef
    (estende pets_on_deceased_trigger pra invocar EF memorial via pg_net)

Schema reusado de Fase 1/L5-8 (já aplicado anteriormente):
  - pet_insights.layer agora 1..8
  - pet_proactive_settings +4 colunas layer5/6/7/8 + 4 jsonb categorias
  - pet_lifecycle_events (já existia)
  - insight_silenced_categories (já existia)
  - pets.deceased_at + pets.deceased_cause + idx_pets_deceased
  - pet_members.share_insights (consentimento co-tutor)
  - RPC is_insight_silenced (SECURITY DEFINER)
```

### Edge Functions (6 novas)

| EF | Modelo | Frequência | Camada | status default |
|---|---|---|---|---|
| `generate-breed-coaching-insights`     | Opus 4.7    | dia 5, 02:00 mensal      | 5  | pending |
| `generate-multi-pet-tutor-insights`    | Sonnet 4.6  | seg 05:00 semanal        | 6  | pending |
| `generate-pet-ops-insights`            | Sonnet 4.6 + Opus 4.7 (vet_prep) | diário 06:30 | 7  | pending |
| `generate-affective-milestones-insights` | Sonnet 4.6 | diário 09:00            | 8a | pending |
| `generate-chronic-care-insights`       | Opus 4.7    | seg 04:00 semanal        | 8b | **pending_review** (primeiros 20) |
| `generate-memorial-insights`           | Opus 4.7    | trigger SQL + scan diário 10:00 | 8c | pending |
| `generate-tutor-difficulty-insights`   | Opus 4.7    | seg 03:00 semanal        | 8d | **pending_review** (sempre) |

### Frontend

```
hooks/useProactiveSettings.ts              (estendido — DEFAULT_LAYER 5/6/7/8)
app/(app)/settings/proactive.tsx           (estendido — 8 toggles + confirm L8)
app/(app)/insights/index.tsx               (estendido — 4 chips novos)
app/(app)/pet/[id]/memorial.tsx            (NOVO — tela memorial read-only)
i18n/pt-BR.json                            (+9 keys insights.feed.filter.*)
i18n/en-US.json                            (+9 keys insights.feed.filter.*)
docs/PR_PROACTIVE_AI_LAYERS_5_8.md         (este arquivo)
docs/proactive_validation_checklist.md     (estendido — checklists L5-L8 + UI)
supabase/seeds/proactive_test_data_l5_8.sql (NOVO — seed idempotente)
```

## CRONs ativos pós-PR (deltas)

```
03:00 UTC seg     tutor-difficulty-weekly         (Opus 4.7)            jobid 24
04:00 UTC seg     chronic-care-weekly             (Opus 4.7)            jobid 22
05:00 UTC seg     multi-pet-tutor-weekly          (Sonnet 4.6)          jobid 19
06:30 UTC diário  pet-ops-insights-daily          (Sonnet+Opus)         jobid 20
09:00 UTC diário  affective-milestones-daily      (Sonnet 4.6)          jobid 21
10:00 UTC diário  memorial-anniversary-daily-scan (Opus 4.7)            jobid 23
02:00 UTC dia 5   coach-monthly-pet-care          (Opus 4.7)            (já existia)
```

Trigger SQL fan-out (não-CRON): `pets_on_deceased_trigger` invoca
`generate-memorial-insights` via pg_net quando `deceased_at` é populado.

## Cobertura por camada

### Camada 5 — Coach por raça/idade/condição (Opus 4.7)
✅ breed_behavior ✅ breed_health_predisposition ✅ life_phase
✅ post_procedure ✅ training_suggestions
- Pré-resumo client-side: top tags + mood + 5 amostras de narração 90d
- life_stage granular: puppy_young (<6m), puppy_late (6-12m), adult, senior, geriatric
- Cache 60d por (pet_id, subcategory)
- Push apenas em severity=consider

### Camada 6 — Família multi-pet / multi-tutor (Sonnet 4.6)
✅ multi_pet_comparison ✅ multi_pet_consolidation
✅ co_tutor_coordination ✅ co_tutor_distribution
- 4 detectores estatísticos determinísticos (sem LLM no detector)
- LLM Sonnet 4.6 só pra fraseado neutro/não-acusatório
- Cache 7d via `evidence.scope_key`
- Skip silencioso se <2 pets ou 0 co-tutores com `share_insights=true`

### Camada 7 — Pet ops (Sonnet 4.6 + Opus 4.7)
✅ prescription_renewal ✅ vet_consultation_prep ✅ trip_anticipation
✅ preventive_documentation
- Opus 4.7 só em vet_consultation_prep (briefing pré-consulta agregado)
- Severity escala: prescription≤3d → attention, vet_prep ≤1d → attention, trip ≤14d → attention
- Postergadas: stock_management (overlap L1), routine_rebalance (overlap L6)

### Camada 8 — Companhia emocional (sub-fases)

**8a — Marcos afetivos (Sonnet 4.6)**
✅ birthday (hoje + 7d) ✅ adoption_anniversary ✅ first_year_with_us
✅ routine_streak (15/30/60/90/180/365)
- severity SEMPRE info
- Cooldown 365d (aniversário 1x/ano)
- birthday/first_year geram lifecycle events

**8b — Doença crônica + eutanásia (Opus 4.7)**
✅ chronic_disease (manejo, NUNCA diagnostica)
✅ euthanasia_discussion (convite à conversa, NUNCA recomenda)
- Primeiros 20 chronic_disease em pending_review
- euthanasia_discussion SEMPRE pending_review
- Detector eutanásia: 3+ sinais simultâneos em pet geriátrico
- Recursos: Falalu (luto pet) + Anclivepa-SP (clínica) + Lap of Love (internacional)

**8c — Modo luto (trigger SQL + Opus 4.7)**
✅ memorial_mode (carta de despedida automática quando deceased_at populado)
✅ memorial_anniversary (lembrança anual, opt-in)
- Trigger SQL: expira insights L1-3,5,7 + cancela queue + silencia 7 categorias + cria lifecycle event + invoca EF memorial via pg_net
- Push memorial_mode só se layer8_enabled=true
- Tela memorial: /pet/{id}/memorial (read-only, livro de memórias)

**8d — Tutor difficulty (Opus 4.7)**
✅ tutor_difficulty
- DOUBLE opt-in (layer8_enabled + tutor_difficulty=true; ambos default false)
- Detector: 2+ sinais simultâneos (silence/drop/quiet_hours)
- status SEMPRE pending_review, NUNCA push
- Recursos: CVV (188, 24h) + Falalu

## Princípios não-negociáveis — todos respeitados

- [x] **Nunca diagnostica** — prompts L5/L8 proíbem; mensagens usam "padrão observado", "considere mencionar"
- [x] **Nunca substitui vet** — todo alerta saúde reforça "siga o tratamento indicado pelo vet"
- [x] **Nunca sugere eutanásia** — palavra proibida no prompt; usa "qualidade de vida"
- [x] **Tom Elite/Clarice Lispector** — validado em produção: "A dermatite atópica acompanha a Mana em silêncio…", "Restam essas pequenas cenas, guardadas dentro do app, esperando o momento de serem folheadas devagar."
- [x] **Opt-in granular** — toggle por camada + por subcategoria
- [x] **L8 default OFF** — exige opt-in explícito (confirm() no UI)
- [x] **tutor_difficulty default OFF dentro de L8** — double opt-in
- [x] **Pending review pra cenários sensíveis** — chronic_disease primeiros 20, euthanasia/tutor_difficulty sempre
- [x] **Privacidade** — chamada LLM isolada por (tutor_id, pet_id)
- [x] **Não overload** — cooldowns 7d/60d/90d/365d conforme camada
- [x] **Recursos de apoio mapeados** — Falalu, Anclivepa-SP, CVV(188), Lap of Love
- [x] **Trigger luto suspende automações** — silencia 7 categorias automáticas no momento da partida

## Pendências manuais (fora do escopo automatizável)

| Item | Ação | Quem |
|---|---|---|
| Tela admin `/admin/insights/pending-review` | Implementar fila de revisão (admin é projeto separado) | Belisario |
| Disclaimers L8 em es-MX/es-AR/pt-PT | Revisor jurídico + tradutor humano | Externos |
| Integração `/pet/{id}/memorial` no menu do hub | Adicionar item de menu condicional (deceased_at != null) | Belisario (visual) |
| Render de `evidence.talking_points` no insight detail | Estender `app/(app)/insights/[id].tsx` | Belisario (visual) |
| Onboarding L8 educacional | Tela explicativa antes do confirm() do toggle | Belisario (futuro) |
| Validação manual com seeds | Rodar `proactive_test_data.sql` + `proactive_test_data_l5_8.sql` + checklist | QA |

## Custo observado vs estimado (acréscimo do PR L5-L8)

| Camada | Estimado/mês | Observado/mês | Δ |
|---|---|---|---|
| 5 (Opus mensal) | $0.50 | TBD após 30d | — |
| 6 (Sonnet semanal) | $0.20 | TBD | — |
| 7 (Sonnet diário + Opus vet_prep) | $0.65 | TBD | — |
| 8a (Sonnet diário) | $0.10 | TBD | — |
| 8b (Opus semanal) | $0.40 | TBD | — |
| 8c (Opus on-event + scan diário) | $0.05 | TBD | — |
| 8d (Opus semanal) | $0.20 | TBD | — |
| **Total adicional/2 pets/tutor** | **~$2.10** | **TBD** | — |

Total combinado L1-L8 (este PR + anterior): **~$3.99/tutor/mês**.

(Valores observados serão preenchidos após 30 dias de produção via dashboard `/ai-costs`.)

## Próximos PRs sugeridos

Conforme spec original (camadas além das 8):

1. **Tela admin `/admin/insights/pending-review`** — fila pra revisar e promover/rejeitar insights L8 sensíveis (escopo admin separado).
2. **Onboarding L8 visual** — tela educacional antes do confirm() do toggle (atualmente só dialog).
3. **Compartilhamento de insight com co-tutor** — quando ambos têm `share_insights=true`, dispensar é compartilhado.
4. **Geocoding cache** — destinos das viagens viram lat/lon pra Camada 7 ativar `preventive_documentation` durante viagem ativa internacional.
5. **Insight detail rico** — render explícito de `talking_points`, `support_resources`, fotos do diário relacionadas.
6. **Audit log de pending_review** — quem aprovou/rejeitou cada insight, quando, por quê.

## Status final

**7/7 fases concluídas.** Backend + UI essencial entregues. Sistema operacional
end-to-end:

- Banco aceita `layer 1..8`, status `pending_review`, settings com 8 toggles.
- 6 EFs novas deployadas + trigger SQL estendido.
- 7 CRONs novos ativos.
- Tela settings + feed com filtros L5-L8 + tela memorial funcionais.
- Seeds estendidos + checklist de validação atualizado.

Tutor já consegue:
- Ver/configurar 8 camadas em `/settings/proactive`.
- Filtrar feed `/insights` por L5-L8.
- Acessar `/pet/{id}/memorial` quando o pet entrar em modo memorial.

**Próximo após produção:**
- Validar custos observados após 30d.
- Promover ou refinar primeiros 20 chronic_disease em `pending_review`.
- Decidir se euthanasia_discussion fica permanentemente em pending_review ou liberar após N reviews aprovadas.
