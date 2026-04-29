/**
 * components/AiWaitTipsCarousel.tsx
 *
 * Carrossel auto-rotativo de dicas curtas, exibido enquanto a IA processa
 * algo demorado (gerar cardapio, montar roteiro de viagem, etc).
 *
 * Comportamento:
 *  - FlatList horizontal com pagingEnabled (1 dica por pagina, swipe nativo).
 *  - Auto-rotaciona a cada 6s. Pausa quando o tutor faz swipe manual e
 *    retoma 10s depois (evita briga UX).
 *  - Indicadores de progresso (bolinhas) embaixo. A bolinha ativa cresce.
 *  - Reusavel: recebe tips, accentColor, icon, title via props.
 *
 * Tom (registro Elite): texto factual, 3a pessoa. Sem onomatopeia,
 * sem exclamacao performatica, sem assinatura "— seu pet".
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions,
  LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent,
} from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { rs, fs } from '../hooks/useResponsive';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  tips: string[];
  /** Cor de acento do card (icone + bolinha ativa). Default: colors.ai (jade). */
  accentColor?: string;
  /** Icone do header. Default: Sparkles. */
  Icon?: typeof Sparkles;
  /** Titulo do header. Ex: "Dicas para Mana enquanto a IA trabalha". */
  title?: string;
  /** Legenda subtitulo do header. */
  subtitle?: string;
  /** Largura forcada do card. Se omitido, mede o container via onLayout. */
  cardWidth?: number;
  /** Intervalo de auto-rotacao em ms. Default: 6000. */
  autoRotateMs?: number;
  /** Pausa apos swipe manual em ms. Default: 10000. */
  manualPauseMs?: number;
}

export default function AiWaitTipsCarousel({
  tips,
  accentColor = colors.ai,
  Icon = Sparkles,
  title,
  subtitle,
  cardWidth: cardWidthProp,
  autoRotateMs = 6000,
  manualPauseMs = 10000,
}: Props) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  // Largura medida do container — usa onLayout pra adaptar ao espaco disponivel.
  // Fallback enquanto nao mediu: SCREEN_WIDTH - 40 (cobre maioria dos layouts).
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const cardWidth = cardWidthProp ?? measuredWidth ?? (SCREEN_WIDTH - rs(40));

  const flatListRef = useRef<FlatList<string>>(null);
  const pauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rotateIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== measuredWidth) setMeasuredWidth(w);
  }, [measuredWidth]);

  // Limpa timers no unmount
  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
      if (rotateIntervalRef.current) clearInterval(rotateIntervalRef.current);
    };
  }, []);

  // Auto-rotacao
  useEffect(() => {
    if (paused || tips.length <= 1) return;
    rotateIntervalRef.current = setInterval(() => {
      setCurrent((prev) => {
        const next = (prev + 1) % tips.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, autoRotateMs);
    return () => {
      if (rotateIntervalRef.current) clearInterval(rotateIntervalRef.current);
    };
  }, [paused, tips.length, autoRotateMs]);

  // Tutor fez swipe manual: pausa, depois retoma
  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
      if (idx !== current) {
        setCurrent(idx);
        setPaused(true);
        if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
        pauseTimeoutRef.current = setTimeout(() => setPaused(false), manualPauseMs);
      }
    },
    [current, cardWidth, manualPauseMs],
  );

  // Fallback se scrollToIndex falhar (raro mas seguro)
  const onScrollToIndexFailed = useCallback(
    (info: { index: number; averageItemLength: number }) => {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: info.index * cardWidth,
          animated: true,
        });
      }, 50);
    },
    [cardWidth],
  );

  if (tips.length === 0) return null;

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {(title || subtitle) && (
        <View style={styles.header}>
          <Icon size={rs(14)} color={accentColor} strokeWidth={2} />
          <View style={styles.headerTextCol}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
      )}

      <FlatList
        // key forca re-render quando o container muda de largura (apos onLayout)
        // pra que pagingEnabled + snapToInterval recalibrem com o novo cardWidth.
        key={`carousel-w-${Math.round(cardWidth)}`}
        ref={flatListRef}
        data={tips}
        keyExtractor={(_item, i) => `tip-${i}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollToIndexFailed={onScrollToIndexFailed}
        snapToInterval={cardWidth}
        decelerationRate="fast"
        getItemLayout={(_data, index) => ({
          length: cardWidth,
          offset: cardWidth * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={[styles.cardWrapper, { width: cardWidth }]}>
            <View style={[styles.card, { borderLeftColor: accentColor }]}>
              <Text style={styles.tipText}>{item}</Text>
            </View>
          </View>
        )}
      />

      <View style={styles.dotsRow}>
        {tips.map((_t, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === current && [styles.dotActive, { backgroundColor: accentColor }],
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: rs(8),
    paddingHorizontal: rs(20),
    marginBottom: rs(10),
    width: '100%',
  },
  headerTextCol: { flex: 1 },
  title: {
    color: colors.text,
    fontSize: fs(13),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: colors.textDim,
    fontSize: fs(11),
    marginTop: rs(2),
    lineHeight: fs(15),
  },
  cardWrapper: {
    paddingHorizontal: rs(4),
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: rs(3),
    paddingVertical: rs(18),
    paddingHorizontal: rs(18),
    minHeight: rs(110),
    justifyContent: 'center',
  },
  tipText: {
    color: colors.text,
    fontSize: fs(13),
    lineHeight: fs(20),
    fontWeight: '400',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: rs(6),
    marginTop: rs(12),
    justifyContent: 'center',
  },
  dot: {
    width: rs(6),
    height: rs(6),
    borderRadius: rs(3),
    backgroundColor: colors.border,
  },
  dotActive: {
    width: rs(18),
  },
});
