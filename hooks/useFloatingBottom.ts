/**
 * useFloatingBottom — fonte ÚNICA de verdade para o offset inferior de
 * elementos flutuantes ou ancorados ao rodapé.
 *
 * Por que existe:
 *   No Android com gesture navigation o sistema reserva ~28-48 px no fim
 *   da tela pra barra de gestos. Sem reservar esse espaço, FABs e botões
 *   "Salvar" fixos ficam embaixo da barra do sistema — invisíveis ou só
 *   parcialmente clicáveis. iOS tem o mesmo problema com o home indicator.
 *
 *   Hardcodar `bottom: rs(20)` ou similar é o anti-padrão que vinha sendo
 *   usado em várias telas. Funciona em alguns devices, quebra em outros.
 *
 * Uso:
 *   const bottom = useFloatingBottom();          // floating: bottom: insets + 16
 *   const padding = useFloatingBottom(0, true);  // padding: insets + 0 puro
 *
 * Convenções:
 *   • Sempre usar este hook ao posicionar QUALQUER elemento na borda inferior.
 *   • Para FABs use o componente <Fab/> pronto.
 *   • Para barras de ação no rodapé (Salvar, Confirmar) use <BottomActionBar/>.
 *
 * Esta regra é inviolável — está documentada em CLAUDE.md.
 */
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { rs } from './useResponsive';

/**
 * Fallback inferior em design units quando `useSafeAreaInsets()` retorna 0
 * dentro de um React Native Modal (que não herda SafeAreaProvider).
 *
 *  • Android: ~24 unidades — cobre gesture bar (max ~48px em devices recentes)
 *  • iOS:     ~16 unidades — cobre home indicator (~34px em iPhones modernos)
 */
const MODAL_FALLBACK = Platform.OS === 'android' ? 24 : 16;

/**
 * Retorna o offset em pixels que um elemento ancorado ao bottom deve usar.
 *
 * @param extraOffset distância visual extra acima da safe area, em "design units"
 *                    (passa por rs() — default 16). Use 0 quando o conteúdo já
 *                    tiver paddingBottom próprio.
 * @param raw quando true, retorna apenas insets.bottom + extraOffset SEM passar
 *            extraOffset por rs(). Útil em raros casos onde rs() não é desejado.
 *            Default: false.
 */
export function useFloatingBottom(extraOffset: number = 16, raw: boolean = false): number {
  const insets = useSafeAreaInsets();
  const extra = raw ? extraOffset : rs(extraOffset);

  // Defesa em profundidade: se não tem insets (provavelmente dentro de um
  // Modal que não envelopou SafeAreaProvider), usa fallback razoável da plataforma.
  // Isso garante que mesmo em telas mal-instrumentadas, o elemento nunca cole
  // na barra do sistema. A regra inviolável #12 ainda obriga uso de
  // BottomActionBar/Fab — esta defesa é só rede de segurança.
  const safeBottom = insets.bottom > 0 ? insets.bottom : rs(MODAL_FALLBACK);

  // Mínimo de 8px mesmo em devices sem inset (legado, web). Garante que o
  // elemento nunca fique colado na borda física da tela.
  return Math.max(safeBottom + extra, rs(8));
}
