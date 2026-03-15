import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types/navigation';
import { colors, spacing, typography, borderRadius } from '../../theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingStep3'>;

const WAKE_OPTIONS = ['5:00', '6:00', '7:00', '8:00', '9:00', '10:00'];
const SLEEP_OPTIONS = ['21:00', '22:00', '23:00', '0:00', '1:00', '2:00'];

const GOAL_OPTIONS = [
  { icon: '🎓', label: 'Studium', value: 'study' },
  { icon: '💼', label: 'Arbeit', value: 'work' },
  { icon: '🏃', label: 'Fitness', value: 'fitness' },
  { icon: '🎯', label: 'Persönlich', value: 'personal' },
  { icon: '📚', label: 'Weiterbildung', value: 'learning' },
  { icon: '👨‍👩‍👧', label: 'Familie', value: 'family' },
];

const WAKE_KEY = 'livenote_wake_time';
const SLEEP_KEY = 'livenote_sleep_time';
const GOALS_KEY = 'livenote_goals';

export const OnboardingStep3: React.FC<Props> = ({ navigation }) => {
  const [wakeTime, setWakeTime] = useState('7:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const toggleGoal = (value: string) => {
    setSelectedGoals((prev) =>
      prev.includes(value) ? prev.filter((g) => g !== value) : [...prev, value]
    );
  };

  const handleNext = async () => {
    await Promise.all([
      SecureStore.setItemAsync(WAKE_KEY, wakeTime),
      SecureStore.setItemAsync(SLEEP_KEY, sleepTime),
      SecureStore.setItemAsync(GOALS_KEY, JSON.stringify(selectedGoals)),
    ]);
    navigation.navigate('OnboardingStep4');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#070A12', '#0A0E1A', '#0A0E1A', '#0B3A33']}
        locations={[0, 0.25, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, i === 2 && styles.dotActive]} />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.emoji}>🌅</Text>
        <Text style={styles.title}>Dein Tagesrhythmus</Text>
        <Text style={styles.subtitle}>
          LiveNote plant um deine aktiven Stunden herum.
        </Text>

        {/* Wake time */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>⏰ Wann stehst du auf?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionsRow}>
            {WAKE_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.pill, wakeTime === t && styles.pillActive]}
                onPress={() => setWakeTime(t)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, wakeTime === t && styles.pillTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Sleep time */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>🌙 Wann gehst du schlafen?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionsRow}>
            {SLEEP_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.pill, sleepTime === t && styles.pillActive]}
                onPress={() => setSleepTime(t)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, sleepTime === t && styles.pillTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Goals */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>🎯 Deine Hauptziele (optional)</Text>
          <View style={styles.goalsGrid}>
            {GOAL_OPTIONS.map((g) => {
              const active = selectedGoals.includes(g.value);
              return (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.goalChip, active && styles.goalChipActive]}
                  onPress={() => toggleGoal(g.value)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.goalIcon}>{g.icon}</Text>
                  <Text style={[styles.goalLabel, active && styles.goalLabelActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity activeOpacity={0.85} onPress={handleNext}>
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>Weiter →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },

  emoji: {
    fontSize: 48,
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

  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.caption,
    fontWeight: typography.semibold as any,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  optionsRow: {
    gap: spacing.sm,
    paddingBottom: 4,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primary + '22',
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: typography.body,
    color: colors.textSecondary,
    fontWeight: typography.medium as any,
  },
  pillTextActive: {
    color: colors.primary,
    fontWeight: typography.bold as any,
  },

  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  goalChipActive: {
    backgroundColor: colors.primary + '22',
    borderColor: colors.primary,
  },
  goalIcon: { fontSize: 16 },
  goalLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontWeight: typography.medium as any,
  },
  goalLabelActive: {
    color: colors.primary,
    fontWeight: typography.semibold as any,
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
});
