/**
 * SoNaturalScreen.jsx — Tela 10
 * Alimentação 100% natural (BARF ou cozido)
 * Rota: app/(app)/pet/[id]/nutrition/so-natural.tsx
 */

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, ChevronRight } from 'lucide-react-native';
import { colors } from '../../../../../constants/colors';
import { rs, fs } from '../../../../../hooks/useResponsive';
import { useNutricao } from '../../../../../hooks/useNutricao';

const CATEGORIAS = {
  proteinas: {
    label: 'Proteínas',
    color: colors.sky,
    percent: 60,
    items: ['Frango cozido ou cru', 'Carne bovina magra', 'Peixe (atum, sardinha)', 'Ovo cozido', 'Peru cozido'],
  },
  vegetais: {
    label: 'Vegetais e frutas',
    color: colors.lime,
    percent: 25,
    items: ['Cenoura cozida', 'Abobrinha cozida', 'Espinafre', 'Batata doce cozida', 'Maçã sem semente'],
  },
  carboidratos: {
    label: 'Carboidratos',
    color: colors.accent,
    percent: 15,
    items: ['Arroz cozido', 'Aveia cozida', 'Batata cozida'],
  },
};

const PROIBIDOS = ['Uva e passa', 'Cebola e alho', 'Chocolate', 'Xilitol', 'Abacate', 'Macadâmia', 'Álcool'];

export default function SoNaturalScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { nutricao } = useNutricao(id);

  const totalG = Math.round((nutricao?.weight_kg ?? 2.5) * 25);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Aviso vet ── */}
      <View style={s.warnBox}>
        <AlertTriangle size={rs(14)} color={colors.gold} strokeWidth={1.8} />
        <View style={s.col}>
          <Text style={s.warnTitle}>Requer acompanhamento veterinário</Text>
          <Text style={s.warnText}>A alimentação 100% natural exige balanceamento cuidadoso de nutrientes. Consulte seu veterinário antes de começar.</Text>
        </View>
      </View>

      {/* ── Protocolo diário ── */}
      <View style={s.card}>
        <View style={s.cardHeader}>
          <Text style={s.cardTitle}>Protocolo diário · {nutricao?.weight_kg}kg</Text>
          <View style={s.totalBadge}><Text style={s.totalBadgeText}>~{totalG}g total</Text></View>
        </View>
        {Object.entries(CATEGORIAS).map(([key, cat]) => (
          <View key={key} style={s.catRow}>
            <View style={s.catHeader}>
              <Text style={[s.catLabel, { color: cat.color }]}>{cat.label}</Text>
              <Text style={s.catPercent}>{cat.percent}% · ~{Math.round(totalG * cat.percent / 100)}g</Text>
            </View>
            <View style={s.track}>
              <View style={[s.fill, { width: `${cat.percent}%` as any, backgroundColor: cat.color }]} />
            </View>
          </View>
        ))}
      </View>

      {/* ── Ingredientes permitidos ── */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Ingredientes permitidos</Text>
        {Object.entries(CATEGORIAS).map(([key, cat]) => (
          <View key={key} style={s.catSection}>
            <Text style={[s.catSectionLabel, { color: cat.color }]}>{cat.label.toUpperCase()}</Text>
            <View style={s.tagsRow}>
              {cat.items.map((item, i) => (
                <View key={i} style={[s.tag, { backgroundColor: cat.color + '12', borderColor: cat.color + '25' }]}>
                  <Text style={[s.tagText, { color: cat.color }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {/* ── Proibidos ── */}
      <View style={s.card}>
        <Text style={[s.cardTitle, { color: colors.danger }]}>Sempre proibidos</Text>
        <View style={s.tagsRow}>
          {PROIBIDOS.map((item, i) => (
            <View key={i} style={s.tagDanger}>
              <Text style={s.tagDangerText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={s.btnPrimary} onPress={() => router.push(`/pet/${id}/nutrition/cardapio`)} activeOpacity={0.8}>
        <ChevronRight size={rs(15)} color="#fff" strokeWidth={2} />
        <Text style={s.btnPrimaryText}>Ver cardápio BARF semanal</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: rs(16), gap: rs(12), paddingBottom: rs(40) },
  col: { flex: 1 },

  warnBox: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(10), backgroundColor: colors.goldSoft ?? colors.accentSoft, borderRadius: rs(12), borderWidth: 0.5, borderColor: colors.gold, padding: rs(12) },
  warnTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(11), color: colors.gold },
  warnText: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.gold, marginTop: rs(2), lineHeight: fs(15) },

  card: { backgroundColor: colors.bgCard, borderRadius: rs(14), borderWidth: 0.5, borderColor: colors.border, padding: rs(12), gap: rs(10) },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.text },
  totalBadge: { backgroundColor: colors.skySoft ?? colors.accentSoft, borderRadius: rs(20), paddingHorizontal: rs(8), paddingVertical: rs(3) },
  totalBadgeText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(10), color: colors.sky },

  catRow: { gap: rs(4) },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catLabel: { fontFamily: 'Sora_600SemiBold', fontSize: fs(10) },
  catPercent: { fontFamily: 'Sora_400Regular', fontSize: fs(9), color: colors.textDim },
  track: { height: rs(5), backgroundColor: colors.card, borderRadius: rs(3), overflow: 'hidden' },
  fill: { height: '100%', borderRadius: rs(3) },

  catSection: { gap: rs(5) },
  catSectionLabel: { fontFamily: 'Sora_700Bold', fontSize: fs(9), letterSpacing: 0.5 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(5) },
  tag: { paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(6), borderWidth: 0.5 },
  tagText: { fontFamily: 'Sora_500Medium', fontSize: fs(9) },
  tagDanger: { backgroundColor: colors.dangerSoft, paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(6), borderWidth: 0.5, borderColor: colors.danger + '30' },
  tagDangerText: { fontFamily: 'Sora_500Medium', fontSize: fs(9), color: colors.danger },

  btnPrimary: { backgroundColor: colors.sky, borderRadius: rs(14), paddingVertical: rs(14), alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: rs(8) },
  btnPrimaryText: { fontFamily: 'Sora_700Bold', fontSize: fs(14), color: '#fff' },
});
