import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Eye, EyeOff, Mic } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';

interface InputProps {
  label?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  type?: 'text' | 'password' | 'email';
  showMic?: boolean;
  onMicPress?: () => void;
  multiline?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  icon,
  value,
  onChangeText,
  error,
  type = 'text',
  showMic = true,
  onMicPress,
  multiline = false,
}) => {
  const [focused, setFocused] = useState(false);
  const [secureVisible, setSecureVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrap,
          focused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        {icon && <View style={styles.iconPrefix}>{icon}</View>}
        <TextInput
          style={[styles.input, multiline && styles.multiline]}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={isPassword && !secureVisible}
          keyboardType={type === 'email' ? 'email-address' : 'default'}
          autoCapitalize={type === 'email' ? 'none' : 'sentences'}
          multiline={multiline}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setSecureVisible(!secureVisible)}
            style={styles.iconSuffix}
          >
            {secureVisible ? (
              <EyeOff size={20} color={colors.textDim} strokeWidth={1.8} />
            ) : (
              <Eye size={20} color={colors.textDim} strokeWidth={1.8} />
            )}
          </TouchableOpacity>
        )}
        {!isPassword && showMic && (
          <TouchableOpacity onPress={onMicPress} style={styles.iconSuffix}>
            <Mic size={20} color={colors.accent} strokeWidth={1.8} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 12,
    color: colors.textSec,
    marginBottom: spacing.xs,
    letterSpacing: 0.3,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.xl,
    height: 56,
    paddingHorizontal: spacing.md,
  },
  inputFocused: {
    borderColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  inputError: {
    borderColor: colors.danger,
  },
  iconPrefix: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: 'Sora_400Regular',
    fontSize: 15,
    color: colors.text,
    height: '100%',
  },
  multiline: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: spacing.sm,
  },
  iconSuffix: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  errorText: {
    fontFamily: 'Sora_400Regular',
    fontSize: 11,
    color: colors.danger,
    marginTop: spacing.xs,
  },
});
