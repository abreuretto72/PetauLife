/**
 * /trips/[id]/concierge — Roteiro IA (concierge v1).
 *
 * Botao gigante "Gerar roteiro com IA" se ainda nao tem plano ativo. Caso
 * contrario, mostra cards de transporte, hoteis, servicos pet, documentos,
 * checklist, timeline, budget e dicas. Tap em qualquer link → Linking.openURL
 * (browser nativo).
 *
 * Latencia da geracao: 60-120s (Opus 4.7 + web_search). UI mostra spinner
 * com mensagem explicita.
 */
import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator,
  Linking, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, Sparkles, Plane, Car, Bus, Train, Ship, MoreHorizontal,
  Hotel, Package, FileCheck2, ListChecks, Clock, DollarSign, Lightbulb,
  ExternalLink, RefreshCw, AlertTriangle,
} from 'lucide-react-native';

import { colors } from '../../../../constants/colors';
import { radii, spacing } from '../../../../constants/spacing';
import { rs, fs } from '../../../../hooks/useResponsive';
import { useToast } from '../../../../components/Toast';
import { useTrip } from '../../../../hooks/useTrips';
import {
  useTripConcierge, useGenerateConcierge, useUpdateConciergeSelection,
  type ConciergePlanData, type ConciergeFlight, type ConciergeHotel,
  type ConciergeBus, type ConciergeTrain, type ConciergeShip, type ConciergeCarStage,
} from '../../../../hooks/useTripConcierge';
import { getErrorMessage } from '../../../../utils/errorMessages';
import type { TransportMode } from '../../../../types/trip';
import AiWaitTipsCarousel from '../../../../components/AiWaitTipsCarousel';
import { getTravelTipsForCountry } from '../../../../constants/petTravelTipsByCountry';

const TRANSPORT_ICONS: Record<TransportMode, typeof Plane> = {
  plane: Plane, car: Car, bus: Bus, train: Train, ship: Ship, other: MoreHorizontal,
};

const openUrl = async (url?: string, toast?: (m: string, t?: any) => void) => {
  if (!url) return;
  try {
    const can = await Linking.canOpenURL(url);
    if (!can) throw new Error('cannot_open');
    await Linking.openURL(url);
  } catch (e) {
    console.warn('[concierge] openURL failed:', e);
    toast?.('Não foi possível abrir o link.', 'warning');
  }
};

export default function TripConciergeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const { id: tripId } = useLocalSearchParams<{ id: string }>();
  const trip = useTrip(tripId);
  const concierge = useTripConcierge(tripId);
  const generate = useGenerateConcierge();
  const updateSelection = useUpdateConciergeSelection();

  const transport = (trip.data?.transport_mode ?? 'plane') as TransportMode;
  const TransportIcon = TRANSPORT_ICONS[transport];
  const plan = concierge.data?.plan_data;

  // Dicas de viagem com pet pro pais de destino — usadas no carrossel
  // enquanto o concierge IA monta o roteiro (60-120s).
  const destCountryCode = trip.data?.destination_country_code ?? '';
  const travelTips = useMemo(
    () => getTravelTipsForCountry(destCountryCode, i18n.language),
    [destCountryCode, i18n.language],
  );

  const handleGenerate = async () => {
    if (!tripId) return;
    try {
      await generate.mutateAsync({ tripId, locale: i18n.language });
      toast(t('travelConcierge.generated', { defaultValue: 'Roteiro pronto.' }), 'success');
    } catch (e) {
      // Tom Elite: mensagem factual, sem culpar o tutor. Inclui request_id pra suporte.
      const requestId = (e as any)?.requestId ?? '';
      const efError = (e as any)?.message ?? '';
      const baseMsg = getErrorMessage(e);
      const enriched = requestId
        ? `${baseMsg}\nID: ${String(requestId).slice(0, 8)}`
        : (efError && efError !== 'concierge_failed' ? `${baseMsg}` : baseMsg);
      console.warn('[concierge] handleGenerate failed |',
        'requestId:', requestId,
        '| efError:', efError,
        '| toast:', enriched,
      );
      toast(enriched, 'error');
    }
  };

  const handleSelect = async (kind: 'flight' | 'hotel' | 'pet_transport', idx: number) => {
    if (!concierge.data) return;
    try {
      await updateSelection.mutateAsync({
        planId: concierge.data.id, tripId: concierge.data.trip_id,
        selectedFlightIdx: kind === 'flight' ? idx : undefined,
        selectedHotelIdx: kind === 'hotel' ? idx : undefined,
        selectedPetTransportIdx: kind === 'pet_transport' ? idx : undefined,
      });
    } catch (e) {
      toast(getErrorMessage(e), 'error');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={rs(22)} color={colors.click} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={s.title}>
          <Sparkles size={rs(14)} color={colors.ai} strokeWidth={2} />
          {' '}{t('travelConcierge.title', { defaultValue: 'Roteiro com IA' })}
        </Text>
        <View style={{ width: rs(22) }} />
      </View>

      {concierge.isLoading ? (
        <View style={s.loadingBox}><ActivityIndicator size="large" color={colors.click} /></View>
      ) : !plan ? (
        // ── Ainda sem plano: tela de geracao ──────────────────────────────
        <View style={s.empty}>
          <View style={s.emptyIcon}>
            <Sparkles size={rs(40)} color={colors.ai} strokeWidth={1.6} />
          </View>
          <Text style={s.emptyTitle}>
            {t('travelConcierge.empty.title', { defaultValue: 'Deixe a IA preparar tudo pra você' })}
          </Text>
          <Text style={s.emptyDesc}>
            {t('travelConcierge.empty.desc', {
              defaultValue: 'Em ~1 minuto a IA pesquisa voos/transporte, hotéis pet-friendly, agentes especializados, documentos exigidos, checklist do que levar e estimativa de orçamento. Você só escolhe.',
            })}
          </Text>
          {generate.isPending ? (
            <View style={s.generating}>
              <ActivityIndicator size="large" color={colors.ai} />
              <Text style={s.generatingTxt}>
                {t('travelConcierge.generating', { defaultValue: 'A IA está pesquisando opções na web...' })}
              </Text>
              <Text style={s.generatingSub}>
                {t('travelConcierge.generating_sub', { defaultValue: 'Isso pode levar 1 a 2 minutos.' })}
              </Text>
              <View style={s.tipsCarouselWrap}>
                <AiWaitTipsCarousel
                  tips={travelTips}
                  accentColor={colors.ai}
                  Icon={Lightbulb}
                  title={t('travelConcierge.tips_title', {
                    defaultValue: 'Enquanto isso, dicas para viajar com pet',
                  })}
                />
              </View>
            </View>
          ) : (
            <TouchableOpacity style={s.cta} onPress={handleGenerate} activeOpacity={0.85}>
              <Sparkles size={rs(18)} color="#FFFFFF" strokeWidth={2} />
              <Text style={s.ctaTxt}>
                {t('travelConcierge.generate_button', { defaultValue: 'Gerar roteiro' })}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        // ── Plano gerado: cards ────────────────────────────────────────────
        <ScrollView
          contentContainerStyle={s.body}
          refreshControl={
            <RefreshControl refreshing={concierge.isFetching} onRefresh={concierge.refetch} tintColor={colors.click} />
          }
        >
          {/* Confidence banner */}
          {concierge.data?.confidence_level && concierge.data.confidence_level !== 'high' && (
            <View style={s.confidenceBanner}>
              <AlertTriangle size={rs(14)} color={colors.warning} strokeWidth={2} />
              <Text style={s.confidenceTxt}>
                {concierge.data.confidence_level === 'medium'
                  ? t('travelConcierge.confidence.medium', { defaultValue: 'Confiança média. Confirme detalhes diretamente nos sites antes de reservar.' })
                  : t('travelConcierge.confidence.low', { defaultValue: 'Confiança baixa. Use como ponto de partida e valide com agentes especializados.' })}
              </Text>
            </View>
          )}

          {/* Transporte (varia por modo) */}
          <SectionHeader Icon={TransportIcon} title={t(`travel.transport.${transport}`, { defaultValue: transport })} />
          {transport === 'plane' && (plan.flights ?? []).map((f, i) => (
            <FlightCard key={i} flight={f} selected={concierge.data?.selected_flight_idx === i}
              onSelect={() => handleSelect('flight', i)} onOpen={() => openUrl(f.search_url, toast)} />
          ))}
          {transport === 'car' && (plan.car_route ?? []).map((stg, i) => (
            <CarStageCard key={i} stage={stg} onOpen={() => openUrl(stg.search_url, toast)} />
          ))}
          {transport === 'bus' && (plan.bus_options ?? []).map((b, i) => (
            <BusCard key={i} bus={b} onOpen={() => openUrl(b.search_url, toast)} />
          ))}
          {transport === 'train' && (plan.train_options ?? []).map((tr, i) => (
            <TrainCard key={i} train={tr} onOpen={() => openUrl(tr.search_url, toast)} />
          ))}
          {transport === 'ship' && (plan.ship_options ?? []).map((sh, i) => (
            <ShipCard key={i} ship={sh} onOpen={() => openUrl(sh.search_url, toast)} />
          ))}

          {/* Hoteis */}
          {(plan.hotels?.length ?? 0) > 0 && (
            <>
              <SectionHeader Icon={Hotel} title={t('travelConcierge.section.hotels', { defaultValue: 'Hotéis pet-friendly' })} />
              {plan.hotels!.map((h, i) => (
                <HotelCard key={i} hotel={h} selected={concierge.data?.selected_hotel_idx === i}
                  onSelect={() => handleSelect('hotel', i)} onOpen={() => openUrl(h.search_url, toast)} />
              ))}
            </>
          )}

          {/* Servicos pet */}
          {(plan.pet_transport_services?.length ?? 0) > 0 && (
            <>
              <SectionHeader Icon={Package} title={t('travelConcierge.section.pet_transport', { defaultValue: 'Transporte de pet especializado' })} />
              {plan.pet_transport_services!.map((p, i) => (
                <View key={i} style={s.card}>
                  <Text style={s.cardTitle}>{p.company}</Text>
                  <Text style={s.cardLine}>{p.service}</Text>
                  <Text style={s.cardLine}>📍 {p.covers_route}</Text>
                  {p.tutor_notes ? <Text style={s.cardNote}>{p.tutor_notes}</Text> : null}
                  {p.contact_url ? (
                    <TouchableOpacity style={s.linkBtn} onPress={() => openUrl(p.contact_url, toast)} activeOpacity={0.7}>
                      <ExternalLink size={rs(14)} color={colors.click} strokeWidth={2} />
                      <Text style={s.linkTxt}>{t('common.search', { defaultValue: 'Abrir' })}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </>
          )}

          {/* Documentos */}
          {(plan.required_documents?.length ?? 0) > 0 && (
            <>
              <SectionHeader Icon={FileCheck2} title={t('travelConcierge.section.documents', { defaultValue: 'Documentos exigidos' })} />
              {plan.required_documents!.map((d, i) => (
                <View key={i} style={s.docRow}>
                  <View style={s.docDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.docTitle}>{d.title}</Text>
                    {d.where_to_get ? <Text style={s.docMeta}>📍 {d.where_to_get}</Text> : null}
                    {d.estimated_cost ? <Text style={s.docMeta}>💰 {d.estimated_cost}</Text> : null}
                    {typeof d.urgency_days_before_travel === 'number' ? (
                      <Text style={[s.docMeta, { color: colors.warning }]}>⏱️ {d.urgency_days_before_travel} dias antes</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Checklist */}
          {(plan.packing_checklist?.length ?? 0) > 0 && (
            <>
              <SectionHeader Icon={ListChecks} title={t('travelConcierge.section.checklist', { defaultValue: 'O que levar' })} />
              {plan.packing_checklist!.map((cat, i) => (
                <View key={i} style={s.checklistCat}>
                  <Text style={s.checklistCatLabel}>{cat.category}</Text>
                  {cat.items.map((it, j) => (
                    <Text key={j} style={s.checklistItem}>• {it}</Text>
                  ))}
                </View>
              ))}
            </>
          )}

          {/* Timeline */}
          {(plan.timeline?.length ?? 0) > 0 && (
            <>
              <SectionHeader Icon={Clock} title={t('travelConcierge.section.timeline', { defaultValue: 'Linha do tempo de preparação' })} />
              {plan.timeline!.map((step, i) => (
                <View key={i} style={s.timelineRow}>
                  <View style={s.timelineDays}>
                    <Text style={s.timelineDaysTxt}>{step.days_before_travel}d</Text>
                    <Text style={s.timelineDaysSub}>antes</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    {step.actions.map((a, j) => (
                      <Text key={j} style={s.timelineAction}>• {a}</Text>
                    ))}
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Budget */}
          {plan.estimated_total_budget && (
            <>
              <SectionHeader Icon={DollarSign} title={t('travelConcierge.section.budget', { defaultValue: 'Orçamento estimado' })} />
              <View style={s.card}>
                <Text style={s.budgetMain}>
                  {plan.estimated_total_budget.currency} {plan.estimated_total_budget.min.toLocaleString()} – {plan.estimated_total_budget.max.toLocaleString()}
                </Text>
                {plan.estimated_total_budget.breakdown && Object.entries(plan.estimated_total_budget.breakdown).map(([k, v]) => (
                  <View key={k} style={s.budgetRow}>
                    <Text style={s.budgetLabel}>{k}</Text>
                    <Text style={s.budgetVal}>{String(v)}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Tips */}
          {(plan.tips?.length ?? 0) > 0 && (
            <>
              <SectionHeader Icon={Lightbulb} title={t('travelConcierge.section.tips', { defaultValue: 'Dicas' })} />
              {plan.tips!.map((tip, i) => (
                <View key={i} style={s.tipCard}>
                  <Text style={s.tipTxt}>💡 {tip}</Text>
                </View>
              ))}
            </>
          )}

          {/* Sources */}
          {(plan.sources?.length ?? 0) > 0 && (
            <>
              <SectionHeader Icon={ExternalLink} title={t('travelConcierge.section.sources', { defaultValue: 'Fontes consultadas' })} />
              {plan.sources!.map((src, i) => (
                <TouchableOpacity key={i} style={s.sourceRow} onPress={() => openUrl(src.url, toast)} activeOpacity={0.7}>
                  <Text style={s.sourceTitle}>{src.title}</Text>
                  <ExternalLink size={rs(12)} color={colors.click} strokeWidth={2} />
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Regenerate */}
          <TouchableOpacity
            style={[s.cta, s.ctaSecondary, { marginTop: rs(20) }]}
            onPress={handleGenerate}
            disabled={generate.isPending}
            activeOpacity={0.85}
          >
            {generate.isPending
              ? <ActivityIndicator size="small" color={colors.click} />
              : <RefreshCw size={rs(16)} color={colors.click} strokeWidth={2} />}
            <Text style={[s.ctaTxt, { color: colors.click }]}>
              {t('travelConcierge.regenerate', { defaultValue: 'Gerar novo roteiro' })}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Sub-componentes ──────────────────────────────────────────────────────

function SectionHeader({ Icon, title }: { Icon: typeof Plane; title: string }) {
  return (
    <View style={s.sectionHeader}>
      <Icon size={rs(16)} color={colors.click} strokeWidth={1.8} />
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

function FlightCard({ flight, selected, onSelect, onOpen }: {
  flight: ConciergeFlight; selected: boolean;
  onSelect: () => void; onOpen: () => void;
}) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity style={[s.card, selected && s.cardSelected]} onPress={onSelect} activeOpacity={0.7}>
      <Text style={s.cardTitle}>{flight.airline_name}{flight.airline_iata ? ` (${flight.airline_iata})` : ''}</Text>
      <Text style={s.cardLine}>✈️ {flight.route}</Text>
      {flight.schedule_hint ? <Text style={s.cardLine}>🕐 {flight.schedule_hint}</Text> : null}
      {typeof flight.pet_in_cabin_max_kg === 'number' && (
        <Text style={s.cardLine}>🎒 {t('travelConcierge.flight.cabin_max', { defaultValue: 'Cabine até' })} {flight.pet_in_cabin_max_kg}kg</Text>
      )}
      {flight.pet_in_cargo === false && <Text style={s.cardLine}>📦 {t('travelConcierge.flight.no_cargo', { defaultValue: 'Não aceita em cargo' })}</Text>}
      {flight.tutor_notes ? <Text style={s.cardNote}>{flight.tutor_notes}</Text> : null}
      <TouchableOpacity style={s.linkBtn} onPress={onOpen} activeOpacity={0.7}>
        <ExternalLink size={rs(14)} color={colors.click} strokeWidth={2} />
        <Text style={s.linkTxt}>{t('travelConcierge.flight.search', { defaultValue: 'Buscar voo' })}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function CarStageCard({ stage, onOpen }: { stage: ConciergeCarStage; onOpen: () => void }) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{stage.stage_name}</Text>
      {stage.distance_km ? <Text style={s.cardLine}>📏 {stage.distance_km} km</Text> : null}
      {stage.suggested_stop ? <Text style={s.cardLine}>🛑 {stage.suggested_stop}</Text> : null}
      {stage.pet_friendly_amenities ? <Text style={s.cardLine}>🐾 {stage.pet_friendly_amenities}</Text> : null}
      {stage.tutor_notes ? <Text style={s.cardNote}>{stage.tutor_notes}</Text> : null}
      {stage.search_url ? (
        <TouchableOpacity style={s.linkBtn} onPress={onOpen} activeOpacity={0.7}>
          <ExternalLink size={rs(14)} color={colors.click} strokeWidth={2} />
          <Text style={s.linkTxt}>Mapa</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function BusCard({ bus, onOpen }: { bus: ConciergeBus; onOpen: () => void }) {
  return (
    <View style={[s.card, !bus.allows_pet && { opacity: 0.6 }]}>
      <Text style={s.cardTitle}>{bus.company}</Text>
      <Text style={s.cardLine}>🚌 {bus.route}</Text>
      <Text style={[s.cardLine, { color: bus.allows_pet ? colors.success : colors.danger }]}>
        {bus.allows_pet ? '✅ Aceita pet' : '❌ Não aceita pet'}
      </Text>
      <Text style={s.cardNote}>{bus.pet_policy}</Text>
      {bus.tutor_notes ? <Text style={s.cardNote}>{bus.tutor_notes}</Text> : null}
      {bus.search_url ? (
        <TouchableOpacity style={s.linkBtn} onPress={onOpen} activeOpacity={0.7}>
          <ExternalLink size={rs(14)} color={colors.click} strokeWidth={2} />
          <Text style={s.linkTxt}>Site da empresa</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function TrainCard({ train, onOpen }: { train: ConciergeTrain; onOpen: () => void }) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{train.company}{train.train_name ? ` · ${train.train_name}` : ''}</Text>
      <Text style={s.cardLine}>🚆 {train.route}</Text>
      <Text style={s.cardNote}>{train.pet_policy}</Text>
      {train.pet_ticket_cost ? <Text style={s.cardLine}>💰 {train.pet_ticket_cost}</Text> : null}
      {train.tutor_notes ? <Text style={s.cardNote}>{train.tutor_notes}</Text> : null}
      {train.search_url ? (
        <TouchableOpacity style={s.linkBtn} onPress={onOpen} activeOpacity={0.7}>
          <ExternalLink size={rs(14)} color={colors.click} strokeWidth={2} />
          <Text style={s.linkTxt}>Reservar</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function ShipCard({ ship, onOpen }: { ship: ConciergeShip; onOpen: () => void }) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{ship.company}</Text>
      <Text style={s.cardLine}>🚢 {ship.route}</Text>
      <Text style={s.cardNote}>{ship.pet_options}</Text>
      {ship.tutor_notes ? <Text style={s.cardNote}>{ship.tutor_notes}</Text> : null}
      {ship.search_url ? (
        <TouchableOpacity style={s.linkBtn} onPress={onOpen} activeOpacity={0.7}>
          <ExternalLink size={rs(14)} color={colors.click} strokeWidth={2} />
          <Text style={s.linkTxt}>Reservar</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function HotelCard({ hotel, selected, onSelect, onOpen }: {
  hotel: ConciergeHotel; selected: boolean; onSelect: () => void; onOpen: () => void;
}) {
  return (
    <TouchableOpacity style={[s.card, selected && s.cardSelected]} onPress={onSelect} activeOpacity={0.7}>
      <Text style={s.cardTitle}>{hotel.name}</Text>
      {hotel.neighborhood ? <Text style={s.cardLine}>📍 {hotel.neighborhood}</Text> : null}
      <Text style={s.cardNote}>🐾 {hotel.pet_policy}</Text>
      {hotel.price_range_per_night ? (
        <Text style={s.cardLine}>💰 {hotel.price_currency ?? ''} {hotel.price_range_per_night} / noite</Text>
      ) : null}
      {hotel.tutor_notes ? <Text style={s.cardNote}>{hotel.tutor_notes}</Text> : null}
      <TouchableOpacity style={s.linkBtn} onPress={onOpen} activeOpacity={0.7}>
        <ExternalLink size={rs(14)} color={colors.click} strokeWidth={2} />
        <Text style={s.linkTxt}>Ver no site</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  title: { color: colors.text, fontSize: fs(15), fontWeight: '700' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: rs(14) },
  emptyIcon: {
    width: rs(80), height: rs(80), borderRadius: rs(40),
    backgroundColor: colors.ai + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { color: colors.text, fontSize: fs(18), fontWeight: '700', textAlign: 'center' },
  emptyDesc: { color: colors.textSec, fontSize: fs(13), textAlign: 'center', lineHeight: fs(20), paddingHorizontal: spacing.md, marginBottom: rs(12) },
  generating: { alignItems: 'center', gap: rs(10), padding: rs(20), width: '100%' },
  generatingTxt: { color: colors.text, fontSize: fs(14), fontWeight: '600', textAlign: 'center' },
  generatingSub: { color: colors.textDim, fontSize: fs(12), textAlign: 'center' },
  tipsCarouselWrap: { width: '100%', marginTop: rs(20) },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(10),
    backgroundColor: colors.click, paddingVertical: rs(16), paddingHorizontal: rs(28),
    borderRadius: radii.lg,
    shadowColor: colors.click, shadowOffset: { width: 0, height: rs(8) },
    shadowOpacity: 0.35, shadowRadius: rs(20), elevation: 6,
  },
  ctaSecondary: { backgroundColor: colors.clickSoft, shadowOpacity: 0 },
  ctaTxt: { color: '#FFFFFF', fontSize: fs(15), fontWeight: '700' },
  body: { padding: spacing.md, paddingBottom: rs(40) },
  confidenceBanner: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    padding: spacing.md, marginBottom: rs(14),
    backgroundColor: colors.warning + '12', borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.warning + '40',
  },
  confidenceTxt: { flex: 1, color: colors.text, fontSize: fs(11), lineHeight: fs(16) },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    marginTop: rs(20), marginBottom: rs(8),
  },
  sectionTitle: { color: colors.text, fontSize: fs(14), fontWeight: '700' },
  card: {
    padding: spacing.md, marginBottom: rs(8),
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  cardSelected: { borderColor: colors.click, backgroundColor: colors.click + '08' },
  cardTitle: { color: colors.text, fontSize: fs(14), fontWeight: '700', marginBottom: rs(4) },
  cardLine: { color: colors.textSec, fontSize: fs(12), marginTop: rs(2) },
  cardNote: { color: colors.textDim, fontSize: fs(11), fontStyle: 'italic', marginTop: rs(6), lineHeight: fs(16) },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: rs(6),
    marginTop: rs(10), paddingVertical: rs(8), paddingHorizontal: rs(12),
    backgroundColor: colors.clickSoft, borderRadius: radii.md, alignSelf: 'flex-start',
  },
  linkTxt: { color: colors.click, fontSize: fs(12), fontWeight: '700' },
  docRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: rs(10),
    padding: spacing.sm, marginBottom: rs(6),
    backgroundColor: colors.card, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border,
  },
  docDot: {
    width: rs(8), height: rs(8), borderRadius: rs(4),
    backgroundColor: colors.click, marginTop: rs(6),
  },
  docTitle: { color: colors.text, fontSize: fs(13), fontWeight: '600' },
  docMeta: { color: colors.textDim, fontSize: fs(11), marginTop: rs(2) },
  checklistCat: {
    padding: spacing.sm, marginBottom: rs(8),
    backgroundColor: colors.card, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border,
  },
  checklistCatLabel: { color: colors.click, fontSize: fs(11), fontWeight: '700', letterSpacing: 1.2, marginBottom: rs(6) },
  checklistItem: { color: colors.text, fontSize: fs(12), marginVertical: rs(2), lineHeight: fs(18) },
  timelineRow: {
    flexDirection: 'row', gap: rs(12),
    padding: spacing.sm, marginBottom: rs(6),
    backgroundColor: colors.card, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border,
  },
  timelineDays: {
    width: rs(56), alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.clickSoft, borderRadius: radii.md, padding: rs(6),
  },
  timelineDaysTxt: { color: colors.click, fontSize: fs(15), fontWeight: '800' },
  timelineDaysSub: { color: colors.click, fontSize: fs(9), fontWeight: '600' },
  timelineAction: { color: colors.text, fontSize: fs(12), marginVertical: rs(2), lineHeight: fs(18) },
  budgetMain: { color: colors.text, fontSize: fs(20), fontWeight: '800', marginBottom: rs(8) },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: rs(4) },
  budgetLabel: { color: colors.textDim, fontSize: fs(12), textTransform: 'capitalize' },
  budgetVal: { color: colors.text, fontSize: fs(12), fontWeight: '600' },
  tipCard: {
    padding: spacing.sm, marginBottom: rs(6),
    backgroundColor: colors.ai + '08', borderRadius: radii.md,
    borderLeftWidth: 3, borderLeftColor: colors.ai,
  },
  tipTxt: { color: colors.text, fontSize: fs(12), lineHeight: fs(18) },
  sourceRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: rs(8), paddingHorizontal: rs(12),
    backgroundColor: colors.card, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.border, marginBottom: rs(4),
  },
  sourceTitle: { color: colors.click, fontSize: fs(11), flex: 1, marginRight: rs(8) },
});
