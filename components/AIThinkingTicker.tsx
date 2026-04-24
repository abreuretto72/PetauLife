/**
 * AIThinkingTicker — painel de distração durante esperas de IA.
 *
 * Exibe frases rotativas do ai_tips_pool (via useAITips), com fade cross entre
 * tips. Visual jade (cor da IA), tipografia Inter, ícone Sparkles pulsando.
 * Fallback de 3 frases hardcoded quando pool vazio/erro de rede.
 *
 * Uso:
 *   <AIThinkingTicker species="dog" intervalMs={5000} />
 *
 * Props:
 *   - species: filtra tips por espécie do pet ('dog' | 'cat' | 'both')
 *   - intervalMs: milissegundos entre trocas de frase (default 5000)
 *   - compact: layout compacto (menos padding)
 */

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { rs, fs } from '../hooks/useResponsive';
import { useAITips, type AITip } from '../hooks/useAITips';
import i18n from '../i18n';

// Fallback quando pool vazio OU fetch falhou (rede, RLS, primeiro uso).
const FALLBACK_PT: AITip[] = [
  { id: 'fb-pt-1', text: 'Escore de Condição Corporal 5 em 9 é o ideal para cães e gatos adultos.', category: 'welfare', species: 'both' },
  { id: 'fb-pt-2', text: 'A troca gradual de alimentação ao longo de sete dias previne a maioria dos episódios de adaptação gastrointestinal.', category: 'nutrition', species: 'both' },
  { id: 'fb-pt-3', text: 'O microchip subcutâneo é indolor e duradouro. Reduz drasticamente o tempo de reencontro em caso de perda.', category: 'preventive_care', species: 'both' },
];
const FALLBACK_EN: AITip[] = [
  { id: 'fb-en-1', text: 'Body Condition Score 5 out of 9 is ideal for adult dogs and cats.', category: 'welfare', species: 'both' },
  { id: 'fb-en-2', text: 'Transitioning food gradually over seven days prevents most gastrointestinal adaptation episodes.', category: 'nutrition', species: 'both' },
  { id: 'fb-en-3', text: 'A subcutaneous microchip is painless and durable. It dramatically shortens reunion time when a pet goes missing.', category: 'preventive_care', species: 'both' },
];

function pickFallback(): AITip[] {
  const lang = (i18n.language || 'pt-BR').toLowerCase();
  return lang.startsWith('en') ? FALLBACK_EN : FALLBACK_PT;
}

interface AIThinkingTickerProps {
  species?: 'dog' | 'cat' | 'both';
  intervalMs?: number;
  compact?: boolean;
}

export function AIThinkingTicker({
  species = 'both',
  intervalMs = 12000,
  compact = false,
}: AIThinkingTickerProps) {
  const { tips } = useAITips(species);
  const basePool = tips.length > 0 ? tips : pickFallback();

  // Re-embaralha localmente a cada mount — o hook useAITips cacheia 30min
  // no React Query e traria sempre a mesma ordem. Aqui garantimos que cada
  // análise começa com uma sequência nova.
  const pool = React.useMemo(() => {
    const arr = basePool.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // Depender do comprimento + id primeiro evita re-shuffle em cada render,
    // mas garante que novo mount (novo loading de IA) re-embaralhe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePool.length, basePool[0]?.id]);

  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const sparklePulse = useRef(new Animated.Value(1)).current;

  // Carrossel de fade: out (300ms) → next index → in (500ms).
  useEffect(() => {
    if (pool.length <= 1) return;
    const tick = setInterval(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: 500,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        setIndex((i) => (i + 1) % pool.length);
        Animated.timing(fade, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      });
    }, intervalMs);
    return () => clearInterval(tick);
  }, [pool.length, intervalMs, fade]);

  // Sparkles pulse — leve, contínuo.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sparklePulse, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(sparklePulse, { toValue: 1.0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [sparklePulse]);

  const current = pool[index];
  if (!current) return null;

  return (
    <View style={[s.container, compact && s.containerCompact]}>
      <View style={s.header}>
        <Animated.View style={{ transform: [{ scale: sparklePulse }] }}>
          <Sparkles size={rs(14)} color={colors.ai} strokeWidth={2} />
        </Animated.View>
        <Text style={s.headerLabel}>{i18n.t('aiTicker.title', { defaultValue: 'SABIA QUE' })}</Text>
      </View>
      <Animated.Text style={[s.text, { opacity: fade }]}>
        {current.text}
      </Animated.Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginTop: rs(12),
    marginHorizontal: rs(4),
    paddingVertical: rs(16),
    paddingHorizontal: rs(18),
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: colors.ai + '30',
    backgroundColor: colors.ai + '0D',
    minHeight: rs(90),
  },
  containerCompact: {
    paddingVertical: rs(10),
    paddingHorizontal: rs(12),
    minHeight: rs(70),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    marginBottom: rs(8),
  },
  headerLabel: {
    fontFamily: 'Sora_700Bold',
    fontSize: fs(10),
    color: colors.ai,
    letterSpacing: 1.2,
  },
  text: {
    fontFamily: 'Sora_400Regular',
    fontSize: fs(14),
    color: colors.text,
    lineHeight: fs(21),
  },
});
