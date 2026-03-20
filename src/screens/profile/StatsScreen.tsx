import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export const StatsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Stats</Text>
      <Text style={styles.subtitle}>
        XP, streaks, and completion metrics will be shown here.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  heading: {
    fontSize: typography.h1,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
});

