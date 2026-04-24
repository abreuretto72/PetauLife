# Elite Design Tokens — Ametista & Jade

> **Documento de referência**, não implementação. Nada foi tocado no código do app.
>
> Quando a paleta Elite for oficialmente aprovada pra execução, este arquivo vira a fonte canônica pra reescrita de `constants/colors.ts`. Até lá, serve pra alinhamento e consulta.
>
> **Paleta escolhida:** Ametista & Jade (variação E da rodada de comparação).

---

## 1. Por que Ametista & Jade

A escolha desta paleta carrega um posicionamento de produto específico. O auExpert deixa de conversar na linguagem de "app-de-saúde-tech" (verde clínico, azul dashboard) ou de "pet-app-divertido" (laranja ou coral) e passa a ocupar um território que nenhum concorrente habita: **contemplativo, quase devocional**.

### O que cada cor representa

**Ametista (`#8F7FA8`, a cor do toque)** — pedra violeta do quartzo, historicamente símbolo de temperança, contemplação e sabedoria. Na tradição greco-romana protegia contra a embriaguez e fomentava clareza mental (o nome vem do grego *amethystos*, "não bêbado"). Bispos católicos usam anéis de ametista desde a Idade Média como sinal de humildade e sobriedade de juízo. Na psicologia da cor, o roxo fica na fronteira entre paixão e racionalidade — transmite equilíbrio, espiritualidade, introspecção. É também cor da realeza (pigmento raríssimo antes da síntese industrial). Brasilidade embutida: a Ametista do Sul, no Rio Grande do Sul, é um dos maiores polos mundiais de extração.

**No auExpert, ametista como cor do toque significa que cada gesto do tutor é ponderado.** Em vez de "latão = ação decidida", a ametista sussurra: "isto aqui merece atenção, você está cuidando de algo que ama". É o toque como ato de devoção, não como clique-em-tarefa.

**Jade (`#4FA89E`, a cor da IA)** — pedra mais venerada da cultura chinesa, mais que o ouro. Representa as cinco virtudes confucianas (benevolência, integridade, sabedoria, coragem, equidade). Na medicina tradicional chinesa, jade é símbolo de **saúde e longevidade** — imperadores eram sepultados com trajes inteiros de jade para preservar o corpo. Maias e astecas também tratavam como sagrado. Na psicologia da cor, o verde-azulado do jade evoca cura, harmonia, tranquilidade e renovação. Fica exatamente onde a natureza (verde) encontra o céu/clareza (azul).

**No auExpert, jade como cor da IA significa que a inteligência do app é curadora, não tecnológica.** Não é "robô processando dados" — é presença que observa, cura e aconselha. A conexão cultural entre jade, saúde e longevidade é quase literal: o app cuida da saúde e da expectativa de vida do pet.

**A dupla** — ametista × jade é combinação rara na cultura visual ocidental. Pintores do Renascimento usavam esse par pra retratar a Virgem (manto roxo sobre paisagem em tons de jade). Carrega densidade espiritual que nenhuma outra paleta avaliada tinha. Traduzida em código de produto: "o toque é ato de amor (ametista), a inteligência é presença que cura (jade)".

---

## 2. Princípio fundamental

**Ametista é o idioma do toque.**

Existe uma cor única reservada pra sinalizar "isto aqui você pode tocar": ametista `#8F7FA8`. Nenhum texto informativo, logo, status, borda decorativa, contador, ou ênfase tipográfica pode usar essa cor. A única exceção é a lixeira/perigo, que usa Tijolo `#C2645E`.

Quando uma tela viola essa regra, o tutor tenta tocar em algo inerte e perde confiança. Por isso o token chama-se `click` e não `accent` — o nome carrega a regra. Um desenvolvedor que escreve `colors.click` dentro de um `<Text>` estático pensa duas vezes; `colors.accent` não alerta ninguém.

**Corolário da regra:** quando você precisa dar ênfase a um texto informativo, nunca recorrer à cor. As ferramentas permitidas são peso tipográfico (400 vs 500), forma (romano vs itálico), família (serifa display vs sans), tamanho, ou cor semântica (jade/sálvia/âmbar/tijolo). Ametista é território exclusivo do toque.

### 2.1 Implicação importante: a IA deixa o roxo

No design system atual (v10), `purple` é a cor da IA. Na Elite Ametista & Jade, **purple/ametista passa a ser a cor do toque**, e a cor da IA migra para **jade**. Esta re-associação precisa ser aprendida pelo time e pelos usuários. Observações da IA, chips de mood inferido, sparkle icons — tudo passa a ser verde-azulado jade, nunca roxo.

Isso elimina um ruído do sistema antigo: no v10, o mesmo roxo aparecia em "biometria facial", "gatos" e "análise IA" — três papéis diferentes. Na Elite, a ametista é só toque, o jade é só IA, e os demais papéis passam a usar cores semânticas próprias.

### 2.2 Padrão canônico — autoria × severidade × substância

Todo conteúdo gerado pela IA no app obedece uma tripartição de papéis visuais. Esta é a regra que organiza a aparência de qualquer card, lente, achado ou observação inferida pelo algoritmo.

- **Autoria (jade)** sinaliza *quem* escreveu. Categoria, label, confidence score, badge de origem, sparkle icon, borda de card. Tudo que emana da IA carrega o marcador jade.
- **Substância (creme)** é o *conteúdo* em si. Texto do achado, frase do alerta, parágrafo da narração. Fica em `text` pra maximizar legibilidade. Nunca em jade — o olho precisa repousar no conteúdo.
- **Severidade (semântica)** comunica *quanto importa*. Chip de "normal"/"atenção"/"crítico", cor do valor numérico quando relevante (BCS em âmbar, peso em tijolo se subnutrido). Usa sálvia/âmbar/tijolo. Independente da autoria.

Exemplo concreto no card de achado de saúde da análise de foto:

| Elemento                             | Dimensão     | Token                |
|--------------------------------------|--------------|----------------------|
| `PELAGEM` (categoria em caixa alta)  | autoria      | `ai` (jade)          |
| `Parece saudável, brilho uniforme…`  | substância   | `text` (creme)       |
| `0,90` (confidence mono)             | autoria      | `aiText` (jade claro) |
| Sparkle icon                         | autoria      | `ai` (jade)          |
| `normal` (chip)                      | severidade   | `success` (sálvia)   |

**Consequência prática:** a IA fala sempre com o mesmo sotaque gráfico. Onde quer que o tutor veja jade, ele sabe — sem ler — "esta informação foi inferida por algoritmo". Onde quer que veja sálvia/âmbar/tijolo, sabe quanto deve se preocupar. Onde quer que veja Playfair itálico em creme, sabe que é a voz literária.

**Três papéis, três linguagens visuais. Nunca se sobrepõem, sempre convivem.**

Alertas ilustram bem o padrão em ação: um alerta de "risco de ingestão de corpo estranho" tem dois labels horizontais no topo do card — `INFERIDO PELA IA` em jade à esquerda (autoria), `SEGURANÇA` em tijolo à direita (categoria/severidade). O corpo do texto é creme (substância). Cada dimensão ocupa seu lugar sem brigar.

---

## 3. Paleta completa

### 3.1 Backgrounds e superfícies

| Token         | Hex     | Uso                                            |
|---------------|---------|------------------------------------------------|
| `bg`          | #0D0E16 | Ametista escura — fundo base de todas as telas (tinta com pitada sutil de violeta) |
| `bgCard`      | #161826 | Cards elevados, drawers, modais                 |
| `bgDeep`      | #08090F | Recessos, áreas afundadas, backdrop de modal    |
| `card`        | #1A1D2E | Cards interativos, inputs, elementos focáveis   |
| `cardHover`   | #1E2336 | Estado hover/pressed em superfícies clicáveis   |

### 3.2 Clique — ametista, cor do toque

| Token         | Hex       | Uso                                                     |
|---------------|-----------|---------------------------------------------------------|
| `click`       | #8F7FA8   | **Cor universal de clicáveis.** Stroke de ícones de ação, chevrons, CTAs filled, borda de botões |
| `clickLight`  | #A89BC0   | Hover em ícones e superfícies clicáveis                 |
| `clickDark`   | #6F6088   | Estado pressed                                          |
| `clickSoft`   | #8F7FA810 | Fundo sutil em torno de ícones de ação (wrappers)       |
| `clickRing`   | #8F7FA830 | Focus ring em inputs                                    |

### 3.3 Status — nunca clicável

| Token         | Hex       | Uso                                                     |
|---------------|-----------|---------------------------------------------------------|
| `ai`          | #4FA89E   | **Jade** — observação da IA, análise, mood inferido, sparkles |
| `aiSoft`      | #4FA89E10 | Fundo sutil de cards e chips de IA                      |
| `aiText`      | #7CC5BA   | Texto em chip de IA (mais claro que `ai` puro)          |
| `success`     | #7FA886   | Sálvia levemente fria — saúde OK, vacinas em dia, XP     |
| `successSoft` | #7FA88612 | Fundo sutil de chips e banners de sucesso               |
| `successText` | #9DC2A3   | Texto em chip de sucesso                                |
| `warning`     | #D4A574   | Âmbar — atenção moderada, lembretes (vacina próxima, agendamentos) |
| `warningSoft` | #D4A57412 | Fundo sutil de warnings                                 |
| `warningText` | #E4C08F   | Texto em chip de atenção                                |
| `danger`      | #C2645E   | Tijolo levemente arrosado — perigo, urgência, lixeira, vacinas vencidas |
| `dangerSoft`  | #C2645E12 | Fundo sutil de alerts críticos                          |
| `dangerText`  | #D48680   | Texto em chip de perigo (quando precisar ser lido sobre `dangerSoft`) |

**Observação sobre sálvia:** o verde da saúde foi ligeiramente puxado pra um tom mais frio (#7FA886 em vez de #7FA876) pra não brigar visualmente com o jade (verde-azulado). A olho nu é quase imperceptível; a preocupação é técnica — evitar que três verdes próximos se confundam em chips lado a lado.

**Observação sobre tijolo:** foi ajustado de `#B85450` para `#C2645E` — mais rosado, menos alaranjado. Harmoniza com a temperatura violeta/jade da paleta sem perder o peso semântico de "perigo".

### 3.4 Texto

| Token         | Hex       | Uso                                                     |
|---------------|-----------|---------------------------------------------------------|
| `text`        | #F0EDF5   | Luar — títulos, nomes de pet, texto principal (creme com toque lilás) |
| `textSec`     | #A89FB5   | Texto secundário, descrições, sub-rótulos               |
| `textDim`     | #6B6478   | Labels, captions, eyebrow em caixa alta                  |
| `textGhost`   | #3A3542   | Desabilitado, dividers textuais, silhuetas               |
| `placeholder` | #6B6478   | Placeholder de inputs (= `textDim`)                     |

**Nota:** o creme base da paleta Elite tem pitada de violeta (não é creme puro amarelado). Isso dá uma unidade cromática ao tema: tudo que é "neutro" carrega DNA da paleta. Se o creme fosse `#F3EDE3` (como Tinta & Latão), ficaria amarelado demais em contato com a ametista e o jade — pareceria cor de outro app.

### 3.5 Estrutura

| Token         | Hex       | Uso                                                     |
|---------------|-----------|---------------------------------------------------------|
| `border`      | #232538   | Bordas padrão de cards e inputs                         |
| `borderLight` | #2E314A   | Bordas internas, divisores dentro de listas             |
| `divider`     | #232538   | Linhas horizontais de separação (= `border`)             |

### 3.6 Universal

| Token         | Hex       | Uso                                                     |
|---------------|-----------|---------------------------------------------------------|
| `white`       | #FFFFFF   | **APENAS** em texto dentro de botão primário (fundo `click`) |

Preto puro `#000000` **nunca** é usado — no dark theme, o "preto" é sempre `bg` (#0D0E16).

### 3.7 Humores do pet → cores semânticas

O app tem 8 humores possíveis (`ecstatic`, `happy`, `playful`, `calm`, `tired`, `sad`, `anxious`, `sick`) mas a paleta Elite tem apenas 4 cores semânticas. Tabela oficial de mapeamento:

| Humor      | Cor semântica | Raciocínio |
|------------|---------------|------------|
| `ecstatic` | `success`     | Positivo-alto. Sálvia absorve sem ficar "gritante". |
| `happy`    | `success`     | Positivo estável. |
| `playful`  | `success`     | Energia positiva. Compartilha sálvia com `happy`/`ecstatic` — o ícone Lucide distingue. |
| `calm`     | `textSec`     | Neutro estável. Cinza levemente quente, sem urgência. |
| `tired`    | `textDim`     | Baixa energia ok. Mais dim que `calm`. |
| `sad`      | `textDim`     | Baixa energia com preocupação leve. Mesmo tom de `tired` — palavra e ícone carregam a distinção. |
| `anxious`  | `warning`     | Atenção moderada. Âmbar — "algo merece olhar". |
| `sick`     | `danger`      | Ação urgente. Tijolo. |

**Por que compartilhar cores:** humores positivos compartilham sálvia, humores baixos compartilham `textDim`. Isso é deliberado. O peso visual das 4 cores semânticas precisa ser calibrado: 3 cores fortes (sálvia/âmbar/tijolo) + neutro. Se cada humor tivesse sua própria cor, a paleta viraria "8 tons disputando atenção" e o sistema perderia hierarquia.

**Para dar nuance onde a cor não diferencia**, usar ícones emotivos (sobrancelhas, linha da boca, cauda) em Lucide. O ícone carrega o que a cor não.

---

## 4. Anatomia de uma tela — onde cada token vive

### 4.1 Header

- Fundo: `bg`
- Logo `auExpert`: `text` (luar brilhante, italico `au`) + `textSec` (luar dim, romano `Expert`). **Nunca `click`.**
- Tagline "INTELIGÊNCIA ÚNICA": `textDim`
- Ícone de menu (hamburger): stroke `click`
- Ícone de PDF: stroke `click`
- Ícone de sino: stroke `click`
- Dot no sino (tem notificação): `danger`

### 4.2 Card do tutor

- Fundo: `bgCard`
- Borda: `border`, 1px
- Radius: 20 (`radii.card`)
- Avatar circular: fundo `bgDeep`, borda `borderLight`, inicial em `text`. **Nunca ametista internamente** — o avatar não é uma ação independente; a ação é o card inteiro.
- Nome do tutor: Playfair 500 `text`
- Subtítulo (cidade, membro desde): system-sans `textSec`
- "Nível 3": Playfair itálico `text`. **Nunca `click`** (status, não ação).
- XP mono: `textDim`
- Barra de XP: trilho `border`, preenchimento `success` (sálvia)
- Stats (2 Pets, 47 Diário, 12 Fotos, 1 Co-tutor): números em mono `text`, labels em system-sans `textDim`
- Chevron à direita (afordância do toque): stroke `click`

### 4.3 Card do pet

- Mesma estrutura de superfície que o card do tutor
- Avatar do pet (ícone de patinha): fundo `bgDeep`, borda `borderLight`, paw com fill `#C2B8CE` (luar empoeirado, neutro) — **nunca `click`**
- Nome do pet: Playfair 500 `text`, 20-22px
- Eyebrow de raça ao lado do nome: system-sans `textDim` caixa alta, 9px letter-spacing 1px
- Score de saúde: mono em cor semântica pura — `success` se ≥80, `warning` se 60-79, `danger` se <60
- Label "saúde": `textDim` caixa alta
- Subtítulo (sexo, idade, peso): system-sans `textSec` em uma linha só
- Chips de status: semânticos conforme §3.3 — nunca `click`
- Footer "última entrada hoje · 24 no total": `textSec`
- Chevron: `click`
- Ação inline (Minha IA / Diário / Agenda): ver §4.7

### 4.4 Chips (status, tags, badges)

| Tipo de chip        | Fundo          | Borda                    | Texto          |
|---------------------|----------------|--------------------------|----------------|
| Saudável/OK         | `successSoft`  | `success` + 30%          | `successText`  |
| Inferido pela IA    | `aiSoft`       | `ai` + 30%                | `aiText`       |
| Atenção/futuro      | `warningSoft`  | `warning` + 30%           | `warningText`  |
| Perigo/urgente      | `dangerSoft`   | `danger` + 30%            | `dangerText`   |
| Neutro/informativo  | `bgDeep`       | `border`                  | `textSec`      |

### 4.5 Botão primário (CTA)

- Fundo: `click` sólido (ametista)
- Texto: `white` (única aparição permitida de branco puro)
- Borda: nenhuma
- Radius: 14
- Sombra: opcional; se houver, tint `click` com 25% opacidade
- Pressed: fundo `clickDark`

### 4.6 Botão secundário (outline)

- Fundo: transparente ou `card`
- Borda: `border`, 1.5px
- Texto: `click`
- Ícone interno: stroke `click`
- Radius: 12
- Hover: borda `click` + 30%

### 4.7 Ação inline do pet card (Minha IA / Diário / Agenda)

Três botões em grid, dentro de contêiner afundado no próprio card.

- Contêiner: fundo `bgDeep`, borda `border`, radius 14
- Divisores verticais: `border`, 0.5px
- Cada botão:
  - Ícone quadrado: fundo `clickSoft`, borda `click` + 30%, stroke do ícone em `click` (ametista)
  - Label "Minha IA / Diário / Agenda": Playfair 500 `text`, 11.5px
  - Sub-rótulo contextual ("3 observações", "24 entradas", "vacina em 7d"): system-sans `textDim`, 8.5px
  - Dot de novidade no canto superior direito: `ai` (jade, indica observação de IA nova) ou `warning` (âmbar, lembrete próximo). **Nunca `click`** — é sinalização, não afordância.
  - Badge numérica com urgência: fundo `danger`, texto `text`, mono 9px — aparece apenas quando há contagem crítica (vacina vencendo em dias)

### 4.8 Botão destrutivo (lixeira)

- Fundo: transparente
- Ícone `Trash2` (Lucide): stroke `danger`
- Texto adjacente (se houver): `danger`
- Confirmação via `confirm()` do Toast sempre obrigatória
- **Esta é a única exceção à regra "tudo clicável é ametista".** Tijolo sinaliza irreversibilidade.

### 4.9 Card de observação da IA

- Fundo: `aiSoft` (jade muito sutil)
- Borda: `ai` + 25%, 0.5px
- Radius: 14-18
- Label "OBSERVAÇÃO DA IA" em caixa alta: `ai` (jade), letter-spacing 2px, 8-9px
- Ícone sparkle: fill `ai`
- **Aspas retas** (" ... ") visíveis abrindo e fechando o corpo do texto, tamanho 18-20px, cor `ai` (jade), peso 500 — funcionam como sinal gráfico de "isto é uma voz"
- Corpo do texto: **Inter regular 15px**, cor `text` opacity 0.92-0.94, line-height 1.7, letter-spacing 0.1px — a voz literária (Clarice) se distingue pela combinação container jade + label jade + aspas jade + size/leading maior que o body normal. **Nunca itálico** (ver §5.10). **Nunca serifa** — a escolha de sans-serif foi deliberada em 2026-04-23 para priorizar legibilidade máxima e coerência com o restante da UI

### 4.10 Alert de vacina atrasada (exemplo de dangerSoft em uso)

- Fundo: `dangerSoft`
- Borda: `danger` + 30%
- Ícone `AlertTriangle`: stroke `danger`
- Texto: `danger` ou `dangerText`
- Chevron à direita (é clicável, abre prontuário): stroke `click` (ametista)
- **Observação crítica:** mesmo sendo um alerta vermelho, a afordância do toque continua sendo `click`, não `danger`. O tijolo comunica "perigo", a ametista comunica "você pode tocar aqui pra ir ver". Misturar os papéis quebra a regra.

### 4.11 Entrada de diário — três vozes simultâneas

A tela de diário é o lugar onde convivem **três vozes distintas** dentro de um mesmo card:

1. **Voz do tutor** — o que o tutor realmente digitou ou falou
2. **Voz literária da IA** — narração gerada pelo pipeline Clarice, em 3ª pessoa
3. **Inferências da IA** — chips de lente (mood, categoria, tags classificadas)

A distinção entre as vozes **não pode depender de cor**. A cor está ocupada com outras responsabilidades (toque, autoria, severidade). A distinção entre vozes é **tipográfica**:

- Voz do tutor: Inter regular 14px em `textSec`, dentro de caixa com fundo `bgDeep` e barra lateral esquerda em `borderLight`
- Voz da IA literária: Inter **regular 15px** (nunca itálico, nunca serifa) em `text`, dentro do container canônico de narração — fundo `aiSoft`, borda `aiBorder` 0,5px, radius 14, label "NARRAÇÃO DA IA" em caixa alta jade no topo, aspas retas jade visíveis no início e fim do texto (padrão idêntico ao §4.9)
- Inferências da IA: chips com sparkle icon jade (autoria) + cor semântica de severidade

**Estrutura do card:**

- Fundo: `bgCard`; radius: 18; borda: `border`

**Cabeçalho da entrada:**
- Círculo de humor à esquerda: fundo `bgDeep`, borda `borderLight`, ícone Lucide em cor semântica do humor (ver §3.7)
- Horário: JetBrains Mono, `textDim`
- Label do humor: system-sans, `textSec`
- Menu `⋯` (kebab) à direita: `click` (ametista) — **é clicável**, abre ações (editar/excluir). Se pintar em `textDim`, tutor não sabe que pode tocar.

**Foto anexa (opcional):**
- Placeholder `bgDeep`, radius 12, borda `border` 0,5px

**Quote do tutor:**
- Fundo: `bgDeep`
- Borda lateral esquerda: 2px em `borderLight` (**NÃO ametista** — a barra é decorativa, não é afordância de toque)
- Radius: 8
- Texto com aspas retas, ilustrando que é fala literal do tutor

**Narração da IA (voz Clarice):**
- Dentro do container canônico §4.9: fundo `aiSoft`, borda `aiBorder` 0,5px, radius 14, padding 13-15px
- Label no topo: "NARRAÇÃO DA IA" em caixa alta jade (10px letter-spacing 2,2px), sparkle icon à esquerda
- Aspas retas jade visíveis abrindo e fechando (18-20px peso 500 cor `ai`, atuam como sinal gráfico)
- Inter **regular 15px** (nunca itálico, nunca serifa) em `text`, opacity 0,92-0,94, line-height 1,7, letter-spacing 0,1px
- A voz literária se distingue por quatro sinais em paralelo (container + label jade + aspas jade + size/leading maior), nunca pela forma ou família da letra

**Lentes inferidas (chips na parte inferior do card):**
- Conforme §3.4 — jade com sparkle quando observação IA, sálvia/âmbar/tijolo quando status, neutral (`bgDeep` + `textSec`) quando etiqueta temática

### 4.12 Card de identificação com stripe jade

Quando a IA produz uma identificação principal (análise de foto → raça/espécie, OCR de carteira de vacina → nome/lote/data, classificação de documento → tipo), o card que apresenta esse resultado principal usa um padrão visual especial: **stripe jade horizontal de 26px×2px no topo do card, alinhada à esquerda do título**.

**Por que existe:** o card precisa ter fundo `bgCard` (como os outros cards principais do app) pra não poluir a tela, mas precisa também ser identificado visualmente como saída da IA. A stripe funciona como selo — discreta, mas inconfundível. É o equivalente visual de assinatura no canto da página.

**Especificação:**

- Posição: `absolute; top: 0; left: 18px` (alinhada à esquerda do título do card)
- Dimensões: `width: 26px; height: 2px`
- Cor: `ai` (jade, sólido)
- Radius: `0 0 2px 2px` (cantos inferiores levemente arredondados)

**Quando usar:**

- Card de identificação principal na análise de foto (raça, espécie, idade estimada, sexo, peso)
- Card de resultado de OCR (extração de carteira de vacina, bula, receita)
- Card de classificação de documento (quando a IA identifica o tipo)

**Quando NÃO usar:**

- Cards de observação já marcados com label "OBSERVAÇÃO DA IA" em caixa alta jade (§4.9) — a stripe seria redundante
- Cards de achado de saúde individuais — já têm sparkle icon + categoria em jade
- Cards de predisposição racial — já têm label "INFERIDO — [raça]" em jade

**Regra geral:** a stripe existe pra cards que **de outra forma pareceriam ser conteúdo escrito pelo tutor**. Se o card tem texto primário em `text` (creme) e estrutura de "fato principal", ele precisa da stripe pra declarar autoria sem interferir na legibilidade do conteúdo.

---

## 5. Tipografia Elite — legibilidade antes da estética

**Regra fundamental:** toda tela deve ser legível antes de ser bonita. Se um conflito aparecer entre elegância e leitura, **leitura vence sempre**. Os mockups de validação usaram tamanhos propositalmente pequenos pra caber no viewport de comparação — **a implementação real obedece os mínimos abaixo**.

### 5.1 Famílias tipográficas

- `display`: `'Playfair Display', 'Didot', Georgia, serif` — **apenas** logo (`au` italic) e títulos literários de tela (nomes de pet em cards, título "Diário da Mana", etc.). Nunca corpo de texto nem narração.
- `body`: **Inter** (confirmado em 2026-04-23) — UI, labels, botões, corpo de texto geral, quotes do tutor, narração da IA. Inter é a família canônica do texto verbal do app.
- `mono`: `'JetBrains Mono', monospace` — scores numéricos, timestamps, níveis, XP, confidence
- `handwriting`: **removido**. A narração (voz Clarice) usa Inter regular 15px dentro do container canônico de IA (§4.9), nunca itálico, nunca serifa, nunca Caveat.

### 5.1.1 Cross-platform — Inter em iOS e Android

Inter não é fonte nativa em iOS nem em Android — precisa ser **bundlada no app** via `expo-font`. Padrão de implementação:

```typescript
// app/_layout.tsx
import { useFonts } from 'expo-font';
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
} from '@expo-google-fonts/inter';

const [loaded] = useFonts({
  Inter_300Light, Inter_400Regular, Inter_500Medium,
  PlayfairDisplay_500Medium, PlayfairDisplay_500Medium_Italic,
  JetBrainsMono_400Regular, JetBrainsMono_500Medium,
});
```

**Fallback em `fonts.ts`:**

```typescript
// constants/fonts.ts
export const fonts = {
  display: "'PlayfairDisplay_500Medium', 'Didot', 'Georgia', serif",
  displayItalic: "'PlayfairDisplay_500Medium_Italic', 'Didot', serif",  // APENAS logo
  body: "'Inter_400Regular', -apple-system, 'SF Pro Text', 'Segoe UI', 'Roboto', sans-serif",
  bodyMed: "'Inter_500Medium', -apple-system, 'SF Pro Text', sans-serif",
  mono: "'JetBrainsMono_400Regular', 'SF Mono', 'Menlo', 'Consolas', monospace",
};
```

**Por que Inter e não SF Pro:**

- **SF Pro** é bloqueado por licença fora do ecossistema Apple — não pode ser bundlado em app Android.
- Usar `system-ui` daria SF Pro no iOS e Roboto no Android — **inconsistência visual entre plataformas** que um app Elite não deve ter.
- **Inter** é gratuita (OFL), bundlável em ambas as plataformas, e foi desenhada especificamente pra UI digital. Tem x-height alta, boa legibilidade em tamanhos pequenos, e pareia bem com Playfair Display.
- Inter é usada por Figma, Linear, Vercel, Stripe — pacote de apps que o público Elite já conhece visualmente.

**Custo:** Inter 4 pesos (300/400/500/700 italic do logo + Playfair 500+500italic) adicionam cerca de ~200-280 KB ao bundle. Aceitável pro tier Elite. Para reduzir, subset via `expo-font` pra carregar só Latin + caracteres PT-BR (remove cirílico, árabe, CJK).

**Teste de validação obrigatório antes de aprovar produção:**

1. Tela de diário no iPhone SE (tela pequena, densidade 2x) — narração em 15px precisa ler confortavelmente
2. Tela de diário no Android compacto (Samsung Galaxy A14, densidade variada) — mesma narração, mesmo conforto
3. Tela em iPad ou tablet Android grande — Inter escala bem ou fica "pequena demais"?
4. Comparação direto com SF Pro no iPhone (abrir o app ao lado do Notes do iOS): a diferença de renderização é aceitável?

### 5.2 Tamanhos mínimos obrigatórios

Valores são expressos em pixels lógicos e devem passar por `fs()` (responsive) na implementação. **Nada abaixo desses pisos**, em nenhuma tela, em nenhuma condição.

| Elemento                        | Família  | Peso | Tamanho mínimo | Tamanho recomendado | Line-height |
|---------------------------------|----------|------|----------------|---------------------|-------------|
| Título de tela (H1)             | display  | 500  | 20px           | 22-24px             | 1.2         |
| Seção (H2)                      | display  | 500  | 17px           | 18-20px             | 1.2         |
| Nome de pet em cards            | display  | 500  | 18px           | 20-22px             | 1.2         |
| Corpo de texto (UI)             | body     | 400  | **14px**       | 15-16px             | 1.5         |
| Texto secundário/descrição      | body     | 400  | **12px**       | 13-14px             | 1.5         |
| Label / eyebrow / caption       | body     | 500  | **11px**       | 12px                | 1.3         |
| Placeholder de input            | body     | 400  | 14px           | 15px                | —           |
| Scores numéricos (destaque)     | mono     | 500  | 14px           | 16-22px             | 1.1         |
| Números de apoio / timestamp    | mono     | 400  | **11px**       | 12px                | 1.2         |
| **Narração IA (voz Clarice)**   | display  | 400  | **15px**       | **16-18px**         | **1.7**     |
| Quote do tutor (no diário)      | body     | 400  | 13px           | 14px                | 1.5         |
| Disclaimer / legal fine print   | body     | 400  | 11px           | 11-12px             | 1.5         |
| Label dentro de botão primário  | body     | 500  | 14px           | 15-16px             | —           |

**Destaque em negrito:** o piso de legibilidade do corpo de texto é **14px**. Os mockups de validação usaram 11-13px pra efeito visual, mas isso não escala. Em device real, a fadiga começa antes de 14px.

**A narração da IA em Playfair Display regular merece atenção especial.** Serifas pequenas se tornam ilegíveis mais rápido que sans-serifs pequenas. A narração Clarice não pode ficar abaixo de 15px — recomendado 16-18px com line-height 1.7. Isso dá ar à prosa, respeita a cadência literária e resolve o problema de serifa condensada no scroll mobile. **Nunca em itálico** (ver §5.10).

### 5.3 Pesos permitidos

- **400 (regular)** e **500 (semibold)** — apenas estes dois.
- **Nunca 600 ou 700** em texto corrido — peso pesado briga com a elegância do Playfair e da direção editorial.
- **Exceção:** títulos display podem ir a 500, nunca além.

Hierarquia tipográfica na Elite vem de **tamanho + família + contraste de cor**, não de peso. Um título não é "mais grosso" que o corpo — é maior, em serifa, contra um texto em sans regular.

### 5.4 Contraste mínimo sobre fundo escuro

Medido contra `bg` = `#0D0E16` (dark ink com tint violeta).

| Token         | Hex       | Contraste vs bg | Uso permitido                         |
|---------------|-----------|-----------------|---------------------------------------|
| `text`        | #F0EDF5   | ~15:1           | Corpo de texto, títulos, narração. Qualquer tamanho. |
| `textSec`     | #A89FB5   | ~7:1            | Secundário, quotes. Qualquer tamanho a partir de 12px. |
| `textDim`     | #6B6478   | ~3.5:1          | Labels/captions a partir de 11px. **Não usar abaixo de 11px** — fica borderline. |
| `textGhost`   | #3A3542   | ~1.5:1          | **Decorativo apenas** — dividers, placeholders de ícones. **Nunca texto informativo.** |

Regra geral: se a informação é importante pro tutor, usa `text` ou `textSec`. `textDim` é só pra apoio (timestamps, contadores, labels de seção). `textGhost` não é texto — é estrutura.

### 5.5 Comprimento de linha em prosa

Para narrações literárias (voz Clarice no diário, observação literária na análise de foto, descrição narrativa em insights):

- **Ideal: 55-70 caracteres por linha.** Mais que isso, o olho perde o retorno; menos que isso, vira poesia visual.
- Largura do card deve ser ajustada pra caber isso com line-height 1.7.
- Em phone ~380px, com padding de 16px cada lado e Playfair itálico 16px, isso dá aproximadamente 50-55 chars/linha — no limite. **Aceitável**, mas se o texto ficar mais largo que o card padrão, quebrar em parágrafo menor.

Para texto UI (descrições, labels, mensagens de erro):

- Sem limite rígido; o tamanho do container natural já garante quebras apropriadas.

### 5.6 Espaçamento entre linhas de texto literário

- Narração IA (Playfair Display regular, dentro do container canônico §4.9): **line-height 1.7** sem exceção. É o que separa "bela prosa" de "tijolo de texto".
- Parágrafos de narração precisam ter margin entre si — nunca quebrar com `<br>` consecutivos.

### 5.7 Texto sobre fundos coloridos (chips, alerts)

Chips e badges usam uma versão mais clara da cor semântica pra texto, garantindo contraste ≥ 4.5:1:

| Chip de             | Fundo           | Texto         | Contraste |
|---------------------|-----------------|---------------|-----------|
| Sucesso (sálvia)    | `successSoft`   | `successText` (#9DC2A3) | ~5.5:1 |
| IA (jade)           | `aiSoft`        | `aiText` (#7CC5BA)      | ~5:1   |
| Atenção (âmbar)     | `warningSoft`   | `warningText` (#E4C08F) | ~6:1   |
| Perigo (tijolo)     | `dangerSoft`    | `dangerText` (#D48680)  | ~4.8:1 |

Nunca usar a cor pura (`success`, `ai`, `warning`, `danger`) como texto sobre o próprio fundo `soft` — o contraste cai abaixo de 4.5:1. Sempre a versão `...Text`.

### 5.8 Regra anti-fadiga

Em qualquer tela com mais de 3 parágrafos de prosa contínua (análise de foto, relatório mensal, insight semanal):

- Quebrar em blocos visuais com respiro (margin vertical ≥ 16px entre blocos)
- Nunca apresentar texto contínuo por mais de 10 linhas sem um elemento visual de pausa (ícone, chip, divisor, citação destacada)
- Playfair itálico em volume acima de 15 linhas causa fadiga mesmo em tamanho correto — quebrar com citação, lista ou espaço branco

### 5.9 Resumo para design review

Antes de aprovar qualquer tela, checar:

1. Todo corpo de texto tem ≥ 14px?
2. Toda narração IA tem ≥ 15px e line-height 1.7?
3. Nenhum label informativo fica em `textDim` com menos de 11px?
4. Nenhum texto informativo está em `textGhost`?
5. Chips usam `...Text` (não a cor pura) sobre fundo `...Soft`?
6. Prosa tem entre 55-70 chars por linha?
7. Nenhum parágrafo passa de 10 linhas sem respiro visual?
8. **Nenhum texto está em itálico? (Apenas o logo pode)**

### 5.10 Itálico é proibido em texto

Regra herdada do CLAUDE.md inviolável (#10 — "Nunca `fontStyle: 'italic'` em texto corrido") e mantida na Elite com interpretação ampliada: **itálico nunca em texto verbal de qualquer tipo**. Isso inclui corpo de texto, narração literária, labels, quotes, humores, scores, tags, qualquer conteúdo legível.

**A única aparição permitida de itálico é no logo `auExpert`** — o `au` em Playfair Display itálico porque o logo é marca, não texto corrido.

Quando precisar sinalizar "isto é literário" ou "isto é uma voz especial" (narração da IA, observação Clarice), usar a combinação canônica de quatro sinais em paralelo:

1. Família Playfair Display (serifa vs sans UI do restante)
2. Container com fundo `aiSoft` + borda `aiBorder` (0,5px)
3. Aspas retas visíveis no início e fim
4. Label em caixa alta jade com sparkle icon no topo do container

Cada um desses sinais reforça os outros. Nenhum depende da forma da letra.

**Correção que qualquer revisor precisa cobrar:** se um PR mostra `font-style: italic` em qualquer componente que não seja o `AuExpertLogo`, reprovar sem negociação.

---

## 6. Enforcement — como a regra nunca quebra

### 6.1 Nomenclatura dos tokens

O nome é a primeira linha de defesa:

- `click` comunica função, não cor. O desenvolvedor que quer destacar um texto pensa duas vezes antes de escrever `colors.click`.
- `accent` foi **removido** intencionalmente — palavra genérica que não carrega regra.
- `brand`, `primary`, `highlight` também não existem no token set.
- `purple` também foi removido: ametista é `click`, jade é `ai` — a palavra "roxo" some do vocabulário do código pra forçar o time a pensar em função, não em cor.

### 6.2 Script de auditoria

Proposta de `scripts/audit-elite-tokens.ts`, rodado em pre-commit:

- Procura por `#[0-9a-fA-F]{3,6}` em todo `.tsx` fora de `constants/`. Zero tolerância — commit falha se achar (exceção explícita: `#FFFFFF` em texto dentro de botão primário).
- Procura por `colors.click` dentro de `<Text>` sem prop `onPress` no pai e sem ancestral clicável → warning.
- Procura por tokens legacy (`colors.accent`, `colors.petrol`, `colors.purple`, `colors.gold`, `colors.rose`, `colors.sky`, `colors.lime`) → warning + sugestão de substituição.

### 6.3 Checklist de design review

Antes de aprovar qualquer PR de UI:

1. Todo elemento em `click` (ametista) tem handler de toque funcionando?
2. Todo texto informativo está em `text`/`textSec`/`textDim`, nunca em `click`?
3. Status (saúde, vacina, mood) está em cor semântica apropriada?
4. Logo e cabeçalhos nunca tocam `click`?
5. Avatar de pet/tutor tem fundo neutro (`bgDeep`), nunca ametista?
6. Lixeira é `danger` (tijolo), não `click`?
7. Observação da IA está em Playfair itálico com label `ai` (jade)?

### 6.4 CLAUDE.md atualização

Quando a Elite entrar, o capítulo "Cores" do CLAUDE.md será reescrito pra:

- Apontar pra este `elite-tokens.md` como fonte canônica
- Enunciar as duas regras inviolávieis: **ametista só é toque; jade só é IA**
- Listar as exceções conscientes (lixeira em `danger`; branco puro apenas em texto de CTA)
- Remover a tabela antiga de 14 cores semânticas (lime, sky, rose, gold) que perderam papel

---

## 7. Migração — o que muda de nome

| Token atual              | Token Elite          | Observação                                                    |
|--------------------------|----------------------|---------------------------------------------------------------|
| `colors.accent`          | `colors.click`       | Renomeado pra carregar a regra; cor muda de laranja `#E8813A` pra ametista `#8F7FA8` |
| `colors.accentLight`     | `colors.clickLight`  | Cor muda correspondentemente                                  |
| `colors.accentDark`      | `colors.clickDark`   | —                                                             |
| `colors.accentGlow`      | `colors.clickSoft`   | Simplificado — glow e soft faziam a mesma coisa                |
| `colors.accentMed`       | `colors.clickRing`   | Renomeado pra função (focus ring)                             |
| `colors.purple`          | `colors.click`       | **Atenção — renomeação com colisão.** No v10, `purple` era a IA; na Elite, roxo vira toque e IA vira jade. Todo uso de `purple` precisa ser revisto caso a caso: se era IA → vira `ai` (jade); se era decoração → vira `textSec` ou `click` dependendo da função. |
| `colors.purpleSoft`      | `colors.aiSoft`      | Migrado pra jade (se era IA) ou substituído por `clickSoft`    |
| `colors.petrol`          | **removido**         | Ícones decorativos migram pra `textSec`; ícones clicáveis viram `click` |
| `colors.gold`            | **removido**         | Conquistas/XP migram pra `warning` (âmbar) ou `success`        |
| `colors.goldSoft`        | **removido**         | Idem                                                          |
| `colors.rose`            | **removido**         | Legado/memorial migra pra `danger` ou `textSec`                |
| `colors.roseSoft`        | **removido**         | Idem                                                          |
| `colors.sky`             | **removido**         | Viagens migram pra `textSec` ou `ai` dependendo do contexto    |
| `colors.skySoft`         | **removido**         | Idem                                                          |
| `colors.lime`            | **removido**         | Nutrição migra pra `success`                                  |
| `colors.limeSoft`        | **removido**         | Idem                                                          |
| `colors.text`            | `colors.text`        | Hex muda: `#E8EDF2` (azul-frio) → `#F0EDF5` (luar lilás)       |
| `colors.textSec`         | `colors.textSec`     | Hex muda                                                      |
| `colors.textDim`         | `colors.textDim`     | Hex muda                                                      |
| `colors.bg`              | `colors.bg`          | Hex muda: `#0F1923` → `#0D0E16`                                |
| `colors.bgCard`          | `colors.bgCard`      | Hex muda                                                      |
| `colors.bgDeep`          | `colors.bgDeep`      | Hex muda                                                      |
| `colors.card`            | `colors.card`        | Hex muda                                                      |
| `colors.border`          | `colors.border`      | Hex muda                                                      |
| `colors.success`         | `colors.success`     | Hex muda: `#2ECC71` → `#7FA886` (sálvia mais fria, editorial)  |
| `colors.warning`         | `colors.warning`     | Hex muda: `#F1C40F` (amarelo puro) → `#D4A574` (âmbar)          |
| `colors.danger`          | `colors.danger`      | Hex muda: `#E74C3C` → `#C2645E` (tijolo arrosado)               |

### 7.1 Ponto crítico: a dupla migração do roxo

O caso mais delicado é o `purple`. Hoje ele carrega três papéis no app:

1. **IA / análise / narração** → na Elite vira `ai` (jade, `#4FA89E`)
2. **Gatos (cor de espécie)** → na Elite: avatares de pet são neutros; gatos e cães se distinguem pelo ícone, não pela cor
3. **Biometria facial** → na Elite vira `click` (ametista) se era ícone clicável, ou `ai` se era indicador

Toda ocorrência de `colors.purple` no código precisa passar por revisão manual durante a migração — não dá pra fazer busca/substituição cega. Esse é o ponto mais caro da migração em termos de esforço humano.

### 7.2 Telas que provavelmente precisam ajuste manual

Depois de reescrever `colors.ts`:

- Todo uso de `colors.petrol`, `colors.gold`, `colors.rose`, `colors.sky`, `colors.lime` → compilador TypeScript reclama, a gente troca um por um.
- Todo uso de `colors.purple` → revisão caso a caso (ver §7.1).
- Chips e badges com cor hardcoded (se houver) → caem na auditoria do script.
- Gradientes que misturavam `accent + accentLight` → viram `click + clickLight`, devem funcionar sem ajuste.

### 7.3 Telas que provavelmente NÃO precisam de nada

- Telas que só usam `bg`, `bgCard`, `text`, `textSec`, `border` → ganham a paleta nova de graça.
- Telas com ícones `color={colors.accent}` → viram `color={colors.click}` via busca/substituição global.

### 7.4 Estimativa de esforço

Supondo que o script de auditoria esteja pronto:

- Reescrita de `constants/colors.ts`: 30 min.
- Busca/substituição global de `accent→click`: 20 min.
- **Revisão manual do `purple` caso a caso**: 2-3h (é o gargalo).
- Correção de usos de tokens removidos (`petrol`, `gold`, `rose`, `sky`, `lime`): 2-3h.
- Verificação visual screen-by-screen no device: 2h.
- Commit, CLAUDE.md update, add pre-commit hook: 30 min.

**Total estimado: uma sessão focada de 6-8h**, sem incluir tipografia (capítulo próprio).

---

## 8. Logotipo — regras tipográficas

O logo deixa de ser o mascote cartoon do cachorro com balão "au" e passa a ser um **wordmark tipográfico**:

- `au` em Playfair Display (ou Didot) **itálico**, peso 500, cor `text` (luar brilhante)
- `Expert` em Playfair Display **romano**, peso 500, cor `textSec` (luar dim)
- Tagline "INTELIGÊNCIA ÚNICA" abaixo: system-sans caixa alta, 8px, letter-spacing 2.4px, cor `textDim`
- Três tamanhos oficiais mantidos: `large` (login), `normal` (header interno), `small` (drawer)
- **O mascote cartoon fica reservado pro ícone de loja/homescreen do celular** — lá o cachorro continua vivendo. Nas telas internas do app, nunca.

Benefício: o wordmark escala pra contextos pequenos (favicon, notificação push, carteirinha PDF, cabeçalho de email) sem virar mancha ilegível. E dialoga com a serifa usada nos nomes de pets e na narração — o app inteiro fala num único idioma tipográfico.

---

## 9. O que fica fora deste documento

Este arquivo é **só cor**. Outros documentos a escrever quando a paleta for travada pra execução:

- `elite-typography.md` — famílias, pesos, tamanhos, casos de uso (Playfair, Inter/Sora, JetBrains Mono, regra de 400/500)
- `elite-spacing.md` — radii e spacing (provavelmente nada muda — Elite não é sobre geometria)
- `elite-components.md` — specs componente-por-componente (PetCard, TutorCard, Button, Chip, ActionRow) com medidas exatas
- `plano-elite.md` (já existe) — o plano de produto Elite como um todo, features, roadmap

---

## 10. Status

**Paleta escolhida:** Ametista & Jade.

**Este documento:** referência canônica. Nada foi tocado no código do app.

Quando a execução for aprovada:

1. Este documento vira a base de `constants/colors.ts`.
2. A reescrita é feita em um único commit, sob revisão.
3. Usos de tokens removidos (`petrol`, `gold`, `rose`, `sky`, `lime`) e de `purple` (que precisa de revisão manual) são migrados screen-by-screen.
4. O script `scripts/audit-elite-tokens.ts` é adicionado ao pre-commit.
5. O CLAUDE.md ganha um capítulo "Elite design tokens" apontando pra cá.
6. A paleta antiga vira história no git — não fica alias de compatibilidade, o corte é limpo.

Até isso, este documento existe apenas pra consulta e alinhamento.
