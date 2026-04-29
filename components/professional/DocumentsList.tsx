/**
 * components/professional/DocumentsList.tsx
 *
 * Lista UNIFICADA de documentos profissionais de um pet (7 tipos):
 *   - prontuarios (status: draft|signed|amended)
 *   - receituarios
 *   - atestados_saude (ASA)
 *   - termos_consentimento (TCI)
 *   - anamneses (briefing pre-consulta gerado por IA)
 *   - relatorios_alta (alta clinica)
 *   - notificacoes_sanitarias (zoonoses, doencas de notificacao obrigatoria)
 *
 * Ordenada por created_at DESC. Cada item:
 *   - Icone do tipo
 *   - Titulo (chief_complaint, prescription_type, purpose, procedure_type,
 *             pet_summary, diagnosis_summary, disease_name)
 *   - Status badge (rascunho / assinado / completo)
 *   - Tap → preview PDF (lib/professionalDocsPdf)
 *
 * Empty state: card amigavel "Nenhum documento ainda".
 *
 * Usado em DUAS telas:
 *   - /pro/pet/[id] aba DOCUMENTOS (visao do vet)
 *   - /pet/[id]/documents (visao do tutor) — RLS *_select_tutor cobre as 7 tabelas
 */
import React, { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  FileText, Pill, FileCheck2, FileSignature, ChevronRight, Inbox,
  Check, Clock, Stethoscope, Heart, ShieldAlert,
} from 'lucide-react-native';

import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import { rs, fs } from '../../hooks/useResponsive';
import { useToast } from '../Toast';
import { supabase } from '../../lib/supabase';
import {
  previewProntuarioPdf, previewReceituarioPdf,
  previewAsaPdf, previewTciPdf,
  previewAnamnesePdf, previewAltaPdf, previewNotificacaoPdf,
} from '../../lib/professionalDocsPdf';
import { getErrorMessage } from '../../utils/errorMessages';

type DocType =
  | 'prontuario' | 'receituario' | 'asa' | 'tci'
  | 'anamnese' | 'alta' | 'notificacao';

interface Doc {
  id: string;
  type: DocType;
  title: string;
  subtitle?: string;
  status: string;
  signed: boolean;
  created_at: string;
}

const ICONS: Record<DocType, React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>> = {
  prontuario: FileText,
  receituario: Pill,
  asa: FileCheck2,
  tci: FileSignature,
  anamnese: Stethoscope,
  alta: Heart,
  notificacao: ShieldAlert,
};

/**
 * Labels traduzidos via i18n (`documents.types.*`). O caller passa `t()`
 * pra esta funcao via useTranslation no componente — fallback pra PT-BR
 * caso a chave nao exista (cobre regressao).
 */
function buildTypeLabels(t: (k: string, fb?: { defaultValue: string }) => string): Record<DocType, string> {
  return {
    prontuario:  t('documents.types.prontuario',  { defaultValue: 'Prontuário' }),
    receituario: t('documents.types.receituario', { defaultValue: 'Receita' }),
    asa:         t('documents.types.asa',         { defaultValue: 'Atestado' }),
    tci:         t('documents.types.tci',         { defaultValue: 'TCI' }),
    anamnese:    t('documents.types.anamnese',    { defaultValue: 'Anamnese' }),
    alta:        t('documents.types.alta',        { defaultValue: 'Alta clínica' }),
    notificacao: t('documents.types.notificacao', { defaultValue: 'Notificação sanitária' }),
  };
}

interface Props {
  petId: string;
}

export function DocumentsList({ petId }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const TYPE_LABELS = buildTypeLabels(t);

  const query = useQuery<Doc[]>({
    queryKey: ['pro-documents', petId],
    queryFn: async () => {
      const [prontuarios, receituarios, atestados, tcis, anamneses, altas, notificacoes] =
        await Promise.all([
          supabase.from('prontuarios')
            .select('id, chief_complaint, status, signed_at, created_at')
            .eq('pet_id', petId).eq('is_deleted', false)
            .order('created_at', { ascending: false }),
          supabase.from('receituarios')
            .select('id, prescription_type, status, signed_at, created_at')
            .eq('pet_id', petId)
            .order('created_at', { ascending: false }),
          supabase.from('atestados_saude')
            .select('id, purpose, status, issued_at, valid_until, created_at')
            .eq('pet_id', petId)
            .order('created_at', { ascending: false }),
          supabase.from('termos_consentimento')
            .select('id, procedure_type, status, professional_signed_at, tutor_signed_at, created_at')
            .eq('pet_id', petId)
            .order('created_at', { ascending: false }),
          supabase.from('anamneses')
            .select('id, pet_summary, created_at')
            .eq('pet_id', petId).eq('is_deleted', false)
            .order('created_at', { ascending: false }),
          supabase.from('relatorios_alta')
            .select('id, diagnosis_summary, created_at')
            .eq('pet_id', petId).eq('is_deleted', false)
            .order('created_at', { ascending: false }),
          supabase.from('notificacoes_sanitarias')
            .select('id, disease_name, notified_at, created_at')
            .eq('pet_id', petId).eq('is_deleted', false)
            .order('created_at', { ascending: false }),
        ]);

      const all: Doc[] = [];
      (prontuarios.data ?? []).forEach((d: any) => all.push({
        id: d.id, type: 'prontuario',
        title: d.chief_complaint || TYPE_LABELS.prontuario,
        subtitle: TYPE_LABELS.prontuario,
        status: d.status, signed: !!d.signed_at,
        created_at: d.created_at,
      }));
      (receituarios.data ?? []).forEach((d: any) => all.push({
        id: d.id, type: 'receituario',
        title:
          d.prescription_type === 'controlled' ? t('documents.prescriptionControlled', { defaultValue: 'Receita controlada' }) :
          d.prescription_type === 'special'    ? t('documents.prescriptionSpecial',    { defaultValue: 'Receita especial' })   :
                                                  t('documents.prescriptionCommon',     { defaultValue: 'Receita comum' }),
        subtitle: TYPE_LABELS.receituario,
        status: d.status, signed: !!d.signed_at,
        created_at: d.created_at,
      }));
      (atestados.data ?? []).forEach((d: any) => all.push({
        id: d.id, type: 'asa',
        title: d.purpose || TYPE_LABELS.asa,
        subtitle: TYPE_LABELS.asa,
        status: d.status, signed: !!d.issued_at,
        created_at: d.created_at,
      }));
      (tcis.data ?? []).forEach((d: any) => all.push({
        id: d.id, type: 'tci',
        title: d.procedure_type || TYPE_LABELS.tci,
        subtitle: TYPE_LABELS.tci,
        status: d.status,
        signed: !!d.professional_signed_at && !!d.tutor_signed_at,
        created_at: d.created_at,
      }));
      // Anamnese — sem signing flow; conteudo eh sempre "completo" apos persistir
      (anamneses.data ?? []).forEach((d: any) => {
        const summary = (d.pet_summary || '').trim();
        const title = summary
          ? summary.split(/[.!?]/)[0].slice(0, 80) || TYPE_LABELS.anamnese
          : TYPE_LABELS.anamnese;
        all.push({
          id: d.id, type: 'anamnese',
          title, subtitle: TYPE_LABELS.anamnese,
          status: 'complete', signed: true,
          created_at: d.created_at,
        });
      });
      // Relatorio de alta — idem
      (altas.data ?? []).forEach((d: any) => {
        const summary = (d.diagnosis_summary || '').trim();
        const title = summary
          ? summary.split(/[.!?]/)[0].slice(0, 80) || TYPE_LABELS.alta
          : TYPE_LABELS.alta;
        all.push({
          id: d.id, type: 'alta',
          title, subtitle: TYPE_LABELS.alta,
          status: 'complete', signed: true,
          created_at: d.created_at,
        });
      });
      // Notificacao sanitaria — `notified_at` marca oficializacao
      (notificacoes.data ?? []).forEach((d: any) => all.push({
        id: d.id, type: 'notificacao',
        title: d.disease_name || TYPE_LABELS.notificacao,
        subtitle: TYPE_LABELS.notificacao,
        status: d.notified_at ? 'notified' : 'draft',
        signed: !!d.notified_at,
        created_at: d.created_at,
      }));

      // Ordena geral por created_at DESC
      all.sort((a, b) => b.created_at.localeCompare(a.created_at));
      return all;
    },
    staleTime: 30 * 1000,
  });

  const handlePress = useCallback(async (doc: Doc) => {
    try {
      switch (doc.type) {
        case 'prontuario':  await previewProntuarioPdf(doc.id); break;
        case 'receituario': await previewReceituarioPdf(doc.id); break;
        case 'asa':         await previewAsaPdf(doc.id); break;
        case 'tci':         await previewTciPdf(doc.id); break;
        case 'anamnese':    await previewAnamnesePdf(doc.id); break;
        case 'alta':        await previewAltaPdf(doc.id); break;
        case 'notificacao': await previewNotificacaoPdf(doc.id); break;
      }
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    }
  }, [toast]);

  if (query.isLoading) {
    return (
      <View style={s.loadingBox}>
        <ActivityIndicator size="large" color={colors.click} />
      </View>
    );
  }

  return (
    <FlatList
      data={query.data ?? []}
      keyExtractor={(item) => `${item.type}-${item.id}`}
      contentContainerStyle={(query.data?.length ?? 0) === 0 ? s.emptyContainer : s.list}
      refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} tintColor={colors.click} />}
      ListEmptyComponent={
        <View style={s.emptyBox}>
          <View style={s.emptyIcon}>
            <Inbox size={rs(28)} color={colors.click} strokeWidth={1.6} />
          </View>
          <Text style={s.emptyTitle}>{t('documents.emptyTitle')}</Text>
          <Text style={s.emptyDesc}>{t('documents.emptyDesc')}</Text>
        </View>
      }
      renderItem={({ item }) => {
        const Icon = ICONS[item.type];
        return (
          <TouchableOpacity style={s.row} onPress={() => handlePress(item)} activeOpacity={0.7}>
            <View style={s.rowIcon}>
              <Icon size={rs(20)} color={colors.click} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.titleRow}>
                <Text style={s.rowTitle} numberOfLines={1}>{item.title}</Text>
                {item.signed ? (
                  <View style={s.signedBadge}>
                    <Check size={rs(10)} color={colors.success} strokeWidth={2.5} />
                    <Text style={s.signedTxt}>{t('documents.signedBadge', { defaultValue: 'Assinado' })}</Text>
                  </View>
                ) : (
                  <View style={s.draftBadge}>
                    <Clock size={rs(10)} color={colors.warning} strokeWidth={2} />
                    <Text style={s.draftTxt}>{t('documents.draftBadge', { defaultValue: 'Rascunho' })}</Text>
                  </View>
                )}
              </View>
              <Text style={s.rowSub}>
                {item.subtitle} · {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <ChevronRight size={rs(18)} color={colors.click} strokeWidth={1.8} />
          </TouchableOpacity>
        );
      }}
    />
  );
}

const s = StyleSheet.create({
  loadingBox: { padding: rs(40), alignItems: 'center' },
  list: { padding: spacing.md, paddingBottom: rs(40) },
  emptyContainer: { flex: 1, justifyContent: 'center', padding: spacing.lg, minHeight: rs(280) },
  emptyBox: { alignItems: 'center', gap: rs(10) },
  emptyIcon: { width: rs(56), height: rs(56), borderRadius: rs(28), backgroundColor: colors.clickSoft, alignItems: 'center', justifyContent: 'center', marginBottom: rs(8) },
  emptyTitle: { color: colors.text, fontSize: fs(15), fontWeight: '700', textAlign: 'center' },
  emptyDesc: { color: colors.textSec, fontSize: fs(12), textAlign: 'center', lineHeight: fs(18), paddingHorizontal: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: rs(12), backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: rs(14), marginBottom: rs(10) },
  rowIcon: { width: rs(40), height: rs(40), borderRadius: rs(20), backgroundColor: colors.clickSoft, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: rs(8) },
  rowTitle: { color: colors.text, fontSize: fs(13), fontWeight: '700', flex: 1 },
  rowSub: { color: colors.textDim, fontSize: fs(11), marginTop: rs(2) },
  signedBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(3), paddingHorizontal: rs(6), paddingVertical: rs(2), backgroundColor: colors.success + '15', borderRadius: rs(4) },
  signedTxt: { color: colors.success, fontSize: fs(9), fontWeight: '700' },
  draftBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(3), paddingHorizontal: rs(6), paddingVertical: rs(2), backgroundColor: colors.warning + '15', borderRadius: rs(4) },
  draftTxt: { color: colors.warning, fontSize: fs(9), fontWeight: '700' },
});
