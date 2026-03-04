import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export const OnboardingStep2: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Schedule Setup</Text>
      <Text style={styles.subtitle}>
        Tell LiveNote about your regular schedule. Conversational UI coming soon.
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

