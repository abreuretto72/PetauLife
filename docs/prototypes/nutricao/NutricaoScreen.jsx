/**
 * NutricaoScreen.jsx — Tela 1
 * Nutrição principal — visão geral
 * Rota: app/(app)/pet/[id]/nutrition.tsx (já existe — substituir conteúdo)
 *
 * ATENÇÃO: NÃO alterar diary_entries, useDiaryEntry, TimelineCards
 * Dados vêm de hooks/useNutricao.ts (novo arquivo)
 */

import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle, ChevronRight, Sparkles,
  UtensilsCrossed, Clock, Weight,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../../constants/colors';
import { rs, fs } from '../../../../hooks/useResponsive';
import { useNutricao } from '../../../../hooks/useNutricao';
import { usePet } from '../../../../hooks/usePets';

export default function NutricaoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: pet } = usePet(id);
  const { nutricao, isLoading } = useNutricao(id);

  const nav = useCallback((route) => router.push(`/pet/${id}/${route}`), [id, router]);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Cabeçalho do pet ── */}
      <View style={s.petHeader}>
        <View style={s.petAvatar}>
          <Text style={s.petAvatarText}>{pet?.name?.[0]}</Text>
        </View>
        <View style={s.col}>
          <Text style={s.petName}>{pet?.name}</Text>
          <Text style={s.petSub}>{pet?.breed} · {nutricao?.age_label} · {nutricao?.weight_kg}kg</Text>
        </View>
        <View style={[s.badge, nutricao?.life_stage === 'filhote' ? s.badgeBlue : s.badgeGreen]}>
          <Text style={nutricao?.life_stage === 'filhote' ? s.badgeTextBlue : s.badgeTextGreen}>
            {nutricao?.life_stage ?? 'adulto'}
          </Text>
        </View>
      </View>

      {/* ── Avaliação IA ── */}
      {nutricao?.ai_evaluation && (
        <View style={s.aiBox}>
          <View style={s.aiHeader}>
            <Sparkles size={rs(13)} color={colors.purple} strokeWidth={1.8} />
            <Text style={s.aiTitle}>Avaliação IA</Text>
            <View style={[s.badge, s.badgePurple]}><Text style={s.badgeTextPurple}>IA</Text></View>
          </View>
          <Text style={s.aiText}>{nutricao.ai_evaluation}</Text>
        </View>
      )}

      {/* ── Alertas ── */}
      {nutricao?.alerts?.map((alert, i) => (
        <View key={i} style={[s.alertBox, alert.severity === 'high' ? s.alertRed : s.alertYellow]}>
          <AlertTriangle size={rs(12)} color={alert.severity === 'high' ? colors.danger : colors.gold} strokeWidth={1.8} />
          <Text style={[s.alertText, { color: alert.severity === 'high' ? colors.danger : colors.gold }]}>
            {alert.message}
          </Text>
        </View>
      ))}

      {/* ── Ração atual ── */}
      <TouchableOpacity style={s.section} onPress={() => nav('nutrition/racao')} activeOpacity={0.8}>
        <View style={s.sectionHeader}>
          <UtensilsCrossed size={rs(14)} color={colors.lime} strokeWidth={1.8} />
          <Text style={s.sectionTitle}>Ração atual</Text>
          <View style={[s.badge, s.badgeOrange]}>
            <Text style={s.badgeTextOrange}>desde {nutricao?.current_food?.since_label}</Text>
          </View>
          <ChevronRight size={rs(14)} color={colors.textDim} strokeWidth={1.8} />
        </View>
        {nutricao?.current_food && (
          <>
            <Text style={s.foodName}>{nutricao.current_food.product_name}</Text>
            <View style={s.foodRow}>
              <Text style={s.foodLabel}>Porção diária</Text>
              <Text style={s.foodValue}>{nutricao.current_food.daily_portion}</Text>
            </View>
            <View style={s.foodRow}>
              <Text style={s.foodLabel}>Fase de vida</Text>
              <Text style={[s.foodValue, nutricao.current_food.life_stage_mismatch && { color: colors.danger }]}>
                {nutricao.current_food.life_stage}
                {nutricao.current_food.life_stage_mismatch ? ' (incorreto)' : ''}
              </Text>
            </View>
          </>
        )}
      </TouchableOpacity>

      {/* ── Peso ── */}
      <TouchableOpacity style={s.section} onPress={() => nav('nutrition/peso')} activeOpacity={0.8}>
        <View style={s.sectionHeader}>
          <Weight size={rs(14)} color={colors.accent} strokeWidth={1.8} />
          <Text style={s.sectionTitle}>Evolução do peso</Text>
          <Text style={[s.sectionBadge, { color: colors.success }]}>{nutricao?.weight_trend}</Text>
          <ChevronRight size={rs(14)} color={colors.textDim} strokeWidth={1.8} />
        </View>
        <View style={s.weightRow}>
          <View style={s.weightBar}>
            {nutricao?.weight_history?.slice(-5).map((w, i) => (
              <View key={i} style={[s.weightBarItem, {
                height: rs(8 + (w.value / (nutricao.weight_kg || 1)) * 24),
                backgroundColor: i === nutricao.weight_history.length - 1 ? colors.success : colors.accent,
              }]} />
            ))}
          </View>
          <View style={s.weightLabels}>
            <Text style={s.weightStart}>{nutricao?.weight_start}kg</Text>
            <Text style={[s.weightCurrent, { color: colors.success }]}>{nutricao?.weight_kg}kg</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Restrições ── */}
      <TouchableOpacity style={s.section} onPress={() => nav('nutrition/restricoes')} activeOpacity={0.8}>
        <View style={s.sectionHeader}>
          <AlertTriangle size={rs(14)} color={colors.danger} strokeWidth={1.8} />
          <Text style={s.sectionTitle}>Restrições alimentares</Text>
          {nutricao?.restrictions?.length > 0 && (
            <View style={[s.badge, s.badgeRed]}>
              <Text style={s.badgeTextRed}>{nutricao.restrictions.length} itens</Text>
            </View>
          )}
          <ChevronRight size={rs(14)} color={colors.textDim} strokeWidth={1.8} />
        </View>
        <View style={s.tagsRow}>
          {nutricao?.restrictions?.slice(0, 4).map((r, i) => (
            <View key={i} style={s.tag}><Text style={s.tagText}>{r.allergen}</Text></View>
          ))}
          {nutricao?.restrictions?.length > 4 && (
            <Text style={s.tagMore}>+{nutricao.restrictions.length - 4} mais</Text>
          )}
        </View>
      </TouchableOpacity>

      {/* ── Ações rápidas ── */}
      <View style={s.actionsRow}>
        <TouchableOpacity style={s.actionBtn} onPress={() => nav('nutrition/modalidade')} activeOpacity={0.8}>
          <Text style={s.actionBtnText}>Receitas e cardápio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionBtnSecondary} onPress={() => nav('nutrition/historico')} activeOpacity={0.8}>
          <Text style={s.actionBtnSecondaryText}>Histórico</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: rs(16), gap: rs(12), paddingBottom: rs(40) },
  col: { flex: 1, gap: rs(2) },

  petHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(12), backgroundColor: colors.bgCard, borderRadius: rs(14), borderWidth: 0.5, borderColor: colors.border, padding: rs(12) },
  petAvatar: { width: rs(40), height: rs(40), borderRadius: rs(20), backgroundColor: colors.limeSoft ?? colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  petAvatarText: { fontFamily: 'Sora_700Bold', fontSize: fs(16), color: colors.lime },
  petName: { fontFamily: 'Sora_700Bold', fontSize: fs(14), color: colors.text },
  petSub: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textSec },

  badge: { paddingHorizontal: rs(8), paddingVertical: rs(2), borderRadius: rs(20) },
  badgeGreen: { backgroundColor: colors.successSoft },
  badgeBlue: { backgroundColor: colors.skySoft },
  badgeOrange: { backgroundColor: colors.accentSoft },
  badgeRed: { backgroundColor: colors.dangerSoft },
  badgePurple: { backgroundColor: colors.purpleSoft },
  badgeTextGreen: { fontFamily: 'Sora_600SemiBold', fontSize: fs(9), color: colors.success },
  badgeTextBlue: { fontFamily: 'Sora_600SemiBold', fontSize: fs(9), color: colors.sky },
  badgeTextOrange: { fontFamily: 'Sora_600SemiBold', fontSize: fs(9), color: colors.accent },
  badgeTextRed: { fontFamily: 'Sora_600SemiBold', fontSize: fs(9), color: colors.danger },
  badgeTextPurple: { fontFamily: 'Sora_600SemiBold', fontSize: fs(9), color: colors.purple },

  aiBox: { backgroundColor: colors.purpleSoft, borderRadius: rs(12), borderWidth: 0.5, borderColor: colors.border, padding: rs(12) },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(6) },
  aiTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(10), color: colors.purple, flex: 1 },
  aiText: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.textSec, lineHeight: fs(17) },

  alertBox: { flexDirection: 'row', alignItems: 'center', gap: rs(8), borderRadius: rs(10), borderWidth: 0.5, padding: rs(10) },
  alertRed: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  alertYellow: { backgroundColor: colors.goldSoft ?? colors.accentSoft, borderColor: colors.gold },
  alertText: { fontFamily: 'Sora_500Medium', fontSize: fs(10), flex: 1 },

  section: { backgroundColor: colors.bgCard, borderRadius: rs(14), borderWidth: 0.5, borderColor: colors.border, padding: rs(12), gap: rs(6) },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  sectionTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.text, flex: 1 },
  sectionBadge: { fontFamily: 'Sora_400Regular', fontSize: fs(10) },

  foodName: { fontFamily: 'Sora_500Medium', fontSize: fs(12), color: colors.text },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  foodLabel: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textDim },
  foodValue: { fontFamily: 'Sora_500Medium', fontSize: fs(10), color: colors.text },

  weightRow: { gap: rs(4) },
  weightBar: { flexDirection: 'row', alignItems: 'flex-end', gap: rs(4), height: rs(40) },
  weightBarItem: { flex: 1, borderRadius: rs(3) },
  weightLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  weightStart: { fontFamily: 'Sora_400Regular', fontSize: fs(9), color: colors.textDim },
  weightCurrent: { fontFamily: 'Sora_600SemiBold', fontSize: fs(10) },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(5) },
  tag: { backgroundColor: colors.bgCard2 ?? colors.card, borderRadius: rs(6), borderWidth: 0.5, borderColor: colors.border, paddingHorizontal: rs(8), paddingVertical: rs(2) },
  tagText: { fontFamily: 'Sora_400Regular', fontSize: fs(9), color: colors.textSec },
  tagMore: { fontFamily: 'Sora_400Regular', fontSize: fs(9), color: colors.textDim },

  actionsRow: { flexDirection: 'row', gap: rs(8) },
  actionBtn: { flex: 1, backgroundColor: colors.lime, borderRadius: rs(12), paddingVertical: rs(12), alignItems: 'center' },
  actionBtnText: { fontFamily: 'Sora_700Bold', fontSize: fs(12), color: '#fff' },
  actionBtnSecondary: { flex: 1, backgroundColor: colors.bgCard, borderRadius: rs(12), paddingVertical: rs(12), alignItems: 'center', borderWidth: 0.5, borderColor: colors.border },
  actionBtnSecondaryText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.textSec },
});
