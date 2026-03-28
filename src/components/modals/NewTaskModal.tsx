import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format, addDays, startOfDay } from 'date-fns';
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

type PickerMode = 'start' | 'end' | 'duration' | null;

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

const DATE_RANGE_DAYS = 60;
const MIN_DURATION_MS = 5 * 60_000; // 5 minutes minimum

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Apply the h:mm from `time` onto the calendar date of `date`. */
function applyTime(date: Date, time: Date): Date {
  const d = new Date(date);
  d.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return d;
}

function makeDefaultStartTime(): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d;
}

function makeDefaultEndTime(): Date {
  const d = new Date();
  d.setHours(13, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

function formatDateFieldLabel(date: Date): string {
  const today = startOfDay(new Date());
  const diff = Math.round((startOfDay(date).getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return `Heute, ${format(date, 'd. MMM')}`;
  if (diff === 1) return `Morgen, ${format(date, 'd. MMM')}`;
  return format(date, 'EEE, d. MMM');
}

function formatDatePill(date: Date): { top: string; bottom: string } {
  const today = startOfDay(new Date());
  const diff = Math.round((startOfDay(date).getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return { top: 'Heute', bottom: format(date, 'd') };
  if (diff === 1) return { top: 'Mrgn',  bottom: format(date, 'd') };
  return { top: format(date, 'EEE'), bottom: format(date, 'd') };
}

function formatDuration(startDate: Date, endDate: Date): string {
  const ms = endDate.getTime() - startDate.getTime();
  if (ms <= 0) return '—';
  const totalMins = Math.round(ms / 60_000);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
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

  // ── Form state ──
  const [title, setTitle]               = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(defaultDate ?? new Date()));
  const [startTime, setStartTime]       = useState<Date>(makeDefaultStartTime);
  const [endTime, setEndTime]           = useState<Date>(makeDefaultEndTime);
  const [category, setCategory]         = useState<EventCategory>('work');
  const [priority, setPriority]         = useState<EventPriority>('medium');
  const [notes, setNotes]               = useState('');

  // ── Picker state ──
  const [showDatePicker, setShowDatePicker]         = useState(false);
  const [pickerMode, setPickerMode]                 = useState<PickerMode>(null);
  const [pickerTime, setPickerTime]                 = useState<Date>(makeDefaultStartTime);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customDateSelected, setCustomDateSelected] = useState(false);

  // ── Carousel ref for scrolling past "..." button ──
  const carouselRef = useRef<ScrollView>(null);
  const dotsWidth   = useRef(0);

  // ── Date options (next 60 days) ──
  const dateOptions = useMemo<Date[]>(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: DATE_RANGE_DAYS }, (_, i) => addDays(today, i));
  }, []);

  // ── Sync when modal opens or event changes ──
  useEffect(() => {
    if (!visible) return;

    if (event) {
      setTitle(event.title);
      setSelectedDate(startOfDay(event.start));
      setStartTime(event.start);
      setEndTime(event.end);
      setCategory(event.category);
      setPriority(event.priority);
      setNotes(event.description ?? '');
    } else {
      setTitle('');
      setSelectedDate(startOfDay(defaultDate ?? new Date()));
      setStartTime(makeDefaultStartTime());
      setEndTime(makeDefaultEndTime());
      setCategory('work');
      setPriority('medium');
      setNotes('');
    }
    setShowDatePicker(false);
    setPickerMode(null);
    setShowCustomDatePicker(false);
    setCustomDateSelected(false);
  }, [visible, event?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived dates (apply selected time onto selected calendar date) ──
  const startDate = applyTime(selectedDate, startTime);
  // If end time is on or before start time → treat as next day
  let endDate = applyTime(selectedDate, endTime);
  if (endDate.getTime() - startDate.getTime() < MIN_DURATION_MS) {
    endDate = new Date(endDate.getTime() + 24 * 60 * 60_000);
  }

  const canSave = title.trim().length > 0;

  // ── Picker handlers ──
  const openPicker = useCallback((mode: 'start' | 'end' | 'duration') => {
    if (mode === 'duration') {
      const durationMins = Math.max(5, Math.round((endDate.getTime() - startDate.getTime()) / 60_000));
      const d = new Date(0);
      d.setHours(Math.floor(durationMins / 60), durationMins % 60, 0, 0);
      setPickerTime(d);
    } else {
      setPickerTime(mode === 'start' ? startTime : endTime);
    }
    setShowDatePicker(false);
    setPickerMode(mode);
  }, [startTime, endTime, startDate, endDate]);

  const handlePickerChange = useCallback(
    (_: DateTimePickerEvent, date?: Date) => {
      if (date) setPickerTime(date);
    },
    []
  );

  const handlePickerConfirm = useCallback(() => {
    if (pickerMode === 'start') {
      const prevDurationMs = endDate.getTime() - startDate.getTime();
      setStartTime(pickerTime);
      // Shift end time to preserve the duration
      const newEnd = new Date(pickerTime.getTime() + prevDurationMs);
      setEndTime(newEnd);
    } else if (pickerMode === 'end') {
      setEndTime(pickerTime);
    } else if (pickerMode === 'duration') {
      const durationMins = pickerTime.getHours() * 60 + pickerTime.getMinutes();
      const durationMs = Math.max(MIN_DURATION_MS, durationMins * 60_000);
      setEndTime(new Date(startTime.getTime() + durationMs));
    }
    setPickerMode(null);
  }, [pickerMode, pickerTime, startDate, endDate, startTime]);

  // ── Save / Delete ──
  const handleClose = useCallback(() => {
    setPickerMode(null);
    setShowDatePicker(false);
    onClose();
  }, [onClose]);

  const handleSave = useCallback(
    (markComplete: boolean) => {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) return;

      if (isEditMode && onSave && event) {
        onSave(event.id, {
          title:       trimmedTitle,
          start:       startDate,
          end:         endDate,
          category,
          priority,
          description: notes.trim() || undefined,
          ...(markComplete ? { completed: true } : {}),
        });
      } else {
        addEvent({
          title:       trimmedTitle,
          start:       startDate,
          end:         endDate,
          category,
          priority,
          description: notes.trim() || undefined,
          completed:   markComplete,
        });
      }
      handleClose();
    },
    [title, isEditMode, event, onSave, startDate, endDate, category, priority, notes, addEvent, handleClose]
  );

  const handleDelete = useCallback(() => {
    if (isEditMode && onDelete && event) onDelete(event.id);
    handleClose();
  }, [isEditMode, event, onDelete, handleClose]);

  const pickerTitle =
    pickerMode === 'start' ? 'Startzeit' :
    pickerMode === 'end'   ? 'Endzeit'   :
                             'Dauer';

  // ── Render ──
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      {/* Main backdrop */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />

      {/* Form sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheetWrapper}
        pointerEvents="box-none"
      >
        <TouchableOpacity activeOpacity={1} style={styles.sheet}>
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <Text style={styles.sheetTitle}>
              {isEditMode ? 'Edit Task' : 'New Task'}
            </Text>

            {/* Title */}
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Task name…"
              placeholderTextColor={colors.textTertiary}
              returnKeyType="done"
              maxLength={100}
              autoFocus={!isEditMode}
            />

            {/* ── Date ── */}
            <TouchableOpacity
              style={styles.fieldRow}
              onPress={() => {
                setPickerMode(null);
                setShowDatePicker(v => !v);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.fieldLabel}>Date</Text>
              <Text style={styles.fieldValue}>{formatDateFieldLabel(selectedDate)}</Text>
            </TouchableOpacity>

            {showDatePicker && (
              <ScrollView
                ref={carouselRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.pillRow, styles.inlinePicker]}
                onContentSizeChange={() => {
                  carouselRef.current?.scrollTo({ x: dotsWidth.current + spacing.sm, animated: false });
                }}
              >
                {/* "..." button — scroll left to reveal, opens full-calendar picker */}
                <TouchableOpacity
                  onLayout={(e) => { dotsWidth.current = e.nativeEvent.layout.width; }}
                  style={[styles.datePill, customDateSelected && styles.datePillActive]}
                  onPress={() => setShowCustomDatePicker(true)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.datePillBottom, customDateSelected && styles.datePillBottomActive]}>
                    {'...'}
                  </Text>
                </TouchableOpacity>

                {dateOptions.map((d) => {
                  const active = !customDateSelected && isSameDay(d, selectedDate);
                  const { top, bottom } = formatDatePill(d);
                  return (
                    <TouchableOpacity
                      key={d.toISOString()}
                      style={[styles.datePill, active && styles.datePillActive]}
                      onPress={() => { setSelectedDate(d); setCustomDateSelected(false); setShowDatePicker(false); }}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.datePillTop, active && styles.datePillTopActive]}>{top}</Text>
                      <Text style={[styles.datePillBottom, active && styles.datePillBottomActive]}>{bottom}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.separator} />

            {/* ── Start time ── */}
            <TouchableOpacity
              style={styles.fieldRow}
              onPress={() => openPicker('start')}
              activeOpacity={0.7}
            >
              <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.fieldLabel}>Start</Text>
              <Text style={[styles.fieldValue, pickerMode === 'start' && styles.fieldValueActive]}>
                {format(startDate, 'h:mm a')}
              </Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* ── End time ── */}
            <TouchableOpacity
              style={styles.fieldRow}
              onPress={() => openPicker('end')}
              activeOpacity={0.7}
            >
              <Ionicons name="flag-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.fieldLabel}>End</Text>
              <Text style={[styles.fieldValue, pickerMode === 'end' && styles.fieldValueActive]}>
                {format(endDate, 'h:mm a')}
              </Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* ── Duration (wheel picker) ── */}
            <TouchableOpacity
              style={styles.fieldRow}
              onPress={() => openPicker('duration')}
              activeOpacity={0.7}
            >
              <Ionicons name="alarm-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.fieldLabel}>Duration</Text>
              <Text style={[styles.fieldValue, pickerMode === 'duration' && styles.fieldValueActive]}>
                {formatDuration(startDate, endDate)}
              </Text>
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* ── Category ── */}
            <Text style={styles.sectionLabel}>CATEGORY</Text>
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
                        : { backgroundColor: colors.surfaceVariant, borderColor: color + '55' },
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

            {/* ── Priority ── */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>PRIORITY</Text>
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
                        : { backgroundColor: colors.surfaceVariant, borderColor: color + '55' },
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

            {/* ── Notes ── */}
            <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>NOTES</Text>
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add notes…"
              placeholderTextColor={colors.textTertiary}
              multiline
              maxLength={500}
            />

            {/* ── Mark Complete ── */}
            <TouchableOpacity
              style={[styles.markCompleteBtn, !canSave && styles.btnDisabled]}
              onPress={() => handleSave(true)}
              activeOpacity={0.8}
              disabled={!canSave}
            >
              <Text style={styles.markCompleteIcon}>✓</Text>
              <Text style={styles.markCompleteText}>Mark Complete</Text>
            </TouchableOpacity>

            {/* ── Bottom row ── */}
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
                  Save Changes
                </Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: spacing.xl }} />
          </ScrollView>
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {/* ── Custom date picker overlay (full-calendar graphical style) ── */}
      {showCustomDatePicker && (
        <View style={styles.pickerOverlay}>
          <TouchableOpacity
            style={styles.pickerBackdrop}
            activeOpacity={1}
            onPress={() => setShowCustomDatePicker(false)}
          />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerToolbar}>
              <TouchableOpacity
                style={styles.pickerToolbarBtn}
                onPress={() => setShowCustomDatePicker(false)}
              >
                <Text style={styles.pickerCancel}>Abbrechen</Text>
              </TouchableOpacity>
              <Text style={styles.pickerTitle}>Datum wählen</Text>
              <View style={styles.pickerToolbarBtn} />
            </View>
            <CustomCalendarView
              selectedDate={selectedDate}
              onSelectDate={(date) => {
                setSelectedDate(date);
                setCustomDateSelected(true);
                setShowCustomDatePicker(false);
                setShowDatePicker(false);
              }}
            />
          </View>
        </View>
      )}

      {/* ── Native wheel picker overlay (start or end) ── */}
      {pickerMode !== null && (
        <View style={styles.pickerOverlay}>
          <TouchableOpacity
            style={styles.pickerBackdrop}
            activeOpacity={1}
            onPress={() => setPickerMode(null)}
          />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerToolbar}>
              <TouchableOpacity
                style={styles.pickerToolbarBtn}
                onPress={() => setPickerMode(null)}
              >
                <Text style={styles.pickerCancel}>Abbrechen</Text>
              </TouchableOpacity>

              <Text style={styles.pickerTitle}>{pickerTitle}</Text>

              <TouchableOpacity
                style={styles.pickerToolbarBtn}
                onPress={handlePickerConfirm}
              >
                <Text style={styles.pickerDone}>Fertig</Text>
              </TouchableOpacity>
            </View>

            <DateTimePicker
              value={pickerTime}
              mode={pickerMode === 'duration' ? 'countdown' : 'time'}
              display="spinner"
              onChange={handlePickerChange}
              textColor={colors.textPrimary}
              style={styles.nativePicker}
              minuteInterval={5}
            />
          </View>
        </View>
      )}
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xlarge,
    borderTopRightRadius: borderRadius.xlarge,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: '92%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.round,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: {
    fontSize: typography.h2,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  titleInput: {
    fontSize: typography.h3,
    color: colors.textPrimary,
    fontWeight: typography.medium as any,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // Field rows
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  fieldLabel: {
    flex: 1,
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  fieldValue: {
    fontSize: typography.body,
    color: colors.textPrimary,
    fontWeight: typography.medium as any,
  },
  fieldValueActive: {
    color: colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },

  // Inline pickers
  inlinePicker: {
    paddingVertical: spacing.sm,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },

  // Date pills
  datePill: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 52,
  },
  datePillActive: {
    backgroundColor: colors.primary + '22',
    borderColor: colors.primary,
  },
  datePillTop: {
    fontSize: 10,
    fontWeight: typography.semibold as any,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  datePillTopActive: { color: colors.primary },
  datePillBottom: {
    fontSize: typography.body,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
    marginTop: 2,
  },
  datePillBottomActive: { color: colors.primary },

  // Generic pills (duration)
  pill: {
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primary + '22',
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    fontWeight: typography.medium as any,
  },
  pillTextActive: {
    color: colors.primary,
    fontWeight: typography.bold as any,
  },

  // Section labels
  sectionLabel: {
    fontSize: typography.tiny,
    fontWeight: typography.semibold as any,
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },

  // Category pills
  pillWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
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

  // Priority pills
  priorityRow: { flexDirection: 'row', gap: spacing.sm },
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

  // Notes
  notesInput: {
    minHeight: 80,
    backgroundColor: colors.surfaceVariant,
    borderRadius: borderRadius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
    textAlignVertical: 'top',
  },

  // Mark Complete
  markCompleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
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

  // Bottom row
  bottomRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
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
  btnDisabled: { opacity: 0.4 },

  // Native wheel picker overlay
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
  },
  nativePicker: {
    width: '100%',
    height: 216,
  },
});
