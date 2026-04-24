# auExpert Elite — Reposicionamento (pasta dedicada)

Tudo relacionado ao reposicionamento do app para tutores de elite
(público R$ 129/mês) vive aqui. Nenhum arquivo desta pasta é código de
produção — são documentos de estratégia, identidade e entregáveis de
marketing que orientam as mudanças que serão aplicadas ao código do app.

**Separação explícita:**
- `/docs/` fora daqui = documentação técnica do app (schema, auditorias, CLAUDE.md, etc.)
- `/docs/elite/` = trabalho de reposicionamento, identidade visual e lançamento comercial

---

## Estrutura

```
elite/
├── README.md                    ← este arquivo (índice)
├── posicionamento/              ← estratégia e planos
│   ├── 2026-04-22_plano_elite_auexpert.md
│   ├── 2026-04-22_plano_lancamento_junho.md
│   ├── 2026-04-22_pitch_conselheiros_clinicos.md
│   └── 2026-04-22_briefing_logotipo_designer.md
├── identidade/                  ← identidade visual
│   └── wordmark/
│       ├── wordmark_preview.html
│       ├── wordmark_variacao_a.svg    (editorial)
│       ├── wordmark_variacao_b.svg    (clássica — ESCOLHIDA)
│       ├── wordmark_variacao_c.svg    (sussurrada)
│       └── png/                       (será preenchido pelo usuário)
├── site/                        ← landing auexpert.com.br
│   └── (HTML/CSS estático a construir)
└── codigo/                      ← snippets e patches a aplicar no app
    └── (diffs e trechos de código a aplicar em produção)
```

---

## Status das frentes

| Frente | Situação | Próximo passo |
|--------|----------|---------------|
| **Plano elite (estratégia geral)** | ✅ Escrito | Revisar e iterar se necessário |
| **Plano de lançamento junho/2026** | ✅ Escrito | Executar cronograma semana a semana |
| **Pitch conselheiros clínicos** | ✅ Escrito | Adiado para 2º semestre (pós-receita) |
| **Briefing técnico do logotipo** | ✅ Escrito | Referência — designer externo adiado |
| **Wordmark SVG** | ✅ 3 variações salvas | **Variação B escolhida** — gerar PNG |
| **Landing auexpert.com.br** | 🔜 Pendente | Build do HTML estático + upload cPanel |
| **Swap da paleta** (`#E8813A` → `#D17547`) | 🔜 Pendente | Patch em `constants/colors.ts` |
| **Swap da fonte** (Caveat → Cormorant) | 🔜 Pendente | Patch em `constants/fonts.ts` |
| **Reescrita i18n tom literário** | 🔜 Pendente | Refazer `pt-BR.json` + `en-US.json` |
| **Remoção gamificação dos screens** | 🔜 Pendente | Identificar + limpar referências |
| **Integração Pagar.me** | 🔜 Pendente | Edge Function + hook + gate premium |

---

## Decisões tomadas

1. **Modo bootstrap** — zero contratação externa pré-receita. Tudo executado por Belisario + Claude com ferramentas gratuitas.
2. **Domínio** — `auexpert.com.br` já registrado, DNS apontando para HostGator (br916/br917).
3. **Hospedagem** — cPanel HostGator existente (mesma conta do `multiversodigital.com.br`). Zero serviço novo.
4. **Wordmark** — Cormorant Garamond (Google Fonts, licença OFL gratuita). Variação B escolhida (regular 400 + bold 700).
5. **Ícone do app** — mantido o atual (`icon_app_ok.png`) para o lançamento. Redesign adiado.
6. **Conselho clínico** — adiado para 2º semestre de 2026 (não é pré-requisito do lançamento).
7. **Meta de lançamento** — junho/2026 com 150 assinantes (R$ 19.500/mês) = break-even no mês 1.

---

## Como trabalhar nesta pasta

- Todo novo documento de estratégia → `posicionamento/` com prefixo de data `YYYY-MM-DD_`.
- Toda iteração visual (logo, paleta, exemplos) → `identidade/`.
- Todo HTML/CSS/imagem do site de vendas → `site/`.
- Todo snippet/diff que será aplicado no código do app → `codigo/` (com descrição clara do arquivo-alvo).
- Esta pasta **não entra no bundle do app**. Se algum dia virar ignorada via `.gitignore`, sem perda.
