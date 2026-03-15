import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';

interface Suggestion {
  label: string;
  message: string;
  icon: string;
}

const DEFAULT_SUGGESTIONS: Suggestion[] = [
  { icon: '📅', label: "What's on today?",   message: "What's on my schedule today?" },
  { icon: '➕', label: 'Add a task',          message: 'I want to add a new task.' },
  { icon: '📚', label: 'Plan study session', message: 'Help me plan a study session.' },
  { icon: '🗓️', label: 'Plan my week',       message: 'Help me plan my week.' },
  { icon: '⚡', label: 'Productivity tip',    message: 'Give me a productivity tip.' },
];

interface Props {
  onSelect: (message: string) => void;
  suggestions?: Suggestion[];
}

export function SuggestedActions({ onSelect, suggestions = DEFAULT_SUGGESTIONS }: Props) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {suggestions.map((s) => (
          <TouchableOpacity
            key={s.label}
            style={styles.chip}
            onPress={() => onSelect(s.message)}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{s.icon}</Text>
            <Text style={styles.label}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
  },
  container: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  icon: { fontSize: 13 },
  label: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
});
