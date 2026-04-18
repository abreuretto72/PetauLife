/**
 * ProntuarioScreen — AI-generated pet medical record.
 *
 * Shows: pet identity, AI health summary, alerts, vaccines, active meds,
 * allergies, chronic conditions, last consultation.
 * Actions: Share PDF, view QR emergency card, regenerate.
 */
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  Download,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Pill,
  AlertTriangle,
  Sparkles,
  CheckCircle,
  XCircle,
  Info,
  Heart,
  Dog,
  Cat,
} from 'lucide-react-native';
import { rs, fs } from '../../../../hooks/useResponsive';
import { colors } from '../../../../constants/colors';
import { radii, spacing } from '../../../../constants/spacing';
import { usePet } from '../../../../hooks/usePets';
import { useProntuario, type ProntuarioAlert, type ProntuarioVaccine } from '../../../../hooks/useProntuario';
import { useToast } from '../../../../components/Toast';
import { Skeleton } from '../../../../components/Skeleton';
import { getErrorMessage } from '../../../../utils/errorMessages';
import { previewProntuarioPdf } from '../../../../lib/prontuarioPdf';
import { formatDate, formatAge, formatWeight } from '../../../../utils/format';
import { sexContext } from '../../../../utils/petGender';

// ── Alert icon helper ─────────────────────────────────────────────────────────

function AlertIcon({ type }: { type: ProntuarioAlert['type'] }) {
  if (type === 'critical') return <XCircle size={rs(14)} color={colors.danger} strokeWidth={2} />;
  if (type === 'warning') return <AlertTriangle size={rs(14)} color={colors.warning} strokeWidth={2} />;
  return <Info size={rs(14)} color={colors.petrol} strokeWidth={2} />;
}

function alertBg(type: ProntuarioAlert['type']): string {
  if (type === 'critical') return colors.dangerSoft;
  if (type === 'warning') return colors.warningSoft;
  return colors.petrolSoft;
}

function alertBorder(type: ProntuarioAlert['type']): string {
  if (type === 'critical') return colors.danger;
  if (type === 'warning') return colors.warning;
  return colors.petrol;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProntuarioScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();

  console.log('[ProntuarioScreen] RENDER | id:', id?.slice(-8));

  const { data: pet } = usePet(id!);
  const { prontuario, isLoading, isError, error, regenerate, isRegenerating, refetch } = useProntuario(id!);

  const [isExporting, setIsExporting] = useState(false);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleRegenerate = useCallback(async () => {
    try {
      await regenerate();
      toast(t('prontuario.regenerateSuccess'), 'success');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  }, [regenerate, toast, t]);

  const handleSharePdf = useCallback(async () => {
    if (!prontuario || !pet) return;
    setIsExporting(true);
    try {
      await previewProntuarioPdf(prontuario, pet.name, pet.avatar_url);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setIsExporting(false);
    }
  }, [prontuario, pet, toast]);

  const handleQrCode = useCallback(() => {
    router.push(`/pet/${id}/prontuario-qr` as never);
  }, [router, id]);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading || isRegenerating) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.replace(`/pet/${id}` as never)} style={s.headerBtn} activeOpacity={0.7}>
            <ChevronLeft size={rs(22)} color={colors.accent} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{t('prontuario.title', { name: pet?.name ?? '...', context: sexContext(pet?.sex) })}</Text>
          <View style={s.headerBtn} />
        </View>
        <View style={s.loadingCenter}>
          <View style={s.aiSpinner}>
            <Sparkles size={rs(28)} color={colors.purple} strokeWidth={1.8} />
          </View>
          <Text style={s.loadingTitle}>{t('prontuario.generating')}</Text>
          <Text style={s.loadingSubtitle}>{t('prontuario.generatingSubtitle', { name: pet?.name ?? '...', context: sexContext(pet?.sex) })}</Text>
          <ActivityIndicator color={colors.purple} style={{ marginTop: rs(16) }} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (isError || !prontuario) {
    const errMsg = isError
      ? ((error as any)?.message ?? (error as any)?.context?.message ?? String(error))
      : 'prontuario null after load';
    console.error('[ProntuarioScreen] ERROR STATE | pet:', id?.slice(-8), '| err:', errMsg);
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.replace(`/pet/${id}` as never)} style={s.headerBtn} activeOpacity={0.7}>
            <ChevronLeft size={rs(22)} color={colors.accent} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>{t('prontuario.title', { name: pet?.name ?? '...', context: sexContext(pet?.sex) })}</Text>
          <View style={s.headerBtn} />
        </View>
        <View style={s.loadingCenter}>
          <XCircle size={rs(40)} color={colors.danger} strokeWidth={1.5} />
          <Text style={s.loadingTitle}>{t('prontuario.errorTitle')}</Text>
          <Text style={s.loadingSubtitle}>{t('prontuario.errorSubtitle')}</Text>
          {/* DEBUG — remover após diagnóstico */}
          <Text style={{ color: colors.danger, fontSize: fs(10), marginTop: rs(8), textAlign: 'center', paddingHorizontal: rs(16) }} numberOfLines={4}>
            {errMsg}
          </Text>
          <TouchableOpacity style={s.retryBtn} onPress={() => refetch()} activeOpacity={0.8}>
            <RefreshCw size={rs(16)} color={colors.accent} strokeWidth={1.8} />
            <Text style={s.retryText}>{t('prontuario.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const vaccineStatusColor = {
    current: colors.success,
    partial: colors.warning,
    overdue: colors.danger,
    none: colors.textDim,
  }[prontuario.vaccines_status];

  const overdueVaccines = prontuario.vaccines.filter((v) => v.is_overdue);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace(`/pet/${id}` as never)} style={s.headerBtn} activeOpacity={0.7}>
          <ChevronLeft size={rs(22)} color={colors.accent} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('prontuario.title', { name: pet?.name ?? '...', context: sexContext(pet?.sex) })}</Text>
        <TouchableOpacity
          onPress={handleRegenerate}
          style={s.headerBtn}
          activeOpacity={0.7}
          disabled={isRegenerating}
        >
          <RefreshCw size={rs(18)} color={colors.accent} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={handleRefresh} tintColor={colors.accent} />
        }
      >
        {/* Pet identity card */}
        <View style={s.identityCard}>
          <View style={s.identityRow}>
            {pet?.avatar_url ? (
              <Image source={{ uri: pet.avatar_url }} style={s.petAvatar} />
            ) : (
              <View style={s.identityIconWrap}>
                {pet?.species === 'cat'
                  ? <Cat size={rs(24)} color={colors.purple} strokeWidth={1.8} />
                  : <Dog size={rs(24)} color={colors.accent} strokeWidth={1.8} />
                }
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.petName}>{pet?.name ?? '—'}</Text>
              <Text style={s.petMeta}>
                {[
                  prontuario.age_label,
                  prontuario.weight_kg ? formatWeight(prontuario.weight_kg) : null,
                  prontuario.is_neutered !== null
                    ? prontuario.is_neutered
                      ? t('prontuario.neutered')
                      : t('prontuario.notNeutered')
                    : null,
                ].filter(Boolean).join(' · ')}
              </Text>
              {prontuario.microchip && (
                <Text style={s.microchip}>Microchip: {prontuario.microchip}</Text>
              )}
            </View>
          </View>

          {/* Status badges */}
          <View style={s.badgesRow}>
            <View style={[s.badge, { backgroundColor: vaccineStatusColor + '18' }]}>
              <Syringe size={rs(11)} color={vaccineStatusColor} strokeWidth={2} />
              <Text style={[s.badgeText, { color: vaccineStatusColor }]}>
                {t(`prontuario.vaccinesStatus.${prontuario.vaccines_status}`)}
              </Text>
            </View>
            {prontuario.active_medications.length > 0 && (
              <View style={[s.badge, { backgroundColor: colors.purpleSoft }]}>
                <Pill size={rs(11)} color={colors.purple} strokeWidth={2} />
                <Text style={[s.badgeText, { color: colors.purple }]}>
                  {prontuario.active_medications.length} {t('prontuario.activeMeds')}
                </Text>
              </View>
            )}
            {prontuario.allergies.length > 0 && (
              <View style={[s.badge, { backgroundColor: colors.dangerSoft }]}>
                <AlertTriangle size={rs(11)} color={colors.danger} strokeWidth={2} />
                <Text style={[s.badgeText, { color: colors.danger }]}>
                  {prontuario.allergies.length} {t('prontuario.allergiesCount')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Alerts */}
        {prontuario.alerts.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t('prontuario.alerts').toUpperCase()}</Text>
            {prontuario.alerts.map((alert, i) => (
              <View
                key={i}
                style={[s.alertCard, { backgroundColor: alertBg(alert.type), borderLeftColor: alertBorder(alert.type) }]}
              >
                <View style={s.alertHeader}>
                  <AlertIcon type={alert.type} />
                  <Text style={[s.alertMessage, { color: alertBorder(alert.type) }]} numberOfLines={3}>
                    {alert.message}
                  </Text>
                </View>
                {alert.action ? (
                  <Text style={s.alertAction}>{alert.action}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {/* AI Summary */}
        {prontuario.ai_summary && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t('prontuario.summary').toUpperCase()}</Text>
            <View style={s.aiSummaryCard}>
              <View style={s.aiSummaryHeader}>
                <Sparkles size={rs(14)} color={colors.purple} strokeWidth={1.8} />
                <Text style={s.aiSummaryLabel}>{t('prontuario.aiAnalysis')}</Text>
              </View>
              <Text style={s.aiSummaryText}>{prontuario.ai_summary}</Text>
            </View>
          </View>
        )}

        {/* Vaccines */}
        {prontuario.vaccines.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t('health.vaccines').toUpperCase()}</Text>
            {prontuario.vaccines.map((v) => (
              <VaccineRow key={v.id} vaccine={v} t={t} />
            ))}
          </View>
        )}

        {/* Active medications */}
        {prontuario.active_medications.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t('health.medications').toUpperCase()}</Text>
            {prontuario.active_medications.map((m) => (
              <View key={m.id} style={s.listItem}>
                <View style={s.listIconWrap}>
                  <Pill size={rs(16)} color={colors.purple} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.listItemTitle}>{m.name}</Text>
                  <Text style={s.listItemSub}>
                    {[m.dosage, m.frequency].filter(Boolean).join(' · ')}
                  </Text>
                  {m.end_date ? (
                    <Text style={s.listItemDate}>
                      {t('health.to')}: {formatDate(m.end_date)}
                    </Text>
                  ) : (
                    <Text style={[s.listItemDate, { color: colors.purple }]}>
                      {t('prontuario.ongoing')}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Allergies */}
        {prontuario.allergies.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t('health.allergies').toUpperCase()}</Text>
            {prontuario.allergies.map((a) => (
              <View key={a.id} style={[s.listItem, { borderLeftColor: colors.danger, borderLeftWidth: rs(3) }]}>
                <View style={[s.listIconWrap, { backgroundColor: colors.dangerSoft }]}>
                  <AlertTriangle size={rs(16)} color={colors.danger} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.listItemTitle, { color: colors.danger }]}>{a.allergen}</Text>
                  {a.reaction ? (
                    <Text style={s.listItemSub}>{a.reaction}{a.severity ? ` · ${a.severity}` : ''}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Chronic conditions */}
        {prontuario.chronic_conditions.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t('prontuario.chronicConditions').toUpperCase()}</Text>
            <View style={s.chipsRow}>
              {prontuario.chronic_conditions.map((c, i) => (
                <View key={i} style={s.conditionChip}>
                  <Text style={s.conditionChipText}>{c}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Last consultation */}
        {prontuario.last_consultation && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>{t('prontuario.lastConsultation').toUpperCase()}</Text>
            <View style={s.listItem}>
              <View style={s.listIconWrap}>
                <Stethoscope size={rs(16)} color={colors.petrol} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.listItemTitle}>{formatDate(prontuario.last_consultation.date)}</Text>
                {prontuario.last_consultation.veterinarian && (
                  <Text style={s.listItemSub}>
                    {prontuario.last_consultation.veterinarian}
                    {prontuario.last_consultation.clinic ? ` · ${prontuario.last_consultation.clinic}` : ''}
                  </Text>
                )}
                {prontuario.last_consultation.diagnosis && (
                  <Text style={s.listItemDate}>{prontuario.last_consultation.diagnosis}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Generated at */}
        <Text style={s.generatedAt}>
          {t('prontuario.generatedAt')}: {formatDate(prontuario.generated_at)}
          {'  ·  '}{t('prontuario.aiDisclaimer')}
        </Text>

        {/* Action buttons */}
        <View style={s.actionsRow}>
          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.accent }]}
            onPress={handleSharePdf}
            activeOpacity={0.8}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Download size={rs(18)} color="#fff" strokeWidth={2} />
            )}
            <Text style={s.actionBtnText}>{t('prontuario.exportPdf')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionBtn, { backgroundColor: colors.petrol }]}
            onPress={handleQrCode}
            activeOpacity={0.8}
          >
            <QrCode size={rs(18)} color="#fff" strokeWidth={2} />
            <Text style={s.actionBtnText}>{t('prontuario.emergencyQr')}</Text>
          </TouchableOpacity>
        </View>

        {/* Manage health records link */}
        <TouchableOpacity
          style={s.manageLink}
          onPress={() => router.push(`/pet/${id}/health` as never)}
          activeOpacity={0.7}
        >
          <ShieldCheck size={rs(14)} color={colors.textDim} strokeWidth={1.8} />
          <Text style={s.manageLinkText}>{t('prontuario.manageRecords')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Vaccine row sub-component ─────────────────────────────────────────────────

function VaccineRow({ vaccine: v, t }: { vaccine: ProntuarioVaccine; t: (k: string) => string }) {
  return (
    <View style={[vr.item, v.is_overdue && vr.itemOverdue]}>
      <View style={[vr.iconWrap, { backgroundColor: v.is_overdue ? colors.dangerSoft : colors.successSoft }]}>
        {v.is_overdue
          ? <XCircle size={rs(16)} color={colors.danger} strokeWidth={1.8} />
          : <CheckCircle size={rs(16)} color={colors.success} strokeWidth={1.8} />
        }
      </View>
      <View style={{ flex: 1 }}>
        <Text style={vr.name}>{v.name}</Text>
        <Text style={vr.meta}>
          {v.date_administered ? `${t('health.vaccineDate')}: ${formatDate(v.date_administered)}` : ''}
          {v.next_due_date ? `  ·  ${t('health.vaccineNext')}: ${formatDate(v.next_due_date)}` : ''}
        </Text>
      </View>
      {v.is_overdue && (
        <View style={vr.overdueTag}>
          <Text style={vr.overdueTagText}>{t('health.overdue')}</Text>
        </View>
      )}
    </View>
  );
}

const vr = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: rs(12), padding: rs(12), marginBottom: rs(8), gap: rs(10), borderWidth: 1, borderColor: colors.border },
  itemOverdue: { borderColor: colors.danger + '40' },
  iconWrap: { width: rs(34), height: rs(34), borderRadius: rs(10), alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: 'Sora_600SemiBold', fontSize: fs(13), color: colors.text },
  meta: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.textDim, marginTop: rs(2) },
  overdueTag: { backgroundColor: colors.dangerSoft, borderRadius: rs(6), paddingHorizontal: rs(8), paddingVertical: rs(3) },
  overdueTagText: { fontFamily: 'Sora_700Bold', fontSize: fs(9), color: colors.danger },
});

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(16), paddingVertical: rs(10),
    gap: rs(12), borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerBtn: {
    width: rs(40), height: rs(40), borderRadius: rs(12),
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontFamily: 'Sora_700Bold', fontSize: fs(18), color: colors.text, textAlign: 'center' },

  scroll: { flex: 1 },
  scrollContent: { padding: rs(16), paddingBottom: rs(32) },

  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: rs(32), gap: rs(12) },
  aiSpinner: { width: rs(64), height: rs(64), borderRadius: rs(20), backgroundColor: colors.purpleSoft, alignItems: 'center', justifyContent: 'center' },
  loadingTitle: { fontFamily: 'Sora_700Bold', fontSize: fs(17), color: colors.text, textAlign: 'center' },
  loadingSubtitle: { fontFamily: 'Sora_400Regular', fontSize: fs(13), color: colors.textDim, textAlign: 'center' },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: rs(8), backgroundColor: colors.card, borderRadius: rs(12), paddingHorizontal: rs(20), paddingVertical: rs(12), borderWidth: 1, borderColor: colors.border, marginTop: rs(8) },
  retryText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(14), color: colors.accent },

  identityCard: { backgroundColor: colors.card, borderRadius: rs(18), padding: rs(16), marginBottom: rs(16), borderWidth: 1, borderColor: colors.border },
  identityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(12), marginBottom: rs(12) },
  identityIconWrap: { width: rs(56), height: rs(56), borderRadius: rs(16), backgroundColor: colors.accentGlow, alignItems: 'center', justifyContent: 'center' },
  petAvatar: { width: rs(56), height: rs(56), borderRadius: rs(16), backgroundColor: colors.card },
  petName: { fontFamily: 'Sora_700Bold', fontSize: fs(20), color: colors.text },
  petMeta: { fontFamily: 'Sora_400Regular', fontSize: fs(12), color: colors.textSec, marginTop: rs(2) },
  microchip: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.textDim, marginTop: rs(2) },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(6) },
  badge: { flexDirection: 'row', alignItems: 'center', gap: rs(4), borderRadius: rs(8), paddingHorizontal: rs(8), paddingVertical: rs(4) },
  badgeText: { fontFamily: 'Sora_700Bold', fontSize: fs(10) },

  section: { marginBottom: rs(20) },
  sectionTitle: { fontFamily: 'Sora_700Bold', fontSize: fs(10), color: colors.textDim, letterSpacing: 1.5, marginBottom: rs(10) },

  alertCard: { borderLeftWidth: rs(3), borderRadius: rs(10), padding: rs(12), marginBottom: rs(8) },
  alertHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(8) },
  alertMessage: { flex: 1, fontFamily: 'Sora_600SemiBold', fontSize: fs(13) },
  alertAction: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.textDim, marginTop: rs(4), marginLeft: rs(22) },

  aiSummaryCard: { backgroundColor: colors.purpleSoft, borderRadius: rs(14), padding: rs(14), borderWidth: 1, borderColor: colors.purple + '30' },
  aiSummaryHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(8) },
  aiSummaryLabel: { fontFamily: 'Sora_600SemiBold', fontSize: fs(11), color: colors.purple },
  aiSummaryText: { fontFamily: 'Sora_400Regular', fontSize: fs(13), color: colors.text, lineHeight: fs(13) * 1.6 },

  listItem: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.card, borderRadius: rs(12), padding: rs(12), marginBottom: rs(8), gap: rs(10), borderWidth: 1, borderColor: colors.border },
  listIconWrap: { width: rs(34), height: rs(34), borderRadius: rs(10), backgroundColor: colors.petrolSoft, alignItems: 'center', justifyContent: 'center' },
  listItemTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(13), color: colors.text },
  listItemSub: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.textDim, marginTop: rs(2) },
  listItemDate: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textDim, marginTop: rs(2) },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  conditionChip: { backgroundColor: colors.dangerSoft, borderRadius: rs(10), paddingHorizontal: rs(12), paddingVertical: rs(6) },
  conditionChipText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.danger },

  generatedAt: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textDim, textAlign: 'center', marginTop: rs(8), marginBottom: rs(20) },

  actionsRow: { flexDirection: 'row', gap: rs(12) },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8), borderRadius: rs(14), paddingVertical: rs(14) },
  actionBtnText: { fontFamily: 'Sora_700Bold', fontSize: fs(14), color: '#fff' },

  manageLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6), marginTop: rs(20), marginBottom: rs(8) },
  manageLinkText: { fontFamily: 'Sora_400Regular', fontSize: fs(12), color: colors.textDim },
});
