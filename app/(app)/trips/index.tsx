/**
 * /trips — Lista de viagens do tutor logado.
 *
 * Mostra trips agrupadas por status (planning, preparing, active, returning,
 * completed). Tap em um card abre /trips/[id]. FAB de "+" abre /trips/new.
 *
 * RLS protege ownership — query simples retorna so as viagens do tutor.
 */
import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Plane, Plus, Calendar, Sparkles } from 'lucide-react-native';

import { colors } from '../../../constants/colors';
import { radii, spacing } from '../../../constants/spacing';
import { rs, fs } from '../../../hooks/useResponsive';
import { useTrips } from '../../../hooks/useTrips';
import { TRAVEL_RULES } from '../../../data/travelRules';
import type { Trip, TripStatus } from '../../../types/trip';

// Top destinos comuns do tutor brasileiro de elite (atalhos no empty state)
const TOP_COUNTRY_CODES = ['BR', 'US', 'PT', 'ES', 'FR', 'IT', 'DE', 'GB', 'JP', 'AR'] as const;

const ORDER: TripStatus[] = ['active', 'preparing', 'planning', 'returning', 'completed', 'archived'];

export default function TripsListScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const trips = useTrips();

  // Agrupa por status mantendo ordem deliberada
  const grouped = useMemo(() => {
    const buckets = new Map<TripStatus, Trip[]>();
    for (const tr of trips.data ?? []) {
      const arr = buckets.get(tr.status) ?? [];
      arr.push(tr);
      buckets.set(tr.status, arr);
    }
    return ORDER.flatMap((status) => {
      const list = buckets.get(status) ?? [];
      if (list.length === 0) return [];
      return [
        { kind: 'header' as const, status, count: list.length },
        ...list.map((trip) => ({ kind: 'trip' as const, trip })),
      ];
    });
  }, [trips.data]);

  const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString(
    i18n.language === 'pt-BR' ? 'pt-BR' : i18n.language,
    { day: '2-digit', month: 'short' },
  );

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={rs(22)} color={colors.click} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={s.title}>{t('travel.title')}</Text>
        <View style={{ width: rs(22) }} />
      </View>

      {trips.isLoading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={colors.click} />
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item, i) =>
            item.kind === 'header' ? `h-${item.status}` : `t-${item.trip.id}-${i}`
          }
          contentContainerStyle={(grouped.length === 0) ? s.emptyContainer : s.list}
          refreshControl={
            <RefreshControl
              refreshing={trips.isRefetching}
              onRefresh={trips.refetch}
              tintColor={colors.click}
            />
          }
          ListEmptyComponent={
            <View style={s.emptyBox}>
              <View style={s.emptyIcon}>
                <Plane size={rs(36)} color={colors.ai} strokeWidth={1.6} />
              </View>
              <Text style={s.emptyTitle}>
                {t('travel.empty.title', { defaultValue: 'Comece a planejar' })}
              </Text>
              <Text style={s.emptyDesc}>
                {t('travel.empty.desc', { defaultValue: 'Toque em um destino abaixo ou diga em uma frase pra IA preparar tudo.' })}
              </Text>

              {/* Grid de bandeiras como atalho — tap pula pra /trips/new com pais pre-selecionado */}
              <View style={s.flagsGrid}>
                {TOP_COUNTRY_CODES.map((code) => {
                  const rule = TRAVEL_RULES[code];
                  if (!rule) return null;
                  const name = t(rule.countryNameKey, { defaultValue: code });
                  return (
                    <TouchableOpacity
                      key={code}
                      style={s.flagBtn}
                      onPress={() => router.push({
                        pathname: '/(app)/trips/new',
                        params: { country: code },
                      } as never)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.flagEmoji}>{rule.flag}</Text>
                      <Text style={s.flagName} numberOfLines={1}>{name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={s.emptyCta}
                onPress={() => router.push('/(app)/trips/new' as never)}
                activeOpacity={0.85}
              >
                <Sparkles size={rs(16)} color="#FFFFFF" strokeWidth={2} />
                <Text style={s.emptyCtaTxt}>
                  {t('travel.empty.cta', { defaultValue: 'Outro destino' })}
                </Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            if (item.kind === 'header') {
              return (
                <Text style={s.sectionLabel}>
                  {t(`travel.status.${item.status}`)} · {item.count}
                </Text>
              );
            }
            const tr = item.trip;
            const rule = TRAVEL_RULES[tr.destination_country_code];
            const flag = rule?.flag ?? '🌍';
            const country = rule
              ? t(rule.countryNameKey, { defaultValue: tr.destination_country_code })
              : tr.destination_country_code;
            return (
              <TouchableOpacity
                style={s.card}
                onPress={() => router.push(`/(app)/trips/${tr.id}` as never)}
                activeOpacity={0.7}
              >
                <Text style={s.cardFlag}>{flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardCountry} numberOfLines={1}>{country}</Text>
                  <View style={s.cardDates}>
                    <Calendar size={rs(11)} color={colors.textDim} strokeWidth={1.8} />
                    <Text style={s.cardDatesTxt}>
                      {fmt(tr.start_date)} → {fmt(tr.end_date)}
                    </Text>
                  </View>
                </View>
                <View style={[s.statusBadge, statusStyle(tr.status)]}>
                  <Text style={s.statusBadgeTxt}>{t(`travel.status.${tr.status}`)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <TouchableOpacity
        style={s.fab}
        onPress={() => router.push('/(app)/trips/new' as never)}
        activeOpacity={0.85}
        accessibilityLabel={t('travel.new.title')}
      >
        <Plus size={rs(22)} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function statusStyle(status: string) {
  switch (status) {
    case 'active': return { backgroundColor: colors.success + '20' };
    case 'planning': return { backgroundColor: colors.click + '20' };
    case 'preparing': return { backgroundColor: colors.warning + '20' };
    case 'completed': return { backgroundColor: colors.textDim + '20' };
    default: return { backgroundColor: colors.click + '20' };
  }
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { color: colors.text, fontSize: fs(17), fontWeight: '700' },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md, paddingBottom: rs(80) },
  emptyContainer: { padding: spacing.lg, paddingTop: rs(40) },
  emptyBox: { alignItems: 'center', gap: rs(10) },
  emptyIcon: {
    width: rs(80), height: rs(80), borderRadius: rs(40),
    backgroundColor: colors.ai + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: rs(8),
  },
  emptyTitle: { color: colors.text, fontSize: fs(20), fontWeight: '800', textAlign: 'center' },
  emptyDesc: { color: colors.textSec, fontSize: fs(13), textAlign: 'center', paddingHorizontal: spacing.md, lineHeight: fs(20), marginBottom: rs(12) },
  flagsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: rs(8),
    justifyContent: 'center', marginVertical: rs(14),
  },
  flagBtn: {
    width: rs(72), aspectRatio: 0.95,
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', gap: rs(4), padding: rs(6),
  },
  flagEmoji: { fontSize: fs(28) },
  flagName: { color: colors.textSec, fontSize: fs(9), fontWeight: '600', textAlign: 'center' },
  emptyCta: {
    flexDirection: 'row', alignItems: 'center', gap: rs(8),
    backgroundColor: colors.click, paddingVertical: rs(12), paddingHorizontal: rs(20),
    borderRadius: radii.lg, marginTop: rs(8),
  },
  emptyCtaTxt: { color: '#FFFFFF', fontSize: fs(14), fontWeight: '700' },
  sectionLabel: {
    color: colors.textDim, fontSize: fs(11), fontWeight: '700',
    letterSpacing: 1.2, textTransform: 'uppercase', marginTop: rs(12), marginBottom: rs(6),
  },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: rs(12),
    padding: spacing.md, marginBottom: rs(10),
    backgroundColor: colors.card, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  cardFlag: { fontSize: fs(28) },
  cardCountry: { color: colors.text, fontSize: fs(14), fontWeight: '700' },
  cardDates: { flexDirection: 'row', alignItems: 'center', gap: rs(4), marginTop: rs(4) },
  cardDatesTxt: { color: colors.textDim, fontSize: fs(11) },
  statusBadge: { paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(6) },
  statusBadgeTxt: { color: colors.text, fontSize: fs(10), fontWeight: '700' },
  fab: {
    position: 'absolute', bottom: rs(24), right: rs(24),
    width: rs(56), height: rs(56), borderRadius: rs(28),
    backgroundColor: colors.click,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.click, shadowOffset: { width: 0, height: rs(8) },
    shadowOpacity: 0.4, shadowRadius: rs(16), elevation: 8,
  },
});
