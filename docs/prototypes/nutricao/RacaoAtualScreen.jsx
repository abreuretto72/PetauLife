/**
 * RacaoAtualScreen.jsx — Tela 2
 * Ração atual com detalhes e porção por peso
 * Rota: app/(app)/pet/[id]/nutrition/racao.tsx
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';
import { colors } from '../../../../../constants/colors';
import { rs, fs } from '../../../../../hooks/useResponsive';
import { useNutricao } from '../../../../../hooks/useNutricao';
import { usePet } from '../../../../../hooks/usePets';

export default function RacaoAtualScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: pet } = usePet(id);
  const { nutricao } = useNutricao(id);
  const food = nutricao?.current_food;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Alerta fase inadequada ── */}
      {food?.life_stage_mismatch && (
        <View style={s.alertBox}>
          <AlertTriangle size={rs(13)} color={colors.danger} strokeWidth={1.8} />
          <View style={s.col}>
            <Text style={s.alertTitle}>Esta ração é para cães {food.life_stage}</Text>
            <Text style={s.alertSub}>
              {pet?.name} tem {nutricao?.age_label} e precisa de ração para {nutricao?.life_stage}.
            </Text>
          </View>
        </View>
      )}

      {/* ── Dados da ração ── */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>Informações</Text>
        <View style={s.infoRow}><Text style={s.label}>Produto</Text><Text style={s.value}>{food?.product_name}</Text></View>
        <View style={s.infoRow}><Text style={s.label}>Marca</Text><Text style={s.value}>{food?.brand}</Text></View>
        <View style={s.infoRow}><Text style={s.label}>Fase de vida</Text>
          <Text style={[s.value, food?.life_stage_mismatch && { color: colors.danger }]}>{food?.life_stage}</Text>
        </View>
        <View style={s.infoRow}><Text style={s.label}>Usando desde</Text><Text style={s.value}>{food?.since_label}</Text></View>
      </View>

      {/* ── Porção ── */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>Porção para {pet?.name} · {nutricao?.weight_kg}kg</Text>
        <View style={s.portionCard}>
          <Text style={s.portionValue}>{food?.daily_portion}</Text>
          <Text style={s.portionSub}>Dividir em {food?.frequency_per_day ?? 2} refeições</Text>
        </View>
      </View>

      {/* ── Suplementos ── */}
      {nutricao?.supplements?.length > 0 && (
        <View style={s.card}>
          <Text style={s.sectionTitle}>Suplementos</Text>
          {nutricao.supplements.map((sup, i) => (
            <View key={i} style={s.infoRow}>
              <Text style={s.label}>{sup.name}</Text>
              <Text style={s.value}>{sup.dosage} · {sup.frequency}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Aviso transição ── */}
      <View style={s.warnBox}>
        <AlertTriangle size={rs(12)} color={colors.gold} strokeWidth={1.8} />
        <Text style={s.warnText}>Ao trocar, faça a transição gradual em 5 dias misturando as rações para evitar problemas intestinais.</Text>
      </View>

      <TouchableOpacity style={s.btnPrimary} onPress={() => router.push(`/pet/${id}/nutrition/trocar`)} activeOpacity={0.8}>
        <RefreshCw size={rs(15)} color="#fff" strokeWidth={2} />
        <Text style={s.btnPrimaryText}>Trocar ração</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: rs(16), gap: rs(12), paddingBottom: rs(40) },
  col: { flex: 1 },

  alertBox: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(10), backgroundColor: colors.dangerSoft, borderRadius: rs(12), borderWidth: 0.5, borderColor: colors.danger, padding: rs(12) },
  alertTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(11), color: colors.danger },
  alertSub: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.danger, marginTop: rs(2), lineHeight: fs(15) },

  card: { backgroundColor: colors.bgCard, borderRadius: rs(14), borderWidth: 0.5, borderColor: colors.border, padding: rs(14), gap: rs(8) },
  sectionTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.text, marginBottom: rs(2) },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: rs(4), borderBottomWidth: 0.5, borderBottomColor: colors.border },
  label: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textDim },
  value: { fontFamily: 'Sora_500Medium', fontSize: fs(10), color: colors.text },

  portionCard: { backgroundColor: colors.accentSoft, borderRadius: rs(12), padding: rs(14), alignItems: 'center', gap: rs(4) },
  portionValue: { fontFamily: 'Sora_700Bold', fontSize: fs(22), color: colors.accent },
  portionSub: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textSec },

  warnBox: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(8), backgroundColor: colors.goldSoft ?? colors.accentSoft, borderRadius: rs(10), borderWidth: 0.5, borderColor: colors.gold, padding: rs(10) },
  warnText: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.gold, flex: 1, lineHeight: fs(15) },

  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), backgroundColor: colors.accent, borderRadius: rs(14), paddingVertical: rs(14) },
  btnPrimaryText: { fontFamily: 'Sora_700Bold', fontSize: fs(14), color: '#fff' },
});
