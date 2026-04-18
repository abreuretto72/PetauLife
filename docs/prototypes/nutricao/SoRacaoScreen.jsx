/**
 * SoRacaoScreen.jsx — Tela 8
 * Rotina completa de alimentação só com ração
 * Rota: app/(app)/pet/[id]/nutrition/so-racao.tsx
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle, Plus } from 'lucide-react-native';
import { colors } from '../../../../../constants/colors';
import { rs, fs } from '../../../../../hooks/useResponsive';
import { useNutricao } from '../../../../../hooks/useNutricao';
import { usePet } from '../../../../../hooks/usePets';

export default function SoRacaoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: pet } = usePet(id);
  const { nutricao } = useNutricao(id);

  const refeicoes = [
    { period: 'AM', label: 'Café da manhã', time: '07:00', portion: nutricao?.current_food?.daily_portion_half ?? '~27g' },
    { period: 'PM', label: 'Jantar', time: '18:00', portion: nutricao?.current_food?.daily_portion_half ?? '~27g' },
  ];

  // Petiscos: filtrar os seguros (sem restrições do pet)
  const petiscosSeguro = ['Biscoito de frango', 'Palito dental', 'Cenoura baby crua'];
  const petiscosEvitar = nutricao?.restrictions?.map((r) => r.allergen) ?? [];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Rotina diária ── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Rotina de alimentação</Text>
          <Text style={s.cardTotal}>Total: {nutricao?.current_food?.daily_portion ?? '—'}</Text>
        </View>
        {refeicoes.map((r, i) => (
          <View key={i} style={s.mealRow}>
            <View style={s.mealBadge}>
              <Text style={s.mealBadgeText}>{r.period}</Text>
            </View>
            <View style={s.col}>
              <Text style={s.mealLabel}>{r.label}</Text>
              <Text style={s.mealTime}>{r.time} · {r.portion}</Text>
            </View>
            <View style={s.dotGreen} />
          </View>
        ))}
      </View>

      {/* ── Petiscos ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Petiscos permitidos</Text>
        {petiscosSeguro.map((item, i) => (
          <View key={i} style={[s.petiscoRow, i < petiscosSeguro.length - 1 && s.borderBottom]}>
            <Text style={s.petiscoName}>{item}</Text>
            <View style={s.tagOk}><Text style={s.tagOkText}>seguro</Text></View>
          </View>
        ))}
        {petiscosEvitar.map((item, i) => (
          <View key={i} style={[s.petiscoRow, s.borderBottom]}>
            <Text style={s.petiscoName}>{item}</Text>
            <View style={s.tagDanger}><Text style={s.tagDangerText}>evitar · alergia</Text></View>
          </View>
        ))}
      </View>

      {/* ── Água ── */}
      <View style={s.okBox}>
        <CheckCircle size={rs(12)} color={colors.success} strokeWidth={1.8} />
        <Text style={s.okText}>Água fresca sempre disponível</Text>
      </View>

      <TouchableOpacity style={s.btnSecondary} onPress={() => router.push(`/pet/${id}/nutrition/cardapio`)} activeOpacity={0.8}>
        <Text style={s.btnSecondaryText}>Ver cardápio de petiscos</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: rs(16), gap: rs(12), paddingBottom: rs(40) },
  col: { flex: 1 },

  card: { backgroundColor: colors.bgCard, borderRadius: rs(14), borderWidth: 0.5, borderColor: colors.border, padding: rs(12), gap: rs(8) },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.text },
  cardTotal: { fontFamily: 'Sora_600SemiBold', fontSize: fs(11), color: colors.accent },

  mealRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10), backgroundColor: colors.card, borderRadius: rs(10), padding: rs(10) },
  mealBadge: { width: rs(28), height: rs(28), backgroundColor: colors.accentSoft, borderRadius: rs(8), alignItems: 'center', justifyContent: 'center' },
  mealBadgeText: { fontFamily: 'Sora_700Bold', fontSize: fs(9), color: colors.accent },
  mealLabel: { fontFamily: 'Sora_500Medium', fontSize: fs(11), color: colors.text },
  mealTime: { fontFamily: 'Sora_400Regular', fontSize: fs(9), color: colors.textSec },
  dotGreen: { width: rs(7), height: rs(7), borderRadius: rs(4), backgroundColor: colors.success },

  petiscoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: rs(6) },
  borderBottom: { borderBottomWidth: 0.5, borderBottomColor: colors.border },
  petiscoName: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.text },
  tagOk: { backgroundColor: colors.successSoft, borderRadius: rs(6), paddingHorizontal: rs(7), paddingVertical: rs(2) },
  tagOkText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(8), color: colors.success },
  tagDanger: { backgroundColor: colors.dangerSoft, borderRadius: rs(6), paddingHorizontal: rs(7), paddingVertical: rs(2) },
  tagDangerText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(8), color: colors.danger },

  okBox: { flexDirection: 'row', alignItems: 'center', gap: rs(8), backgroundColor: colors.successSoft, borderRadius: rs(10), borderWidth: 0.5, borderColor: colors.success + '30', padding: rs(10) },
  okText: { fontFamily: 'Sora_500Medium', fontSize: fs(10), color: colors.success },

  btnSecondary: { backgroundColor: colors.bgCard, borderRadius: rs(12), paddingVertical: rs(12), alignItems: 'center', borderWidth: 1, borderColor: colors.accent },
  btnSecondaryText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(13), color: colors.accent },
});
