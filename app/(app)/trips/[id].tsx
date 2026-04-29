/**
 * /trips/[id] — Detalhe da viagem + checklist + anexar documentos.
 *
 * Header: bandeira+pais, datas, status badge, contagem regressiva.
 * Body: lista de requirements (do catalogo estatico, IA cache ou generic
 * fallback) com botao "Anexar documento" em cada item — abre camera, faz
 * upload pra Storage, chama extract-travel-document, cria trip_document
 * e atualiza checklist_state.
 *
 * Banners de disclaimer obrigatorios para `source !== 'static_catalog'`.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  RefreshControl, Image, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import {
  ChevronLeft, AlertTriangle, ShieldCheck, Camera, Check, Clock,
  Syringe, FileCheck2, Stethoscope, Pill, MapPin, Tag, Inbox, Sparkles,
  Map as MapIcon, Wand2,
} from 'lucide-react-native';

import { colors } from '../../../constants/colors';
import { radii, spacing } from '../../../constants/spacing';
import { rs, fs } from '../../../hooks/useResponsive';
import { useToast } from '../../../components/Toast';
import { supabase } from '../../../lib/supabase';
import { useTrip, useUpdateTrip } from '../../../hooks/useTrips';
import { useTripDocuments, useCreateTripDocument } from '../../../hooks/useTripDocuments';
import { Plane as PlaneIcon } from 'lucide-react-native';
import { useTravelRules } from '../../../hooks/useTravelRules';
import { TRAVEL_RULES } from '../../../data/travelRules';
import { getErrorMessage } from '../../../utils/errorMessages';
import type { ChecklistState, ChecklistItemState } from '../../../types/trip';
import type { TravelRequirement, RequirementCategory } from '../../../data/travelRules/types';

// ── Helpers ─────────────────────────────────────────────────────────────────

const CAT_ICONS: Record<RequirementCategory, typeof Syringe> = {
  vaccination: Syringe,
  documentation: FileCheck2,
  identification: Tag,
  transport: MapIcon,
  preparation: Pill,
  testing: Stethoscope,
};

function windowKey(req: TravelRequirement): string {
  const { min, max } = req.daysBeforeTravel;
  if (min === 0 && max >= 99999) return ''; // sem janela
  if (min === 0) return `travel.checklist.window.until|${max}`;
  if (max >= 99999) return `travel.checklist.window.from|${min}`;
  return `travel.checklist.window.between|${min}|${max}`;
}

// ── Tela ────────────────────────────────────────────────────────────────────

export default function TripDetailScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const { id: tripId } = useLocalSearchParams<{ id: string }>();
  const trip = useTrip(tripId);
  const docs = useTripDocuments(tripId);
  const updateTrip = useUpdateTrip();
  const createDoc = useCreateTripDocument();
  const [uploadingReqId, setUploadingReqId] = useState<string | null>(null);

  // Pet species — pega do primeiro pet da viagem (assumindo 1 pet por trip no MVP)
  const petId = trip.data?.pet_ids[0];
  const [petSpecies, setPetSpecies] = useState<'dog' | 'cat'>('dog');
  React.useEffect(() => {
    if (!petId) return;
    supabase.from('pets').select('species').eq('id', petId).maybeSingle().then(({ data }) => {
      if (data?.species === 'dog' || data?.species === 'cat') setPetSpecies(data.species);
    });
  }, [petId]);

  const rules = useTravelRules(trip.data?.destination_country_code, petSpecies);

  // ── Anexar documento — fluxo camera → upload → IA → criar trip_document ─
  const handleAttach = async (req: TravelRequirement) => {
    if (!tripId || !trip.data) return;
    setUploadingReqId(req.id);
    try {
      // 1. Permissao + camera
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        toast(t('agents.errors.biometricUnavailable', { defaultValue: 'Permita acesso à câmera.' }), 'warning');
        return;
      }
      const pick = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85, base64: false,
      });
      if (pick.canceled || !pick.assets?.[0]) return;
      const uri = pick.assets[0].uri;

      // 2. Le como base64
      const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });

      // 3. Upload pra Storage (bucket trip-documents)
      const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${trip.data.tutor_id}/${tripId}/${req.id}_${Date.now()}.${ext}`;
      const fileBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
      console.log('[trips/id] upload', path, 'bytes=', fileBytes.byteLength);
      const { error: upErr } = await supabase.storage
        .from('trip-documents')
        .upload(path, fileBytes, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: false });
      if (upErr && !upErr.message.includes('Bucket not found')) {
        // Se bucket nao existe, fallback: salvar sem path real
        console.warn('[trips/id] storage upload failed:', upErr.message);
      }

      // 4. Chama extract-travel-document
      console.log('[trips/id] invoking extract-travel-document, hint=', req.documentType);
      const { data: extracted, error: efErr } = await supabase.functions.invoke('extract-travel-document', {
        body: {
          image_base64: b64,
          document_type_hint: req.documentType,
          target_locale: i18n.language,
          mime_type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        },
      });
      if (efErr) throw efErr;

      // 5. Cria trip_document
      const doc = await createDoc.mutateAsync({
        trip_id: tripId,
        pet_id: petId ?? null,
        document_type: (extracted as any).document_type_detected ?? req.documentType,
        storage_path: path,
        extracted_data: (extracted as any).extracted_data ?? {},
        issued_date: (extracted as any).extracted_data?.applied_date ?? (extracted as any).extracted_data?.issued_date ?? null,
        expires_at: (extracted as any).extracted_data?.expires_at ?? null,
        status: (extracted as any).suggested_status ?? 'pending_review',
      });

      // 6. Atualiza checklist_state
      const newState: ChecklistState = {
        ...(trip.data.checklist_state ?? {}),
        [req.id]: {
          status: 'completed',
          document_id: doc.id,
          completed_at: new Date().toISOString(),
        },
      };
      await updateTrip.mutateAsync({ id: tripId, checklist_state: newState });
      toast(t('travel.document.review.confirm', { defaultValue: 'Documento anexado.' }), 'success');
    } catch (e) {
      console.warn('[trips/id] attach failed:', e);
      toast(getErrorMessage(e), 'error');
    } finally {
      setUploadingReqId(null);
    }
  };

  const onRefresh = async () => {
    await Promise.all([trip.refetch(), docs.refetch()]);
  };

  // Botao "Embarquei" — disponivel a partir de start_date - 1d ate active.
  const canEmbark = useMemo(() => {
    if (!trip.data) return false;
    if (trip.data.status !== 'preparing' && trip.data.status !== 'planning') return false;
    const start = new Date(trip.data.start_date + 'T00:00:00');
    const cutoff = new Date(start.getTime() - 24 * 60 * 60 * 1000);
    return new Date() >= cutoff;
  }, [trip.data]);

  const handleEmbark = async () => {
    if (!tripId || !trip.data) return;
    try {
      await updateTrip.mutateAsync({
        id: tripId, status: 'active',
        // active_started_at gravado via trigger seria ideal; gravamos via metadata
        metadata: { ...(trip.data.metadata ?? {}), active_started_at: new Date().toISOString() },
      });
      // active_started_at coluna direta:
      await supabase.from('trips').update({ active_started_at: new Date().toISOString() }).eq('id', tripId);
      console.log('[trips/id] embarked:', tripId);
      router.replace(`/(app)/trips/${tripId}/active` as never);
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    }
  };

  // Auto-redirect: se trip ja esta ativa, mostra dashboard ativo em vez do checklist.
  useEffect(() => {
    if (trip.data?.status === 'active') {
      router.replace(`/(app)/trips/${tripId}/active` as never);
    }
  }, [trip.data?.status, tripId, router]);

  // ── Loading / error ────────────────────────────────────────────────────
  if (trip.isLoading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.loadingBox}><ActivityIndicator size="large" color={colors.click} /></View>
      </SafeAreaView>
    );
  }
  if (!trip.data) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.emptyBox}>
          <AlertTriangle size={rs(28)} color={colors.warning} strokeWidth={1.6} />
          <Text style={s.emptyTxt}>{t('agents.errors.missingPet', { defaultValue: 'Viagem não encontrada.' })}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tripData = trip.data;
  const staticRule = TRAVEL_RULES[tripData.destination_country_code];
  const flag = staticRule?.flag ?? '🌍';
  const countryName = staticRule
    ? t(staticRule.countryNameKey, { defaultValue: tripData.destination_country_code })
    : tripData.destination_country_code;
  const checklistState = (tripData.checklist_state ?? {}) as ChecklistState;
  const requirements = rules.data?.rule.requirements ?? [];
  const completedCount = requirements.filter((r) => checklistState[r.id]?.status === 'completed').length;
  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString(
    i18n.language === 'pt-BR' ? 'pt-BR' : i18n.language,
    { day: '2-digit', month: 'short', year: 'numeric' }
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={rs(22)} color={colors.click} strokeWidth={1.8} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.headerFlag}>{flag}</Text>
          <Text style={s.headerCountry} numberOfLines={1}>{countryName}</Text>
        </View>
        <View style={{ width: rs(22) }} />
      </View>

      <ScrollView
        contentContainerStyle={s.body}
        refreshControl={<RefreshControl refreshing={trip.isFetching} onRefresh={onRefresh} tintColor={colors.click} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Resumo */}
        <View style={s.summary}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>{fmt(tripData.start_date)} → {fmt(tripData.end_date)}</Text>
            <View style={[s.statusBadge, statusStyle(tripData.status)]}>
              <Text style={s.statusBadgeTxt}>{t(`travel.status.${tripData.status}`)}</Text>
            </View>
          </View>
          <View style={s.summaryProgress}>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${requirements.length === 0 ? 0 : (completedCount / requirements.length) * 100}%` }]} />
            </View>
            <Text style={s.progressTxt}>{completedCount}/{requirements.length}</Text>
          </View>
        </View>

        {/* Disclaimer banner conforme source */}
        {rules.data && rules.data.source !== 'static_catalog' ? (
          <View style={[s.banner, s.bannerWarn]}>
            <AlertTriangle size={rs(16)} color={colors.warning} strokeWidth={2} />
            <Text style={s.bannerTxt}>
              {t(rules.data.source === 'ai_generated' ? 'travel.disclaimer.ai_generated' : 'travel.disclaimer.generic_fallback')}
            </Text>
          </View>
        ) : null}

        {rules.isGenerating ? (
          <View style={[s.banner, s.bannerInfo]}>
            <Sparkles size={rs(16)} color={colors.ai} strokeWidth={2} />
            <Text style={s.bannerTxt}>{t('travel.ai_generation.in_progress', { countryName })}</Text>
          </View>
        ) : null}

        {/* Checklist */}
        <Text style={s.sectionTitle}>{t('travel.checklist.title')}</Text>
        {requirements.length === 0 ? (
          <View style={s.emptyChecklist}>
            <Inbox size={rs(28)} color={colors.click} strokeWidth={1.6} />
            <Text style={s.emptyTxt}>{t('travel.checklist.no_items')}</Text>
          </View>
        ) : (
          requirements.map((req) => {
            const state = checklistState[req.id];
            const Icon = CAT_ICONS[req.category] ?? FileCheck2;
            const isCompleted = state?.status === 'completed';
            const isUploading = uploadingReqId === req.id;
            const wKey = windowKey(req);
            const wParts = wKey.split('|');
            return (
              <View key={req.id} style={[s.reqCard, isCompleted && s.reqCardDone]}>
                <View style={s.reqHeader}>
                  <View style={[s.reqIcon, isCompleted && s.reqIconDone]}>
                    {isCompleted
                      ? <Check size={rs(18)} color={colors.success} strokeWidth={2.5} />
                      : <Icon size={rs(18)} color={colors.click} strokeWidth={1.8} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.reqTitle}>{t(req.titleKey, { defaultValue: req.id })}</Text>
                    {wKey ? (
                      <View style={s.reqWindow}>
                        <Clock size={rs(11)} color={colors.textDim} strokeWidth={1.8} />
                        <Text style={s.reqWindowTxt}>
                          {t(wParts[0], { min: wParts[1], max: wParts[2] })}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {req.mandatory ? (
                    <View style={s.mandatoryBadge}>
                      <Text style={s.mandatoryTxt}>!</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={s.reqDesc} numberOfLines={3}>
                  {t(req.descriptionKey, { defaultValue: '' })}
                </Text>
                {!isCompleted ? (
                  <TouchableOpacity
                    style={[s.attachBtn, isUploading && { opacity: 0.5 }]}
                    onPress={() => handleAttach(req)}
                    disabled={isUploading}
                    activeOpacity={0.8}
                  >
                    {isUploading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Camera size={rs(16)} color="#FFFFFF" strokeWidth={2} />
                        <Text style={s.attachTxt}>{t('travel.checklist.attach_document')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={s.doneRow}>
                    <ShieldCheck size={rs(14)} color={colors.success} strokeWidth={2} />
                    <Text style={s.doneTxt}>{t('travel.checklist.item_status.completed')}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* Botao "Roteiro com IA" — sempre disponivel em planning/preparing */}
        {(tripData.status === 'planning' || tripData.status === 'preparing') && (
          <TouchableOpacity
            style={s.conciergeBtn}
            onPress={() => router.push(`/(app)/trips/${tripId}/concierge` as never)}
            activeOpacity={0.85}
          >
            <Wand2 size={rs(18)} color="#FFFFFF" strokeWidth={2} />
            <Text style={s.conciergeBtnTxt}>
              {t('travelConcierge.cta', { defaultValue: 'Deixe a IA preparar tudo' })}
            </Text>
          </TouchableOpacity>
        )}

        {/* Botao "Embarquei" — visivel a partir de start_date - 1d */}
        {canEmbark ? (
          <TouchableOpacity style={s.embarkBtn} onPress={handleEmbark} activeOpacity={0.85}>
            <PlaneIcon size={rs(18)} color="#FFFFFF" strokeWidth={2} />
            <Text style={s.embarkTxt}>{t('travelActive.embark_button', { defaultValue: 'Embarquei' })}</Text>
          </TouchableOpacity>
        ) : null}

        {/* Static review banner — sutil no rodape */}
        {rules.data?.source === 'static_catalog' && rules.data.rule.lastReviewed ? (
          <Text style={s.footerReview}>
            {t('travel.checklist.last_reviewed', { date: rules.data.rule.lastReviewed })}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function statusStyle(status: string) {
  switch (status) {
    case 'planning': return { backgroundColor: colors.click + '20', color: colors.click };
    case 'preparing': return { backgroundColor: colors.warning + '20', color: colors.warning };
    case 'active': return { backgroundColor: colors.success + '20', color: colors.success };
    case 'completed': return { backgroundColor: colors.textDim + '20', color: colors.textDim };
    default: return { backgroundColor: colors.click + '20', color: colors.click };
  }
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: rs(12) },
  emptyTxt: { color: colors.text, fontSize: fs(13), textAlign: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  headerFlag: { fontSize: fs(28) },
  headerCountry: { color: colors.text, fontSize: fs(15), fontWeight: '700', marginTop: rs(2) },
  body: { padding: spacing.md, paddingBottom: rs(40) },
  summary: { gap: rs(10), marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { color: colors.text, fontSize: fs(14), fontWeight: '700' },
  statusBadge: { paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: rs(8) },
  statusBadgeTxt: { fontSize: fs(11), fontWeight: '700' },
  summaryProgress: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  progressTrack: { flex: 1, height: rs(6), borderRadius: rs(3), backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.click, borderRadius: rs(3) },
  progressTxt: { color: colors.textDim, fontSize: fs(12), fontWeight: '600' },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: rs(10),
    padding: spacing.md, marginBottom: spacing.md,
    borderRadius: radii.lg, borderWidth: 1,
  },
  bannerWarn: { backgroundColor: colors.warning + '12', borderColor: colors.warning + '40' },
  bannerInfo: { backgroundColor: colors.ai + '12', borderColor: colors.ai + '40' },
  bannerTxt: { flex: 1, color: colors.text, fontSize: fs(11), lineHeight: fs(16) },
  sectionTitle: { color: colors.text, fontSize: fs(15), fontWeight: '700', marginBottom: rs(10), marginTop: rs(8) },
  emptyChecklist: { alignItems: 'center', gap: rs(10), padding: spacing.lg },
  reqCard: {
    padding: spacing.md, marginBottom: rs(10),
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border, gap: rs(8),
  },
  reqCardDone: { backgroundColor: colors.success + '08', borderColor: colors.success + '30' },
  reqHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  reqIcon: {
    width: rs(36), height: rs(36), borderRadius: rs(18),
    backgroundColor: colors.clickSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  reqIconDone: { backgroundColor: colors.success + '20' },
  reqTitle: { color: colors.text, fontSize: fs(13), fontWeight: '700' },
  reqWindow: { flexDirection: 'row', alignItems: 'center', gap: rs(4), marginTop: rs(2) },
  reqWindowTxt: { color: colors.textDim, fontSize: fs(11) },
  mandatoryBadge: {
    width: rs(20), height: rs(20), borderRadius: rs(10),
    backgroundColor: colors.danger,
    alignItems: 'center', justifyContent: 'center',
  },
  mandatoryTxt: { color: '#FFFFFF', fontSize: fs(11), fontWeight: '900' },
  reqDesc: { color: colors.textSec, fontSize: fs(12), lineHeight: fs(17) },
  attachBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6),
    backgroundColor: colors.click, padding: rs(10), borderRadius: radii.md,
    marginTop: rs(4),
  },
  attachTxt: { color: '#FFFFFF', fontSize: fs(13), fontWeight: '700' },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: rs(6), padding: rs(8) },
  doneTxt: { color: colors.success, fontSize: fs(12), fontWeight: '600' },
  footerReview: {
    color: colors.textDim, fontSize: fs(10), textAlign: 'center',
    marginTop: rs(20), paddingHorizontal: spacing.md, fontStyle: 'italic',
  },
  embarkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8),
    backgroundColor: colors.success, padding: rs(16), borderRadius: radii.lg,
    marginTop: rs(20), shadowColor: colors.success,
    shadowOffset: { width: 0, height: rs(6) }, shadowOpacity: 0.3, shadowRadius: rs(14), elevation: 5,
  },
  embarkTxt: { color: '#FFFFFF', fontSize: fs(15), fontWeight: '700' },
  conciergeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8),
    backgroundColor: colors.ai, padding: rs(16), borderRadius: radii.lg,
    marginTop: rs(12), marginBottom: rs(4),
    shadowColor: colors.ai, shadowOffset: { width: 0, height: rs(6) },
    shadowOpacity: 0.3, shadowRadius: rs(14), elevation: 5,
  },
  conciergeBtnTxt: { color: '#FFFFFF', fontSize: fs(15), fontWeight: '700' },
});
