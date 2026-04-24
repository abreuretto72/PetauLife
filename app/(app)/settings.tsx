import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  Fingerprint,
  Info,
  ShieldCheck,
  Sparkles,
  Trash2,
  FileText,
  Shield,
  Type,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import Constants from 'expo-constants';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import { rs, fs, fsWithScale } from '../../hooks/useResponsive';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useToast } from '../../components/Toast';
import { getErrorMessage } from '../../utils/errorMessages';
import { useConsent } from '../../hooks/useConsent';
import { supabase } from '../../lib/supabase';
import { withTimeout } from '../../lib/withTimeout';
import PdfActionModal from '../../components/pdf/PdfActionModal';
import { previewPreferencesPdf, sharePreferencesPdf } from '../../lib/preferencesPdf';
import { usePreferencesStore, FONT_SCALE_OPTIONS, ADVANCE_OPTIONS_LONG, ADVANCE_OPTIONS_MID, ADVANCE_OPTIONS_SHORT } from '../../stores/usePreferencesStore';

type ConfirmOptions = {
  text: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  yesLabel?: string;
  noLabel?: string;
};

export default function SettingsScreen() {
  const { t } = useTranslation();
  const fontScale = usePreferencesStore((s) => s.fontScale);
  const setFontScale = usePreferencesStore((s) => s.setFontScale);
  const notifAdvanceLong = usePreferencesStore((s) => s.notifAdvanceLong);
  const notifAdvanceMid = usePreferencesStore((s) => s.notifAdvanceMid);
  const notifAdvanceShort = usePreferencesStore((s) => s.notifAdvanceShort);
  const setNotifAdvanceLong = usePreferencesStore((s) => s.setNotifAdvanceLong);
  const setNotifAdvanceMid = usePreferencesStore((s) => s.setNotifAdvanceMid);
  const setNotifAdvanceShort = usePreferencesStore((s) => s.setNotifAdvanceShort);

  // Versão exibida — sempre reflete o build atual via expo-constants.
  // Em dev (Expo Go) usa expoConfig; em builds nativos pega do manifest2.
  const _cfg = Constants.expoConfig ?? Constants.manifest2?.extra?.expoClient ?? null;
  const _version = (_cfg && 'version' in _cfg ? _cfg.version : null) ?? '—';
  const _build =
    (_cfg as { ios?: { buildNumber?: string } })?.ios?.buildNumber ??
    (_cfg as { android?: { versionCode?: number } })?.android?.versionCode?.toString() ??
    null;
  const versionDisplay = _build ? `${_version} (${_build})` : _version;
  const router = useRouter();
  const { toast, confirm } = useToast();
  const [pdfModal, setPdfModal] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const notificationsEnabled = useUIStore((s) => s.notificationsEnabled);
  const biometricEnabled = useUIStore((s) => s.biometricEnabled);
  const setNotificationsEnabled = useUIStore((s) => s.setNotificationsEnabled);
  const setBiometricEnabled = useUIStore((s) => s.setBiometricEnabled);
  const { granted: aiTrainingGranted, setConsent: setAiTraining, isUpdating: aiTrainingUpdating } = useConsent('ai_training_anonymous');

  const handleLogout = async () => {
    const yes = await confirm({
      text: t('settings.logoutConfirm'),
      type: 'warning',
      yesLabel: t('settings.logout'),
      noLabel: t('common.cancel'),
    });
    if (!yes) return;

    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  const handleDeleteAccount = async () => {
    const yes = await confirm({
      text: t('settings.deleteConfirm'),
      type: 'error',
      yesLabel: t('settings.deleteAccount'),
      noLabel: t('common.cancel'),
    });
    if (!yes) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No session');

      const { error } = await withTimeout(
        supabase.functions.invoke('delete-account', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        15_000,
        'delete-account',
      );
      if (error) throw error;

      await logout();
      router.replace('/(auth)/login');
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={rs(22)} color={colors.click} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setPdfModal(true)}
          activeOpacity={0.7}
        >
          <FileText size={rs(20)} color={colors.click} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Notificações */}
        <Text style={styles.sectionLabel}>{t('settings.notifications').toUpperCase()}</Text>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Bell size={rs(20)} color={colors.click} strokeWidth={1.8} />
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleLabel}>{t('settings.notifications')}</Text>
                <Text style={styles.toggleDesc}>{t('settings.notificationsDesc')}</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.click + '50' }}
              thumbColor={notificationsEnabled ? colors.click : colors.textDim}
            />
          </View>
        </View>

        {/* Antecedência dos avisos — aplica a todo compromisso */}
        {notificationsEnabled && (
          <>
            <Text style={styles.sectionLabel}>{t('settings.notifAdvanceTitle').toUpperCase()}</Text>
            <View style={styles.card}>
              <View style={styles.textSizeHeader}>
                <Bell size={rs(20)} color={colors.click} strokeWidth={1.8} />
                <View style={styles.toggleTextCol}>
                  <Text style={styles.toggleLabel}>{t('settings.notifAdvanceTitle')}</Text>
                  <Text style={styles.toggleDesc}>{t('settings.notifAdvanceDesc')}</Text>
                </View>
              </View>

              {/* 1º aviso */}
              <Text style={[styles.toggleDesc, { marginTop: rs(spacing.md), marginBottom: rs(spacing.xs) }]}>
                {t('settings.notifAdvance1')}
              </Text>
              <View style={styles.textSizeRow}>
                {ADVANCE_OPTIONS_LONG.map((opt) => {
                  const selected = notifAdvanceLong === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.textSizeChip,
                        selected ? styles.textSizeChipActive : styles.textSizeChipIdle,
                      ]}
                      onPress={() => setNotifAdvanceLong(opt.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.textSizeChipLabel,
                          selected ? styles.textSizeChipLabelActive : styles.textSizeChipLabelIdle,
                        ]}
                      >
                        {t('settings.advance_' + opt.key)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 2º aviso */}
              <Text style={[styles.toggleDesc, { marginTop: rs(spacing.md), marginBottom: rs(spacing.xs) }]}>
                {t('settings.notifAdvance2')}
              </Text>
              <View style={styles.textSizeRow}>
                {ADVANCE_OPTIONS_MID.map((opt) => {
                  const selected = notifAdvanceMid === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.textSizeChip,
                        selected ? styles.textSizeChipActive : styles.textSizeChipIdle,
                      ]}
                      onPress={() => setNotifAdvanceMid(opt.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.textSizeChipLabel,
                          selected ? styles.textSizeChipLabelActive : styles.textSizeChipLabelIdle,
                        ]}
                      >
                        {t('settings.advance_' + opt.key)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 3º aviso */}
              <Text style={[styles.toggleDesc, { marginTop: rs(spacing.md), marginBottom: rs(spacing.xs) }]}>
                {t('settings.notifAdvance3')}
              </Text>
              <View style={styles.textSizeRow}>
                {ADVANCE_OPTIONS_SHORT.map((opt) => {
                  const selected = notifAdvanceShort === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.textSizeChip,
                        selected ? styles.textSizeChipActive : styles.textSizeChipIdle,
                      ]}
                      onPress={() => setNotifAdvanceShort(opt.value)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.textSizeChipLabel,
                          selected ? styles.textSizeChipLabelActive : styles.textSizeChipLabelIdle,
                        ]}
                      >
                        {t('settings.advance_' + opt.key)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* Biometria */}
        <Text style={styles.sectionLabel}>{t('settings.biometric').toUpperCase()}</Text>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Fingerprint size={rs(20)} color={colors.click} strokeWidth={1.8} />
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleLabel}>{t('settings.biometric')}</Text>
                <Text style={styles.toggleDesc}>{t('settings.biometricDesc')}</Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: colors.border, true: colors.click + '50' }}
              thumbColor={biometricEnabled ? colors.click : colors.textDim}
            />
          </View>
        </View>

        {/* Tamanho do texto — acessibilidade */}
        <Text style={styles.sectionLabel}>{t('settings.textSize').toUpperCase()}</Text>
        <View style={styles.card}>
          <View style={styles.textSizeHeader}>
            <Type size={rs(20)} color={colors.click} strokeWidth={1.8} />
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>{t('settings.textSize')}</Text>
              <Text style={styles.toggleDesc}>{t('settings.textSizeDesc')}</Text>
            </View>
          </View>

          <View style={styles.textSizeRow}>
            {FONT_SCALE_OPTIONS.map((opt) => {
              const selected = fontScale === opt.value;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.textSizeChip,
                    selected ? styles.textSizeChipActive : styles.textSizeChipIdle,
                  ]}
                  onPress={() => setFontScale(opt.value)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.textSizeChipLabel,
                      selected ? styles.textSizeChipLabelActive : styles.textSizeChipLabelIdle,
                    ]}
                  >
                    {t('settings.textSize_' + opt.key)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.textSizePreview}>
            <Text style={styles.textSizePreviewLabel}>{t('settings.textSizePreview').toUpperCase()}</Text>
            <Text
              style={[
                styles.textSizePreviewText,
                {
                  fontSize: fsWithScale(15, fontScale),
                  lineHeight: fsWithScale(23, fontScale),
                },
              ]}
            >
              {t('settings.textSizePreviewSample')}
            </Text>
          </View>
        </View>

        {/* Privacidade */}
        <Text style={styles.sectionLabel}>{t('settings.privacy').toUpperCase()}</Text>
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Sparkles size={rs(20)} color={colors.purple} strokeWidth={1.8} />
              <View style={styles.toggleTextCol}>
                <Text style={styles.toggleLabel}>{t('settings.aiTraining')}</Text>
                <Text style={styles.toggleDesc}>{t('settings.aiTrainingDesc')}</Text>
              </View>
            </View>
            <Switch
              value={aiTrainingGranted}
              disabled={aiTrainingUpdating}
              onValueChange={(val) => setAiTraining(val).catch(() => {})}
              trackColor={{ false: colors.border, true: colors.purple + '50' }}
              thumbColor={aiTrainingGranted ? colors.purple : colors.textDim}
            />
          </View>
          <View style={styles.consentNote}>
            <ShieldCheck size={rs(12)} color={colors.textDim} strokeWidth={1.8} />
            <Text style={styles.consentNoteText}>{t('settings.aiTrainingNote')}</Text>
          </View>
        </View>

        {/* Legal */}
        <Text style={styles.sectionLabel}>{t('settings.legal').toUpperCase()}</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://abreuretto72.github.io/auExpert/legal/terms.html')}
            activeOpacity={0.7}
          >
            <FileText size={rs(20)} color={colors.click} strokeWidth={1.8} />
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>{t('menu.terms')}</Text>
              <Text style={styles.toggleDesc}>{t('menu.termsDesc')}</Text>
            </View>
            <ChevronRight size={rs(18)} color={colors.textDim} strokeWidth={1.8} />
          </TouchableOpacity>
          <View style={styles.linkDivider} />
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => Linking.openURL('https://abreuretto72.github.io/auExpert/legal/privacy.html')}
            activeOpacity={0.7}
          >
            <Shield size={rs(20)} color={colors.click} strokeWidth={1.8} />
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleLabel}>{t('menu.privacy')}</Text>
              <Text style={styles.toggleDesc}>{t('menu.privacyDesc')}</Text>
            </View>
            <ChevronRight size={rs(18)} color={colors.textDim} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        {/* Sobre */}
        <Text style={styles.sectionLabel}>{t('settings.about').toUpperCase()}</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Info size={rs(18)} color={colors.petrol} strokeWidth={1.8} />
            <Text style={styles.infoLabel}>{t('settings.version')}</Text>
            <Text style={styles.infoValue}>{versionDisplay}</Text>
          </View>
        </View>

        {/* Zona de perigo */}
        <Text style={[styles.sectionLabel, { color: colors.danger }]}>
          {t('settings.dangerZone').toUpperCase()}
        </Text>
        <View style={[styles.card, styles.dangerCard]}>
          <TouchableOpacity style={styles.dangerRow} onPress={handleDeleteAccount} activeOpacity={0.7}>
            <Trash2 size={rs(20)} color={colors.danger} strokeWidth={1.8} />
            <View style={styles.toggleTextCol}>
              <Text style={[styles.toggleLabel, { color: colors.danger }]}>{t('settings.deleteAccount')}</Text>
              <Text style={styles.toggleDesc}>{t('settings.deleteAccountDesc')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <PdfActionModal
        visible={pdfModal}
        onClose={() => setPdfModal(false)}
        title={t('settings.preferencesPdfTitle', { defaultValue: 'Preferências do App' })}
        subtitle={t('settings.preferencesPdfSubtitle', { defaultValue: 'Configurações do dispositivo' })}
        onPreview={() => previewPreferencesPdf({ notificationsEnabled, biometricEnabled, aiTrainingGranted: aiTrainingGranted ?? false })}
        onShare={() => sharePreferencesPdf({ notificationsEnabled, biometricEnabled, aiTrainingGranted: aiTrainingGranted ?? false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(16), paddingVertical: rs(8), gap: rs(12) },
  backBtn: { width: rs(40), height: rs(40), borderRadius: rs(radii.lg), backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: 'Sora_700Bold', fontSize: fs(18), color: colors.text },
  content: { paddingHorizontal: rs(20) },
  sectionLabel: { fontFamily: 'Sora_700Bold', fontSize: fs(11), color: colors.textGhost, letterSpacing: 2, marginTop: rs(spacing.lg), marginBottom: rs(spacing.sm) },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: rs(radii.card), padding: rs(spacing.md), marginBottom: rs(spacing.sm) },
  dangerCard: { borderColor: colors.danger + '30' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleInfo: { flexDirection: 'row', alignItems: 'center', gap: rs(spacing.sm), flex: 1 },
  toggleTextCol: { flex: 1 },
  toggleLabel: { fontFamily: 'Sora_600SemiBold', fontSize: fs(14), color: colors.text },
  toggleDesc: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.textDim, marginTop: rs(2) },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: rs(spacing.sm) },
  infoLabel: { fontFamily: 'Sora_500Medium', fontSize: fs(14), color: colors.textSec, flex: 1 },
  infoValue: { fontFamily: 'JetBrainsMono_500Medium', fontSize: fs(13), color: colors.textDim },
  dangerRow: { flexDirection: 'row', alignItems: 'center', gap: rs(spacing.sm) },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: rs(spacing.sm), paddingVertical: rs(spacing.xs) },
  linkDivider: { height: 1, backgroundColor: colors.border, marginVertical: rs(spacing.sm) },
  consentNote: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(6), marginTop: rs(10), paddingTop: rs(10), borderTopWidth: 1, borderTopColor: colors.border },
  consentNoteText: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textDim, flex: 1, lineHeight: fs(15) },
  bottomSpacer: { height: rs(40) },
  textSizeHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(spacing.sm), marginBottom: rs(spacing.md) },
  textSizeRow: { flexDirection: 'row', gap: rs(8), marginBottom: rs(spacing.md) },
  textSizeChip: { flex: 1, paddingVertical: rs(10), paddingHorizontal: rs(6), borderRadius: rs(radii.lg), alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  textSizeChipActive: { backgroundColor: colors.click, borderColor: colors.click },
  textSizeChipIdle: { backgroundColor: 'transparent', borderColor: colors.border },
  textSizeChipLabel: { fontFamily: 'Sora_600SemiBold', fontSize: fs(11), letterSpacing: 0.3 },
  textSizeChipLabelActive: { color: '#FFFFFF' },
  textSizeChipLabelIdle: { color: colors.textSec },
  textSizePreview: { paddingTop: rs(spacing.md), borderTopWidth: 1, borderTopColor: colors.border, gap: rs(6) },
  textSizePreviewLabel: { fontFamily: 'Sora_700Bold', fontSize: fs(10), color: colors.textDim, letterSpacing: 1.2 },
  textSizePreviewText: { fontFamily: 'Sora_400Regular', fontSize: fs(15), color: colors.text, lineHeight: fs(23) },
});
