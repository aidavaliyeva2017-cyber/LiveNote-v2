import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';

interface Suggestion {
  label: string;
  message: string;
  iconName: keyof typeof Ionicons.glyphMap;
}

const DEFAULT_SUGGESTIONS: Suggestion[] = [
  { iconName: 'calendar-outline',  label: "What's on today?",  message: "What's on my schedule today?" },
  { iconName: 'add-circle-outline', label: 'Add a task',        message: 'I want to add a new task.' },
  { iconName: 'book-outline',       label: 'Plan study session', message: 'Help me plan a study session.' },
  { iconName: 'calendar',           label: 'Plan my week',       message: 'Help me plan my week.' },
  { iconName: 'flash-outline',      label: 'Productivity tip',   message: 'Give me a productivity tip.' },
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
            <Ionicons name={s.iconName} size={13} color={colors.textSecondary} />
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
  label: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },
});
