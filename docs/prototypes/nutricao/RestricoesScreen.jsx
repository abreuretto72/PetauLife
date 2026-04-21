/**
 * RestricoesScreen.jsx — Tela 3
 * Restrições alimentares do pet
 * Rota: app/(app)/pet/[id]/nutrition/restricoes.tsx
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AlertTriangle, Plus, CheckCircle } from 'lucide-react-native';
import { colors } from '../../../../../constants/colors';
import { rs, fs } from '../../../../../hooks/useResponsive';
import { useNutricao } from '../../../../../hooks/useNutricao';
import { usePet } from '../../../../../hooks/usePets';

const ASPCA_LIST = [
  'Chocolate e cacau', 'Xilitol (adoçante)', 'Uva e passa',
  'Cebola, alho e cebolinha', 'Abacate', 'Macadâmia',
  'Cafeína e café', 'Álcool', 'Sal em excesso',
];

const SEVERITY_LABELS = { leve: 'Leve', moderada: 'Moderada', grave: 'Grave' };
const SEVERITY_COLORS = { leve: colors.gold, moderada: colors.accent, grave: colors.danger };

export default function RestricoesScreen() {
  const { id } = useLocalSearchParams();
  const { nutricao } = useNutricao(id);
  const { data: pet } = usePet(id);
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState('');

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Aviso ── */}
      <View style={s.alertBox}>
        <AlertTriangle size={rs(13)} color={colors.danger} strokeWidth={1.8} />
        <Text style={s.alertText}>Mostre esta lista para quem cuidar de {pet?.name}.</Text>
      </View>

      {/* ── Reações conhecidas ── */}
      <Text style={s.sectionLabel}>Reações conhecidas</Text>
      {nutricao?.restrictions?.length > 0 ? (
        nutricao.restrictions.map((r, i) => (
          <View key={i} style={s.restrictionCard}>
            <View style={s.restrictionHeader}>
              <View style={[s.iconWrap, { backgroundColor: SEVERITY_COLORS[r.severity] + '15' }]}>
                <AlertTriangle size={rs(14)} color={SEVERITY_COLORS[r.severity]} strokeWidth={1.8} />
              </View>
              <View style={s.col}>
                <Text style={s.restrictionName}>{r.allergen}</Text>
                <Text style={s.restrictionSource}>Diagnosticado via {r.source}</Text>
              </View>
              <View style={[s.badge, { backgroundColor: SEVERITY_COLORS[r.severity] + '15' }]}>
                <Text style={[s.badgeText, { color: SEVERITY_COLORS[r.severity] }]}>
                  {SEVERITY_LABELS[r.severity]}
                </Text>
              </View>
            </View>
            {r.description && (
              <Text style={s.restrictionDesc}>{r.description}</Text>
            )}
          </View>
        ))
      ) : (
        <View style={s.okBox}>
          <CheckCircle size={rs(13)} color={colors.success} strokeWidth={1.8} />
          <Text style={s.okText}>Nenhuma reação cadastrada ainda</Text>
        </View>
      )}

      {/* ── Formulário adicionar ── */}
      {showForm ? (
        <View style={s.formCard}>
          <Text style={s.sectionLabel}>Nova restrição</Text>
          <TextInput
            style={s.input}
            placeholder="Ex: Amendoim"
            placeholderTextColor={colors.textDim}
            value={newItem}
            onChangeText={setNewItem}
          />
          <View style={s.formActions}>
            <TouchableOpacity style={s.btnSecondary} onPress={() => setShowForm(false)}>
              <Text style={s.btnSecondaryText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnPrimary} onPress={() => setShowForm(false)}>
              <Text style={s.btnPrimaryText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={s.addBtn} onPress={() => setShowForm(true)} activeOpacity={0.8}>
          <Plus size={rs(15)} color={colors.accent} strokeWidth={2} />
          <Text style={s.addBtnText}>Adicionar nova restrição</Text>
        </TouchableOpacity>
      )}

      {/* ── Lista ASPCA ── */}
      <Text style={s.sectionLabel}>Perigosos para todos os cães (ASPCA)</Text>
      <View style={s.aspcaCard}>
        {ASPCA_LIST.map((item, i) => (
          <View key={i} style={[s.aspcaRow, i < ASPCA_LIST.length - 1 && s.aspcaRowBorder]}>
            <View style={s.dotRed} />
            <Text style={s.aspcaText}>{item}</Text>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: rs(16), gap: rs(12), paddingBottom: rs(40) },
  col: { flex: 1 },

  alertBox: { flexDirection: 'row', alignItems: 'center', gap: rs(8), backgroundColor: colors.dangerSoft, borderRadius: rs(10), borderWidth: 0.5, borderColor: colors.danger, padding: rs(10) },
  alertText: { fontFamily: 'Sora_500Medium', fontSize: fs(10), color: colors.danger, flex: 1 },

  sectionLabel: { fontFamily: 'Sora_600SemiBold', fontSize: fs(10), color: colors.textDim, letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: rs(2) },

  restrictionCard: { backgroundColor: colors.bgCard, borderRadius: rs(12), borderWidth: 1, borderColor: colors.danger + '30', padding: rs(12), gap: rs(8) },
  restrictionHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  iconWrap: { width: rs(32), height: rs(32), borderRadius: rs(10), alignItems: 'center', justifyContent: 'center' },
  restrictionName: { fontFamily: 'Sora_600SemiBold', fontSize: fs(13), color: colors.text },
  restrictionSource: { fontFamily: 'Sora_400Regular', fontSize: fs(9), color: colors.textDim },
  restrictionDesc: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textSec, backgroundColor: colors.card, borderRadius: rs(8), padding: rs(8), lineHeight: fs(15) },
  badge: { paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(20) },
  badgeText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(9) },

  okBox: { flexDirection: 'row', alignItems: 'center', gap: rs(8), backgroundColor: colors.successSoft, borderRadius: rs(10), borderWidth: 0.5, borderColor: colors.success + '30', padding: rs(12) },
  okText: { fontFamily: 'Sora_500Medium', fontSize: fs(11), color: colors.success },

  formCard: { backgroundColor: colors.bgCard, borderRadius: rs(14), borderWidth: 0.5, borderColor: colors.border, padding: rs(14), gap: rs(10) },
  input: { backgroundColor: colors.card, borderRadius: rs(10), borderWidth: 0.5, borderColor: colors.border, padding: rs(12), fontFamily: 'Sora_400Regular', fontSize: fs(13), color: colors.text },
  formActions: { flexDirection: 'row', gap: rs(8) },
  btnSecondary: { flex: 1, backgroundColor: colors.card, borderRadius: rs(10), paddingVertical: rs(10), alignItems: 'center', borderWidth: 0.5, borderColor: colors.border },
  btnSecondaryText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.textSec },
  btnPrimary: { flex: 1, backgroundColor: colors.accent, borderRadius: rs(10), paddingVertical: rs(10), alignItems: 'center' },
  btnPrimaryText: { fontFamily: 'Sora_700Bold', fontSize: fs(12), color: '#fff' },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), backgroundColor: colors.bgCard, borderRadius: rs(12), paddingVertical: rs(12), borderWidth: 1, borderColor: colors.accent },
  addBtnText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(13), color: colors.accent },

  aspcaCard: { backgroundColor: colors.bgCard, borderRadius: rs(14), borderWidth: 0.5, borderColor: colors.border, padding: rs(12) },
  aspcaRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), paddingVertical: rs(6) },
  aspcaRowBorder: { borderBottomWidth: 0.5, borderBottomColor: colors.border },
  dotRed: { width: rs(6), height: rs(6), borderRadius: rs(3), backgroundColor: colors.danger, flexShrink: 0 },
  aspcaText: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.text },
});
