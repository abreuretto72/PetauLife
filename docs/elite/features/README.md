# Features aspiracionais do Elite — Pilar 6

> **Origem:** Pilar 6 do plano de posicionamento Elite (`docs/elite/posicionamento/2026-04-22_plano_elite_auexpert.md`)
> **Status:** 5 specs prontas, 0 implementadas. 2026-04-23.

Este diretório reúne specs das 5 features que **justificam sozinhas o tier R$ 129/mês** no posicionamento Elite. Cada spec traz tabelas, Edge Functions, telas, i18n, estimativa e decisões em aberto.

---

## Índice

| Feature | Prioridade | Estimativa dev | Arquivo |
|---|---|---|---|
| **Retrospectiva anual** | alta | ~6-7 dias | [`retrospectiva-anual.md`](retrospectiva-anual.md) |
| **Carta ao pet** | média | ~4 dias | [`carta-ao-pet.md`](carta-ao-pet.md) |
| **Plano de Legado** | alta | ~8 dias | [`plano-legado.md`](plano-legado.md) |
| **Viagem internacional** | média-alta | ~11 dias (dev) + curadoria contínua | [`viagem-internacional.md`](viagem-internacional.md) |
| **Atestado de Saúde Emocional** | média | ~4-5 dias | [`atestado-saude-emocional.md`](atestado-saude-emocional.md) |

**Total estimado para implementar as 5:** ~33-35 dias de dev focado.

---

## Ordem sugerida de execução

1. **Carta ao pet** (4 dias) — feature mais simples, baixo risco, gera valor imediato.
2. **Atestado de Saúde Emocional** (4-5 dias) — utilidade prática alta, reuso de dados existentes.
3. **Plano de Legado** (8 dias) — feature de confiança, exige PDF + email + token share. Complexidade média.
4. **Retrospectiva anual** (6-7 dias) — feature hero, depende de IA com extended thinking. Deve ser a mais polida.
5. **Viagem internacional** (11 dias + curadoria contínua) — a mais cara de manter, deixa pra depois quando tiver bandwidth de editor.

---

## Princípios comuns

Todas as 5 features seguem:

- **Registro Elite** (3ª pessoa literária, sem exclamação performática, sem onomatopeia, sem vocativo fofinho, sem assinatura "— seu pet"). Ver seção "Registro Elite" do `CLAUDE.md` principal.
- **Sem gamificação** — nenhuma ganha XP, badge, pontuação. São marcos narrativos, não mecânicas.
- **Tipografia Elite**: Inter + Playfair + JetBrains Mono. Paleta Ametista & Jade.
- **AI-first** onde aplicável (STT em campos longos, OCR em documentos).
- **PDF sempre via `PdfActionModal`** (regra inviolável do CLAUDE.md).
- **LGPD-friendly**: tudo exportável, nada vendido, soft-delete em tudo.

---

## Decisões transversais pendentes

Antes de começar qualquer uma:

1. **Provedor de e-mail transacional** — Resend vs Postmark vs SendGrid. Afeta Legado + notificações.
2. **Provedor de PDF server-side** — Puppeteer headless vs `expo-print` server-side vs serviço externo. Afeta todas as 5.
3. **Parceiro de photobook** — Photobook Brasil / Umbrella Books / Mimo. Afeta Retrospectiva.
4. **Editor de conteúdo** — quem cura país-a-país as regras de viagem? Afeta Viagem Internacional.

Essas 4 decisões podem ser tomadas em paralelo, sem bloquear dev.

---

## Escopo fora deste Pilar (explícito)

As seguintes features do plano de posicionamento **não entram em Pilar 6** — estão em outros pilares ou fora de escopo:

- Conselho Clínico → Pilar 5, **decidido fora de escopo** (ver memória `project_conselho_clinico_out_of_scope.md`)
- Círculo / rede social Elite → Pilar 4, ver `docs/circulo-spec.md`
- Identidade visual (Ametista & Jade + Inter + Playfair) → Pilar 2, **já aplicado no código**
- Voz literária nos prompts e i18n → Pilar 1, **concluído em 2026-04-23**

---

## Próximo passo

Quando Belisario quiser destravar as 5 features, a sequência recomendada é:

1. Fechar as 4 decisões transversais (provedores + parceiros)
2. Executar **Carta ao pet** como primeira feature (mais simples, valida pipeline de CRUD + PDF)
3. Seguir para **Atestado** (valida reuso de dados do core)
4. Depois **Legado** (valida envio de e-mail + token share)
5. Depois **Retrospectiva** (feature hero)
6. Depois **Viagem** (a mais complexa e dependente de curadoria)

Cada uma pode ser uma sprint isolada de 1 semana-e-meia. Total do Pilar 6: **~8 semanas** de dev + curadoria contínua.
