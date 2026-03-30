import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, FlatList,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Trophy, Award, Syringe, BookOpen, Camera, Zap,
  Heart, MapPin, Lock, Gift, Sparkles, Star, Crown, Users,
} from 'lucide-react-native';

import { rs, fs } from '../../../../hooks/useResponsive';
import { colors } from '../../../../constants/colors';
import { radii, spacing } from '../../../../constants/spacing';
import { usePet } from '../../../../hooks/usePets';
import { Skeleton } from '../../../../components/Skeleton';

type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
type CategoryId = 'all' | 'care' | 'social' | 'health' | 'adventure' | 'legacy';

interface Badge {
  id: string;
  nameKey: string;
  rarity: Rarity;
  icon: React.ElementType;
  unlocked: boolean;
  progress?: number;
  goal?: number;
}

interface Reward {
  id: string;
  descriptionKey: string;
  xpCost: number;
  unlocked: boolean;
}

const RARITY_COLORS: Record<Rarity, string> = {
  common: '#B8C4D0', rare: '#5B9CF0', epic: '#A87EDB', legendary: '#F0C754',
};

const CATEGORIES: { id: CategoryId; labelKey: string }[] = [
  { id: 'all', labelKey: 'achievements.filterAll' },
  { id: 'care', labelKey: 'achievements.filterCare' },
  { id: 'social', labelKey: 'achievements.filterSocial' },
  { id: 'health', labelKey: 'achievements.filterHealth' },
  { id: 'adventure', labelKey: 'achievements.filterAdventure' },
  { id: 'legacy', labelKey: 'achievements.filterLegacy' },
];

const MOCK_BADGES: Badge[] = [
  { id: '1', nameKey: 'achievements.badgeFirstWalk', rarity: 'common', icon: Award, unlocked: true },
  { id: '2', nameKey: 'achievements.badgeVaccineDay', rarity: 'rare', icon: Syringe, unlocked: true },
  { id: '3', nameKey: 'achievements.badgeDiaryFaithful', rarity: 'rare', icon: BookOpen, unlocked: true },
  { id: '4', nameKey: 'achievements.badgePhotographer', rarity: 'common', icon: Camera, unlocked: true },
  { id: '5', nameKey: 'achievements.badgeMarathoner', rarity: 'epic', icon: Zap, unlocked: false, progress: 25, goal: 50 },
  { id: '6', nameKey: 'achievements.badgeSocialButterfly', rarity: 'rare', icon: Users, unlocked: false, progress: 3, goal: 10 },
  { id: '7', nameKey: 'achievements.badgeCentenarian', rarity: 'legendary', icon: Crown, unlocked: false, progress: 87, goal: 100 },
  { id: '8', nameKey: 'achievements.badgeLoveHero', rarity: 'epic', icon: Heart, unlocked: false, progress: 12, goal: 30 },
  { id: '9', nameKey: 'achievements.badgeExplorer', rarity: 'rare', icon: MapPin, unlocked: false, progress: 5, goal: 15 },
  { id: '10', nameKey: 'achievements.badgeStarPet', rarity: 'legendary', icon: Star, unlocked: false, progress: 40, goal: 100 },
];

const MOCK_REWARDS: Reward[] = [
  { id: 'r1', descriptionKey: 'achievements.rewardPetShop', xpCost: 200, unlocked: true },
  { id: 'r2', descriptionKey: 'achievements.rewardExclusiveBadge', xpCost: 400, unlocked: false },
  { id: 'r3', descriptionKey: 'achievements.rewardVetConsult', xpCost: 600, unlocked: false },
];

function LevelCard({ t }: { t: (key: string) => string }) {
  const currentXp = 615;
  const maxXp = 1000;
  return (
    <View style={s.levelCard}>
      <View style={s.levelHeader}>
        <View style={s.levelIconWrap}>
          <Trophy size={rs(28)} color={colors.gold} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.levelTitle}>{t('achievements.levelExplorer')}</Text>
          <Text style={s.levelSubtitle}>{t('achievements.levelLabel')}</Text>
        </View>
      </View>
      <View style={s.xpBarTrack}>
        <View style={[s.xpBarFill, { width: `${(currentXp / maxXp) * 100}%` }]} />
      </View>
      <Text style={s.xpText}>
        <Text style={s.xpValue}>{currentXp}</Text>
        <Text style={s.xpSep}> / {maxXp} XP</Text>
      </Text>
      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={s.statValue}>12/30</Text>
          <Text style={s.statLabel}>{t('achievements.statBadges')}</Text>
        </View>
        <View style={[s.statItem, s.statBorder]}>
          <Text style={s.statValue}>615</Text>
          <Text style={s.statLabel}>XP</Text>
        </View>
        <View style={s.statItem}>
          <Text style={s.statValue}>4 {t('achievements.statWeeksShort')}</Text>
          <Text style={s.statLabel}>{t('achievements.statStreak')}</Text>
        </View>
      </View>
    </View>
  );
}

function BadgeCard({ badge, t }: { badge: Badge; t: (key: string) => string }) {
  const rc = RARITY_COLORS[badge.rarity];
  const Icon = badge.icon;
  const locked = !badge.unlocked;
  const rarityKey = `achievements.rarity${badge.rarity.charAt(0).toUpperCase()}${badge.rarity.slice(1)}`;
  return (
    <View style={[s.badgeCard, locked && s.badgeCardLocked]}>
      <View style={[s.badgeIconCircle, { borderColor: locked ? colors.textGhost : rc }]}>
        <Icon size={rs(24)} color={locked ? colors.textGhost : rc} strokeWidth={1.8} />
        {locked && (
          <View style={s.lockOverlay}>
            <Lock size={rs(12)} color={colors.textDim} strokeWidth={2} />
          </View>
        )}
      </View>
      <Text style={[s.badgeName, locked && s.badgeNameLocked]}>{t(badge.nameKey)}</Text>
      <Text style={[s.badgeRarity, { color: locked ? colors.textGhost : rc }]}>{t(rarityKey)}</Text>
      {locked && badge.progress != null && badge.goal != null && (
        <View style={s.badgeProgressWrap}>
          <View style={s.badgeProgressTrack}>
            <View style={[s.badgeProgressFill, { width: `${(badge.progress / badge.goal) * 100}%`, backgroundColor: rc }]} />
          </View>
          <Text style={s.badgeProgressText}>{badge.progress}/{badge.goal}</Text>
        </View>
      )}
    </View>
  );
}

function RewardCard({ reward, t }: { reward: Reward; t: (key: string) => string }) {
  return (
    <View style={s.rewardCard}>
      <View style={s.rewardLeft}>
        <Gift size={rs(20)} color={colors.gold} strokeWidth={1.8} />
        <Text style={s.rewardDesc}>{t(reward.descriptionKey)}</Text>
      </View>
      <View style={[s.rewardXpBadge, reward.unlocked && s.rewardXpUnlocked]}>
        {!reward.unlocked && <Lock size={rs(10)} color={colors.textDim} strokeWidth={2} />}
        <Text style={[s.rewardXpText, reward.unlocked && s.rewardXpTextUnlocked]}>
          {reward.xpCost} XP
        </Text>
      </View>
    </View>
  );
}

function LoadingSkeleton() {
  return (
    <View style={s.skeletonWrap}>
      <Skeleton width="100%" height={rs(180)} radius={radii.card} />
      <View style={{ flexDirection: 'row' }}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} width={rs(60)} height={rs(32)} radius={radii.md} style={{ marginRight: spacing.sm }} />
        ))}
      </View>
      <Skeleton width="40%" height={rs(14)} radius={radii.sm} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Skeleton width="48%" height={rs(140)} radius={radii.card} />
        <Skeleton width="48%" height={rs(140)} radius={radii.card} />
      </View>
    </View>
  );
}

export default function AchievementsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const petQuery = usePet(id!);
  const [activeFilter, setActiveFilter] = useState<CategoryId>('all');
  const [refreshing, setRefreshing] = useState(false);

  const pet = petQuery.data ?? null;
  const unlockedBadges = MOCK_BADGES.filter((b) => b.unlocked);
  const lockedBadges = MOCK_BADGES.filter((b) => !b.unlocked);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await petQuery.refetch();
    setRefreshing(false);
  }, [petQuery]);

  const renderBadge = useCallback(
    ({ item }: { item: Badge }) => <BadgeCard badge={item} t={t} />,
    [t],
  );
  const keyExtractor = useCallback((item: Badge) => item.id, []);

  if (petQuery.isLoading) {
    return <View style={s.container}><LoadingSkeleton /></View>;
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />}
    >
      <LevelCard t={t} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filtersRow} style={s.filtersScroll}>
        {CATEGORIES.map((cat) => {
          const active = activeFilter === cat.id;
          return (
            <TouchableOpacity key={cat.id} style={[s.filterPill, active && s.filterPillActive]} onPress={() => setActiveFilter(cat.id)} activeOpacity={0.7}>
              <Text style={[s.filterText, active && s.filterTextActive]}>{t(cat.labelKey)}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={s.sectionLabel}>{t('achievements.unlocked').toUpperCase()} ({unlockedBadges.length})</Text>
      <FlatList data={unlockedBadges} renderItem={renderBadge} keyExtractor={keyExtractor} numColumns={2} columnWrapperStyle={s.gridRow} scrollEnabled={false} />

      <Text style={[s.sectionLabel, { marginTop: spacing.lg }]}>{t('achievements.locked').toUpperCase()} ({lockedBadges.length})</Text>
      <FlatList data={lockedBadges} renderItem={renderBadge} keyExtractor={keyExtractor} numColumns={2} columnWrapperStyle={s.gridRow} scrollEnabled={false} />

      <View style={s.rewardsHeader}>
        <Gift size={rs(18)} color={colors.gold} strokeWidth={1.8} />
        <Text style={s.rewardsTitle}>{t('achievements.rewards').toUpperCase()}</Text>
      </View>
      {MOCK_REWARDS.map((rw) => <RewardCard key={rw.id} reward={rw} t={t} />)}

      <View style={s.aiNote}>
        <Sparkles size={rs(18)} color={colors.purple} strokeWidth={1.8} />
        <Text style={s.aiNoteText}>{t('achievements.aiNote', { name: pet?.name ?? '—' })}</Text>
      </View>
      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  levelCard: { backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md },
  levelHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  levelIconWrap: { width: rs(48), height: rs(48), borderRadius: rs(14), backgroundColor: `${colors.gold}15`, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  levelTitle: { fontFamily: 'Sora_700Bold', fontSize: fs(20), color: colors.gold },
  levelSubtitle: { fontFamily: 'Sora_400Regular', fontSize: fs(12), color: colors.textSec, marginTop: rs(2) },
  xpBarTrack: { height: rs(6), backgroundColor: colors.border, borderRadius: rs(3), overflow: 'hidden', marginBottom: spacing.sm },
  xpBarFill: { height: '100%', backgroundColor: colors.gold, borderRadius: rs(3) },
  xpText: { textAlign: 'right', marginBottom: spacing.md },
  xpValue: { fontFamily: 'JetBrainsMono_700Bold', fontSize: fs(14), color: colors.gold },
  xpSep: { fontFamily: 'JetBrainsMono_600SemiBold', fontSize: fs(12), color: colors.textDim },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.bgCard, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.sm },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.xs },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
  statValue: { fontFamily: 'JetBrainsMono_700Bold', fontSize: fs(14), color: colors.text },
  statLabel: { fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textDim, marginTop: rs(2) },
  filtersScroll: { marginBottom: spacing.lg },
  filtersRow: { gap: spacing.sm },
  filterPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.md, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  filterPillActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  filterText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.textSec },
  filterTextActive: { color: colors.bg },
  sectionLabel: { fontFamily: 'Sora_700Bold', fontSize: fs(11), color: colors.textDim, letterSpacing: 1.5, marginBottom: spacing.md },
  gridRow: { justifyContent: 'space-between', marginBottom: spacing.md },
  badgeCard: { width: '48%', backgroundColor: colors.card, borderRadius: radii.card, borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: 'center' },
  badgeCardLocked: { opacity: 0.6 },
  badgeIconCircle: { width: rs(52), height: rs(52), borderRadius: rs(26), borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  lockOverlay: { position: 'absolute', bottom: rs(-2), right: rs(-2), width: rs(20), height: rs(20), borderRadius: rs(10), backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  badgeName: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.text, textAlign: 'center', marginBottom: rs(2) },
  badgeNameLocked: { color: colors.textDim },
  badgeRarity: { fontFamily: 'Sora_700Bold', fontSize: fs(9), letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: spacing.xs },
  badgeProgressWrap: { width: '100%', alignItems: 'center', marginTop: spacing.xs },
  badgeProgressTrack: { width: '100%', height: rs(4), backgroundColor: colors.border, borderRadius: rs(2), overflow: 'hidden', marginBottom: rs(4) },
  badgeProgressFill: { height: '100%', borderRadius: rs(2) },
  badgeProgressText: { fontFamily: 'JetBrainsMono_600SemiBold', fontSize: fs(10), color: colors.textDim },
  rewardsHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.md },
  rewardsTitle: { fontFamily: 'Sora_700Bold', fontSize: fs(11), color: colors.textDim, letterSpacing: 1.5 },
  rewardCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  rewardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  rewardDesc: { fontFamily: 'Sora_400Regular', fontSize: fs(13), color: colors.text, flex: 1 },
  rewardXpBadge: { flexDirection: 'row', alignItems: 'center', gap: rs(4), paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.sm, backgroundColor: `${colors.gold}15` },
  rewardXpUnlocked: { backgroundColor: `${colors.success}15` },
  rewardXpText: { fontFamily: 'JetBrainsMono_700Bold', fontSize: fs(11), color: colors.textDim },
  rewardXpTextUnlocked: { color: colors.success },
  aiNote: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: `${colors.purple}12`, borderRadius: radii.lg, borderWidth: 1, borderColor: `${colors.purple}25`, padding: spacing.md, marginTop: spacing.lg },
  aiNoteText: { flex: 1, fontFamily: 'Caveat_400Regular', fontSize: fs(15), color: colors.textSec, fontStyle: 'italic', lineHeight: fs(15) * 1.9 },
  skeletonWrap: { padding: spacing.md, gap: spacing.md },
});
