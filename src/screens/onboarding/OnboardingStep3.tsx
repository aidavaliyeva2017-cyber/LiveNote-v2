import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export const OnboardingStep3: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Routines Setup</Text>
      <Text style={styles.subtitle}>
        Define wake/sleep times and recurring routines. AI chat flow will be added here.
      </Text>
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
});

