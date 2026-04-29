/**
 * /trips/[id]/consultation — Tela de atendimento veterinario.
 *
 * 3 modos via tabs no topo: Prontuario | Conversa | Compartilhar.
 *   - Prontuario: usePetMedicalRecord (cache 60d). Botao "abrir completo" usa
 *     Print.printAsync com rendered_html.
 *   - Conversa: walkie-talkie de 2 botoes push-to-talk. STT via useSimpleSTT,
 *     traducao via translate-vet-conversation.
 *   - Compartilhar: gera link publico com token 24h via useShareConsultation.
 *
 * Pre-requisito: usuario abre essa tela passando vet_locale (idioma do vet).
 * Se ainda nao escolheu, mostra picker de idioma com top candidatos pelo pais.
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as Print from 'expo-print';
import {
  ChevronLeft, FileText, MessageCircle, Share2, Mic, RefreshCw,
  AlertTriangle, Check, Globe, Copy, Printer,
} from 'lucide-react-native';

import { colors } from '../../../../constants/colors';
import { radii, spacing } from '../../../../constants/spacing';
import { rs, fs } from '../../../../hooks/useResponsive';
import { useToast } from '../../../../components/Toast';
import { useSimpleSTT } from '../../../../hooks/useSimpleSTT';
import { useTrip } from '../../../../hooks/useTrips';
import { usePetMedicalRecord, useRegeneratePetMedicalRecord } from '../../../../hooks/usePetMedicalRecord';
import {
  useCreateConsultation, useTripConsultation, useTranslateConversationTurn,
  useEndConsultation, useShareConsultation,
} from '../../../../hooks/useTripConsultation';
import { TRAVEL_RULES } from '../../../../data/travelRules';
import { getErrorMessage } from '../../../../utils/errorMessages';

// Top candidatos de idioma do vet por pais de destino
const VET_LOCALE_BY_COUNTRY: Record<string, string[]> = {
  DE: ['de-DE', 'en-US'], FR: ['fr-FR', 'en-US'], IT: ['it-IT', 'en-US'],
  ES: ['es-ES', 'en-US'], PT: ['pt-PT', 'en-US'], NL: ['nl-NL', 'en-US'],
  BE: ['nl-BE', 'fr-BE', 'en-US'], AT: ['de-AT', 'en-US'],
  IE: ['en-IE', 'en-US'], GR: ['el-GR', 'en-US'], SE: ['sv-SE', 'en-US'],
  GB: ['en-GB', 'en-US'], US: ['en-US'], CA: ['en-CA', 'fr-CA'],
  MX: ['es-MX', 'en-US'], JP: ['ja-JP', 'en-US'], AU: ['en-AU', 'en-US'],
  NZ: ['en-NZ', 'en-US'], AE: ['ar-AE', 'en-US'], CH: ['de-CH', 'fr-CH', 'it-CH', 'en-US'],
  AR: ['es-AR', 'en-US'], UY: ['es-UY', 'es-MX'], PY: ['es-PY', 'es-MX'],
  CL: ['es-CL', 'es-MX'], CO: ['es-CO', 'es-MX'], BR: ['pt-BR'],
};

const LOCALE_LABELS: Record<string, { flag: string; name: string }> = {
  'de-DE': { flag: '🇩🇪', name: 'Deutsch' }, 'fr-FR': { flag: '🇫🇷', name: 'Français' },
  'it-IT': { flag: '🇮🇹', name: 'Italiano' }, 'es-ES': { flag: '🇪🇸', name: 'Español (ES)' },
  'es-MX': { flag: '🇲🇽', name: 'Español (MX)' }, 'es-AR': { flag: '🇦🇷', name: 'Español (AR)' },
  'es-CL': { flag: '🇨🇱', name: 'Español (CL)' }, 'es-CO': { flag: '🇨🇴', name: 'Español (CO)' },
  'es-UY': { flag: '🇺🇾', name: 'Español (UY)' }, 'es-PY': { flag: '🇵🇾', name: 'Español (PY)' },
  'pt-PT': { flag: '🇵🇹', name: 'Português (PT)' }, 'pt-BR': { flag: '🇧🇷', name: 'Português (BR)' },
  'nl-NL': { flag: '🇳🇱', name: 'Nederlands' }, 'nl-BE': { flag: '🇧🇪', name: 'Nederlands (BE)' },
  'fr-BE': { flag: '🇧🇪', name: 'Français (BE)' }, 'fr-CA': { flag: '🇨🇦', name: 'Français (CA)' },
  'de-AT': { flag: '🇦🇹', name: 'Deutsch (AT)' }, 'de-CH': { flag: '🇨🇭', name: 'Deutsch (CH)' },
  'fr-CH': { flag: '🇨🇭', name: 'Français (CH)' }, 'it-CH': { flag: '🇨🇭', name: 'Italiano (CH)' },
  'el-GR': { flag: '🇬🇷', name: 'Ελληνικά' }, 'sv-SE': { flag: '🇸🇪', name: 'Svenska' },
  'en-US': { flag: '🇺🇸', name: 'English (US)' }, 'en-GB': { flag: '🇬🇧', name: 'English (UK)' },
  'en-IE': { flag: '🇮🇪', name: 'English (IE)' }, 'en-AU': { flag: '🇦🇺', name: 'English (AU)' },
  'en-NZ': { flag: '🇳🇿', name: 'English (NZ)' }, 'en-CA': { flag: '🇨🇦', name: 'English (CA)' },
  'ja-JP': { flag: '🇯🇵', name: '日本語' }, 'ar-AE': { flag: '🇦🇪', name: 'العربية' },
};

type Mode = 'record' | 'conversation' | 'share';

export default function ConsultationScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { toast, confirm } = useToast();
  const params = useLocalSearchParams<{ id: string; consultationId?: string }>();
  const tripId = params.id as string;

  const trip = useTrip(tripId);
  const petId = trip.data?.pet_ids[0];
  const destinationCountry = trip.data?.destination_country_code ?? '';

  const candidateLocales = VET_LOCALE_BY_COUNTRY[destinationCountry] ?? ['en-US'];
  const [vetLocale, setVetLocale] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('record');
  const [consultationId, setConsultationId] = useState<string | null>(params.consultationId ?? null);

  const createCons = useCreateConsultation();
  const consultation = useTripConsultation(consultationId ?? undefined);
  const translateTurn = useTranslateConversationTurn();
  const endCons = useEndConsultation();
  const shareCons = useShareConsultation();

  const medicalRecord = usePetMedicalRecord(petId, vetLocale ?? 'en-US', tripId);
  const regenRecord = useRegeneratePetMedicalRecord();

  // ── Conversation: STT push-to-talk ─────────────────────────────────────
  const [activeSpeaker, setActiveSpeaker] = useState<'tutor' | 'vet' | null>(null);
  const [transcript, setTranscript] = useState('');
  const [translating, setTranslating] = useState(false);
  const stt = useSimpleSTT({
    lang: activeSpeaker === 'tutor' ? i18n.language : (vetLocale ?? 'en-US'),
    onTranscript: (text, isFinal) => {
      setTranscript(text);
      if (isFinal && activeSpeaker && text.trim().length > 0) {
        handleTranslate(activeSpeaker, text);
      }
    },
    onError: (m) => toast(m, 'warning'),
  });

  const handleTranslate = useCallback(async (speaker: 'tutor' | 'vet', text: string) => {
    if (!vetLocale) return;
    setTranslating(true);
    try {
      // Cria consulta lazy se ainda nao tiver
      let cId = consultationId;
      if (!cId) {
        const created = await createCons.mutateAsync({ tripId, petId: petId ?? undefined, vetLocale });
        cId = created.id;
        setConsultationId(cId);
      }
      const res = await translateTurn.mutateAsync({
        consultationId: cId, tripId,
        utteranceText: text, speaker,
        tutorLocale: i18n.language, vetLocale,
      });
      console.log('[consultation] translated turn:', res.translated_text.slice(0, 60));
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    } finally {
      setTranslating(false);
      setTranscript('');
      setActiveSpeaker(null);
    }
  }, [consultationId, tripId, petId, vetLocale, i18n.language, createCons, translateTurn, toast]);

  const startSpeaking = (who: 'tutor' | 'vet') => {
    if (translating || activeSpeaker) return;
    setActiveSpeaker(who);
    stt.toggle();
  };
  const stopSpeaking = () => {
    if (stt.isListening) stt.stop();
    // Se nao houve final ainda, deixa o handler de transcript final fechar.
    if (!translating) setActiveSpeaker(null);
  };

  // ── Print do prontuario completo ───────────────────────────────────────
  const handlePrintRecord = async () => {
    const html = medicalRecord.data?.rendered_html;
    if (!html) {
      toast(t('travel.consultation.preparing_record'), 'info');
      return;
    }
    try {
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      console.log('[consultation] print uri:', uri);
      await Print.printAsync({ uri });
    } catch (e) {
      console.warn('[consultation] print failed:', e);
      toast(getErrorMessage(e), 'error');
    }
  };

  // ── End consultation ───────────────────────────────────────────────────
  const handleEnd = async () => {
    if (!consultationId) {
      router.back();
      return;
    }
    const yes = await confirm({
      text: t('travel.consultation.end.confirm', { defaultValue: 'Encerrar consulta? O resumo será gerado.' }),
      type: 'info',
    });
    if (!yes) return;
    try {
      await endCons.mutateAsync(consultationId);
      toast(t('travel.consultation.end.title', { defaultValue: 'Consulta encerrada.' }), 'success');
      router.back();
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    }
  };

  // ── Share via link público ──────────────────────────────────────────────
  const handleShareLink = async (hours: 1 | 24 | 168) => {
    if (!consultationId) {
      // cria consulta vazia com vet_locale apenas pra ter id pra anexar token
      try {
        const created = await createCons.mutateAsync({ tripId, petId: petId ?? undefined, vetLocale: vetLocale! });
        setConsultationId(created.id);
        const share = await shareCons.mutateAsync({
          consultationId: created.id, expiresInHours: hours,
          medicalRecordSnapshotId: medicalRecord.data?.id ?? undefined,
        });
        await Share.share({ message: share.publicUrl, url: share.publicUrl });
      } catch (e) {
        toast(getErrorMessage(e), 'error');
      }
      return;
    }
    try {
      const share = await shareCons.mutateAsync({
        consultationId, expiresInHours: hours,
        medicalRecordSnapshotId: medicalRecord.data?.id ?? undefined,
      });
      await Share.share({ message: share.publicUrl, url: share.publicUrl });
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    }
  };

  // ── Render: idioma picker ───────────────────────────────────────────────
  if (!vetLocale) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <ChevronLeft size={rs(22)} color={colors.click} strokeWidth={1.8} />
          </TouchableOpacity>
          <Text style={s.title}>{t('travel.consultation.choose_vet_language', { defaultValue: 'Idioma do veterinário' })}</Text>
          <View style={{ width: rs(22) }} />
        </View>
        <ScrollView contentContainerStyle={s.localeGrid}>
          <Globe size={rs(36)} color={colors.click} strokeWidth={1.8} style={{ alignSelf: 'center', marginBottom: rs(20) }} />
          {candidateLocales.map((loc) => {
            const meta = LOCALE_LABELS[loc] ?? { flag: '🌍', name: loc };
            return (
              <TouchableOpacity key={loc} style={s.localeCard} onPress={() => setVetLocale(loc)} activeOpacity={0.7}>
                <Text style={s.localeFlag}>{meta.flag}</Text>
                <Text style={s.localeName}>{meta.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Render: tabs + modo ─────────────────────────────────────────────────
  const turns = consultation.data?.conversation_log ?? [];

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={rs(22)} color={colors.click} strokeWidth={1.8} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.title}>{LOCALE_LABELS[vetLocale]?.flag ?? '🌍'} {LOCALE_LABELS[vetLocale]?.name ?? vetLocale}</Text>
        </View>
        {consultationId ? (
          <TouchableOpacity onPress={handleEnd} hitSlop={12}>
            <Text style={s.endBtn}>{t('common.close', { defaultValue: 'Encerrar' })}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: rs(22) }} />
        )}
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {([
          ['record', FileText, t('travel.consultation.tabs.record', { defaultValue: 'Prontuário' })],
          ['conversation', MessageCircle, t('travel.consultation.tabs.conversation', { defaultValue: 'Conversa' })],
          ['share', Share2, t('travel.consultation.tabs.share', { defaultValue: 'Compartilhar' })],
        ] as const).map(([id, Icon, label]) => (
          <TouchableOpacity key={id} style={[s.tabBtn, mode === id && s.tabBtnActive]} onPress={() => setMode(id)} activeOpacity={0.7}>
            <Icon size={rs(16)} color={mode === id ? '#FFFFFF' : colors.click} strokeWidth={1.8} />
            <Text style={[s.tabTxt, mode === id && s.tabTxtActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Body */}
      {mode === 'record' && (
        <ScrollView contentContainerStyle={s.body}>
          {medicalRecord.isLoading ? (
            <View style={s.loadingBox}>
              <ActivityIndicator size="large" color={colors.click} />
              <Text style={s.loadingTxt}>{t('travel.consultation.preparing_record', { defaultValue: 'Preparing medical record...' })}</Text>
            </View>
          ) : medicalRecord.data ? (
            <>
              <RecordSummary recordData={medicalRecord.data.record} />
              <TouchableOpacity style={s.cta} onPress={handlePrintRecord} activeOpacity={0.85}>
                <Printer size={rs(16)} color="#FFFFFF" strokeWidth={2} />
                <Text style={s.ctaTxt}>{t('travel.consultation.share.show_screen', { defaultValue: 'Abrir prontuário completo' })}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.cta, s.ctaSecondary]} onPress={() => regenRecord.mutateAsync({ petId: petId!, targetLocale: vetLocale, tripId })} activeOpacity={0.85}>
                {regenRecord.isPending
                  ? <ActivityIndicator size="small" color={colors.click} />
                  : <RefreshCw size={rs(16)} color={colors.click} strokeWidth={2} />}
                <Text style={[s.ctaTxt, { color: colors.click }]}>{t('common.refresh', { defaultValue: 'Atualizar' })}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={s.errorBox}>
              <AlertTriangle size={rs(28)} color={colors.warning} strokeWidth={1.6} />
              <Text style={s.errorTxt}>{t('travel.document.extraction_failed', { defaultValue: 'Não foi possível preparar o prontuário.' })}</Text>
            </View>
          )}
        </ScrollView>
      )}

      {mode === 'conversation' && (
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={s.convoLog}>
            {turns.length === 0 ? (
              <Text style={s.convoEmpty}>{t('travel.consultation.conversation.tutor_button', { defaultValue: 'Segure um botão e fale.' })}</Text>
            ) : turns.map((turn) => (
              <View key={turn.id} style={[s.bubble, turn.speaker === 'tutor' ? s.bubbleTutor : s.bubbleVet]}>
                <Text style={s.bubbleSpeaker}>{turn.speaker === 'tutor' ? '🇧🇷' : LOCALE_LABELS[vetLocale]?.flag ?? '🌍'}</Text>
                <Text style={s.bubbleOriginal}>{turn.original_text}</Text>
                <Text style={s.bubbleTranslated}>→ {turn.translated_text}</Text>
              </View>
            ))}
            {transcript && activeSpeaker ? (
              <View style={[s.bubble, s.bubbleLive]}>
                <Text style={s.bubbleOriginal}>{transcript}</Text>
              </View>
            ) : null}
            {translating ? (
              <View style={s.translatingRow}>
                <ActivityIndicator size="small" color={colors.click} />
                <Text style={s.translatingTxt}>{t('travel.consultation.conversation.translating', { defaultValue: 'Traduzindo...' })}</Text>
              </View>
            ) : null}
          </ScrollView>
          <View style={s.walkieRow}>
            <TouchableOpacity
              style={[s.walkieBtn, s.walkieTutor, activeSpeaker === 'tutor' && s.walkieActive]}
              onPressIn={() => startSpeaking('tutor')}
              onPressOut={stopSpeaking}
              activeOpacity={0.85}
            >
              <Text style={s.walkieFlag}>🇧🇷</Text>
              <Text style={s.walkieLabel}>{t('travel.consultation.conversation.tutor_button', { defaultValue: 'Eu falo' })}</Text>
              <Mic size={rs(20)} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.walkieBtn, s.walkieVet, activeSpeaker === 'vet' && s.walkieActive]}
              onPressIn={() => startSpeaking('vet')}
              onPressOut={stopSpeaking}
              activeOpacity={0.85}
            >
              <Text style={s.walkieFlag}>{LOCALE_LABELS[vetLocale]?.flag ?? '🌍'}</Text>
              <Text style={s.walkieLabel}>{t('travel.consultation.conversation.vet_button', { defaultValue: 'Vet fala' })}</Text>
              <Mic size={rs(20)} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {mode === 'share' && (
        <ScrollView contentContainerStyle={s.body}>
          <Text style={s.shareIntro}>{t('travel.consultation.share.public_link', { defaultValue: 'Gerar link público temporário do prontuário' })}</Text>
          {([
            [1, t('travel.consultation.share.public_link.expiry.1h', { defaultValue: '1 hora' })],
            [24, t('travel.consultation.share.public_link.expiry.24h', { defaultValue: '24 horas' })],
            [168, t('travel.consultation.share.public_link.expiry.7d', { defaultValue: '7 dias' })],
          ] as const).map(([h, label]) => (
            <TouchableOpacity
              key={h}
              style={[s.cta, s.ctaSecondary, { marginBottom: rs(10) }]}
              onPress={() => handleShareLink(h as 1 | 24 | 168)}
              disabled={shareCons.isPending}
              activeOpacity={0.85}
            >
              {shareCons.isPending
                ? <ActivityIndicator size="small" color={colors.click} />
                : <Share2 size={rs(16)} color={colors.click} strokeWidth={2} />}
              <Text style={[s.ctaTxt, { color: colors.click }]}>{label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.cta} onPress={handlePrintRecord} activeOpacity={0.85}>
            <Printer size={rs(16)} color="#FFFFFF" strokeWidth={2} />
            <Text style={s.ctaTxt}>{t('travel.consultation.share.export_pdf', { defaultValue: 'Exportar PDF' })}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────────────

function RecordSummary({ recordData }: { recordData: Record<string, unknown> }) {
  const r = recordData as any;
  const p = r?.pet ?? {};
  const h = r?.health ?? {};
  return (
    <View style={s.summary}>
      <Text style={s.petName}>{p.name ?? '—'}</Text>
      <Text style={s.petMeta}>{[p.species_label, p.breed, p.age_label].filter(Boolean).join(' · ')}</Text>
      <View style={s.divider} />
      {(h.allergies?.length ?? 0) > 0 && (
        <SummaryBlock label="Allergies" items={h.allergies.map((a: any) => a.item + (a.severity_label ? ` (${a.severity_label})` : ''))} danger />
      )}
      {(h.current_medications?.length ?? 0) > 0 && (
        <SummaryBlock label="Medications" items={h.current_medications.map((m: any) => `${m.name_brand}${m.name_generic ? ' (' + m.name_generic + ')' : ''} — ${m.dosage}, ${m.frequency_label}`)} />
      )}
      {(r?.vaccinations?.length ?? 0) > 0 && (
        <SummaryBlock label="Vaccinations" items={r.vaccinations.map((v: any) => `${v.vaccine_name}${v.last_dose_date ? ' — ' + v.last_dose_date : ''}`)} />
      )}
      {p.microchip_number && <SummaryBlock label="Microchip" items={[p.microchip_number]} />}
    </View>
  );
}

function SummaryBlock({ label, items, danger }: { label: string; items: string[]; danger?: boolean }) {
  return (
    <View style={s.summaryBlock}>
      <Text style={[s.summaryLabel, danger && { color: colors.danger }]}>{label}</Text>
      {items.map((it, i) => (
        <Text key={i} style={s.summaryItem}>• {it}</Text>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  title: { color: colors.text, fontSize: fs(15), fontWeight: '700' },
  endBtn: { color: colors.danger, fontSize: fs(13), fontWeight: '700' },
  tabs: {
    flexDirection: 'row', gap: rs(6),
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6),
    paddingVertical: rs(8), borderRadius: radii.md, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
  },
  tabBtnActive: { backgroundColor: colors.click, borderColor: colors.click },
  tabTxt: { color: colors.text, fontSize: fs(11), fontWeight: '700' },
  tabTxtActive: { color: '#FFFFFF' },
  body: { padding: spacing.md, paddingBottom: rs(40) },
  loadingBox: { alignItems: 'center', justifyContent: 'center', padding: rs(40), gap: rs(12) },
  loadingTxt: { color: colors.textSec, fontSize: fs(13), textAlign: 'center' },
  errorBox: { alignItems: 'center', gap: rs(12), padding: rs(20) },
  errorTxt: { color: colors.text, fontSize: fs(13), textAlign: 'center' },
  summary: { marginBottom: spacing.md },
  petName: { color: colors.text, fontSize: fs(22), fontWeight: '800' },
  petMeta: { color: colors.textSec, fontSize: fs(13), marginTop: rs(2) },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: rs(14) },
  summaryBlock: { marginBottom: rs(12) },
  summaryLabel: { color: colors.textDim, fontSize: fs(11), fontWeight: '700', letterSpacing: 1.2, marginBottom: rs(4) },
  summaryItem: { color: colors.text, fontSize: fs(13), lineHeight: fs(20) },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8),
    backgroundColor: colors.click, paddingVertical: rs(14), borderRadius: radii.lg,
    marginTop: rs(8),
  },
  ctaSecondary: { backgroundColor: colors.clickSoft },
  ctaTxt: { color: '#FFFFFF', fontSize: fs(14), fontWeight: '700' },
  // Convo
  convoLog: { padding: spacing.md, paddingBottom: rs(160) },
  convoEmpty: { color: colors.textDim, fontSize: fs(13), textAlign: 'center', padding: rs(40) },
  bubble: {
    padding: spacing.md, marginBottom: rs(10),
    backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, gap: rs(6),
  },
  bubbleTutor: { alignSelf: 'flex-start', maxWidth: '90%' },
  bubbleVet: { alignSelf: 'flex-end', maxWidth: '90%', backgroundColor: colors.clickSoft },
  bubbleLive: { borderColor: colors.click, borderStyle: 'dashed', backgroundColor: colors.click + '08' },
  bubbleSpeaker: { fontSize: fs(16) },
  bubbleOriginal: { color: colors.text, fontSize: fs(14), fontWeight: '600' },
  bubbleTranslated: { color: colors.textSec, fontSize: fs(13), fontStyle: 'italic' },
  translatingRow: { flexDirection: 'row', alignItems: 'center', gap: rs(8), padding: rs(10) },
  translatingTxt: { color: colors.textSec, fontSize: fs(12) },
  walkieRow: {
    flexDirection: 'row', gap: rs(10), padding: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg,
  },
  walkieBtn: {
    flex: 1, alignItems: 'center', gap: rs(6), paddingVertical: rs(20),
    backgroundColor: colors.click, borderRadius: radii.lg,
  },
  walkieTutor: { backgroundColor: colors.click },
  walkieVet: { backgroundColor: colors.petrol },
  walkieActive: { backgroundColor: colors.danger, transform: [{ scale: 0.97 }] },
  walkieFlag: { fontSize: fs(28) },
  walkieLabel: { color: '#FFFFFF', fontSize: fs(13), fontWeight: '700' },
  // Locale picker
  localeGrid: { padding: spacing.lg, gap: rs(10) },
  localeCard: {
    flexDirection: 'row', alignItems: 'center', gap: rs(14),
    padding: spacing.md, backgroundColor: colors.card,
    borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border,
  },
  localeFlag: { fontSize: fs(28) },
  localeName: { color: colors.text, fontSize: fs(15), fontWeight: '600' },
  shareIntro: { color: colors.textSec, fontSize: fs(13), marginBottom: rs(14), textAlign: 'center' },
});
