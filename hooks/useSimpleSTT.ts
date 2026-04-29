/**
 * hooks/useSimpleSTT.ts
 *
 * Speech-to-text leve para campos de texto simples (chat de suporte, busca,
 * formulários curtos). Para STT do diário com captura contínua + previews,
 * use `components/diary/new/stt.ts` (mais completo).
 *
 * Filosofia:
 *   - 1 callback `onTranscript(text, isFinal)` — o caller decide se appenda
 *     ou substitui no input
 *   - Reusa permissões e setAudioModeAsync de forma defensiva
 *   - Auto-restart quando o reconhecedor encerra durante listening
 *   - Nunca lança — falhas viram toast/log no caller
 *
 * Uso típico:
 *   const { isListening, toggle } = useSimpleSTT({
 *     onTranscript: (text, isFinal) => { if (isFinal) setInput(prev => prev + ' ' + text) },
 *     onError: (msg) => toast(msg, 'warning'),
 *   });
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { setAudioModeAsync } from 'expo-audio';
import { getLocales } from 'expo-localization';
import i18n from '../i18n';

/** Helper local — devolve string traduzida pra mensagens de erro do mic.
 *  Usa `i18n.t` direto (nao precisa de hook) porque essas mensagens vao via
 *  callback `onError` pra um toast no caller. */
const tt = (k: string): string => i18n.t(k) as string;

// Lazy-load do módulo nativo — falha silenciosa se ausente
let SpeechModule: typeof import('expo-speech-recognition').ExpoSpeechRecognitionModule | null = null;
let useSpeechEvent: typeof import('expo-speech-recognition').useSpeechRecognitionEvent | null = null;
try {
  const sr = require('expo-speech-recognition');
  SpeechModule   = sr.ExpoSpeechRecognitionModule;
  useSpeechEvent = sr.useSpeechRecognitionEvent;
} catch (e) {
  console.warn('[useSimpleSTT] expo-speech-recognition load failed:', e);
}

interface Params {
  /** Chamado a cada transcrição parcial e final do reconhecedor. */
  onTranscript: (text: string, isFinal: boolean) => void;
  /** Mensagem amigável de erro pra exibir ao tutor (mic indisponível, sem permissão, etc.). */
  onError?: (message: string) => void;
  /** Locale forçado. Default = primeiro locale do dispositivo (ex: 'pt-BR'). */
  lang?: string;
}

interface Result {
  /** Reconhecedor está ativamente ouvindo? */
  isListening: boolean;
  /** Mic está disponível neste dispositivo (módulo nativo carregou). */
  isAvailable: boolean;
  /** Liga/desliga o reconhecedor. */
  toggle: () => Promise<void>;
  /** Para forçadamente (cleanup, navegar de tela, etc.). */
  stop: () => void;
}

export function useSimpleSTT({ onTranscript, onError, lang }: Params): Result {
  const [isListening, setIsListening] = useState(false);
  const intentionalStopRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  // Mantém refs atualizadas pra os event handlers não capturarem closures stale
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const noopHook = (_event: string, _cb: (event: never) => void) => {};
  const useEvent = useSpeechEvent ?? noopHook;

  useEvent('result', (event: { results: { transcript: string }[]; isFinal: boolean }) => {
    const text = event.results[0]?.transcript ?? '';
    if (text) onTranscriptRef.current(text, event.isFinal);
  });

  useEvent('end', () => {
    // Auto-restart se o reconhecedor parou sem o user pedir
    if (!intentionalStopRef.current && SpeechModule) {
      try {
        SpeechModule.start({
          lang: lang ?? getLocales()[0]?.languageTag ?? 'pt-BR',
          interimResults: true,
          maxAlternatives: 1,
          continuous: true,
        });
        return;
      } catch { /* fallthrough — desliga abaixo */ }
    }
    setIsListening(false);
  });

  useEvent('error', (event: { error: string }) => {
    if (event.error === 'no-speech') return;  // benigno
    const fatal = ['permission', 'not-allowed', 'service-not-available'];
    if (fatal.includes(event.error)) {
      intentionalStopRef.current = true;
      setIsListening(false);
      onErrorRef.current?.(tt('mic.errMicUnavailable'));
    }
    // Erros não-fatais: o handler 'end' restarta automaticamente
  });

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      intentionalStopRef.current = true;
      try { SpeechModule?.stop(); } catch { /* ignore */ }
    };
  }, []);

  const start = useCallback(async () => {
    if (!SpeechModule) {
      console.warn('[useSimpleSTT] SpeechModule null — pacote expo-speech-recognition não carregou');
      onErrorRef.current?.(tt('mic.errSpeechNotAvailable'));
      return;
    }
    try {
      const { granted } = await SpeechModule.requestPermissionsAsync();
      if (!granted) {
        onErrorRef.current?.(tt('mic.errMicDenied'));
        return;
      }
    } catch {
      onErrorRef.current?.(tt('mic.errMicPermissionFailed'));
      return;
    }

    intentionalStopRef.current = false;
    setIsListening(true);

    // Áudio em modo gravação (best-effort — alguns emuladores não suportam)
    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
        shouldRouteThroughEarpiece: false,
        shouldPlayInBackground: false,
      });
    } catch { /* não-fatal */ }

    try {
      SpeechModule.start({
        lang: lang ?? getLocales()[0]?.languageTag ?? 'pt-BR',
        interimResults: true,
        maxAlternatives: 1,
        continuous: true,
      });
    } catch (e) {
      setIsListening(false);
      console.warn('[useSimpleSTT] start failed:', e);
      onErrorRef.current?.(tt('mic.errMicStartFailed'));
    }
  }, [lang]);

  const stop = useCallback(() => {
    intentionalStopRef.current = true;
    try { SpeechModule?.stop(); } catch { /* ignore */ }
    setIsListening(false);
    try {
      if (typeof setAudioModeAsync === 'function') {
        setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: false,
          interruptionMode: 'duckOthers',
          shouldRouteThroughEarpiece: false,
          shouldPlayInBackground: false,
        }).catch(() => { /* ignore */ });
      }
    } catch { /* ignore */ }
  }, []);

  const toggle = useCallback(async () => {
    if (isListening) stop();
    else await start();
  }, [isListening, start, stop]);

  return {
    isListening,
    isAvailable: SpeechModule !== null,
    toggle,
    stop,
  };
}
