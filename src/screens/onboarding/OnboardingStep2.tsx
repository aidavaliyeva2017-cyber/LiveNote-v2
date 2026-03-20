import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingStep2'>;

const USER_NAME_KEY = 'livenote_user_name';

export const OnboardingStep2: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [focused, setFocused] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleNext = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      shake();
      return;
    }
    await SecureStore.setItemAsync(USER_NAME_KEY, trimmed);
    navigation.navigate('OnboardingStep3');
  };

  const canContinue = name.trim().length > 0;

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

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.dot, i === 1 && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.content}>
        <Ionicons name="hand-right-outline" size={48} color={colors.primary} style={styles.emojiGap} />
        <Text style={styles.title}>Wie heißt du?</Text>
        <Text style={styles.subtitle}>
          LiveNote personalisiert dein Erlebnis mit deinem Namen.
        </Text>

        <Animated.View
          style={[
            styles.inputWrap,
            focused && styles.inputWrapFocused,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Dein Vorname"
            placeholderTextColor={colors.textTertiary}
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleNext}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            maxLength={40}
          />
        </Animated.View>

        {name.trim().length > 0 && (
          <Text style={styles.preview}>Hallo, {name.trim()}!</Text>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleNext}
          disabled={!canContinue}
        >
          <LinearGradient
            colors={canContinue ? [colors.primary, colors.primaryDark] : [colors.surfaceVariant, colors.surfaceVariant]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={[styles.btnText, !canContinue && styles.btnTextDisabled]}>
              Weiter →
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 64,
    paddingBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },

  emojiGap: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xl,
  },

  inputWrap: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.large,
    paddingHorizontal: spacing.md,
  },
  inputWrapFocused: {
    borderColor: colors.primary,
  },
  input: {
    fontSize: 20,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    fontWeight: typography.medium as any,
  },
  preview: {
    marginTop: spacing.md,
    fontSize: typography.body,
    color: colors.primary,
    fontWeight: typography.medium as any,
  },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 48,
  },
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
  btnTextDisabled: {
    color: colors.textTertiary,
  },
});
