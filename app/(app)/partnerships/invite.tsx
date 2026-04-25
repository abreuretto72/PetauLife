/**
 * /partnerships/invite — Form de criação de convite profissional (lado tutor).
 * ═══════════════════════════════════════════════════════════════════════════
 * Fase 2 · Bloco E · sub-passo 2.6.1
 *
 * Entrada:
 *   - FAB do Hub de Parceiros (/partnerships)
 *   - CTA do EmptyState em cada tab do Hub
 *
 * Fluxo:
 *   1. Tutor escolhe pet (chips com avatar — só lista pets dele via usePets()).
 *   2. Informa email do convidado (AI-first: mic STT ativo).
 *   3. Escolhe papel (role) — 10 opções, chips com cor semântica.
 *   4. Opcional: toggle "pode ver finanças" (só significa algo pros roles vet).
 *   5. Opcional: scope_notes — briefing livre (multiline + mic).
 *   6. Escolhe prazo do convite em dias: 1 · 7 · 14 · 30 (default 7).
 *   7. Submit → useCreateInvite → EF professional-invite-create
 *      • Sucesso: toast + router.back() pro Hub (vê convite na aba "Pendentes")
 *      • Erro: toast com mensagem mapeada (voz do pet)
 *
 * Validação: Zod inline. Email lowercase trim. Email obrigatório + regex simples.
 * Pet + role + expires_days obrigatórios. can_see_finances default false.
 *
 * Offline: o próprio hook throw 'offline_action' → mapeado pra toast.offline.
 * Sem modo rascunho — convite é síncrono; se sem rede, o tutor tenta de novo.
 * ═══════════════════════════════════════════════════════════════════════════
 */
import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, Mail, Send, Dog, Cat, Clock, Stethoscope, Scissors,
  Footprints, Bone, Hotel, Store, Heart, GraduationCap,
} from 'lucide-react-native';
import { z } from 'zod';

import { colors } from '../../../constants/colors';
import { radii, spacing } from '../../../constants/spacing';
import { rs, fs } from '../../../hooks/useResponsive';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Select, type SelectOption } from '../../../components/ui/Select';
import { useToast } from '../../../components/Toast';
import { useNetwork } from '../../../hooks/useNetwork';
import { usePets } from '../../../hooks/usePets';
import { useCreateInvite } from '../../../hooks/useTutorPartnerships';
import type { AccessRole } from '../../../types/database';

// ── Config ───────────────────────────────────────────────────────────────────

/**
 * 8 roles visíveis na UI (consolidados — vet_full/read/tech viram apenas
 * "Veterinário", mapeado pra `vet_full` no payload).
 * Memória do projeto: AccessRole simplification for MVP.
 */
const ROLES: readonly AccessRole[] = [
  'vet_full',         // mostrado como "Veterinário"
  'groomer',
  'trainer',
  'walker',
  'sitter',
  'boarding',
  'shop_employee',
  'ong_member',
] as const;

/**
 * Prazo do convite — fixo em 30 dias. Sem fricção pro tutor escolher.
 * Tutor pode revogar a qualquer momento via Hub de Parcerias.
 */
const DEFAULT_EXPIRES_DAYS = 30 as const;

/**
 * Regra de negócio (2026-04-25): NENHUM profissional vê dados financeiros
 * do tutor. O can_see_finances é sempre `false` no payload — a UI nem expõe
 * a opção. Tutores registram suas finanças e elas são ESTRITAMENTE privadas.
 */
const CAN_SEE_FINANCES_FORCED = false as const;

/** Ícone semântico por role pra ajudar identificação visual no dropdown. */
function roleIcon(role: AccessRole) {
  switch (role) {
    case 'vet_full':
    case 'vet_read':
    case 'vet_tech':       return Stethoscope;
    case 'groomer':        return Scissors;
    case 'trainer':        return GraduationCap;
    case 'walker':         return Footprints;
    case 'sitter':         return Heart;
    case 'boarding':       return Hotel;
    case 'shop_employee':  return Store;
    case 'ong_member':     return Bone;
    default:               return Stethoscope;
  }
}

// ── Schema Zod ───────────────────────────────────────────────────────────────

const inviteSchema = z.object({
  pet_id: z.string().uuid(),
  invite_email: z
    .string()
    .min(3)
    .max(254)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'invalid_email'),
  role: z.enum([
    'vet_full', 'vet_read', 'vet_tech', 'groomer', 'trainer',
    'walker', 'sitter', 'boarding', 'shop_employee', 'ong_member',
  ] as const),
  can_see_finances: z.boolean(),
  scope_notes: z.string().max(500).nullable(),
  expires_days: z.number().int().min(1).max(30),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Cor semântica por role — mesma convenção do Hub + PatientCard. */
function roleColor(role: AccessRole): string {
  switch (role) {
    case 'vet_full':
    case 'vet_read':
    case 'vet_tech':
      return colors.petrol;
    case 'trainer':
      return colors.click;
    case 'ong_member':
      return colors.rose;
    default:
      return colors.click;
  }
}

/** Mapeia erro da EF → chave i18n (voz do pet). */
function createErrorKey(code: string): string {
  switch (code) {
    case 'DUPLICATE_INVITE':   return 'partnerships.errors.duplicateInvite';
    case 'RATE_LIMIT':         return 'partnerships.errors.rateLimit';
    case 'NOT_OWNER':          return 'partnerships.errors.notOwner';
    case 'PET_NOT_FOUND':      return 'partnerships.errors.petNotFound';
    case 'INVALID_PAYLOAD':    return 'partnerships.errors.invalidPayload';
    case 'MISSING_EMAIL':      return 'partnerships.errors.missingEmail';
    case 'offline_action':     return 'partnerships.errors.offline';
    case 'not_authenticated':  return 'partnerships.errors.notAuthenticated';
    default:                   return 'partnerships.errors.generic';
  }
}

// ── Tela ─────────────────────────────────────────────────────────────────────

export default function PartnershipInviteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const { isOnline } = useNetwork();
  const { petId: presetPetId } = useLocalSearchParams<{ petId?: string }>();

  const { pets, isLoading: petsLoading } = usePets();
  const { createInvite, isCreating } = useCreateInvite();

  // ── Form state ─────────────────────────────────────────────────────────────

  const [petId, setPetId] = useState<string>(
    typeof presetPetId === 'string' ? presetPetId : '',
  );
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<AccessRole | ''>('');

  // Opções dos dropdowns (memoizadas pra não rebuildar a cada render)
  const petOptions = useMemo<SelectOption[]>(() => pets.map((p) => ({
    value: p.id,
    label: p.name,
    sublabel: p.breed ?? (p.species === 'dog' ? t('common.dog', { defaultValue: 'Cão' }) : t('common.cat', { defaultValue: 'Gato' })),
    imageUri: p.avatar_url ?? null,
    icon: p.species === 'dog' ? Dog : Cat,
    color: colors.click,
  })), [pets, t]);

  const roleOptions = useMemo<SelectOption[]>(() => ROLES.map((r) => ({
    value: r,
    label: t(`roles.${r}`, { defaultValue: r }),
    sublabel: t(`partnerships.roleDesc.${r}`, { defaultValue: '' }) || undefined,
    icon: roleIcon(r),
    color: roleColor(r),
  })), [t]);

  const canSubmit = useMemo(() => {
    if (!petId || !role || !email.trim()) return false;
    if (isCreating) return false;
    return true;
  }, [petId, role, email, isCreating]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/partnerships' as never);
  }, [router]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    const candidate = {
      pet_id: petId,
      invite_email: email.trim().toLowerCase(),
      role: role as AccessRole,
      // Regra de negócio: profissionais NUNCA acessam dados financeiros
      can_see_finances: CAN_SEE_FINANCES_FORCED,
      // Convite simplificado — sem campo de scope_notes nem prazo configurável
      scope_notes: null,
      expires_days: DEFAULT_EXPIRES_DAYS,
    };

    const parsed = inviteSchema.safeParse(candidate);
    if (!parsed.success) {
      // Emite um erro específico pra email inválido (quem mais comumente falha).
      const emailIssue = parsed.error.issues.find((i) => i.path[0] === 'invite_email');
      if (emailIssue) {
        toast(t('partnerships.errors.invalidEmail'), 'error');
      } else {
        toast(t('partnerships.errors.validation'), 'error');
      }
      return;
    }

    try {
      await createInvite(parsed.data);
      toast(t('partnerships.toast.inviteCreated'), 'success');
      handleBack();
    } catch (err) {
      const code = err instanceof Error ? err.message : 'INTERNAL';
      toast(t(createErrorKey(code)), 'error');
    }
  }, [canSubmit, petId, email, role, createInvite, toast, t, handleBack]);

  // ── Render ────────────────────────────────────────────────────────────────

  const selectedPet = pets.find((p) => p.id === petId);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <ChevronLeft size={rs(24)} color={colors.click} strokeWidth={1.8} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Send size={rs(18)} color={colors.click} strokeWidth={1.8} />
            <Text style={styles.headerTitle}>{t('partnerships.invite.title')}</Text>
          </View>
          <View style={{ width: rs(24) }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── 1. Pet ────────────────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>{t('partnerships.invite.petLabel')}</Text>
          {petsLoading ? (
            <Text style={styles.hint}>{t('common.loading')}</Text>
          ) : pets.length === 0 ? (
            <View style={styles.emptyPetsBox}>
              <Text style={styles.emptyPetsText}>{t('partnerships.invite.noPets')}</Text>
            </View>
          ) : (
            <View style={styles.field}>
              <Select
                value={petId}
                options={petOptions}
                onChange={setPetId}
                placeholder={t('partnerships.invite.petLabel')}
                sheetTitle={t('partnerships.invite.petLabel')}
              />
            </View>
          )}

          {/* ── 2. E-mail ─────────────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>{t('partnerships.invite.emailLabel')}</Text>
          <View style={styles.field}>
            <Input
              placeholder={t('partnerships.invite.emailPlaceholder')}
              value={email}
              onChangeText={setEmail}
              type="email"
              icon={<Mail size={rs(18)} color={colors.petrol} strokeWidth={1.8} />}
            />
          </View>

          {/* ── 3. Tipo de profissional ──────────────────────────────────── */}
          <Text style={styles.sectionLabel}>{t('partnerships.invite.roleLabel')}</Text>
          <View style={styles.field}>
            <Select<AccessRole>
              value={role}
              options={roleOptions as SelectOption<AccessRole>[]}
              onChange={(r) => setRole(r)}
              placeholder={t('partnerships.invite.roleLabel')}
              sheetTitle={t('partnerships.invite.roleLabel')}
            />
          </View>

          {/* ── Linha de responsabilidade do tutor ───────────────────────── */}
          <View style={styles.privacyNote}>
            <Text style={styles.privacyNoteText}>
              {t('partnerships.invite.tutorResponsibility', {
                defaultValue: 'A indicação é sua responsabilidade. O profissional só vê o pet que você indicou — não pode alterar nem excluir nada que você registrou.',
              })}
            </Text>
          </View>

          {/* ── Submit ───────────────────────────────────────────────────── */}
          <View style={styles.submitWrap}>
            <Button
              label={t('partnerships.invite.submit')}
              onPress={handleSubmit}
              disabled={!canSubmit || !isOnline}
              loading={isCreating}
              icon={<Send size={rs(16)} color="#FFFFFF" strokeWidth={2} />}
            />
            {!isOnline ? (
              <Text style={styles.offlineNote}>{t('partnerships.errors.offline')}</Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(spacing.md),
    paddingVertical: rs(spacing.sm),
    borderBottomWidth: rs(1),
    borderBottomColor: colors.border,
  },
  headerTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
  },
  headerTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: fs(16),
    color: colors.text,
  },

  scroll: {
    paddingHorizontal: rs(spacing.md),
    paddingTop: rs(spacing.md),
    paddingBottom: rs(spacing.xxl),
  },

  intro: {
    fontFamily: 'Sora_400Regular',
    fontSize: fs(13),
    color: colors.textSec,
    lineHeight: rs(20),
    marginBottom: rs(spacing.md),
  },

  // Sections
  sectionLabel: {
    fontFamily: 'Sora_700Bold',
    fontSize: fs(13),
    color: colors.text,
    marginTop: rs(spacing.md),
    marginBottom: rs(4),
    letterSpacing: rs(0.3),
  },
  required: { color: colors.click },
  hint: {
    fontFamily: 'Sora_400Regular',
    fontSize: fs(11),
    color: colors.textDim,
    lineHeight: rs(16),
    marginBottom: rs(spacing.sm),
  },
  field: { marginBottom: rs(spacing.xs) },
  privacyNote: {
    backgroundColor: colors.bgCard,
    borderRadius: rs(radii.md),
    borderLeftWidth: rs(3),
    borderLeftColor: colors.click,
    paddingHorizontal: rs(spacing.md),
    paddingVertical: rs(spacing.sm),
    marginTop: rs(spacing.sm),
    marginBottom: rs(spacing.md),
  },
  privacyNoteText: {
    fontFamily: 'Sora_400Regular',
    fontSize: fs(12),
    color: colors.textSec,
    lineHeight: fs(18),
  },

  // Pet picker
  petChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(8),
    marginBottom: rs(spacing.sm),
  },
  petChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    paddingHorizontal: rs(10),
    paddingVertical: rs(6),
    borderRadius: rs(radii.lg),
    borderWidth: rs(1.5),
    borderColor: colors.border,
    backgroundColor: colors.card,
    maxWidth: '100%',
  },
  petChipAvatar: {
    width: rs(28),
    height: rs(28),
    borderRadius: rs(10),
    borderWidth: rs(1.5),
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  petChipAvatarImg: {
    width: '100%',
    height: '100%',
  },
  petChipText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: fs(13),
    color: colors.textSec,
    maxWidth: rs(110),
  },
  emptyPetsBox: {
    padding: rs(spacing.md),
    borderRadius: rs(radii.md),
    backgroundColor: colors.bgCard,
    borderWidth: rs(1),
    borderColor: colors.border,
  },
  emptyPetsText: {
    fontFamily: 'Sora_400Regular',
    fontSize: fs(12),
    color: colors.textDim,
    textAlign: 'center',
  },

  // Role picker
  roleChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: rs(6),
    marginBottom: rs(spacing.sm),
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(5),
    paddingHorizontal: rs(10),
    paddingVertical: rs(7),
    borderRadius: rs(radii.md),
    borderWidth: rs(1.5),
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  roleChipText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: fs(11),
    color: colors.textSec,
    letterSpacing: rs(0.3),
    textTransform: 'uppercase',
  },

  // Toggle row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(12),
    padding: rs(spacing.md),
    borderRadius: rs(radii.lg),
    backgroundColor: colors.card,
    borderWidth: rs(1),
    borderColor: colors.border,
    marginTop: rs(spacing.sm),
  },
  toggleIconWrap: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(10),
    backgroundColor: colors.click + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTextWrap: { flex: 1 },
  toggleLabel: {
    fontFamily: 'Sora_700Bold',
    fontSize: fs(13),
    color: colors.text,
    marginBottom: rs(2),
  },
  toggleHint: {
    fontFamily: 'Sora_400Regular',
    fontSize: fs(11),
    color: colors.textDim,
    lineHeight: rs(16),
  },

  // Expires
  expiresRow: {
    flexDirection: 'row',
    gap: rs(8),
    marginBottom: rs(spacing.sm),
  },
  expiresChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(5),
    paddingVertical: rs(10),
    borderRadius: rs(radii.md),
    borderWidth: rs(1.5),
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  expiresChipSelected: {
    backgroundColor: colors.click + '14',
    borderColor: colors.click,
  },
  expiresChipText: {
    fontFamily: 'JetBrainsMono_500Medium',
    fontSize: fs(12),
    color: colors.textSec,
    letterSpacing: rs(0.3),
  },

  // Summary
  summaryBox: {
    marginTop: rs(spacing.md),
    padding: rs(spacing.md),
    borderRadius: rs(radii.md),
    backgroundColor: colors.petrol + '10',
    borderLeftWidth: rs(3),
    borderLeftColor: colors.petrol,
  },
  summaryLabel: {
    fontFamily: 'Sora_700Bold',
    fontSize: fs(10),
    color: colors.petrol,
    letterSpacing: rs(1),
    textTransform: 'uppercase',
    marginBottom: rs(4),
  },
  summaryText: {
    fontFamily: 'Sora_500Medium',
    fontSize: fs(13),
    color: colors.text,
    lineHeight: rs(19),
  },

  // Submit
  submitWrap: {
    marginTop: rs(spacing.lg),
  },
  disclaimer: {
    fontFamily: 'Sora_400Regular',
    fontSize: fs(11),
    color: colors.textDim,
    textAlign: 'center',
    marginTop: rs(spacing.sm),
    lineHeight: rs(16),
  },
  offlineNote: {
    fontFamily: 'Sora_500Medium',
    fontSize: fs(11),
    color: colors.warning,
    textAlign: 'center',
    marginTop: rs(spacing.sm),
  },
});
