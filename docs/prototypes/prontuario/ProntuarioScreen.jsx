/**
 * ProntuarioScreen.jsx
 * Prontuário do pet — visão do TUTOR
 * Rota: app/(app)/pet/[id]/prontuario.tsx
 *
 * REGRAS:
 * - NÃO alterar diary_entries, useDiaryEntry, TimelineCards
 * - Dados vêm de hooks/useProntuario.ts (novo arquivo)
 * - Leitura de diary_entries é somente leitura
 */

import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle, CheckCircle, ChevronRight,
  FileText, Heart, Pill, Sparkles, Syringe,
  Weight, Clock, QrCode, Share2,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../../../constants/colors';
import { rs, fs } from '../../../../hooks/useResponsive';
import { useProntuario } from '../../../../hooks/useProntuario';
import { usePet } from '../../../../hooks/usePets';

export default function ProntuarioScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: pet } = usePet(id);
  const { prontuario, isLoading, refetch } = useProntuario(id);

  const handleGeneratePdf = useCallback(() => {
    router.push(`/pet/${id}/prontuario-pdf`);
  }, [id, router]);

  const handleQr = useCallback(() => {
    router.push(`/pet/${id}/prontuario-qr`);
  }, [id, router]);

  if (isLoading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={s.loadingText}>Gerando prontuário com IA...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── Cabeçalho do pet ── */}
      <View style={s.petCard}>
        <View style={s.petRow}>
          <View style={s.petAvatar}>
            <Text style={s.petAvatarText}>{pet?.name?.[0] ?? '?'}</Text>
          </View>
          <View style={s.petInfo}>
            <Text style={s.petName}>{pet?.name}</Text>
            <Text style={s.petSub}>
              {pet?.breed} · {pet?.sex === 'female' ? 'Fêmea' : 'Macho'} · {prontuario?.age_label}
            </Text>
            <View style={s.badgeRow}>
              {prontuario?.is_neutered && (
                <View style={[s.badge, s.badgeGreen]}>
                  <Text style={s.badgeTextGreen}>castrado(a)</Text>
                </View>
              )}
              {prontuario?.weight_kg && (
                <View style={[s.badge, s.badgeBlue]}>
                  <Text style={s.badgeTextBlue}>{prontuario.weight_kg} kg</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        {pet?.microchip_id && (
          <>
            <View style={s.divider} />
            <View style={s.row}>
              <Text style={s.label}>Microchip</Text>
              <Text style={s.value}>{pet.microchip_id}</Text>
            </View>
          </>
        )}
      </View>

      {/* ── Resumo IA ── */}
      {prontuario?.ai_summary && (
        <View style={s.aiBox}>
          <View style={s.aiHeader}>
            <Sparkles size={rs(14)} color={colors.purple} strokeWidth={1.8} />
            <Text style={s.aiTitle}>Resumo IA · atualizado hoje</Text>
            <View style={[s.badge, s.badgePurple]}>
              <Text style={s.badgeTextPurple}>IA</Text>
            </View>
          </View>
          <Text style={s.aiText}>{prontuario.ai_summary}</Text>
        </View>
      )}

      {/* ── Alertas ── */}
      {prontuario?.alerts?.length > 0 && prontuario.alerts.map((alert, i) => (
        <View key={i} style={[s.alertBox, alert.severity === 'high' ? s.alertRed : s.alertYellow]}>
          <AlertTriangle size={rs(12)} color={alert.severity === 'high' ? colors.danger : colors.gold} strokeWidth={1.8} />
          <Text style={[s.alertText, { color: alert.severity === 'high' ? colors.danger : colors.gold }]}>
            {alert.message}
          </Text>
        </View>
      ))}

      {/* ── Vacinas ── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Syringe size={rs(14)} color={colors.accent} strokeWidth={1.8} />
          <Text style={s.sectionTitle}>Vacinas</Text>
          <View style={[s.badge, prontuario?.vaccines_status === 'ok' ? s.badgeGreen : s.badgeRed]}>
            <Text style={prontuario?.vaccines_status === 'ok' ? s.badgeTextGreen : s.badgeTextRed}>
              {prontuario?.vaccines_status === 'ok' ? 'em dia' : 'atenção'}
            </Text>
          </View>
        </View>
        {prontuario?.vaccines?.slice(0, 4).map((v, i) => (
          <View key={i} style={s.listRow}>
            <Text style={[s.listName, v.overdue && { color: colors.danger }]}>{v.name}</Text>
            <Text style={[s.listDate, v.overdue && { color: colors.danger }]}>{v.date_label}</Text>
          </View>
        ))}
        {prontuario?.vaccines?.length > 4 && (
          <TouchableOpacity onPress={() => router.push(`/pet/${id}/prontuario-vacinas`)}>
            <Text style={s.seeMore}>Ver todas ({prontuario.vaccines.length})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Medicamentos em uso ── */}
      {prontuario?.active_medications?.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Pill size={rs(14)} color={colors.accent} strokeWidth={1.8} />
            <Text style={s.sectionTitle}>Medicamentos em uso</Text>
            <View style={[s.badge, s.badgeOrange]}>
              <Text style={s.badgeTextOrange}>{prontuario.active_medications.length} ativo(s)</Text>
            </View>
          </View>
          {prontuario.active_medications.map((m, i) => (
            <View key={i} style={s.listRow}>
              <Text style={s.listName}>{m.name} · {m.dosage}</Text>
              <Text style={s.listDate}>{m.type}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Última consulta ── */}
      {prontuario?.last_consultation && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Clock size={rs(14)} color={colors.accent} strokeWidth={1.8} />
            <Text style={s.sectionTitle}>Última consulta</Text>
          </View>
          <View style={s.consultCard}>
            <Text style={s.consultDate}>{prontuario.last_consultation.date_label}</Text>
            <Text style={s.consultVet}>{prontuario.last_consultation.veterinarian}</Text>
            <Text style={s.consultReason}>{prontuario.last_consultation.reason}</Text>
            {prontuario.last_consultation.diagnosis && (
              <Text style={s.consultDiag}>{prontuario.last_consultation.diagnosis}</Text>
            )}
          </View>
        </View>
      )}

      {/* ── Alergias ── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <AlertTriangle size={rs(14)} color={colors.accent} strokeWidth={1.8} />
          <Text style={s.sectionTitle}>Alergias</Text>
        </View>
        {prontuario?.allergies?.length > 0 ? (
          prontuario.allergies.map((a, i) => (
            <View key={i} style={s.listRow}>
              <Text style={[s.listName, { color: colors.danger }]}>{a.allergen}</Text>
              <Text style={s.listDate}>{a.severity}</Text>
            </View>
          ))
        ) : (
          <View style={s.okBox}>
            <CheckCircle size={rs(12)} color={colors.success} strokeWidth={1.8} />
            <Text style={s.okText}>Sem alergias ou reações conhecidas</Text>
          </View>
        )}
      </View>

      {/* ── Ações ── */}
      <View style={s.actions}>
        <TouchableOpacity style={s.btnPrimary} onPress={handleGeneratePdf} activeOpacity={0.8}>
          <FileText size={rs(16)} color="#fff" strokeWidth={2} />
          <Text style={s.btnPrimaryText}>Gerar PDF do Prontuário</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnSecondary} onPress={handleQr} activeOpacity={0.8}>
          <QrCode size={rs(16)} color={colors.accent} strokeWidth={2} />
          <Text style={s.btnSecondaryText}>QR Emergência</Text>
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

  petCard: { backgroundColor: colors.bgCard, borderRadius: rs(16), borderWidth: 0.5, borderColor: colors.border, padding: rs(14) },
  petRow: { flexDirection: 'row', alignItems: 'center', gap: rs(12), marginBottom: rs(8) },
  petAvatar: { width: rs(46), height: rs(46), borderRadius: rs(23), backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  petAvatarText: { fontFamily: 'Sora_700Bold', fontSize: fs(18), color: colors.accent },
  petInfo: { flex: 1, gap: rs(2) },
  petName: { fontFamily: 'Sora_700Bold', fontSize: fs(15), color: colors.text },
  petSub: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textSec },
  badgeRow: { flexDirection: 'row', gap: rs(5), marginTop: rs(3) },
  divider: { height: 0.5, backgroundColor: colors.border, marginVertical: rs(8) },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: 'Sora_400Regular', fontSize: fs(9), color: colors.textDim },
  value: { fontFamily: 'Sora_500Medium', fontSize: fs(9), color: colors.text },

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

  aiBox: { backgroundColor: colors.purpleSoft, borderRadius: rs(12), borderWidth: 0.5, borderColor: colors.purpleBorder ?? colors.border, padding: rs(12) },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(6) },
  aiTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(10), color: colors.purple, flex: 1 },
  aiText: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.purpleText ?? colors.textSec, lineHeight: fs(17) },

  alertBox: { flexDirection: 'row', alignItems: 'center', gap: rs(8), borderRadius: rs(10), borderWidth: 0.5, padding: rs(10) },
  alertRed: { backgroundColor: colors.dangerSoft, borderColor: colors.dangerBorder ?? colors.danger },
  alertYellow: { backgroundColor: colors.goldSoft ?? colors.accentSoft, borderColor: colors.gold },
  alertText: { fontFamily: 'Sora_500Medium', fontSize: fs(10), flex: 1 },

  section: { backgroundColor: colors.bgCard, borderRadius: rs(14), borderWidth: 0.5, borderColor: colors.border, padding: rs(12) },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(10) },
  sectionTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.text, flex: 1 },

  listRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: rs(4), borderBottomWidth: 0.5, borderBottomColor: colors.border },
  listName: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.text, flex: 1 },
  listDate: { fontFamily: 'Sora_400Regular', fontSize: fs(9), color: colors.textDim },
  seeMore: { fontFamily: 'Sora_600SemiBold', fontSize: fs(10), color: colors.accent, textAlign: 'center', marginTop: rs(8) },

  consultCard: { gap: rs(3) },
  consultDate: { fontFamily: 'Sora_400Regular', fontSize: fs(9), color: colors.textDim },
  consultVet: { fontFamily: 'Sora_600SemiBold', fontSize: fs(11), color: colors.text },
  consultReason: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textSec },
  consultDiag: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.accent, fontStyle: 'italic' },

  okBox: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  okText: { fontFamily: 'Sora_500Medium', fontSize: fs(10), color: colors.success },

  actions: { gap: rs(10), marginTop: rs(4) },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), backgroundColor: colors.accent, borderRadius: rs(14), paddingVertical: rs(14) },
  btnPrimaryText: { fontFamily: 'Sora_700Bold', fontSize: fs(14), color: '#fff' },
  btnSecondary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), backgroundColor: colors.bgCard, borderRadius: rs(14), paddingVertical: rs(12), borderWidth: 1, borderColor: colors.accent },
  btnSecondaryText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(13), color: colors.accent },
});
