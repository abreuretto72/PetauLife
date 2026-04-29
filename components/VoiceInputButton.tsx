/**
 * components/VoiceInputButton.tsx
 *
 * Botao de microfone reutilizavel — encapsula `useSimpleSTT` (que ja cobre
 * permissao, gravacao, STT e fallback). Tres estados visuais: idle, listening
 * e processing. Emite `onTranscript(text, isFinal)` para o caller.
 *
 * Uso tipico em fluxos voz-first (ex: criacao de viagem):
 *   <VoiceInputButton size="large" onTranscript={(t, f) => f && handle(t)} />
 *
 * Acessibilidade: `accessibilityLabel` traduzido. Contraste WCAG AA na cor
 * ametista.
 */
import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Mic, MicOff } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../constants/colors';
import { rs, fs } from '../hooks/useResponsive';
import { useSimpleSTT } from '../hooks/useSimpleSTT';

export interface VoiceInputButtonProps {
  /** Chamado a cada transcricao parcial e final do reconhecedor. */
  onTranscript: (text: string, isFinal: boolean) => void;
  /** Chamado em erros do mic. Caller pode passar `toast`. */
  onError?: (message: string) => void;
  /** Tamanho visual: small pra inputs inline, large pra fluxos full-screen. */
  size?: 'small' | 'large';
  /** Locale forcado (default = device). */
  lang?: string;
  /** Hint text mostrado abaixo do botao quando idle. */
  hintKey?: string;
  /** Disabled externo (ex: enquanto processa request anterior). */
  disabled?: boolean;
}

export function VoiceInputButton({
  onTranscript, onError, size = 'large', lang, hintKey, disabled,
}: VoiceInputButtonProps) {
  const { t } = useTranslation();
  const { isListening, isAvailable, toggle } = useSimpleSTT({
    onTranscript, onError, lang,
  });

  const dim = size === 'large' ? rs(96) : rs(56);
  const iconSize = size === 'large' ? rs(40) : rs(24);

  return (
    <View style={s.wrap}>
      <TouchableOpacity
        onPress={() => { if (!disabled) toggle(); }}
        disabled={disabled || !isAvailable}
        style={[
          s.btn,
          { width: dim, height: dim, borderRadius: dim / 2 },
          isListening && s.btnActive,
          (disabled || !isAvailable) && s.btnDisabled,
        ]}
        activeOpacity={0.8}
        accessibilityLabel={
          isListening
            ? t('agentVoiceInput.stopListening')
            : t('agentVoiceInput.startListening')
        }
      >
        {disabled ? (
          <ActivityIndicator size={iconSize} color="#FFFFFF" />
        ) : !isAvailable ? (
          <MicOff size={iconSize} color={colors.textDim} strokeWidth={2} />
        ) : (
          <Mic size={iconSize} color="#FFFFFF" strokeWidth={2} />
        )}
      </TouchableOpacity>
      {hintKey && !isListening ? (
        <Text style={s.hint}>{t(hintKey)}</Text>
      ) : null}
      {isListening ? (
        <Text style={[s.hint, s.hintActive]}>
          {t('agentVoiceInput.listening')}
        </Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', gap: rs(10) },
  btn: {
    backgroundColor: colors.click,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.click,
    shadowOffset: { width: 0, height: rs(8) },
    shadowOpacity: 0.35,
    shadowRadius: rs(20),
    elevation: 6,
  },
  btnActive: {
    backgroundColor: colors.danger,
    shadowColor: colors.danger,
  },
  btnDisabled: {
    backgroundColor: colors.bgDeep,
    shadowOpacity: 0,
  },
  hint: {
    color: colors.textSec,
    fontSize: fs(12),
    textAlign: 'center',
    paddingHorizontal: rs(12),
  },
  hintActive: {
    color: colors.danger,
    fontWeight: '600',
  },
});
