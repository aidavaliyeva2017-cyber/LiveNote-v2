import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { spacing, typography } from '../../theme';
import { useColors } from '../../context/ThemeContext';
import { CalendarEvent } from '../../types/event';
import { formatTimeRange } from '../../utils/dateUtils';
import { XPBadge } from '../gamification/XPBadge';

interface Props {
  event: CalendarEvent;
  onToggle: (id: string) => void;
  onPress: (id: string) => void;
}

export function TaskRow({ event, onToggle, onPress }: Props) {
  const c = useColors();
  const [showXP, setShowXP] = useState(false);
  const wasCompleted = useRef(event.completed);

  // Dynamic color maps – respond to grayscale mode
  const CATEGORY_COLORS: Record<string, string> = {
    work:     c.categoryWork,
    personal: c.categoryPersonal,
    health:   c.categoryHealth,
    social:   c.categorySocial,
    errands:  c.categoryErrands,
    hobbies:  c.categoryHobbies,
  };
  const PRIORITY_COLORS: Record<string, string> = {
    high:   c.error,
    medium: c.warning,
    low:    c.textTertiary,
  };

  const handleToggle = () => {
    const completing = !event.completed;
    onToggle(event.id);
    if (completing) {
      setShowXP(true);
      setTimeout(() => setShowXP(false), 1200);
    }
    wasCompleted.current = completing;
  };

  const categoryColor = CATEGORY_COLORS[event.category] ?? c.primary;
  const priorityColor = PRIORITY_COLORS[event.priority] ?? c.textTertiary;

  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: c.border }, event.completed && styles.rowCompleted]}
      onPress={() => onPress(event.id)}
      activeOpacity={0.7}
    >
      {/* Category color bar */}
      <View style={[styles.categoryBar, { backgroundColor: categoryColor }]} />

      {/* Checkbox */}
      <TouchableOpacity
        style={[
          styles.checkbox,
          { borderColor: c.border },
          event.completed && { borderColor: c.success, backgroundColor: c.success + '20' },
        ]}
        onPress={handleToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {event.completed && <View style={[styles.checkmark, { backgroundColor: c.success }]} />}
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: c.textPrimary },
            event.completed && { textDecorationLine: 'line-through', color: c.textSecondary },
          ]}
          numberOfLines={1}
        >
          {event.title}
        </Text>
        <Text style={[styles.time, { color: c.textTertiary }]}>
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
    gap: spacing.sm,
    position: 'relative',
  },
  rowCompleted: { opacity: 0.55 },
  categoryBar: { width: 3, height: 38, borderRadius: 2 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { width: 10, height: 10, borderRadius: 5 },
  content:   { flex: 1, gap: 2 },
  title:     { fontSize: typography.body, fontWeight: typography.medium },
  time:      { fontSize: typography.tiny },
  priorityDot: { width: 7, height: 7, borderRadius: 4 },
});
