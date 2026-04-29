/**
 * /professional/agents/alta — Agente IA #7: Relatório de Alta para o tutor.
 *
 * Recebe pet_id + prontuario_id (via query string). Sem persistência —
 * o relatório é uma vista derivada que pode ser exportada em PDF (Wave 3).
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, Sparkles, AlertTriangle, Heart, Home, Calendar,
  AlertCircle, Phone, History,
} from 'lucide-react-native';

import { colors } from '../../../../constants/colors';
import { radii, spacing } from '../../../../constants/spacing';
import { rs, fs } from '../../../../hooks/useResponsive';
import { useToast } from '../../../../components/Toast';
import { useProAgent, type RelatorioAltaResponse } from '../../../../hooks/useProAgent';
import { AgentHistorySheet, ALTA_HISTORY } from '../../../../components/professional/AgentHistorySheet';
import { supabase } from '../../../../lib/supabase';
import { getErrorMessage } from '../../../../utils/errorMessages';

export default function AltaAgentScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const { petId, prontuarioId } = useLocalSearchParams<{ petId?: string; prontuarioId?: string }>();
  const { run, isPending } = useProAgent<
    { pet_id: string; prontuario_id: string; language: string },
    RelatorioAltaResponse
  >('agent-relatorio-alta');

  const [result, setResult] = useState<RelatorioAltaResponse | null>(null);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [persistedId, setPersistedId] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!petId || !prontuarioId) return;
    try {
      const data = await run({
        pet_id: petId,
        prontuario_id: prontuarioId,
        language: i18n.language,
      });
      setResult(data);

      // Persiste — relatório de alta é instrução pro tutor cuidar em casa,
      // ele precisa poder reler depois. Falha silenciosa (visível em logs).
      try {
        const { data: userData } = await supabase.auth.getUser();
        const profUserId = userData.user?.id;
        if (profUserId) {
          const { data: profRow } = await supabase
            .from('professionals')
            .select('id')
            .eq('user_id', profUserId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          const { data: inserted } = await supabase
            .from('relatorios_alta')
            .insert({
              pet_id: petId,
              professional_id: profRow?.id ?? null,
              prontuario_id: prontuarioId,
              diagnosis_summary: data.diagnosis_summary,
              treatment_received: data.treatment_received ?? [],
              home_care: data.home_care ?? [],
              follow_up_schedule: data.follow_up_schedule,
              red_flags: data.red_flags ?? [],
              contact_instructions: data.contact_instructions,
              language: i18n.language,
            })
            .select('id')
            .maybeSingle();
          if (inserted) setPersistedId(inserted.id);
        }
      } catch (persistErr) {
        console.warn('[alta] falha ao persistir:', persistErr);
      }
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    }
  }, [petId, prontuarioId, run, toast, i18n.language]);

  // Auto-fetch ao montar (já temos os IDs via query)
  useEffect(() => {
    if (petId && prontuarioId && !result && !isPending) {
      handleGenerate();
    }
  }, [petId, prontuarioId, result, isPending, handleGenerate]);

  if (!petId || !prontuarioId) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.errorBox}>
          <AlertTriangle size={rs(28)} color={colors.warning} strokeWidth={1.6} />
          <Text style={s.errorTxt}>
            {!petId ? t('agents.errors.missingPet') : 'Prontuário não selecionado.'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={rs(26)} color={colors.click} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('agents.alta.title')}</Text>
        <TouchableOpacity
          onPress={() => setHistoryVisible(true)}
          hitSlop={12}
          accessibilityLabel={t('agents.history.openLabel')}
        >
          <History size={rs(22)} color={colors.click} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      <AgentHistorySheet
        petId={petId}
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        config={ALTA_HISTORY}
      />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.heroCard}>
          <View style={s.heroIcon}>
            <Heart size={rs(22)} color={colors.click} strokeWidth={1.8} />
          </View>
          <Text style={s.heroTitle}>{t('agents.alta.heroTitle')}</Text>
          <Text style={s.heroDesc}>{t('agents.alta.heroDesc')}</Text>
        </View>

        {isPending && !result && (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color={colors.click} />
            <Text style={s.loadingTxt}>{t('agents.generating')}</Text>
          </View>
        )}

        {result && (
          <>
            {/* Resumo do diagnóstico */}
            {result.diagnosis_summary && (
              <Section
                icon={Sparkles}
                title={t('agents.alta.diagnosisSummary')}
                tone="click"
              >
                <Text style={s.bodyText}>{result.diagnosis_summary}</Text>
              </Section>
            )}

            {/* O que foi feito hoje */}
            {result.treatment_received.length > 0 && (
              <Section
                icon={Calendar}
                title={t('agents.alta.treatmentReceived')}
              >
                {result.treatment_received.map((item, i) => (
                  <Text key={i} style={s.bullet}>• {item}</Text>
                ))}
              </Section>
            )}

            {/* Cuidados em casa */}
            {result.home_care.length > 0 && (
              <Section icon={Home} title={t('agents.alta.homeCare')} tone="success">
                {result.home_care.map((item, i) => (
                  <Text key={i} style={s.bulletStrong}>• {item}</Text>
                ))}
              </Section>
            )}

            {/* Retorno */}
            {result.follow_up_schedule && (
              <Section icon={Calendar} title={t('agents.alta.followUp')}>
                <Text style={s.bodyText}>{result.follow_up_schedule}</Text>
              </Section>
            )}

            {/* Sinais de alerta */}
            {result.red_flags.length > 0 && (
              <Section
                icon={AlertCircle}
                title={t('agents.alta.redFlags')}
                tone="danger"
              >
                {result.red_flags.map((item, i) => (
                  <Text key={i} style={s.alertItem}>• {item}</Text>
                ))}
              </Section>
            )}

            {/* Contato */}
            {result.contact_instructions && (
              <Section icon={Phone} title={t('agents.alta.contact')}>
                <Text style={s.bodyText}>{result.contact_instructions}</Text>
              </Section>
            )}

            <TouchableOpacity
              style={[s.secondaryBtn, { marginTop: spacing.lg }]}
              onPress={handleGenerate}
              disabled={isPending}
              activeOpacity={0.7}
            >
              <Text style={s.secondaryBtnTxt}>{t('agents.regenerate')}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  icon: Icon, title, tone = 'neutral', children,
}: {
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  title: string;
  tone?: 'neutral' | 'success' | 'danger' | 'click';
  children: React.ReactNode;
}) {
  const toneColor =
    tone === 'success' ? colors.success :
    tone === 'danger' ? colors.danger :
    tone === 'click' ? colors.click :
    colors.textSec;
  return (
    <View
      style={[
        s.section,
        tone === 'danger' && s.sectionDanger,
        tone === 'success' && s.sectionSuccess,
      ]}
    >
      <View style={s.sectionHeader}>
        <Icon size={rs(16)} color={toneColor} strokeWidth={1.8} />
        <Text style={[s.sectionTitle, { color: toneColor }]}>{title}</Text>
      </View>
      <View style={s.sectionBody}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: fs(17), fontWeight: '700' },
  scroll: { padding: spacing.md, paddingBottom: rs(40) },
  errorBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: rs(12), padding: spacing.lg },
  errorTxt: { color: colors.text, fontSize: fs(13), textAlign: 'center' },

  heroCard: {
    backgroundColor: colors.clickSoft, borderWidth: 1, borderColor: colors.clickRing,
    borderRadius: radii.card, padding: rs(18), alignItems: 'center', gap: rs(8),
    marginBottom: spacing.md,
  },
  heroIcon: {
    width: rs(44), height: rs(44), borderRadius: rs(22),
    backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { color: colors.text, fontSize: fs(15), fontWeight: '700', textAlign: 'center' },
  heroDesc: { color: colors.textSec, fontSize: fs(12), textAlign: 'center', lineHeight: fs(18) },

  loadingBox: { alignItems: 'center', padding: spacing.xl, gap: rs(12) },
  loadingTxt: { color: colors.textSec, fontSize: fs(13) },

  section: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.lg, padding: rs(14), marginBottom: rs(10),
  },
  sectionDanger: { backgroundColor: colors.danger + '08', borderColor: colors.danger + '40' },
  sectionSuccess: { backgroundColor: colors.success + '08', borderColor: colors.success + '30' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(8) },
  sectionTitle: { fontSize: fs(11), fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  sectionBody: { gap: rs(6) },

  bodyText: { color: colors.text, fontSize: fs(13), lineHeight: fs(19) },
  bullet: { color: colors.text, fontSize: fs(12), lineHeight: fs(18) },
  bulletStrong: { color: colors.text, fontSize: fs(13), lineHeight: fs(19), fontWeight: '600' },
  alertItem: { color: colors.danger, fontSize: fs(12), lineHeight: fs(18), fontWeight: '600' },

  secondaryBtn: {
    paddingVertical: rs(12), borderRadius: radii.lg,
    borderWidth: 1.5, borderColor: colors.click, alignItems: 'center',
  },
  secondaryBtnTxt: { color: colors.click, fontSize: fs(13), fontWeight: '700' },
});
