import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import PetauLogo from '../../components/PetauLogo';

export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <PetauLogo size="large" />
      <Text style={styles.tagline}>Uma inteligência única para o seu pet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  tagline: {
    fontFamily: 'Sora_500Medium',
    fontSize: 14,
    color: 'rgba(232, 237, 242, 0.75)',
    letterSpacing: 0.5,
    marginTop: 18,
  },
});
