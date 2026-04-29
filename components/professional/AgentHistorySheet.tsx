/**
 * components/professional/AgentHistorySheet.tsx
 *
 * Bottom sheet GENÉRICO de histórico de documentos profissionais por pet.
 * Substitui o ProntuarioHistorySheet — funciona para qualquer agente que
 * persista em tabela (prontuarios / receituarios / atestados_saude /
 * termos_consentimento).
 *
 * RLS já restringe ao vet logado. Tap em item → preview PDF via função
 * passada por prop.
 *
 * Uso:
 *   <AgentHistorySheet
 *     petId={petId}
 *     visible={historyVisible}
 *     onClose={() => setHistoryVisible(false)}
 *     config={PRONTUARIO_HISTORY_CONFIG}  // ver presets abaixo
 *   />
 */
import React, { useCallback } from 'react';
import {
  Modal, View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl, Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  X, History, FileText, Pill, FileCheck2, FileSignature, ShieldAlert, Stethoscope,
  Heart, ChevronRight, Inbox, Check, Clock,
} from 'lucide-react-native';

import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import { rs, fs } from '../../hooks/useResponsive';
import { useToast } from '../Toast';
import { supabase } from '../../lib/supabase';
import {
  previewProntuarioPdf, previewReceituarioPdf,
  previewAsaPdf, previewTciPdf, previewNotificacaoPdf,
  previewAnamnesePdf, previewAltaPdf,
} from '../../lib/professionalDocsPdf';
import { getErrorMessage } from '../../utils/errorMessages';

type IconCmp = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export interface AgentHistoryConfig {
  /** Nome da tabela no Postgres. Ex: 'prontuarios'. */
  table: string;
  /** Campo de texto que serve de título do item. Ex: 'chief_complaint'. */
  titleField: string;
  /** Campo timestamp que indica documento finalizado/assinado. */
  signedField: string;
  /**
   * Para TCI usamos AND lógico: só conta como assinado se ambos os timestamps
   * estiverem preenchidos (vet + tutor). Quando informado, este campo é o
   * SEGUNDO que precisa estar preenchido junto com signedField.
   */
  signedFieldExtra?: string;
  /** Função que abre o PDF do documento (já existente em professionalDocsPdf). */
  previewFn: (id: string) => Promise<void>;
  /** Ícone do tipo de documento (Lucide). */
  Icon: IconCmp;
  /** Cor do ícone — segue paleta semântica. */
  iconColor?: string;
  /** Chave i18n do título do bottom sheet. Ex: 'agents.history.titlePront'. */
  titleKey: string;
  /** Chave i18n do fallback "documento sem título". */
  untitledKey: string;
  /** Chave i18n do empty state (título). */
  emptyTitleKey: string;
  /** Chave i18n do empty state (descrição). */
  emptyDescKey: string;
  /**
   * Mapeador opcional do valor bruto do titleField pra label legível.
   * Útil para receituario (prescription_type='controlled' → "Receita controlada").
   */
  formatTitle?: (raw: string | null, t: (key: string, opts?: Record<string, unknown>) => string) => string;
  /**
   * Override opcional dos labels de status. Útil pra notificação sanitária
   * onde "Assinado" não faz sentido — usamos "Notificada" / "Pendente".
   */
  draftLabelKey?: string;
  signedLabelKey?: string;
  /**
   * Esconde o badge de status. Útil pra anamnese (sempre "concluída" assim
   * que persiste — não tem fluxo de assinatura nem de envio).
   */
  hideStatus?: boolean;
}

interface DocRow {
  id: string;
  status: string | null;
  created_at: string;
  [k: string]: unknown;
}

interface Props {
  petId: string;
  visible: boolean;
  onClose: () => void;
  config: AgentHistoryConfig;
}

function formatDate(iso: string, lang: string): string {
  return new Date(iso).toLocaleDateString(lang, {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatTime(iso: string, lang: string): string {
  return new Date(iso).toLocaleTimeString(lang, {
    hour: '2-digit', minute: '2-digit',
  });
}

export function AgentHistorySheet({ petId, visible, onClose, config }: Props) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const selectFields = [
    'id',
    config.titleField,
    'status',
    config.signedField,
    ...(config.signedFieldExtra ? [config.signedFieldExtra] : []),
    'created_at',
  ].join(', ');

  const query = useQuery<DocRow[]>({
    queryKey: ['agent-history', config.table, petId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(config.table)
        .select(selectFields)
        .eq('pet_id', petId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as DocRow[];
    },
    enabled: visible,
    staleTime: 30 * 1000,
  });

  const handleOpen = useCallback(async (id: string) => {
    try {
      onClose();
      await new Promise((r) => setTimeout(r, 250));
      await config.previewFn(id);
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    }
  }, [onClose, toast, config]);

  const renderItem = useCallback(({ item }: { item: DocRow }) => {
    const signedA = !!item[config.signedField];
    const signedB = config.signedFieldExtra ? !!item[config.signedFieldExtra] : true;
    const isSigned = signedA && signedB;

    const statusLabel = isSigned
      ? t(config.signedLabelKey ?? 'agents.history.signed', { defaultValue: 'Assinado' })
      : item.status === 'amended'
        ? t('agents.history.amended', { defaultValue: 'Emendado' })
        : config.signedFieldExtra && signedA && !signedB
          ? t('agents.history.awaitingTutor', { defaultValue: 'Aguardando tutor' })
          : t(config.draftLabelKey ?? 'agents.history.draft', { defaultValue: 'Rascunho' });

    const statusColor = isSigned ? colors.success
      : (config.signedFieldExtra && signedA && !signedB) ? colors.petrol
      : colors.warning;
    const StatusIcon = isSigned ? Check : Clock;

    const rawTitle = item[config.titleField] as string | null | undefined;
    const titleText = config.formatTitle
      ? config.formatTitle(rawTitle ?? null, t)
      : (rawTitle?.toString().trim() || t(config.untitledKey, { defaultValue: '—' }));

    const Icon = config.Icon;
    const iconColor = config.iconColor ?? colors.click;

    return (
      <TouchableOpacity
        style={s.item}
        onPress={() => handleOpen(item.id)}
        activeOpacity={0.7}
      >
        <View style={[s.itemIcon, { backgroundColor: iconColor + '12' }]}>
          <Icon size={rs(18)} color={iconColor} strokeWidth={1.8} />
        </View>
        <View style={s.itemBody}>
          <Text style={s.itemTitle} numberOfLines={1}>{titleText}</Text>
          <View style={s.itemMeta}>
            <Text style={s.itemDate}>
              {formatDate(item.created_at, i18n.language)} · {formatTime(item.created_at, i18n.language)}
            </Text>
            {!config.hideStatus && (
              <View style={[s.badge, { backgroundColor: statusColor + '18' }]}>
                <StatusIcon size={rs(10)} color={statusColor} strokeWidth={2} />
                <Text style={[s.badgeText, { color: statusColor }]}>{statusLabel}</Text>
              </View>
            )}
          </View>
        </View>
        <ChevronRight size={rs(16)} color={colors.textGhost} strokeWidth={2} />
      </TouchableOpacity>
    );
  }, [handleOpen, i18n.language, t, config]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={s.handleBar} />

          <View style={s.header}>
            <View style={[s.headerIcon, { backgroundColor: (config.iconColor ?? colors.click) + '15' }]}>
              <History size={rs(18)} color={config.iconColor ?? colors.click} strokeWidth={1.8} />
            </View>
            <Text style={s.title}>{t(config.titleKey, { defaultValue: 'Histórico' })}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <X size={rs(22)} color={colors.textSec} strokeWidth={1.8} />
            </TouchableOpacity>
          </View>

          {query.isLoading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator size="large" color={config.iconColor ?? colors.click} />
            </View>
          ) : (query.data?.length ?? 0) === 0 ? (
            <View style={s.emptyBox}>
              <Inbox size={rs(36)} color={colors.textGhost} strokeWidth={1.4} />
              <Text style={s.emptyTitle}>
                {t(config.emptyTitleKey, { defaultValue: 'Nenhum documento ainda' })}
              </Text>
              <Text style={s.emptyDesc}>
                {t(config.emptyDescKey, { defaultValue: 'O primeiro documento criado aparecerá aqui.' })}
              </Text>
            </View>
          ) : (
            <FlatList
              data={query.data ?? []}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={s.list}
              ItemSeparatorComponent={() => <View style={s.separator} />}
              refreshControl={
                <RefreshControl
                  refreshing={query.isRefetching}
                  onRefresh={query.refetch}
                  tintColor={config.iconColor ?? colors.click}
                />
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Presets pra cada agente ──────────────────────────────────────────────────

export const PRONTUARIO_HISTORY: AgentHistoryConfig = {
  table: 'prontuarios',
  titleField: 'chief_complaint',
  signedField: 'signed_at',
  previewFn: previewProntuarioPdf,
  Icon: FileText,
  iconColor: colors.click,
  titleKey: 'agents.history.titleProntuario',
  untitledKey: 'agents.history.untitledProntuario',
  emptyTitleKey: 'agents.history.emptyTitleProntuario',
  emptyDescKey: 'agents.history.emptyDescProntuario',
};

export const RECEITUARIO_HISTORY: AgentHistoryConfig = {
  table: 'receituarios',
  titleField: 'prescription_type',
  signedField: 'signed_at',
  previewFn: previewReceituarioPdf,
  Icon: Pill,
  iconColor: colors.success,
  titleKey: 'agents.history.titleReceituario',
  untitledKey: 'agents.history.untitledReceituario',
  emptyTitleKey: 'agents.history.emptyTitleReceituario',
  emptyDescKey: 'agents.history.emptyDescReceituario',
  formatTitle: (raw, t) => {
    if (raw === 'controlled') return t('agents.history.rxControlled', { defaultValue: 'Receita controlada' });
    if (raw === 'special')    return t('agents.history.rxSpecial',    { defaultValue: 'Receita especial' });
    if (raw === 'common')     return t('agents.history.rxCommon',     { defaultValue: 'Receita comum' });
    return raw ?? t('agents.history.untitledReceituario', { defaultValue: 'Receituário' });
  },
};

export const ASA_HISTORY: AgentHistoryConfig = {
  table: 'atestados_saude',
  titleField: 'purpose',
  signedField: 'issued_at',
  previewFn: previewAsaPdf,
  Icon: FileCheck2,
  iconColor: colors.petrol,
  titleKey: 'agents.history.titleAsa',
  untitledKey: 'agents.history.untitledAsa',
  emptyTitleKey: 'agents.history.emptyTitleAsa',
  emptyDescKey: 'agents.history.emptyDescAsa',
};

export const TCI_HISTORY: AgentHistoryConfig = {
  table: 'termos_consentimento',
  titleField: 'procedure_type',
  signedField: 'professional_signed_at',
  signedFieldExtra: 'tutor_signed_at', // só "Assinado" se vet E tutor assinaram
  previewFn: previewTciPdf,
  Icon: FileSignature,
  iconColor: colors.warning,
  titleKey: 'agents.history.titleTci',
  untitledKey: 'agents.history.untitledTci',
  emptyTitleKey: 'agents.history.emptyTitleTci',
  emptyDescKey: 'agents.history.emptyDescTci',
};

export const ALTA_HISTORY: AgentHistoryConfig = {
  table: 'relatorios_alta',
  titleField: 'diagnosis_summary',
  signedField: 'created_at', // sempre preenchido — sem fluxo de assinatura
  previewFn: previewAltaPdf,
  Icon: Heart,
  iconColor: colors.danger,
  titleKey: 'agents.history.titleAlta',
  untitledKey: 'agents.history.untitledAlta',
  emptyTitleKey: 'agents.history.emptyTitleAlta',
  emptyDescKey: 'agents.history.emptyDescAlta',
  hideStatus: true,
  formatTitle: (raw, t) => {
    if (!raw) return t('agents.history.untitledAlta', { defaultValue: 'Relatório de alta' });
    const trimmed = raw.trim();
    if (trimmed.length <= 80) return trimmed;
    return trimmed.slice(0, 77) + '…';
  },
};

export const ANAMNESE_HISTORY: AgentHistoryConfig = {
  table: 'anamneses',
  titleField: 'pet_summary',
  signedField: 'created_at', // sempre preenchido — status fica oculto via hideStatus
  previewFn: previewAnamnesePdf,
  Icon: Stethoscope,
  iconColor: colors.ai,
  titleKey: 'agents.history.titleAnamnese',
  untitledKey: 'agents.history.untitledAnamnese',
  emptyTitleKey: 'agents.history.emptyTitleAnamnese',
  emptyDescKey: 'agents.history.emptyDescAnamnese',
  hideStatus: true,
  // Anamnese tem pet_summary longo — corta no primeiro pedaço
  formatTitle: (raw, t) => {
    if (!raw) return t('agents.history.untitledAnamnese', { defaultValue: 'Anamnese' });
    const trimmed = raw.trim();
    if (trimmed.length <= 80) return trimmed;
    return trimmed.slice(0, 77) + '…';
  },
};

export const NOTIFICACAO_HISTORY: AgentHistoryConfig = {
  table: 'notificacoes_sanitarias',
  titleField: 'disease_name',
  signedField: 'notified_at', // notified_at = notificação enviada à autoridade
  previewFn: previewNotificacaoPdf,
  Icon: ShieldAlert,
  iconColor: colors.danger,
  titleKey: 'agents.history.titleNotificacao',
  untitledKey: 'agents.history.untitledNotificacao',
  emptyTitleKey: 'agents.history.emptyTitleNotificacao',
  emptyDescKey: 'agents.history.emptyDescNotificacao',
  // Notificação não fala em "Assinado" — fala em "Notificada/Pendente"
  draftLabelKey: 'agents.history.notifPending',
  signedLabelKey: 'agents.history.notifSent',
};

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11, 18, 25, 0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: rs(24),
    borderTopRightRadius: rs(24),
    maxHeight: '85%',
    minHeight: '50%',
    paddingBottom: rs(20),
  },
  handleBar: {
    width: rs(40),
    height: rs(4),
    backgroundColor: colors.textGhost,
    borderRadius: rs(2),
    alignSelf: 'center',
    marginTop: rs(10),
    marginBottom: rs(8),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  headerIcon: {
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: fs(16),
    fontWeight: '700',
    color: colors.text,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  separator: {
    height: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: rs(12),
    padding: rs(12),
    gap: rs(10),
  },
  itemIcon: {
    width: rs(36),
    height: rs(36),
    borderRadius: rs(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    fontSize: fs(14),
    fontWeight: '600',
    color: colors.text,
    marginBottom: rs(4),
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    flexWrap: 'wrap',
  },
  itemDate: {
    fontSize: fs(11),
    color: colors.textDim,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(3),
    paddingHorizontal: rs(6),
    paddingVertical: rs(2),
    borderRadius: rs(6),
  },
  badgeText: {
    fontSize: fs(10),
    fontWeight: '600',
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
    minHeight: rs(200),
  },
  emptyBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: rs(8),
    minHeight: rs(200),
  },
  emptyTitle: {
    fontSize: fs(14),
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.xs,
  },
  emptyDesc: {
    fontSize: fs(12),
    color: colors.textDim,
    textAlign: 'center',
  },
});
