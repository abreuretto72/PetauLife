/**
 * /trips/[id]/active — Dashboard da viagem ativa.
 *
 * Card grande "Dia X de Y em {cidade}" + atalhos pra registrar moments
 * (refeicao, banheiro, sono, passeio, brincadeira, primeira vez, foto) +
 * botao gigante de microfone pra IA classificar moment_type via voz.
 * Botao "Atendimento veterinario" abre /trips/[id]/consultation.
 *
 * Timeline de moments + diary entries + consultations no scroll.
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, Stethoscope, Utensils, Droplets, Moon, Footprints,
  PartyPopper, Sparkles, Camera, AlertTriangle, Mic, Clock,
} from 'lucide-react-native';

import { colors } from '../../../../constants/colors';
import { radii, spacing } from '../../../../constants/spacing';
import { rs, fs } from '../../../../hooks/useResponsive';
import { useToast } from '../../../../components/Toast';
import { VoiceInputButton } from '../../../../components/VoiceInputButton';
import { useTrip } from '../../../../hooks/useTrips';
import {
  useTripMoments, useCreateTripMoment, useCreateTripMomentFromVoice,
  type MomentType,
} from '../../../../hooks/useTripMoments';
import { useTripConsultations } from '../../../../hooks/useTripConsultation';
import { TRAVEL_RULES } from '../../../../data/travelRules';
import { getErrorMessage } from '../../../../utils/errorMessages';

const MOMENT_SHORTCUTS: { type: MomentType; Icon: typeof Utensils; key: string }[] = [
  { type: 'meal', Icon: Utensils, key: 'travel.moment.shortcut.meal' },
  { type: 'potty', Icon: Droplets, key: 'travel.moment.shortcut.potty' },
  { type: 'sleep', Icon: Moon, key: 'travel.moment.shortcut.sleep' },
  { type: 'walk', Icon: Footprints, key: 'travel.moment.shortcut.walk' },
  { type: 'play', Icon: PartyPopper, key: 'travel.moment.shortcut.play' },
  { type: 'first_time', Icon: Sparkles, key: 'travel.moment.shortcut.first_time' },
];

const MOMENT_TYPE_ICONS: Record<MomentType, typeof Utensils> = {
  meal: Utensils, potty: Droplets, sleep: Moon, walk: Footprints,
  play: PartyPopper, first_time: Sparkles, concern: AlertTriangle,
  photo_only: Camera, other: Clock,
};

export default function ActiveTripScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const { id: tripId } = useLocalSearchParams<{ id: string }>();
  const trip = useTrip(tripId);
  const moments = useTripMoments(tripId);
  const consultations = useTripConsultations(tripId);
  const createMoment = useCreateTripMoment();
  const createFromVoice = useCreateTripMomentFromVoice();
  const [showMic, setShowMic] = useState(false);

  const dayCounter = useMemo(() => {
    if (!trip.data) return null;
    const start = new Date(trip.data.start_date + 'T00:00:00');
    const end = new Date(trip.data.end_date + 'T00:00:00');
    const total = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const current = Math.max(1, Math.min(total, Math.round((today.getTime() - start.getTime()) / 86_400_000) + 1));
    return { current, total };
  }, [trip.data]);

  const handleShortcut = async (type: MomentType) => {
    if (!tripId || !trip.data) return;
    try {
      await createMoment.mutateAsync({
        tripId, petId: trip.data.pet_ids[0],
        momentType: type,
      });
      toast(t(`travel.moment.type.${type}`, { defaultValue: type }), 'success');
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    }
  };

  const handleVoiceMoment = async (text: string, isFinal: boolean) => {
    if (!isFinal || text.trim().length === 0) return;
    if (!trip.data) return;
    setShowMic(false);
    try {
      const res = await createFromVoice.mutateAsync({
        tripId: tripId!, petId: trip.data.pet_ids[0],
        transcript: text, locale: i18n.language,
      });
      console.log('[active] voice moment:', res.classification.moment_type);
      toast(t(`travel.moment.type.${res.moment.moment_type}`, { defaultValue: res.moment.moment_type }), 'success');
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    }
  };

  if (!trip.data) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.loadingBox}><ActivityIndicator size="large" color={colors.click} /></View>
      </SafeAreaView>
    );
  }

  const rule = TRAVEL_RULES[trip.data.destination_country_code];
  const flag = rule?.flag ?? '🌍';
  const country = rule
    ? t(rule.countryNameKey, { defaultValue: trip.data.destination_country_code })
    : trip.data.destination_country_code;
  const city = trip.data.destination_city ?? country;
  const totalMoments = moments.data?.length ?? 0;
  const totalConsultations = consultations.data?.length ?? 0;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={rs(22)} color={colors.click} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={s.title}>{flag} {city}</Text>
        <View style={{ width: rs(22) }} />
      </View>

      <ScrollView
        contentContainerStyle={s.body}
        refreshControl={
          <RefreshControl
            refreshing={moments.isRefetching || consultations.isRefetching}
            onRefresh={() => { moments.refetch(); consultations.refetch(); trip.refetch(); }}
            tintColor={colors.click}
          />
        }
      >
        {/* Day counter card */}
        {dayCounter && (
          <View style={s.dayCard}>
            <Text style={s.dayLabel}>
              {t('travel.active.day_counter', {
                current: dayCounter.current, total: dayCounter.total, city,
                defaultValue: `Dia ${dayCounter.current} de ${dayCounter.total} em ${city}`,
              })}
            </Text>
            <View style={s.statsRow}>
              <Text style={s.statTxt}>{totalMoments} {t('travel.return.stats.moments', { defaultValue: 'momentos' })}</Text>
              <Text style={s.statDot}>·</Text>
              <Text style={s.statTxt}>{totalConsultations} {t('travel.return.stats.consultations', { defaultValue: 'consultas' })}</Text>
            </View>
          </View>
        )}

        {/* Vet consultation big CTA */}
        <TouchableOpacity
          style={s.vetCta}
          onPress={() => router.push(`/(app)/trips/${tripId}/consultation` as never)}
          activeOpacity={0.85}
        >
          <Stethoscope size={rs(22)} color="#FFFFFF" strokeWidth={2} />
          <View style={{ flex: 1 }}>
            <Text style={s.vetCtaTitle}>{t('travel.consultation.tabs.record', { defaultValue: 'Atendimento veterinário' })}</Text>
            <Text style={s.vetCtaDesc}>{t('travel.consultation.share.show_screen', { defaultValue: 'Prontuário traduzido + tradutor' })}</Text>
          </View>
        </TouchableOpacity>

        {/* Moment logger */}
        <View style={s.loggerCard}>
          <Text style={s.loggerTitle}>{t('travel.active.log_moment', { defaultValue: 'Registrar momento' })}</Text>

          {showMic ? (
            <View style={s.micWrap}>
              <VoiceInputButton
                onTranscript={handleVoiceMoment}
                onError={(m) => toast(m, 'warning')}
                size="large"
                lang={i18n.language}
                disabled={createFromVoice.isPending}
              />
              <TouchableOpacity onPress={() => setShowMic(false)} style={s.micCancel}>
                <Text style={s.micCancelTxt}>{t('common.cancel', { defaultValue: 'Cancelar' })}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity style={s.micRow} onPress={() => setShowMic(true)} activeOpacity={0.85}>
                <Mic size={rs(20)} color={colors.click} strokeWidth={2} />
                <Text style={s.micRowTxt}>{t('travel.active.log_moment', { defaultValue: 'Toque para falar' })}</Text>
              </TouchableOpacity>
              <View style={s.shortcutsRow}>
                {MOMENT_SHORTCUTS.map(({ type, Icon, key }) => (
                  <TouchableOpacity
                    key={type}
                    style={s.shortcut}
                    onPress={() => handleShortcut(type)}
                    activeOpacity={0.7}
                    disabled={createMoment.isPending}
                  >
                    <Icon size={rs(20)} color={colors.click} strokeWidth={1.8} />
                    <Text style={s.shortcutTxt}>{t(key, { defaultValue: type })}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Timeline */}
        <Text style={s.sectionTitle}>{t('travel.active.timeline.title', { defaultValue: 'Linha do tempo' })}</Text>
        {moments.isLoading ? (
          <ActivityIndicator size="small" color={colors.click} style={{ marginTop: rs(20) }} />
        ) : (moments.data ?? []).length === 0 ? (
          <Text style={s.emptyTxt}>{t('travel.checklist.no_items', { defaultValue: 'Nada registrado ainda.' })}</Text>
        ) : (moments.data ?? []).map((m) => {
          const Icon = MOMENT_TYPE_ICONS[m.moment_type] ?? Clock;
          return (
            <View key={m.id} style={s.timelineCard}>
              <View style={s.timelineIcon}>
                <Icon size={rs(16)} color={colors.click} strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.timelineType}>
                  {t(`travel.moment.type.${m.moment_type}`, { defaultValue: m.moment_type })}
                </Text>
                {m.notes ? <Text style={s.timelineNotes} numberOfLines={2}>{m.notes}</Text> : null}
                <Text style={s.timelineTime}>
                  {new Date(m.created_at).toLocaleTimeString(i18n.language === 'pt-BR' ? 'pt-BR' : i18n.language, { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  title: { color: colors.text, fontSize: fs(15), fontWeight: '700' },
  body: { padding: spacing.md, paddingBottom: rs(40) },
  dayCard: {
    padding: spacing.md, marginBottom: rs(12),
    backgroundColor: colors.card, borderRadius: radii.card,
    borderWidth: 1, borderColor: colors.border, gap: rs(6),
  },
  dayLabel: { color: colors.text, fontSize: fs(16), fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: rs(6), alignItems: 'center' },
  statTxt: { color: colors.textSec, fontSize: fs(12) },
  statDot: { color: colors.textDim },
  vetCta: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    padding: spacing.md, marginBottom: rs(12),
    backgroundColor: colors.click, borderRadius: radii.lg,
  },
  vetCtaTitle: { color: '#FFFFFF', fontSize: fs(15), fontWeight: '700' },
  vetCtaDesc: { color: '#FFFFFF', fontSize: fs(12), opacity: 0.85, marginTop: rs(2) },
  loggerCard: {
    padding: spacing.md, marginBottom: rs(16),
    backgroundColor: colors.card, borderRadius: radii.card,
    borderWidth: 1, borderColor: colors.border, gap: rs(12),
  },
  loggerTitle: { color: colors.text, fontSize: fs(13), fontWeight: '700' },
  micRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(8),
    paddingVertical: rs(16), backgroundColor: colors.clickSoft, borderRadius: radii.lg,
  },
  micRowTxt: { color: colors.click, fontSize: fs(14), fontWeight: '700' },
  shortcutsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: rs(8) },
  shortcut: {
    width: '31%', minWidth: rs(96),
    aspectRatio: 1.4, alignItems: 'center', justifyContent: 'center', gap: rs(6),
    backgroundColor: colors.bgCard, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  shortcutTxt: { color: colors.text, fontSize: fs(11), fontWeight: '600' },
  micWrap: { alignItems: 'center', gap: rs(12), paddingVertical: rs(10) },
  micCancel: { padding: rs(8) },
  micCancelTxt: { color: colors.textDim, fontSize: fs(12), fontWeight: '600' },
  sectionTitle: { color: colors.text, fontSize: fs(13), fontWeight: '700', marginBottom: rs(10), marginTop: rs(8) },
  emptyTxt: { color: colors.textDim, fontSize: fs(12), textAlign: 'center', padding: rs(20) },
  timelineCard: {
    flexDirection: 'row', alignItems: 'center', gap: rs(10),
    padding: spacing.sm, marginBottom: rs(8),
    backgroundColor: colors.card, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border,
  },
  timelineIcon: {
    width: rs(32), height: rs(32), borderRadius: rs(16),
    backgroundColor: colors.clickSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  timelineType: { color: colors.text, fontSize: fs(13), fontWeight: '700' },
  timelineNotes: { color: colors.textSec, fontSize: fs(12), marginTop: rs(2) },
  timelineTime: { color: colors.textDim, fontSize: fs(10), marginTop: rs(2) },
});
