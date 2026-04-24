/**
 * Elite Typography — single-name values (React Native compatible)
 *
 * IMPORTANTE: React Native NÃO aceita font stacks CSS (ex: "'Inter', sans-serif").
 * Cada constante abaixo tem UM único nome de fonte — o mesmo nome que foi
 * registrado em `app/_layout.tsx` via `useFonts({...})` do @expo-google-fonts/*.
 *
 * Se a fonte não carregar (rede, bundle), RN cai silenciosamente no default
 * do sistema — o que não é ideal mas é o comportamento correto do RN.
 */

export const fonts = {
  // DISPLAY — Playfair Display. Apenas logo + títulos literários curtos.
  // Nunca corpo de texto, nunca narração. Único lugar permitido de itálico
  // é o `au` do logo.
  display:        'PlayfairDisplay_500Medium',
  displayItalic:  'PlayfairDisplay_500Medium_Italic', // APENAS logo

  // BODY — Inter. UI, labels, botões, quotes do tutor, narração da IA,
  // qualquer texto verbal.
  body:           'Inter_400Regular',
  bodyMed:        'Inter_500Medium',
  bodyLight:      'Inter_300Light',

  // MONO — JetBrains Mono. Scores numéricos, timestamps, níveis, confidence.
  mono:           'JetBrainsMono_400Regular',
  monoMed:        'JetBrainsMono_500Medium',

  // LEGACY ALIAS — backward compat pra não quebrar imports antigos.
  // handwriting era Caveat (cursive). Apontado pra Inter regular — a voz
  // Clarice NÃO usa mais italic/cursive, agora mora em Inter dentro do
  // container jade. Eventualmente remover.
  handwriting:    'Inter_400Regular', // @deprecated
} as const;
