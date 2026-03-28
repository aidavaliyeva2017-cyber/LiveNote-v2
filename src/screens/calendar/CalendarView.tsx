import React, { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutChangeEvent,
  ActivityIndicator,
} from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { addDays, addMonths, addWeeks, endOfWeek, format, startOfWeek } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useEvents } from '../../context/EventsContext';
import { useColors } from '../../context/ThemeContext';
import { useFamily } from '../../context/FamilyContext';
import { useNativeCalendar } from '../../context/NativeCalendarContext';
import { useUntis } from '../../context/UntisContext';
import { CalendarEvent, EventCategory } from '../../types/event';
import { DisplayEvent, MEMBER_COLORS } from '../../types/family';
import { formatTimeRange } from '../../utils/dateUtils';
import { Linking } from 'react-native';
import {
  formatUntisTime,
  fromUntisDate,
  getSubjectColor,
  toUntisDate,
} from '../../services/untisService';
import { FilterModal } from '../../components/modals/FilterModal';
import { QuickAddModal, ParsedEventDraft } from '../../components/modals/QuickAddModal';
import { EventConfirmationModal } from '../../components/modals/EventConfirmationModal';
import { NewTaskModal } from '../../components/modals/NewTaskModal';

const formatDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

type CalendarMode = 'day' | 'week' | 'month';
type SourceFilter = 'mine' | 'apple' | 'family' | 'all';
type CalendarSection = 'daily' | 'school';

export const CalendarView: React.FC = () => {
  const { events, addEvent, updateEvent, deleteEvent, toggleComplete } = useEvents();
  const { family, members, sharedEvents } = useFamily();
  const { events: nativeEvents, permissionState, requestPermission, refresh: refreshNative } = useNativeCalendar();
  const { connected: untisConnected, timetable, subjectColorMap, loading: untisLoading, fetchTimetable } = useUntis();
  const c = useColors();

  const CATEGORY_COLORS: Record<EventCategory, string> = {
    work: c.categoryWork,
    personal: c.categoryPersonal,
    health: c.categoryHealth,
    social: c.categorySocial,
    errands: c.categoryErrands,
    hobbies: c.categoryHobbies,
  };

  const PRIORITY_BORDER: Record<string, string> = {
    high:   c.error,
    medium: c.warning,
    low:    c.textTertiary,
  };
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [mode, setMode] = useState<CalendarMode>('day');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
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
  const [permissionDismissed, setPermissionDismissed] = useState(false);
  const [section, setSection] = useState<CalendarSection>('daily');

  // Refresh native calendar + Untis timetable whenever this tab gains focus
  useFocusEffect(
    useCallback(() => {
      void refreshNative();
      if (untisConnected) {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        void fetchTimetable(start, addDays(start, 27));
      }
    }, [refreshNative, untisConnected, fetchTimetable, selectedDate]),
  );

  // Convert native calendar events → DisplayEvent
  const nativeDisplayEvents = useMemo<DisplayEvent[]>(() => {
    if (sourceFilter === 'mine' || sourceFilter === 'family') return [];
    return nativeEvents.map((ne) => ({
      id: ne.id,
      title: ne.title,
      description: ne.notes,
      start: ne.start,
      end: ne.end,
      allDay: ne.allDay,
      category: 'personal' as const,
      priority: 'medium' as const,
      completed: false,
      source: 'native' as const,
      calendarName: ne.calendarName,
      calendarColor: ne.calendarColor,
      nativeId: ne.nativeId,
    }));
  }, [nativeEvents, sourceFilter]);

  // Convert shared (family) events to DisplayEvent
  const familyDisplayEvents = useMemo<DisplayEvent[]>(() => {
    if (!family || sourceFilter === 'mine' || sourceFilter === 'apple') return [];
    return sharedEvents.map((se) => {
      const member = members.find((m) => m.memberEmail === se.createdBy);
      return {
        id: se.id,
        title: se.title,
        description: se.description,
        start: new Date(se.start),
        end: new Date(se.end),
        allDay: se.allDay,
        category: se.category,
        priority: se.priority,
        completed: se.completed,
        source: 'family' as const,
        creatorEmail: se.createdBy,
        memberColor: member?.color ?? MEMBER_COLORS[0],
        sharedEventId: se.id,
      };
    });
  }, [sharedEvents, members, family, sourceFilter]);

  const personalDisplayEvents = useMemo<DisplayEvent[]>(() => {
    if (sourceFilter === 'family' || sourceFilter === 'apple') return [];
    return events.map((e) => ({ ...e, source: 'personal' as const }));
  }, [events, sourceFilter]);

  const allDisplayEvents = useMemo<DisplayEvent[]>(
    () => [...personalDisplayEvents, ...familyDisplayEvents, ...nativeDisplayEvents],
    [personalDisplayEvents, familyDisplayEvents, nativeDisplayEvents],
  );

  const filteredEvents = allDisplayEvents.filter((evt) => categories.includes(evt.category));

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    filteredEvents.forEach((evt) => {
      const key = formatDateKey(evt.start);
      if (!marks[key]) {
        marks[key] = { marked: true, dots: [{ color: c.primary }] };
      }
    });
    const selectedKey = formatDateKey(selectedDate);
    marks[selectedKey] = {
      ...(marks[selectedKey] || {}),
      selected: true,
      selectedColor: c.primary,
    };
    return marks;
  }, [filteredEvents, selectedDate, c.primary]);

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
    // Visual offset from the top of each hourRow to where the hourLine actually renders:
    // hourRow.paddingTop(10) + hourLine.marginTop(8) = 18px
    const lineOffset = 18;

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
        const top = (clampStart - startHour * 60) * pxPerMinute + lineOffset;
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
    const nowY = (nowMinutes - startHour * 60) * pxPerMinute + lineOffset;

    return {
      startHour,
      endHour,
      hourHeight,
      lineOffset,
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

  // ── School timetable renderer ─────────────────────────────────────────────
  const renderSchool = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const schoolDays = Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i));
    const selectedKey = toUntisDate(selectedDate);

    const dayLessons = timetable
      .filter((l) => l.date === toUntisDate(selectedDate))
      .sort((a, b) => a.startTime - b.startTime);

    return (
      <View style={styles.schoolWrap}>
        {/* Mon–Fri strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.weekStrip}
        >
          {schoolDays.map((d) => {
            const key = toUntisDate(d);
            const active = key === selectedKey;
            const hasLessons = timetable.some((l) => l.date === key);
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.weekDayPill,
                  active && { borderColor: c.primary + 'CC', backgroundColor: c.primary + '22' },
                ]}
                onPress={() => setSelectedDate(d)}
              >
                <Text style={[styles.weekDow, active && { color: c.primary }]}>
                  {format(d, 'EEE')}
                </Text>
                <Text style={[styles.weekDom, active && styles.weekDomActive]}>
                  {format(d, 'd')}
                </Text>
                {hasLessons && (
                  <View style={[styles.weekDot, { backgroundColor: active ? c.primary : colors.textTertiary }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Lesson list */}
        <ScrollView style={styles.weekList} contentContainerStyle={{ paddingBottom: 96 }}>
          {untisLoading && (
            <View style={styles.schoolLoading}>
              <ActivityIndicator color={c.primary} />
              <Text style={styles.schoolLoadingText}>Loading timetable…</Text>
            </View>
          )}

          {!untisLoading && dayLessons.length === 0 && (
            <View style={styles.emptyDay}>
              <Ionicons name="school-outline" size={36} color={colors.textTertiary} />
              <Text style={styles.emptyDayTitle}>No lessons today</Text>
              <Text style={styles.emptyDaySubtitle}>Enjoy your free day</Text>
            </View>
          )}

          {dayLessons.map((lesson) => {
            const subj = lesson.su[0];
            const teacher = lesson.te[0];
            const room = lesson.ro[0];
            const isCancelled = lesson.code === 'cancelled';
            const isIrregular = lesson.code === 'irregular';
            const hasRoomChange = !isCancelled && !isIrregular && lesson.lstext?.toLowerCase().includes('raum');

            const barColor = isCancelled
              ? c.error
              : isIrregular
              ? c.warning
              : hasRoomChange
              ? c.accentYellow
              : getSubjectColor(subj?.name ?? '', subjectColorMap);

            const timeLabel = `${formatUntisTime(lesson.startTime)} – ${formatUntisTime(lesson.endTime)}`;

            return (
              <View
                key={lesson.id}
                style={[
                  styles.lessonRow,
                  {
                    backgroundColor: barColor + '1A',
                    borderColor: barColor + '44',
                  },
                  isCancelled && styles.lessonCancelled,
                ]}
              >
                <View style={[styles.lessonStripe, { backgroundColor: barColor }]} />
                <View style={styles.lessonBody}>
                  <View style={styles.lessonTop}>
                    <Text
                      style={[
                        styles.lessonSubject,
                        isCancelled && styles.lessonTextCancelled,
                      ]}
                    >
                      {subj?.name ?? '—'}
                    </Text>
                    {isCancelled && (
                      <View style={[styles.lessonBadge, { backgroundColor: c.error + '22', borderColor: c.error + '55' }]}>
                        <Text style={[styles.lessonBadgeText, { color: c.error }]}>Cancelled</Text>
                      </View>
                    )}
                    {isIrregular && (
                      <View style={[styles.lessonBadge, { backgroundColor: c.warning + '22', borderColor: c.warning + '55' }]}>
                        <Text style={[styles.lessonBadgeText, { color: c.warning }]}>Substitution</Text>
                      </View>
                    )}
                    {hasRoomChange && (
                      <View style={[styles.lessonBadge, { backgroundColor: c.accentYellow + '22', borderColor: c.accentYellow + '55' }]}>
                        <Text style={[styles.lessonBadgeText, { color: c.accentYellow }]}>Room change</Text>
                      </View>
                    )}
                  </View>
                  {subj?.longname ? (
                    <Text style={styles.lessonLongname} numberOfLines={1}>{subj.longname}</Text>
                  ) : null}
                  <View style={styles.lessonMeta}>
                    {teacher && (
                      <View style={styles.lessonMetaChip}>
                        <Ionicons name="person-outline" size={11} color={colors.textTertiary} />
                        <Text style={styles.lessonMetaText}>{teacher.name}</Text>
                      </View>
                    )}
                    {room && (
                      <View style={styles.lessonMetaChip}>
                        <Ionicons name="location-outline" size={11} color={colors.textTertiary} />
                        <Text style={styles.lessonMetaText}>{room.name}</Text>
                      </View>
                    )}
                    <View style={styles.lessonMetaChip}>
                      <Ionicons name="time-outline" size={11} color={colors.textTertiary} />
                      <Text style={styles.lessonMetaText}>{timeLabel}</Text>
                    </View>
                  </View>
                  {lesson.lstext ? (
                    <Text style={styles.lessonNote} numberOfLines={2}>{lesson.lstext}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderModeSwitcher = () => {
    const Seg = ({ value, label }: { value: CalendarMode; label: string }) => {
      const active = mode === value;
      return (
        <TouchableOpacity
          onPress={() => setMode(value)}
          style={[styles.seg, active && { backgroundColor: c.primary + '22', borderWidth: 1, borderColor: c.primary + '55' }]}
        >
          <Text style={[styles.segText, active && { color: c.primary }]}>{label}</Text>
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
        <Text style={[styles.navLabel, isViewingToday && { color: c.primary }]}>
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
      } as any}
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
            style={[styles.monthCell, isSelected && { borderColor: c.primary + 'CC', backgroundColor: c.primary + '22' }]}
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
          <Ionicons name="calendar-outline" size={36} color={colors.textTertiary} />
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
            Math.floor(
              Math.max(0, (dayTimeline.nowY ?? 0) - dayTimeline.lineOffset) / dayTimeline.hourHeight
            ) === i;

          return (
            <View key={hour} style={[styles.hourRow, { top, height: dayTimeline.hourHeight }]}>
              <Text style={[styles.hourLabel, isNowHour && { color: c.primary }]}>
                {label}
              </Text>
              <View style={styles.hourLine} />
            </View>
          );
        })}

        {dayTimeline.showNow ? (
          <View style={[styles.nowLineWrap, { top: dayTimeline.nowY }]}>
            <View style={[styles.nowDot, { backgroundColor: c.primary }]} />
            <View style={[styles.nowLine, { backgroundColor: c.primary + 'AA' }]} />
          </View>
        ) : null}

        {dayTimeline.blocks.map((b) => {
          const dEvt = b.evt as DisplayEvent;
          const isFamily = dEvt.source === 'family';
          const isNative = dEvt.source === 'native';
          const isReadOnly = isFamily || isNative;

          const catColor = isNative
            ? (dEvt.calendarColor ?? '#3B82F6')
            : isFamily
            ? (dEvt.memberColor ?? MEMBER_COLORS[0])
            : CATEGORY_COLORS[b.evt.category];

          const isCompleted = !!b.evt.completed;
          const showPriorityDot = !isCompleted && b.evt.priority === 'high' && !isReadOnly;

          const creatorInitials = isFamily
            ? (dEvt.creatorEmail?.split('@')[0]?.slice(0, 2).toUpperCase() ?? '?')
            : null;

          return (
            <TouchableOpacity
              key={b.evt.id}
              style={[
                styles.block,
                isNative && styles.blockNative,
                {
                  top: b.top,
                  left: b.left,
                  height: b.height,
                  width: b.width,
                  backgroundColor: catColor + (isNative ? '20' : '28'),
                  borderColor: catColor + '55',
                  borderLeftColor: catColor,
                },
                isCompleted && styles.blockCompleted,
              ]}
              activeOpacity={isReadOnly ? 1 : 0.85}
              onPress={() => isReadOnly ? undefined : setTaskModal({ visible: true, event: b.evt })}
              onLongPress={() => isReadOnly ? undefined : toggleComplete(b.evt.id)}
            >
              <View style={styles.blockInner}>
                <Text
                  style={[styles.blockTitle, isCompleted && styles.blockTitleCompleted, isNative && styles.blockTitleNative]}
                  numberOfLines={1}
                >
                  {isCompleted ? '✓ ' : ''}{b.evt.title}
                </Text>
                {b.height > 36 && (
                  <Text style={styles.blockMeta}>{formatTimeRange(b.evt.start, b.evt.end)}</Text>
                )}
                {isNative && b.height > 50 && dEvt.calendarName && (
                  <Text style={[styles.blockNativeCal, { color: catColor }]} numberOfLines={1}>
                    {dEvt.calendarName}
                  </Text>
                )}
              </View>
              {showPriorityDot && <View style={styles.blockPriorityDot} />}
              {isNative && (
                <View style={[styles.nativeBadge, { backgroundColor: catColor + '33' }]}>
                  <Ionicons name="calendar-outline" size={9} color={catColor} />
                </View>
              )}
              {creatorInitials && (
                <View style={[styles.creatorBadge, { backgroundColor: catColor }]}>
                  <Text style={styles.creatorBadgeText}>{creatorInitials}</Text>
                </View>
              )}
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
                style={[styles.weekDayPill, active && { borderColor: c.primary + 'CC', backgroundColor: c.primary + '22' }]}
                onPress={() => setSelectedDate(d)}
              >
                <Text style={[styles.weekDow, active && { color: c.primary }]}>
                  {format(d, 'EEE')}
                </Text>
                <Text style={[styles.weekDom, active && styles.weekDomActive]}>
                  {format(d, 'd')}
                </Text>
                {hasEvents ? <View style={[styles.weekDot, { backgroundColor: c.primary }]} /> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView style={styles.weekList} contentContainerStyle={{ paddingBottom: 96 }}>
          {selectedEvents.length === 0 ? (
            <View style={styles.emptyDay}>
              <Ionicons name="calendar-outline" size={36} color={colors.textTertiary} />
              <Text style={styles.emptyDayTitle}>No events</Text>
              <Text style={styles.emptyDaySubtitle}>Tap + to add something</Text>
            </View>
          ) : (
            selectedEvents.map((evt) => {
              const dEvt = evt as DisplayEvent;
              const isFamily = dEvt.source === 'family';
              const isNative = dEvt.source === 'native';
              const isReadOnly = isFamily || isNative;
              const rowColor = isNative
                ? (dEvt.calendarColor ?? '#3B82F6')
                : isFamily
                ? (dEvt.memberColor ?? MEMBER_COLORS[0])
                : CATEGORY_COLORS[evt.category];
              const isCompleted = !!evt.completed;
              const creatorInitials = isFamily
                ? (dEvt.creatorEmail?.split('@')[0]?.slice(0, 2).toUpperCase() ?? '?')
                : null;
              return (
                <TouchableOpacity
                  key={evt.id}
                  style={[
                    styles.weekRow,
                    {
                      backgroundColor: rowColor + '28',
                      borderColor: rowColor + '55',
                    },
                    isCompleted && styles.weekRowCompleted,
                  ]}
                  onPress={() => isReadOnly ? undefined : setTaskModal({ visible: true, event: evt })}
                  onLongPress={() => isReadOnly ? undefined : toggleComplete(evt.id)}
                >
                  <View style={[styles.weekRowStripe, { backgroundColor: rowColor }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.weekRowTitle, isCompleted && styles.weekRowTitleCompleted]}>
                      {isCompleted ? '✓  ' : ''}{evt.title}
                    </Text>
                    <Text style={styles.weekRowMeta}>{formatTimeRange(evt.start, evt.end)}</Text>
                    {(isFamily && creatorInitials) && (
                    <Text style={[styles.weekRowCreator, { color: rowColor }]}>
                      {dEvt.creatorEmail?.split('@')[0]}
                    </Text>
                  )}
                  {isNative && dEvt.calendarName && (
                    <Text style={[styles.weekRowCreator, { color: rowColor }]} numberOfLines={1}>
                      {dEvt.calendarName}
                    </Text>
                  )}
                  </View>
                  {evt.priority === 'high' && !isCompleted && (
                    <View style={styles.weekPriorityDot} />
                  )}
                  {!isReadOnly && (
                    <TouchableOpacity
                      style={[styles.weekCheckbox, isCompleted && { borderColor: c.success, backgroundColor: c.success + '20' }]}
                      onPress={() => toggleComplete(evt.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {isCompleted && <View style={[styles.weekCheckmark, { backgroundColor: c.success }]} />}
                    </TouchableOpacity>
                  )}
                  {isFamily && creatorInitials && (
                    <View style={[styles.weekCreatorBadge, { backgroundColor: rowColor + '33', borderColor: rowColor + '66' }]}>
                      <Text style={[styles.weekCreatorInitials, { color: rowColor }]}>{creatorInitials}</Text>
                    </View>
                  )}
                  {isNative && (
                    <View style={[styles.weekCreatorBadge, { backgroundColor: rowColor + '22', borderColor: rowColor + '55' }]}>
                      <Ionicons name="calendar-outline" size={12} color={rowColor} />
                    </View>
                  )}
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
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Calendar</Text>
        {section === 'daily' && (
          <TouchableOpacity style={styles.filterPill} onPress={() => setFilterVisible(true)}>
            <Text style={styles.filterIcon}>⎇</Text>
            <Text style={styles.filterPillText}>Filter</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Daily / School section switcher — only when Untis is connected */}
      {untisConnected && (
        <View style={styles.sectionSwitcherWrap}>
          {(['daily', 'school'] as CalendarSection[]).map((s) => {
            const active = section === s;
            const label = s === 'daily' ? 'Daily' : 'School';
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setSection(s)}
                style={[
                  styles.sectionSeg,
                  active && { backgroundColor: c.primary + '22', borderWidth: 1, borderColor: c.primary + '55' },
                ]}
              >
                <Text style={[styles.sectionSegText, active && { color: c.primary }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {section === 'school' ? (
        <>
          {renderDateNav()}
          <View style={[styles.content, { paddingTop: spacing.sm }]}>
            {renderSchool()}
          </View>
        </>
      ) : (
        <>
      {renderModeSwitcher()}
      {/* Source filter pills — always visible */}
      <View style={styles.sourceFilterRow}>
        {(
          [
            { key: 'mine',   label: 'Mine' },
            { key: 'apple',  label: 'Apple' },
            ...(family ? [{ key: 'family', label: 'Family' }] : []),
            { key: 'all',    label: 'All' },
          ] as { key: SourceFilter; label: string }[]
        ).map(({ key: f, label }) => {
          const active = sourceFilter === f;
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setSourceFilter(f)}
              style={[
                styles.sourceFilterPill,
                active && { backgroundColor: c.primary + '22', borderColor: c.primary },
              ]}
            >
              {f === 'apple' && (
                <Ionicons
                  name="calendar-outline"
                  size={11}
                  color={active ? c.primary : colors.textSecondary}
                  style={{ marginRight: 3 }}
                />
              )}
              <Text style={[styles.sourceFilterText, active && { color: c.primary }]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Permission banner — shown when undetermined and not dismissed */}
      {permissionState === 'undetermined' && !permissionDismissed && (
        <View style={styles.permBanner}>
          <Ionicons name="calendar-outline" size={18} color={c.primary} />
          <Text style={styles.permBannerText}>
            Zeige Apple Kalender-Termine in LiveNote an
          </Text>
          <TouchableOpacity
            style={[styles.permBannerBtn, { backgroundColor: c.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permBannerBtnText}>Erlauben</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPermissionDismissed(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Denied banner */}
      {permissionState === 'denied' && sourceFilter === 'apple' && (
        <TouchableOpacity
          style={styles.permDeniedBanner}
          onPress={() => Linking.openSettings()}
        >
          <Ionicons name="lock-closed-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.permDeniedText}>
            Kalender-Zugriff verweigert — In Einstellungen aktivieren
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
        </TouchableOpacity>
      )}
      {renderDateNav()}

      <View style={styles.content}>
        {mode === 'month' ? renderMonth() : null}
        {mode === 'day' ? renderDay() : null}
        {mode === 'week' ? renderWeek() : null}
      </View>

      {section === 'daily' && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: c.primary, shadowColor: c.primary }]}
          onPress={() => setTaskModal({ visible: true, event: null })}
          accessibilityRole="button"
          accessibilityLabel="Add new event"
        >
          <Text style={styles.fabIcon}>＋</Text>
        </TouchableOpacity>
      )}
      </>
      )}
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
    backgroundColor: 'transparent',
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
    borderWidth: 1,
    borderLeftWidth: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    // backgroundColor and borderColor are set inline per category
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
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.md,
    // backgroundColor and borderColor are set inline per category
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

  // Daily / School section switcher
  sectionSwitcherWrap: {
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
  sectionSeg: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.medium,
    alignItems: 'center',
  },
  sectionSegText: {
    color: colors.textSecondary,
    fontWeight: typography.semibold as any,
    fontSize: typography.body,
  },

  // School timetable
  schoolWrap: { flex: 1 },
  schoolLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  schoolLoadingText: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },

  lessonRow: {
    flexDirection: 'row',
    borderRadius: borderRadius.large,
    borderWidth: 1,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    minHeight: 72,
  },
  lessonCancelled: {
    opacity: 0.6,
  },
  lessonStripe: {
    width: 4,
    flexShrink: 0,
  },
  lessonBody: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  lessonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  lessonSubject: {
    fontSize: typography.h3,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
  },
  lessonTextCancelled: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  lessonLongname: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  lessonBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
    borderWidth: 1,
  },
  lessonBadgeText: {
    fontSize: typography.tiny,
    fontWeight: typography.semibold as any,
  },
  lessonMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 2,
  },
  lessonMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  lessonMetaText: {
    fontSize: typography.tiny,
    color: colors.textTertiary,
  },
  lessonNote: {
    fontSize: typography.tiny,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },

  // Source filter
  sourceFilterRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  sourceFilterPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.round,
    backgroundColor: 'rgba(26,31,46,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(45,53,72,0.9)',
  },
  sourceFilterText: {
    fontSize: typography.caption,
    fontWeight: typography.semibold as any,
    color: colors.textSecondary,
  },

  // Permission banners
  permBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: 'rgba(26,31,46,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(45,53,72,0.9)',
    borderRadius: borderRadius.large,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  permBannerText: {
    flex: 1,
    fontSize: typography.tiny,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  permBannerBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.medium,
  },
  permBannerBtnText: {
    fontSize: typography.tiny,
    fontWeight: typography.semibold as any,
    color: '#fff',
  },
  permDeniedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: 'rgba(26,31,46,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(45,53,72,0.7)',
    borderRadius: borderRadius.large,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  permDeniedText: {
    flex: 1,
    fontSize: typography.tiny,
    color: colors.textSecondary,
  },

  // Native event block style
  blockNative: {
    borderStyle: 'dashed',
  },
  blockTitleNative: {
    fontSize: typography.caption,
    fontWeight: typography.medium as any,
  },
  blockNativeCal: {
    fontSize: typography.tiny,
    marginTop: 1,
    opacity: 0.8,
  },
  nativeBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Creator badge on day-view block
  creatorBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorBadgeText: {
    fontSize: 8,
    fontWeight: typography.bold as any,
    color: '#fff',
  },

  // Creator info on week-view row
  weekRowCreator: {
    fontSize: typography.tiny,
    marginTop: 2,
    fontWeight: typography.medium as any,
  },
  weekCreatorBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekCreatorInitials: {
    fontSize: typography.tiny,
    fontWeight: typography.bold as any,
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

