/**
 * components/insights/MedicalDisclaimer.tsx
 *
 * Disclaimer médico-legal permanente. Aparece em qualquer insight de saúde
 * (categoria 'saude', 'vacina') e em telas de detalhe.
 *
 * Texto pt-BR canonizado. Outros idiomas via i18n quando revisor humano aprovar.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Info } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/colors';
import { rs, fs } from '../../hooks/useResponsive';

export function MedicalDisclaimer({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.box, compact && styles.boxCompact]}>
      <Info size={rs(compact ? 12 : 14)} color={colors.textDim} strokeWidth={1.8} />
      <Text style={[styles.text, compact && styles.textCompact]}>
        {t('insights.disclaimer.not_diagnosis', {
          defaultValue:
            'Esta análise não substitui avaliação veterinária. Em caso de dúvida ou sintoma persistente, consulte um veterinário.',
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: rs(8),
    backgroundColor: colors.bgCard ?? colors.card,
    borderRadius: rs(10),
    padding: rs(10),
    marginVertical: rs(8),
    borderWidth: 1,
    borderColor: colors.border,
  },
  boxCompact: {
    padding: rs(8),
  },
  text: {
    flex: 1,
    fontSize: fs(11),
    color: colors.textDim,
    lineHeight: fs(16),
    fontStyle: 'italic',
  },
  textCompact: {
    fontSize: fs(10),
    lineHeight: fs(14),
  },
});
