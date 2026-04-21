/**
 * ModalidadeScreen.jsx — Tela 7
 * Escolher modalidade de alimentação
 * Rota: app/(app)/pet/[id]/nutrition/modalidade.tsx
 */

import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Package, Leaf, Sprout, Sparkles } from 'lucide-react-native';
import { colors } from '../../../../../constants/colors';
import { rs, fs } from '../../../../../hooks/useResponsive';
import { useNutricao } from '../../../../../hooks/useNutricao';
import { usePet } from '../../../../../hooks/usePets';

export default function ModalidadeScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: pet } = usePet(id);
  const { nutricao, setModalidade } = useNutricao(id);

  const handleSelect = useCallback(async (modalidade) => {
    await setModalidade(modalidade);
    router.push(`/pet/${id}/nutrition/${modalidade}`);
  }, [id, router, setModalidade]);

  const modalidades = [
    {
      key: 'so-racao',
      icon: Package,
      color: colors.accent,
      title: 'Só ração',
      sub: '100% industrializada',
      badge: 'mais prático',
      badgeColor: colors.accent,
      desc: 'Ração seca ou úmida como única fonte de alimentação. Mais fácil de controlar a porção e os nutrientes.',
    },
    {
      key: 'racao-natural',
      icon: Leaf,
      color: colors.lime,
      title: 'Ração + natural',
      sub: 'equilíbrio',
      badge: 'recomendado',
      badgeColor: colors.lime,
      desc: 'Ração como base + complementos naturais frescos. Melhor de dois mundos com praticidade e variedade.',
    },
    {
      key: 'so-natural',
      icon: Sprout,
      color: colors.sky,
      title: 'Só natural',
      sub: 'BARF ou cozido',
      badge: 'avançado',
      badgeColor: colors.sky,
      desc: 'Alimentação 100% natural. Requer acompanhamento veterinário para balancear os nutrientes corretamente.',
    },
  ];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Dica IA ── */}
      <View style={s.aiBox}>
        <View style={s.aiRow}>
          <Sparkles size={rs(13)} color={colors.purple} strokeWidth={1.8} />
          <Text style={s.aiTitle}>Dica IA para {nutricao?.life_stage ?? 'filhote'}</Text>
        </View>
        <Text style={s.aiText}>
          {nutricao?.life_stage === 'filhote'
            ? 'Para filhotes de 2 meses, a ração específica para filhotes é o mais seguro. Alimentos naturais podem ser introduzidos gradualmente a partir dos 3-4 meses.'
            : 'A combinação de ração com complementos naturais oferece variedade nutricional e é bem tolerada pela maioria dos cães adultos.'}
        </Text>
      </View>

      {/* ── Modalidades ── */}
      {modalidades.map((m) => {
        const Icon = m.icon;
        const isActive = nutricao?.modalidade === m.key;
        return (
          <View key={m.key} style={[s.card, isActive && { borderColor: m.color }]}>
            <View style={s.cardHeader}>
              <View style={[s.iconWrap, { backgroundColor: m.color + '15' }]}>
                <Icon size={rs(18)} color={m.color} strokeWidth={1.8} />
              </View>
              <View style={s.cardTitles}>
                <Text style={s.cardTitle}>{m.title}</Text>
                <Text style={s.cardSub}>{m.sub}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: m.badgeColor + '15', borderColor: m.badgeColor + '30' }]}>
                <Text style={[s.badgeText, { color: m.badgeColor }]}>{m.badge}</Text>
              </View>
            </View>
            <Text style={s.cardDesc}>{m.desc}</Text>
            <TouchableOpacity
              style={[s.btn, { backgroundColor: isActive ? m.color : m.color + '15', borderColor: m.color + '30' }]}
              onPress={() => handleSelect(m.key)}
              activeOpacity={0.8}
            >
              <Text style={[s.btnText, { color: isActive ? '#fff' : m.color }]}>
                {isActive ? 'Modalidade ativa' : 'Selecionar'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: rs(16), gap: rs(12), paddingBottom: rs(40) },

  aiBox: { backgroundColor: colors.purpleSoft, borderRadius: rs(12), borderWidth: 0.5, borderColor: colors.border, padding: rs(12) },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(6) },
  aiTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(10), color: colors.purple },
  aiText: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.textSec, lineHeight: fs(17) },

  card: { backgroundColor: colors.bgCard, borderRadius: rs(14), borderWidth: 1, borderColor: colors.border, padding: rs(14), gap: rs(10) },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  iconWrap: { width: rs(38), height: rs(38), borderRadius: rs(12), alignItems: 'center', justifyContent: 'center' },
  cardTitles: { flex: 1 },
  cardTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(13), color: colors.text },
  cardSub: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textSec },
  badge: { paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(20), borderWidth: 0.5 },
  badgeText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(9) },
  cardDesc: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.textSec, lineHeight: fs(17) },
  btn: { borderRadius: rs(10), paddingVertical: rs(10), alignItems: 'center', borderWidth: 1 },
  btnText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12) },
});
