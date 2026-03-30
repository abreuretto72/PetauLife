import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, FlatList,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Map, Gauge, Calendar, Camera, MapPin, Star,
  Sparkles, Thermometer, Clock, Hotel, Pill,
  Heart, CheckCircle, Navigation, Plane,
} from 'lucide-react-native';

import { rs, fs } from '../../../../hooks/useResponsive';
import { colors } from '../../../../constants/colors';
import { radii, spacing } from '../../../../constants/spacing';
import { usePet } from '../../../../hooks/usePets';
import { Skeleton } from '../../../../components/Skeleton';

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────
type FilterId = 'all' | 'active' | 'completed' | 'planned';
type TripStatus = 'completed' | 'active' | 'planned';

interface Trip {
  id: string;
  nameKey: string;
  status: TripStatus;
  dateRangeKey: string;
  days: number;
  km: number;
  score?: number;
  photos?: number;
  progressDay?: number;
  progressTotal?: number;
  daysUntil?: number;
  checklistDone?: number;
  checklistTotal?: number;
}

interface NearbyPlace {
  id: string;
  nameKey: string;
  distanceKey: string;
  rating: number;
  color: string;
  icon: React.ElementType;
}

interface TravelTip {
  id: string;
  icon: React.ElementType;
  labelKey: string;
  textKey: string;
}

// ──────────────────────────────────────────
// Constants
// ──────────────────────────────────────────
const FILTERS: { id: FilterId; labelKey: string; countKey: string }[] = [
  { id: 'all', labelKey: 'travel.filterAll', countKey: '4' },
  { id: 'active', labelKey: 'travel.filterActive', countKey: '' },
  { id: 'completed', labelKey: 'travel.filterCompleted', countKey: '' },
  { id: 'planned', labelKey: 'travel.filterPlanned', countKey: '' },
];

const STATUS_COLORS: Record<TripStatus, string> = {
  completed: colors.sky,
  active: colors.success,
  planned: colors.gold,
};

const MOCK_TRIPS: Trip[] = [
  {
    id: '1', nameKey: 'travel.tripUbatuba', status: 'completed',
    dateRangeKey: 'travel.tripUbatubaDate', days: 5, km: 380, score: 92, photos: 34,
  },
  {
    id: '2', nameKey: 'travel.tripFazenda', status: 'active',
    dateRangeKey: 'travel.tripFazendaDate', days: 4, km: 210,
    progressDay: 2, progressTotal: 4,
  },
  {
    id: '3', nameKey: 'travel.tripSerra', status: 'planned',
    dateRangeKey: 'travel.tripSerraDate', days: 7, km: 520,
    daysUntil: 45, checklistDone: 3, checklistTotal: 12,
  },
];

const MOCK_NEARBY: NearbyPlace[] = [
  { id: 'n1', nameKey: 'travel.placeParque', distanceKey: 'travel.placeParqueDist', rating: 4.8, color: colors.success, icon: MapPin },
  { id: 'n2', nameKey: 'travel.placeHotel', distanceKey: 'travel.placeHotelDist', rating: 4.5, color: colors.sky, icon: Hotel },
  { id: 'n3', nameKey: 'travel.placeVet', distanceKey: 'travel.placeVetDist', rating: 4.9, color: colors.danger, icon: Heart },
];

const MOCK_TIPS: TravelTip[] = [
  { id: 't1', icon: Thermometer, labelKey: 'travel.tipClima', textKey: 'travel.tipClimaText' },
  { id: 't2', icon: Clock, labelKey: 'travel.tipPausas', textKey: 'travel.tipPausasText' },
  { id: 't3', icon: Hotel, labelKey: 'travel.tipHospedagem', textKey: 'travel.tipHospedagemText' },
  { id: 't4', icon: Pill, labelKey: 'travel.tipAntiparasitario', textKey: 'travel.tipAntiparasitarioText' },
  { id: 't5', icon: Heart, labelKey: 'travel.tipConforto', textKey: 'travel.tipConfortoText' },
];

// ──────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────
function StatsBanner({ t }: { t: (key: string) => string }) {
  const stats = [
    { labelKey: 'travel.statKm', value: '1.240 km', Icon: Gauge },
    { labelKey: 'travel.statDays', value: '18', Icon: Calendar },
    { labelKey: 'travel.statPhotos', value: '89', Icon: Camera },
  ];

  return (
    <View style={s.banner}>
      <View style={s.bannerHeader}>
        <View style={s.bannerIcon}>
          <Map size={rs(26)} color={colors.sky} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.bannerLabel}>{t('travel.diaryLabel')}</Text>
          <Text style={s.bannerSubtitle}>{t('travel.tripsCompleted')}</Text>
        </View>
      </View>
      <View style={s.statsRow}>
        {stats.map((stat) => (
          <View key={stat.labelKey} style={s.statCard}>
            <stat.Icon size={rs(16)} color={colors.petrol} strokeWidth={1.8} />
            <Text style={s.statValue}>{stat.value}</Text>
            <Text style={s.statLabel}>{t(stat.labelKey)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function FilterPills({
  active, onSelect, t,
}: { active: FilterId; onSelect: (id: FilterId) => void; t: (key: string) => string }) {
  return (
    <View style={s.filterRow}>
      {FILTERS.map((f) => {
        const isActive = f.id === active;
        return (
          <TouchableOpacity
            key={f.id}
            style={[s.pill, isActive && s.pillActive]}
            onPress={() => onSelect(f.id)}
            activeOpacity={0.7}
          >
            <Text style={[s.pillText, isActive && s.pillTextActive]}>
              {t(f.labelKey)}{f.countKey ? ` (${f.countKey})` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TripCard({ trip, t }: { trip: Trip; t: (key: string) => string }) {
  const statusColor = STATUS_COLORS[trip.status];

  return (
    <View style={s.tripCard}>
      <View style={[s.tripAccent, { backgroundColor: statusColor }]} />
      <View style={s.tripContent}>
        <View style={s.tripHeader}>
          <Text style={s.tripName}>{t(trip.nameKey)}</Text>
          <View style={[s.tripBadge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[s.tripBadgeText, { color: statusColor }]}>
              {t(`travel.status${trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}`)}
            </Text>
          </View>
        </View>
        <Text style={s.tripDate}>{t(trip.dateRangeKey)}</Text>

        {trip.status === 'completed' && (
          <View style={s.tripStats}>
            <View style={s.tripStatItem}>
              <Navigation size={rs(12)} color={colors.sky} strokeWidth={1.8} />
              <Text style={s.tripStatText}>{trip.km} km</Text>
            </View>
            <View style={s.tripStatItem}>
              <Calendar size={rs(12)} color={colors.sky} strokeWidth={1.8} />
              <Text style={s.tripStatText}>{trip.days} {t('travel.daysShort')}</Text>
            </View>
            <View style={s.tripStatItem}>
              <Star size={rs(12)} color={colors.gold} strokeWidth={1.8} />
              <Text style={s.tripStatText}>{trip.score}</Text>
            </View>
            <View style={s.tripStatItem}>
              <Camera size={rs(12)} color={colors.petrol} strokeWidth={1.8} />
              <Text style={s.tripStatText}>{trip.photos}</Text>
            </View>
          </View>
        )}

        {trip.status === 'active' && (
          <View style={s.activeSection}>
            <Text style={s.activeLabel}>
              {t('travel.dayOf', { current: trip.progressDay, total: trip.progressTotal })}
            </Text>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: '50%', backgroundColor: colors.success }]} />
            </View>
          </View>
        )}

        {trip.status === 'planned' && (
          <View style={s.plannedSection}>
            <Text style={s.plannedLabel}>
              {t('travel.inDays', { count: trip.daysUntil })}
            </Text>
            <View style={s.checklistRow}>
              <CheckCircle size={rs(12)} color={colors.gold} strokeWidth={1.8} />
              <Text style={s.checklistText}>
                {t('travel.checklist', { done: trip.checklistDone, total: trip.checklistTotal })}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function NearbySection({ t }: { t: (key: string) => string }) {
  const renderPlace = useCallback(({ item }: { item: NearbyPlace }) => (
    <View style={s.placeCard}>
      <View style={[s.placeIcon, { backgroundColor: item.color + '15' }]}>
        <item.icon size={rs(18)} color={item.color} strokeWidth={1.8} />
      </View>
      <Text style={s.placeName} numberOfLines={1}>{t(item.nameKey)}</Text>
      <Text style={s.placeDist}>{t(item.distanceKey)}</Text>
      <View style={s.placeRating}>
        <Star size={rs(10)} color={colors.gold} strokeWidth={2} />
        <Text style={s.placeRatingText}>{item.rating}</Text>
      </View>
    </View>
  ), [t]);

  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <MapPin size={rs(14)} color={colors.sky} strokeWidth={1.8} />
        <Text style={s.sectionTitle}>{t('travel.nearbyTitle')}</Text>
      </View>
      <FlatList
        data={MOCK_NEARBY}
        keyExtractor={(item) => item.id}
        renderItem={renderPlace}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: rs(4) }}
        ItemSeparatorComponent={() => <View style={{ width: rs(10) }} />}
      />
    </View>
  );
}

function AiTipsSection({ t }: { t: (key: string) => string }) {
  return (
    <View style={s.tipsCard}>
      <View style={s.tipsHeader}>
        <Sparkles size={rs(16)} color={colors.sky} strokeWidth={1.8} />
        <Text style={s.tipsTitle}>{t('travel.aiTipsTitle')}</Text>
      </View>
      {MOCK_TIPS.map((tip) => (
        <View key={tip.id} style={s.tipRow}>
          <tip.icon size={rs(16)} color={colors.petrol} strokeWidth={1.8} />
          <View style={{ flex: 1 }}>
            <Text style={s.tipLabel}>{t(tip.labelKey)}</Text>
            <Text style={s.tipText}>{t(tip.textKey)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ──────────────────────────────────────────
// Main Screen
// ──────────────────────────────────────────
export default function TravelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { pet, isLoading, refetch } = usePet(id ?? '');
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterId>('all');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredTrips = MOCK_TRIPS.filter((trip) => {
    if (filter === 'all') return true;
    return trip.status === filter;
  });

  if (isLoading) {
    return (
      <View style={s.container}>
        <Skeleton width="100%" height={rs(160)} borderRadius={rs(18)} />
        <View style={{ height: rs(16) }} />
        <Skeleton width="100%" height={rs(40)} borderRadius={rs(10)} />
        <View style={{ height: rs(16) }} />
        <Skeleton width="100%" height={rs(120)} borderRadius={rs(18)} />
        <View style={{ height: rs(12) }} />
        <Skeleton width="100%" height={rs(120)} borderRadius={rs(18)} />
      </View>
    );
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.sky}
          colors={[colors.sky]}
        />
      }
    >
      <StatsBanner t={t} />

      <FilterPills active={filter} onSelect={setFilter} t={t} />

      {filteredTrips.map((trip) => (
        <TripCard key={trip.id} trip={trip} t={t} />
      ))}

      <NearbySection t={t} />

      <AiTipsSection t={t} />

      <View style={{ height: rs(32) }} />
    </ScrollView>
  );
}

// ──────────────────────────────────────────
// Styles
// ──────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: rs(16) },

  // Stats Banner
  banner: {
    backgroundColor: colors.card,
    borderRadius: rs(18),
    padding: rs(16),
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: rs(16),
  },
  bannerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: rs(14) },
  bannerIcon: {
    width: rs(46), height: rs(46), borderRadius: rs(14),
    backgroundColor: colors.skySoft, alignItems: 'center', justifyContent: 'center',
    marginRight: rs(12),
  },
  bannerLabel: {
    fontFamily: 'Sora_700Bold', fontSize: fs(11), color: colors.sky,
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  bannerSubtitle: { fontFamily: 'Sora_400Regular', fontSize: fs(13), color: colors.textSec, marginTop: rs(2) },
  statsRow: { flexDirection: 'row', gap: rs(8) },
  statCard: {
    flex: 1, backgroundColor: colors.bgCard, borderRadius: rs(12),
    padding: rs(10), alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  statValue: { fontFamily: 'JetBrainsMono_700Bold', fontSize: fs(15), color: colors.text, marginTop: rs(4) },
  statLabel: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textDim, marginTop: rs(2) },

  // Filter Pills
  filterRow: { flexDirection: 'row', gap: rs(8), marginBottom: rs(16), flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: rs(14), paddingVertical: rs(8), borderRadius: rs(10),
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  pillActive: { backgroundColor: colors.skySoft, borderColor: colors.sky },
  pillText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.textSec },
  pillTextActive: { color: colors.sky },

  // Trip Cards
  tripCard: {
    backgroundColor: colors.card, borderRadius: rs(18), overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border, marginBottom: rs(12),
  },
  tripAccent: { height: rs(4) },
  tripContent: { padding: rs(14) },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripName: { fontFamily: 'Sora_700Bold', fontSize: fs(15), color: colors.text, flex: 1 },
  tripBadge: { paddingHorizontal: rs(10), paddingVertical: rs(4), borderRadius: rs(8) },
  tripBadgeText: { fontFamily: 'Sora_700Bold', fontSize: fs(10) },
  tripDate: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.textDim, marginTop: rs(4) },
  tripStats: { flexDirection: 'row', gap: rs(14), marginTop: rs(10) },
  tripStatItem: { flexDirection: 'row', alignItems: 'center', gap: rs(4) },
  tripStatText: { fontFamily: 'JetBrainsMono_700Bold', fontSize: fs(12), color: colors.textSec },

  // Active Trip
  activeSection: { marginTop: rs(10) },
  activeLabel: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.success, marginBottom: rs(6) },
  progressTrack: {
    height: rs(4), backgroundColor: colors.border, borderRadius: rs(2), overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: rs(2) },

  // Planned Trip
  plannedSection: { marginTop: rs(10) },
  plannedLabel: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.gold, marginBottom: rs(4) },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: rs(4) },
  checklistText: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.textSec },

  // Nearby Section
  section: { marginTop: rs(8), marginBottom: rs(16) },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(6), marginBottom: rs(10) },
  sectionTitle: {
    fontFamily: 'Sora_700Bold', fontSize: fs(11), color: colors.sky,
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  placeCard: {
    width: rs(130), backgroundColor: colors.card, borderRadius: rs(14),
    padding: rs(12), borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  placeIcon: {
    width: rs(36), height: rs(36), borderRadius: rs(10),
    alignItems: 'center', justifyContent: 'center', marginBottom: rs(8),
  },
  placeName: { fontFamily: 'Sora_600SemiBold', fontSize: fs(11), color: colors.text, textAlign: 'center' },
  placeDist: { fontFamily: 'JetBrainsMono_700Bold', fontSize: fs(10), color: colors.textDim, marginTop: rs(2) },
  placeRating: { flexDirection: 'row', alignItems: 'center', gap: rs(3), marginTop: rs(6) },
  placeRatingText: { fontFamily: 'JetBrainsMono_700Bold', fontSize: fs(10), color: colors.gold },

  // AI Tips
  tipsCard: {
    backgroundColor: colors.skySoft, borderRadius: rs(18),
    padding: rs(16), borderWidth: 1, borderColor: colors.sky + '25',
  },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: rs(8), marginBottom: rs(12) },
  tipsTitle: { fontFamily: 'Sora_700Bold', fontSize: fs(13), color: colors.sky },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: rs(10), marginBottom: rs(10) },
  tipLabel: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.text },
  tipText: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.textSec, marginTop: rs(1) },
});
