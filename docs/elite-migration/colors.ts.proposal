/**
 * PROPOSTA — Elite Design Tokens (Ametista & Jade)
 *
 * Este arquivo é uma PROPOSTA de substituição para `constants/colors.ts`.
 * Não é executado pelo app — é só leitura pra revisão.
 *
 * Quando aprovado, copiar este conteúdo sobre `constants/colors.ts` (mantendo
 * o nome do arquivo, apagando o `.proposal`).
 *
 * Estratégia: tokens novos (`click`, `ai`, etc) como canônicos + aliases
 * deprecados apontando pros mesmos valores Elite. Isso deixa as 1.735 call
 * sites funcionarem sem mudança até a gente renomear cada uma pelo
 * `migrate.sh`. Migração visual é imediata; migração da API é gradual.
 *
 * Ver tokens-doc canônico: `docs/elite-tokens.md`.
 */

export const colors = {
  // ══════════════════════════════════════════════════════════════
  // BACKGROUNDS E SUPERFÍCIES
  // ══════════════════════════════════════════════════════════════
  bg:          '#0D0E16',   // Tinta violeta — fundo base
  bgCard:      '#161826',   // Cards elevados
  bgDeep:      '#08090F',   // Recessos, modais backdrop
  card:        '#1A1D2E',   // Cards interativos, inputs
  cardHover:   '#1E2336',   // Hover/pressed em superfícies clicáveis
  cardGlow:    '#1F2438',   // (compat legacy) — usar bgCard
  glow:        '#2A2D42',   // (compat legacy) — uso reduzido

  // ══════════════════════════════════════════════════════════════
  // CLIQUE — Ametista (cor EXCLUSIVA de elementos clicáveis)
  // ══════════════════════════════════════════════════════════════
  click:       '#8F7FA8',   // Ametista — ícones de ação, chevrons, CTAs
  clickLight:  '#A89BC0',   // Hover
  clickDark:   '#6F6088',   // Pressed
  clickSoft:   '#8F7FA810', // Fundo sutil atrás de ícones clicáveis
  clickRing:   '#8F7FA830', // Focus ring em inputs

  // ALIASES LEGACY — apontam pros tokens click. Remover após `migrate.sh`.
  accent:      '#8F7FA8',   // @deprecated use `click`
  accentLight: '#A89BC0',   // @deprecated use `clickLight`
  accentDark:  '#6F6088',   // @deprecated use `clickDark`
  accentGlow:  '#8F7FA815', // @deprecated use `clickSoft`
  accentSoft:  '#8F7FA808', // @deprecated use `clickSoft`
  accentMed:   '#8F7FA825', // @deprecated use `clickRing`

  // ══════════════════════════════════════════════════════════════
  // IA — Jade (cor EXCLUSIVA de saídas da IA — observações, análises)
  // ══════════════════════════════════════════════════════════════
  ai:          '#4FA89E',   // Jade — labels IA, confidence scores, sparkle, stripe
  aiLight:     '#6FBFB3',   // (raro) hover de elementos IA clicáveis (caso raro, só se a IA tbm é gatilho)
  aiSoft:      '#4FA89E10', // Fundo sutil de cards de observação IA
  aiBorder:    '#4FA89E4A', // Borda de container de narração IA (alpha ~0.29)
  aiText:      '#7CC5BA',   // Texto sobre fundo `aiSoft` (contraste 5:1)

  // ALIAS LEGACY — `purple` cobria biometria facial + gatos + IA.
  // Aliasado PARA OUTRA COR (ubá virou toque, não IA). O valor aqui é ametista.
  // IMPORTANTE: todo uso de `colors.purple` precisa ser revisado caso a caso
  // antes do corte. Ver migration-audit.md §"Purple — revisão manual".
  purple:      '#8F7FA8',   // @deprecated — REVISAR CASO A CASO. Se era IA → ai. Se era toque → click. Se era gato → neutro.
  purpleSoft:  '#8F7FA810', // @deprecated — idem

  // ══════════════════════════════════════════════════════════════
  // SEMÂNTICAS DE STATUS
  // ══════════════════════════════════════════════════════════════
  success:     '#7FA886',   // Sálvia — saúde OK, vacinas em dia, XP, progresso
  successSoft: '#7FA88612', // Fundo sutil de chips/banners de sucesso
  successBorder: '#7FA8864A', // Borda de chip sucesso
  successText: '#9DC2A3',   // Texto sobre `successSoft`

  warning:     '#D4A574',   // Âmbar — atenção moderada, lembretes futuros
  warningSoft: '#D4A57412',
  warningBorder: '#D4A5744A',
  warningText: '#E4C08F',

  danger:      '#C2645E',   // Tijolo arrosado — perigo, urgência, lixeira
  dangerSoft:  '#C2645E12',
  dangerBorder: '#C2645E4A',
  dangerText:  '#D48680',

  // ══════════════════════════════════════════════════════════════
  // REMOVIDOS (com aliases temporários pra não quebrar build)
  // ══════════════════════════════════════════════════════════════
  // petrol: era azul decorativo de info. Mapeia pra textSec (decoração) em
  // quase todo uso; se era ícone CLICÁVEL tinha que virar click. Ver audit.
  petrol:      '#A89FB5',   // @deprecated — mapear: decorativo → textSec, clicável → click
  petrolLight: '#BDB4C8',   // @deprecated
  petrolDark:  '#847C94',   // @deprecated
  petrolGlow:  '#A89FB510', // @deprecated
  petrolSoft:  '#A89FB508', // @deprecated

  // gold: XP/conquistas/estrelas decorativas. Mapeia pra warning (âmbar).
  gold:        '#D4A574',   // @deprecated use `warning`
  goldSoft:    '#D4A57412', // @deprecated use `warningSoft`

  // rose: legado/memorial/emoção. Mapeia pra danger (tijolo) em quase todos
  // os casos (memorial = perda), ou pra textSec (decorativo romântico).
  rose:        '#C2645E',   // @deprecated — REVISAR. Memorial → danger. Decoração → textSec.
  roseSoft:    '#C2645E12', // @deprecated

  // sky: viagens / info decorativa. Mapeia pra textSec (neutro) ou ai (se era
  // observação inteligente).
  sky:         '#A89FB5',   // @deprecated — REVISAR. Info → textSec. Observação → ai.
  skySoft:     '#A89FB508', // @deprecated

  // lime: nutrição. Mapeia pra success (sálvia).
  lime:        '#7FA886',   // @deprecated use `success`
  limeSoft:    '#7FA88612', // @deprecated use `successSoft`

  // ══════════════════════════════════════════════════════════════
  // TEXTO
  // ══════════════════════════════════════════════════════════════
  text:        '#F0EDF5',   // Luar lilás — títulos, texto principal
  textSec:     '#A89FB5',   // Secundário, descrições
  textDim:     '#6B6478',   // Labels, captions
  textGhost:   '#3A3542',   // Desabilitado, dividers
  placeholder: '#6B6478',   // Placeholder de inputs (= textDim)

  // ══════════════════════════════════════════════════════════════
  // ESTRUTURA
  // ══════════════════════════════════════════════════════════════
  border:      '#232538',
  borderLight: '#2E314A',

  // ══════════════════════════════════════════════════════════════
  // UNIVERSAL
  // ══════════════════════════════════════════════════════════════
  white:       '#FFFFFF',   // APENAS em texto de CTA primário (fundo `click`)
} as const;
