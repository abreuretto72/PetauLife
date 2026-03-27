import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { spacing } from '../constants/spacing';

interface PasswordMeterProps {
  password: string;
}

const checks = [
  { test: (p: string) => p.length >= 8, label: '8+ chars' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'Maiúscula' },
  { test: (p: string) => /[0-9]/.test(p), label: 'Número' },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: 'Especial' },
];

const barColors = ['', colors.danger, colors.danger, colors.warning, colors.success];
const barLabels = ['', 'Fraca', 'Fraca', 'Média', 'Forte'];

const PasswordMeter: React.FC<PasswordMeterProps> = ({ password }) => {
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
                <Check size={10} color={colors.success} strokeWidth={2.5} />
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
    paddingHorizontal: 2,
  },
  barRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: spacing.sm,
  },
  bar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  checksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checksLeft: {
    flexDirection: 'row',
    gap: 10,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  uncheckedBox: {
    width: 10,
    height: 10,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: colors.textDim,
  },
  checkLabel: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 10,
  },
  scoreLabel: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
  },
});

export default PasswordMeter;
