/**
 * nutrition/restricoes.tsx — Tela 3: Restrições e intolerâncias.
 *
 * AI-first:
 *  - Mic STT no campo de adicionar (via componente <Input>).
 *  - Seção "Sugeridas pra esta raça" carregada via EF suggest-breed-restrictions
 *    (cache por species+breed+locale). Tutor confirma sugestão com 1 toque.
 *  - Lista ASPCA universal mantida abaixo (chocolate, uvas, xilitol etc).
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft, Plus, ShieldAlert, Trash2, AlertOctagon, FileText,
  Sparkles, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react-native';
import { rs, fs } from '../../../../../hooks/useResponsive';
import { colors } from '../../../../../constants/colors';
import { useNutricao } from '../../../../../hooks/useNutricao';
import { useToast } from '../../../../../components/Toast';
import { usePets } from '../../../../../hooks/usePets';
import { Input } from '../../../../../components/ui/Input';
import { supabase } from '../../../../../lib/supabase';
import i18n from '../../../../../i18n';
import PdfActionModal from '../../../../../components/pdf/PdfActionModal';
import { previewNutritionPdf, shareNutritionPdf } from '../../../../../lib/nutritionPdf';

const ASPCA_KEYS = [
  'aspcaChocolate', 'aspcaGrapes', 'aspcaOnion', 'aspcaXylitol', 'aspcaMacadamia',
  'aspcaAvocado', 'aspcaAlcohol', 'aspcaCaffeine', 'aspcaRawDough', 'aspcaStoneFruit',
];

interface BreedSuggestion {
  name: string;
  type: 'restriction' | 'intolerance';
  category: string;
  reason: string;
  frequency: 'very_common' | 'common' | 'occasional';
}

interface BreedSuggestionsResponse {
  from_cache: boolean;
  breed: string;
  locale: string;
  suggestions: BreedSuggestion[];
}

export default function RestricoesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id: petId } = useLocalSearchParams<{ id: string }>();
  const { pets } = usePets();
  const pet = pets.find((p) => p.id === petId);
  const { nutricao, addRestricao, removeRestricao, isAddingRestricao } = useNutricao(petId ?? '');
  const { confirm, toast } = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState<'restriction' | 'intolerance'>('restriction');
  const [pdfModal, setPdfModal] = useState(false);
  const petName = pet?.name ?? '';

  // ── Sugestões IA por raça ──────────────────────────────────────────────────
  const [suggestions, setSuggestions] = useState<BreedSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [addedSuggestions, setAddedSuggestions] = useState<Set<string>>(new Set());
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);

  const loadSuggestions = useCallback(async (force = false) => {
    if (!petId) return;
    setLoadingSuggestions(true);
    setSuggestionsError(null);
    try {
      const { data, error } = await supabase.functions.invoke<BreedSuggestionsResponse>(
        'suggest-breed-restrictions',
        { body: { pet_id: petId, locale: i18n.language ?? 'pt-BR', force } },
      );
      if (error) throw error;
      if (!data?.suggestions) throw new Error('empty');
      setSuggestions(data.suggestions);
    } catch (e) {
      setSuggestionsError(e instanceof Error ? e.message : 'unknown');
    } finally {
      setLoadingSuggestions(false);
    }
  }, [petId]);

  useEffect(() => {
    loadSuggestions(false);
  }, [loadSuggestions]);

  const handleAcceptSuggestion = useCallback(async (sug: BreedSuggestion) => {
    try {
      await addRestricao({
        product_name: sug.name,
        record_type: sug.type,
        notes: sug.reason,
      });
      setAddedSuggestions((prev) => new Set(prev).add(sug.name.toLowerCase()));
      toast(t('toast.entrySaved'), 'success');
    } catch {
      toast(t('errors.generic'), 'error');
    }
  }, [addRestricao, toast, t]);

  const handleAdd = async () => {
    if (!name.trim()) return;
    try {
      await addRestricao({ product_name: name.trim(), record_type: type });
      setName('');
      toast(t('toast.entrySaved'), 'success');
    } catch {
      toast(t('errors.generic'), 'error');
    }
  };

  const handleRemove = async (id: string, itemName: string) => {
    const yes = await confirm({ text: t('nutrition.confirmRemoveRestricao', { name: itemName }), type: 'warning' });
    if (!yes) return;
    try {
      await removeRestricao(id);
      toast(t('toast.entrySaved'), 'success');
    } catch {
      toast(t('errors.generic'), 'error');
    }
  };

  // Já registradas — pra evitar mostrar sugestão de algo que tutor já adicionou
  const existingNames = new Set(
    (nutricao?.restrictions ?? []).map((r) => (r.product_name ?? '').toLowerCase()),
  );
  const filteredSuggestions = suggestions.filter(
    (s) => !existingNames.has(s.name.toLowerCase()) && !addedSuggestions.has(s.name.toLowerCase()),
  );

  return (
    <SafeAreaView style={s.safeArea}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <ChevronLeft size={rs(22)} color={colors.click} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{t('nutrition.restricoesTitle')}</Text>
        <TouchableOpacity
          onPress={() => setPdfModal(true)}
          style={s.backBtn}
          accessibilityLabel={t('nutritionPdf.icon')}
        >
          <FileText size={rs(20)} color={colors.click} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Already registered restrictions */}
        <Text style={s.sectionLabel}>{t('nutrition.restricoesKnown')}</Text>

        {(nutricao?.restrictions ?? []).length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={s.emptyText}>{t('nutrition.restricoesEmpty')}</Text>
          </View>
        ) : (
          <View style={s.listCard}>
            {nutricao!.restrictions.map((r) => (
              <View key={r.id} style={s.listRow}>
                <ShieldAlert size={rs(16)} color={colors.warning} />
                <Text style={s.listItemText} numberOfLines={1}>
                  {r.product_name ?? r.notes ?? '—'}
                </Text>
                <TouchableOpacity
                  onPress={() => handleRemove(r.id, r.product_name ?? '?')}
                  style={s.removeBtn}
                >
                  <Trash2 size={rs(16)} color={colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* AI suggestions by breed */}
        {pet?.breed && (
          <View style={{ marginTop: rs(6) }}>
            <View style={s.aiHeaderRow}>
              <View style={s.aiHeaderLeft}>
                <Sparkles size={rs(14)} color={colors.ai} strokeWidth={1.8} />
                <Text style={s.aiSectionLabel}>
                  {t('nutrition.restricoesAiSuggestions', { breed: pet.breed })}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => loadSuggestions(true)}
                disabled={loadingSuggestions}
                style={s.aiRefreshBtn}
                accessibilityLabel={t('common.refresh')}
              >
                <RefreshCw size={rs(14)} color={colors.click} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>

            <Text style={s.aiHint}>{t('nutrition.restricoesAiHint')}</Text>

            {loadingSuggestions && filteredSuggestions.length === 0 ? (
              <View style={s.aiLoadingCard}>
                <ActivityIndicator size="small" color={colors.ai} />
                <Text style={s.aiLoadingText}>{t('nutrition.restricoesAiLoading')}</Text>
              </View>
            ) : suggestionsError ? (
              <View style={s.aiErrorCard}>
                <Text style={s.aiErrorText}>{t('nutrition.restricoesAiError')}</Text>
                <TouchableOpacity onPress={() => loadSuggestions(false)} style={s.aiRetryBtn}>
                  <Text style={s.aiRetryText}>{t('common.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : filteredSuggestions.length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>{t('nutrition.restricoesAiEmpty')}</Text>
              </View>
            ) : (
              <View style={s.aiList}>
                {filteredSuggestions.map((sug, idx) => {
                  const key = `${sug.name}-${idx}`;
                  const isExpanded = expandedSuggestion === key;
                  return (
                    <View key={key} style={s.aiCard}>
                      {/* Toque na área superior expande/recolhe o texto completo. */}
                      <TouchableOpacity
                        onPress={() => setExpandedSuggestion(isExpanded ? null : key)}
                        activeOpacity={0.85}
                      >
                        <View style={s.aiCardHeader}>
                          <Text style={s.aiCardName}>{sug.name}</Text>
                          <View style={[
                            s.aiFreqBadge,
                            sug.frequency === 'very_common' && { backgroundColor: colors.danger + '15', borderColor: colors.danger + '40' },
                            sug.frequency === 'common' && { backgroundColor: colors.warning + '15', borderColor: colors.warning + '40' },
                            sug.frequency === 'occasional' && { backgroundColor: colors.textDim + '15', borderColor: colors.border },
                          ]}>
                            <Text style={[
                              s.aiFreqText,
                              sug.frequency === 'very_common' && { color: colors.danger },
                              sug.frequency === 'common' && { color: colors.warning },
                              sug.frequency === 'occasional' && { color: colors.textSec },
                            ]}>
                              {t(`nutrition.restricoesAiFreq_${sug.frequency}`)}
                            </Text>
                          </View>
                        </View>
                        <View style={s.aiCardMeta}>
                          <Text style={[s.aiTypeBadge, { color: colors.ai }]}>
                            {t(sug.type === 'intolerance' ? 'nutrition.typeIntolerance' : 'nutrition.typeRestriction').toUpperCase()}
                          </Text>
                          <Text style={s.aiCategoryText}>· {sug.category}</Text>
                        </View>
                        <Text
                          style={s.aiCardReason}
                          numberOfLines={isExpanded ? undefined : 3}
                        >
                          {sug.reason}
                        </Text>
                        {/* Indicador visual de expansão — só aparece se o texto pode ser
                            mais longo do que cabe em 3 linhas. Heurística: >180 chars. */}
                        {sug.reason.length > 180 && (
                          <View style={s.aiExpandRow}>
                            {isExpanded ? (
                              <ChevronUp size={rs(13)} color={colors.textDim} strokeWidth={1.8} />
                            ) : (
                              <ChevronDown size={rs(13)} color={colors.textDim} strokeWidth={1.8} />
                            )}
                            <Text style={s.aiExpandText}>
                              {t(isExpanded ? 'nutrition.restricoesAiCollapse' : 'nutrition.restricoesAiExpand')}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      {/* Botão "+ Adicionar" — separado do toque de expandir. */}
                      <TouchableOpacity
                        onPress={() => handleAcceptSuggestion(sug)}
                        style={s.aiAddRow}
                        activeOpacity={0.7}
                      >
                        <Plus size={rs(12)} color={colors.click} />
                        <Text style={s.aiAddText}>{t('nutrition.restricoesAiAdd')}</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Manual add — só pra casos que IA não cobriu */}
        <Text style={s.sectionLabel}>{t('nutrition.btnAddRestricao')}</Text>
        <View style={s.addCard}>
          <View style={s.typeRow}>
            <TouchableOpacity
              style={[s.typeChip, type === 'restriction' && s.typeChipActive]}
              onPress={() => setType('restriction')}
            >
              <Text style={[s.typeChipText, type === 'restriction' && s.typeChipTextActive]}>
                {t('nutrition.typeRestriction')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.typeChip, type === 'intolerance' && s.typeChipActive]}
              onPress={() => setType('intolerance')}
            >
              <Text style={[s.typeChipText, type === 'intolerance' && s.typeChipTextActive]}>
                {t('nutrition.typeIntolerance')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* <Input> traz mic STT integrado — nada de TextInput cru aqui */}
          <Input
            value={name}
            onChangeText={setName}
            placeholder={t('nutrition.addRestricaoPlaceholder')}
          />

          <TouchableOpacity
            style={[s.addBtn, (!name.trim() || isAddingRestricao) && s.addBtnDisabled]}
            onPress={handleAdd}
            disabled={!name.trim() || isAddingRestricao}
            activeOpacity={0.8}
          >
            <Plus size={rs(18)} color="#fff" />
            <Text style={s.addBtnText}>{t('nutrition.btnAddRestricao')}</Text>
          </TouchableOpacity>
        </View>

        {/* ASPCA list — universal */}
        <Text style={s.sectionLabel}>{t('nutrition.restricoesASPCA')}</Text>
        <View style={s.aspcaCard}>
          {ASPCA_KEYS.map((key) => (
            <View key={key} style={s.aspcaRow}>
              <AlertOctagon size={rs(15)} color={colors.danger} />
              <Text style={s.aspcaText}>{t(`nutrition.${key}`)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <PdfActionModal
        visible={pdfModal}
        onClose={() => setPdfModal(false)}
        title={t('nutritionPdf.title', { name: petName })}
        onPreview={() => previewNutritionPdf({ petId: petId ?? '', petName })}
        onShare={() => shareNutritionPdf({ petId: petId ?? '', petName })}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: rs(16), paddingVertical: rs(12),
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { width: rs(36), height: rs(36), alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: fs(17), fontWeight: '700', color: colors.text },
  scroll: { flex: 1 },
  content: { padding: rs(16), gap: rs(14), paddingBottom: rs(40) },
  sectionLabel: { fontSize: fs(11), fontWeight: '700', color: colors.textDim, letterSpacing: 1.2 },
  emptyCard: {
    backgroundColor: colors.card, borderRadius: rs(12), padding: rs(16),
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  emptyText: { fontSize: fs(13), color: colors.textDim },
  listCard: {
    backgroundColor: colors.card, borderRadius: rs(14), overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  listRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(10),
    padding: rs(14), borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  listItemText: { flex: 1, fontSize: fs(14), color: colors.text },
  removeBtn: { padding: rs(4) },

  // AI suggestions
  aiHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: rs(4),
  },
  aiHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: rs(6), flex: 1 },
  aiSectionLabel: {
    fontSize: fs(11), fontWeight: '700', color: colors.ai,
    letterSpacing: 1.2, flex: 1,
  },
  aiRefreshBtn: { padding: rs(6) },
  aiHint: {
    fontSize: fs(12), color: colors.textDim,
    fontStyle: 'italic', marginBottom: rs(8),
  },
  aiLoadingCard: {
    backgroundColor: colors.card, borderRadius: rs(12),
    padding: rs(20), alignItems: 'center', gap: rs(10),
    borderWidth: 1, borderColor: colors.border,
  },
  aiLoadingText: { fontSize: fs(12), color: colors.textDim },
  aiErrorCard: {
    backgroundColor: colors.card, borderRadius: rs(12),
    padding: rs(14), gap: rs(8),
    borderWidth: 1, borderColor: colors.border,
  },
  aiErrorText: { fontSize: fs(12), color: colors.textDim, textAlign: 'center' },
  aiRetryBtn: { alignSelf: 'center', padding: rs(6) },
  aiRetryText: { fontSize: fs(12), color: colors.click, fontWeight: '600' },
  aiList: { gap: rs(10) },
  aiCard: {
    backgroundColor: colors.card, borderRadius: rs(14), padding: rs(14),
    borderWidth: 1, borderColor: colors.ai + '30', gap: rs(8),
  },
  aiCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    gap: rs(8),
  },
  aiCardName: { flex: 1, fontSize: fs(15), fontWeight: '700', color: colors.text },
  aiFreqBadge: {
    paddingHorizontal: rs(8), paddingVertical: rs(3), borderRadius: rs(6),
    borderWidth: 1,
  },
  aiFreqText: { fontSize: fs(9), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  aiCardMeta: { flexDirection: 'row', alignItems: 'center', gap: rs(6) },
  aiTypeBadge: { fontSize: fs(10), fontWeight: '700', letterSpacing: 0.5 },
  aiCategoryText: { fontSize: fs(11), color: colors.textDim },
  aiCardReason: { fontSize: fs(13), color: colors.textSec, lineHeight: fs(13) * 1.45 },
  aiExpandRow: {
    flexDirection: 'row', alignItems: 'center', gap: rs(4),
    marginTop: rs(6),
  },
  aiExpandText: { fontSize: fs(11), color: colors.textDim, fontStyle: 'italic' },
  aiAddRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: rs(4),
    paddingTop: rs(8), marginTop: rs(8),
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  aiAddText: { fontSize: fs(11), fontWeight: '700', color: colors.click, letterSpacing: 0.4 },

  // Add form
  addCard: {
    backgroundColor: colors.card, borderRadius: rs(14), padding: rs(16),
    borderWidth: 1, borderColor: colors.border, gap: rs(12),
  },
  typeRow: { flexDirection: 'row', gap: rs(8) },
  typeChip: {
    flex: 1, paddingVertical: rs(8), borderRadius: rs(10),
    backgroundColor: colors.bgCard, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  typeChipActive: { backgroundColor: colors.clickSoft, borderColor: colors.click },
  typeChipText: { fontSize: fs(13), color: colors.textSec, fontWeight: '600' },
  typeChipTextActive: { color: colors.click },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: rs(8), backgroundColor: colors.click, borderRadius: rs(12), padding: rs(14),
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: { fontSize: fs(14), fontWeight: '700', color: '#fff' },

  // ASPCA
  aspcaCard: {
    backgroundColor: colors.card, borderRadius: rs(14), padding: rs(16),
    borderWidth: 1, borderColor: colors.danger + '30', gap: rs(10),
  },
  aspcaRow: { flexDirection: 'row', alignItems: 'center', gap: rs(10) },
  aspcaText: { fontSize: fs(13), color: colors.text },
});
