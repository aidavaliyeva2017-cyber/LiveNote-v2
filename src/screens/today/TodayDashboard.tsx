import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { Card } from '../../components/common/Card';
import { useLayout } from '../../hooks/useLayout';
import { useEvents } from '../../context/EventsContext';
import { formatDateLabel, formatTimeRange } from '../../utils/dateUtils';
import { QuickAddModal, ParsedEventDraft } from '../../components/modals/QuickAddModal';
import { EventConfirmationModal } from '../../components/modals/EventConfirmationModal';
import { EventDetailModal } from '../../components/modals/EventDetailModal';

export const TodayDashboard: React.FC = () => {
  const { isLargeScreen } = useLayout();
  const { events, addEvent, updateEvent, deleteEvent } = useEvents();
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirmationDraft, setConfirmationDraft] = useState<ParsedEventDraft | null>(null);

  const today = new Date();
  const todaysEvents = events.filter(
    (evt) =>
      evt.start.toDateString() === today.toDateString(),
  );

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
            <Text style={styles.greetingText}>Good morning!</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>LVL 3</Text>
            <Text style={styles.levelSubText}>24 XP</Text>
          </View>
        </View>

        <Card style={styles.whatsOnCard}>
          <Text style={styles.sectionTitle}>✨ What's On</Text>
          <Text style={styles.sectionSubtitle}>AI summary coming soon.</Text>
        </Card>

        <Card style={styles.placeholderCard}>
          <Text style={styles.sectionTitle}>Today's Schedule</Text>
          {todaysEvents.length === 0 ? (
            <Text style={styles.sectionSubtitle}>
              No events yet. Tap + to add one.
            </Text>
          ) : (
            todaysEvents.map((evt) => (
              <TouchableOpacity
                key={evt.id}
                style={styles.eventRow}
                onPress={() => {
                  setSelectedId(evt.id);
                  setDetailVisible(true);
                }}
              >
                <View>
                  <Text style={styles.eventTitle}>{evt.title}</Text>
                  <Text style={styles.eventMeta}>
                    {formatTimeRange(evt.start, evt.end)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </Card>
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
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eventTitle: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: typography.medium as any,
  },
  eventMeta: {
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

