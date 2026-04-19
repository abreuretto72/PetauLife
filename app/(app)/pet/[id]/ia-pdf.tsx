import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Download, Share2, MessageSquare } from 'lucide-react-native';
import { rs, fs } from '../../../../hooks/useResponsive';
import { colors } from '../../../../constants/colors';
import { useToast } from '../../../../components/Toast';
import { getErrorMessage } from '../../../../utils/errorMessages';
import { previewIaChatPdf, shareIaChatPdf } from '../../../../lib/iaChatPdf';
import type { ChatMessage } from '../../../../hooks/usePetAssistant';

export default function IaPdfScreen() {
  const { id, messagesJson, petName } = useLocalSearchParams<{
    id: string;
    messagesJson: string;
    petName: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [isGenerating, setIsGenerating] = useState(false);

  const messages: ChatMessage[] = (() => {
    try { return JSON.parse(messagesJson ?? '[]') as ChatMessage[]; }
    catch { return []; }
  })();

  const resolvedName = petName ?? '';

  // Open print preview automatically on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsGenerating(true);
      try {
        await previewIaChatPdf(messages, resolvedName);
      } catch { /* ignore — user can retry manually */ }
      if (!cancelled) setIsGenerating(false);
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePreview = useCallback(async () => {
    setIsGenerating(true);
    try {
      await previewIaChatPdf(messages, resolvedName);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setIsGenerating(false);
    }
  }, [messages, resolvedName, toast]);

  const handleShare = useCallback(async () => {
    setIsGenerating(true);
    try {
      await shareIaChatPdf(messages, resolvedName);
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setIsGenerating(false);
    }
  }, [messages, resolvedName, toast]);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.headerBtn} activeOpacity={0.7}>
          <ChevronLeft size={rs(22)} color={colors.accent} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('ia.pdfTitle', { name: resolvedName })}</Text>
        <View style={s.headerBtn} />
      </View>

      <View style={s.content}>
        {/* Icon + description */}
        <View style={s.previewBox}>
          <View style={s.previewIconWrap}>
            <MessageSquare size={rs(48)} color={colors.purple} strokeWidth={1.3} />
          </View>
          <Text style={s.previewTitle}>{t('ia.pdfReady')}</Text>
          <Text style={s.previewSubtitle}>{t('ia.pdfReadySubtitle')}</Text>
        </View>

        {/* Action buttons */}
        <View style={s.actions}>
          <TouchableOpacity
            style={[s.actionRow, { borderColor: colors.accent + '40' }]}
            onPress={handlePreview}
            activeOpacity={0.8}
            disabled={isGenerating}
          >
            <View style={[s.actionIcon, { backgroundColor: colors.accentGlow }]}>
              {isGenerating
                ? <ActivityIndicator color={colors.accent} size="small" />
                : <Download size={rs(22)} color={colors.accent} strokeWidth={1.8} />
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.actionTitle}>{t('ia.printOrSave')}</Text>
              <Text style={s.actionSubtitle}>{t('ia.printOrSaveHint')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionRow, { borderColor: colors.petrol + '40' }]}
            onPress={handleShare}
            activeOpacity={0.8}
            disabled={isGenerating}
          >
            <View style={[s.actionIcon, { backgroundColor: colors.petrolSoft }]}>
              <Share2 size={rs(22)} color={colors.petrol} strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.actionTitle}>{t('ia.shareFile')}</Text>
              <Text style={s.actionSubtitle}>{t('ia.shareFileHint')}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={s.disclaimer}>{t('ia.pdfDisclaimer')}</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: rs(16), paddingVertical: rs(10),
    gap: rs(12), borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerBtn: {
    width: rs(40), height: rs(40), borderRadius: rs(12),
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1, fontFamily: 'Sora_700Bold', fontSize: fs(15),
    color: colors.text, textAlign: 'center',
  },
  content: { flex: 1, padding: rs(24) },
  previewBox: { alignItems: 'center', paddingVertical: rs(32) },
  previewIconWrap: {
    width: rs(96), height: rs(96), borderRadius: rs(28),
    backgroundColor: colors.purple + '15',
    alignItems: 'center', justifyContent: 'center', marginBottom: rs(16),
    borderWidth: 1, borderColor: colors.purple + '30',
  },
  previewTitle: {
    fontFamily: 'Sora_700Bold', fontSize: fs(20), color: colors.text, textAlign: 'center',
  },
  previewSubtitle: {
    fontFamily: 'Sora_400Regular', fontSize: fs(13), color: colors.textDim,
    textAlign: 'center', marginTop: rs(8), lineHeight: fs(13) * 1.6,
    paddingHorizontal: rs(16),
  },
  actions: { gap: rs(12) },
  actionRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(14),
    backgroundColor: colors.card, borderRadius: rs(16),
    padding: rs(16), borderWidth: 1,
  },
  actionIcon: {
    width: rs(48), height: rs(48), borderRadius: rs(14),
    alignItems: 'center', justifyContent: 'center',
  },
  actionTitle: { fontFamily: 'Sora_600SemiBold', fontSize: fs(15), color: colors.text },
  actionSubtitle: {
    fontFamily: 'Sora_400Regular', fontSize: fs(12), color: colors.textDim, marginTop: rs(2),
  },
  disclaimer: {
    fontFamily: 'Sora_400Regular', fontSize: fs(10), color: colors.textDim,
    textAlign: 'center', marginTop: rs(24), lineHeight: fs(10) * 1.6,
  },
});
