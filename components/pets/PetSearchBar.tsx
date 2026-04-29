import React, { useCallback } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Search, X, Mic, MicOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/colors';
import { rs } from '../../hooks/useResponsive';
import { useSimpleSTT } from '../../hooks/useSimpleSTT';
import { useToast } from '../Toast';

interface PetSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  style?: ViewStyle;
}

const PetSearchBar: React.FC<PetSearchBarProps> = ({ value, onChangeText, style }) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();

  const handleClear = useCallback(() => {
    onChangeText('');
  }, [onChangeText]);

  // Mic: ditar a busca por voz. Cada transcricao final substitui o texto.
  const stt = useSimpleSTT({
    lang: i18n.language,
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim().length > 0) {
        onChangeText(text.trim());
      }
    },
    onError: (msg) => toast(msg, 'warning'),
  });

  return (
    <View style={[styles.container, style]}>
      <Search
        size={rs(16)}
        color={colors.textDim}
        strokeWidth={1.8}
        style={styles.searchIcon}
      />

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={t('pets.searchPlaceholder')}
        placeholderTextColor={colors.placeholder}
        autoCorrect={false}
        returnKeyType="search"
        autoCapitalize="none"
        selectionColor={colors.click}
      />

      {value.length > 0 ? (
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <X size={rs(16)} color={colors.click} strokeWidth={2} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={stt.toggle}
          disabled={!stt.isAvailable}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
          accessibilityLabel={
            stt.isListening
              ? t('agentVoiceInput.stopListening', { defaultValue: 'Parar ditado' })
              : t('agentVoiceInput.startListening', { defaultValue: 'Ditar busca por voz' })
          }
        >
          {!stt.isAvailable ? (
            <MicOff size={rs(16)} color={colors.textDim} strokeWidth={1.8} />
          ) : stt.isListening ? (
            <Mic size={rs(16)} color={colors.danger} strokeWidth={2.2} />
          ) : (
            <Mic size={rs(16)} color={colors.click} strokeWidth={1.8} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: rs(10),
    height: rs(44),
    paddingHorizontal: rs(12),
    gap: rs(8),
  },
  searchIcon: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontFamily: 'Sora_400Regular',
    fontSize: rs(14),
    color: colors.text,
    paddingVertical: 0,
  },
});

export default PetSearchBar;
