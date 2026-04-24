import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  Cat,
  ChevronDown,
  Dog,
  Eye,
  EyeOff,
  Lock,
  Trash2,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import { rs, fs } from '../../hooks/useResponsive';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../components/Toast';
import { getErrorMessage } from '../../utils/errorMessages';
import { usePets } from '../../hooks/usePets';
import { supabase } from '../../lib/supabase';
import { withTimeout } from '../../lib/withTimeout';

export default function DangerZoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast, confirm } = useToast();
  const qc = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const currentUser = useAuthStore((s) => s.user);
  const { pets } = usePets();

  const [selectedPetForDelete, setSelectedPetForDelete] = useState<string | null>(null);
  const [deletePetPassword, setDeletePetPassword] = useState('');
  const [isDeletingPet, setIsDeletingPet] = useState(false);
  const [petPickerOpen, setPetPickerOpen] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeletePet = async () => {
    if (!selectedPetForDelete || !deletePetPassword.trim()) return;

    const pet = pets.find((p) => p.id === selectedPetForDelete);
    if (!pet) return;

    const yes = await confirm({
      text: t('settings.deletePetConfirm', { name: pet.name }),
      type: 'error',
      yesLabel: t('settings.deletePet'),
      noLabel: t('common.cancel'),
    });
    if (!yes) return;

    setIsDeletingPet(true);
    console.log('[deletePet] START petId:', selectedPetForDelete, 'petName:', pet.name);
    try {
      console.log('[deletePet] calling signInWithPassword email:', currentUser?.email);
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: currentUser?.email ?? '',
        password: deletePetPassword,
      });
      console.log('[deletePet] signInWithPassword result authError:', authError?.message ?? 'null');
      if (authError) {
        setDeletePetPassword('');
        setIsDeletingPet(false);
        toast(t('settings.wrongPassword'), 'error');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      console.log('[deletePet] getSession token:', session?.access_token ? session.access_token.slice(0, 20) + '...' : 'NULL');
      if (!session?.access_token) throw new Error('No session');

      console.log('[deletePet] calling edge function delete-pet...');
      const { data: fnData, error } = await withTimeout(
        supabase.functions.invoke('delete-pet', {
          body: { pet_id: selectedPetForDelete },
          headers: { Authorization: `Bearer ${session.access_token}` },
        }),
        15_000,
        'delete-pet',
      );
      const httpStatus = (error as any)?.context?.status ?? 'n/a';
      let httpBody: unknown = null;
      try { httpBody = await (error as any)?.context?.json(); } catch { /* body not JSON */ }
      console.log('[deletePet] edge fn result | data:', JSON.stringify(fnData), '| httpStatus:', httpStatus, '| httpBody:', JSON.stringify(httpBody), '| sdkError:', error?.message ?? 'null');
      if (error) throw error;

      console.log('[deletePet] invalidating pets cache...');
      await qc.invalidateQueries({ queryKey: ['pets'] });
      toast(t('settings.deletePetSuccess', { name: pet.name }), 'success');
      setSelectedPetForDelete(null);
      setDeletePetPassword('');
      setPetPickerOpen(false);
      console.log('[deletePet] SUCCESS');
    } catch (err) {
      console.error('[deletePet] CATCH err:', err);
      toast(getErrorMessage(err), 'error');
    } finally {
      setIsDeletingPet(false);
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

    setIsDeletingAccount(true);
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
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const canDelete = !!selectedPetForDelete && deletePetPassword.trim().length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <AlertTriangle size={rs(20)} color={colors.danger} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.dangerZone')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Warning banner */}
        <View style={styles.warningBanner}>
          <AlertTriangle size={rs(16)} color={colors.danger} strokeWidth={2} />
          <Text style={styles.warningText}>{t('settings.dangerZoneWarning')}</Text>
        </View>

        {/* Excluir Pet */}
        <Text style={styles.sectionLabel}>{t('settings.deletePet').toUpperCase()}</Text>
        <View style={styles.dangerCard}>
          <View style={styles.cardHeader}>
            <Trash2 size={rs(18)} color={colors.danger} strokeWidth={1.8} />
            <View style={styles.cardTextCol}>
              <Text style={styles.cardTitle}>{t('settings.deletePet')}</Text>
              <Text style={styles.cardDesc}>{t('settings.deletePetDesc')}</Text>
            </View>
          </View>

          {/* Pet dropdown */}
          <TouchableOpacity
            style={styles.pickerTrigger}
            onPress={() => setPetPickerOpen(!petPickerOpen)}
            activeOpacity={0.7}
          >
            {selectedPetForDelete ? (
              <View style={styles.pickerSelectedRow}>
                {pets.find((p) => p.id === selectedPetForDelete)?.species === 'cat'
                  ? <Cat size={rs(14)} color={colors.danger} strokeWidth={1.8} />
                  : <Dog size={rs(14)} color={colors.danger} strokeWidth={1.8} />
                }
                <Text style={styles.pickerSelectedText}>
                  {pets.find((p) => p.id === selectedPetForDelete)?.name}
                </Text>
              </View>
            ) : (
              <Text style={styles.pickerPlaceholder}>{t('settings.deletePetSelect')}</Text>
            )}
            <ChevronDown
              size={rs(16)}
              color={colors.textDim}
              strokeWidth={1.8}
              style={petPickerOpen ? styles.chevronUp : undefined}
            />
          </TouchableOpacity>

          {petPickerOpen && (
            <View style={styles.pickerList}>
              {pets.map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={[
                    styles.pickerItem,
                    selectedPetForDelete === pet.id && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setSelectedPetForDelete(pet.id);
                    setPetPickerOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  {pet.species === 'cat'
                    ? <Cat size={rs(14)} color={selectedPetForDelete === pet.id ? colors.danger : colors.textSec} strokeWidth={1.8} />
                    : <Dog size={rs(14)} color={selectedPetForDelete === pet.id ? colors.danger : colors.textSec} strokeWidth={1.8} />
                  }
                  <Text style={[
                    styles.pickerItemText,
                    selectedPetForDelete === pet.id && { color: colors.danger },
                  ]}>
                    {pet.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Password field */}
          <View style={styles.passwordRow}>
            <Lock size={rs(14)} color={colors.textDim} strokeWidth={1.8} />
            <TextInput
              style={styles.passwordInput}
              value={deletePetPassword}
              onChangeText={setDeletePetPassword}
              placeholder={t('settings.deletePetPasswordHint')}
              placeholderTextColor={colors.placeholder}
              secureTextEntry={!showDeletePassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowDeletePassword(!showDeletePassword)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {showDeletePassword
                ? <EyeOff size={rs(14)} color={colors.textDim} strokeWidth={1.8} />
                : <Eye size={rs(14)} color={colors.textDim} strokeWidth={1.8} />
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.actionBtn, !canDelete && styles.actionBtnDisabled]}
            onPress={handleDeletePet}
            disabled={!canDelete || isDeletingPet}
            activeOpacity={0.7}
          >
            {isDeletingPet
              ? <ActivityIndicator size="small" color={canDelete ? colors.danger : colors.textDim} />
              : <Trash2 size={rs(14)} color={canDelete ? colors.danger : colors.textDim} strokeWidth={1.8} />
            }
            <Text style={[styles.actionBtnText, !canDelete && { color: colors.textDim }]}>
              {t('settings.deletePet')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Excluir Conta */}
        <Text style={[styles.sectionLabel, { marginTop: rs(spacing.xl) }]}>
          {t('settings.deleteAccount').toUpperCase()}
        </Text>
        <View style={styles.dangerCard}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={handleDeleteAccount}
            disabled={isDeletingAccount}
            activeOpacity={0.7}
          >
            {isDeletingAccount
              ? <ActivityIndicator size="small" color={colors.danger} />
              : <Trash2 size={rs(18)} color={colors.danger} strokeWidth={1.8} />
            }
            <View style={styles.cardTextCol}>
              <Text style={styles.cardTitle}>{t('settings.deleteAccount')}</Text>
              <Text style={styles.cardDesc}>{t('settings.deleteAccountDesc')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rs(16), paddingVertical: rs(8), gap: rs(12) },
  backBtn: { width: rs(40), height: rs(40), borderRadius: rs(radii.lg), backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: 'Sora_700Bold', fontSize: fs(18), color: colors.danger },
  content: { paddingHorizontal: rs(20) },
  warningBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(10), backgroundColor: colors.danger + '12', borderWidth: 1, borderColor: colors.danger + '30', borderRadius: rs(radii.lg), padding: rs(14), marginTop: rs(spacing.md) },
  warningText: { flex: 1, fontFamily: 'Sora_400Regular', fontSize: fs(12), color: colors.danger, lineHeight: fs(18) },
  sectionLabel: { fontFamily: 'Sora_700Bold', fontSize: fs(11), color: colors.danger + 'aa', letterSpacing: 2, marginTop: rs(spacing.xl), marginBottom: rs(spacing.sm) },
  dangerCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.danger + '30', borderRadius: rs(radii.card), padding: rs(spacing.md) },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(spacing.sm) },
  cardTextCol: { flex: 1 },
  cardTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(14), color: colors.danger },
  cardDesc: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.textDim, marginTop: rs(2) },
  pickerTrigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: rs(14), backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.danger + '30', borderRadius: rs(radii.lg), paddingHorizontal: rs(12), paddingVertical: rs(10) },
  pickerSelectedRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  pickerSelectedText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(13), color: colors.danger },
  pickerPlaceholder: { fontFamily: 'Sora_400Regular', fontSize: fs(13), color: colors.textDim },
  chevronUp: { transform: [{ rotate: '180deg' }] },
  pickerList: { marginTop: rs(4), backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.danger + '25', borderRadius: rs(radii.lg), overflow: 'hidden' },
  pickerItem: { flexDirection: 'row', alignItems: 'center', gap: rs(8), paddingHorizontal: rs(12), paddingVertical: rs(10), borderBottomWidth: 1, borderBottomColor: colors.border },
  pickerItemActive: { backgroundColor: colors.danger + '10' },
  pickerItemText: { fontFamily: 'Sora_500Medium', fontSize: fs(13), color: colors.textSec },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginTop: rs(10), backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.danger + '30', borderRadius: rs(radii.lg), paddingHorizontal: rs(12), height: rs(44) },
  passwordInput: { flex: 1, fontFamily: 'Sora_400Regular', fontSize: fs(13), color: colors.text },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6), marginTop: rs(12), borderWidth: 1, borderColor: colors.danger + '50', borderRadius: rs(radii.lg), paddingVertical: rs(10) },
  actionBtnDisabled: { borderColor: colors.border },
  actionBtnText: { fontFamily: 'Sora_700Bold', fontSize: fs(13), color: colors.danger },
  bottomSpacer: { height: rs(40) },
});
