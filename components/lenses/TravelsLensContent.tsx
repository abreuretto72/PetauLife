/**
 * TravelsLensContent — Trip history como feed Instagram.
 *
 * Painel principal: 2 colunas de cards visuais com foto cover,
 * destino, tipo, distância. Tap → abre FeedSheet com timeline
 * vertical da viagem (foto + narração IA + data + chips).
 *
 * Sem foto cover → fallback com avatar do pet titular + ícone MapPin.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import {
  Plane, Car, Tent, MapPin, Navigation,
  Calendar, Globe, Sparkles, Plus,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';

import { colors } from '../../constants/colors';
import { rs, fs } from '../../hooks/useResponsive';
import { radii, spacing } from '../../constants/spacing';
import { Skeleton } from '../Skeleton';
import { useLensTravel, type PetTravel } from '../../hooks/useLens';
import { supabase } from '../../lib/supabase';
import { FeedSheet, type FeedPost } from './FeedSheet';
import { AddTravelSheet } from './AddTravelSheet';

// ── Travel type config ───────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; labelKey: string }> = {
  road_trip:     { icon: Car,        color: colors.click,   labelKey: 'travels.typeRoadTrip' },
  flight:        { icon: Plane,      color: colors.sky,      labelKey: 'travels.typeFlight' },
  local:         { icon: MapPin,     color: colors.petrol,   labelKey: 'travels.typeLocal' },
  international: { icon: Globe,      color: colors.click,   labelKey: 'travels.typeInternational' },
  camping:       { icon: Tent,       color: colors.success,  labelKey: 'travels.typeCamping' },
  other:         { icon: Navigation, color: colors.textDim,  labelKey: 'travels.typeOther' },
};

const STATUS_COLOR: Record<string, string> = {
  completed: colors.petrol,
  active:    colors.success,
  planned:   colors.warning,
};

// ── Hook auxiliar — avatar do pet titular ────────────────────────────────────

function usePetAvatar(petId: string): string | null {
  const { data } = useQuery({
    queryKey: ['pet-avatar', petId],
    queryFn: async () => {
      const { data } = await supabase
        .from('pets')
        .select('avatar_url')
        .eq('id', petId)
        .maybeSingle();
      return (data?.avatar_url as string | null) ?? null;
    },
    staleTime: 60 * 60 * 1000,
  });
  return data ?? null;
}

// ── Summary ──────────────────────────────────────────────────────────────────

function TravelSummaryCard({
  totalTrips, totalKm, totalDays,
}: {
  totalTrips: number; totalKm: number; totalDays: number;
}) {
  const { t } = useTranslation();
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryRow}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: colors.sky + '15' }]}>
            <Plane size={rs(16)} color={colors.sky} strokeWidth={1.8} />
          </View>
          <Text style={styles.statValue}>{totalTrips}</Text>
          <Text style={styles.statLabel}>{t('travels.statTrips')}</Text>
        </View>

        <View style={[styles.statItem, styles.statBorder]}>
          <View style={[styles.statIcon, { backgroundColor: colors.click + '15' }]}>
            <Navigation size={rs(16)} color={colors.click} strokeWidth={1.8} />
          </View>
          <Text style={styles.statValue}>{totalKm.toLocaleString()}</Text>
          <Text style={styles.statLabel}>{t('travels.statKm')}</Text>
        </View>

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: colors.success + '15' }]}>
            <Calendar size={rs(16)} color={colors.success} strokeWidth={1.8} />
          </View>
          <Text style={styles.statValue}>{totalDays}</Text>
          <Text style={styles.statLabel}>{t('travels.statDays')}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Trip card (grid com foto grande + destino) ───────────────────────────────

function formatShortDate(dateStr: string | null, lang: string): string {
  if (!dateStr) return '';
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const dt = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(dateStr);
  return dt.toLocaleDateString(lang, { day: '2-digit', month: 'short' });
}

const TripCard = React.memo(function TripCard({
  travel, onPress, petAvatarUrl,
}: {
  travel: PetTravel;
  onPress: (t: PetTravel) => void;
  petAvatarUrl: string | null;
}) {
  const { t, i18n } = useTranslation();
  const typeCfg = TYPE_CONFIG[travel.travel_type] ?? TYPE_CONFIG.other;
  const TypeIcon = typeCfg.icon;
  const statusColor = STATUS_COLOR[travel.status] ?? colors.textDim;
  const cover = travel.cover_url;

  const dateLabel = travel.start_date ? formatShortDate(travel.start_date, i18n.language) : '';
  const distLabel = travel.distance_km != null && travel.distance_km > 0
    ? `${travel.distance_km.toLocaleString()} km`
    : null;

  return (
    <TouchableOpacity
      style={styles.gridCard}
      activeOpacity={0.85}
      onPress={() => onPress(travel)}
    >
      <View style={styles.coverWrap}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.coverFallback, { backgroundColor: typeCfg.color + '14' }]}>
            {petAvatarUrl ? (
              <Image source={{ uri: petAvatarUrl }} style={styles.fallbackAvatarImg} resizeMode="cover" />
            ) : (
              <TypeIcon size={rs(36)} color={typeCfg.color} strokeWidth={1.6} />
            )}
          </View>
        )}

        {/* Sombra inferior pra contraste do texto branco */}
        <View style={styles.coverShade} pointerEvents="none" />

        {/* Status badge no canto superior esquerdo */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>
            {t(`travels.status_${travel.status}`).toUpperCase()}
          </Text>
        </View>

        {/* Tipo no canto superior direito (só ícone + cor) */}
        <View style={styles.typeBadge}>
          <TypeIcon size={rs(12)} color="#fff" strokeWidth={2} />
        </View>

        {/* Destino + meta embaixo */}
        <View style={styles.nameOverlay}>
          <Text style={styles.cardName} numberOfLines={1}>{travel.destination}</Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {[travel.region, dateLabel, distLabel].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  const { t } = useTranslation();
  return (
    <View style={styles.emptyCard}>
      <Sparkles size={rs(28)} color={colors.sky} strokeWidth={1.5} />
      <Text style={styles.emptyTitle}>{t('travels.emptyTitle')}</Text>
      <Text style={styles.emptyHint}>{t('travels.emptyHint')}</Text>
    </View>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

interface TravelsLensContentProps {
  petId: string;
}

export function TravelsLensContent({ petId }: TravelsLensContentProps) {
  const { t } = useTranslation();
  const { data, isLoading } = useLensTravel(petId);
  const petAvatarUrl = usePetAvatar(petId);
  const [activeTrip, setActiveTrip] = useState<PetTravel | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const feedPosts = useMemo<FeedPost[]>(() => {
    if (!activeTrip) return [];
    // Pra viagem: 1 viagem = 1 post (fonte = a row de pet_travels)
    // Se eventualmente uma viagem virar várias entradas no diário, daria pra
    // expandir aqui. MVP: 1 post visual representando a viagem inteira.
    const typeCfg = TYPE_CONFIG[activeTrip.travel_type] ?? TYPE_CONFIG.other;
    const chips = [
      activeTrip.region ? { label: activeTrip.region, color: colors.petrol } : null,
      activeTrip.distance_km != null && activeTrip.distance_km > 0
        ? { label: `${activeTrip.distance_km.toLocaleString()} km`, color: colors.click }
        : null,
      { label: t(typeCfg.labelKey), color: typeCfg.color },
      ...activeTrip.tags.map((tag) => ({ label: tag, color: colors.textSec })),
    ].filter((x): x is { label: string; color: string } => !!x);

    return [{
      id: activeTrip.id,
      date: activeTrip.start_date,
      narration: activeTrip.narration,
      notes: activeTrip.notes,
      cover_url: activeTrip.cover_url,
      photos: activeTrip.photos,
      chips,
    }];
  }, [activeTrip, t]);

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <Skeleton width="100%" height={rs(80)} radius={radii.card} />
        <View style={{ height: spacing.sm }} />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Skeleton width="48%" height={rs(180)} radius={radii.card} />
          <Skeleton width="48%" height={rs(180)} radius={radii.card} />
        </View>
      </View>
    );
  }

  if (!data || data.travels.length === 0) {
    return (
      <View>
        <EmptyState />
        <View style={{ alignItems: 'center', marginTop: spacing.md }}>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => setAddOpen(true)}
            activeOpacity={0.85}
          >
            <Plus size={rs(16)} color="#fff" strokeWidth={2.2} />
            <Text style={styles.emptyAddBtnText}>
              {t('addTravel.title', { defaultValue: 'Adicionar viagem' })}
            </Text>
          </TouchableOpacity>
        </View>
        <AddTravelSheet visible={addOpen} onClose={() => setAddOpen(false)} petId={petId} />
      </View>
    );
  }

  const { travels, totalTrips, totalKm, totalDays } = data;

  return (
    <View>
      <TravelSummaryCard
        totalTrips={totalTrips}
        totalKm={totalKm}
        totalDays={totalDays}
      />

      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeader}>{t('travels.listTitle').toUpperCase()}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setAddOpen(true)}
          activeOpacity={0.85}
          hitSlop={6}
        >
          <Plus size={rs(14)} color="#fff" strokeWidth={2.4} />
          <Text style={styles.addBtnText}>{t('common.add', { defaultValue: 'Adicionar' })}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={travels}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TripCard
            travel={item}
            onPress={setActiveTrip}
            petAvatarUrl={petAvatarUrl}
          />
        )}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={styles.gridRow}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />

      <FeedSheet
        visible={!!activeTrip}
        onClose={() => setActiveTrip(null)}
        title={activeTrip?.destination ?? ''}
        subtitle={
          activeTrip
            ? [activeTrip.region, activeTrip.country].filter(Boolean).join(' · ')
            : ''
        }
        headerColor={colors.sky}
        posts={feedPosts}
        petAvatarUrl={petAvatarUrl}
        FallbackIcon={MapPin}
      />

      <AddTravelSheet visible={addOpen} onClose={() => setAddOpen(false)} petId={petId} />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingWrap: { gap: spacing.sm },

  // Summary
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center', gap: rs(4) },
  statBorder: {
    borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border,
  },
  statIcon: {
    width: rs(36), height: rs(36), borderRadius: rs(18),
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: {
    fontFamily: 'JetBrainsMono_700Bold', fontSize: fs(18), color: colors.text,
  },
  statLabel: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textDim },

  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(10),
  },
  listHeader: {
    fontFamily: 'Sora_700Bold', fontSize: fs(10), color: colors.textGhost,
    letterSpacing: 1.8,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    paddingHorizontal: rs(10),
    paddingVertical: rs(6),
    borderRadius: rs(14),
    backgroundColor: colors.click,
  },
  addBtnText: {
    color: '#fff', fontSize: fs(11), fontWeight: '700',
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    paddingHorizontal: rs(16),
    paddingVertical: rs(10),
    borderRadius: rs(20),
    backgroundColor: colors.click,
  },
  emptyAddBtnText: {
    color: '#fff', fontSize: fs(13), fontWeight: '700',
  },

  // Grid
  gridRow: { gap: spacing.sm },
  gridCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  coverWrap: {
    width: '100%',
    aspectRatio: 4 / 5,
    position: 'relative',
  },
  cover: {
    width: '100%', height: '100%',
    backgroundColor: colors.bgDeep,
  },
  coverFallback: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  fallbackAvatarImg: {
    width: rs(72), height: rs(72), borderRadius: rs(36),
    borderWidth: 3, borderColor: colors.bg,
  },
  coverShade: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0, top: '55%',
    backgroundColor: 'rgba(11,18,25,0.70)',
  },
  statusBadge: {
    position: 'absolute',
    top: rs(8), left: rs(8),
    paddingHorizontal: rs(7), paddingVertical: rs(3),
    borderRadius: rs(8),
  },
  statusText: {
    color: '#fff', fontSize: fs(8), fontWeight: '700', letterSpacing: 0.5,
  },
  typeBadge: {
    position: 'absolute',
    top: rs(8), right: rs(8),
    width: rs(22), height: rs(22),
    borderRadius: rs(11),
    backgroundColor: 'rgba(11,18,25,0.65)',
    alignItems: 'center', justifyContent: 'center',
  },
  nameOverlay: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: rs(10), paddingVertical: rs(8),
  },
  cardName: { color: '#fff', fontSize: fs(14), fontWeight: '700' },
  cardSub: {
    color: 'rgba(255,255,255,0.8)', fontSize: fs(10), marginTop: rs(2),
  },

  // Empty
  emptyCard: {
    backgroundColor: colors.card, borderRadius: radii.card,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.xl, gap: rs(10), alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: 'Sora_700Bold', fontSize: fs(14), color: colors.text,
    textAlign: 'center', marginTop: rs(4),
  },
  emptyHint: {
    fontFamily: 'Sora_400Regular', fontSize: fs(12), color: colors.textDim,
    textAlign: 'center', lineHeight: fs(18),
  },
});
