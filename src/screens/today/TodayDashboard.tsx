import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card } from '../../components/common/Card';
import { useLayout } from '../../hooks/useLayout';
import { useEvents } from '../../context/EventsContext';
import { formatDateLabel, formatTimeRange, getGreeting, formatCountdown } from '../../utils/dateUtils';
import { QuickAddModal, ParsedEventDraft } from '../../components/modals/QuickAddModal';
import { EventConfirmationModal } from '../../components/modals/EventConfirmationModal';
import { EventDetailModal } from '../../components/modals/EventDetailModal';
import type { CalendarEvent } from '../../types/event';

export const TodayDashboard: React.FC = () => {
  const { isLargeScreen } = useLayout();
  const { events, addEvent, updateEvent, deleteEvent, toggleComplete } = useEvents();
  const [whatsOnExpanded, setWhatsOnExpanded] = useState(true);
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmationDraft, setConfirmationDraft] = useState<ParsedEventDraft | null>(null);

  const today = new Date();
  const todaysEvents = useMemo(
    () =>
      events
        .filter((evt) => evt.start.toDateString() === today.toDateString())
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    [events, today],
  );

  const greeting = getGreeting(today);

  const completedToday = todaysEvents.filter((evt) => evt.completed);

  const xpTotal = useMemo(() => events.filter((evt) => evt.completed).length, [events]);
  const level = Math.floor(xpTotal / 10) + 1;
  const currentLevelXP = xpTotal % 10;
  const xpToNextLevel = 10 - currentLevelXP;

  const computeStreak = (allEvents: CalendarEvent[]): number => {
    let streak = 0;
    const oneDayMs = 24 * 60 * 60 * 1000;
    let cursor = new Date(today);
    // Normalize to midnight
    cursor.setHours(0, 0, 0, 0);

    // Look backwards until a day without any completed events is found
    // Cap at 365 to avoid infinite loops
    for (let i = 0; i < 365; i++) {
      const dayKey = cursor.toDateString();
      const hasCompleted = allEvents.some(
        (evt) => evt.completed && evt.start.toDateString() === dayKey,
      );
      if (!hasCompleted) break;
      streak += 1;
      cursor = new Date(cursor.getTime() - oneDayMs);
    }
    return streak;
  };

  const currentStreak = useMemo(() => computeStreak(events), [events]);

  const now = today;
  const upcomingToday = todaysEvents.filter(
    (evt) => !evt.completed && evt.start.getTime() > now.getTime(),
  );
  const nextUp = upcomingToday.length > 0 ? upcomingToday[0] : null;

  const selectedEvent = todaysEvents.find((e) => e.id === selectedId) ?? null;

  const handleParsed = (draft: ParsedEventDraft) => {
    setConfirmationDraft(draft);
  };

  const handleConfirm = (base: Omit<CalendarEvent, 'id'>) => {
    addEvent(base);
    setConfirmationDraft(null);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          isLargeScreen && styles.contentWide,
        ]}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.dateText}>{formatDateLabel(today)}</Text>
            <Text style={styles.greetingText}>{greeting}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>LVL {level}</Text>
            <Text style={styles.levelSubText}>
              {xpTotal} XP · {xpToNextLevel} to next
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setWhatsOnExpanded((v) => !v)}
        >
          <Card style={styles.whatsOnCard}>
            <View style={styles.whatsOnHeaderRow}>
              <Text style={styles.sectionTitle}>✨ What's On Today?</Text>
              <Text style={styles.sectionSubtitle}>
                {whatsOnExpanded ? 'Hide' : 'Show'}
              </Text>
            </View>
            {whatsOnExpanded && (
              <View style={styles.whatsOnBody}>
                <Text style={styles.whatsOnSummary}>
                  {todaysEvents.length === 0
                    ? 'No tasks yet. Tell LiveNote what you need to do.'
                    : `${todaysEvents.length} tasks • ${completedToday.length} completed`}
                </Text>
                <Text style={styles.whatsOnHint}>
                  AI-powered daily summary will appear here once connected.
                </Text>
              </View>
            )}
          </Card>
        </TouchableOpacity>

        {nextUp && (
          <Card style={styles.nextUpCard}>
            <Text style={styles.nextUpLabel}>NEXT UP</Text>
            <Text style={styles.nextUpTitle}>{nextUp.title}</Text>
            <View style={styles.nextUpMetaRow}>
              <Text style={styles.nextUpTime}>
                {formatTimeRange(nextUp.start, nextUp.end)}
              </Text>
              <Text style={styles.nextUpCountdown}>
                {formatCountdown(nextUp.start, now)}
              </Text>
            </View>
          </Card>
        )}

        <Card style={styles.placeholderCard}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          {todaysEvents.length === 0 ? (
            <Text style={styles.sectionSubtitle}>
              No events yet. Tap + to add one.
            </Text>
          ) : (
            todaysEvents.map((evt) => {
              const isCompleted = !!evt.completed;
              return (
                <TouchableOpacity
                  key={evt.id}
                  style={[styles.eventRow, isCompleted && styles.eventRowCompleted]}
                  onPress={() => {
                    setSelectedId(evt.id);
                    setDetailVisible(true);
                  }}
                >
                  <TouchableOpacity
                    style={styles.checkbox}
                    onPress={() => toggleComplete(evt.id)}
                  >
                    <Text style={styles.checkboxIcon}>
                      {isCompleted ? '●' : '○'}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.eventTextContainer}>
                    <Text
                      style={[
                        styles.eventTitle,
                        isCompleted && styles.eventTitleCompleted,
                      ]}
                    >
                      {evt.title}
                    </Text>
                    <Text style={styles.eventMeta}>
                      {formatTimeRange(evt.start, evt.end)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </Card>

        {currentStreak >= 3 && (
          <Card style={styles.streakCard}>
            <Text style={styles.streakLabel}>🔥 {currentStreak}-Day Streak!</Text>
            <Text style={styles.streakText}>
              Complete today&apos;s tasks to keep it going.
            </Text>
          </Card>
        )}
      </ScrollView>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setQuickAddVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Add new event"
      >
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>
      <QuickAddModal
        visible={quickAddVisible}
        onClose={() => setQuickAddVisible(false)}
        onParsed={handleParsed}
      />
      <EventConfirmationModal
        visible={!!confirmationDraft}
        draft={
          confirmationDraft
            ? {
                title: confirmationDraft.title,
                start: confirmationDraft.start,
                end: confirmationDraft.end,
              }
            : null
        }
        onCancel={() => setConfirmationDraft(null)}
        onConfirm={handleConfirm}
      />
      <EventDetailModal
        visible={detailVisible}
        event={selectedEvent}
        onClose={() => setDetailVisible(false)}
        onSave={updateEvent}
        onDelete={deleteEvent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  contentWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dateText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  greetingText: {
    marginTop: spacing.xs,
    fontSize: typography.h2,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
  },
  levelBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.large,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
  },
  levelText: {
    fontSize: typography.caption,
    color: colors.accentYellow,
    fontWeight: typography.bold as any,
  },
  levelSubText: {
    fontSize: typography.tiny,
    color: colors.textSecondary,
  },
  whatsOnCard: {
    marginBottom: spacing.md,
  },
  whatsOnHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  whatsOnBody: {
    marginTop: spacing.sm,
  },
  whatsOnSummary: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: typography.medium as any,
  },
  whatsOnHint: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  nextUpCard: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  nextUpLabel: {
    color: colors.primary,
    fontSize: typography.tiny,
    fontWeight: typography.semibold as any,
    letterSpacing: 1,
  },
  nextUpTitle: {
    marginTop: spacing.xs,
    color: colors.textPrimary,
    fontSize: typography.h2,
    fontWeight: typography.bold as any,
  },
  nextUpMetaRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextUpTime: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  nextUpCountdown: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: typography.medium as any,
  },
  placeholderCard: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.h3,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eventRowCompleted: {
    opacity: 0.7,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceVariant,
  },
  checkboxIcon: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: -1,
  },
  eventTextContainer: {
    flex: 1,
  },
  eventTitle: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: typography.medium as any,
  },
  eventTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  eventMeta: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  streakCard: {
    marginTop: spacing.md,
  },
  streakLabel: {
    color: colors.accentYellow,
    fontSize: typography.h3,
    fontWeight: typography.bold as any,
  },
  streakText: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    color: colors.textPrimary,
    fontSize: 28,
  },
});

