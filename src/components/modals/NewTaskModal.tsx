import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, startOfDay } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { CalendarEvent, EventCategory, EventPriority } from '../../types/event';
import { useEvents } from '../../context/EventsContext';
import { CustomCalendarView } from './CustomCalendarView';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  defaultDate?: Date;
  event?: CalendarEvent | null;
  onSave?: (id: string, patch: Partial<CalendarEvent>) => void;
  onDelete?: (id: string) => void;
}

type AppMode        = 'event' | 'reminder';
type TimePickerMode = 'startTime' | 'endTime' | 'reminderTime' | null;
type DatePickerTarget = 'start' | 'end' | 'reminder' | 'repeatEnd' | 'reminderRepeatEnd' | null;

interface OptionSheetConfig {
  title: string;
  options: string[];
  current: string;
  onSelect: (value: string) => void;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CATEGORY_META: { key: EventCategory; label: string; color: string }[] = [
  { key: 'work',     label: 'Work',     color: colors.categoryWork },
  { key: 'personal', label: 'Personal', color: colors.categoryPersonal },
  { key: 'health',   label: 'Health',   color: colors.categoryHealth },
  { key: 'social',   label: 'Social',   color: colors.categorySocial },
  { key: 'errands',  label: 'Errands',  color: colors.categoryErrands },
  { key: 'hobbies',  label: 'Hobbies',  color: colors.categoryHobbies },
];

const PRIORITY_META: { key: EventPriority; label: string; color: string }[] = [
  { key: 'high',   label: 'High',   color: colors.error },
  { key: 'medium', label: 'Medium', color: colors.accentYellow },
  { key: 'low',    label: 'Low',    color: colors.info },
];

const TRAVEL_TIME_OPTIONS    = ['Ohne', '5 Min', '10 Min', '15 Min', '30 Min', '1 Std', '2 Std'];
const REPEAT_OPTIONS         = ['Nie', 'Täglich', 'Wöchentlich', 'Alle 2 Wochen', 'Monatlich', 'Jährlich', 'Benutzerdefiniert'];
const CUSTOM_INTERVAL_OPTIONS = ['Jeden Tag', 'Jede Woche', 'Alle 2 Wochen', 'Jeden Monat', 'Jedes Jahr'];
const ALERT_OPTIONS       = [
  'Ohne', 'Zum Zeitpunkt', '5 Min vorher', '10 Min vorher',
  '15 Min vorher', '30 Min vorher', '1 Std vorher', '2 Std vorher', '1 Tag vorher',
];

const MIN_DURATION_MS = 5 * 60_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WEEKDAYS_DE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTHS_DE   = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

function applyTime(date: Date, time: Date): Date {
  const d = new Date(date);
  d.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return d;
}

function makeTime(h: number, m: number): Date {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function formatRelativeDate(date: Date): string {
  const today = startOfDay(new Date());
  const diff  = Math.round((startOfDay(date).getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return 'Heute';
  if (diff === 1) return 'Morgen';
  return `${WEEKDAYS_DE[date.getDay()]}., ${date.getDate()}. ${MONTHS_DE[date.getMonth()]}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const NewTaskModal: React.FC<Props> = ({
  visible,
  onClose,
  defaultDate,
  event,
  onSave,
  onDelete,
}) => {
  const { addEvent } = useEvents();
  const isEditMode = !!event;

  // ── Mode ──
  const [appMode, setAppMode] = useState<AppMode>('event');

  // ── Shared ──
  const [title, setTitle]       = useState('');
  const [category, setCategory] = useState<EventCategory>('work');
  const [priority, setPriority] = useState<EventPriority>('medium');

  // ── Event fields ──
  const [location, setLocation]     = useState('');
  const [allDay, setAllDay]         = useState(false);
  const [startDate, setStartDate]   = useState<Date>(startOfDay(defaultDate ?? new Date()));
  const [startTime, setStartTime]   = useState<Date>(makeTime(12, 0));
  const [endDate, setEndDate]       = useState<Date>(startOfDay(defaultDate ?? new Date()));
  const [endTime, setEndTime]       = useState<Date>(makeTime(13, 0));
  const [travelTime, setTravelTime] = useState('Ohne');
  const [repeat, setRepeat]         = useState('Nie');
  const [eventAlert, setEventAlert] = useState('Ohne');

  // ── Reminder fields ──
  const [reminderNotes, setReminderNotes]     = useState('');
  const [reminderUrl, setReminderUrl]         = useState('');
  const [reminderDate, setReminderDate]       = useState<Date>(startOfDay(defaultDate ?? new Date()));
  const [hasReminderTime, setHasReminderTime] = useState(false);
  const [reminderTime, setReminderTime]       = useState<Date>(makeTime(9, 0));
  const [isUrgent, setIsUrgent]               = useState(false);
  const [reminderRepeat, setReminderRepeat]   = useState('Nie');
  const [repeatEndDate, setRepeatEndDate]                 = useState<Date | null>(null);
  const [customInterval, setCustomInterval]               = useState('Jeden Tag');
  const [reminderRepeatEndDate, setReminderRepeatEndDate] = useState<Date | null>(null);
  const [reminderCustomInterval, setReminderCustomInterval] = useState('Jeden Tag');

  // ── Picker UI ──
  const [datePickerTarget, setDatePickerTarget] = useState<DatePickerTarget>(null);
  const [timePickerMode, setTimePickerMode]     = useState<TimePickerMode>(null);
  const [pickerTime, setPickerTime]             = useState<Date>(makeTime(12, 0));
  const [optionSheet, setOptionSheet]           = useState<OptionSheetConfig | null>(null);

  // ── Reset when modal opens or event changes ──
  useEffect(() => {
    if (!visible) return;
    const base = startOfDay(defaultDate ?? new Date());

    if (event) {
      const mode: AppMode = event.eventType === 'reminder' ? 'reminder' : 'event';
      setAppMode(mode);
      setTitle(event.title);
      setCategory(event.category);
      setPriority(event.priority);

      if (mode === 'event') {
        setStartDate(startOfDay(event.start));
        setStartTime(event.start);
        setEndDate(startOfDay(event.end));
        setEndTime(event.end);
        setLocation(event.location ?? '');
        setAllDay(event.allDay ?? false);
        setTravelTime(event.travelTime ?? 'Ohne');
        setRepeat(event.repeat ?? 'Nie');
        setRepeatEndDate(event.repeatEndDate ?? null);
        setCustomInterval(event.customRepeatInterval ?? 'Jeden Tag');
        setEventAlert(event.alert ?? 'Ohne');
      } else {
        setReminderDate(startOfDay(event.start));
        const hasTime = event.start.getHours() !== 0 || event.start.getMinutes() !== 0;
        setHasReminderTime(hasTime);
        if (hasTime) setReminderTime(event.start);
        setReminderNotes(event.description ?? '');
        setReminderUrl(event.url ?? '');
        setIsUrgent(event.priority === 'high');
        setReminderRepeat(event.repeat ?? 'Nie');
        setReminderRepeatEndDate(event.repeatEndDate ?? null);
        setReminderCustomInterval(event.customRepeatInterval ?? 'Jeden Tag');
      }
    } else {
      setAppMode('event');
      setTitle('');
      setLocation('');
      setAllDay(false);
      setStartDate(base);
      setStartTime(makeTime(12, 0));
      setEndDate(base);
      setEndTime(makeTime(13, 0));
      setTravelTime('Ohne');
      setRepeat('Nie');
      setEventAlert('Ohne');
      setReminderNotes('');
      setReminderUrl('');
      setReminderDate(base);
      setHasReminderTime(false);
      setReminderTime(makeTime(9, 0));
      setIsUrgent(false);
      setReminderRepeat('Nie');
      setReminderRepeatEndDate(null);
      setReminderCustomInterval('Jeden Tag');
      setRepeatEndDate(null);
      setCustomInterval('Jeden Tag');
      setCategory('work');
      setPriority('medium');
    }
    setDatePickerTarget(null);
    setTimePickerMode(null);
    setOptionSheet(null);
  }, [visible, event?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSave = title.trim().length > 0;

  // ── Handlers ──
  const handleClose = useCallback(() => {
    setDatePickerTarget(null);
    setTimePickerMode(null);
    setOptionSheet(null);
    onClose();
  }, [onClose]);

  const handleSave = useCallback((markComplete: boolean) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    let evStart: Date;
    let evEnd: Date;

    if (appMode === 'event') {
      evStart = allDay ? startOfDay(startDate) : applyTime(startDate, startTime);
      evEnd   = allDay ? startOfDay(endDate)   : applyTime(endDate, endTime);
      if (!allDay && evEnd.getTime() - evStart.getTime() < MIN_DURATION_MS) {
        evEnd = new Date(evEnd.getTime() + 24 * 60 * 60_000);
      }
    } else {
      evStart = hasReminderTime
        ? applyTime(reminderDate, reminderTime)
        : startOfDay(reminderDate);
      evEnd = evStart;
    }

    const activeRepeat         = appMode === 'event' ? repeat               : reminderRepeat;
    const activeRepeatEndDate  = appMode === 'event' ? repeatEndDate         : reminderRepeatEndDate;
    const activeCustomInterval = appMode === 'event' ? customInterval        : reminderCustomInterval;

    const payload = {
      title:                trimmedTitle,
      start:                evStart,
      end:                  evEnd,
      category,
      priority:             appMode === 'reminder' && isUrgent ? ('high' as EventPriority) : priority,
      location:             appMode === 'event' ? (location.trim() || undefined) : undefined,
      description:          appMode === 'reminder' ? (reminderNotes.trim() || undefined) : undefined,
      allDay:               appMode === 'event' ? allDay : false,
      eventType:            appMode as 'event' | 'reminder',
      travelTime:           appMode === 'event' && travelTime !== 'Ohne' ? travelTime : undefined,
      repeat:               activeRepeat !== 'Nie' ? activeRepeat : undefined,
      repeatEndDate:        activeRepeat !== 'Nie' ? (activeRepeatEndDate ?? undefined) : undefined,
      customRepeatInterval: activeRepeat === 'Benutzerdefiniert' ? activeCustomInterval : undefined,
      alert:                appMode === 'event' && eventAlert !== 'Ohne' ? eventAlert : undefined,
      url:                  appMode === 'reminder' && reminderUrl.trim() ? reminderUrl.trim() : undefined,
      ...(markComplete ? { completed: true } : {}),
    };

    if (isEditMode && onSave && event) {
      onSave(event.id, payload);
      handleClose();
    } else {
      addEvent(payload)
        .then(() => handleClose())
        .catch((err) => {
          console.error('[NewTaskModal] addEvent failed:', err?.message ?? err);
          alert('Fehler beim Speichern: ' + (err?.message ?? 'Unbekannter Fehler'));
        });
    }
  }, [
    title, appMode, allDay, startDate, startTime, endDate, endTime,
    hasReminderTime, reminderDate, reminderTime, location, reminderNotes,
    category, priority, isUrgent, travelTime, repeat, reminderRepeat,
    repeatEndDate, reminderRepeatEndDate, customInterval, reminderCustomInterval,
    eventAlert, reminderUrl, isEditMode, event, onSave, addEvent, handleClose,
  ]);

  const handleDelete = useCallback(() => {
    if (isEditMode && onDelete && event) onDelete(event.id);
    handleClose();
  }, [isEditMode, event, onDelete, handleClose]);

  const openTimePicker = useCallback((mode: NonNullable<TimePickerMode>) => {
    const t = mode === 'startTime' ? startTime
            : mode === 'endTime'   ? endTime
            :                        reminderTime;
    setPickerTime(t);
    setDatePickerTarget(null);
    setOptionSheet(null);
    setTimePickerMode(mode);
  }, [startTime, endTime, reminderTime]);

  const handleTimePickerChange = useCallback((_: DateTimePickerEvent, date?: Date) => {
    if (date) setPickerTime(date);
  }, []);

  const handleTimePickerConfirm = useCallback(() => {
    if (timePickerMode === 'startTime')    setStartTime(pickerTime);
    else if (timePickerMode === 'endTime') setEndTime(pickerTime);
    else                                    setReminderTime(pickerTime);
    setTimePickerMode(null);
  }, [timePickerMode, pickerTime]);

  const handleDateSelect = useCallback((date: Date) => {
    if      (datePickerTarget === 'start')              setStartDate(date);
    else if (datePickerTarget === 'end')                setEndDate(date);
    else if (datePickerTarget === 'reminder')           setReminderDate(date);
    else if (datePickerTarget === 'repeatEnd')          setRepeatEndDate(date);
    else if (datePickerTarget === 'reminderRepeatEnd')  setReminderRepeatEndDate(date);
    setDatePickerTarget(null);
  }, [datePickerTarget]);

  const openOptionSheet = useCallback((config: OptionSheetConfig) => {
    setDatePickerTarget(null);
    setTimePickerMode(null);
    setOptionSheet(config);
  }, []);

  // ── Inline helpers ──
  const Divider = () => <View style={styles.divider} />;

  const PickerRow = ({
    icon, label, value, onPress,
  }: { icon: string; label: string; value: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.cardRow} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={16} color={colors.textTertiary} style={styles.rowIcon} />
      <Text style={styles.cardLabel}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={styles.cardValue}>{value}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );

  const NavRow = ({
    icon, iconColor, label, value,
  }: { icon: string; iconColor: string; label: string; value: string }) => (
    <View style={styles.cardRow}>
      <Ionicons name={icon as any} size={16} color={iconColor} style={styles.rowIcon} />
      <Text style={styles.cardLabel}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={styles.cardValue}>{value}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
      </View>
    </View>
  );

  // ── Render ──
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrapper}
        pointerEvents="box-none"
      >
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.handle} />

          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBtn} onPress={handleClose}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEditMode ? 'Bearbeiten' : 'Neu'}</Text>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => handleSave(false)}
              disabled={!canSave}
            >
              <Ionicons
                name="checkmark"
                size={24}
                color={canSave ? colors.primary : colors.textTertiary}
              />
            </TouchableOpacity>
          </View>

          {/* ── Segment Control ── */}
          <View style={styles.segmentContainer}>
            {(['event', 'reminder'] as AppMode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.segmentOption, appMode === m && styles.segmentOptionActive]}
                onPress={() => setAppMode(m)}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, appMode === m && styles.segmentTextActive]}>
                  {m === 'event' ? 'Ereignis' : 'Erinnerung'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Scrollable content ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {appMode === 'event' ? (
              <>
                {/* 1 – Grundinfos */}
                <View style={styles.sectionCard}>
                  <TextInput
                    style={styles.cardTextInput}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Titel"
                    placeholderTextColor={colors.textTertiary}
                    returnKeyType="next"
                    maxLength={100}
                    autoFocus={!isEditMode}
                  />
                  <Divider />
                  <View style={styles.cardRow}>
                    <Ionicons name="location-outline" size={16} color={colors.textTertiary} style={styles.rowIcon} />
                    <TextInput
                      style={styles.cardTextInputInline}
                      value={location}
                      onChangeText={setLocation}
                      placeholder="Standort oder Videoanruf"
                      placeholderTextColor={colors.textTertiary}
                      returnKeyType="done"
                      maxLength={200}
                    />
                  </View>
                </View>

                {/* 2 – Zeitplanung */}
                <View style={styles.sectionCard}>
                  {/* Ganztägig */}
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Ganztägig</Text>
                    <Switch
                      value={allDay}
                      onValueChange={setAllDay}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      ios_backgroundColor={colors.surfaceVariant}
                    />
                  </View>
                  <Divider />
                  {/* Beginn */}
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Beginn</Text>
                    <View style={styles.dateTimeButtons}>
                      <TouchableOpacity
                        style={styles.dateTimeBtn}
                        onPress={() => setDatePickerTarget('start')}
                      >
                        <Text style={styles.dateTimeBtnText}>{formatRelativeDate(startDate)}</Text>
                      </TouchableOpacity>
                      {!allDay && (
                        <TouchableOpacity
                          style={styles.dateTimeBtn}
                          onPress={() => openTimePicker('startTime')}
                        >
                          <Text style={styles.dateTimeBtnText}>{format(startTime, 'HH:mm')}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <Divider />
                  {/* Ende */}
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Ende</Text>
                    <View style={styles.dateTimeButtons}>
                      <TouchableOpacity
                        style={styles.dateTimeBtn}
                        onPress={() => setDatePickerTarget('end')}
                      >
                        <Text style={styles.dateTimeBtnText}>{formatRelativeDate(endDate)}</Text>
                      </TouchableOpacity>
                      {!allDay && (
                        <TouchableOpacity
                          style={styles.dateTimeBtn}
                          onPress={() => openTimePicker('endTime')}
                        >
                          <Text style={styles.dateTimeBtnText}>{format(endTime, 'HH:mm')}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  <Divider />
                  {/* Wegzeit */}
                  <PickerRow
                    icon="car-outline"
                    label="Wegzeit"
                    value={travelTime}
                    onPress={() => openOptionSheet({
                      title: 'Wegzeit',
                      options: TRAVEL_TIME_OPTIONS,
                      current: travelTime,
                      onSelect: setTravelTime,
                    })}
                  />
                </View>

                {/* 3 – Wiederholen */}
                <View style={styles.sectionCard}>
                  <PickerRow
                    icon="repeat-outline"
                    label="Wiederholen"
                    value={repeat}
                    onPress={() => openOptionSheet({
                      title: 'Wiederholen',
                      options: REPEAT_OPTIONS,
                      current: repeat,
                      onSelect: setRepeat,
                    })}
                  />
                  {repeat === 'Benutzerdefiniert' && (
                    <>
                      <Divider />
                      <PickerRow
                        icon="repeat-outline"
                        label="Intervall"
                        value={customInterval}
                        onPress={() => openOptionSheet({
                          title: 'Intervall',
                          options: CUSTOM_INTERVAL_OPTIONS,
                          current: customInterval,
                          onSelect: setCustomInterval,
                        })}
                      />
                    </>
                  )}
                  {repeat !== 'Nie' && (
                    <>
                      <Divider />
                      <TouchableOpacity
                        style={styles.cardRow}
                        onPress={() => setDatePickerTarget('repeatEnd')}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="calendar-outline" size={16} color={colors.textTertiary} style={styles.rowIcon} />
                        <Text style={styles.cardLabel}>Endet am</Text>
                        <View style={styles.rowRight}>
                          {repeatEndDate ? (
                            <>
                              <Text style={[styles.dateTimeBtnText, { marginRight: spacing.xs }]}>
                                {formatRelativeDate(repeatEndDate)}
                              </Text>
                              <TouchableOpacity onPress={() => setRepeatEndDate(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
                              </TouchableOpacity>
                            </>
                          ) : (
                            <Text style={styles.cardValue}>Kein Ende</Text>
                          )}
                          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} style={{ marginLeft: spacing.xs }} />
                        </View>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {/* 4 – Kalender & Eingeladene */}
                <View style={styles.sectionCard}>
                  <NavRow
                    icon="calendar-outline"
                    iconColor={colors.categoryPersonal}
                    label="Kalender"
                    value="Privat"
                  />
                  <Divider />
                  <NavRow
                    icon="people-outline"
                    iconColor={colors.textTertiary}
                    label="Eingeladene"
                    value="Ohne"
                  />
                </View>

                {/* 5 – Extras */}
                <View style={styles.sectionCard}>
                  <PickerRow
                    icon="notifications-outline"
                    label="Hinweis"
                    value={eventAlert}
                    onPress={() => openOptionSheet({
                      title: 'Hinweis',
                      options: ALERT_OPTIONS,
                      current: eventAlert,
                      onSelect: setEventAlert,
                    })}
                  />
                </View>
              </>
            ) : (
              <>
                {/* ── ERINNERUNG ── */}

                {/* 1 – Grundinfos */}
                <View style={styles.sectionCard}>
                  <TextInput
                    style={styles.cardTextInput}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Titel"
                    placeholderTextColor={colors.textTertiary}
                    returnKeyType="next"
                    maxLength={100}
                    autoFocus={!isEditMode}
                  />
                  <Divider />
                  <TextInput
                    style={[styles.cardTextInput, styles.cardTextInputMultiline]}
                    value={reminderNotes}
                    onChangeText={setReminderNotes}
                    placeholder="Notizen"
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    maxLength={500}
                  />
                  <Divider />
                  <TextInput
                    style={styles.cardTextInput}
                    value={reminderUrl}
                    onChangeText={setReminderUrl}
                    placeholder="URL"
                    placeholderTextColor={colors.textTertiary}
                    returnKeyType="done"
                    keyboardType="url"
                    autoCapitalize="none"
                    maxLength={500}
                  />
                </View>

                {/* 2 – Datum & Uhrzeit */}
                <View style={styles.sectionCard}>
                  {/* Datum */}
                  <TouchableOpacity
                    style={styles.cardRow}
                    onPress={() => setDatePickerTarget('reminder')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="calendar-outline" size={16} color={colors.primary} style={styles.rowIcon} />
                    <View style={styles.cardLabelStack}>
                      <Text style={styles.cardLabel}>Datum</Text>
                      <Text style={styles.cardValueAccent}>{formatRelativeDate(reminderDate)}</Text>
                    </View>
                  </TouchableOpacity>
                  <Divider />
                  {/* Uhrzeit */}
                  <View style={styles.cardRow}>
                    <Ionicons name="time-outline" size={16} color={colors.primary} style={styles.rowIcon} />
                    <View style={styles.cardLabelStack}>
                      <Text style={styles.cardLabel}>Uhrzeit</Text>
                      {hasReminderTime && (
                        <TouchableOpacity onPress={() => openTimePicker('reminderTime')}>
                          <Text style={styles.cardValueAccent}>{format(reminderTime, 'HH:mm')}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Switch
                      value={hasReminderTime}
                      onValueChange={setHasReminderTime}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      ios_backgroundColor={colors.surfaceVariant}
                    />
                  </View>
                  <Divider />
                  {/* Dringend */}
                  <View>
                    <View style={styles.cardRow}>
                      <Ionicons name="alert-circle-outline" size={16} color={colors.error} style={styles.rowIcon} />
                      <Text style={styles.cardLabel}>Dringend</Text>
                      <Switch
                        value={isUrgent}
                        onValueChange={setIsUrgent}
                        trackColor={{ false: colors.border, true: colors.error }}
                        ios_backgroundColor={colors.surfaceVariant}
                      />
                    </View>
                    {!isUrgent && (
                      <Text style={styles.cardHint}>
                        Markiere diese Erinnerung als dringend, um einen Hinweis wiederzugeben.
                      </Text>
                    )}
                  </View>
                </View>

                {/* 3 – Wiederholen */}
                <View style={styles.sectionCard}>
                  <PickerRow
                    icon="repeat-outline"
                    label="Wiederholen"
                    value={reminderRepeat}
                    onPress={() => openOptionSheet({
                      title: 'Wiederholen',
                      options: REPEAT_OPTIONS,
                      current: reminderRepeat,
                      onSelect: setReminderRepeat,
                    })}
                  />
                  {reminderRepeat === 'Benutzerdefiniert' && (
                    <>
                      <Divider />
                      <PickerRow
                        icon="repeat-outline"
                        label="Intervall"
                        value={reminderCustomInterval}
                        onPress={() => openOptionSheet({
                          title: 'Intervall',
                          options: CUSTOM_INTERVAL_OPTIONS,
                          current: reminderCustomInterval,
                          onSelect: setReminderCustomInterval,
                        })}
                      />
                    </>
                  )}
                  {reminderRepeat !== 'Nie' && (
                    <>
                      <Divider />
                      <TouchableOpacity
                        style={styles.cardRow}
                        onPress={() => setDatePickerTarget('reminderRepeatEnd')}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="calendar-outline" size={16} color={colors.textTertiary} style={styles.rowIcon} />
                        <Text style={styles.cardLabel}>Endet am</Text>
                        <View style={styles.rowRight}>
                          {reminderRepeatEndDate ? (
                            <>
                              <Text style={[styles.dateTimeBtnText, { marginRight: spacing.xs }]}>
                                {formatRelativeDate(reminderRepeatEndDate)}
                              </Text>
                              <TouchableOpacity onPress={() => setReminderRepeatEndDate(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
                              </TouchableOpacity>
                            </>
                          ) : (
                            <Text style={styles.cardValue}>Kein Ende</Text>
                          )}
                          <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} style={{ marginLeft: spacing.xs }} />
                        </View>
                      </TouchableOpacity>
                    </>
                  )}
                </View>

                {/* 4 – Weitere Optionen */}
                <View style={styles.sectionCard}>
                  <NavRow
                    icon="list-outline"
                    iconColor={colors.categoryPersonal}
                    label="Liste"
                    value="Erinnerungen"
                  />
                  <Divider />
                  <NavRow
                    icon="information-circle-outline"
                    iconColor={colors.textTertiary}
                    label="Details"
                    value=""
                  />
                </View>
              </>
            )}

            {/* ── Kategorie & Priorität (shared) ── */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionInlineLabel}>KATEGORIE</Text>
              <View style={styles.pillWrap}>
                {CATEGORY_META.map(({ key, label, color }) => {
                  const active = category === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.categoryPill,
                        active
                          ? { backgroundColor: color + '28', borderColor: color }
                          : { backgroundColor: colors.surface, borderColor: color + '55' },
                      ]}
                      onPress={() => setCategory(key)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.categoryPillText, { color: active ? color : color + 'BB' }]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Divider />

              <Text style={[styles.sectionInlineLabel, { marginTop: spacing.sm }]}>PRIORITÄT</Text>
              <View style={styles.priorityRow}>
                {PRIORITY_META.map(({ key, label, color }) => {
                  const active = priority === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.priorityPill,
                        active
                          ? { backgroundColor: color + '28', borderColor: color }
                          : { backgroundColor: colors.surface, borderColor: color + '55' },
                      ]}
                      onPress={() => setPriority(key)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.priorityPillText, { color: active ? color : color + 'BB' }]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={{ height: spacing.md }} />
            </View>

            {/* ── Als erledigt markieren ── */}
            <TouchableOpacity
              style={[styles.markCompleteBtn, !canSave && styles.btnDisabled]}
              onPress={() => handleSave(true)}
              activeOpacity={0.8}
              disabled={!canSave}
            >
              <Text style={styles.markCompleteIcon}>✓</Text>
              <Text style={styles.markCompleteText}>Als erledigt markieren</Text>
            </TouchableOpacity>

            {/* ── Bottom Row ── */}
            <View style={styles.bottomRow}>
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                onPress={() => handleSave(false)}
                activeOpacity={0.85}
                disabled={!canSave}
              >
                <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
                  {isEditMode ? 'Speichern' : 'Hinzufügen'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: spacing.xl }} />
          </ScrollView>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* ── Custom Calendar Sheet ── */}
      {datePickerTarget !== null && (
        <View style={styles.pickerOverlay}>
          <TouchableOpacity
            style={styles.pickerBackdrop}
            activeOpacity={1}
            onPress={() => setDatePickerTarget(null)}
          />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerToolbar}>
              <TouchableOpacity
                style={styles.pickerToolbarBtn}
                onPress={() => setDatePickerTarget(null)}
              >
                <Text style={styles.pickerCancel}>Abbrechen</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Datum wählen</Text>
              <View style={styles.pickerToolbarBtn} />
            </View>
            <CustomCalendarView
              selectedDate={
                datePickerTarget === 'start'             ? startDate :
                datePickerTarget === 'end'               ? endDate   :
                datePickerTarget === 'repeatEnd'         ? (repeatEndDate ?? startOfDay(new Date())) :
                datePickerTarget === 'reminderRepeatEnd' ? (reminderRepeatEndDate ?? startOfDay(new Date())) :
                                                           reminderDate
              }
              onSelectDate={handleDateSelect}
            />
          </View>
        </View>
      )}

      {/* ── Time Picker Sheet ── */}
      {timePickerMode !== null && (
        <View style={styles.pickerOverlay}>
          <TouchableOpacity
            style={styles.pickerBackdrop}
            activeOpacity={1}
            onPress={() => setTimePickerMode(null)}
          />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerToolbar}>
              <TouchableOpacity
                style={styles.pickerToolbarBtn}
                onPress={() => setTimePickerMode(null)}
              >
                <Text style={styles.pickerCancel}>Abbrechen</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>
                {timePickerMode === 'startTime' ? 'Startzeit' :
                 timePickerMode === 'endTime'   ? 'Endzeit'   :
                                                  'Uhrzeit'}
              </Text>
              <TouchableOpacity
                style={styles.pickerToolbarBtn}
                onPress={handleTimePickerConfirm}
              >
                <Text style={styles.pickerDone}>Fertig</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={pickerTime}
              mode="time"
              display="spinner"
              onChange={handleTimePickerChange}
              textColor={colors.textPrimary}
              style={styles.nativePicker}
              minuteInterval={5}
            />
          </View>
        </View>
      )}

      {/* ── Option Picker Sheet ── */}
      {optionSheet !== null && (
        <View style={styles.pickerOverlay}>
          <TouchableOpacity
            style={styles.pickerBackdrop}
            activeOpacity={1}
            onPress={() => setOptionSheet(null)}
          />
          <View style={[styles.pickerSheet, styles.optionPickerSheet]}>
            <View style={styles.pickerToolbar}>
              <TouchableOpacity
                style={styles.pickerToolbarBtn}
                onPress={() => setOptionSheet(null)}
              >
                <Text style={styles.pickerCancel}>Abbrechen</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>{optionSheet.title}</Text>
              <View style={styles.pickerToolbarBtn} />
            </View>
            <ScrollView bounces={false}>
              {optionSheet.options.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={styles.optionRow}
                  onPress={() => { optionSheet.onSelect(opt); setOptionSheet(null); }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionText,
                    opt === optionSheet.current && styles.optionTextActive,
                  ]}>
                    {opt}
                  </Text>
                  {opt === optionSheet.current && (
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
              <View style={{ height: 34 }} />
            </ScrollView>
          </View>
        </View>
      )}
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Modal shell
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xlarge,
    borderTopRightRadius: borderRadius.xlarge,
    paddingTop: spacing.sm,
    maxHeight: '95%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.round,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBtn: {
    width: 40,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.body,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
  },

  // Segment control
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.medium,
    margin: spacing.md,
    padding: 3,
  },
  segmentOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.small,
    alignItems: 'center',
  },
  segmentOptionActive: {
    backgroundColor: colors.surface,
  },
  segmentText: {
    fontSize: typography.caption,
    fontWeight: typography.medium as any,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.textPrimary,
    fontWeight: typography.semibold as any,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },

  // Section cards
  sectionCard: {
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.large,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  sectionInlineLabel: {
    fontSize: typography.tiny,
    fontWeight: typography.semibold as any,
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md,
  },

  // Card rows
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    minHeight: 46,
  },
  cardLabel: {
    flex: 1,
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  cardLabelStack: {
    flex: 1,
    gap: 2,
  },
  cardValue: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  cardValueAccent: {
    fontSize: typography.caption,
    color: colors.primary,
    fontWeight: typography.medium as any,
  },
  cardHint: {
    fontSize: typography.tiny,
    color: colors.textTertiary,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    lineHeight: 17,
  },
  cardTextInput: {
    fontSize: typography.body,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    minHeight: 46,
  },
  cardTextInputInline: {
    flex: 1,
    fontSize: typography.body,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  cardTextInputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  rowIcon: {
    marginRight: spacing.sm,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Date/time pill buttons
  dateTimeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dateTimeBtn: {
    backgroundColor: colors.primary + '22',
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  dateTimeBtnText: {
    fontSize: typography.caption,
    color: colors.primary,
    fontWeight: typography.medium as any,
  },

  // Category & Priority
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  categoryPillText: {
    fontSize: typography.caption,
    fontWeight: typography.semibold as any,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  priorityPill: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  priorityPillText: {
    fontSize: typography.caption,
    fontWeight: typography.semibold as any,
  },

  // Mark complete
  markCompleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.large,
    backgroundColor: '#1A3D2E',
    borderWidth: 1,
    borderColor: '#2A6048',
  },
  markCompleteIcon: {
    fontSize: 18,
    color: colors.success,
    fontWeight: typography.bold as any,
  },
  markCompleteText: {
    fontSize: typography.body,
    fontWeight: typography.semibold as any,
    color: colors.success,
  },
  btnDisabled: { opacity: 0.4 },

  // Bottom row
  bottomRow: { flexDirection: 'row', gap: spacing.sm },
  deleteBtn: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.error + '22',
    borderWidth: 1,
    borderColor: colors.error + '55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flex: 1,
    height: 50,
    borderRadius: borderRadius.large,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnDisabled: {
    backgroundColor: colors.surfaceVariant,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveBtnText: {
    fontSize: typography.body,
    fontWeight: typography.bold as any,
    color: '#fff',
  },
  saveBtnTextDisabled: { color: colors.textTertiary },

  // Picker overlays (shared shell)
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 100,
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  pickerSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xlarge,
    borderTopRightRadius: borderRadius.xlarge,
    paddingBottom: 34,
  },
  optionPickerSheet: {
    maxHeight: '60%',
  },
  pickerToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pickerToolbarBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    minWidth: 80,
  },
  pickerTitle: {
    fontSize: typography.body,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
  },
  pickerCancel: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  pickerDone: {
    fontSize: typography.body,
    fontWeight: typography.bold as any,
    color: colors.primary,
    textAlign: 'right',
  },
  nativePicker: {
    width: '100%',
    height: 216,
  },

  // Option sheet rows
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionText: {
    fontSize: typography.body,
    color: colors.textPrimary,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: typography.semibold as any,
  },
});
