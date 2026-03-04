import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useEvents } from '../../context/EventsContext';
import { CalendarEvent, EventCategory } from '../../types/event';
import { formatTimeRange } from '../../utils/dateUtils';
import { FilterModal } from '../../components/modals/FilterModal';
import { QuickAddModal, ParsedEventDraft } from '../../components/modals/QuickAddModal';
import { EventConfirmationModal } from '../../components/modals/EventConfirmationModal';
import { EventDetailModal } from '../../components/modals/EventDetailModal';

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10);

export const CalendarView: React.FC = () => {
  const { events, addEvent, updateEvent, deleteEvent } = useEvents();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterVisible, setFilterVisible] = useState(false);
  const [categories, setCategories] = useState<EventCategory[]>([
    'work',
    'personal',
    'health',
    'social',
    'errands',
    'hobbies',
  ]);
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [confirmationDraft, setConfirmationDraft] = useState<ParsedEventDraft | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredEvents = events.filter((evt) => categories.includes(evt.category));

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    filteredEvents.forEach((evt) => {
      const key = formatDateKey(evt.start);
      if (!marks[key]) {
        marks[key] = { marked: true, dots: [{ color: colors.primary }] };
      }
    });
    const selectedKey = formatDateKey(selectedDate);
    marks[selectedKey] = {
      ...(marks[selectedKey] || {}),
      selected: true,
      selectedColor: colors.primary,
    };
    return marks;
  }, [filteredEvents, selectedDate]);

  const dayEvents: CalendarEvent[] = filteredEvents.filter(
    (evt) => formatDateKey(evt.start) === formatDateKey(selectedDate),
  );

  const selectedEvent = dayEvents.find((e) => e.id === selectedId) ?? null;

  const handleDayPress = (day: DateData) => {
    setSelectedDate(new Date(day.dateString));
  };

  const handleToggleCategory = (cat: EventCategory) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    );
  };

  const handleParsed = (draft: ParsedEventDraft) => {
    setConfirmationDraft(draft);
  };

  const handleConfirm = (base: Omit<CalendarEvent, 'id'>) => {
    addEvent(base);
    setConfirmationDraft(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Calendar</Text>
        <TouchableOpacity onPress={() => setFilterVisible(true)}>
          <Text style={styles.filterText}>Filter ▾</Text>
        </TouchableOpacity>
      </View>
      <Calendar
        markedDates={markedDates}
        onDayPress={handleDayPress}
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.surface,
          dayTextColor: colors.textPrimary,
          monthTextColor: colors.textPrimary,
          arrowColor: colors.primary,
        }}
        style={styles.calendar}
      />
      <ScrollView style={styles.eventsContainer}>
        {dayEvents.length === 0 ? (
          <Text style={styles.subtitle}>No events for this day.</Text>
        ) : (
          dayEvents.map((evt) => (
            <TouchableOpacity
              key={evt.id}
              style={styles.eventRow}
              onPress={() => {
                setSelectedId(evt.id);
                setDetailVisible(true);
              }}
            >
              <Text style={styles.eventTitle}>{evt.title}</Text>
              <Text style={styles.eventMeta}>
                {formatTimeRange(evt.start, evt.end)}
              </Text>
            </TouchableOpacity>
          ))
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
      <FilterModal
        visible={filterVisible}
        selected={categories}
        onToggle={handleToggleCategory}
        onClose={() => setFilterVisible(false)}
      />
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  heading: {
    fontSize: typography.h1,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
  },
  subtitle: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    color: colors.textSecondary,
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: typography.body,
  },
  calendar: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.large,
    overflow: 'hidden',
  },
  eventsContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
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

