# Migração Elite — Auditoria de Call Sites

Inventário feito em 2026-04-23 via `grep -r "colors.<token>"` em `.ts` e `.tsx`, excluindo `node_modules/` e `docs/`.

## Tokens legacy — volume por token

| Token legacy       | Call sites | Tipo de migração | Destino               |
|--------------------|-----------:|------------------|-----------------------|
| `colors.accent`    |        782 | **Mecânica**     | `colors.click`        |
| `colors.accentLight`|         2 | Mecânica         | `colors.clickLight`   |
| `colors.accentDark`|         14 | Mecânica         | `colors.clickDark`    |
| `colors.accentGlow`|         59 | Mecânica         | `colors.clickSoft`    |
| `colors.accentSoft`|         13 | Mecânica         | `colors.clickSoft`    |
| `colors.accentMed` |          5 | Mecânica         | `colors.clickRing`    |
| `colors.petrol`    |        246 | **Revisão manual**| `textSec` ou `click` |
| `colors.petrolLight`|         0 | —                | —                     |
| `colors.petrolDark`|          1 | Mecânica         | `textSec`             |
| `colors.petrolGlow`|          4 | Mecânica         | `textSec`             |
| `colors.petrolSoft`|         30 | Mecânica         | — (usar `bgDeep` ou remover) |
| `colors.purple`    |        250 | **Revisão manual crítica** | `ai` OR `click` OR `textSec` |
| `colors.purpleSoft`|         37 | Revisão manual   | `aiSoft`              |
| `colors.gold`      |         97 | Mecânica         | `colors.warning`      |
| `colors.goldSoft`  |          4 | Mecânica         | `colors.warningSoft`  |
| `colors.rose`      |         77 | **Revisão manual**| `danger` OR `textSec` |
| `colors.roseSoft`  |          1 | Mecânica         | `dangerSoft`          |
| `colors.sky`       |         58 | **Revisão manual**| `textSec` OR `ai`    |
| `colors.skySoft`   |          2 | Mecânica         | — (depende do contexto) |
| `colors.lime`      |         46 | Mecânica         | `colors.success`      |
| `colors.limeSoft`  |          9 | Mecânica         | `colors.successSoft`  |
| **Total**          |      **1.735** |                  |                       |

**167 arquivos** tocam algum desses tokens.

---

## Plano de execução em 3 ondas

### Onda 1 — Renames mecânicos (automatizado via `migrate.sh`)

Tokens onde o destino é **inequívoco** e a substituição pode ser feita por `sed`:

```
colors.accent       → colors.click
colors.accentLight  → colors.clickLight
colors.accentDark   → colors.clickDark
colors.accentGlow   → colors.clickSoft
colors.accentSoft   → colors.clickSoft
colors.accentMed    → colors.clickRing
colors.gold         → colors.warning
colors.goldSoft     → colors.warningSoft
colors.lime         → colors.success
colors.limeSoft     → colors.successSoft
colors.petrolDark   → colors.textSec
colors.petrolGlow   → colors.textSec
colors.roseSoft     → colors.dangerSoft
```

Subtotal: **975 call sites** renomeados automaticamente. Sem risco, `tsc` valida no final.

### Onda 2 — Revisão manual por arquivo (caso a caso)

Tokens ambíguos — o contexto dita o destino. Revisor humano lê a linha e decide.

#### `colors.purple` (250 sites)

Três destinos possíveis:

1. **→ `colors.ai`** — quando era IA, análise, sparkle, observação, narração, score de confiança, mood inferido. Exemplo: `<Sparkles color={colors.purple} />` num card de análise → `colors.ai`.
2. **→ `colors.click`** — quando era biometria facial (ScanFace) ou outro elemento clicável que apontava pra modal/ação. Exemplo: botão "Reconhecimento facial" → `colors.click`.
3. **→ `colors.textSec`** — quando era decoração abstrata (cor de gato, tag de categoria sem função semântica). Exemplo: avatar de gato com fundo purple → fundo neutro `bgDeep`.

**Regra de ouro pra revisor:** ler o nome do componente e o contexto visual.
- Nome tem `AI`, `Analysis`, `Insight`, `Observation`, `Sparkle`, `Narr`, `Clarice`? → `ai`
- Componente é `TouchableOpacity`, `Pressable`, ícone de ação, `onPress={...}` próximo? → `click`
- Restante → `textSec` ou consultar caso.

#### `colors.petrol` (246 sites)

Dois destinos:

1. **→ `colors.click`** — ícones CLICÁVEIS que eram azul-petróleo (email, telefone, globo em contexto interativo). Se tem `onPress` no pai → `click`.
2. **→ `colors.textSec`** — ícones DECORATIVOS (email info, globo info, timestamp com ícone). Se é só ilustração → `textSec`.

#### `colors.rose` (77 sites)

Dois destinos:

1. **→ `colors.danger`** — memorial, cápsula de tempo, testamento, legado, pet falecido. Contexto semântico de perda.
2. **→ `colors.textSec`** — decoração romântica/emocional sem urgência clínica.

#### `colors.sky` (58 sites)

Dois destinos:

1. **→ `colors.ai`** — quando era observação inteligente (insight gerado, sugestão).
2. **→ `colors.textSec`** — decoração info genérica (viagem, clima, mapa).

#### `colors.purpleSoft` (37 sites), `colors.petrolSoft` (30 sites), `colors.skySoft` (2 sites)

Seguir o mesmo mapeamento do token base (purple → ai/click/textSec; sky → ai/textSec; etc), trocando pra versão `*Soft` correspondente quando fizer sentido (`aiSoft`, `clickSoft`), OU removendo a cor de fundo se era puramente decorativa.

### Onda 3 — Verificação

1. `tsc --noEmit` — garante que nada quebrou
2. `grep -r "colors\.(accent|petrol|purple|gold|rose|sky|lime)" --include='*.tsx' --include='*.ts' . --exclude-dir=node_modules --exclude-dir=docs` — deve retornar zero
3. Smoke test no device — abrir todas as telas principais (Hub, Pet, Diário, Prontuário, Agenda, Nutrição, Config)
4. Ativar o `audit-elite-tokens.ts` pre-commit hook (ver `elite-tokens.md §6.2`)

---

## Estimativas de esforço

| Onda                        | Esforço | Risco      | Automação |
|-----------------------------|---------|------------|-----------|
| Onda 1 — renames mecânicos  | 30 min  | Nenhum     | 100% `migrate.sh` |
| Onda 2 — revisão manual     | 3-4h    | Médio      | Caso a caso       |
| Onda 3 — verificação + fix  | 1-2h    | Baixo      | `tsc` + smoke test |
| **Total**                   | **5-7h**| —          | —                 |

**Bônus paralelo:** reescrita de `colors.ts`, `fonts.ts`, `AuExpertLogo.tsx` (~1h) acontece no início — é o que destrava todo o resto.

---

## Regressões conhecidas a cuidar

1. **Biometria facial** — o ícone `ScanFace` em contextos de login estava em `purple`. Precisa virar `click` se o ícone é o próprio botão, ou `textSec` se é decoração em um card clicável (o card é o toque, não o ícone).

2. **Gato vs Cão** — antigamente gato usava `purple` e cão usava `accent` como cor de "espécie". Na Elite, ambos os avatares ficam NEUTROS (`bgDeep` + `borderLight`) e a distinção vem do ICONE (Dog vs Cat). Nenhum deles usa cor de toque como decoração.

3. **Gráficos de métricas** — peso, humor, score de saúde usam `accent` e `purple` como séries de dados em alguns charts. Mapear pra `click`+`ai` (duas séries contrastantes), ou definir palette específica pra gráficos (fora do escopo desta migração).

4. **Botões de social/compartilhar** — WhatsApp costuma ser verde, PDF laranja, etc. Se houver cor de marca de terceiros hardcoded, manter (regra "cores hardcoded proibidas" não se aplica a cor de marca externa; mas revisar caso a caso).

5. **Narração do diário em Caveat** — o `handwriting` font foi aliasado pra Inter regular. Se houver componente que renderiza `fontFamily: fonts.handwriting` e visualmente depende da cursividade do Caveat, vai ficar estranho. Correção: trocar pra estrutura de container `aiSoft` com label jade e Inter regular (§4.9 do tokens-doc).
