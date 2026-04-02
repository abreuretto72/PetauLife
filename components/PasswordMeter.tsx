import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';
import { rs, fs } from '../hooks/useResponsive';

interface PasswordMeterProps {
  password: string;
}

const barColors = ['', colors.danger, colors.danger, colors.warning, colors.success];

const PasswordMeter: React.FC<PasswordMeterProps> = ({ password }) => {
  const { t } = useTranslation();

  const checks = [
    { test: (p: string) => p.length >= 8, label: t('auth.pwCheck8chars') },
    { test: (p: string) => /[A-Z]/.test(p), label: t('auth.pwCheckUpper') },
    { test: (p: string) => /[0-9]/.test(p), label: t('auth.pwCheckNumber') },
    { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: t('auth.pwCheckSpecial') },
  ];

  const barLabels = ['', t('auth.pwStrengthWeak'), t('auth.pwStrengthWeak'), t('auth.pwStrengthMedium'), t('auth.pwStrengthStrong')];

  if (!password) return null;

  const results = checks.map((c) => c.test(password));
  const score = results.filter(Boolean).length;

  return (
    <View style={styles.container}>
      <View style={styles.barRow}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.bar,
              { backgroundColor: i <= score ? barColors[score] : colors.border },
            ]}
          />
        ))}
      </View>
      <View style={styles.checksRow}>
        <View style={styles.checksLeft}>
          {checks.map((c, i) => (
            <View key={i} style={styles.checkItem}>
              {results[i] ? (
                <Check size={rs(10)} color={colors.success} strokeWidth={2.5} />
              ) : (
                <View style={styles.uncheckedBox} />
              )}
              <Text
                style={[
                  styles.checkLabel,
                  { color: results[i] ? colors.success : colors.textDim },
                ]}
              >
                {c.label}
              </Text>
            </View>
          ))}
        </View>
        {score > 0 && (
          <Text style={[styles.scoreLabel, { color: barColors[score] }]}>
            {barLabels[score]}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
    paddingHorizontal: rs(2),
  },
  barRow: {
    flexDirection: 'row',
    gap: rs(4),
    marginBottom: spacing.sm,
  },
  bar: {
    flex: 1,
    height: rs(3),
    borderRadius: rs(2),
  },
  checksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checksLeft: {
    flexDirection: 'row',
    gap: rs(10),
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: rs(3),
  },
  uncheckedBox: {
    width: rs(10),
    height: rs(10),
    borderRadius: rs(3),
    borderWidth: 1.5,
    borderColor: colors.textDim,
  },
  checkLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: fs(10),
  },
  scoreLabel: {
    fontFamily: 'Sora_700Bold',
    fontSize: fs(10),
  },
});

export default PasswordMeter;
