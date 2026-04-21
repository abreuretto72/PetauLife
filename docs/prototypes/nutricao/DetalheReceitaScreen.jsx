/**
 * DetalheReceitaScreen.jsx — Tela 12
 * Detalhe de uma receita caseira
 * Rota: app/(app)/pet/[id]/nutrition/receita.tsx
 */

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CheckCircle, Clock, Package } from 'lucide-react-native';
import { colors } from '../../../../../constants/colors';
import { rs, fs } from '../../../../../hooks/useResponsive';
import { useNutricao } from '../../../../../hooks/useNutricao';

export default function DetalheReceitaScreen() {
  const { id, recipeId } = useLocalSearchParams();
  const { getRecipe } = useNutricao(id);
  const receita = getRecipe(recipeId);

  if (!receita) return null;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Info rápida ── */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <Clock size={rs(14)} color={colors.accent} strokeWidth={1.8} />
          <Text style={s.statValue}>{receita.prep_minutes}</Text>
          <Text style={s.statLabel}>min</Text>
        </View>
        <View style={s.statCard}>
          <Package size={rs(14)} color={colors.lime} strokeWidth={1.8} />
          <Text style={s.statValue}>{receita.servings}</Text>
          <Text style={s.statLabel}>unidades</Text>
        </View>
        <View style={s.statCard}>
          <Text style={s.statValue}>{receita.portion_g}g</Text>
          <Text style={s.statLabel}>cada</Text>
        </View>
      </View>

      {/* ── Segurança ── */}
      {receita.is_safe ? (
        <View style={s.safeBox}>
          <CheckCircle size={rs(13)} color={colors.success} strokeWidth={1.8} />
          <Text style={s.safeText}>Sem ingredientes proibidos para {receita.pet_name}</Text>
        </View>
      ) : (
        <View style={s.dangerBox}>
          <Text style={s.dangerText}>Contém ingredientes que a {receita.pet_name} não pode comer</Text>
        </View>
      )}

      {/* ── Ingredientes ── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Ingredientes</Text>
        {receita.ingredients?.map((ing, i) => (
          <View key={i} style={[s.ingrRow, i < receita.ingredients.length - 1 && s.ingrRowBorder]}>
            <Text style={[s.ingrName, ing.is_restriction && { color: colors.danger }]}>{ing.name}</Text>
            <Text style={s.ingrQty}>{ing.quantity}</Text>
          </View>
        ))}
      </View>

      {/* ── Modo de preparo ── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Modo de preparo</Text>
        {receita.steps?.map((step, i) => (
          <View key={i} style={s.stepRow}>
            <View style={s.stepNum}>
              <Text style={s.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={s.stepText}>{step}</Text>
          </View>
        ))}
      </View>

      {/* ── Conservação ── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Conservação</Text>
        <View style={s.conservRow}>
          <Text style={s.conservLabel}>Geladeira</Text>
          <Text style={s.conservValue}>{receita.storage_fridge}</Text>
        </View>
        <View style={s.conservRow}>
          <Text style={s.conservLabel}>Freezer</Text>
          <Text style={s.conservValue}>{receita.storage_freezer}</Text>
        </View>
      </View>

      {/* ── Dica IA ── */}
      {receita.ai_tip && (
        <View style={s.aiBox}>
          <Text style={s.aiText}>{receita.ai_tip}</Text>
        </View>
      )}

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: rs(16), gap: rs(12), paddingBottom: rs(40) },

  statsRow: { flexDirection: 'row', gap: rs(8) },
  statCard: { flex: 1, backgroundColor: colors.bgCard, borderRadius: rs(12), borderWidth: 0.5, borderColor: colors.border, padding: rs(12), alignItems: 'center', gap: rs(3) },
  statValue: { fontFamily: 'Sora_700Bold', fontSize: fs(16), color: colors.text },
  statLabel: { fontFamily: 'Sora_400Regular', fontSize: fs(9), color: colors.textDim },

  safeBox: { flexDirection: 'row', alignItems: 'center', gap: rs(8), backgroundColor: colors.successSoft, borderRadius: rs(10), borderWidth: 0.5, borderColor: colors.success + '30', padding: rs(10) },
  safeText: { fontFamily: 'Sora_500Medium', fontSize: fs(10), color: colors.success, flex: 1 },
  dangerBox: { backgroundColor: colors.dangerSoft, borderRadius: rs(10), borderWidth: 0.5, borderColor: colors.danger + '30', padding: rs(10) },
  dangerText: { fontFamily: 'Sora_500Medium', fontSize: fs(10), color: colors.danger },

  section: { backgroundColor: colors.bgCard, borderRadius: rs(14), borderWidth: 0.5, borderColor: colors.border, padding: rs(12), gap: rs(8) },
  sectionTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.text, marginBottom: rs(2) },

  ingrRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: rs(5) },
  ingrRowBorder: { borderBottomWidth: 0.5, borderBottomColor: colors.border },
  ingrName: { fontFamily: 'Sora_400Regular', fontSize: fs(12), color: colors.text, flex: 1 },
  ingrQty: { fontFamily: 'Sora_600SemiBold', fontSize: fs(11), color: colors.accent },

  stepRow: { flexDirection: 'row', gap: rs(10), alignItems: 'flex-start' },
  stepNum: { width: rs(20), height: rs(20), borderRadius: rs(10), backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: rs(1) },
  stepNumText: { fontFamily: 'Sora_700Bold', fontSize: fs(9), color: colors.accent },
  stepText: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.textSec, flex: 1, lineHeight: fs(17) },

  conservRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  conservLabel: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textDim },
  conservValue: { fontFamily: 'Sora_500Medium', fontSize: fs(10), color: colors.text },

  aiBox: { backgroundColor: colors.purpleSoft, borderRadius: rs(10), borderWidth: 0.5, borderColor: colors.border, padding: rs(10) },
  aiText: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.textSec, lineHeight: fs(17) },
});
