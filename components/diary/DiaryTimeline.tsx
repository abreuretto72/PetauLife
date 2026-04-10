/**
 * DiaryTimeline — FlatList-based timeline with filters, skeleton, and
 * card dispatch. Extracted from diary.tsx for reusability.
 *
 * Used in the diary screen and can be embedded in the pet dashboard.
 */

import React, { useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  RefreshControl, StyleSheet,
} from 'react-native';
import {
  BookOpen, Pencil, Sparkles,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useToast } from '../Toast';
import { useMyPetRole } from '../../hooks/usePetMembers';
import { colors } from '../../constants/colors';
import { rs, fs } from '../../hooks/useResponsive';
import PawIcon from '../PawIcon';
import {
  MonthSummaryCard, DiaryCard, HealthCard,
  AudioAnalysisCard, PhotoAnalysisCard, VideoAnalysisCard,
  MilestoneCard, CapsuleCard, ConnectionCard, ScheduledEventCard,
} from './TimelineCards';
import {
  EVENT_TYPE_CONFIG,
  diaryEntryToEvent,
  scheduledEventToTimelineEvent,
} from './timelineTypes';
import type {
  TimelineEvent,
} from './timelineTypes';
import type { DiaryEntry } from '../../types/database';
import type { ScheduledEvent } from '../../lib/api';

// ── Skeleton ──

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonDot} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, { width: '40%' }]} />
        <View style={[styles.skeletonLine, { width: '60%', marginTop: rs(8) }]} />
        <View style={[styles.skeletonLine, { width: '90%', marginTop: rs(8) }]} />
        <View style={[styles.skeletonLine, { width: '75%', marginTop: rs(8) }]} />
      </View>
    </View>
  );
}

// ── Props ──

interface DiaryTimelineProps {
  entries: DiaryEntry[];
  scheduledEvents?: ScheduledEvent[];
  isLoading: boolean;
  petId: string;
  petName: string;
  petSpecies?: string;
  petAvatarUrl?: string | null;
  petCreatedAt?: string;
  petPersonality?: string | null;
  onRefresh: () => void;
  onNewEntry: () => void;
  onEditEntry: (id: string) => void;
  onRetryEntry?: (id: string) => void;
  /** Render additional content below the header (e.g. LensGrid) */
  headerExtra?: React.ReactNode;
}

export default function DiaryTimeline({
  entries,
  scheduledEvents = [],
  isLoading,
  petId,
  petName,
  petSpecies,
  petAvatarUrl,
  petCreatedAt,
  petPersonality,
  onRefresh,
  onNewEntry,
  onEditEntry,
  onRetryEntry,
  headerExtra,
}: DiaryTimelineProps) {
  const { t, i18n } = useTranslation();
  const { toast, confirm } = useToast();
  const { isOwner } = useMyPetRole(petId);

  const petColor = petSpecies === 'cat' ? colors.purple : colors.accent;

  const handleDeleteEntry = useCallback(async (id: string) => {
    const yes = await confirm({ text: t('diary.deleteConfirm'), type: 'warning' });
    if (!yes) return;
    try {
      const { error } = await supabase
        .from('diary_entries')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
      onRefresh();
      toast(t('toast.entryDeleted'), 'success');
    } catch {
      toast(t('errors.generic'), 'error');
    }
  }, [confirm, t, toast, onRefresh]);

  // Admin (owner) deactivating another tutor's record
  const handleAdminDeactivate = useCallback(async (id: string) => {
    const yes = await confirm({ text: t('diary.adminDeactivateConfirm'), type: 'warning' });
    if (!yes) return;
    try {
      const { error } = await supabase
        .from('diary_entries')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
      onRefresh();
      toast(t('toast.adminEntryDeactivated'), 'success');
    } catch {
      toast(t('errors.generic'), 'error');
    }
  }, [confirm, t, toast, onRefresh]);
  const isEnglish = i18n.language === 'en-US' || i18n.language === 'en';

  const getMoodData = useCallback(
    (moodId: string | null | undefined) => {
      if (!moodId) return null;
      const { moods } = require('../../constants/moods');
      const mood = moods.find((m: { id: string }) => m.id === moodId);
      if (!mood) return null;
      return { label: isEnglish ? mood.label_en : mood.label, color: mood.color };
    },
    [isEnglish],
  );

  // ── Events ──

  const timelineEvents = useMemo(() => {
    const seen = new Set<string>();
    const diaryEvts = entries
      .filter((e) => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      })
      .map(diaryEntryToEvent);

    const schedEvts = scheduledEvents.map(scheduledEventToTimelineEvent);

    const all = [...diaryEvts, ...schedEvts];
    // Future scheduled events float to top (highest sortDate first), past entries below
    all.sort((a, b) => b.sortDate - a.sortDate);
    return all;
  }, [entries, scheduledEvents]);

  // ── Render event ──

  const renderEvent = useCallback(
    ({ item, index }: { item: TimelineEvent; index: number }) => {
      const config = EVENT_TYPE_CONFIG[item.type];
      const isLast = index === timelineEvents.length - 1;

      // Admin props — only owner sees the EyeOff deactivate button on others' records
      const adminProps = { isOwner, onAdminDeactivate: isOwner ? handleAdminDeactivate : undefined };

      let cardContent: React.ReactNode = null;
      switch (item.type) {
        case 'month_summary':
          cardContent = <MonthSummaryCard event={item} t={t} />;
          break;
        case 'diary':
          cardContent = <DiaryCard event={item} petName={petName} t={t} getMoodData={getMoodData} onEdit={onEditEntry} onRetry={onRetryEntry} onDelete={handleDeleteEntry} {...adminProps} />;
          break;
        case 'audio_analysis':
          cardContent = <AudioAnalysisCard event={item} t={t} onDelete={handleDeleteEntry} {...adminProps} />;
          break;
        case 'photo_analysis':
          cardContent = <PhotoAnalysisCard event={item} t={t} onDelete={handleDeleteEntry} {...adminProps} />;
          break;
        case 'video_analysis':
          cardContent = <VideoAnalysisCard event={item} t={t} onDelete={handleDeleteEntry} {...adminProps} />;
          break;
        case 'milestone':
          cardContent = <MilestoneCard event={item} t={t} onDelete={handleDeleteEntry} {...adminProps} />;
          break;
        case 'capsule':
          cardContent = <CapsuleCard event={item} t={t} onDelete={handleDeleteEntry} {...adminProps} />;
          break;
        case 'connection':
          cardContent = <ConnectionCard event={item} t={t} onDelete={handleDeleteEntry} {...adminProps} />;
          break;
        case 'scheduled_event':
          cardContent = <ScheduledEventCard event={item} t={t} />;
          break;
        default:
          cardContent = <HealthCard event={item} t={t} onDelete={handleDeleteEntry} {...adminProps} />;
          break;
      }

      return (
        <View style={styles.entryRow}>
          {!isLast && <View style={styles.timelineLine} />}
          <View style={[styles.timelineDot, { backgroundColor: config.color }]} />
          <View style={styles.entryCardWrapper}>{cardContent}</View>
        </View>
      );
    },
    [timelineEvents.length, petName, t, getMoodData, onEditEntry, onRetryEntry, handleDeleteEntry, handleAdminDeactivate, isOwner],
  );

  // ── Header ──

  const renderHeader = useCallback(() => (
    <View>
      {/* Extra content (e.g. pet hero section) */}
      {headerExtra}

      {/* AI Personality */}
      <View style={styles.personalityCard}>
        <View style={styles.personalityIcon}>
          <Sparkles size={rs(18)} color={colors.accent} strokeWidth={1.8} />
        </View>
        <View style={styles.personalityContent}>
          <Text style={styles.personalityLabel}>{t('diary.aiPersonality')}</Text>
          <Text style={styles.personalityText}>{petPersonality ?? t('diary.defaultPersonality')}</Text>
        </View>
      </View>
    </View>
  ), [petPersonality, t, headerExtra]);

  // ── Footer ──

  const renderFooter = useCallback(() => {
    if (timelineEvents.length === 0) return null;
    return (
      <View style={styles.footerContainer}>
        <PawIcon size={rs(20)} color={colors.accent} />
        <Text style={styles.footerText}>{t('diary.storyContinues', { name: petName })}</Text>
      </View>
    );
  }, [timelineEvents.length, petName, t]);

  // ── Empty ──

  const renderEmpty = useCallback(() => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <BookOpen size={rs(48)} color={colors.textGhost} strokeWidth={1.4} />
        <Text style={styles.emptyTitle}>{t('diary.emptyTitle')}</Text>
        <Text style={styles.emptySub}>{t('diary.emptySub', { name: petName })}</Text>
      </View>
    );
  }, [isLoading, petName, t]);

  const keyExtractor = useCallback((item: TimelineEvent) => item.id, []);

  // ── Loading state ──

  if (isLoading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.skeletonContainer}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={timelineEvents}
        keyExtractor={keyExtractor}
        renderItem={renderEvent}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
        }
      />

      {/* FAB — New entry */}
      <TouchableOpacity style={styles.fab} onPress={onNewEntry} activeOpacity={0.8}>
        <Pencil size={rs(22)} color="#fff" strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

// ── Exported for reuse ──
export { diaryEntryToEvent };
export type { TimelineEvent };

// ── Styles ──

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  listContent: { paddingBottom: rs(100) },


  // Personality
  personalityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent + '08', borderWidth: 1, borderColor: colors.accent + '15', borderRadius: rs(18), marginHorizontal: rs(16), marginTop: rs(16), padding: rs(14), gap: rs(12) },
  personalityIcon: { width: rs(36), height: rs(36), borderRadius: rs(10), backgroundColor: colors.accent + '15', alignItems: 'center', justifyContent: 'center' },
  personalityContent: { flex: 1 },
  personalityLabel: { fontFamily: 'Sora_700Bold', fontSize: fs(10), color: colors.accent, letterSpacing: 1.5, marginBottom: rs(4) },
  personalityText: { fontFamily: 'Sora_400Regular', fontSize: fs(12), color: colors.textSec, lineHeight: fs(18) },

  // Timeline
  entryRow: { flexDirection: 'row', marginLeft: rs(28), marginRight: rs(16), marginTop: rs(16) },
  timelineLine: { position: 'absolute', left: rs(5), top: rs(16), bottom: rs(-16), width: 2, backgroundColor: colors.accent + '15' },
  timelineDot: { width: rs(12), height: rs(12), borderRadius: rs(6), marginTop: rs(18), marginRight: rs(12), zIndex: 1 },
  entryCardWrapper: { flex: 1 },

  // Empty
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: rs(60), paddingHorizontal: rs(32) },
  emptyTitle: { fontFamily: 'Sora_700Bold', fontSize: fs(16), color: colors.textSec, marginTop: rs(16) },
  emptySub: { fontFamily: 'Sora_400Regular', fontSize: fs(13), color: colors.textDim, textAlign: 'center', marginTop: rs(8), lineHeight: fs(20) },

  // Footer
  footerContainer: { alignItems: 'center', paddingVertical: rs(24), gap: rs(10) },
  footerText: { fontFamily: 'Caveat_400Regular', fontSize: fs(15), color: colors.textDim, fontStyle: 'italic' },

  // FABs
  fab: { position: 'absolute', bottom: rs(24), right: rs(20), width: rs(56), height: rs(56), borderRadius: rs(18), backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowColor: colors.accent, shadowOffset: { width: 0, height: rs(8) }, shadowOpacity: 0.35, shadowRadius: rs(16) },

  // Skeleton
  skeletonContainer: { paddingHorizontal: rs(16), paddingTop: rs(16), gap: rs(16) },
  skeletonCard: { flexDirection: 'row', marginLeft: rs(12) },
  skeletonDot: { width: rs(12), height: rs(12), borderRadius: rs(6), backgroundColor: colors.border, marginTop: rs(18), marginRight: rs(12) },
  skeletonContent: { flex: 1, backgroundColor: colors.card, borderRadius: rs(22), padding: rs(16), borderWidth: 1, borderColor: colors.border },
  skeletonLine: { height: rs(10), borderRadius: rs(5), backgroundColor: colors.border },
});
