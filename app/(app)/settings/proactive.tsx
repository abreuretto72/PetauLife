/**
 * app/(app)/settings/proactive.tsx
 *
 * Configurações da IA Proativa do tutor: toggles por camada/categoria,
 * horário silencioso, max insights/dia, botões de regenerar/histórico.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronDown, ChevronUp, RefreshCw, Bell } from 'lucide-react-native';
import { colors } from '../../../constants/colors';
import { rs, fs } from '../../../hooks/useResponsive';
import { useToast } from '../../../components/Toast';
import { useProactiveSettings, useTriggerProactiveCheck } from '../../../hooks/useProactiveSettings';
import type { LayerCategoryToggles } from '../../../types/insights';

type LayerNum = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const LAYER_DESCRIPTIONS: Record<LayerNum, { titleKey: string; descKey: string }> = {
  1: { titleKey: 'insights.settings.layer1.title', descKey: 'insights.settings.layer1.description' },
  2: { titleKey: 'insights.settings.layer2.title', descKey: 'insights.settings.layer2.description' },
  3: { titleKey: 'insights.settings.layer3.title', descKey: 'insights.settings.layer3.description' },
  4: { titleKey: 'insights.settings.layer4.title', descKey: 'insights.settings.layer4.description' },
  5: { titleKey: 'insights.settings.layer5.title', descKey: 'insights.settings.layer5.description' },
  6: { titleKey: 'insights.settings.layer6.title', descKey: 'insights.settings.layer6.description' },
  7: { titleKey: 'insights.settings.layer7.title', descKey: 'insights.settings.layer7.description' },
  8: { titleKey: 'insights.settings.layer8.title', descKey: 'insights.settings.layer8.description' },
};

const LAYER_DEFAULTS: Record<LayerNum, { title: string; desc: string; categoriesKey: string }> = {
  1: { title: 'Lembretes deduzidos', desc: 'Vacina, vermífugo, banho, aniversário, medicação acabando.', categoriesKey: 'layer1_categories' },
  2: { title: 'Padrões e anomalias', desc: 'Mudanças no apetite, peso, humor, coceira recorrente, silêncio incomum.', categoriesKey: 'layer2_categories' },
  3: { title: 'Contexto: clima e atividade', desc: 'Calor extremo, frio, tempestade, qualidade do ar, dias sem passeio.', categoriesKey: 'layer3_categories' },
  4: { title: 'Insights de longo prazo', desc: 'Sazonalidade, correlações alimentares, resumos mensal e anual.', categoriesKey: 'layer4_categories' },
  5: { title: 'Coach pessoal', desc: 'Sugestões de cuidado por raça, fase de vida e condições crônicas. Mensal.', categoriesKey: 'layer5_categories' },
  6: { title: 'Família multi-pet', desc: 'Comparações entre pets do mesmo tutor e coordenação entre co-tutores. Semanal.', categoriesKey: 'layer6_categories' },
  7: { title: 'Operação do dia a dia', desc: 'Receita acabando, retorno em consulta, viagem se aproximando, vacina pendente.', categoriesKey: 'layer7_categories' },
  8: { title: 'Companhia emocional', desc: 'Marcos afetivos, manejo de doença crônica, modo luto. Tema sensível, opt-in.', categoriesKey: 'layer8_categories' },
};

const SENSITIVE_LAYER: LayerNum = 8;

export default function ProactiveSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { toast, confirm } = useToast();
  const { settings, isLoading, update, toggleCategory } = useProactiveSettings();
  const trigger = useTriggerProactiveCheck();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  if (isLoading || !settings) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loading}><ActivityIndicator size="large" color={colors.click} /></View>
      </SafeAreaView>
    );
  }

  const toggleLayer = async (layer: LayerNum, val: boolean) => {
    // Camada 8 (companhia emocional) exige confirmação antes de ligar
    if (layer === SENSITIVE_LAYER && val === true) {
      const ok = await confirm({
        text: t('insights.settings.layer8.consent', {
          defaultValue:
            'A camada de companhia emocional inclui temas sensíveis: marcos afetivos, manejo de doença crônica, modo luto. Os avisos são contemplativos e nunca substituem um vet ou apoio profissional. Deseja ativar?',
        }),
        type: 'warning',
        yesLabel: t('insights.settings.layer8.consent_yes', { defaultValue: 'Ativar' }),
        noLabel: t('common.cancel', { defaultValue: 'Cancelar' }),
      });
      if (!ok) return;
    }
    try {
      await update({ [`layer${layer}_enabled`]: val } as any);
    } catch {
      toast(t('errors.generic', { defaultValue: 'Algo não saiu como esperado.' }), 'error');
    }
  };

  const handleRegenerate = async () => {
    try {
      await trigger.mutateAsync();
      toast(
        t('insights.feed.regenerated', { defaultValue: 'Verificações disparadas. Os novos insights aparecem em alguns segundos.' }),
        'success',
      );
    } catch {
      toast(t('errors.generic', { defaultValue: 'Algo não saiu como esperado.' }), 'error');
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft size={rs(22)} color={colors.click} strokeWidth={1.8} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>
          {t('insights.settings.title', { defaultValue: 'IA Proativa' })}
        </Text>
        <View style={{ width: rs(22) }} />
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={s.introCard}>
          <Bell size={rs(18)} color={colors.click} strokeWidth={1.8} />
          <Text style={s.introText}>
            {t('insights.settings.intro', {
              defaultValue:
                'A IA do auExpert analisa seu pet diariamente em 4 camadas. Você decide o que ela observa e o quanto pode te avisar.',
            })}
          </Text>
        </View>

        {/* 8 camadas */}
        {([1, 2, 3, 4, 5, 6, 7, 8] as const).map((l) => {
          const layerEnabled = (settings as any)[`layer${l}_enabled`];
          const cats = (settings as any)[LAYER_DEFAULTS[l].categoriesKey] as LayerCategoryToggles;
          const isOpen = expanded[l] ?? false;
          return (
            <View key={l} style={s.layerCard}>
              <View style={s.layerHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.layerTitle}>
                    {t(LAYER_DESCRIPTIONS[l].titleKey, { defaultValue: LAYER_DEFAULTS[l].title })}
                  </Text>
                  <Text style={s.layerDesc}>
                    {t(LAYER_DESCRIPTIONS[l].descKey, { defaultValue: LAYER_DEFAULTS[l].desc })}
                  </Text>
                </View>
                <Switch
                  value={layerEnabled}
                  onValueChange={(v) => toggleLayer(l, v)}
                  trackColor={{ false: colors.border, true: colors.click + '88' }}
                  thumbColor={layerEnabled ? colors.click : colors.textGhost}
                />
              </View>

              {layerEnabled && Object.keys(cats).length > 0 ? (
                <>
                  <TouchableOpacity
                    style={s.expandBtn}
                    onPress={() => setExpanded((prev) => ({ ...prev, [l]: !isOpen }))}
                    activeOpacity={0.7}
                  >
                    <Text style={s.expandText}>
                      {isOpen
                        ? t('insights.settings.collapse', { defaultValue: 'Recolher categorias' })
                        : t('insights.settings.expand', { defaultValue: 'Ajustar categorias' })}
                    </Text>
                    {isOpen
                      ? <ChevronUp size={rs(14)} color={colors.click} strokeWidth={2} />
                      : <ChevronDown size={rs(14)} color={colors.click} strokeWidth={2} />}
                  </TouchableOpacity>

                  {isOpen ? (
                    <View style={s.catsList}>
                      {Object.keys(cats).map((key) => {
                        const isOn = cats[key] !== false;
                        return (
                          <TouchableOpacity
                            key={key}
                            style={s.catRow}
                            onPress={() => toggleCategory(l, key)}
                            activeOpacity={0.7}
                          >
                            <Text style={s.catLabel}>
                              {t(`insights.subcategory.${key}`, { defaultValue: key.replace(/_/g, ' ') })}
                            </Text>
                            <Switch
                              value={isOn}
                              onValueChange={() => toggleCategory(l, key)}
                              trackColor={{ false: colors.border, true: colors.click + '60' }}
                              thumbColor={isOn ? colors.click : colors.textGhost}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ) : null}
                </>
              ) : null}
            </View>
          );
        })}

        {/* Limites */}
        <View style={s.actionCard}>
          <Text style={s.sectionLabel}>
            {t('insights.settings.max_per_day', { defaultValue: 'Máximo de avisos por dia' })}
          </Text>
          <View style={s.maxRow}>
            {[1, 3, 5, 10].map((n) => {
              const active = settings.max_insights_per_day === n;
              return (
                <TouchableOpacity
                  key={n}
                  style={[s.maxChip, active && s.maxChipActive]}
                  onPress={() => update({ max_insights_per_day: n })}
                  activeOpacity={0.7}
                >
                  <Text style={[s.maxChipText, active && s.maxChipTextActive]}>{n}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Botões de ação */}
        <TouchableOpacity
          style={s.regenBtn}
          onPress={handleRegenerate}
          disabled={trigger.isPending}
          activeOpacity={0.85}
        >
          {trigger.isPending
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <RefreshCw size={rs(16)} color="#FFFFFF" strokeWidth={2} />}
          <Text style={s.regenText}>
            {t('insights.settings.regenerate_now', { defaultValue: 'Verificar agora' })}
          </Text>
        </TouchableOpacity>

        <Text style={s.footer}>
          {t('insights.settings.footer', {
            defaultValue:
              'Análises rodam automaticamente em horários distribuídos ao longo do dia. Você pode forçar uma verificação imediata pelo botão acima.',
          })}
        </Text>

        <View style={{ height: rs(40) }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: rs(16),
    paddingVertical: rs(10),
  },
  headerTitle: { color: colors.text, fontSize: fs(15), fontWeight: '700' },
  content: { padding: rs(16) },
  introCard: {
    flexDirection: 'row',
    gap: rs(10),
    backgroundColor: colors.click + '10',
    borderColor: colors.click + '30',
    borderWidth: 1,
    borderRadius: rs(12),
    padding: rs(14),
    marginBottom: rs(20),
  },
  introText: {
    flex: 1,
    fontSize: fs(12),
    color: colors.text,
    lineHeight: fs(18),
  },
  layerCard: {
    backgroundColor: colors.card,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: colors.border,
    padding: rs(14),
    marginBottom: rs(12),
  },
  layerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: rs(12),
  },
  layerTitle: {
    fontSize: fs(14),
    color: colors.text,
    fontWeight: '700',
    marginBottom: rs(4),
  },
  layerDesc: {
    fontSize: fs(12),
    color: colors.textDim,
    lineHeight: fs(17),
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: rs(12),
    paddingTop: rs(10),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  expandText: { fontSize: fs(11), color: colors.click, fontWeight: '700' },
  catsList: { marginTop: rs(8), gap: rs(2) },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: rs(8),
  },
  catLabel: {
    fontSize: fs(12),
    color: colors.textSec,
    flex: 1,
    textTransform: 'capitalize',
  },
  actionCard: {
    backgroundColor: colors.card,
    borderRadius: rs(14),
    borderWidth: 1,
    borderColor: colors.border,
    padding: rs(14),
    marginTop: rs(8),
    marginBottom: rs(12),
  },
  sectionLabel: {
    fontSize: fs(11),
    color: colors.textDim,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: rs(10),
  },
  maxRow: {
    flexDirection: 'row',
    gap: rs(10),
  },
  maxChip: {
    flex: 1,
    paddingVertical: rs(10),
    borderRadius: rs(10),
    backgroundColor: colors.bgCard ?? colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  maxChipActive: { backgroundColor: colors.click, borderColor: colors.click },
  maxChipText: { fontSize: fs(14), color: colors.textSec, fontWeight: '700' },
  maxChipTextActive: { color: '#FFFFFF' },
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: rs(8),
    backgroundColor: colors.click,
    paddingVertical: rs(14),
    borderRadius: rs(12),
    marginTop: rs(8),
  },
  regenText: { color: '#FFFFFF', fontSize: fs(14), fontWeight: '700' },
  footer: {
    fontSize: fs(11),
    color: colors.textDim,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: rs(16),
    lineHeight: fs(16),
  },
});
