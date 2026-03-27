import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowRight, ChevronLeft, Mail } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/colors';
import { radii, spacing } from '../../constants/spacing';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import * as auth from '../../lib/auth';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email.includes('@')) {
      setError('Email inválido');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { error: err } = await auth.resetPassword(email);
      if (err) throw err;
      setSent(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <ChevronLeft size={18} color={colors.accent} strokeWidth={1.8} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t('auth.resetPassword')}</Text>
            <Text style={styles.subtitle}>
              Enviaremos um link para redefinir sua senha
            </Text>
          </View>
        </View>

        {sent ? (
          <View style={styles.successSection}>
            <Alert
              variant="success"
              message={`Link enviado para ${email}. Verifique sua caixa de entrada.`}
            />
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backToLogin}
            >
              <Text style={styles.backToLoginText}>
                {t('auth.login')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Input
              label={t('auth.email')}
              placeholder="seu@email.com"
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); }}
              type="email"
              error={error}
              icon={<Mail size={20} color={colors.petrol} strokeWidth={1.8} />}
            />

            <TouchableOpacity
              onPress={handleReset}
              disabled={loading}
              activeOpacity={0.8}
              style={styles.btnWrap}
            >
              <LinearGradient
                colors={[colors.accent, colors.accentDark]}
                style={styles.btn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.btnText}>
                      {t('auth.sendResetLink')}
                    </Text>
                    <ArrowRight size={18} color="#fff" strokeWidth={2} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.cancelRow}
            >
              <Text style={styles.cancelText}>{t('common.back')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 18,
    paddingBottom: 32,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontFamily: 'Sora_700Bold',
    fontSize: 22,
    color: colors.text,
  },
  subtitle: {
    fontFamily: 'Sora_400Regular',
    fontSize: 12,
    color: colors.textDim,
    marginTop: 3,
  },
  successSection: {
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  backToLogin: {
    alignSelf: 'center',
    marginTop: spacing.md,
  },
  backToLoginText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    color: colors.accent,
  },
  btnWrap: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 6,
    marginTop: spacing.sm,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: radii.xl,
  },
  btnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 16,
    color: '#fff',
  },
  cancelRow: {
    alignSelf: 'center',
    marginTop: 20,
  },
  cancelText: {
    fontFamily: 'Sora_600SemiBold',
    fontSize: 13,
    color: colors.textDim,
  },
});
