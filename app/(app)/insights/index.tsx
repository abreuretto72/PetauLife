/**
 * app/(app)/insights/index.tsx
 *
 * Feed centralizado de insights (todos os pets do tutor, todas as camadas).
 * Filtros via chips horizontais. Pull-to-refresh dispara on-demand.
 */
import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, Settings as SettingsIcon, RefreshCw, Bell,
} from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { rs, fs } from '../../../hooks/useResponsive';
import { useToast } from '../../../components/Toast';
import { InsightCard } from '../../../components/insights/InsightCard';
import { useAllInsights, type InsightFilters } from '../../../hooks/useAllInsights';
import { useTriggerProactiveCheck } from '../../../hooks/useProactiveSettings';
import type { InsightLayer } from '../../../types/insights';

type FilterKey =
  | 'all' | 'health' | 'reminders' | 'patterns'
  | 'longterm' | 'coach' | 'family' | 'ops' | 'companion';

const FILTERS: { key: FilterKey; label: string; layer?: InsightLayer; categories?: string[] }[] = [
  { key: 'all',         label: 'all' },
  { key: 'health',      label: 'health',      categories: ['saude', 'vacina'] },
  { key: 'reminders',   label: 'reminders',   layer: 1 },
  { key: 'patterns',    label: 'patterns',    layer: 2 },
  { key: 'longterm',    label: 'longterm',    layer: 4 },
  { key: 'coach',       label: 'coach',       layer: 5 },
  { key: 'family',      label: 'family',      layer: 6 },
  { key: 'ops',         label: 'ops',         layer: 7 },
  { key: 'companion',   label: 'companion',   layer: 8 },
];

export default function InsightsFeedScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast, confirm } = useToast();
  const [activeFilter, setActiveFilter] = useState<typeof FILTERS[number]['key']>('all');

  const filterDef = FILTERS.find((f) => f.key === activeFilter)!;
  const queryFilters: InsightFilters = filterDef.layer ? { layer: filterDef.layer } : {};

  const { insights, isLoading, isFetching, error, refetch, dismiss } = useAllInsights(queryFilters);
  const trigger = useTriggerProactiveCheck();

  // Filtragem secundária por categoria (saúde junta saude+vacina)
  const visible = filterDef.categories
    ? insights.filter((i) => filterDef.categories!.includes(i.category as string))
    : insights;

  const handlePressDetail = useCallback((id: string) => {
    router.push(`/insights/${id}` as never);
  }, [router]);

  const handleDismiss = useCallback(async (id: string) => {
    const yes = await confirm({
      text: t('insights.feed.confirm_dismiss', { defaultValue: 'Dispensar este insight? Ele sai do feed.' }),
      type: 'warning',
      yesLabel: t('insights.card.dismiss', { defaultValue: 'Dispensar' }),
      noLabel: t('common.cancel', { defaultValue: 'Cancelar' }),
    });
    if (!yes) return;
    try {
      await dismiss(id);
      toast(t('insights.feed.dismissed', { defaultValue: 'Insight dispensado.' }), 'success');
    } catch (e) {
      toast(t('errors.generic', { defaultValue: 'Algo não saiu como esperado.' }), 'error');
    }
  }, [dismiss, confirm, t, toast]);

  const handleRegenerate = useCallback(async () => {
    try {
      await trigger.mutateAsync();
      toast(t('insights.feed.regenerated', { defaultValue: 'Verificações disparadas. Os novos insights aparecem em alguns segundos.' }), 'success');
      setTimeout(() => refetch(), 5000);
    } catch (e) {
      toast(t('errors.generic', { defaultValue: 'Algo não saiu como esperado.' }), 'error');
    }
  }, [trigger, t, toast, refetch]);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={rs(22)} color={colors.click} strokeWidth={1.8} />
        </TouchableOpacity>
        <View style={s.headerTitleWrap}>
          <Bell size={rs(16)} color={colors.click} strokeWidth={2} />
          <Text style={s.headerTitle}>
            {t('insights.feed.title', { defaultValue: 'Insights' })}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push('/settings/proactive' as never)}
          hitSlop={12}
        >
          <SettingsIcon size={rs(20)} color={colors.click} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* Filtros (chips) */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsRow} contentContainerStyle={s.chipsRowContent}>
        {FILTERS.map((f) => {
          const active = f.key === activeFilter;
          return (
            <TouchableOpacity
              key={f.key}
              style={[s.chip, active && s.chipActive]}
              onPress={() => setActiveFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[s.chipText, active && s.chipTextActive]}>
                {t(`insights.feed.filter.${f.label}`, { defaultValue: f.label })}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Botão regenerar (compacto) */}
      <TouchableOpacity
        style={s.regenBtn}
        onPress={handleRegenerate}
        disabled={trigger.isPending}
        activeOpacity={0.7}
      >
        {trigger.isPending
          ? <ActivityIndicator size="small" color={colors.click} />
          : <RefreshCw size={rs(14)} color={colors.click} strokeWidth={2} />}
        <Text style={s.regenText}>
          {t('insights.settings.regenerate_now', { defaultValue: 'Verificar agora' })}
        </Text>
      </TouchableOpacity>

      {/* Lista */}
      {isLoading && insights.length === 0 ? (
        <View style={s.loading}>
          <ActivityIndicator size="large" color={colors.click} />
        </View>
      ) : error ? (
        <View style={s.empty}>
          <Text style={s.emptyText}>
            {t('insights.feed.error_loading', { defaultValue: 'Não foi possível carregar os insights.' })}
          </Text>
        </View>
      ) : visible.length === 0 ? (
        <ScrollView
          contentContainerStyle={s.empty}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.click} />}
        >
          <Bell size={rs(40)} color={colors.textDim} strokeWidth={1.5} />
          <Text style={s.emptyTitle}>
            {t('insights.feed.empty', { defaultValue: 'Nenhum insight no momento' })}
          </Text>
          <Text style={s.emptyDesc}>
            {t('insights.feed.empty_desc', { defaultValue: 'A IA roda checagens diárias. Quando algo merecer sua atenção, aparece aqui.' })}
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <InsightCard
              insight={item}
              showPetName
              onPressDetail={handlePressDetail}
              onDismiss={handleDismiss}
            />
          )}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={colors.click} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(16),
    paddingVertical: rs(10),
  },
  headerTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: rs(8) },
  headerTitle: { color: colors.text, fontSize: fs(16), fontWeight: '700' },
  chipsRow: { maxHeight: rs(48) },
  chipsRowContent: { paddingHorizontal: rs(16), gap: rs(8) },
  chip: {
    paddingHorizontal: rs(12),
    paddingVertical: rs(7),
    borderRadius: rs(20),
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.click, borderColor: colors.click },
  chipText: { fontSize: fs(12), color: colors.textSec, fontWeight: '600' },
  chipTextActive: { color: '#FFFFFF' },
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    alignSelf: 'flex-end',
    marginHorizontal: rs(16),
    marginTop: rs(6),
    marginBottom: rs(4),
    paddingHorizontal: rs(10),
    paddingVertical: rs(5),
    borderRadius: rs(8),
  },
  regenText: { fontSize: fs(11), color: colors.click, fontWeight: '700' },
  list: { padding: rs(16) },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: rs(40),
    gap: rs(12),
  },
  emptyTitle: { fontSize: fs(15), color: colors.text, fontWeight: '700', marginTop: rs(8) },
  emptyDesc: { fontSize: fs(12), color: colors.textDim, textAlign: 'center', lineHeight: fs(18) },
  emptyText: { fontSize: fs(13), color: colors.textSec, textAlign: 'center' },
});
