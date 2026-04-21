/**
 * HistoricoRacoesScreen.jsx — Tela 4
 * Histórico de rações com linha do tempo
 * Rota: app/(app)/pet/[id]/nutrition/historico.tsx
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { colors } from '../../../../../constants/colors';
import { rs, fs } from '../../../../../hooks/useResponsive';
import { useNutricao } from '../../../../../hooks/useNutricao';
import { usePet } from '../../../../../hooks/usePets';

const STAGE_COLORS = { filhote: colors.sky, adulto: colors.success, senior: colors.purple };

export default function HistoricoRacoesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { nutricao } = useNutricao(id);
  const history = nutricao?.food_history ?? [];
  const current = nutricao?.current_food;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Ração atual ── */}
      <Text style={s.sectionLabel}>Atual</Text>
      {current && (
        <View style={[s.foodCard, { borderColor: colors.accent }]}>
          <View style={s.foodHeader}>
            <View style={s.col}>
              <Text style={s.foodName}>{current.product_name}</Text>
              <Text style={s.foodPeriod}>{current.since_label} → hoje</Text>
            </View>
            <View style={[s.stageBadge, { backgroundColor: (STAGE_COLORS[current.life_stage] ?? colors.accent) + '15' }]}>
              <Text style={[s.stageBadgeText, { color: STAGE_COLORS[current.life_stage] ?? colors.accent }]}>
                {current.life_stage}
              </Text>
            </View>
          </View>
          {current.life_stage_mismatch && (
            <Text style={s.mismatchText}>Fase incorreta para a idade atual</Text>
          )}
        </View>
      )}

      {/* ── Linha do tempo visual ── */}
      {history.length > 0 && (
        <View style={s.timelineBar}>
          {history.map((f, i) => (
            <View key={i} style={[s.timelineSegment, { backgroundColor: (STAGE_COLORS[f.life_stage] ?? colors.accent) + (i === 0 ? 'FF' : '88') }]} />
          ))}
        </View>
      )}

      {/* ── Histórico ── */}
      {history.length > 0 && (
        <>
          <Text style={s.sectionLabel}>Anteriores</Text>
          {history.map((food, i) => (
            <View key={i} style={s.foodCard}>
              <View style={s.foodHeader}>
                <View style={s.col}>
                  <Text style={s.foodName}>{food.product_name}</Text>
                  <Text style={s.foodPeriod}>{food.since_label} · {food.duration_label ?? ''}</Text>
                </View>
                <View style={[s.stageBadge, { backgroundColor: (STAGE_COLORS[food.life_stage] ?? colors.accent) + '15' }]}>
                  <Text style={[s.stageBadgeText, { color: STAGE_COLORS[food.life_stage] ?? colors.accent }]}>
                    {food.life_stage}
                  </Text>
                </View>
              </View>
              {food.change_reason && (
                <View style={s.reasonRow}>
                  <Text style={s.reasonLabel}>Motivo da troca</Text>
                  <Text style={s.reasonValue}>{food.change_reason}</Text>
                </View>
              )}
            </View>
          ))}
        </>
      )}

      {history.length === 0 && !current && (
        <View style={s.emptyBox}>
          <Text style={s.emptyText}>Nenhuma ração registrada ainda</Text>
        </View>
      )}

      <TouchableOpacity style={s.addBtn} onPress={() => router.push(`/pet/${id}/nutrition/trocar`)} activeOpacity={0.8}>
        <Plus size={rs(15)} color={colors.accent} strokeWidth={2} />
        <Text style={s.addBtnText}>Adicionar ração manual</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: rs(16), gap: rs(12), paddingBottom: rs(40) },
  col: { flex: 1 },

  sectionLabel: { fontFamily: 'Sora_600SemiBold', fontSize: fs(10), color: colors.textDim, letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: rs(2) },

  foodCard: { backgroundColor: colors.bgCard, borderRadius: rs(12), borderWidth: 0.5, borderColor: colors.border, padding: rs(12), gap: rs(6) },
  foodHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  foodName: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.text },
  foodPeriod: { fontFamily: 'Sora_400Regular', fontSize: fs(9), color: colors.textDim },
  stageBadge: { paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(20) },
  stageBadgeText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(9) },
  mismatchText: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.danger },

  reasonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reasonLabel: { fontFamily: 'Sora_400Regular', fontSize: fs(9), color: colors.textDim },
  reasonValue: { fontFamily: 'Sora_400Regular', fontSize: fs(9), color: colors.textSec },

  timelineBar: { flexDirection: 'row', height: rs(8), borderRadius: rs(4), overflow: 'hidden', gap: rs(2) },
  timelineSegment: { flex: 1, borderRadius: rs(2) },

  emptyBox: { backgroundColor: colors.bgCard, borderRadius: rs(12), padding: rs(20), alignItems: 'center' },
  emptyText: { fontFamily: 'Sora_400Regular', fontSize: fs(12), color: colors.textDim },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), backgroundColor: colors.bgCard, borderRadius: rs(12), paddingVertical: rs(12), borderWidth: 1, borderColor: colors.accent },
  addBtnText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(13), color: colors.accent },
});
