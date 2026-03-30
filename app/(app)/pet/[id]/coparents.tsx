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
  Dog,
  Cat,
  Shield,
  Users,
  UserCheck,
  Stethoscope,
  Star,
  Key,
  Send,
  Calendar,
  Clock,
  Footprints,
  SmilePlus,
  Camera,
  Heart,
  Cookie,
} from 'lucide-react-native';

import { rs, fs } from '../../../../hooks/useResponsive';
import { colors } from '../../../../constants/colors';
import { radii, spacing } from '../../../../constants/spacing';
import { usePet } from '../../../../hooks/usePets';
import { Skeleton } from '../../../../components/Skeleton';

// ──────────────────────────────────────────
// Types
// ──────────────────────────────────────────
type TabId = 'team' | 'schedule' | 'activities';

interface Caregiver {
  id: string;
  nameKey: string;
  roleKey: string;
  roleColor: string;
  icon: React.ElementType;
  trust: string;
  activities: number;
  lastActionKey: string;
}

interface TimeSlot {
  time: string;
  taskKey: string;
  personKey: string;
}

interface Activity {
  id: string;
  color: string;
  personKey: string;
  actionKey: string;
  timeKey: string;
  icon: React.ElementType;
}

// ──────────────────────────────────────────
// Mock Data
// ──────────────────────────────────────────
const CAREGIVERS: Caregiver[] = [
  { id: '1', nameKey: 'coparents.caregiverAna', roleKey: 'coparents.rolePrimary', roleColor: colors.accent, icon: UserCheck, trust: '5.0', activities: 142, lastActionKey: 'coparents.lastToday' },
  { id: '2', nameKey: 'coparents.caregiverMaria', roleKey: 'coparents.roleBackup', roleColor: colors.danger, icon: Users, trust: '4.8', activities: 67, lastActionKey: 'coparents.lastYesterday' },
  { id: '3', nameKey: 'coparents.caregiverPaulo', roleKey: 'coparents.roleGodparent', roleColor: colors.petrol, icon: Heart, trust: '4.5', activities: 23, lastActionKey: 'coparents.last3days' },
  { id: '4', nameKey: 'coparents.caregiverCarla', roleKey: 'coparents.roleVet', roleColor: colors.success, icon: Stethoscope, trust: '5.0', activities: 8, lastActionKey: 'coparents.last1week' },
];

const DAYS = ['coparents.mon', 'coparents.tue', 'coparents.wed', 'coparents.thu', 'coparents.fri', 'coparents.sat', 'coparents.sun'];

const SCHEDULE: TimeSlot[] = [
  { time: '07:00', taskKey: 'coparents.taskMorningWalk', personKey: 'coparents.schedulePaula' },
  { time: '12:00', taskKey: 'coparents.taskLunch', personKey: 'coparents.scheduleAna' },
  { time: '17:30', taskKey: 'coparents.taskAfternoonWalk', personKey: 'coparents.scheduleAna' },
];

const ACTIVITIES: Activity[] = [
  { id: '1', color: colors.accent, personKey: 'coparents.actPersonAna', actionKey: 'coparents.actWalk', timeKey: 'coparents.act30min', icon: Footprints },
  { id: '2', color: colors.purple, personKey: 'coparents.actPersonAna', actionKey: 'coparents.actMood', timeKey: 'coparents.act2h', icon: SmilePlus },
  { id: '3', color: colors.petrol, personKey: 'coparents.actPersonMaria', actionKey: 'coparents.actPhoto', timeKey: 'coparents.act5h', icon: Camera },
  { id: '4', color: colors.success, personKey: 'coparents.actPersonCarla', actionKey: 'coparents.actVet', timeKey: 'coparents.actYesterday', icon: Stethoscope },
  { id: '5', color: colors.gold, personKey: 'coparents.actPersonPaulo', actionKey: 'coparents.actTreat', timeKey: 'coparents.act2days', icon: Cookie },
];

// ──────────────────────────────────────────
// Skeleton Loading
// ──────────────────────────────────────────
function CoparentsSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <Skeleton width="100%" height={rs(80)} />
      <View style={styles.skeletonTabs}>
        <Skeleton width={rs(90)} height={rs(36)} />
        <Skeleton width={rs(90)} height={rs(36)} />
        <Skeleton width={rs(90)} height={rs(36)} />
      </View>
      <Skeleton width="100%" height={rs(120)} />
      <Skeleton width="100%" height={rs(120)} />
      <Skeleton width="100%" height={rs(120)} />
    </View>
  );
}

// ──────────────────────────────────────────
// Main Screen
// ──────────────────────────────────────────
export default function CoparentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { data: pet, isLoading, refetch } = usePet(id!);

  const [activeTab, setActiveTab] = useState<TabId>('team');
  const [selectedDay, setSelectedDay] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const tabs: { id: TabId; labelKey: string }[] = [
    { id: 'team', labelKey: 'coparents.tabTeam' },
    { id: 'schedule', labelKey: 'coparents.tabSchedule' },
    { id: 'activities', labelKey: 'coparents.tabActivities' },
  ];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <CoparentsSkeleton />
      </View>
    );
  }

  const PetIcon = pet?.species === 'cat' ? Cat : Dog;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      {/* Pet Card */}
      <View style={styles.petCard}>
        <View style={styles.petRow}>
          <View style={styles.petAvatar}>
            <PetIcon size={rs(24)} color={pet?.species === 'cat' ? colors.purple : colors.accent} strokeWidth={1.8} />
          </View>
          <View style={styles.petInfo}>
            <Text style={styles.petName}>{pet?.name ?? '—'}</Text>
            <Text style={styles.petBreed}>{pet?.breed ?? t('health.unknown')}</Text>
          </View>
          <View style={styles.protectedBadge}>
            <Shield size={rs(14)} color={colors.success} strokeWidth={2} />
            <Text style={styles.protectedText}>{t('coparents.protected')}</Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === 'team' && <TeamTab t={t} />}
      {activeTab === 'schedule' && <ScheduleTab t={t} selectedDay={selectedDay} setSelectedDay={setSelectedDay} />}
      {activeTab === 'activities' && <ActivitiesTab t={t} />}
    </ScrollView>
  );
}

// ──────────────────────────────────────────
// Team Tab
// ──────────────────────────────────────────
function TeamTab({ t }: { t: (key: string) => string }) {
  return (
    <View style={styles.tabContent}>
      {CAREGIVERS.map((cg) => {
        const Icon = cg.icon;
        return (
          <View key={cg.id} style={styles.caregiverCard}>
            <View style={styles.cgTop}>
              <View style={[styles.cgIconCircle, { backgroundColor: cg.roleColor + '18' }]}>
                <Icon size={rs(22)} color={cg.roleColor} strokeWidth={1.8} />
              </View>
              <View style={styles.cgInfo}>
                <Text style={styles.cgName}>{t(cg.nameKey)}</Text>
                <View style={[styles.roleBadge, { backgroundColor: cg.roleColor + '18' }]}>
                  <Text style={[styles.roleText, { color: cg.roleColor }]}>{t(cg.roleKey)}</Text>
                </View>
              </View>
            </View>
            <View style={styles.cgStats}>
              <View style={styles.cgStat}>
                <Star size={rs(13)} color={colors.gold} strokeWidth={2} />
                <Text style={styles.cgStatValue}>{cg.trust}</Text>
              </View>
              <View style={styles.cgStat}>
                <Calendar size={rs(13)} color={colors.textDim} strokeWidth={1.8} />
                <Text style={styles.cgStatLabel}>{cg.activities} {t('coparents.activities')}</Text>
              </View>
              <View style={styles.cgStat}>
                <Clock size={rs(13)} color={colors.textDim} strokeWidth={1.8} />
                <Text style={styles.cgStatLabel}>{t(cg.lastActionKey)}</Text>
              </View>
            </View>
            <View style={styles.cgActions}>
              <TouchableOpacity style={styles.cgBtn}>
                <Key size={rs(14)} color={colors.accent} strokeWidth={1.8} />
                <Text style={styles.cgBtnText}>{t('coparents.permissions')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cgBtn}>
                <Send size={rs(14)} color={colors.accent} strokeWidth={1.8} />
                <Text style={styles.cgBtnText}>{t('coparents.message')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ──────────────────────────────────────────
// Schedule Tab
// ──────────────────────────────────────────
function ScheduleTab({ t, selectedDay, setSelectedDay }: { t: (key: string) => string; selectedDay: number; setSelectedDay: (d: number) => void }) {
  return (
    <View style={styles.tabContent}>
      <View style={styles.dayRow}>
        {DAYS.map((dayKey, i) => (
          <TouchableOpacity
            key={dayKey}
            style={[styles.dayBtn, selectedDay === i && styles.dayBtnActive]}
            onPress={() => setSelectedDay(i)}
          >
            <Text style={[styles.dayText, selectedDay === i && styles.dayTextActive]}>
              {t(dayKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {SCHEDULE.map((slot, i) => (
        <View key={i} style={styles.slotCard}>
          <Text style={styles.slotTime}>{slot.time}</Text>
          <View style={styles.slotInfo}>
            <Text style={styles.slotTask}>{t(slot.taskKey)}</Text>
            <Text style={styles.slotPerson}>{t(slot.personKey)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

// ──────────────────────────────────────────
// Activities Tab
// ──────────────────────────────────────────
function ActivitiesTab({ t }: { t: (key: string) => string }) {
  return (
    <View style={styles.tabContent}>
      {ACTIVITIES.map((act) => {
        const Icon = act.icon;
        return (
          <View key={act.id} style={styles.actRow}>
            <View style={styles.actTimeline}>
              <View style={[styles.actDot, { backgroundColor: act.color }]} />
              {act.id !== '5' && <View style={styles.actLine} />}
            </View>
            <View style={styles.actIcon}>
              <Icon size={rs(16)} color={act.color} strokeWidth={1.8} />
            </View>
            <View style={styles.actInfo}>
              <Text style={styles.actText}>
                <Text style={styles.actPerson}>{t(act.personKey)}</Text>
                {' '}{t(act.actionKey)}
              </Text>
              <Text style={styles.actTime}>{t(act.timeKey)}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ──────────────────────────────────────────
// Styles
// ──────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },

  // Skeleton
  skeletonWrap: { padding: spacing.md, gap: spacing.md },
  skeletonTabs: { flexDirection: 'row', gap: spacing.sm },

  // Pet Card
  petCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: spacing.md, marginBottom: spacing.md },
  petRow: { flexDirection: 'row', alignItems: 'center' },
  petAvatar: { width: rs(48), height: rs(48), borderRadius: rs(24), backgroundColor: colors.bgCard, alignItems: 'center', justifyContent: 'center' },
  petInfo: { flex: 1, marginLeft: spacing.sm },
  petName: { fontFamily: 'Sora_700Bold', fontSize: fs(18), color: colors.text },
  petBreed: { fontFamily: 'Sora_400Regular', fontSize: fs(12), color: colors.textSec, marginTop: rs(2) },
  protectedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successSoft, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radii.sm },
  protectedText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(10), color: colors.success, marginLeft: rs(4) },

  // Tabs
  tabRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.xl, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  tabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  tabText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(13), color: colors.textSec },
  tabTextActive: { color: '#FFFFFF' },
  tabContent: { gap: spacing.sm },

  // Caregiver Card
  caregiverCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: spacing.md },
  cgTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  cgIconCircle: { width: rs(44), height: rs(44), borderRadius: rs(22), alignItems: 'center', justifyContent: 'center' },
  cgInfo: { flex: 1, marginLeft: spacing.sm },
  cgName: { fontFamily: 'Sora_700Bold', fontSize: fs(15), color: colors.text },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: rs(2), borderRadius: radii.sm, marginTop: rs(4) },
  roleText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(10) },
  cgStats: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  cgStat: { flexDirection: 'row', alignItems: 'center', gap: rs(4) },
  cgStatValue: { fontFamily: 'JetBrainsMono_700Bold', fontSize: fs(12), color: colors.gold },
  cgStatLabel: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.textDim },
  cgActions: { flexDirection: 'row', gap: spacing.sm },
  cgBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(6), backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, paddingVertical: spacing.sm },
  cgBtnText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(12), color: colors.accent },

  // Schedule
  dayRow: { flexDirection: 'row', gap: rs(6), marginBottom: spacing.md },
  dayBtn: { flex: 1, paddingVertical: spacing.xs, borderRadius: radii.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  dayBtnActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  dayText: { fontFamily: 'Sora_600SemiBold', fontSize: fs(11), color: colors.textDim },
  dayTextActive: { color: '#FFFFFF' },
  slotCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.xxl, padding: spacing.md },
  slotTime: { fontFamily: 'JetBrainsMono_700Bold', fontSize: fs(14), color: colors.accent, width: rs(56) },
  slotInfo: { flex: 1, marginLeft: spacing.sm },
  slotTask: { fontFamily: 'Sora_600SemiBold', fontSize: fs(14), color: colors.text },
  slotPerson: { fontFamily: 'Sora_400Regular', fontSize: fs(12), color: colors.textSec, marginTop: rs(2) },

  // Activities
  actRow: { flexDirection: 'row', alignItems: 'flex-start', minHeight: rs(52) },
  actTimeline: { width: rs(20), alignItems: 'center' },
  actDot: { width: rs(10), height: rs(10), borderRadius: rs(5), marginTop: rs(4) },
  actLine: { width: 1.5, flex: 1, backgroundColor: colors.border, marginTop: rs(4) },
  actIcon: { marginLeft: rs(6), marginRight: rs(8), marginTop: rs(1) },
  actInfo: { flex: 1 },
  actText: { fontFamily: 'Sora_400Regular', fontSize: fs(13), color: colors.textSec, lineHeight: fs(18) },
  actPerson: { fontFamily: 'Sora_700Bold', color: colors.text },
  actTime: { fontFamily: 'Sora_400Regular', fontSize: fs(11), color: colors.textDim, marginTop: rs(2) },
});
