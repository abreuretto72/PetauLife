/**
 * ProntuarioPdfScreen.jsx
 * Preview do PDF do prontuário com opções de compartilhamento
 * Rota: app/(app)/pet/[id]/prontuario-pdf.tsx
 */

import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Download, Mail, MessageCircle, Share2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../../constants/colors';
import { rs, fs } from '../../../../hooks/useResponsive';
import { useProntuario } from '../../../../hooks/useProntuario';
import { usePet } from '../../../../hooks/usePets';
import { generateProntuarioPdf, sharePdf } from '../../../../lib/prontuarioPdf';

export default function ProntuarioPdfScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: pet } = usePet(id);
  const { prontuario, isLoading } = useProntuario(id);
  const [generating, setGenerating] = useState(false);

  const handleShare = useCallback(async (method) => {
    setGenerating(true);
    try {
      const uri = await generateProntuarioPdf(pet, prontuario);
      await sharePdf(uri, method);
    } finally {
      setGenerating(false);
    }
  }, [pet, prontuario]);

  if (isLoading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={s.loadingText}>Gerando prontuário...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Preview do documento ── */}
      <View style={s.pdfPreview}>

        {/* Header do PDF */}
        <View style={s.pdfHeader}>
          <View style={s.pdfLogo}>
            <Text style={s.pdfLogoText}>au</Text>
          </View>
          <View style={s.pdfHeaderText}>
            <Text style={s.pdfTitle}>Prontuário — {pet?.name}</Text>
            <Text style={s.pdfDate}>{new Date().toLocaleDateString('pt-BR')}</Text>
          </View>
          <Text style={s.pdfSpecies}>{pet?.breed}</Text>
        </View>

        {/* Resumo IA no PDF */}
        {prontuario?.ai_summary && (
          <View style={s.pdfAiBox}>
            <Text style={s.pdfAiLabel}>Resumo IA</Text>
            <Text style={s.pdfAiText}>{prontuario.ai_summary}</Text>
          </View>
        )}

        {/* Vacinas no PDF */}
        <View style={s.pdfSection}>
          <Text style={s.pdfSectionTitle}>Vacinas</Text>
          {prontuario?.vaccines?.slice(0, 3).map((v, i) => (
            <View key={i} style={s.pdfRow}>
              <Text style={s.pdfRowName}>{v.name}</Text>
              <Text style={[s.pdfRowDate, v.overdue && { color: '#E74C3C' }]}>{v.date_label}</Text>
            </View>
          ))}
        </View>

        {/* Consultas no PDF */}
        <View style={s.pdfSection}>
          <Text style={s.pdfSectionTitle}>Consultas recentes</Text>
          {prontuario?.consultations?.slice(0, 2).map((c, i) => (
            <View key={i} style={s.pdfRow}>
              <Text style={s.pdfRowName} numberOfLines={1}>{c.date_label} · {c.reason}</Text>
              <Text style={s.pdfRowDate}>{c.veterinarian}</Text>
            </View>
          ))}
        </View>

        {/* Footer do PDF */}
        <View style={s.pdfFooter}>
          <Text style={s.pdfFooterText}>Multiverso Digital © 2026 — auExpert</Text>
        </View>
      </View>

      {/* ── Período coberto ── */}
      <View style={s.infoCard}>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Gerado em</Text>
          <Text style={s.infoValue}>{new Date().toLocaleString('pt-BR')}</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Período coberto</Text>
          <Text style={s.infoValue}>{prontuario?.period_label ?? '—'}</Text>
        </View>
        <View style={s.infoRow}>
          <Text style={s.infoLabel}>Total de registros</Text>
          <Text style={s.infoValue}>{prontuario?.total_entries ?? 0} entradas</Text>
        </View>
      </View>

      {/* ── Botões de compartilhamento ── */}
      <View style={s.shareSection}>
        <TouchableOpacity
          style={s.btnWhatsapp}
          onPress={() => handleShare('whatsapp')}
          disabled={generating}
          activeOpacity={0.8}
        >
          {generating
            ? <ActivityIndicator size="small" color="#fff" />
            : <MessageCircle size={rs(16)} color="#fff" strokeWidth={2} />}
          <Text style={s.btnWhatsappText}>Enviar por WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.btnSecondary}
          onPress={() => handleShare('email')}
          disabled={generating}
          activeOpacity={0.8}
        >
          <Mail size={rs(16)} color={colors.textSec} strokeWidth={2} />
          <Text style={s.btnSecondaryText}>Enviar por e-mail</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.btnSecondary}
          onPress={() => handleShare('save')}
          disabled={generating}
          activeOpacity={0.8}
        >
          <Download size={rs(16)} color={colors.textSec} strokeWidth={2} />
          <Text style={s.btnSecondaryText}>Salvar no celular</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.btnSecondary}
          onPress={() => handleShare('share')}
          disabled={generating}
          activeOpacity={0.8}
        >
          <Share2 size={rs(16)} color={colors.textSec} strokeWidth={2} />
          <Text style={s.btnSecondaryText}>Outros aplicativos</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: rs(16), gap: rs(12), paddingBottom: rs(40) },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: rs(12), backgroundColor: colors.bg },
  loadingText: { fontFamily: 'Sora_400Regular', fontSize: fs(13), color: colors.textSec },

  pdfPreview: { backgroundColor: '#FFFFFF', borderRadius: rs(12), padding: rs(14), borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' },
  pdfHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: colors.accent, paddingBottom: rs(8), marginBottom: rs(10) },
  pdfLogo: { width: rs(22), height: rs(22), backgroundColor: colors.accent, borderRadius: rs(5), alignItems: 'center', justifyContent: 'center', marginRight: rs(8) },
  pdfLogoText: { fontFamily: 'Sora_700Bold', fontSize: fs(9), color: '#fff' },
  pdfHeaderText: { flex: 1 },
  pdfTitle: { fontFamily: 'Sora_700Bold', fontSize: fs(11), color: '#003366' },
  pdfDate: { fontFamily: 'Sora_400Regular', fontSize: fs(8), color: '#666' },
  pdfSpecies: { fontFamily: 'Sora_400Regular', fontSize: fs(8), color: '#888' },

  pdfAiBox: { backgroundColor: '#FDF0E8', borderLeftWidth: 2, borderLeftColor: colors.accent, paddingHorizontal: rs(8), paddingVertical: rs(6), borderRadius: rs(4), marginBottom: rs(10) },
  pdfAiLabel: { fontFamily: 'Sora_700Bold', fontSize: fs(8), color: colors.accent, marginBottom: rs(2) },
  pdfAiText: { fontFamily: 'Sora_400Regular', fontSize: fs(8), color: '#333', lineHeight: fs(13) },

  pdfSection: { marginBottom: rs(8) },
  pdfSectionTitle: { fontFamily: 'Sora_700Bold', fontSize: fs(8), color: '#003366', marginBottom: rs(4) },
  pdfRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: rs(2), borderBottomWidth: 0.5, borderBottomColor: '#EEE' },
  pdfRowName: { fontFamily: 'Sora_400Regular', fontSize: fs(8), color: '#333', flex: 1 },
  pdfRowDate: { fontFamily: 'Sora_400Regular', fontSize: fs(8), color: '#2ECC71' },

  pdfFooter: { borderTopWidth: 0.5, borderTopColor: '#DDD', paddingTop: rs(6), marginTop: rs(4), alignItems: 'center' },
  pdfFooterText: { fontFamily: 'Sora_400Regular', fontSize: fs(7), color: '#AAA' },

  infoCard: { backgroundColor: colors.bgCard, borderRadius: rs(12), borderWidth: 0.5, borderColor: colors.border, padding: rs(12), gap: rs(6) },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoLabel: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textDim },
  infoValue: { fontFamily: 'Sora_500Medium', fontSize: fs(10), color: colors.text },

  shareSection: { gap: rs(8) },
  btnWhatsapp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), backgroundColor: '#25D366', borderRadius: rs(14), paddingVertical: rs(14) },
  btnWhatsappText: { fontFamily: 'Sora_700Bold', fontSize: fs(14), color: '#fff' },
  btnSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), backgroundColor: colors.bgCard, borderRadius: rs(12), paddingVertical: rs(12), borderWidth: 0.5, borderColor: colors.border },
  btnSecondaryText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(13), color: colors.textSec },
});
