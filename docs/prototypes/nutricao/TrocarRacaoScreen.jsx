/**
 * TrocarRacaoScreen.jsx — Tela 5
 * Trocar ração (OCR da embalagem ou manual)
 * Rota: app/(app)/pet/[id]/nutrition/trocar.tsx
 */

import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Switch, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScanLine } from 'lucide-react-native';
import { colors } from '../../../../../constants/colors';
import { rs, fs } from '../../../../../hooks/useResponsive';
import { useNutricao } from '../../../../../hooks/useNutricao';

const LIFE_STAGES = [
  { key: 'filhote', label: 'Filhote', color: colors.sky },
  { key: 'adulto', label: 'Adulto', color: colors.success },
  { key: 'senior', label: 'Sênior', color: colors.purple },
];

export default function TrocarRacaoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { registrarRacao } = useNutricao(id);

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [lifeStage, setLifeStage] = useState('adulto');
  const [dailyPortion, setDailyPortion] = useState('');
  const [gradualTransition, setGradualTransition] = useState(true);
  const [saving, setSaving] = useState(false);

  // Preencher campos via OCR (DocumentScanner → classify-diary-entry)
  const handleOcrResult = useCallback((ocrData) => {
    if (ocrData?.product_name) setProductName(ocrData.product_name);
    if (ocrData?.brand_name) setBrand(ocrData.brand_name);
    if (ocrData?.life_stage?.toLowerCase().includes('filhote')) setLifeStage('filhote');
  }, []);

  const handleSave = useCallback(async () => {
    if (!productName.trim()) return;
    setSaving(true);
    try {
      await registrarRacao({
        product_name: productName,
        brand,
        life_stage: lifeStage,
        daily_portion_g: parseInt(dailyPortion) || null,
      });
      router.back();
    } finally {
      setSaving(false);
    }
  }, [productName, brand, lifeStage, dailyPortion, registrarRacao, router]);

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Scanner OCR ── */}
      <TouchableOpacity
        style={s.scannerBtn}
        onPress={() => router.push({ pathname: `/pet/${id}/nutrition/scanner`, params: { onResult: 'handleOcrResult' } })}
        activeOpacity={0.8}
      >
        <ScanLine size={rs(22)} color={colors.textDim} strokeWidth={1.5} />
        <Text style={s.scannerText}>Escanear embalagem com OCR</Text>
        <Text style={s.scannerSub}>Preenche automaticamente</Text>
      </TouchableOpacity>

      <View style={s.dividerRow}>
        <View style={s.dividerLine} />
        <Text style={s.dividerText}>ou preencher manualmente</Text>
        <View style={s.dividerLine} />
      </View>

      {/* ── Formulário ── */}
      <View style={s.card}>
        <Text style={s.fieldLabel}>Nome da ração *</Text>
        <TextInput
          style={s.input}
          placeholder="Ex: Royal Canin Mini Puppy"
          placeholderTextColor={colors.textDim}
          value={productName}
          onChangeText={setProductName}
        />

        <Text style={s.fieldLabel}>Marca</Text>
        <TextInput
          style={s.input}
          placeholder="Ex: Royal Canin"
          placeholderTextColor={colors.textDim}
          value={brand}
          onChangeText={setBrand}
        />

        <Text style={s.fieldLabel}>Fase de vida</Text>
        <View style={s.stagesRow}>
          {LIFE_STAGES.map((stage) => (
            <TouchableOpacity
              key={stage.key}
              style={[s.stageBtn, lifeStage === stage.key && { backgroundColor: stage.color + '20', borderColor: stage.color }]}
              onPress={() => setLifeStage(stage.key)}
              activeOpacity={0.8}
            >
              <Text style={[s.stageBtnText, lifeStage === stage.key && { color: stage.color }]}>
                {stage.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.fieldLabel}>Porção diária (gramas)</Text>
        <TextInput
          style={s.input}
          placeholder="Ex: 55"
          placeholderTextColor={colors.textDim}
          value={dailyPortion}
          onChangeText={setDailyPortion}
          keyboardType="numeric"
        />
      </View>

      {/* ── Transição gradual ── */}
      <View style={s.toggleCard}>
        <View style={s.col}>
          <Text style={s.toggleTitle}>Fazer transição gradual</Text>
          <Text style={s.toggleSub}>5 dias misturando as rações</Text>
        </View>
        <Switch
          value={gradualTransition}
          onValueChange={setGradualTransition}
          trackColor={{ false: colors.border, true: colors.lime }}
          thumbColor="#fff"
        />
      </View>

      {/* ── Salvar ── */}
      <TouchableOpacity
        style={[s.btnPrimary, (!productName.trim() || saving) && s.btnDisabled]}
        onPress={handleSave}
        disabled={!productName.trim() || saving}
        activeOpacity={0.8}
      >
        {saving ? <ActivityIndicator size="small" color="#fff" /> : null}
        <Text style={s.btnPrimaryText}>Salvar nova ração</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: rs(16), gap: rs(12), paddingBottom: rs(40) },
  col: { flex: 1 },

  scannerBtn: { backgroundColor: colors.bgCard, borderRadius: rs(14), borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, padding: rs(20), alignItems: 'center', gap: rs(4) },
  scannerText: { fontFamily: 'Sora_500Medium', fontSize: fs(12), color: colors.textSec },
  scannerSub: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textDim },

  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: colors.border },
  dividerText: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textDim },

  card: { backgroundColor: colors.bgCard, borderRadius: rs(14), borderWidth: 0.5, borderColor: colors.border, padding: rs(14), gap: rs(10) },
  fieldLabel: { fontFamily: 'Sora_600SemiBold', fontSize: fs(11), color: colors.textSec },
  input: { backgroundColor: colors.card, borderRadius: rs(10), borderWidth: 0.5, borderColor: colors.border, paddingHorizontal: rs(12), paddingVertical: rs(10), fontFamily: 'Sora_400Regular', fontSize: fs(13), color: colors.text },

  stagesRow: { flexDirection: 'row', gap: rs(8) },
  stageBtn: { flex: 1, backgroundColor: colors.card, borderRadius: rs(10), paddingVertical: rs(10), alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  stageBtnText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(11), color: colors.textSec },

  toggleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: rs(14), borderWidth: 0.5, borderColor: colors.border, padding: rs(14), gap: rs(12) },
  toggleTitle: { fontFamily: 'Sora_500Medium', fontSize: fs(12), color: colors.text },
  toggleSub: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textSec },

  btnPrimary: { backgroundColor: colors.lime, borderRadius: rs(14), paddingVertical: rs(14), alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: rs(8) },
  btnPrimaryText: { fontFamily: 'Sora_700Bold', fontSize: fs(14), color: '#fff' },
  btnDisabled: { opacity: 0.4 },
});
