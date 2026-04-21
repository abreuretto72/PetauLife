import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Handshake } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/colors';
import { rs, fs } from '../../hooks/useResponsive';

export default function PartnershipsScreen() {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Handshake size={rs(56)} color={colors.accent} strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>{t('partnerships.title')}</Text>
        <Text style={styles.subtitle}>{t('partnerships.comingSoon')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(32),
    gap: rs(16),
  },
  iconWrapper: {
    width: rs(100),
    height: rs(100),
    borderRadius: rs(28),
    backgroundColor: colors.accentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: rs(8),
  },
  title: {
    fontFamily: 'Sora_700Bold',
    fontSize: fs(22),
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: fs(14),
    color: colors.textDim,
    textAlign: 'center',
    lineHeight: fs(22),
  },
});
