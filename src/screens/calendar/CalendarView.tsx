import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutChangeEvent,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { LinearGradient } from 'expo-linear-gradient';
import { addDays, addMonths, addWeeks, endOfWeek, format, startOfWeek } from 'date-fns';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useEvents } from '../../context/EventsContext';
import { CalendarEvent, EventCategory } from '../../types/event';
import { formatTimeRange } from '../../utils/dateUtils';
import { FilterModal } from '../../components/modals/FilterModal';
import { QuickAddModal, ParsedEventDraft } from '../../components/modals/QuickAddModal';
import { EventConfirmationModal } from '../../components/modals/EventConfirmationModal';
import { NewTaskModal } from '../../components/modals/NewTaskModal';

const formatDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

type CalendarMode = 'day' | 'week' | 'month';

const CATEGORY_COLORS: Record<EventCategory, string> = {
  work: colors.categoryWork,
  personal: colors.categoryPersonal,
  health: colors.categoryHealth,
  social: colors.categorySocial,
  errands: colors.categoryErrands,
  hobbies: colors.categoryHobbies,
};

const PRIORITY_BORDER: Record<string, string> = {
  high:   colors.error,
  medium: colors.warning,
  low:    colors.textTertiary,
};

export const CalendarView: React.FC = () => {
  const { events, addEvent, updateEvent, deleteEvent, toggleComplete } = useEvents();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mode, setMode] = useState<CalendarMode>('day');
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
  // Single modal state for both create (event=null) and edit (event=CalendarEvent)
  const [taskModal, setTaskModal] = useState<{ visible: boolean; event: CalendarEvent | null }>({
    visible: false,
    event: null,
  });
  const [timelineWidth, setTimelineWidth] = useState(0);

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


  const handleDayPress = (day: DateData) => {
    setSelectedDate(new Date(day.dateString));
    setMode('day');
  };

  const handleCategoriesChange = (next: EventCategory[]) => setCategories(next);

  const handleParsed = (draft: ParsedEventDraft) => {
    setConfirmationDraft(draft);
  };

  const handleConfirm = (base: Omit<CalendarEvent, 'id'>) => {
    addEvent(base);
    setConfirmationDraft(null);
  };

  const isViewingToday = formatDateKey(selectedDate) === formatDateKey(new Date());

  const goToday = () => setSelectedDate(new Date());

  const headerRangeLabel = useMemo(() => {
    if (mode === 'month') return format(selectedDate, 'MMMM yyyy');
    if (mode === 'week') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
      return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
    }
    return format(selectedDate, 'EEEE, MMMM d');
  }, [mode, selectedDate]);

  const goPrev = () => {
    setSelectedDate((d) => {
      if (mode === 'month') return addMonths(d, -1);
      if (mode === 'week') return addWeeks(d, -1);
      return addDays(d, -1);
    });
  };

  const goNext = () => {
    setSelectedDate((d) => {
      if (mode === 'month') return addMonths(d, 1);
      if (mode === 'week') return addWeeks(d, 1);
      return addDays(d, 1);
    });
  };

  const handleTimelineLayout = (e: LayoutChangeEvent) => {
    setTimelineWidth(e.nativeEvent.layout.width);
  };

  const dayTimeline = useMemo(() => {
    const startHour = 6;
    const endHour = 24;
    const hourHeight = 64;
    const pxPerMinute = hourHeight / 60;
    const gutterWidth = 56;
    const gap = 8;

    const todays = dayEvents
      .slice()
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .filter((evt) => {
        // Clamp to timeline hours
        const h = evt.end.getHours() + evt.end.getMinutes() / 60;
        return h >= startHour;
      });

    type Placed = {
      evt: CalendarEvent;
      top: number;
      height: number;
      col: number;
      cols: number;
    };

    // Build overlap clusters and assign columns greedily
    const placed: Placed[] = [];
    const clusters: CalendarEvent[][] = [];
    let cluster: CalendarEvent[] = [];
    let clusterEnd = -Infinity;
    for (const evt of todays) {
      const s = evt.start.getTime();
      const e = evt.end.getTime();
      if (cluster.length === 0) {
        cluster = [evt];
        clusterEnd = e;
      } else if (s < clusterEnd) {
        cluster.push(evt);
        clusterEnd = Math.max(clusterEnd, e);
      } else {
        clusters.push(cluster);
        cluster = [evt];
        clusterEnd = e;
      }
    }
    if (cluster.length) clusters.push(cluster);

    for (const c of clusters) {
      const cols: { endMs: number }[] = [];
      const assignments = new Map<string, number>();
      for (const evt of c) {
        const sMs = evt.start.getTime();
        const eMs = evt.end.getTime();
        let idx = cols.findIndex((col) => col.endMs <= sMs);
        if (idx === -1) {
          idx = cols.length;
          cols.push({ endMs: eMs });
        } else {
          cols[idx].endMs = eMs;
        }
        assignments.set(evt.id, idx);
      }

      const colCount = Math.max(1, cols.length);
      for (const evt of c) {
        const startMinutes = evt.start.getHours() * 60 + evt.start.getMinutes();
        const endMinutes = evt.end.getHours() * 60 + evt.end.getMinutes();
        const clampStart = Math.max(startHour * 60, startMinutes);
        const clampEnd = Math.min(endHour * 60, Math.max(clampStart + 10, endMinutes));
        const top = (clampStart - startHour * 60) * pxPerMinute;
        const height = Math.max(28, (clampEnd - clampStart) * pxPerMinute);
        placed.push({
          evt,
          top,
          height,
          col: assignments.get(evt.id) ?? 0,
          cols: colCount,
        });
      }
    }

    const contentHeight = (endHour - startHour) * hourHeight;
    const availableWidth = Math.max(0, timelineWidth - gutterWidth);

    const blocks = placed.map((p) => {
      const w =
        p.cols <= 1
          ? availableWidth
          : Math.max(0, (availableWidth - gap * (p.cols - 1)) / p.cols);
      const left = gutterWidth + p.col * (w + gap);
      return { ...p, left, width: w };
    });

    const now = new Date();
    const isToday = formatDateKey(now) === formatDateKey(selectedDate);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const nowY = (nowMinutes - startHour * 60) * pxPerMinute;

    return {
      startHour,
      endHour,
      hourHeight,
      gutterWidth,
      contentHeight,
      blocks,
      showNow: isToday && nowMinutes >= startHour * 60 && nowMinutes <= endHour * 60,
      nowY,
    };
  }, [dayEvents, selectedDate, timelineWidth]);

  const monthEventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const evt of filteredEvents) {
      const key = formatDateKey(evt.start);
      const prev = map.get(key) ?? [];
      prev.push(evt);
      map.set(key, prev);
    }
    return map;
  }, [filteredEvents]);

  const renderModeSwitcher = () => {
    const Seg = ({ value, label }: { value: CalendarMode; label: string }) => {
      const active = mode === value;
      return (
        <TouchableOpacity
          onPress={() => setMode(value)}
          style={[styles.seg, active && styles.segActive]}
        >
          <Text style={[styles.segText, active && styles.segTextActive]}>{label}</Text>
        </TouchableOpacity>
      );
    };

    return (
      <View style={styles.segWrap}>
        <Seg value="day" label="Day" />
        <Seg value="week" label="Week" />
        <Seg value="month" label="Month" />
      </View>
    );
  };

  const renderDateNav = () => (
    <View style={styles.navRow}>
      <TouchableOpacity style={styles.navBtn} onPress={goPrev} accessibilityRole="button">
        <Text style={styles.navIcon}>‹</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={goToday} disabled={isViewingToday}>
        <Text style={[styles.navLabel, isViewingToday && styles.navLabelToday]}>
          {headerRangeLabel}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.navBtn} onPress={goNext} accessibilityRole="button">
        <Text style={styles.navIcon}>›</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMonth = () => (
    <Calendar
      current={formatDateKey(selectedDate)}
      markedDates={markedDates}
      onDayPress={handleDayPress}
      hideExtraDays={false}
      firstDay={0}
      enableSwipeMonths
      theme={{
        backgroundColor: 'transparent',
        calendarBackground: 'transparent',
        dayTextColor: colors.textSecondary,
        monthTextColor: colors.textPrimary,
        textDayFontSize: typography.caption,
        textMonthFontSize: typography.body,
        textMonthFontWeight: typography.semibold as any,
        arrowColor: colors.textSecondary,
        todayTextColor: colors.textPrimary,
        'stylesheet.calendar.header': {
          header: { height: 0, opacity: 0 },
        },
      }}
      dayComponent={({ date }: { date?: DateData }) => {
        if (!date) return <View />;
        const d = new Date(date.dateString);
        const key = formatDateKey(d);
        const isSelected = key === formatDateKey(selectedDate);
        const day = d.getDate();
        const evts = monthEventsByDay.get(key) ?? [];
        const uniqueCats = Array.from(new Set(evts.map((e) => e.category)));

        const dots = uniqueCats.slice(0, 3).map((c) => (
          <View key={c} style={[styles.monthDot, { backgroundColor: CATEGORY_COLORS[c] }]} />
        ));
        const overflow = uniqueCats.length > 3 ? uniqueCats.length - 3 : 0;

        return (
          <TouchableOpacity
            style={[styles.monthCell, isSelected && styles.monthCellSelected]}
            onPress={() => {
              setSelectedDate(d);
              setMode('day');
            }}
          >
            <Text style={[styles.monthDay, isSelected && styles.monthDaySelected]}>
              {day}
            </Text>
            <View style={styles.monthDotsRow}>
              {dots}
              {overflow > 0 ? (
                <Text style={styles.monthOverflow}>•••</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        );
      }}
      style={styles.monthCalendar}
    />
  );

  const renderDay = () => (
    <ScrollView
      style={styles.timelineScroll}
      contentContainerStyle={{ paddingBottom: 96 }}
      onLayout={handleTimelineLayout}
    >
      {dayEvents.length === 0 && (
        <View style={styles.emptyDay}>
          <Text style={styles.emptyDayIcon}>📅</Text>
          <Text style={styles.emptyDayTitle}>No events</Text>
          <Text style={styles.emptyDaySubtitle}>Tap + to add something</Text>
        </View>
      )}
      <View style={[styles.timeline, { height: dayTimeline.contentHeight }]}>
        {Array.from({ length: dayTimeline.endHour - dayTimeline.startHour }).map((_, i) => {
          const hour = dayTimeline.startHour + i;
          const top = i * dayTimeline.hourHeight;
          const label = format(new Date(0, 0, 0, hour, 0), 'ha').toLowerCase();
          const isNowHour =
            dayTimeline.showNow &&
            Math.floor((dayTimeline.nowY ?? 0) / dayTimeline.hourHeight) === i;

          return (
            <View key={hour} style={[styles.hourRow, { top, height: dayTimeline.hourHeight }]}>
              <Text style={[styles.hourLabel, isNowHour && styles.hourLabelNow]}>
                {label}
              </Text>
              <View style={styles.hourLine} />
            </View>
          );
        })}

        {dayTimeline.showNow ? (
          <View style={[styles.nowLineWrap, { top: dayTimeline.nowY }]}>
            <View style={styles.nowDot} />
            <View style={styles.nowLine} />
          </View>
        ) : null}

        {dayTimeline.blocks.map((b) => {
          const catColor = CATEGORY_COLORS[b.evt.category];
          const isCompleted = !!b.evt.completed;
          const showPriorityDot = !isCompleted && b.evt.priority === 'high';
          return (
            <TouchableOpacity
              key={b.evt.id}
              style={[
                styles.block,
                {
                  top: b.top,
                  left: b.left,
                  height: b.height,
                  width: b.width,
                  borderLeftColor: catColor,
                },
                isCompleted && styles.blockCompleted,
              ]}
              activeOpacity={0.85}
              onPress={() => setTaskModal({ visible: true, event: b.evt })}
              onLongPress={() => toggleComplete(b.evt.id)}
            >
              <View style={styles.blockInner}>
                <Text
                  style={[styles.blockTitle, isCompleted && styles.blockTitleCompleted]}
                  numberOfLines={1}
                >
                  {isCompleted ? '✓ ' : ''}{b.evt.title}
                </Text>
                {b.height > 36 && (
                  <Text style={styles.blockMeta}>{formatTimeRange(b.evt.start, b.evt.end)}</Text>
                )}
              </View>
              {showPriorityDot && <View style={styles.blockPriorityDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderWeek = () => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const days = Array.from({ length: 7 }).map((_, i) => addDays(start, i));
    const dayKey = formatDateKey(selectedDate);
    const selectedEvents = filteredEvents
      .filter((e) => formatDateKey(e.start) === dayKey)
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    return (
      <View style={styles.weekWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekStrip}>
          {days.map((d) => {
            const key = formatDateKey(d);
            const active = key === dayKey;
            const hasEvents = (monthEventsByDay.get(key) ?? []).length > 0;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.weekDayPill, active && styles.weekDayPillActive]}
                onPress={() => setSelectedDate(d)}
              >
                <Text style={[styles.weekDow, active && styles.weekDowActive]}>
                  {format(d, 'EEE')}
                </Text>
                <Text style={[styles.weekDom, active && styles.weekDomActive]}>
                  {format(d, 'd')}
                </Text>
                {hasEvents ? <View style={styles.weekDot} /> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView style={styles.weekList} contentContainerStyle={{ paddingBottom: 96 }}>
          {selectedEvents.length === 0 ? (
            <View style={styles.emptyDay}>
              <Text style={styles.emptyDayIcon}>📅</Text>
              <Text style={styles.emptyDayTitle}>No events</Text>
              <Text style={styles.emptyDaySubtitle}>Tap + to add something</Text>
            </View>
          ) : (
            selectedEvents.map((evt) => {
              const isCompleted = !!evt.completed;
              return (
                <TouchableOpacity
                  key={evt.id}
                  style={[styles.weekRow, isCompleted && styles.weekRowCompleted]}
                  onPress={() => setTaskModal({ visible: true, event: evt })}
                  onLongPress={() => toggleComplete(evt.id)}
                >
                  <View style={[styles.weekRowStripe, { backgroundColor: CATEGORY_COLORS[evt.category] }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.weekRowTitle, isCompleted && styles.weekRowTitleCompleted]}>
                      {isCompleted ? '✓  ' : ''}{evt.title}
                    </Text>
                    <Text style={styles.weekRowMeta}>{formatTimeRange(evt.start, evt.end)}</Text>
                  </View>
                  {evt.priority === 'high' && !isCompleted && (
                    <View style={styles.weekPriorityDot} />
                  )}
                  <TouchableOpacity
                    style={[styles.weekCheckbox, isCompleted && styles.weekCheckboxDone]}
                    onPress={() => toggleComplete(evt.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {isCompleted && <View style={styles.weekCheckmark} />}
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#070A12', '#0A0E1A', '#0A0E1A', '#0B3A33']}
        locations={[0, 0.25, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.headerRow}>
        <Text style={styles.heading}>Calendar</Text>
        <TouchableOpacity style={styles.filterPill} onPress={() => setFilterVisible(true)}>
          <Text style={styles.filterIcon}>⎇</Text>
          <Text style={styles.filterPillText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {renderModeSwitcher()}
      {renderDateNav()}

      <View style={styles.content}>
        {mode === 'month' ? renderMonth() : null}
        {mode === 'day' ? renderDay() : null}
        {mode === 'week' ? renderWeek() : null}
      </View>

      {!isViewingToday && (
        <TouchableOpacity style={styles.todayPill} onPress={goToday}>
          <Text style={styles.todayPillText}>Today</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setTaskModal({ visible: true, event: null })}
        accessibilityRole="button"
        accessibilityLabel="Add new event"
      >
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>
      <FilterModal
        visible={filterVisible}
        selected={categories}
        onChange={handleCategoriesChange}
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
      <NewTaskModal
        visible={taskModal.visible}
        onClose={() => setTaskModal({ visible: false, event: null })}
        defaultDate={selectedDate}
        event={taskModal.event}
        onSave={updateEvent}
        onDelete={(id) => {
          deleteEvent(id);
          setTaskModal({ visible: false, event: null });
        }}
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
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: borderRadius.large,
    backgroundColor: 'rgba(26,31,46,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(45,53,72,0.9)',
  },
  filterIcon: {
    color: colors.textSecondary,
    fontSize: typography.caption,
  },
  filterPillText: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    fontWeight: typography.medium as any,
  },

  segWrap: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    borderRadius: borderRadius.large,
    backgroundColor: 'rgba(26,31,46,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(45,53,72,0.9)',
    padding: 6,
    gap: 6,
  },
  seg: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  segActive: {
    backgroundColor: 'rgba(0,191,166,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(0,191,166,0.35)',
  },
  segText: {
    color: colors.textSecondary,
    fontWeight: typography.semibold as any,
  },
  segTextActive: {
    color: colors.primary,
  },

  navRow: {
    marginTop: spacing.md,
    marginHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(26,31,46,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(45,53,72,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    color: colors.textSecondary,
    fontSize: 18,
    marginTop: -2,
  },
  navLabel: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: typography.semibold as any,
  },

  content: {
    flex: 1,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  monthCalendar: {
    borderRadius: borderRadius.large,
    overflow: 'hidden',
  },
  monthCell: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.medium,
    backgroundColor: 'rgba(26,31,46,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(45,53,72,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  monthCellSelected: {
    borderColor: 'rgba(0,191,166,0.8)',
    backgroundColor: 'rgba(0,191,166,0.14)',
  },
  monthDay: {
    color: colors.textPrimary,
    fontSize: typography.caption,
    fontWeight: typography.semibold as any,
  },
  monthDaySelected: {
    color: colors.textPrimary,
  },
  monthDotsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
    alignItems: 'center',
    height: 10,
  },
  monthDot: {
    width: 5,
    height: 5,
    borderRadius: borderRadius.round,
  },
  monthOverflow: {
    color: colors.textSecondary,
    fontSize: 10,
    marginTop: -2,
  },

  timelineScroll: {
    flex: 1,
  },
  timeline: {
    position: 'relative',
    borderRadius: borderRadius.large,
    overflow: 'hidden',
    backgroundColor: 'rgba(26,31,46,0.28)',
    borderWidth: 1,
    borderColor: 'rgba(45,53,72,0.75)',
  },
  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 10,
  },
  hourLabel: {
    width: 56,
    textAlign: 'left',
    paddingLeft: 12,
    color: 'rgba(176,184,201,0.35)',
    fontSize: typography.tiny,
    fontWeight: typography.semibold as any,
  },
  hourLabelNow: {
    color: colors.primary,
  },
  hourLine: {
    flex: 1,
    height: 1,
    marginTop: 8,
    backgroundColor: 'rgba(45,53,72,0.35)',
  },
  nowLineWrap: {
    position: 'absolute',
    left: 56,
    right: 0,
    height: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nowDot: {
    width: 6,
    height: 6,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  nowLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0,191,166,0.65)',
  },
  block: {
    position: 'absolute',
    borderRadius: borderRadius.large,
    backgroundColor: 'rgba(26,31,46,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(45,53,72,0.85)',
    borderLeftWidth: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
  },
  blockTitle: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: typography.semibold as any,
  },
  blockMeta: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: typography.tiny,
  },

  weekWrap: {
    flex: 1,
  },
  weekStrip: {
    maxHeight: 76,
    marginBottom: spacing.md,
  },
  weekDayPill: {
    width: 72,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    borderRadius: borderRadius.large,
    backgroundColor: 'rgba(26,31,46,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(45,53,72,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekDayPillActive: {
    borderColor: 'rgba(0,191,166,0.8)',
    backgroundColor: 'rgba(0,191,166,0.14)',
  },
  weekDow: {
    color: colors.textSecondary,
    fontSize: typography.tiny,
    fontWeight: typography.semibold as any,
  },
  weekDowActive: {
    color: colors.primary,
  },
  weekDom: {
    marginTop: 4,
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: typography.bold as any,
  },
  weekDomActive: {
    color: colors.textPrimary,
  },
  weekDot: {
    marginTop: 6,
    width: 5,
    height: 5,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
  },
  weekList: {
    flex: 1,
  },
  emptyText: {
    color: colors.textSecondary,
    paddingVertical: spacing.md,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.large,
    backgroundColor: 'rgba(26,31,46,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(45,53,72,0.75)',
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  weekRowStripe: {
    width: 4,
    height: 36,
    borderRadius: borderRadius.round,
  },
  weekRowTitle: {
    color: colors.textPrimary,
    fontSize: typography.body,
    fontWeight: typography.semibold as any,
  },
  weekRowMeta: {
    marginTop: 2,
    color: colors.textSecondary,
    fontSize: typography.tiny,
  },

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
  fabIcon: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 32,
  },

  // Today pill
  todayPill: {
    position: 'absolute',
    bottom: spacing.xl + 64,
    alignSelf: 'center',
    left: '50%',
    marginLeft: -32,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.large,
  },
  todayPillText: {
    color: colors.primary,
    fontSize: typography.caption,
    fontWeight: typography.semibold,
  },

  // navLabel today highlight
  navLabelToday: {
    color: colors.primary,
  },

  // Empty day state
  emptyDay: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyDayIcon: { fontSize: 36 },
  emptyDayTitle: {
    fontSize: typography.h3,
    fontWeight: typography.semibold,
    color: colors.textSecondary,
  },
  emptyDaySubtitle: {
    fontSize: typography.caption,
    color: colors.textTertiary,
  },

  // Block completion state
  blockCompleted: {
    opacity: 0.45,
    borderLeftColor: colors.textTertiary,
  },
  blockInner: {
    flex: 1,
  },
  blockTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  blockPriorityDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.error,
  },

  // Week row completion state
  weekRowCompleted: {
    opacity: 0.5,
  },
  weekRowTitleCompleted: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  weekPriorityDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.error,
    alignSelf: 'center',
    marginRight: spacing.sm,
  },
  weekCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekCheckboxDone: {
    borderColor: colors.success,
    backgroundColor: colors.success + '20',
  },
  weekCheckmark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
  },
});

