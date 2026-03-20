import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useColors } from '../../context/ThemeContext';
import { Card } from '../../components/common/Card';
import { TaskRow } from '../../components/tasks/TaskRow';
import { XPProgressBar } from '../../components/gamification/XPProgressBar';
import { useLayout } from '../../hooks/useLayout';
import { useEvents } from '../../context/EventsContext';
import {
  formatDateLabel,
  formatTimeRange,
  getGreeting,
  formatCountdown,
} from '../../utils/dateUtils';
import { NewTaskModal } from '../../components/modals/NewTaskModal';
import type { CalendarEvent } from '../../types/event';

// ─── XP helpers ──────────────────────────────────────────────────────────────
function computeLevel(xp: number) { return Math.floor(xp / 10) + 1; }
function xpProgress(xp: number) { return (xp % 10) / 10; }
function xpToNext(xp: number) { return 10 - (xp % 10); }

// ─── Priority helpers ─────────────────────────────────────────────────────────
const PRIORITY_LABEL: Record<string, string> = {
  high: 'High', medium: 'Medium', low: 'Low',
};
const PRIORITY_COLOR: Record<string, string> = {
  high: colors.error, medium: colors.warning, low: colors.textTertiary,
};

// ─── Main Component ───────────────────────────────────────────────────────────
export const TodayDashboard: React.FC = () => {
  const c = useColors();
  const { isLargeScreen } = useLayout();
  const { events, updateEvent, deleteEvent, toggleComplete } = useEvents();

  // ── Modal state — single modal for create (event=null) and edit (event=CalendarEvent) ──
  const [taskModal, setTaskModal] = useState<{ visible: boolean; event: CalendarEvent | null }>({
    visible: false,
    event: null,
  });

  // ── AI summary state ──
  const [aiSummary, setAiSummary]     = useState<string | null>(null);
  const [aiLoading, setAiLoading]     = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  // ── Completed section collapse ──
  const [completedExpanded, setCompletedExpanded] = useState(false);

  // ── Level-up animation ──
  const levelUpAnim = useRef(new Animated.Value(0)).current;
  const [levelUpVisible, setLevelUpVisible] = useState(false);
  const prevLevelRef = useRef<number | null>(null);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const today = useMemo(() => new Date(), []);

  const todaysEvents = useMemo(
    () =>
      events
        .filter((e) => e.start.toDateString() === today.toDateString())
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    [events, today],
  );

  const pending   = todaysEvents.filter((e) => !e.completed);
  const completed = todaysEvents.filter((e) => e.completed);

  const now     = new Date();
  const nextUp  = pending.find((e) => e.start.getTime() > now.getTime()) ?? null;
  const overdue = pending.filter((e) => e.start.getTime() <= now.getTime());

  const xpTotal = useMemo(() => events.filter((e) => e.completed).length, [events]);
  const level   = computeLevel(xpTotal);
  const progress = xpProgress(xpTotal);
  const toNext   = xpToNext(xpTotal);

  const streak = useMemo(() => {
    let s = 0;
    const ms = 24 * 60 * 60 * 1000;
    let cursor = new Date(today);
    cursor.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const key = cursor.toDateString();
      if (!events.some((e) => e.completed && e.start.toDateString() === key)) break;
      s++;
      cursor = new Date(cursor.getTime() - ms);
    }
    return s;
  }, [events, today]);


  // ── Level-up check ────────────────────────────────────────────────────────
  if (prevLevelRef.current !== null && level > prevLevelRef.current) {
    setLevelUpVisible(true);
    Animated.sequence([
      Animated.timing(levelUpAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(levelUpAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => setLevelUpVisible(false));
  }
  prevLevelRef.current = level;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleToggle = useCallback(
    (id: string) => toggleComplete(id),
    [toggleComplete],
  );

  const handleOpenDetail = useCallback(
    (id: string) => {
      const evt = todaysEvents.find((e) => e.id === id) ?? null;
      setTaskModal({ visible: true, event: evt });
    },
    [todaysEvents],
  );

  const handleWhatsOnToday = useCallback(async () => {
    if (aiSummary) {
      setSummaryExpanded((v) => !v);
      return;
    }
    setAiLoading(true);
    setSummaryExpanded(true);
    try {
      // Build a simple summary locally (AI will replace this when backend is wired)
      const pendingTitles = pending.map((e) => e.title).join(', ');
      const highPrio = pending.filter((e) => e.priority === 'high');
      let summary = todaysEvents.length === 0
        ? "Your day is completely free! Add some tasks to get started."
        : `You have ${pending.length} task${pending.length !== 1 ? 's' : ''} remaining today.`;
      if (nextUp) {
        const mins = Math.round((nextUp.start.getTime() - now.getTime()) / 60000);
        summary += ` Next up: "${nextUp.title}" in ${mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h`}.`;
      }
      if (highPrio.length > 0) {
        summary += ` Don't forget your high-priority item${highPrio.length > 1 ? 's' : ''}: ${highPrio.map((e) => e.title).join(', ')}.`;
      }
      if (completed.length > 0) {
        summary += ` Great work – you've already completed ${completed.length} task${completed.length !== 1 ? 's' : ''}!`;
      }
      setAiSummary(summary);
    } finally {
      setAiLoading(false);
    }
  }, [aiSummary, pending, completed, nextUp, todaysEvents, now]);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* ── Level-up toast ── */}
      {levelUpVisible && (
        <Animated.View
          style={[styles.levelUpToast, { opacity: levelUpAnim, transform: [{ scale: levelUpAnim }], backgroundColor: c.accentYellow }]}
          pointerEvents="none"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="gift" size={22} color="#000" />
            <Text style={styles.levelUpText}>Level {level}!</Text>
          </View>
        </Animated.View>
      )}

      <ScrollView
        contentContainerStyle={[styles.content, isLargeScreen && styles.contentWide]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.dateText}>{formatDateLabel(today)}</Text>
            <Text style={styles.greetingText}>{getGreeting(today)}</Text>
          </View>
          <View style={[styles.levelBadge, { backgroundColor: c.surfaceVariant }]}>
            <Ionicons name="flash" size={14} color={c.accentYellow} />
            <Text style={[styles.levelText, { color: c.accentYellow }]}>LVL {level}</Text>
          </View>
        </View>

        {/* ── XP Progress Bar ── */}
        <XPProgressBar
          xpTotal={xpTotal}
          level={level}
          progress={progress}
          xpToNext={toNext}
        />

        {/* ── What's On Today? ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleWhatsOnToday}
          style={styles.whatsOnButton}
        >
          <View style={styles.whatsOnRow}>
            <Ionicons name="sparkles" size={16} color={c.primary} />
            <Text style={styles.whatsOnLabel}>What's On Today?</Text>
            {aiLoading
              ? <ActivityIndicator size="small" color={c.primary} />
              : <Text style={styles.whatsOnChevron}>{summaryExpanded ? '▲' : '▼'}</Text>
            }
          </View>
          {summaryExpanded && aiSummary && (
            <Text style={styles.whatsOnSummary}>{aiSummary}</Text>
          )}
        </TouchableOpacity>

        {/* ── Next Up Card ── */}
        {nextUp && (
          <View style={[styles.nextUpCard, { backgroundColor: c.primary + '18', borderLeftColor: c.primary }]}>
            <View style={styles.nextUpHeader}>
              <Text style={[styles.nextUpLabel, { color: c.primary }]}>NEXT UP</Text>
              <Text style={[styles.nextUpCountdown, { color: c.primary }]}>
                {formatCountdown(nextUp.start, now)}
              </Text>
            </View>
            <Text style={styles.nextUpTitle}>{nextUp.title}</Text>
            <View style={styles.nextUpMeta}>
              <Text style={styles.nextUpTime}>{formatTimeRange(nextUp.start, nextUp.end)}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="ellipse" size={8} color={PRIORITY_COLOR[nextUp.priority]} />
                <Text style={styles.nextUpPriority}>{PRIORITY_LABEL[nextUp.priority]}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Overdue items ── */}
        {overdue.length > 0 && (
          <View style={styles.section}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="warning" size={14} color={c.warning} />
              <Text style={[styles.sectionLabel, { color: c.warning }]}>Overdue</Text>
            </View>
            {overdue.map((e) => (
              <TaskRow key={e.id} event={e} onToggle={handleToggle} onPress={handleOpenDetail} />
            ))}
          </View>
        )}

        {/* ── Today's Tasks ── */}
        <Card style={styles.scheduleCard}>
          <View style={styles.scheduleHeader}>
            <Text style={styles.sectionTitle}>Today's Schedule</Text>
            <Text style={styles.scheduleCount}>
              {pending.length} pending · {completed.length} done
            </Text>
          </View>

          {pending.length === 0 && completed.length === 0 && (
            <Text style={styles.emptyText}>
              No tasks yet. Tap + to add one.
            </Text>
          )}

          {/* Pending tasks */}
          {pending
            .filter((e) => !overdue.includes(e))
            .map((e) => (
              <TaskRow key={e.id} event={e} onToggle={handleToggle} onPress={handleOpenDetail} />
            ))}

          {/* Completed section */}
          {completed.length > 0 && (
            <TouchableOpacity
              style={styles.completedToggle}
              onPress={() => setCompletedExpanded((v) => !v)}
            >
              <Text style={styles.completedToggleText}>
                {completedExpanded ? '▲' : '▼'}  {completed.length} completed
              </Text>
            </TouchableOpacity>
          )}
          {completedExpanded &&
            completed.map((e) => (
              <TaskRow key={e.id} event={e} onToggle={handleToggle} onPress={handleOpenDetail} />
            ))}
        </Card>

        {/* ── Streak ── */}
        {streak >= 3 && (
          <View style={[styles.streakCard, { backgroundColor: c.accentYellow + '18', borderLeftColor: c.accentYellow }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="flame" size={18} color={c.accentYellow} />
              <Text style={[styles.streakTitle, { color: c.accentYellow }]}>{streak}-Day Streak!</Text>
            </View>
            <Text style={styles.streakSub}>Keep going – complete today's tasks to maintain it.</Text>
          </View>
        )}

        {/* ── Bottom spacer for quick-add bar ── */}
        <View style={{ height: 72 }} />
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: c.primary, shadowColor: c.primary }]}
        onPress={() => setTaskModal({ visible: true, event: null })}
        accessibilityLabel="Add new task"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ── Modal (create + edit) ── */}
      <NewTaskModal
        visible={taskModal.visible}
        onClose={() => setTaskModal({ visible: false, event: null })}
        defaultDate={today}
        event={taskModal.event}
        onSave={updateEvent}
        onDelete={(id) => {
          deleteEvent(id);
          setTaskModal({ visible: false, event: null });
        }}
      />
    </KeyboardAvoidingView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  contentWide: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  dateText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    letterSpacing: 0.4,
  },
  greetingText: {
    marginTop: 2,
    fontSize: typography.h2,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.large,
  },
  levelText: {
    fontSize: typography.caption,
    fontWeight: typography.bold,
    color: colors.accentYellow,
  },

  // What's On Today
  whatsOnButton: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  whatsOnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  whatsOnLabel: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  whatsOnChevron: {
    fontSize: typography.tiny,
    color: colors.textTertiary,
  },
  whatsOnSummary: {
    marginTop: spacing.sm,
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Next Up
  nextUpCard: {
    backgroundColor: colors.primary + '18',
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  nextUpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nextUpLabel: {
    fontSize: typography.tiny,
    fontWeight: typography.bold,
    color: colors.primary,
    letterSpacing: 1,
  },
  nextUpCountdown: {
    fontSize: typography.tiny,
    color: colors.primary,
    fontWeight: typography.semibold,
  },
  nextUpTitle: {
    fontSize: typography.h3,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  nextUpMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nextUpTime: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  nextUpPriority: {
    fontSize: typography.tiny,
    color: colors.textSecondary,
  },

  // Section labels
  section: {
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    fontSize: typography.caption,
    fontWeight: typography.semibold,
    color: colors.warning,
    marginBottom: spacing.xs,
  },

  // Schedule card
  scheduleCard: {
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.h3,
    fontWeight: typography.semibold,
    color: colors.textPrimary,
  },
  scheduleCount: {
    fontSize: typography.tiny,
    color: colors.textTertiary,
  },
  emptyText: {
    fontSize: typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  completedToggle: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  completedToggleText: {
    fontSize: typography.caption,
    color: colors.textTertiary,
    fontWeight: typography.medium,
  },

  // Streak
  streakCard: {
    backgroundColor: colors.accentYellow + '18',
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accentYellow,
    marginBottom: spacing.md,
  },
  streakTitle: {
    fontSize: typography.h3,
    fontWeight: typography.bold,
    color: colors.accentYellow,
  },
  streakSub: {
    marginTop: 4,
    fontSize: typography.caption,
    color: colors.textSecondary,
  },

  // FAB
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },

  // Level-up toast
  levelUpToast: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    zIndex: 999,
    backgroundColor: colors.accentYellow,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.large,
  },
  levelUpText: {
    fontSize: typography.h2,
    fontWeight: typography.bold,
    color: '#000',
  },
});
