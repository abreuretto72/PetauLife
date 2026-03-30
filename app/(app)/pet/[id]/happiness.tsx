import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Flame,
  ShieldCheck,
  Target,
} from 'lucide-react-native';

import { rs, fs } from '../../../../hooks/useResponsive';
import { colors } from '../../../../constants/colors';
import { radii, spacing } from '../../../../constants/spacing';
import { usePet } from '../../../../hooks/usePets';
import { Skeleton } from '../../../../components/Skeleton';

type PeriodKey = '1M' | '3M' | '6M' | '1A' | 'ALL';

interface MoodData { readonly key: string; readonly labelKey: string; readonly percent: number; readonly color: string }
interface StreakData { readonly icon: React.ElementType; readonly value: number; readonly labelKey: string; readonly color: string }
interface FactorData { readonly labelKey: string; readonly percent: number; readonly positive: boolean }

const PERIODS: readonly PeriodKey[] = ['1M', '3M', '6M', '1A', 'ALL'];

const MOOD_COLORS = {
  happy: '#06D6A0',
  calm: '#118AB2',
  ecstatic: '#FFD166',
  tired: '#8338EC',
  anxious: '#EF476F',
  sad: '#7B8794',
} as const;

const MOCK_MOODS: readonly MoodData[] = [
  { key: 'happy', labelKey: 'happiness.moodHappy', percent: 38, color: MOOD_COLORS.happy },
  { key: 'calm', labelKey: 'happiness.moodCalm', percent: 25, color: MOOD_COLORS.calm },
  { key: 'ecstatic', labelKey: 'happiness.moodEcstatic', percent: 15, color: MOOD_COLORS.ecstatic },
  { key: 'tired', labelKey: 'happiness.moodTired', percent: 12, color: MOOD_COLORS.tired },
  { key: 'anxious', labelKey: 'happiness.moodAnxious', percent: 7, color: MOOD_COLORS.anxious },
  { key: 'sad', labelKey: 'happiness.moodSad', percent: 3, color: MOOD_COLORS.sad },
];

const MOCK_STREAKS: readonly StreakData[] = [
  { icon: Flame, value: 12, labelKey: 'happiness.streakHappy', color: MOOD_COLORS.happy },
  { icon: ShieldCheck, value: 5, labelKey: 'happiness.streakNoAnxiety', color: colors.petrol },
  { icon: Target, value: 8, labelKey: 'happiness.streakAbove70', color: colors.gold },
];

const MOCK_FACTORS: readonly FactorData[] = [
  { labelKey: 'happiness.factorWalks', percent: 92, positive: true },
  { labelKey: 'happiness.factorPlay', percent: 88, positive: true },
  { labelKey: 'happiness.factorAffection', percent: 85, positive: true },
  { labelKey: 'happiness.factorAlone', percent: 72, positive: false },
  { labelKey: 'happiness.factorNoise', percent: 65, positive: false },
];

const MOCK_SCORE = 78;
const MOCK_TREND = 6;

function HappinessSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton width="100%" height={rs(160)} radius={radii.card} style={{ marginBottom: spacing.lg }} />
      <Skeleton width="100%" height={rs(44)} radius={radii.lg} style={{ marginBottom: spacing.lg }} />
      <Skeleton width="100%" height={rs(200)} radius={radii.card} style={{ marginBottom: spacing.lg }} />
      <Skeleton width="100%" height={rs(90)} radius={radii.card} style={{ marginBottom: spacing.lg }} />
      <Skeleton width="100%" height={rs(180)} radius={radii.card} style={{ marginBottom: spacing.lg }} />
      <Skeleton width="100%" height={rs(120)} radius={radii.card} />
    </View>
  );
}

export default function HappinessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { pet, isLoading } = usePet(id!);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodKey>('3M');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.screen}>
        <HappinessSkeleton />
      </View>
    );
  }

  const petName = pet?.name ?? '—';
  const trendPositive = MOCK_TREND >= 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        {/* ── HERO SCORE ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroRing}>
            <Text style={styles.heroScore}>{MOCK_SCORE}</Text>
          </View>
          <Text style={styles.heroLabel}>{t('happiness.moodLabel')}</Text>
          <View style={[styles.trendBadge, { backgroundColor: trendPositive ? colors.successSoft : colors.dangerSoft }]}>
            {trendPositive ? (
              <TrendingUp size={rs(14)} color={colors.success} strokeWidth={2} />
            ) : (
              <TrendingDown size={rs(14)} color={colors.danger} strokeWidth={2} />
            )}
            <Text style={[styles.trendText, { color: trendPositive ? colors.success : colors.danger }]}>
              {trendPositive ? '+' : ''}{MOCK_TREND}
            </Text>
          </View>
        </View>

        {/* ── PERIOD SELECTOR ── */}
        <View style={styles.periodRow}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodPill, selectedPeriod === p && styles.periodPillActive]}
              onPress={() => setSelectedPeriod(p)}
              activeOpacity={0.7}
            >
              <Text style={[styles.periodText, selectedPeriod === p && styles.periodTextActive]}>
                {p === 'ALL' ? t('happiness.periodAll') : p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── MOOD DISTRIBUTION ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('happiness.moodDistribution')}</Text>
          {MOCK_MOODS.map((mood) => (
            <View key={mood.key} style={styles.moodRow}>
              <View style={[styles.moodDot, { backgroundColor: mood.color }]} />
              <Text style={styles.moodLabel}>{t(mood.labelKey)}</Text>
              <Text style={styles.moodPercent}>{mood.percent}%</Text>
              <View style={styles.moodBarTrack}>
                <View style={[styles.moodBarFill, { width: `${mood.percent}%`, backgroundColor: mood.color }]} />
              </View>
            </View>
          ))}
        </View>

        {/* ── STREAKS ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('happiness.streaks')}</Text>
          <View style={styles.streaksRow}>
            {MOCK_STREAKS.map((streak, idx) => {
              const Icon = streak.icon;
              return (
                <View key={idx} style={styles.streakCard}>
                  <Icon size={rs(22)} color={streak.color} strokeWidth={1.8} />
                  <Text style={styles.streakValue}>{streak.value}</Text>
                  <Text style={styles.streakLabel} numberOfLines={2}>{t(streak.labelKey)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── CORRELATION FACTORS ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{t('happiness.correlationTitle')}</Text>
          {MOCK_FACTORS.map((factor, idx) => (
            <View key={idx} style={styles.factorRow}>
              {factor.positive ? (
                <TrendingUp size={rs(16)} color={colors.success} strokeWidth={1.8} />
              ) : (
                <TrendingDown size={rs(16)} color={colors.danger} strokeWidth={1.8} />
              )}
              <Text style={styles.factorLabel}>{t(factor.labelKey)}</Text>
              <Text style={[styles.factorPercent, { color: factor.positive ? colors.success : colors.danger }]}>
                {factor.positive ? '+' : '-'}{factor.percent}%
              </Text>
            </View>
          ))}
        </View>

        {/* ── AI INSIGHT ── */}
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Sparkles size={rs(16)} color={colors.purple} strokeWidth={1.8} />
            <Text style={styles.insightBadge}>{t('happiness.aiInsightLabel')}</Text>
          </View>
          <Text style={styles.insightText}>
            {t('happiness.aiInsightMock', { name: petName })}
          </Text>
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { padding: spacing.md, paddingBottom: spacing.xxl },
  heroCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    alignItems: 'center',
    paddingVertical: rs(24),
    marginBottom: spacing.md,
  },
  heroRing: {
    width: rs(100),
    height: rs(100),
    borderRadius: rs(50),
    borderWidth: rs(4),
    borderColor: colors.success,
    backgroundColor: colors.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heroScore: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: fs(36),
    color: colors.text,
  },
  heroLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: fs(14),
    color: colors.textSec,
    marginBottom: spacing.sm,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
    borderRadius: radii.sm,
  },
  trendText: {
    fontFamily: 'JetBrainsMono_600SemiBold',
    fontSize: fs(13),
  },
  periodRow: {
    flexDirection: 'row',
    gap: rs(8),
    marginBottom: spacing.md,
  },
  periodPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: rs(10),
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodPillActive: { backgroundColor: colors.success, borderColor: colors.success },
  periodText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.textSec },
  periodTextActive: { color: '#FFFFFF' },
  sectionCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: fs(11),
    color: colors.textDim,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
  },
  moodRow: { flexDirection: 'row', alignItems: 'center', marginBottom: rs(10) },
  moodDot: { width: rs(10), height: rs(10), borderRadius: rs(5), marginRight: rs(8) },
  moodLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: fs(13),
    color: colors.text,
    width: rs(80),
  },
  moodPercent: {
    fontFamily: 'JetBrainsMono_600SemiBold',
    fontSize: fs(12),
    color: colors.textSec,
    width: rs(40),
    textAlign: 'right',
    marginRight: rs(10),
  },
  moodBarTrack: {
    flex: 1,
    height: rs(4),
    backgroundColor: colors.border,
    borderRadius: rs(2),
    overflow: 'hidden',
  },
  moodBarFill: { height: '100%', borderRadius: rs(2) },
  streaksRow: { flexDirection: 'row', gap: rs(10) },
  streakCard: {
    flex: 1,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xxl,
    alignItems: 'center',
    paddingVertical: rs(14),
    paddingHorizontal: rs(6),
  },
  streakValue: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: fs(22),
    color: colors.text,
    marginTop: rs(4),
  },
  streakLabel: {
    fontFamily: 'Sora_400Regular',
    fontSize: fs(10),
    color: colors.textDim,
    textAlign: 'center',
    marginTop: rs(2),
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    paddingVertical: rs(8),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  factorLabel: { flex: 1, fontFamily: 'Sora_500Medium', fontSize: fs(13), color: colors.text },
  factorPercent: { fontFamily: 'JetBrainsMono_600SemiBold', fontSize: fs(13) },
  insightCard: {
    backgroundColor: colors.purpleSoft,
    borderWidth: 1,
    borderColor: colors.purple + '30',
    borderRadius: radii.card,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    marginBottom: spacing.sm,
  },
  insightBadge: {
    fontFamily: 'Sora_700Bold',
    fontSize: fs(10),
    color: colors.purple,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  insightText: {
    fontFamily: 'Caveat_400Regular',
    fontSize: fs(16),
    color: colors.text,
    lineHeight: fs(16) * 1.9,
    fontStyle: 'italic',
  },
});
