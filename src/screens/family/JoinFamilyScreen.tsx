import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ProfileStackParamList } from '../../navigation/ProfileStack';
import { useFamily } from '../../context/FamilyContext';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing, typography, borderRadius } from '../../theme';

type Props = NativeStackScreenProps<ProfileStackParamList, 'JoinFamily'>;

export const JoinFamilyScreen: React.FC<Props> = ({ navigation }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { joinFamily } = useFamily();
  const { user } = useAuth();

  const email = user?.email ?? '';

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-character invite code.');
      return;
    }
    if (!email) {
      Alert.alert('Error', 'Could not determine your account. Please sign out and back in.');
      return;
    }
    setLoading(true);
    try {
      await joinFamily(trimmed, email);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Could not join', err?.message ?? 'Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#070A12', '#0A0E1A', '#0A0E1A', '#0B3A33']}
        locations={[0, 0.25, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Back */}
      <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={22} color={colors.textSecondary} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Ionicons name="enter-outline" size={40} color={colors.primary} />
        </View>
        <Text style={styles.title}>Join a Group</Text>
        <Text style={styles.subtitle}>
          Enter the 6-character invite code shared by a group member.
        </Text>

        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          placeholder="ABC123"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleJoin}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleJoin}
          disabled={loading || code.trim().length !== 6}
        >
          <LinearGradient
            colors={
              code.trim().length === 6
                ? [colors.primary, colors.primaryDark]
                : [colors.surfaceVariant, colors.surfaceVariant]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.btnText, code.trim().length !== 6 && styles.btnTextDisabled]}>
                Join Group →
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },

  back: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    gap: 4,
  },
  backText: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.primary + '22',
    borderWidth: 1.5,
    borderColor: colors.primary + '44',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xxl,
  },
  codeInput: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.large,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    fontSize: 32,
    color: colors.textPrimary,
    fontWeight: typography.bold as any,
    textAlign: 'center',
    letterSpacing: 12,
  },

  footer: { paddingHorizontal: spacing.lg, paddingBottom: 48 },
  btn: {
    borderRadius: borderRadius.large,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  btnText: {
    fontSize: typography.body,
    fontWeight: typography.bold as any,
    color: '#fff',
  },
  btnTextDisabled: { color: colors.textTertiary },
});
