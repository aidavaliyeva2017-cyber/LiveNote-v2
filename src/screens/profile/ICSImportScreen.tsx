import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { documentDirectory, getInfoAsync, readAsStringAsync } from 'expo-file-system/legacy';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventsContext';
import { parseICS, ICSEvent } from '../../services/icsParser';
import { importICSEventsToSupabase } from '../../services/icsEventService';
import { colors, spacing, typography, borderRadius } from '../../theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
});

function formatDate(d: Date, allDay: boolean): string {
  if (allDay) {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    }).format(d);
  }
  return fmt.format(d);
}

// ─── Event Row ────────────────────────────────────────────────────────────────
const EventRow = ({
  event,
  selected,
  onToggle,
}: {
  event: ICSEvent;
  selected: boolean;
  onToggle: () => void;
}) => (
  <TouchableOpacity style={styles.eventRow} onPress={onToggle} activeOpacity={0.7}>
    <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
      {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
    </View>
    <View style={styles.eventInfo}>
      <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
      <Text style={styles.eventMeta}>
        {formatDate(event.startDate, event.allDay)}
        {event.allDay ? '  •  Ganztägig' : ''}
      </Text>
      {event.location ? (
        <Text style={styles.eventLocation} numberOfLines={1}>📍 {event.location}</Text>
      ) : null}
    </View>
  </TouchableOpacity>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
export const ICSImportScreen: React.FC = () => {
  const navigation  = useNavigation();
  const { user }    = useAuth();
  const { refetch } = useEvents();

  const [events,    setEvents]    = useState<ICSEvent[]>([]);
  const [selected,  setSelected]  = useState<Set<string>>(new Set());
  const [picking,   setPicking]   = useState(false);
  const [importing, setImporting] = useState(false);
  const [fileName,  setFileName]  = useState('');

  // ── Auto-load ICS from documentDirectory (simulator dev helper) ────────────
  useEffect(() => {
    const tryAutoLoad = async () => {
      const candidates = ['Familie.ics', 'family.ics', 'calendar.ics'];
      for (const name of candidates) {
        const uri = (documentDirectory ?? '') + name;
        const info = await getInfoAsync(uri);
        if (info.exists) {
          try {
            const content = await readAsStringAsync(uri, { encoding: 'utf8' });
            const parsed = parseICS(content);
            if (parsed.length > 0) {
              parsed.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
              setEvents(parsed);
              setSelected(new Set(parsed.map(e => e.id)));
              setFileName(name);
            }
          } catch {
            // silently skip unreadable files
          }
          break;
        }
      }
    };
    void tryAutoLoad();
  }, []);

  // ── Pick & parse .ics file ─────────────────────────────────────────────────
  const handlePickFile = useCallback(async () => {
    setPicking(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/calendar', 'application/octet-stream', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];

      if (!asset.name.toLowerCase().endsWith('.ics')) {
        Alert.alert('Ungültige Datei', 'Bitte wähle eine .ics Kalenderdatei aus.');
        return;
      }

      const content = await readAsStringAsync(asset.uri, { encoding: 'utf8' });

      const parsed = parseICS(content);

      if (parsed.length === 0) {
        Alert.alert('Keine Termine gefunden', 'Die Datei enthält keine lesbaren Kalendereinträge.');
        return;
      }

      // Sort by startDate ascending
      parsed.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

      setEvents(parsed);
      setSelected(new Set(parsed.map(e => e.id)));
      setFileName(asset.name);
    } catch (err) {
      console.error('[ICSImport] Pick error:', err);
      Alert.alert('Fehler', 'Die Datei konnte nicht gelesen werden.');
    } finally {
      setPicking(false);
    }
  }, []);

  // ── Toggle individual / all ───────────────────────────────────────────────
  const toggleEvent = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected(prev =>
      prev.size === events.length
        ? new Set()
        : new Set(events.map(e => e.id)),
    );
  }, [events]);

  // ── Import selected events ────────────────────────────────────────────────
  const handleImport = useCallback(async () => {
    console.log('[ICSImport] handleImport called — user:', user ? `id=${user.id}` : 'NULL (guest/not logged in)');
    if (!user) {
      Alert.alert('Nicht eingeloggt', 'Du musst eingeloggt sein um Termine zu importieren. Gäste können keine Termine speichern.');
      return;
    }
    const toImport = events.filter(e => selected.has(e.id));
    if (toImport.length === 0) {
      Alert.alert('Keine Auswahl', 'Bitte wähle mindestens einen Termin aus.');
      return;
    }
    console.log('[ICSImport] Importing', toImport.length, 'events for user_id:', user.id);

    setImporting(true);
    try {
      const { imported, failed } = await importICSEventsToSupabase(toImport, user.id);

      // Refresh the EventsContext so the calendar shows the imported events
      await refetch();

      if (failed > 0) {
        Alert.alert(
          'Teilweise importiert',
          `${imported} Termine importiert, ${failed} fehlgeschlagen.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      } else {
        Alert.alert(
          'Import erfolgreich',
          `${imported} Termin${imported !== 1 ? 'e' : ''} wurden importiert.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      }
    } catch (err) {
      console.error('[ICSImport] Import error:', err);
      Alert.alert('Fehler', 'Beim Importieren ist ein Fehler aufgetreten.');
    } finally {
      setImporting(false);
    }
  }, [events, selected, user, navigation]);

  // ── Render ────────────────────────────────────────────────────────────────
  const allSelected = events.length > 0 && selected.size === events.length;

  return (
    <View style={styles.root}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Kalender importieren</Text>
        <View style={{ width: 40 }} />
      </View>

      {events.length === 0 ? (
        /* ── Empty state: file picker ── */
        <View style={styles.emptyContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="calendar-outline" size={40} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>ICS-Datei importieren</Text>
          <Text style={styles.emptySubtitle}>
            Wähle eine .ics Kalenderdatei von deinem Gerät aus.{'\n'}
            Alle enthaltenen Termine werden angezeigt und können einzeln ausgewählt werden.
          </Text>
          <TouchableOpacity
            style={styles.pickBtn}
            onPress={handlePickFile}
            disabled={picking}
            activeOpacity={0.8}
          >
            {picking ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="document-outline" size={20} color="#fff" />
                <Text style={styles.pickBtnText}>Datei auswählen</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Event list ── */
        <>
          {/* File + select-all bar */}
          <View style={styles.listHeader}>
            <View style={styles.fileNameRow}>
              <Ionicons name="document-text-outline" size={16} color={colors.primary} />
              <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
              <TouchableOpacity onPress={handlePickFile} style={styles.changeFileBtn}>
                <Text style={styles.changeFileText}>Ändern</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.selectAllRow} onPress={toggleAll}>
              <View style={[styles.checkbox, allSelected && styles.checkboxSelected]}>
                {allSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.selectAllText}>
                {allSelected ? 'Alle abwählen' : 'Alle auswählen'}
              </Text>
              <Text style={styles.countText}>{selected.size} / {events.length}</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={events}
            keyExtractor={e => e.id}
            renderItem={({ item }) => (
              <EventRow
                event={item}
                selected={selected.has(item.id)}
                onToggle={() => toggleEvent(item.id)}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
          />

          {/* Import button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.importBtn,
                (importing || selected.size === 0) && styles.importBtnDisabled,
              ]}
              onPress={handleImport}
              disabled={importing || selected.size === 0}
              activeOpacity={0.85}
            >
              {importing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                  <Text style={styles.importBtnText}>
                    {selected.size} Termin{selected.size !== 1 ? 'e' : ''} importieren
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Navbar
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backBtn:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: typography.h3, fontWeight: typography.bold as any, color: colors.textPrimary },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: colors.primary + '20',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontSize: typography.h2,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.large,
    marginTop: spacing.sm,
  },
  pickBtnText: {
    color: '#fff',
    fontSize: typography.body,
    fontWeight: typography.bold as any,
  },

  // List header
  listHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  fileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  fileName: {
    flex: 1,
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  changeFileBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  changeFileText: {
    fontSize: typography.caption,
    color: colors.primary,
    fontWeight: typography.semibold as any,
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  selectAllText: {
    flex: 1,
    fontSize: typography.body,
    color: colors.textPrimary,
    fontWeight: typography.medium as any,
  },
  countText: {
    fontSize: typography.caption,
    color: colors.textTertiary,
  },

  // List
  listContent: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  separator:   { height: 1, backgroundColor: colors.border },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  checkbox: {
    width: 22, height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  eventInfo: { flex: 1, gap: 3 },
  eventTitle: {
    fontSize: typography.body,
    fontWeight: typography.medium as any,
    color: colors.textPrimary,
  },
  eventMeta: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  eventLocation: {
    fontSize: typography.caption,
    color: colors.textTertiary,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.large,
  },
  importBtnDisabled: { opacity: 0.4 },
  importBtnText: {
    color: '#fff',
    fontSize: typography.body,
    fontWeight: typography.bold as any,
  },
});
