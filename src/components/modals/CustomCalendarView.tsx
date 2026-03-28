import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { startOfDay } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../../theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Returns the grid cells for a given month.
 * Each cell is either a Date (belongs to this month) or null (empty leading/trailing slot).
 * Week starts on Monday (ISO weekday: Mon=1, ..., Sun=7).
 */
function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  // getDay(): 0=Sun,1=Mon,...,6=Sat → convert to Mon-based index (0=Mon,...,6=Sun)
  const rawDow = firstDay.getDay(); // 0-6, Sunday=0
  const leadingEmpties = rawDow === 0 ? 6 : rawDow - 1; // Mon-based offset

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];

  for (let i = 0; i < leadingEmpties; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  // Pad to full rows of 7
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CustomCalendarView: React.FC<Props> = ({ selectedDate, onSelectDate }) => {
  const today = startOfDay(new Date());

  const [viewYear, setViewYear]   = useState(selectedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(selectedDate.getMonth());

  // Slide animation
  const slideAnim = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  const changeMonth = useCallback((delta: 1 | -1) => {
    if (isAnimating.current) return;

    // Prevent navigating before current month
    if (delta === -1) {
      const isCurrentMonth =
        viewYear === today.getFullYear() && viewMonth === today.getMonth();
      if (isCurrentMonth) return;
    }

    isAnimating.current = true;
    const slideOut = delta === 1 ? -320 : 320;
    const slideIn  = delta === 1 ?  320 : -320;

    Animated.timing(slideAnim, {
      toValue: slideOut,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      // Update month state
      let newMonth = viewMonth + delta;
      let newYear  = viewYear;
      if (newMonth > 11) { newMonth = 0;  newYear += 1; }
      if (newMonth < 0)  { newMonth = 11; newYear -= 1; }
      setViewMonth(newMonth);
      setViewYear(newYear);

      // Slide in from opposite side
      slideAnim.setValue(slideIn);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => { isAnimating.current = false; });
    });
  }, [viewMonth, viewYear, slideAnim, today]);

  const cells = buildMonthGrid(viewYear, viewMonth);

  const isAtMinMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <View style={styles.container}>
      {/* ── Month header ── */}
      <View style={styles.header}>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>
        <View style={styles.navButtons}>
          <TouchableOpacity
            style={[styles.navBtn, isAtMinMonth && styles.navBtnDisabled]}
            onPress={() => changeMonth(-1)}
            disabled={isAtMinMonth}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={isAtMinMonth ? colors.textTertiary : colors.textPrimary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => changeMonth(1)}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Weekday labels ── */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((wd) => (
          <Text key={wd} style={styles.weekdayLabel}>{wd}</Text>
        ))}
      </View>

      {/* ── Day grid ── */}
      <Animated.View style={[styles.grid, { transform: [{ translateX: slideAnim }] }]}>
        {cells.map((date, idx) => {
          if (!date) {
            return <View key={`empty-${idx}`} style={styles.dayCell} />;
          }

          const isToday    = isSameDay(date, today);
          const isSelected = isSameDay(date, selectedDate);
          const isPast     = date.getTime() < today.getTime();

          return (
            <TouchableOpacity
              key={date.toISOString()}
              style={styles.dayCell}
              onPress={() => !isPast && onSelectDate(startOfDay(date))}
              disabled={isPast}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.dayCircle,
                  isToday    && styles.dayCircleToday,
                  isSelected && !isToday && styles.dayCircleSelected,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    isToday    && styles.dayTextToday,
                    isSelected && !isToday && styles.dayTextSelected,
                    isPast     && styles.dayTextPast,
                  ]}
                >
                  {date.getDate()}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const DAY_SIZE = 40;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  monthTitle: {
    fontSize: typography.h3,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
  },
  navButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    backgroundColor: 'transparent',
  },

  // Weekday row
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.tiny,
    fontWeight: typography.semibold as any,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%` as any,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    borderRadius: DAY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: {
    backgroundColor: colors.primary,
  },
  dayCircleSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
  },

  // Day text
  dayText: {
    fontSize: typography.body,
    fontWeight: typography.medium as any,
    color: colors.textPrimary,
  },
  dayTextToday: {
    color: colors.background,
    fontWeight: typography.bold as any,
  },
  dayTextSelected: {
    color: colors.primary,
    fontWeight: typography.bold as any,
  },
  dayTextPast: {
    color: colors.textTertiary,
  },
});
