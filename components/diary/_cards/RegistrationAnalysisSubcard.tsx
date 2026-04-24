/**
 * RegistrationAnalysisSubcard — rendered inside DiaryCard for pet registration entries
 * that have photo_analysis_data. Shows breed, BCS bar, mood, health observations and alerts.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, AlertTriangle, Activity } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { rs, fs } from '../../../hooks/useResponsive';
import type { PhotoAnalysisResponse } from '../../../types/ai';

interface Props {
  data: Record<string, unknown>;
  t: (k: string, opts?: Record<string, unknown>) => string;
}

function bcsColor(score: number): string {
  if (score <= 3) return colors.warning;
  if (score <= 6) return colors.success;
  return colors.danger;
}

export function RegistrationAnalysisSubcard({ data, t }: Props) {
  const fa = data as unknown as PhotoAnalysisResponse;
  const breed = fa.breed?.name ?? fa.identification?.breed?.primary ?? null;
  const confidence = fa.breed?.confidence ?? fa.identification?.breed?.confidence ?? null;
  const bcs = fa.health?.body_condition_score ?? null;
  const bodyCondition = fa.health?.body_condition ?? null;

  // Collect health observations that are attention or concern level
  const healthFields = [
    fa.health?.skin_coat,
    fa.health?.eyes,
    fa.health?.ears,
    fa.health?.mouth_teeth,
    fa.health?.posture_body,
  ] as Array<Array<{ observation: string; severity: string; confidence: number }> | undefined>;

  const notableObs = healthFields
    .flat()
    .filter((obs): obs is { observation: string; severity: string; confidence: number } =>
      !!obs && (obs.severity === 'attention' || obs.severity === 'concern')
    )
    .slice(0, 4);

  const alerts = fa.alerts ?? [];
  const notableAlerts = alerts.filter((a) => a.severity !== 'info');

  if (!breed && bcs == null && notableObs.length === 0 && notableAlerts.length === 0) return null;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Sparkles size={rs(12)} color={colors.purple} strokeWidth={1.8} />
        <Text style={s.headerLabel}>{t('diary.registrationAnalysis').toUpperCase()}</Text>
      </View>

      {/* Breed + confidence */}
      {!!breed && (
        <View style={s.breedRow}>
          <Text style={s.breedName}>{breed}</Text>
          {confidence != null && (
            <View style={s.confidenceBadge}>
              <Text style={s.confidenceText}>{t('addPet.confidence', { value: String(Math.round(confidence * 100)) })}</Text>
            </View>
          )}
        </View>
      )}

      {/* BCS bar */}
      {bcs != null && (
        <View style={s.bcsBlock}>
          <View style={s.bcsBar}>
            {[1,2,3,4,5,6,7,8,9].map((n) => (
              <View
                key={n}
                style={[
                  s.bcsSegment,
                  n <= bcs && { backgroundColor: bcsColor(bcs) },
                ]}
              />
            ))}
          </View>
          <View style={s.bcsTextRow}>
            <Text style={s.bcsLabel}>{t('health.bcsLabel')}</Text>
            <Text style={[s.bcsValue, { color: bcsColor(bcs) }]}>
              {bcs}/9{bodyCondition ? ` · ${bodyCondition}` : ''}
            </Text>
          </View>
          <Text style={s.bcsExplain}>{t('health.bcsExplain')}</Text>
        </View>
      )}

      {/* Notable health observations */}
      {notableObs.length > 0 && (
        <View style={s.obsBlock}>
          <View style={s.obsHeader}>
            <Activity size={rs(11)} color={colors.warning} strokeWidth={1.8} />
            <Text style={s.obsTitle}>{t('diary.healthObservations').toUpperCase()}</Text>
          </View>
          {notableObs.map((obs, i) => (
            <View key={i} style={s.obsRow}>
              <View style={[s.obsDot, { backgroundColor: obs.severity === 'concern' ? colors.danger : colors.warning }]} />
              <Text style={s.obsText}>{obs.observation}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Alerts */}
      {notableAlerts.length > 0 && (
        <View style={s.alertsBlock}>
          {notableAlerts.map((alert, i) => (
            <View key={i} style={s.alertRow}>
              <AlertTriangle
                size={rs(12)}
                color={alert.severity === 'concern' ? colors.danger : colors.warning}
                strokeWidth={1.8}
              />
              <Text style={[s.alertText, { color: alert.severity === 'concern' ? colors.danger : colors.warning }]}>
                {alert.message}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text style={s.disclaimer}>{t('addPet.aiDisclaimer')}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginTop: rs(8),
    borderRadius: rs(12),
    borderWidth: 1,
    borderColor: colors.purple + '30',
    backgroundColor: colors.purple + '08',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(6),
    paddingHorizontal: rs(12),
    paddingVertical: rs(8),
    borderBottomWidth: 1,
    borderBottomColor: colors.purple + '20',
  },
  headerLabel: {
    fontFamily: 'Sora_700Bold',
    fontSize: fs(10),
    color: colors.purple,
    letterSpacing: 1.2,
  },
  breedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(8),
    paddingHorizontal: rs(12),
    paddingTop: rs(10),
    paddingBottom: rs(4),
  },
  breedName: {
    fontFamily: 'Sora_700Bold',
    fontSize: fs(14),
    color: colors.text,
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: colors.purple + '20',
    borderRadius: rs(8),
    paddingHorizontal: rs(8),
    paddingVertical: rs(3),
  },
  confidenceText: {
    fontFamily: 'Sora_700Bold',
    fontSize: fs(10),
    color: colors.purple,
  },
  bcsBlock: {
    paddingHorizontal: rs(12),
    paddingBottom: rs(6),
  },
  bcsBar: {
    flexDirection: 'row',
    gap: rs(2),
    height: rs(8),
    marginBottom: rs(6),
  },
  bcsTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: rs(4),
  },
  bcsLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: fs(11),
    color: colors.textSec,
  },
  bcsSegment: {
    flex: 1,
    borderRadius: rs(2),
    backgroundColor: colors.border,
  },
  bcsValue: {
    fontFamily: 'JetBrainsMono_700Bold',
    fontSize: fs(11),
  },
  bcsExplain: {
    fontFamily: 'Sora_400Regular',
    fontSize: fs(10),
    color: colors.textDim,
    lineHeight: fs(14),
  },
  obsBlock: {
    paddingHorizontal: rs(12),
    paddingBottom: rs(6),
  },
  obsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(5),
    marginBottom: rs(6),
    marginTop: rs(4),
  },
  obsTitle: {
    fontFamily: 'Sora_700Bold',
    fontSize: fs(10),
    color: colors.warning,
    letterSpacing: 1,
  },
  obsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: rs(7),
    marginBottom: rs(4),
  },
  obsDot: {
    width: rs(6),
    height: rs(6),
    borderRadius: rs(3),
    marginTop: rs(5),
  },
  obsText: {
    flex: 1,
    fontFamily: 'Sora_400Regular',
    fontSize: fs(12),
    color: colors.textSec,
    lineHeight: fs(18),
  },
  alertsBlock: {
    paddingHorizontal: rs(12),
    paddingBottom: rs(6),
    gap: rs(4),
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: rs(6),
  },
  alertText: {
    flex: 1,
    fontFamily: 'Sora_600SemiBold',
    fontSize: fs(12),
    lineHeight: fs(18),
  },
  disclaimer: {
    fontFamily: 'Sora_400Regular',
    fontSize: fs(10),
    color: colors.textGhost,
    fontStyle: 'italic',
    paddingHorizontal: rs(12),
    paddingBottom: rs(10),
    paddingTop: rs(4),
  },
});
