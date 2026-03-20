import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register } = useAuth();
  const [name, setName]                 = useState('');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirm]   = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const [info, setInfo]                 = useState('');

  const handleRegister = async () => {
    setError('');
    setInfo('');
    if (!name.trim())                 { setError('Bitte gib deinen Namen ein.'); return; }
    if (!email.trim())                { setError('Bitte gib deine E-Mail ein.'); return; }
    if (password.length < 6)          { setError('Das Passwort muss mindestens 6 Zeichen haben.'); return; }
    if (password !== confirmPassword) { setError('Die Passwörter stimmen nicht überein.'); return; }

    setLoading(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      console.log('[Register] Starting signup for', trimmedEmail);

      const { needsConfirmation, alreadyExists } = await register(
        trimmedEmail,
        password,
        name.trim(),
      );
      console.log('[Register] needsConfirmation:', needsConfirmation, 'alreadyExists:', alreadyExists);

      if (alreadyExists) {
        // User already has an account → send them to Login.
        setError('Diese E-Mail ist bereits registriert. Bitte melde dich an.');
        setTimeout(() => navigation.navigate('Login'), 1500);
        return;
      }

      if (needsConfirmation) {
        setInfo(
          'Registrierung erfolgreich!\n\n' +
          'E-Mail-Bestätigung ist in Supabase noch aktiv. Bitte:\n' +
          '1. Öffne deine Mails und klicke den Bestätigungslink\n' +
          '2. Oder: Supabase Dashboard → Authentication → Providers → Email → "Confirm email" deaktivieren',
        );
        return;
      }

      // needsConfirmation === false && alreadyExists === false
      // → onAuthStateChange has already fired, RootNavigator switches automatically.
    } catch (e: any) {
      const msg: string = e?.message ?? String(e);
      console.error('[Register] Error:', msg);
      setError(friendlyError(msg));
    } finally {
      setLoading(false);
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

        <Text style={styles.title}>Konto erstellen</Text>
        <Text style={styles.subtitle}>Starte jetzt mit LiveNote</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {info ? (
          <View style={styles.infoBox}>
            <Ionicons name="mail-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>{info}</Text>
          </View>
        ) : null}

        <Input
          label="Name"
          value={name}
          onChangeText={t => { setName(t); setError(''); }}
          autoCapitalize="words"
          autoComplete="name"
        />
        <Input
          label="E-Mail"
          value={email}
          onChangeText={t => { setEmail(t); setError(''); }}
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
            autoComplete="new-password"
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

        <Input
          label="Passwort bestätigen"
          value={confirmPassword}
          onChangeText={t => { setConfirm(t); setError(''); }}
          secureTextEntry={!showPassword}
          autoComplete="new-password"
        />

        <Button label="Registrieren" onPress={handleRegister} loading={loading} />

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.switchText}>
            Bereits ein Konto?{' '}
            <Text style={{ color: colors.primary }}>Anmelden</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

function friendlyError(msg: string): string {
  if (msg.includes('User already registered') || msg.includes('already registered'))
    return 'Diese E-Mail ist bereits registriert. Versuche dich anzumelden.';
  if (msg.includes('invalid email') || msg.includes('Invalid email'))
    return 'Bitte gib eine gültige E-Mail-Adresse ein.';
  if (msg.includes('Password should be'))
    return 'Das Passwort muss mindestens 6 Zeichen haben.';
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
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.primary + '18',
    borderRadius: borderRadius.medium,
    padding: spacing.md, marginBottom: spacing.md,
  },
  infoText: { flex: 1, fontSize: typography.caption, color: colors.textSecondary, lineHeight: 20 },
  passwordWrap: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: spacing.md, top: 38 },
  switchText: {
    marginTop: spacing.lg, textAlign: 'center',
    color: colors.textSecondary, fontSize: typography.body,
  },
});
