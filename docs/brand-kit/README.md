# auExpert — Brand Kit

Pacote completo com logotipos, paleta e tipografia do auExpert (identidade Elite).
Uso: enviar pra designer/agência/parceiro externo que vai produzir material do app.

---

## Conteúdo

| Arquivo | Propósito |
|---------|-----------|
| `auexpert-wordmark.svg` | Logotipo principal — `au` ametista + `Expert` cinza médio. Pra fundo escuro (dark theme do app) ou transparente |
| `auexpert-wordmark-light.svg` | Variação pra fundo claro — ametista escuro + cinza |
| `auexpert-wordmark-mono-white.svg` | Monocromático branco — fundos coloridos, silkscreen, impressão 1 cor |
| `auexpert-wordmark-mono-black.svg` | Monocromático preto — documentos oficiais, papel timbrado |
| `tokens.json` | Design tokens em formato W3C DTCG (importável em Figma via Tokens Studio, Style Dictionary, etc) |
| `tokens.css` | Mesmos tokens como CSS custom properties (`:root { --color-click: #8F7FA8; ... }`) — pra uso direto em sites |
| `palette-preview.html` | Visualização HTML da paleta + tipografia (abre no navegador pra ver tudo renderizado) |
| `README.md` | Este arquivo |

---

## Identidade

**Nome:** auExpert (grafia exata, sempre — "au" minúsculo, "Expert" com E maiúsculo, sem espaço).
Nome anterior: PetauLife+ (descontinuado, não usar em nenhum material novo).

**Tagline:**
- PT-BR: "Uma inteligência única para o seu pet"
- EN: "A unique intelligence for your pet"

**Positioning (Elite):** dark premium tech. Sofisticado, tecnológico e acolhedor. A escuridão transmite profundidade e confiança; a ametista traz calor e cuidado; a jade traz inteligência.

---

## Logotipo — regras

1. **Não é um ícone + texto** — é wordmark tipográfico puro. O app tem um ícone separado (mascote cartoon com balão "au") usado **apenas** em lojas/homescreen, nunca como logo.
2. **Fonte obrigatória:** Playfair Display weight 500. O `au` em itálico, `Expert` em romano.
3. **Cores fixas:** usar APENAS as combinações dos 4 SVGs fornecidos. Não inventar outras variações.
4. **Área mínima de respiro:** pelo menos a altura de um caractere ao redor do wordmark (ex: se fonte 40px, margem 40px em todos os lados).
5. **Tamanho mínimo recomendado:** 120px de largura (abaixo disso a italic fica ilegível).
6. **NÃO fazer:**
   - Esticar ou comprimir proporções
   - Trocar `Playfair Display` por outra serif
   - Adicionar sombras, gradientes, outlines ou efeitos
   - Colocar o wordmark dentro de uma forma geométrica (círculo, retângulo)
   - Separar `au` de `Expert` com espaço, ponto ou barra

---

## Paleta

Visualização rápida: abrir `palette-preview.html` no navegador.

### Brand
- **Ametista** `#8F7FA8` — AÇÃO. Botões, links, ícones clicáveis, CTAs. Se exagerar, perde impacto.
- **Jade** `#4FA89E` — IA. Análises, insights, recursos inteligentes. Usada com moderação.

### Dark theme (padrão)
- `bg` `#0D0E16` — fundo da tela
- `bgCard` `#161826` — cards, drawers
- `bgDeep` `#08090F` — modal backdrop

### Texto
- `text` `#F0EDF5` — títulos, máximo contraste
- `textSec` `#A89FB5` — corpo, descrições
- `textDim` `#6B6478` — labels, hints, placeholders

### Semânticas
- **success** `#7FA886` — saúde OK, vacinas em dia
- **warning** `#D4A574` — avisos, conquistas, gamificação
- **danger** `#C2645E` — erros, lixeira, vacinas vencidas

### Regra de equilíbrio (IMPORTANTE)

Cada cor tem seu papel. Se todas aparecem em tudo, nenhuma comunica nada.
- Ametista = AÇÃO (não decoração)
- Jade = IA (não decoração)
- Verde = SUCESSO apenas (nunca brand)
- Vermelho = PERIGO apenas (nunca decorativo)

---

## Tipografia

Todas do Google Fonts, licença SIL Open Font — uso livre comercial.

### Playfair Display
- https://fonts.google.com/specimen/Playfair+Display
- Uso: logotipo + títulos literários curtos (ex: "Quase lá!", "Meus Pets")
- Weight: 500 (medium)
- **Itálico é PERMITIDO APENAS no `au` do logo.** Em qualquer outro lugar, usar romano.

### Inter
- https://fonts.google.com/specimen/Inter
- Uso: TUDO que é UI — labels, botões, body, narração da IA, quotes do tutor
- Weights: 300 (light), 400 (regular), 500 (medium)

### JetBrains Mono
- https://fonts.google.com/specimen/JetBrains+Mono
- Uso: números, scores, timestamps, confidence %, IDs
- Weights: 400, 500

### Hierarquia sugerida (tamanhos aproximados)

| Elemento | Fonte | Tamanho | Peso |
|----------|-------|---------|------|
| Logo (grande) | Playfair Display | 36-44px | 500 |
| Título de tela | Playfair Display | 22-28px | 500 |
| Subtítulo | Inter | 16-18px | 500 |
| Corpo | Inter | 14-16px | 400 |
| Labels / Captions | Inter | 11-12px | 500 |
| Scores numéricos | JetBrains Mono | 16-22px | 500 |
| Timestamps | JetBrains Mono | 11-12px | 400 |

---

## Como usar os tokens

### Em um site (CSS vanilla)
```html
<link rel="stylesheet" href="tokens.css">
<style>
  .btn-primary {
    background: var(--color-click);
    color: white;
    border-radius: var(--radius-xl);
    padding: var(--spacing-md) var(--spacing-lg);
    font-family: var(--font-body);
    font-weight: var(--weight-bold);
  }
</style>
```

### Em Figma (Tokens Studio plugin)
1. Instalar o plugin "Tokens Studio for Figma"
2. Menu Tokens Studio → Settings → Import JSON
3. Selecionar `tokens.json`
4. Aplicar o set no arquivo

### Em Style Dictionary (qualquer pipeline)
```json
// style-dictionary config
{
  "source": ["docs/brand-kit/tokens.json"],
  "platforms": {
    "ios":     { "transformGroup": "ios", "files": [...] },
    "android": { "transformGroup": "android", "files": [...] }
  }
}
```

---

## Contato técnico

Mudanças nesta identidade passam por revisão — a paleta Ametista & Jade foi escolhida em 2026-04-23 após avaliação de 10 variações. Antes de propor uma nova cor ou fonte, ler `docs/elite-tokens.md` no repositório pra entender o raciocínio completo.

Qualquer material que vá virar oficial (landing page, deck, post de rede social, anúncio pago, papelaria impressa) precisa do OK final do dono do produto antes de ir ao ar.
