/**
 * CardapioSemanalScreen.jsx — Tela 11
 * Cardápio semanal gerado por IA
 * Rota: app/(app)/pet/[id]/nutrition/cardapio.tsx
 */

import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RefreshCw, ChevronRight, Sparkles } from 'lucide-react-native';
import { colors } from '../../../../../constants/colors';
import { rs, fs } from '../../../../../hooks/useResponsive';
import { useNutricao } from '../../../../../hooks/useNutricao';

const DAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function CardapioSemanalScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { cardapio, isLoadingCardapio, regenerarCardapio } = useNutricao(id);
  const today = new Date().getDay();

  const handleRecipe = useCallback((recipe) => {
    router.push({ pathname: `/pet/${id}/nutrition/receita`, params: { recipeId: recipe.id } });
  }, [id, router]);

  if (isLoadingCardapio) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={colors.lime} />
        <Text style={s.loadingText}>Gerando cardápio com IA...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Header IA ── */}
      <View style={s.aiHeader}>
        <Sparkles size={rs(14)} color={colors.purple} strokeWidth={1.8} />
        <Text style={s.aiLabel}>Gerado por IA · personalizado para {cardapio?.pet_name}</Text>
        <TouchableOpacity onPress={regenerarCardapio} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <RefreshCw size={rs(14)} color={colors.accent} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* ── Modalidade ── */}
      <View style={s.modalBadge}>
        <Text style={s.modalBadgeText}>{cardapio?.modalidade_label ?? 'Ração + natural'}</Text>
      </View>

      {/* ── Dias da semana ── */}
      {cardapio?.days?.map((day, i) => {
        const isToday = day.weekday === today;
        return (
          <TouchableOpacity
            key={i}
            style={[s.dayCard, isToday && s.dayCardToday]}
            onPress={() => day.recipes?.length && handleRecipe(day.recipes[0])}
            activeOpacity={0.8}
          >
            <View style={s.dayHeader}>
              <View style={[s.dayBadge, isToday && s.dayBadgeToday]}>
                <Text style={[s.dayLabel, isToday && s.dayLabelToday]}>{DAYS_PT[day.weekday]}</Text>
              </View>
              <View style={s.col}>
                <Text style={s.dayTitle} numberOfLines={1}>{day.title}</Text>
                <Text style={s.daySub} numberOfLines={1}>{day.description}</Text>
              </View>
              {isToday && <View style={[s.badge, s.badgeToday]}><Text style={s.badgeTodayText}>hoje</Text></View>}
              {day.recipes?.length > 0 && <ChevronRight size={rs(13)} color={colors.textDim} strokeWidth={1.8} />}
            </View>
            {/* Tags de ingredientes */}
            {day.ingredients?.length > 0 && (
              <View style={s.tagsRow}>
                {day.ingredients.slice(0, 4).map((ing, j) => (
                  <View key={j} style={[s.tag, ing.is_restriction && s.tagDanger]}>
                    <Text style={[s.tagText, ing.is_restriction && s.tagTextDanger]}>{ing.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        );
      })}

      {/* ── Botões ── */}
      <View style={s.actionsRow}>
        <TouchableOpacity style={s.btnPrimary} onPress={regenerarCardapio} activeOpacity={0.8}>
          <RefreshCw size={rs(14)} color="#fff" strokeWidth={2} />
          <Text style={s.btnPrimaryText}>Regenerar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnSecondary} onPress={() => {}} activeOpacity={0.8}>
          <Text style={s.btnSecondaryText}>Salvar semana</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: rs(16), gap: rs(10), paddingBottom: rs(40) },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: rs(12), backgroundColor: colors.bg },
  loadingText: { fontFamily: 'Sora_400Regular', fontSize: fs(13), color: colors.textSec },
  col: { flex: 1 },

  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(8), backgroundColor: colors.purpleSoft, borderRadius: rs(10), borderWidth: 0.5, borderColor: colors.border, padding: rs(10) },
  aiLabel: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.purple, flex: 1 },

  modalBadge: { backgroundColor: colors.limeSoft ?? colors.accentSoft, borderRadius: rs(8), paddingHorizontal: rs(12), paddingVertical: rs(6), alignSelf: 'flex-start', borderWidth: 0.5, borderColor: colors.lime + '40' },
  modalBadgeText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(10), color: colors.lime },

  dayCard: { backgroundColor: colors.bgCard, borderRadius: rs(12), borderWidth: 0.5, borderColor: colors.border, padding: rs(12), gap: rs(8) },
  dayCardToday: { borderColor: colors.lime, borderWidth: 1 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  dayBadge: { width: rs(32), height: rs(32), backgroundColor: colors.card, borderRadius: rs(8), alignItems: 'center', justifyContent: 'center' },
  dayBadgeToday: { backgroundColor: colors.lime + '20' },
  dayLabel: { fontFamily: 'Sora_700Bold', fontSize: fs(9), color: colors.textDim },
  dayLabelToday: { color: colors.lime },
  dayTitle: { fontFamily: 'Sora_500Medium', fontSize: fs(11), color: colors.text },
  daySub: { fontFamily: 'Sora_400Regular', fontSize: fs(9), color: colors.textSec },

  badge: { paddingHorizontal: rs(7), paddingVertical: rs(2), borderRadius: rs(20) },
  badgeToday: { backgroundColor: colors.limeSoft ?? colors.successSoft },
  badgeTodayText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(9), color: colors.lime },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(4) },
  tag: { backgroundColor: colors.card, borderRadius: rs(5), borderWidth: 0.5, borderColor: colors.border, paddingHorizontal: rs(7), paddingVertical: rs(2) },
  tagDanger: { backgroundColor: colors.dangerSoft, borderColor: colors.danger + '30' },
  tagText: { fontFamily: 'Sora_400Regular', fontSize: fs(8), color: colors.textSec },
  tagTextDanger: { color: colors.danger },

  actionsRow: { flexDirection: 'row', gap: rs(8), marginTop: rs(4) },
  btnPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6), backgroundColor: colors.lime, borderRadius: rs(12), paddingVertical: rs(12) },
  btnPrimaryText: { fontFamily: 'Sora_700Bold', fontSize: fs(13), color: '#fff' },
  btnSecondary: { flex: 1, backgroundColor: colors.bgCard, borderRadius: rs(12), paddingVertical: rs(12), alignItems: 'center', borderWidth: 0.5, borderColor: colors.border },
  btnSecondaryText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(13), color: colors.textSec },
});
