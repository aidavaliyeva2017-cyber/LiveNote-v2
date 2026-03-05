import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/common/Button';

export const OnboardingStep1: React.FC<{ onNext?: () => void }> = ({ onNext }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Welcome to LiveNote!</Text>
      <Text style={styles.subtitle}>
        Let's set up your schedule in just a few steps.
      </Text>
      <Button label="Let's Go!" onPress={onNext ?? (() => {})} style={styles.button} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  heading: {
    fontSize: typography.h1,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  button: {
    marginTop: spacing.xl,
  },
});

