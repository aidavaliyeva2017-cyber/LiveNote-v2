import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login, resendConfirmation } = useAuth();
  // navigation type already includes ForgotPassword via AuthStackParamList
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  // Special state: user exists but email not confirmed yet
  const [notConfirmed, setNotConfirmed] = useState(false);
  const [resending, setResending]     = useState(false);
  const [resendOk, setResendOk]       = useState(false);

  const handleLogin = async () => {
    setError('');
    setNotConfirmed(false);
    setResendOk(false);
    if (!email.trim() || !password) {
      setError('Bitte E-Mail und Passwort eingeben.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (e: any) {
      const msg: string = e?.message ?? '';
      if (isNotConfirmedError(msg)) {
        setNotConfirmed(true);
      } else {
        setError(friendlyError(msg));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendOk(false);
    try {
      await resendConfirmation(email.trim().toLowerCase());
      setResendOk(true);
    } catch {
      setError('Mail konnte nicht gesendet werden. Versuche es später.');
    } finally {
      setResending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.title}>Willkommen zurück</Text>
        <Text style={styles.subtitle}>Melde dich mit deiner E-Mail an</Text>

        {/* Generic error */}
        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Email not confirmed — show resend option */}
        {notConfirmed ? (
          <View style={styles.confirmBox}>
            <Ionicons name="mail-outline" size={18} color={colors.accentYellow} />
            <View style={styles.confirmBoxText}>
              <Text style={styles.confirmBoxTitle}>E-Mail noch nicht bestätigt</Text>
              <Text style={styles.confirmBoxBody}>
                Klicke auf den Link in deiner Bestätigungsmail oder fordere eine neue an.
              </Text>
              {resendOk ? (
                <Text style={styles.confirmBoxSent}>✓ Neue Mail gesendet!</Text>
              ) : (
                <TouchableOpacity
                  style={styles.resendBtn}
                  onPress={handleResend}
                  disabled={resending}
                >
                  {resending
                    ? <ActivityIndicator size="small" color={colors.primary} />
                    : <Text style={styles.resendBtnText}>Erneut senden</Text>
                  }
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : null}

        <Input
          label="E-Mail"
          value={email}
          onChangeText={t => { setEmail(t); setNotConfirmed(false); setError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <View style={styles.passwordWrap}>
          <Input
            label="Passwort"
            value={password}
            onChangeText={t => { setPassword(t); setError(''); }}
            secureTextEntry={!showPassword}
            autoComplete="password"
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(v => !v)}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <Button label="Anmelden" onPress={handleLogin} loading={loading} />

        <TouchableOpacity
          style={styles.forgotBtn}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotText}>Passwort vergessen?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.switchText}>
            Noch kein Konto?{' '}
            <Text style={{ color: colors.primary }}>Registrieren</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const isNotConfirmedError = (msg: string) =>
  msg.includes('Email not confirmed') || msg.includes('email_not_confirmed');

function friendlyError(msg: string): string {
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials'))
    return 'E-Mail oder Passwort ist falsch.';
  if (msg.includes('Too many requests'))
    return 'Zu viele Versuche. Bitte warte kurz.';
  if (msg.includes('Network request failed') || msg.includes('fetch'))
    return 'Keine Internetverbindung.';
  return msg || 'Ein Fehler ist aufgetreten.';
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  back: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.h2,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.error + '18',
    borderRadius: borderRadius.medium,
    padding: spacing.md, marginBottom: spacing.md,
  },
  errorText: { flex: 1, fontSize: typography.caption, color: colors.error },

  confirmBox: {
    flexDirection: 'row', gap: spacing.sm,
    backgroundColor: colors.accentYellow + '18',
    borderRadius: borderRadius.medium,
    padding: spacing.md, marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  confirmBoxText: { flex: 1, gap: 4 },
  confirmBoxTitle: {
    fontSize: typography.caption,
    fontWeight: typography.semibold as any,
    color: colors.accentYellow,
  },
  confirmBoxBody: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  confirmBoxSent: {
    fontSize: typography.caption,
    color: colors.success,
    marginTop: 4,
  },
  resendBtn: { marginTop: 4 },
  resendBtnText: {
    fontSize: typography.caption,
    color: colors.primary,
    fontWeight: typography.medium as any,
  },

  passwordWrap: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: spacing.md, top: 38 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: spacing.sm },
  forgotText: { fontSize: typography.caption, color: colors.primary },
  switchText: {
    marginTop: spacing.lg, textAlign: 'center',
    color: colors.textSecondary, fontSize: typography.body,
  },
});
