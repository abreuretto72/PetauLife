import { Dimensions, PixelRatio } from 'react-native';

// ══════════════════════════════════════
// RESPONSIVIDADE — BASE DO DESIGN SYSTEM
// ══════════════════════════════════════
//
// Design base: iPhone 14 (390px largura)
// Tudo é calculado proporcionalmente a essa largura.
// Em telas menores (320px), tudo encolhe. Em maiores (428px+), tudo cresce.
//
// USO:
//   import { wp, hp, fs, rs } from '../hooks/useResponsive';
//   <View style={{ width: wp(90), padding: rs(16), borderRadius: rs(12) }}>
//     <Text style={{ fontSize: fs(16) }}>Texto responsivo</Text>
//   </View>

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base de design: iPhone 14 = 390 x 844
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Escala proporcional à largura
const widthScale = SCREEN_WIDTH / BASE_WIDTH;
// Escala proporcional à altura
const heightScale = SCREEN_HEIGHT / BASE_HEIGHT;

/**
 * wp — Width Percentage
 * Converte percentual da largura em pixels.
 * wp(50) = 50% da largura da tela
 */
export function wp(percentage: number): number {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * percentage) / 100);
}

/**
 * hp — Height Percentage
 * Converte percentual da altura em pixels.
 * hp(50) = 50% da altura da tela
 */
export function hp(percentage: number): number {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * percentage) / 100);
}

/**
 * rs — Responsive Size
 * Escala um valor de pixel proporcionalmente à largura da tela.
 * rs(16) em 390px = 16, em 320px = ~13, em 428px = ~17.5
 * Usar para: padding, margin, borderRadius, width, height de ícones, etc.
 */
export function rs(size: number): number {
  return PixelRatio.roundToNearestPixel(size * widthScale);
}

/**
 * fs — Font Size
 * Escala tamanho de fonte com limite de responsividade + multiplicador
 * de acessibilidade controlado pelo tutor (preferência no Settings).
 *
 * Pipeline:
 *   1. size x widthScale (responsividade do dispositivo)
 *   2. cap entre 80% e 120% do size original (evita extremos por tela)
 *   3. x fontScale do store (preferência de acessibilidade, 0.90 a 1.30)
 *
 * fs(16) em 390px com fontScale 1.0 = 16
 * fs(16) em 390px com fontScale 1.30 = ~21
 *
 * NOTA: fs() e chamado em StyleSheet.create() (uma vez no import do modulo).
 * Mudar fontScale NAO atualiza estilos dinamicamente — o app precisa re-montar.
 * O _layout.tsx aplica key=fontScale no Stack pra forcar re-mount quando
 * o tutor muda a preferencia.
 */
export function fs(size: number): number {
  const scaled = size * widthScale;
  const min = size * 0.8;
  const max = size * 1.2;
  const responsive = Math.max(min, Math.min(max, scaled));
  // Lazy-read do store pra evitar dependencia circular no import
  let fontScale = 1.0;
  try {
    const store = require('../stores/usePreferencesStore');
    fontScale = store.usePreferencesStore.getState().fontScale ?? 1.0;
  } catch {
    // Store ainda nao inicializado ou teste — usar 1.0
  }
  return PixelRatio.roundToNearestPixel(responsive * fontScale);
}

/**
 * fsWithScale — como fs(), mas aceita o fontScale como parametro explicito.
 * Util para previews reativos na UI (Settings de tamanho de fonte, por exemplo)
 * onde o valor precisa atualizar instantaneamente sem re-mount do StyleSheet.
 *
 * Regra: fs() le o fontScale do store em tempo de chamada (uma vez por
 * StyleSheet.create()). fsWithScale() recebe o scale de fora, permitindo
 * que um componente React re-renderize com um scale diferente do persistido.
 */
export function fsWithScale(size: number, scale: number): number {
  const scaled = size * widthScale;
  const min = size * 0.8;
  const max = size * 1.2;
  const responsive = Math.max(min, Math.min(max, scaled));
  return PixelRatio.roundToNearestPixel(responsive * scale);
}

/**
 * rh — Responsive Height (baseado na altura da tela)
 * Para elementos que dependem da altura (modais, headers).
 */
export function rh(size: number): number {
  return PixelRatio.roundToNearestPixel(size * heightScale);
}

/**
 * Constantes úteis exportadas
 */
export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  scale: widthScale,
  isSmall: SCREEN_WIDTH < 360,    // SE, iPod, Android compacto
  isMedium: SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 414,  // iPhone 14, maioria dos Androids
  isLarge: SCREEN_WIDTH >= 414,   // iPhone Pro Max, tablets
} as const;
