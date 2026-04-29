/**
 * app/(app)/insights/[id].tsx
 *
 * Detalhe de um insight: title + body completo + evidência estruturada
 * + chart simples (svg, sem lib externa) + CTAs grandes + disclaimer médico.
 */
import React, { useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Linking } from 'react-native';
import { ChevronLeft, AlertTriangle, ExternalLink, Check, X as XIcon, MessageSquare, LifeBuoy } from 'lucide-react-native';
import { Svg, Rect, Line, Text as SvgText, Circle, Path } from 'react-native-svg';

import { colors } from '../../../constants/colors';
import { rs, fs } from '../../../hooks/useResponsive';
import { useToast } from '../../../components/Toast';
import { supabase } from '../../../lib/supabase';
import { useAllInsights } from '../../../hooks/useAllInsights';
import { MedicalDisclaimer } from '../../../components/insights/MedicalDisclaimer';
import type { PetInsight, InsightSeverity } from '../../../types/insights';

const SEVERITY_COLOR: Record<InsightSeverity, string> = {
  urgent: colors.danger,
  attention: colors.warning,
  consider: colors.click,
  info: colors.textSec,
};

const SCREEN_PADDING = rs(16);
const CHART_HEIGHT = rs(180);

export default function InsightDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { markRead, dismiss, markActedOn } = useAllInsights();

  const query = useQuery({
    queryKey: ['insight-detail', id],
    queryFn: async (): Promise<PetInsight & { pet_name?: string } | null> => {
      const { data, error } = await supabase
        .from('pet_insights')
        .select('*, pets(name)')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return { ...data, pet_name: (data as any).pets?.name } as any;
    },
    enabled: !!id,
  });

  const insight = query.data;

  // Marca como shown ao abrir
  useEffect(() => {
    if (insight && insight.status === 'pending') {
      markRead(insight.id).catch(() => {});
    }
  }, [insight?.id, insight?.status]);

  const sevColor = useMemo(() => insight ? SEVERITY_COLOR[insight.severity] ?? colors.textSec : colors.textSec, [insight]);
  const isHealthRelated = useMemo(() => insight && ['saude', 'vacina'].includes(insight.category), [insight]);

  const handleCta = async () => {
    if (!insight) return;
    if (insight.action_route) {
      try { await markActedOn(insight.id); } catch {}
      router.push(insight.action_route as never);
    }
  };

  const handleDismiss = async () => {
    if (!insight) return;
    try {
      await dismiss(insight.id);
      toast(t('insights.feed.dismissed', { defaultValue: 'Insight dispensado.' }), 'success');
      router.back();
    } catch {
      toast(t('errors.generic', { defaultValue: 'Algo não saiu como esperado.' }), 'error');
    }
  };

  if (query.isLoading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loading}><ActivityIndicator size="large" color={colors.click} /></View>
      </SafeAreaView>
    );
  }

  if (!insight) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.empty}>
          <Text style={s.emptyText}>
            {t('insights.detail.not_found', { defaultValue: 'Insight não encontrado.' })}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={rs(22)} color={colors.click} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>
          {t('insights.detail.title', { defaultValue: 'Detalhe' })}
        </Text>
        <View style={{ width: rs(22) }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Pet name */}
        {insight.pet_name ? (
          <Text style={s.petName}>{insight.pet_name}</Text>
        ) : null}

        {/* Severity badge */}
        <View style={[s.sevBadge, { backgroundColor: sevColor + '15', borderColor: sevColor + '40' }]}>
          <View style={[s.sevDot, { backgroundColor: sevColor }]} />
          <Text style={[s.sevText, { color: sevColor }]}>
            {t(`insights.severity.${insight.severity}`, { defaultValue: insight.severity })}
          </Text>
          <Text style={s.sevSub}>· L{insight.layer}</Text>
        </View>

        {/* Title */}
        <Text style={s.title}>{insight.title}</Text>

        {/* Body */}
        <Text style={s.body}>{insight.body}</Text>

        {/* Disclaimer médico (apenas saúde) */}
        {isHealthRelated ? <MedicalDisclaimer /> : null}

        {/* Talking points (Camadas 7 vet_prep + 8 chronic_disease/euthanasia) */}
        {Array.isArray((insight.evidence as any)?.talking_points) && (insight.evidence as any).talking_points.length > 0 ? (
          <View style={s.talkingBox}>
            <View style={s.talkingHeader}>
              <MessageSquare size={rs(15)} color={colors.click} strokeWidth={1.8} />
              <Text style={s.sectionLabel}>
                {t('insights.detail.talking_points', { defaultValue: 'Pontos para a conversa' })}
              </Text>
            </View>
            {((insight.evidence as any).talking_points as string[]).map((tp, i) => (
              <View key={i} style={s.talkingItem}>
                <Text style={s.talkingBullet}>•</Text>
                <Text style={s.talkingText}>{tp}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Recursos de apoio (Camada 8 — chronic_disease/euthanasia/tutor_difficulty) */}
        {Array.isArray((insight.evidence as any)?.support_resources) && (insight.evidence as any).support_resources.length > 0 ? (
          <View style={s.supportBox}>
            <View style={s.talkingHeader}>
              <LifeBuoy size={rs(15)} color={colors.click} strokeWidth={1.8} />
              <Text style={s.sectionLabel}>
                {t('insights.detail.support_resources', { defaultValue: 'Recursos de apoio' })}
              </Text>
            </View>
            {((insight.evidence as any).support_resources as string[]).map((url, i) => {
              const label = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
              const fullUrl = url.startsWith('http') ? url : `https://${url}`;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => Linking.openURL(fullUrl).catch(() => {})}
                  style={s.supportLink}
                  activeOpacity={0.7}
                >
                  <ExternalLink size={rs(12)} color={colors.click} strokeWidth={2} />
                  <Text style={s.supportLinkText}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {/* Chart (apenas Camada 4 com chart_data) */}
        {insight.layer === 4 && (insight.evidence as any)?.chart_data ? (
          <View style={s.chartWrap}>
            <Text style={s.sectionLabel}>
              {t('insights.detail.chart', { defaultValue: 'Gráfico' })}
            </Text>
            <SimpleChart chartData={(insight.evidence as any).chart_data} />
          </View>
        ) : null}

        {/* Evidência estruturada */}
        {insight.evidence && Object.keys(insight.evidence).length > 0 ? (
          <View style={s.evidenceBox}>
            <Text style={s.sectionLabel}>
              {t('insights.detail.evidence', { defaultValue: 'Evidência' })}
            </Text>
            {(insight.evidence as any).summary ? (
              <Text style={s.evSummary}>{(insight.evidence as any).summary}</Text>
            ) : null}
            <View style={s.evGrid}>
              {Object.entries(insight.evidence).map(([k, v]) => {
                if (k === 'summary' || k === 'chart_data' || k === 'raw_data') return null;
                if (typeof v === 'object') return null;
                return (
                  <View key={k} style={s.evRow}>
                    <Text style={s.evKey}>{k}</Text>
                    <Text style={s.evVal}>{String(v)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* CTAs */}
        <View style={s.ctaRow}>
          {insight.action_route ? (
            <TouchableOpacity
              style={[s.ctaPrimary, { backgroundColor: colors.click }]}
              onPress={handleCta}
              activeOpacity={0.8}
            >
              <ExternalLink size={rs(16)} color="#FFFFFF" strokeWidth={2} />
              <Text style={s.ctaPrimaryText}>
                {insight.action_label
                  ?? t(`insights.cta.${insight.cta_type}`, { defaultValue: t('insights.cta.default', { defaultValue: 'Abrir' }) })}
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={s.ctaSecondary} onPress={handleDismiss} activeOpacity={0.7}>
            <XIcon size={rs(14)} color={colors.textDim} strokeWidth={2} />
            <Text style={s.ctaSecondaryText}>
              {t('insights.card.dismiss', { defaultValue: 'Dispensar' })}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: rs(40) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Chart simples (SVG) ─────────────────────────────────────────────────────
// Suporta tipos: bar_by_month, summary_pills, timeline.
function SimpleChart({ chartData }: { chartData: any }) {
  if (!chartData?.type) return null;

  if (chartData.type === 'bar_by_month' && Array.isArray(chartData.data)) {
    return <BarByMonth data={chartData.data} highlight={chartData.highlight_months ?? []} />;
  }
  if (chartData.type === 'summary_pills' && chartData.data) {
    return <SummaryPills data={chartData.data} />;
  }
  if (chartData.type === 'timeline' && Array.isArray(chartData.data)) {
    return <Timeline data={chartData.data} />;
  }
  return (
    <Text style={{ fontSize: fs(11), color: colors.textDim, fontStyle: 'italic' }}>
      Tipo de gráfico não suportado: {chartData.type}
    </Text>
  );
}

function BarByMonth({ data, highlight }: { data: any[]; highlight: number[] }) {
  // data = [{ month: "set", value_2024: 12, value_2025: 9 }, ...]
  const SCREEN_W = rs(320);
  const barW = rs(14);
  const gap = rs(6);
  const allValues = data.flatMap((d) => Object.entries(d).filter(([k]) => k.startsWith('value_')).map(([_, v]) => Number(v) || 0));
  const maxVal = Math.max(...allValues, 1);

  return (
    <Svg width={SCREEN_W} height={CHART_HEIGHT}>
      {/* eixo Y simples */}
      <Line x1={rs(20)} y1={rs(10)} x2={rs(20)} y2={CHART_HEIGHT - rs(20)} stroke={colors.border} strokeWidth={1} />
      {/* barras agrupadas por mês */}
      {data.slice(0, 12).map((d, i) => {
        const valKeys = Object.keys(d).filter((k) => k.startsWith('value_')).sort();
        const groupX = rs(28) + i * ((barW * valKeys.length) + gap);
        return valKeys.map((vk, vi) => {
          const v = Number((d as any)[vk]) || 0;
          const h = (v / maxVal) * (CHART_HEIGHT - rs(40));
          const x = groupX + vi * barW;
          const y = CHART_HEIGHT - rs(20) - h;
          const isHighlighted = highlight.includes(d.month_num ?? i + 1);
          const fill = isHighlighted ? colors.warning : colors.click;
          return <Rect key={vk + i} x={x} y={y} width={barW - rs(1)} height={h} fill={fill} rx={2} />;
        });
      })}
    </Svg>
  );
}

function SummaryPills({ data }: { data: Record<string, number | string | null> }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: rs(8), marginTop: rs(8) }}>
      {Object.entries(data).map(([k, v]) => (
        <View key={k} style={{
          paddingHorizontal: rs(10), paddingVertical: rs(6),
          backgroundColor: colors.click + '12',
          borderColor: colors.click + '30', borderWidth: 1,
          borderRadius: rs(20),
        }}>
          <Text style={{ fontSize: fs(10), color: colors.textDim }}>{k}</Text>
          <Text style={{ fontSize: fs(13), color: colors.click, fontWeight: '700' }}>{v ?? '—'}</Text>
        </View>
      ))}
    </View>
  );
}

function Timeline({ data }: { data: any[] }) {
  // [{ month: 'jan', entries: n, mood: n }, ...]
  const SCREEN_W = rs(320);
  const cellW = (SCREEN_W - rs(40)) / Math.max(data.length, 1);
  const maxEntries = Math.max(...data.map((d) => Number(d.entries) || 0), 1);

  return (
    <Svg width={SCREEN_W} height={CHART_HEIGHT}>
      <Line x1={rs(20)} y1={CHART_HEIGHT - rs(30)} x2={SCREEN_W - rs(10)} y2={CHART_HEIGHT - rs(30)} stroke={colors.border} strokeWidth={1} />
      {data.map((d, i) => {
        const v = Number(d.entries) || 0;
        const h = (v / maxEntries) * (CHART_HEIGHT - rs(60));
        const x = rs(20) + i * cellW;
        return (
          <React.Fragment key={i}>
            <Rect x={x} y={CHART_HEIGHT - rs(30) - h} width={cellW - rs(2)} height={h} fill={colors.click} rx={2} opacity={0.85} />
            <SvgText x={x + cellW / 2} y={CHART_HEIGHT - rs(12)} fontSize={fs(9)} fill={colors.textDim} textAnchor="middle">{d.month}</SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: rs(40) },
  emptyText: { fontSize: fs(13), color: colors.textSec, textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(16),
    paddingVertical: rs(10),
  },
  headerTitle: { color: colors.text, fontSize: fs(15), fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: rs(8) },
  content: { padding: SCREEN_PADDING },
  petName: {
    fontSize: fs(11),
    color: colors.textDim,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: rs(6),
  },
  sevBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    alignSelf: 'flex-start',
    paddingHorizontal: rs(10),
    paddingVertical: rs(4),
    borderRadius: rs(20),
    borderWidth: 1,
    marginBottom: rs(10),
  },
  sevDot: { width: rs(8), height: rs(8), borderRadius: rs(4) },
  sevText: { fontSize: fs(11), fontWeight: '700' },
  sevSub: { fontSize: fs(10), color: colors.textDim, fontWeight: '600' },
  title: {
    fontSize: fs(20),
    color: colors.text,
    fontWeight: '700',
    lineHeight: fs(28),
    marginBottom: rs(10),
  },
  body: {
    fontSize: fs(14),
    color: colors.text,
    lineHeight: fs(22),
    marginBottom: rs(16),
  },
  sectionLabel: {
    fontSize: fs(11),
    color: colors.textDim,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: rs(8),
  },
  chartWrap: {
    backgroundColor: colors.card,
    borderRadius: rs(12),
    padding: rs(12),
    marginBottom: rs(16),
    borderWidth: 1,
    borderColor: colors.border,
  },
  evidenceBox: {
    backgroundColor: colors.card,
    borderRadius: rs(12),
    padding: rs(14),
    marginBottom: rs(16),
    borderWidth: 1,
    borderColor: colors.border,
  },
  evSummary: {
    fontSize: fs(12),
    color: colors.textSec,
    fontStyle: 'italic',
    marginBottom: rs(10),
    lineHeight: fs(18),
  },
  evGrid: { gap: rs(6) },
  evRow: { flexDirection: 'row', justifyContent: 'space-between' },
  evKey: { fontSize: fs(11), color: colors.textDim },
  evVal: { fontSize: fs(11), color: colors.text, fontWeight: '600' },
  ctaRow: {
    flexDirection: 'row',
    gap: rs(10),
    marginTop: rs(12),
  },
  ctaPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    paddingVertical: rs(14),
    borderRadius: rs(12),
  },
  ctaPrimaryText: { color: '#FFFFFF', fontSize: fs(14), fontWeight: '700' },
  ctaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    paddingHorizontal: rs(14),
    paddingVertical: rs(14),
    borderRadius: rs(12),
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaSecondaryText: { color: colors.textDim, fontSize: fs(13), fontWeight: '600' },
  talkingBox: {
    backgroundColor: colors.click + '08',
    borderColor: colors.click + '25',
    borderWidth: 1,
    borderRadius: rs(12),
    padding: rs(14),
    marginBottom: rs(16),
  },
  talkingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    marginBottom: rs(8),
  },
  talkingItem: {
    flexDirection: 'row',
    gap: rs(8),
    marginTop: rs(6),
  },
  talkingBullet: {
    fontSize: fs(14),
    color: colors.click,
    fontWeight: '700',
    lineHeight: fs(20),
  },
  talkingText: {
    flex: 1,
    fontSize: fs(13),
    color: colors.text,
    lineHeight: fs(20),
  },
  supportBox: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: rs(12),
    padding: rs(14),
    marginBottom: rs(16),
  },
  supportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    marginTop: rs(6),
  },
  supportLinkText: {
    fontSize: fs(13),
    color: colors.click,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
