/**
 * RacaoNaturalScreen.jsx — Tela 9
 * Ração + complementos naturais com proporções
 * Rota: app/(app)/pet/[id]/nutrition/racao-natural.tsx
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '../../../../../constants/colors';
import { rs, fs } from '../../../../../hooks/useResponsive';
import { useNutricao } from '../../../../../hooks/useNutricao';
import { usePet } from '../../../../../hooks/usePets';

const COMPLEMENTOS = [
  { name: 'Frango cozido sem osso', category: 'proteína', safe: true },
  { name: 'Batata doce cozida', category: 'energia', safe: true },
  { name: 'Cenoura cozida', category: 'vitaminas', safe: true },
  { name: 'Ovo cozido', category: 'proteína', safe: true },
  { name: 'Abobrinha cozida', category: 'fibras', safe: true },
  { name: 'Espinafre cozido', category: 'ferro', safe: true },
  { name: 'Queijo', category: 'laticínio', safe: false, reason: 'alergia · Mana' },
];

const CATEGORY_COLORS = {
  proteína: colors.sky, energia: colors.accent, vitaminas: colors.lime,
  fibras: colors.teal ?? colors.success, ferro: colors.purple, laticínio: colors.danger,
};

export default function RacaoNaturalScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: pet } = usePet(id);
  const { nutricao, cardapio } = useNutricao(id);
  const [ratio, setRatio] = useState(70); // % ração

  const totalG = Math.round((nutricao?.weight_kg ?? 2.5) * 22);
  const racaoG = Math.round(totalG * ratio / 100);
  const naturalG = totalG - racaoG;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Proporção ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Proporção diária · {nutricao?.weight_kg}kg</Text>
        <View style={s.bar}>
          <View style={[s.barFill, { width: `${ratio}%` as any, backgroundColor: colors.accent }]} />
          <View style={[s.barFill, { width: `${100 - ratio}%` as any, backgroundColor: colors.lime }]} />
        </View>
        <View style={s.barLabels}>
          <View style={s.barLabelItem}>
            <View style={[s.barDot, { backgroundColor: colors.accent }]} />
            <Text style={[s.barLabelText, { color: colors.accent }]}>{ratio}% ração · ~{racaoG}g</Text>
          </View>
          <View style={s.barLabelItem}>
            <View style={[s.barDot, { backgroundColor: colors.lime }]} />
            <Text style={[s.barLabelText, { color: colors.lime }]}>{100 - ratio}% natural · ~{naturalG}g</Text>
          </View>
        </View>
        {/* Ajuste rápido */}
        <View style={s.ratioButtons}>
          {[60, 70, 80].map((r) => (
            <TouchableOpacity
              key={r}
              style={[s.ratioBtn, ratio === r && s.ratioBtnActive]}
              onPress={() => setRatio(r)}
              activeOpacity={0.8}
            >
              <Text style={[s.ratioBtnText, ratio === r && s.ratioBtnTextActive]}>{r}/{100-r}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── Complementos ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Complementos naturais permitidos</Text>
        {COMPLEMENTOS.map((item, i) => (
          <View key={i} style={[s.itemRow, i < COMPLEMENTOS.length - 1 && s.borderBottom]}>
            <Text style={[s.itemName, !item.safe && { color: colors.danger }]}>{item.name}</Text>
            <View style={[s.tag, { backgroundColor: (CATEGORY_COLORS[item.category] ?? colors.accent) + '15' }]}>
              <Text style={[s.tagText, { color: CATEGORY_COLORS[item.category] ?? colors.accent }]}>
                {item.safe ? item.category : item.reason}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* ── Sugestão do dia ── */}
      {cardapio?.days?.[new Date().getDay()] && (
        <View style={s.suggCard}>
          <Text style={s.suggLabel}>Sugestão de hoje</Text>
          <Text style={s.suggText}>{cardapio.days[new Date().getDay()].description}</Text>
        </View>
      )}

      <TouchableOpacity style={s.btnPrimary} onPress={() => router.push(`/pet/${id}/nutrition/cardapio`)} activeOpacity={0.8}>
        <ChevronRight size={rs(15)} color="#fff" strokeWidth={2} />
        <Text style={s.btnPrimaryText}>Ver cardápio semanal completo</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: rs(16), gap: rs(12), paddingBottom: rs(40) },

  card: { backgroundColor: colors.bgCard, borderRadius: rs(14), borderWidth: 0.5, borderColor: colors.border, padding: rs(12), gap: rs(10) },
  cardTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.text },

  bar: { flexDirection: 'row', height: rs(10), borderRadius: rs(6), overflow: 'hidden' },
  barFill: { height: '100%' },
  barLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabelItem: { flexDirection: 'row', alignItems: 'center', gap: rs(5) },
  barDot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  barLabelText: { fontFamily: 'Sora_500Medium', fontSize: fs(10) },

  ratioButtons: { flexDirection: 'row', gap: rs(8) },
  ratioBtn: { flex: 1, backgroundColor: colors.card, borderRadius: rs(10), paddingVertical: rs(8), alignItems: 'center', borderWidth: 0.5, borderColor: colors.border },
  ratioBtnActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  ratioBtnText: { fontFamily: 'Sora_500Medium', fontSize: fs(11), color: colors.textSec },
  ratioBtnTextActive: { color: colors.accent, fontFamily: 'Sora_700Bold' },

  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: rs(6) },
  borderBottom: { borderBottomWidth: 0.5, borderBottomColor: colors.border },
  itemName: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.text, flex: 1 },
  tag: { paddingHorizontal: rs(7), paddingVertical: rs(2), borderRadius: rs(6) },
  tagText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(9) },

  suggCard: { backgroundColor: colors.limeSoft ?? colors.successSoft, borderRadius: rs(12), borderWidth: 0.5, borderColor: colors.lime + '30', padding: rs(12), gap: rs(4) },
  suggLabel: { fontFamily: 'Sora_600SemiBold', fontSize: fs(10), color: colors.lime },
  suggText: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.text },

  btnPrimary: { backgroundColor: colors.lime, borderRadius: rs(14), paddingVertical: rs(14), alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: rs(8) },
  btnPrimaryText: { fontFamily: 'Sora_700Bold', fontSize: fs(14), color: '#fff' },
});
