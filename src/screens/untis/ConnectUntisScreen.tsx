import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../../navigation/ProfileStack';
import { useUntis } from '../../context/UntisContext';
import { colors, spacing, typography, borderRadius } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ConnectUntis'>;

export const ConnectUntisScreen: React.FC<Props> = ({ navigation }) => {
  const { connected, username, loading, connect, disconnect } = useUntis();

  const [inputUser, setInputUser] = useState('');
  const [inputPass, setInputPass] = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const handleConnect = async () => {
    if (!inputUser.trim() || !inputPass.trim()) {
      setError('Please enter your username and password.');
      return;
    }
    setError(null);
    setSuccess(false);
    try {
      await connect(inputUser.trim(), inputPass);
      setSuccess(true);
      setInputPass('');
    } catch (err: any) {
      setError(err?.message ?? 'Login failed. Please check your credentials.');
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Untis',
      'This will remove your school timetable from LiveNote. You can reconnect at any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Disconnect', style: 'destructive', onPress: () => disconnect() },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Back */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Connect Untis</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconWrap}>
          <Ionicons name="school-outline" size={44} color={colors.primary} />
        </View>

        <Text style={styles.title}>Connect Your School</Text>
        <Text style={styles.subtitle}>
          Sync your timetable and see cancellations in real time
        </Text>

        {/* School info chip */}
        <View style={styles.schoolChip}>
          <Ionicons name="business-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.schoolChipText}>Hegel-Gymnasium Stuttgart</Text>
        </View>

        {connected ? (
          /* ── Already connected ── */
          <View style={styles.connectedCard}>
            <View style={styles.connectedHeader}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={styles.connectedLabel}>Connected</Text>
            </View>
            <View style={styles.connectedInfo}>
              <Ionicons name="person-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.connectedUser}>{username}</Text>
            </View>
            <View style={styles.connectedInfo}>
              <Ionicons name="school-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.connectedUser}>Hegel-Gymnasium Stuttgart</Text>
            </View>

            <TouchableOpacity style={styles.disconnectBtn} onPress={handleDisconnect} activeOpacity={0.8}>
              <Ionicons name="unlink-outline" size={18} color={colors.error} />
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── Login form ── */
          <View style={styles.form}>
            {/* Username */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Username</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={inputUser}
                  onChangeText={setInputUser}
                  placeholder="WebUntis username"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={inputPass}
                  onChangeText={setInputPass}
                  placeholder="WebUntis password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleConnect}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Error */}
            {error && (
              <View style={styles.errorBox}>
                <Ionicons name="warning-outline" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Success */}
            {success && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text style={styles.successText}>Connected! Your timetable is being loaded.</Text>
              </View>
            )}

            {/* Connect button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleConnect}
              disabled={loading}
              style={styles.connectBtnWrap}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.connectBtn}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="link-outline" size={20} color="#fff" />
                    <Text style={styles.connectBtnText}>Connect</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.hint}>
              Your credentials are stored securely on your device and never shared.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },

  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backBtn:  { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: typography.h3, fontWeight: typography.bold as any, color: colors.textPrimary },

  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },

  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: colors.primary + '22',
    borderWidth: 1.5,
    borderColor: colors.primary + '44',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },

  schoolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.round,
    marginBottom: spacing.xl,
  },
  schoolChipText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontWeight: typography.medium as any,
  },

  // Form
  form: { width: '100%', gap: spacing.md },

  inputGroup: { gap: 6 },
  inputLabel: {
    fontSize: typography.caption,
    fontWeight: typography.semibold as any,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginLeft: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.large,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  inputIcon: {},
  input: {
    flex: 1,
    fontSize: typography.body,
    color: colors.textPrimary,
  },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error + '18',
    borderWidth: 1,
    borderColor: colors.error + '44',
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: { flex: 1, fontSize: typography.caption, color: colors.error, lineHeight: 18 },

  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.success + '18',
    borderWidth: 1,
    borderColor: colors.success + '44',
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  successText: { flex: 1, fontSize: typography.caption, color: colors.success, lineHeight: 18 },

  connectBtnWrap: { width: '100%', marginTop: spacing.sm },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.large,
    paddingVertical: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  connectBtnText: {
    fontSize: typography.body,
    fontWeight: typography.bold as any,
    color: '#fff',
    letterSpacing: 0.3,
  },

  hint: {
    fontSize: typography.tiny,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: spacing.sm,
  },

  // Connected state
  connectedCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.success + '44',
  },
  connectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  connectedLabel: {
    fontSize: typography.body,
    fontWeight: typography.bold as any,
    color: colors.success,
  },
  connectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  connectedUser: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.large,
    borderWidth: 1,
    borderColor: colors.error + '44',
    backgroundColor: colors.error + '11',
    marginTop: spacing.sm,
  },
  disconnectText: {
    fontSize: typography.body,
    fontWeight: typography.semibold as any,
    color: colors.error,
  },
});
