/**
 * DicasIAScreen.jsx — Tela 6
 * Dicas de nutrição personalizadas por IA
 * Rota: app/(app)/pet/[id]/nutrition/dicas.tsx
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Sparkles, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { colors } from '../../../../../constants/colors';
import { rs, fs } from '../../../../../hooks/useResponsive';
import { useNutricao } from '../../../../../hooks/useNutricao';
import { usePet } from '../../../../../hooks/usePets';

export default function DicasIAScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: pet } = usePet(id);
  const { nutricao } = useNutricao(id);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Dica principal ── */}
      <View style={s.aiBox}>
        <View style={s.aiRow}>
          <Sparkles size={rs(13)} color={colors.purple} strokeWidth={1.8} />
          <Text style={s.aiTitle}>Ação recomendada agora</Text>
        </View>
        <Text style={s.aiText}>{nutricao?.ai_evaluation}</Text>
      </View>

      {/* ── Rações recomendadas ── */}
      {nutricao?.recommended_foods?.length > 0 && (
        <>
          <Text style={s.sectionLabel}>Rações recomendadas para {pet?.name}</Text>
          {nutricao.recommended_foods.map((food, i) => (
            <View key={i} style={[s.foodCard, i === 0 && s.foodCardHighlight]}>
              <View style={s.foodHeader}>
                <View style={s.col}>
                  <Text style={s.foodName}>{food.product_name}</Text>
                  <Text style={s.foodDesc}>{food.description}</Text>
                </View>
                {i === 0 && (
                  <View style={s.recommendedBadge}>
                    <Text style={s.recommendedBadgeText}>recomendado</Text>
                  </View>
                )}
              </View>
              <View style={s.foodDetails}>
                <View style={s.detailItem}><Text style={s.detailLabel}>Porte</Text><Text style={s.detailValue}>{food.size}</Text></View>
                <View style={s.detailItem}><Text style={s.detailLabel}>Fase</Text><Text style={s.detailValue}>{food.life_stage}</Text></View>
              </View>
            </View>
          ))}
        </>
      )}

      {/* ── Quando trocar de fase ── */}
      {nutricao?.next_stage_info && (
        <View style={s.warnBox}>
          <AlertTriangle size={rs(12)} color={colors.gold} strokeWidth={1.8} />
          <View style={s.col}>
            <Text style={s.warnTitle}>Quando trocar para {nutricao.next_stage_info.stage}?</Text>
            <Text style={s.warnText}>{nutricao.next_stage_info.description}</Text>
          </View>
        </View>
      )}

      {/* ── Água ── */}
      <View style={s.okBox}>
        <CheckCircle size={rs(12)} color={colors.success} strokeWidth={1.8} />
        <Text style={s.okText}>Sempre deixe água fresca disponível para {pet?.name}</Text>
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: rs(16), gap: rs(12), paddingBottom: rs(40) },
  col: { flex: 1 },

  aiBox: { backgroundColor: colors.purpleSoft, borderRadius: rs(12), borderWidth: 0.5, borderColor: colors.border, padding: rs(12), gap: rs(6) },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  aiTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(11), color: colors.purple },
  aiText: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.textSec, lineHeight: fs(17) },

  sectionLabel: { fontFamily: 'Sora_600SemiBold', fontSize: fs(10), color: colors.textDim, letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: rs(2) },

  foodCard: { backgroundColor: colors.bgCard, borderRadius: rs(12), borderWidth: 0.5, borderColor: colors.border, padding: rs(12), gap: rs(8) },
  foodCardHighlight: { borderColor: colors.lime, borderWidth: 1 },
  foodHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(8) },
  foodName: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.text },
  foodDesc: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textSec, marginTop: rs(2) },
  recommendedBadge: { backgroundColor: colors.limeSoft ?? colors.successSoft, borderRadius: rs(20), paddingHorizontal: rs(8), paddingVertical: rs(3) },
  recommendedBadgeText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(9), color: colors.lime },
  foodDetails: { flexDirection: 'row', gap: rs(16) },
  detailItem: { gap: rs(1) },
  detailLabel: { fontFamily: 'Sora_400Regular', fontSize: fs(9), color: colors.textDim },
  detailValue: { fontFamily: 'Sora_500Medium', fontSize: fs(10), color: colors.lime },

  warnBox: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(8), backgroundColor: colors.goldSoft ?? colors.accentSoft, borderRadius: rs(10), borderWidth: 0.5, borderColor: colors.gold, padding: rs(10) },
  warnTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(10), color: colors.gold },
  warnText: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.gold, marginTop: rs(2), lineHeight: fs(15) },

  okBox: { flexDirection: 'row', alignItems: 'center', gap: rs(8), backgroundColor: colors.successSoft, borderRadius: rs(10), borderWidth: 0.5, borderColor: colors.success + '30', padding: rs(10) },
  okText: { fontFamily: 'Sora_500Medium', fontSize: fs(10), color: colors.success, flex: 1 },
});
