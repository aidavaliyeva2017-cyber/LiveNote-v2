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

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC<Props> = ({ navigation }) => {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [sent, setSent]     = useState(false);

  const handleSend = async () => {
    setError('');
    if (!email.trim()) { setError('Bitte gib deine E-Mail ein.'); return; }

    setLoading(true);
    try {
      await sendPasswordReset(email.trim().toLowerCase());
      setSent(true);
    } catch (e: any) {
      // Supabase returns success even for unknown emails (security), so errors here are real
      setError(e?.message ?? 'Fehler beim Senden. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.doneContainer}>
        <View style={styles.doneIcon}>
          <Ionicons name="mail-outline" size={40} color={colors.primary} />
        </View>
        <Text style={styles.doneTitle}>E-Mail gesendet</Text>
        <Text style={styles.doneBody}>
          Falls ein Konto mit{'\n'}
          <Text style={styles.doneEmail}>{email.trim().toLowerCase()}</Text>
          {'\n'}existiert, erhältst du eine E-Mail mit einem Link um dein Passwort zurückzusetzen.
        </Text>
        <Text style={styles.doneHint}>
          Klicke auf den Link in der Mail — die App öffnet sich automatisch.
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.backToLogin}>
            Zurück zum <Text style={{ color: colors.primary }}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

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

        <Text style={styles.title}>Passwort zurücksetzen</Text>
        <Text style={styles.subtitle}>
          Gib deine E-Mail ein. Wir schicken dir einen Link um dein Passwort zu ändern.
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Input
          label="E-Mail"
          value={email}
          onChangeText={t => { setEmail(t); setError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <Button label="Reset-Link senden" onPress={handleSend} loading={loading} />

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Abbrechen</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

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
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.error + '18',
    borderRadius: borderRadius.medium,
    padding: spacing.md, marginBottom: spacing.md,
  },
  errorText: { flex: 1, fontSize: typography.caption, color: colors.error },
  cancelText: {
    marginTop: spacing.lg, textAlign: 'center',
    color: colors.textSecondary, fontSize: typography.body,
  },

  // ── Done state ───────────────────────────────────────────────────────────
  doneContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.xl, gap: spacing.md,
  },
  doneIcon: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  doneTitle: {
    fontSize: typography.h2,
    fontWeight: typography.bold as any,
    color: colors.textPrimary, textAlign: 'center',
  },
  doneBody: {
    fontSize: typography.body, color: colors.textSecondary,
    textAlign: 'center', lineHeight: 24,
  },
  doneEmail: {
    color: colors.textPrimary,
    fontWeight: typography.semibold as any,
  },
  doneHint: {
    fontSize: typography.caption, color: colors.textTertiary,
    textAlign: 'center', lineHeight: 20,
  },
  backToLogin: {
    marginTop: spacing.sm, textAlign: 'center',
    color: colors.textSecondary, fontSize: typography.body,
  },
});
