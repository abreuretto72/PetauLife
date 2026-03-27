import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import PetauLogo from '../../components/PetauLogo';

export default function HubScreen() {
  return (
    <View style={styles.container}>
      <PetauLogo size="normal" />
      <Text style={styles.title}>Meus Pets</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  title: {
    fontFamily: 'Sora_700Bold',
    fontSize: 24,
    color: colors.text,
    marginTop: 24,
  },
});
