/**
 * ProntuarioQrScreen.jsx
 * QR Code de emergência — acesso sem login para veterinários
 * Rota: app/(app)/pet/[id]/prontuario-qr.tsx
 */

import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Share,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { AlertTriangle, CheckCircle, Share2 } from 'lucide-react-native';
import { colors } from '../../../../constants/colors';
import { rs, fs } from '../../../../hooks/useResponsive';
import { useProntuario } from '../../../../hooks/useProntuario';
import { usePet } from '../../../../hooks/usePets';

export default function ProntuarioQrScreen() {
  const { id } = useLocalSearchParams();
  const { data: pet } = usePet(id);
  const { prontuario } = useProntuario(id);

  // URL pública do prontuário de emergência (sem login)
  const qrUrl = `https://auexpert.app/emergency/${prontuario?.emergency_token ?? id}`;

  const handleShare = async () => {
    await Share.share({
      message: `Prontuário de emergência de ${pet?.name}: ${qrUrl}`,
      url: qrUrl,
    });
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

      {/* ── QR Code ── */}
      <View style={s.qrCard}>
        <Text style={s.qrLabel}>Escaneie para ver o status de {pet?.name}</Text>
        <View style={s.qrBox}>
          <QRCode
            value={qrUrl}
            size={rs(140)}
            backgroundColor="transparent"
            color={colors.text}
          />
        </View>
        <Text style={s.qrSub}>Atualizado automaticamente · sem senha</Text>
      </View>

      {/* ── O que o vet vê ── */}
      <Text style={s.sectionLabel}>O veterinário vê ao escanear:</Text>

      {/* Identidade */}
      <View style={s.card}>
        <View style={s.petRow}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{pet?.name?.[0]}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.petName}>{pet?.name} · {pet?.breed} · {prontuario?.weight_kg}kg</Text>
            <Text style={s.petSub}>Tutor: {prontuario?.tutor_name} · {prontuario?.tutor_phone}</Text>
          </View>
        </View>
      </View>

      {/* Alertas ativos */}
      {prontuario?.alerts?.length > 0 ? (
        <View style={s.alertBox}>
          <View style={s.alertHeader}>
            <AlertTriangle size={rs(12)} color={colors.danger} strokeWidth={1.8} />
            <Text style={s.alertTitle}>Alertas ativos</Text>
            <View style={s.alertBadge}>
              <Text style={s.alertBadgeText}>{prontuario.alerts.length}</Text>
            </View>
          </View>
          {prontuario.alerts.map((a, i) => (
            <View key={i} style={s.alertRow}>
              <View style={s.dotRed} />
              <Text style={s.alertText}>{a.message}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={s.okBox}>
          <CheckCircle size={rs(12)} color={colors.success} strokeWidth={1.8} />
          <Text style={s.okText}>Sem alertas ativos</Text>
        </View>
      )}

      {/* Alergias */}
      {prontuario?.allergies?.length > 0 ? (
        <View style={[s.alertBox, { borderColor: colors.danger }]}>
          <Text style={[s.alertTitle, { color: colors.danger }]}>Alergias conhecidas</Text>
          {prontuario.allergies.map((a, i) => (
            <View key={i} style={s.alertRow}>
              <View style={s.dotRed} />
              <Text style={[s.alertText, { color: colors.danger }]}>{a.allergen} · {a.severity}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={s.okBox}>
          <CheckCircle size={rs(12)} color={colors.success} strokeWidth={1.8} />
          <Text style={s.okText}>Sem alergias conhecidas</Text>
        </View>
      )}

      {/* Medicamentos */}
      {prontuario?.active_medications?.length > 0 && (
        <View style={s.warnBox}>
          <Text style={s.warnTitle}>Medicamento(s) em uso</Text>
          {prontuario.active_medications.map((m, i) => (
            <Text key={i} style={s.warnText}>{m.name} · {m.dosage}</Text>
          ))}
        </View>
      )}

      {/* Condições crônicas */}
      {prontuario?.chronic_conditions?.length > 0 ? (
        <View style={[s.alertBox]}>
          <Text style={s.alertTitle}>Condições crônicas</Text>
          {prontuario.chronic_conditions.map((c, i) => (
            <Text key={i} style={s.alertText}>{c}</Text>
          ))}
        </View>
      ) : (
        <View style={s.okBox}>
          <CheckCircle size={rs(12)} color={colors.success} strokeWidth={1.8} />
          <Text style={s.okText}>Sem condições crônicas ativas</Text>
        </View>
      )}

      {/* Vet habitual */}
      {prontuario?.usual_vet && (
        <View style={s.card}>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Vet habitual</Text>
            <Text style={s.infoValue}>{prontuario.usual_vet.name} · {prontuario.usual_vet.crmv}</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Última consulta</Text>
            <Text style={s.infoValue}>{prontuario.last_consultation?.date_label}</Text>
          </View>
        </View>
      )}

      {/* Compartilhar link */}
      <TouchableOpacity style={s.shareBtn} onPress={handleShare} activeOpacity={0.8}>
        <Share2 size={rs(16)} color={colors.accent} strokeWidth={2} />
        <Text style={s.shareBtnText}>Compartilhar link de emergência</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: rs(16), gap: rs(10), paddingBottom: rs(40) },

  qrCard: { backgroundColor: colors.bgCard, borderRadius: rs(16), borderWidth: 0.5, borderColor: colors.border, padding: rs(16), alignItems: 'center', gap: rs(10) },
  qrLabel: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.textSec, textAlign: 'center' },
  qrBox: { padding: rs(12), backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: rs(12), borderWidth: 0.5, borderColor: colors.border },
  qrSub: { fontFamily: 'Sora_400Regular', fontSize: fs(9), color: colors.textDim },

  sectionLabel: { fontFamily: 'Sora_400Regular', fontSize: fs(9), color: colors.textDim, paddingHorizontal: rs(2) },

  card: { backgroundColor: colors.bgCard, borderRadius: rs(12), borderWidth: 0.5, borderColor: colors.border, padding: rs(12) },
  petRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  avatar: { width: rs(34), height: rs(34), borderRadius: rs(17), backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Sora_700Bold', fontSize: fs(13), color: colors.accent },
  col: { flex: 1, gap: rs(2) },
  petName: { fontFamily: 'Sora_500Medium', fontSize: fs(11), color: colors.text },
  petSub: { fontFamily: 'Sora_400Regular', fontSize: fs(9), color: colors.textSec },

  alertBox: { backgroundColor: colors.dangerSoft, borderRadius: rs(10), borderWidth: 0.5, borderColor: colors.dangerBorder ?? colors.danger, padding: rs(10), gap: rs(5) },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  alertTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(10), color: colors.danger, flex: 1 },
  alertBadge: { backgroundColor: colors.danger, borderRadius: rs(10), paddingHorizontal: rs(6), paddingVertical: rs(1) },
  alertBadgeText: { fontFamily: 'Sora_700Bold', fontSize: fs(9), color: '#fff' },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  alertText: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.danger },
  dotRed: { width: rs(5), height: rs(5), borderRadius: rs(3), backgroundColor: colors.danger },

  okBox: { backgroundColor: colors.successSoft, borderRadius: rs(10), borderWidth: 0.5, borderColor: colors.successBorder ?? colors.success, padding: rs(10), flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  okText: { fontFamily: 'Sora_500Medium', fontSize: fs(10), color: colors.success },

  warnBox: { backgroundColor: colors.goldSoft ?? colors.accentSoft, borderRadius: rs(10), borderWidth: 0.5, borderColor: colors.gold, padding: rs(10), gap: rs(4) },
  warnTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(10), color: colors.gold },
  warnText: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.gold },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: rs(3) },
  infoLabel: { fontFamily: 'Sora_400Regular', fontSize: fs(9), color: colors.textDim },
  infoValue: { fontFamily: 'Sora_500Medium', fontSize: fs(10), color: colors.text },

  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), backgroundColor: colors.bgCard, borderRadius: rs(14), paddingVertical: rs(14), borderWidth: 1, borderColor: colors.accent },
  shareBtnText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(13), color: colors.accent },
});
