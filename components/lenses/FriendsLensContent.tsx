/**
 * FriendsLensContent — Pet's social graph as Instagram-like feed.
 *
 * Painel principal: 2 colunas de cards visuais com foto cover (16:9),
 * nome do amigo, espécie, contador de encontros. Tap → abre FeedSheet
 * com timeline vertical de todos os encontros do amigo (foto + narração
 * IA + data).
 *
 * Sem foto cover → fallback com avatar do pet titular + ícone PawPrint.
 */
import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList } from 'react-native';
import { Dog, Cat, Bird, Heart, Users, Sparkles, PawPrint, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { colors } from '../../constants/colors';
import { rs, fs } from '../../hooks/useResponsive';
import { radii, spacing } from '../../constants/spacing';
import { Skeleton } from '../Skeleton';
import { useLensFriends, type PetConnection } from '../../hooks/useLens';
import { FeedSheet, type FeedPost } from './FeedSheet';
import { AddFriendSheet } from './AddFriendSheet';

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null, lang: string): string {
  if (!dateStr) return '—';
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const dt = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(dateStr);
  return dt.toLocaleDateString(lang, { day: '2-digit', month: 'short' });
}

const SPECIES_ICON: Record<string, React.ElementType> = {
  dog: Dog, cat: Cat, bird: Bird,
};

const SPECIES_COLOR: Record<string, string> = {
  dog: colors.click, cat: colors.click, bird: colors.sky,
  rabbit: colors.success, other: colors.petrol, unknown: colors.textDim,
};

// ── FriendCard (grid card, foto grande + nome) ──────────────────────────────

const FriendCard = React.memo(function FriendCard({
  connection, onPress,
}: {
  connection: PetConnection;
  onPress: (c: PetConnection) => void;
}) {
  const { t, i18n } = useTranslation();
  const species = connection.friend_species ?? 'unknown';
  const SpeciesIcon = SPECIES_ICON[species] ?? Dog;
  const color = SPECIES_COLOR[species] ?? colors.textDim;

  const cover = connection.cover_url;
  const lastSeen = connection.last_seen_at
    ? formatDate(connection.last_seen_at, i18n.language)
    : null;

  return (
    <TouchableOpacity
      style={styles.gridCard}
      activeOpacity={0.85}
      onPress={() => onPress(connection)}
    >
      {/* Cover do AMIGO ou fallback com icone da especie do AMIGO. NUNCA usar
          avatar do pet titular aqui — confunde tutor a achar que e foto do seu
          proprio pet (bug 2026-04-28). */}
      <View style={styles.coverWrap}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.coverFallback, { backgroundColor: color + '22' }]}>
            <View style={[styles.fallbackIconCircle, { backgroundColor: color + '40' }]}>
              <SpeciesIcon size={rs(48)} color="#FFFFFF" strokeWidth={2.2} />
            </View>
            <Text style={styles.fallbackHint} numberOfLines={1}>
              {t('friends.addPhotoHint', { defaultValue: 'Adicione uma foto' })}
            </Text>
          </View>
        )}

        {/* Gradiente escuro embaixo via overlay sólido (sem dependência de LinearGradient) */}
        <View style={styles.coverShade} pointerEvents="none" />

        {/* Badge contador no canto superior direito */}
        <View style={styles.countBadge}>
          <Heart size={rs(10)} color="#fff" strokeWidth={2.4} fill="#fff" />
          <Text style={styles.countText}>{connection.meet_count}</Text>
        </View>

        {/* Nome embaixo da foto, sobre o gradiente */}
        <View style={styles.nameOverlay}>
          <Text style={styles.cardName} numberOfLines={1}>{connection.friend_name}</Text>
          <Text style={styles.cardSub} numberOfLines={1}>
            {connection.friend_breed ?? t(`friends.species_${species}`, { defaultValue: '' })}
            {lastSeen ? ` · ${lastSeen}` : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ── Summary ──────────────────────────────────────────────────────────────────

function FriendsSummary({ total, topFriend }: { total: number; topFriend: PetConnection | null }) {
  const { t } = useTranslation();
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryLeft}>
        <View style={[styles.summaryIconWrap, { backgroundColor: colors.clickSoft }]}>
          <Users size={rs(22)} color={colors.click} strokeWidth={1.8} />
        </View>
        <View>
          <Text style={styles.summaryCount}>{total}</Text>
          <Text style={styles.summaryLabel}>{t('friends.totalFriends')}</Text>
        </View>
      </View>
      {topFriend && (
        <View style={styles.summaryRight}>
          <Text style={styles.bestFriendLabel}>{t('friends.bestFriend')}</Text>
          <Text style={styles.bestFriendName}>{topFriend.friend_name}</Text>
          <Text style={styles.bestFriendMeets}>{topFriend.meet_count}x</Text>
        </View>
      )}
    </View>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

interface FriendsLensContentProps {
  petId: string;
}

export function FriendsLensContent({ petId }: FriendsLensContentProps) {
  const { t } = useTranslation();
  const { data: connections, isLoading } = useLensFriends(petId);
  const [activeFriend, setActiveFriend] = useState<PetConnection | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const feedPosts = useMemo<FeedPost[]>(() => {
    if (!activeFriend) return [];
    return activeFriend.posts.map((p) => ({
      id: p.id,
      date: p.date,
      narration: p.narration,
      notes: p.notes,
      cover_url: p.cover_url,
      photos: p.photos,
      chips: [],
    }));
  }, [activeFriend]);

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <Skeleton width="100%" height={rs(72)} radius={radii.card} />
        <View style={{ height: spacing.sm }} />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Skeleton width="48%" height={rs(180)} radius={radii.card} />
          <Skeleton width="48%" height={rs(180)} radius={radii.card} />
        </View>
      </View>
    );
  }

  if (!connections || connections.length === 0) {
    return (
      <View>
        <View style={styles.emptyCard}>
          <Sparkles size={rs(24)} color={colors.ai} strokeWidth={1.8} />
          <Text style={styles.emptyTitle}>{t('friends.emptyTitle')}</Text>
          <Text style={styles.emptyHint}>{t('friends.emptyHint')}</Text>
          <TouchableOpacity
            style={styles.emptyAddBtn}
            onPress={() => setAddOpen(true)}
            activeOpacity={0.85}
          >
            <Plus size={rs(16)} color="#fff" strokeWidth={2.2} />
            <Text style={styles.emptyAddBtnText}>
              {t('addFriend.title', { defaultValue: 'Adicionar amigo' })}
            </Text>
          </TouchableOpacity>
        </View>
        <AddFriendSheet visible={addOpen} onClose={() => setAddOpen(false)} petId={petId} />
      </View>
    );
  }

  const topFriend = [...connections].sort((a, b) => b.meet_count - a.meet_count)[0] ?? null;

  return (
    <View>
      <FriendsSummary total={connections.length} topFriend={topFriend} />

      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeader}>{t('friends.listTitle').toUpperCase()}</Text>
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
        data={connections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FriendCard
            connection={item}
            onPress={setActiveFriend}
          />
        )}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={styles.gridRow}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />

      <FeedSheet
        visible={!!activeFriend}
        onClose={() => setActiveFriend(null)}
        title={activeFriend?.friend_name ?? ''}
        subtitle={
          activeFriend
            ? `${activeFriend.meet_count} ${activeFriend.meet_count === 1
                ? t('friends.meet', { defaultValue: 'encontro' })
                : t('friends.meets')}`
            : ''
        }
        headerColor={colors.click}
        posts={feedPosts}
        petAvatarUrl={null}
        FallbackIcon={PawPrint}
      />

      <AddFriendSheet visible={addOpen} onClose={() => setAddOpen(false)} petId={petId} />
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  loadingWrap: { gap: spacing.sm },

  // Summary (mantido como estava)
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  summaryIconWrap: {
    width: rs(46), height: rs(46), borderRadius: radii.xl,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryCount: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: fs(28), color: colors.click, lineHeight: fs(30),
  },
  summaryLabel: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.textDim },
  summaryRight: { alignItems: 'flex-end' },
  bestFriendLabel: {
    fontFamily: 'Sora_600SemiBold', fontSize: fs(9), color: colors.textDim,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  bestFriendName: { fontFamily: 'Sora_700Bold', fontSize: fs(15), color: colors.text, marginTop: rs(2) },
  bestFriendMeets: { fontFamily: 'JetBrainsMono_700Bold', fontSize: fs(11), color: colors.rose, marginTop: rs(1) },

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
    marginTop: rs(12),
  },
  emptyAddBtnText: {
    color: '#fff', fontSize: fs(13), fontWeight: '700',
  },

  // Grid
  gridRow: {
    gap: spacing.sm,
  },

  // Card
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
    aspectRatio: 4 / 5, // mais alto que largo, estilo Instagram
    position: 'relative',
  },
  cover: {
    width: '100%', height: '100%',
    backgroundColor: colors.bgDeep,
  },
  coverFallback: {
    width: '100%', height: '100%',
    alignItems: 'center', justifyContent: 'center',
    gap: rs(10),
  },
  fallbackIconCircle: {
    width: rs(82), height: rs(82), borderRadius: rs(41),
    alignItems: 'center', justifyContent: 'center',
  },
  fallbackHint: {
    color: colors.textSec, fontSize: fs(10), fontWeight: '600',
    paddingHorizontal: rs(12), textAlign: 'center',
    letterSpacing: 0.3,
  },
  fallbackAvatarImg: {
    width: rs(72), height: rs(72), borderRadius: rs(36),
    borderWidth: 3, borderColor: colors.bg,
  },
  // Sombra sólida no terço inferior pra contrastar com o nome em branco
  coverShade: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0, top: '55%',
    backgroundColor: 'rgba(11,18,25,0.70)',
  },
  countBadge: {
    position: 'absolute',
    top: rs(8), right: rs(8),
    flexDirection: 'row', alignItems: 'center',
    gap: rs(3),
    paddingHorizontal: rs(7), paddingVertical: rs(3),
    backgroundColor: 'rgba(11,18,25,0.65)',
    borderRadius: rs(10),
  },
  countText: {
    color: '#fff', fontSize: fs(10), fontWeight: '700',
  },
  nameOverlay: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: rs(10), paddingVertical: rs(8),
  },
  cardName: {
    color: '#fff', fontSize: fs(14), fontWeight: '700',
  },
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
