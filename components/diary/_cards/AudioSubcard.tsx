/**
 * AudioSubcard — rendered inside DiaryCard for audio media items.
 *
 * Renders the full AI analysis of the pet's vocalization:
 *   - Sound type + subtype (translated) — e.g. "Latido · alerta"
 *   - Emotional state (translated, coloured)
 *   - Intensity (badge, coloured by severity)
 *   - Vet attention warning (red badge) when classification says so
 *   - Pattern notes (clinical description)
 *
 * The richer fields (`sound_subtype`, `requires_vet_attention`) live inside
 * `event.classifications[?].extracted_data` — the parent DiaryCard passes the
 * classifications array so we can extract them here without touching the DB.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Mic, Music2, Play, AlertTriangle, Lightbulb } from 'lucide-react-native';
import MediaViewerModal from '../MediaViewerModal';
import { colors } from '../../../constants/colors';
import { rs } from '../../../hooks/useResponsive';
import type { MediaAnalysisItem } from '../timelineTypes';
import { resolveMediaUri } from './shared';
import { styles } from './styles';

const INTENSITY_COLOR: Record<string, string> = {
  low: '#2ECC71',
  medium: '#F1C40F',
  high: '#E74C3C',
};

// Emotional states that deserve a "warn/danger" treatment on the card —
// everything else gets the calm rose-ish tint.
const EMOTION_TONE: Record<string, 'positive' | 'neutral' | 'warn' | 'danger'> = {
  happy: 'positive',
  excited: 'positive',
  playful: 'positive',
  content: 'positive',
  alert: 'neutral',
  anxious: 'warn',
  fearful: 'warn',
  stressed: 'warn',
  aggressive: 'warn',
  'in-pain': 'danger',
  sad: 'warn',
};

const TONE_COLOR = {
  positive: '#2ECC71',
  neutral: colors.click,
  warn: '#F1C40F',
  danger: '#E74C3C',
};

type AudioClassificationExtra = {
  sound_subtype?: string;
  requires_vet_attention?: boolean;
};

interface Classification {
  type: string;
  confidence: number;
  extracted_data: Record<string, unknown>;
}

interface AudioSubcardProps {
  media: MediaAnalysisItem;
  classifications?: Classification[] | null;
  t: (k: string, opts?: Record<string, string>) => string;
}

// i18n keys use camelCase for values with hyphens (e.g. "in-pain" → "inPain")
function normalizeEmotionKey(raw: string): string {
  return raw.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

export function AudioSubcard({ media, classifications, t }: AudioSubcardProps) {
  const pa = media.petAudioAnalysis;
  const fileName = media.fileName ?? t('diary.audioFile');
  const audioUri = resolveMediaUri(media.mediaUrl);

  const [viewerOpen, setViewerOpen] = useState(false);

  // Extras (subtype + vet-attention) are only in classifications[].extracted_data.
  // Find a classification that looks like the audio one (carries sound_type).
  const audioClassification = classifications?.find((c) => {
    const ed = c.extracted_data ?? {};
    return typeof ed.sound_type === 'string' || typeof ed.sound_subtype === 'string';
  });
  const extra: AudioClassificationExtra = (audioClassification?.extracted_data ?? {}) as AudioClassificationExtra;

  // Detect the classifier's silent fallback shape: when Gemini returns JSON
  // without a `pet_audio_analysis` field, classifier.ts defaults to
  // {sound_type:'other', emotional_state:'unknown', intensity:'medium', pattern_notes:''}.
  // Showing those as if they were real AI findings is misleading — render a
  // low-confidence note instead.
  const isLowConfidenceFallback =
    pa?.sound_type === 'other' &&
    pa?.emotional_state === 'unknown' &&
    !pa?.pattern_notes?.trim();

  const soundLabel = pa?.sound_type
    ? t(`listen.sound_${pa.sound_type}`, { defaultValue: pa.sound_type })
    : null;
  const subtypeLabel = extra.sound_subtype
    ? t(`listen.subtype_${extra.sound_subtype}`, { defaultValue: extra.sound_subtype })
    : null;

  const emotionKey = pa?.emotional_state ? normalizeEmotionKey(pa.emotional_state) : null;
  const emotionLabel = emotionKey
    ? t(`listen.emotion_${emotionKey}`, { defaultValue: pa!.emotional_state })
    : null;
  const emotionTone = pa?.emotional_state ? (EMOTION_TONE[pa.emotional_state] ?? 'neutral') : 'neutral';
  const emotionColor = TONE_COLOR[emotionTone];

  const intensityColor = pa?.intensity ? (INTENSITY_COLOR[pa.intensity] ?? colors.rose) : colors.rose;
  const intensityLabel = pa?.intensity
    ? t(`listen.intensity_${pa.intensity}`, { defaultValue: pa.intensity })
    : null;

  const needsVet = extra.requires_vet_attention === true;

  return (
    <View style={[styles.subcard, { borderColor: colors.rose + '30' }]}>
      <View style={styles.subcardHeader}>
        <Mic size={rs(12)} color={colors.rose} strokeWidth={1.8} />
        <Text style={[styles.subcardLabel, { color: colors.rose }]}>{t('diary.audioAnalysis').toUpperCase()}</Text>
      </View>

      <TouchableOpacity
        onPress={() => audioUri && setViewerOpen(true)}
        activeOpacity={audioUri ? 0.75 : 1}
        style={styles.audioFileRow}
      >
        <Music2 size={rs(20)} color={colors.rose} strokeWidth={1.6} />
        <Text style={styles.audioFileName} numberOfLines={1}>{fileName}</Text>
        {audioUri && <Play size={rs(16)} color={colors.rose} fill={colors.rose} strokeWidth={0} />}
      </TouchableOpacity>

      {audioUri && (
        <MediaViewerModal
          visible={viewerOpen}
          type="audio"
          uri={audioUri}
          fileName={fileName}
          onClose={() => setViewerOpen(false)}
        />
      )}

      {pa && isLowConfidenceFallback && (
        <View style={[styles.observationRow, { marginTop: rs(8) }]}>
          <AlertTriangle size={rs(12)} color={colors.textDim} strokeWidth={1.8} />
          <Text style={[styles.observationText, { color: colors.textDim, fontStyle: 'italic' }]}>
            {t('listen.lowConfidenceNote')}
          </Text>
        </View>
      )}

      {pa && !isLowConfidenceFallback && (
        <>
          {/* Sound type · subtype */}
          {soundLabel && (
            <Text style={styles.subcardBodyText}>
              {t('listen.soundType')}: <Text style={{ color: colors.text, fontWeight: '600' }}>{soundLabel}</Text>
              {subtypeLabel ? <Text style={{ color: colors.textSec }}>{'  ·  '}{subtypeLabel}</Text> : null}
            </Text>
          )}

          {/* Emotional state + intensity as badges */}
          {(emotionLabel || intensityLabel) && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: rs(6), marginTop: rs(6) }}>
              {emotionLabel && (
                <View style={[styles.severityBadge, { backgroundColor: emotionColor + '22' }]}>
                  <Text style={[styles.severityText, { color: emotionColor }]}>
                    {t('listen.emotionalStateLabel')}: {emotionLabel}
                  </Text>
                </View>
              )}
              {intensityLabel && (
                <View style={[styles.severityBadge, { backgroundColor: intensityColor + '22' }]}>
                  <Text style={[styles.severityText, { color: intensityColor }]}>{intensityLabel}</Text>
                </View>
              )}
            </View>
          )}

          {/* Vet attention — only when IA flagged it */}
          {needsVet && (
            <View style={[styles.severityBadge, { backgroundColor: colors.danger + '1A', alignSelf: 'flex-start', marginTop: rs(8), flexDirection: 'row', alignItems: 'center', gap: rs(4) }]}>
              <AlertTriangle size={rs(12)} color={colors.danger} strokeWidth={2} />
              <Text style={[styles.severityText, { color: colors.danger }]}>{t('listen.vetAttention')}</Text>
            </View>
          )}

          {/* Clinical pattern notes */}
          {pa.pattern_notes ? (
            <View style={[styles.observationRow, { marginTop: rs(8) }]}>
              <Lightbulb size={rs(12)} color={colors.warning} strokeWidth={1.8} />
              <Text style={styles.observationText}>{pa.pattern_notes}</Text>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}
