import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { radii, spacing } from '../../constants/spacing';

interface BadgeProps {
  label: string;
  color: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ label, color, icon }) => (
  <View style={[styles.badge, { backgroundColor: color + '12' }]}>
    {icon && <View style={styles.icon}>{icon}</View>}
    <Text style={[styles.text, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontFamily: 'Sora_700Bold',
    fontSize: 10,
  },
});
