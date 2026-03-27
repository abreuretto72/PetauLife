import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';

type AlertVariant = 'success' | 'danger' | 'warning' | 'info';

interface AlertProps {
  variant: AlertVariant;
  message: string;
  icon?: React.ReactNode;
}

const variantConfig: Record<AlertVariant, { bg: string; border: string; text: string; Icon: typeof CheckCircle }> = {
  success: { bg: colors.successSoft, border: colors.success, text: colors.success, Icon: CheckCircle },
  danger: { bg: colors.dangerSoft, border: colors.danger, text: colors.danger, Icon: AlertCircle },
  warning: { bg: colors.warningSoft, border: colors.warning, text: colors.warning, Icon: AlertTriangle },
  info: { bg: colors.petrolSoft, border: colors.petrol, text: colors.petrol, Icon: Info },
};

export const Alert: React.FC<AlertProps> = ({ variant, message, icon }) => {
  const config = variantConfig[variant];
  const IconComponent = config.Icon;

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }]}>
      {icon ?? <IconComponent size={18} color={config.text} strokeWidth={1.8} />}
      <Text style={[styles.message, { color: config.text }]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  message: {
    flex: 1,
    fontFamily: 'Sora_400Regular',
    fontSize: 13,
  },
});
