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
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';

// Rendered directly by RootNavigator when pendingPasswordReset === true.
// No navigation props needed — clearing pendingPasswordReset switches the view.
export const ResetPasswordScreen: React.FC = () => {
  const { updatePassword, logout } = useAuth();
  const [password, setPassword]         = useState('');
  const [confirm, setConfirm]           = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const handleUpdate = async () => {
    setError('');
    if (password.length < 6) { setError('Das Passwort muss mindestens 6 Zeichen haben.'); return; }
    if (password !== confirm)  { setError('Die Passwörter stimmen nicht überein.'); return; }

    setLoading(true);
    try {
      await updatePassword(password);
      // updatePassword sets pendingPasswordReset = false → RootNavigator shows main app
    } catch (e: any) {
      setError(e?.message ?? 'Fehler beim Speichern des Passworts.');
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
        <View style={styles.iconWrap}>
          <Ionicons name="lock-open-outline" size={40} color={colors.primary} />
        </View>

        <Text style={styles.title}>Neues Passwort</Text>
        <Text style={styles.subtitle}>Wähle ein neues Passwort für deinen Account.</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.passwordWrap}>
          <Input
            label="Neues Passwort"
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
              size={20} color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <Input
          label="Passwort bestätigen"
          value={confirm}
          onChangeText={t => { setConfirm(t); setError(''); }}
          secureTextEntry={!showPassword}
          autoComplete="new-password"
        />

        <Button label="Passwort speichern" onPress={handleUpdate} loading={loading} />

        <TouchableOpacity onPress={logout}>
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
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl,
  },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.h2,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
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
  passwordWrap: { position: 'relative' },
  eyeBtn: { position: 'absolute', right: spacing.md, top: 38 },
  cancelText: {
    marginTop: spacing.lg, textAlign: 'center',
    color: colors.textSecondary, fontSize: typography.body,
  },
});
