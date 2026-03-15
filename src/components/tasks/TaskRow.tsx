import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { CalendarEvent } from '../../types/event';
import { formatTimeRange } from '../../utils/dateUtils';
import { XPBadge } from '../gamification/XPBadge';

const CATEGORY_COLORS: Record<string, string> = {
  work:     colors.categoryWork,
  personal: colors.categoryPersonal,
  health:   colors.categoryHealth,
  social:   colors.categorySocial,
  errands:  colors.categoryErrands,
  hobbies:  colors.categoryHobbies,
};

const PRIORITY_COLORS: Record<string, string> = {
  high:   colors.error,
  medium: colors.warning,
  low:    colors.textTertiary,
};

interface Props {
  event: CalendarEvent;
  onToggle: (id: string) => void;
  onPress: (id: string) => void;
}

export function TaskRow({ event, onToggle, onPress }: Props) {
  const [showXP, setShowXP] = useState(false);
  const wasCompleted = useRef(event.completed);

  const handleToggle = () => {
    const completing = !event.completed;
    onToggle(event.id);
    if (completing) {
      setShowXP(true);
      setTimeout(() => setShowXP(false), 1200);
    }
    wasCompleted.current = completing;
  };

  const categoryColor = CATEGORY_COLORS[event.category] ?? colors.primary;
  const priorityColor = PRIORITY_COLORS[event.priority] ?? colors.textTertiary;

  return (
    <TouchableOpacity
      style={[styles.row, event.completed && styles.rowCompleted]}
      onPress={() => onPress(event.id)}
      activeOpacity={0.7}
    >
      {/* Category color bar */}
      <View style={[styles.categoryBar, { backgroundColor: categoryColor }]} />

      {/* Checkbox */}
      <TouchableOpacity
        style={[styles.checkbox, event.completed && { borderColor: colors.success, backgroundColor: colors.success + '20' }]}
        onPress={handleToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {event.completed && <View style={styles.checkmark} />}
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[styles.title, event.completed && styles.titleCompleted]}
          numberOfLines={1}
        >
          {event.title}
        </Text>
        <Text style={styles.time}>
          {formatTimeRange(event.start, event.end)}
        </Text>
      </View>

      {/* Priority dot */}
      {!event.completed && (
        <View style={[styles.priorityDot, { backgroundColor: priorityColor }]} />
      )}

      {/* XP Badge animation */}
      <XPBadge visible={showXP} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingRight: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
    position: 'relative',
  },
  rowCompleted: {
    opacity: 0.55,
  },
  categoryBar: {
    width: 3,
    height: 38,
    borderRadius: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: typography.body,
    fontWeight: typography.medium,
    color: colors.textPrimary,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  time: {
    fontSize: typography.tiny,
    color: colors.textTertiary,
  },
  priorityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
