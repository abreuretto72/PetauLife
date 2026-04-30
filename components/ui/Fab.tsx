/**
 * Fab — Floating Action Button padronizado do auExpert.
 *
 * Substitui TODO botão flutuante manual no app. Usa useFloatingBottom() —
 * nunca invade a barra do sistema (Android gesture / iOS home indicator).
 *
 * Design tokens:
 *   • 56x56 (Material Design FAB padrão)
 *   • borderRadius 20 (canto suave)
 *   • backgroundColor: cor passada (default colors.click — ametista sólido,
 *     padrão de CTA primário do auExpert, conforme regra inviolável #11)
 *   • Sombra com glow na própria cor
 *   • Ícone branco em strokeWidth 2 (foco visual no símbolo)
 *
 * Uso:
 *   import { Fab } from '@/components/ui/Fab';
 *   import { Plus } from 'lucide-react-native';
 *
 *   <Fab icon={Plus} onPress={handleAdd} accessibilityLabel="Adicionar pet" />
 *
 * Para variantes destrutivas (raro):
 *   <Fab icon={Trash2} color={colors.danger} onPress={...} />
 *
 * NÃO use mais position:absolute + bottom:rs(N) manual — esse padrão antigo
 * é o que causava botões invadindo o rodapé. Esta regra é inviolável.
 */
import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { rs } from '../../hooks/useResponsive';
import { useFloatingBottom } from '../../hooks/useFloatingBottom';

interface FabProps {
  /** Ícone Lucide a ser renderizado dentro do FAB. */
  icon: LucideIcon;
  /** Handler do toque. */
  onPress: () => void;
  /** Cor de fundo. Default: colors.click (ametista sólido). */
  color?: string;
  /** Lado horizontal de ancoragem. Default: 'right'. */
  side?: 'left' | 'right';
  /** Distância da borda lateral, em design units (rs). Default: 16. */
  sideOffset?: number;
  /** Distância visual extra acima da safe area inferior. Default: 24
   *  (bumped de 16 → 24 em 2026-04-30 após reports de FAB próximo demais
   *  da barra de gestos do Android em devices com gesture nav alta). */
  bottomOffset?: number;
  /** Tamanho do botão. Default: 56. */
  size?: number;
  /** Tamanho do ícone. Default: 24. */
  iconSize?: number;
  /** Label de acessibilidade — OBRIGATÓRIO pra leitores de tela. */
  accessibilityLabel: string;
  /** Quando true, desabilita o toque e reduz opacidade. */
  disabled?: boolean;
  /** Override de zIndex pra casos onde precisa ficar sobre overlays específicos. */
  zIndex?: number;
}

export function Fab({
  icon: Icon,
  onPress,
  color = colors.click,
  side = 'right',
  sideOffset = 16,
  bottomOffset = 24,
  size = 56,
  iconSize = 24,
  accessibilityLabel,
  disabled = false,
  zIndex = 50,
}: FabProps) {
  const bottom = useFloatingBottom(bottomOffset);
  const sidePx = rs(sideOffset);
  const sizePx = rs(size);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          [side]: sidePx,
          bottom,
          zIndex,
        },
      ]}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        activeOpacity={0.85}
        style={[
          styles.fab,
          {
            width: sizePx,
            height: sizePx,
            borderRadius: rs(20),
            backgroundColor: color,
            shadowColor: color,
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Icon size={rs(iconSize)} color="#FFFFFF" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  fab: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
});
