import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const GuestUpgradeModal: React.FC<Props> = ({ visible, onClose }) => {
  const { upgradeGuestAccount } = useAuth();
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');

  const reset = () => {
    setName(''); setEmail(''); setPassword(''); setConfirm('');
    setError(''); setLoading(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleUpgrade = async () => {
    setError('');
    if (!name.trim())             { setError('Bitte gib deinen Namen ein.'); return; }
    if (!email.trim())            { setError('Bitte gib deine E-Mail ein.'); return; }
    if (password.length < 6)      { setError('Passwort muss mindestens 6 Zeichen haben.'); return; }
    if (password !== confirm)     { setError('Passwörter stimmen nicht überein.'); return; }

    setLoading(true);
    try {
      await upgradeGuestAccount(email.trim().toLowerCase(), password, name.trim());
      // onAuthStateChange fires → isGuest becomes false → modal unmounts via parent
      handleClose();
    } catch (e: any) {
      setError(friendlyError(e?.message ?? ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Konto erstellen</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Deine bisherigen Daten bleiben erhalten — du bekommst nur eine echte E-Mail-Adresse und ein Passwort.
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Input label="Name" value={name} onChangeText={t => { setName(t); setError(''); }}
            autoCapitalize="words" autoComplete="name" />
          <Input label="E-Mail" value={email} onChangeText={t => { setEmail(t); setError(''); }}
            keyboardType="email-address" autoCapitalize="none" autoComplete="email" />

          <View style={styles.passwordWrap}>
            <Input label="Passwort" value={password} onChangeText={t => { setPassword(t); setError(''); }}
              secureTextEntry={!showPw} autoComplete="new-password" />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(v => !v)}>
              <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Input label="Passwort bestätigen" value={confirm} onChangeText={t => { setConfirm(t); setError(''); }}
            secureTextEntry={!showPw} autoComplete="new-password" />

          <Button label="Konto erstellen & Daten sichern" onPress={handleUpgrade} loading={loading} />

          <TouchableOpacity onPress={handleClose} style={styles.skipBtn}>
            <Text style={styles.skipText}>Später</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

function friendlyError(msg: string): string {
  if (msg.includes('already registered') || msg.includes('User already'))
    return 'Diese E-Mail ist bereits vergeben.';
  if (msg.includes('invalid email') || msg.includes('Invalid email'))
    return 'Bitte eine gültige E-Mail eingeben.';
  if (msg.includes('Password should be'))
    return 'Passwort muss mindestens 6 Zeichen haben.';
  if (msg.includes('Network'))
    return 'Keine Internetverbindung.';
  return msg || 'Ein Fehler ist aufgetreten.';
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.h2,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
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
  skipBtn: { alignItems: 'center', marginTop: spacing.md },
  skipText: { color: colors.textTertiary, fontSize: typography.body },
});
