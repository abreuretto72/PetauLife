/**
 * components/insights/InsightCard.tsx
 *
 * Card visual de um insight no feed. Mostra ícone por categoria, severity color,
 * pet name (multi-pet feed), título, body, e CTA principal.
 */
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle, Info, Sparkles, Syringe, Stethoscope, Heart, Pill,
  CloudRain, Sun, Snowflake, Wind, Footprints, Cake, FileText, Microchip,
  TrendingUp, Calendar, ChevronRight, X as XIcon,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { rs, fs } from '../../hooks/useResponsive';
import type { PetInsight, InsightSeverity } from '../../types/insights';

const CATEGORY_ICONS: Record<string, typeof Info> = {
  vacina: Syringe,
  saude: Stethoscope,
  comportamento: Heart,
  peso: TrendingUp,
  documento: FileText,
  nutricao: Pill,
  financeiro: FileText,
};

const SUBCATEGORY_ICONS: Record<string, typeof Info> = {
  microchip_missing: Microchip,
  vermifuge_due: Pill,
  antipulgas_due: Pill,
  bath_overdue: Heart,
  birthday_upcoming: Cake,
  routine_checkup_due: Stethoscope,
  extreme_heat: Sun,
  extreme_cold: Snowflake,
  storm: CloudRain,
  air_quality: Wind,
  no_walks_streak: Footprints,
  life_phase_change: Calendar,
  silent_anomaly: AlertTriangle,
  appetite_decreased: TrendingUp,
  appetite_increased: TrendingUp,
  scratching_recurrent: AlertTriangle,
  weight_change: TrendingUp,
  seasonality: Sparkles,
  monthly_summary: Sparkles,
  yearly_summary: Sparkles,
};

const SEVERITY_COLOR: Record<InsightSeverity, string> = {
  urgent: colors.danger,
  attention: colors.warning,
  consider: colors.click,
  info: colors.textSec,
};

export interface InsightCardProps {
  insight: PetInsight & { pet_name?: string; pet_avatar_url?: string };
  showPetName?: boolean;
  onPressDetail: (id: string) => void;
  onDismiss?: (id: string) => void;
  onCta?: (insight: PetInsight) => void;
}

export const InsightCard = React.memo(function InsightCard({
  insight,
  showPetName = true,
  onPressDetail,
  onDismiss,
  onCta,
}: InsightCardProps) {
  const router = useRouter();
  const { t } = useTranslation();

  const Icon = SUBCATEGORY_ICONS[insight.subcategory ?? ''] ?? CATEGORY_ICONS[insight.category] ?? Info;
  const sevColor = SEVERITY_COLOR[insight.severity] ?? colors.textSec;
  const isUnread = !insight.read_at;

  const handlePress = useCallback(() => {
    onPressDetail(insight.id);
  }, [insight.id, onPressDetail]);

  const handleCta = useCallback(() => {
    if (onCta) {
      onCta(insight);
    } else if (insight.action_route) {
      router.push(insight.action_route as never);
    }
  }, [insight, onCta, router]);

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: sevColor }, isUnread && styles.cardUnread]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header: ícone + pet name + severity dot */}
      <View style={styles.header}>
        <View style={[styles.iconBubble, { backgroundColor: sevColor + '20' }]}>
          <Icon size={rs(18)} color={sevColor} strokeWidth={1.8} />
        </View>
        <View style={styles.headerText}>
          {showPetName && insight.pet_name ? (
            <Text style={styles.petName} numberOfLines={1}>{insight.pet_name}</Text>
          ) : null}
          <Text style={[styles.title, isUnread && styles.titleUnread]} numberOfLines={2}>
            {insight.title}
          </Text>
        </View>
        {onDismiss ? (
          <TouchableOpacity
            onPress={() => onDismiss(insight.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.dismissBtn}
          >
            <XIcon size={rs(16)} color={colors.textDim} strokeWidth={2} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Body curto */}
      <Text style={styles.body} numberOfLines={3}>{insight.body}</Text>

      {/* CTA + chevron */}
      <View style={styles.footer}>
        {insight.action_route ? (
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: sevColor + '12', borderColor: sevColor + '30' }]}
            onPress={handleCta}
            activeOpacity={0.7}
          >
            <Text style={[styles.ctaText, { color: sevColor }]}>
              {insight.action_label
                ?? t(`insights.cta.${insight.cta_type}`, { defaultValue: t('insights.cta.default', { defaultValue: 'Ver detalhes' }) })}
            </Text>
            <ChevronRight size={rs(12)} color={sevColor} strokeWidth={2} />
          </TouchableOpacity>
        ) : null}
        <Text style={styles.layerBadge}>L{insight.layer}</Text>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: rs(4),
    padding: rs(14),
    marginBottom: rs(10),
  },
  cardUnread: {
    backgroundColor: colors.cardHover ?? colors.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: rs(10),
    marginBottom: rs(8),
  },
  iconBubble: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  petName: {
    fontSize: fs(11),
    color: colors.textDim,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: rs(2),
  },
  title: {
    fontSize: fs(14),
    color: colors.text,
    fontWeight: '600',
    lineHeight: fs(20),
  },
  titleUnread: {
    fontWeight: '700',
  },
  dismissBtn: {
    padding: rs(4),
  },
  body: {
    fontSize: fs(12),
    color: colors.textSec,
    lineHeight: fs(18),
    marginBottom: rs(10),
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(4),
    paddingHorizontal: rs(10),
    paddingVertical: rs(6),
    borderRadius: rs(8),
    borderWidth: 1,
  },
  ctaText: {
    fontSize: fs(11),
    fontWeight: '700',
  },
  layerBadge: {
    fontSize: fs(9),
    color: colors.textDim,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
