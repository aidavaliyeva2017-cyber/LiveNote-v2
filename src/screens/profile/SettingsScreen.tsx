import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useUntis } from '../../context/UntisContext';
import { colors, spacing, typography, borderRadius } from '../../theme';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../../navigation/ProfileStack';

// ─── Sub-components ───────────────────────────────────────────────────────────
const SectionHeader = ({ title }: { title: string }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

const SettingsRow = ({
  icon, label, value, onPress, iconColor = colors.textSecondary, danger = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  iconColor?: string;
  danger?: boolean;
}) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.rowIcon, { backgroundColor: (danger ? colors.error : iconColor) + '22' }]}>
      <Ionicons name={icon} size={18} color={danger ? colors.error : iconColor} />
    </View>
    <Text style={[styles.rowLabel, danger && { color: colors.error }]}>{label}</Text>
    {value ? <Text style={styles.rowValue}>{value}</Text> : null}
    {!danger && <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />}
  </TouchableOpacity>
);

const ToggleRow = ({
  icon, label, value, onToggle, iconColor = colors.textSecondary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  iconColor?: string;
}) => (
  <View style={styles.row}>
    <View style={[styles.rowIcon, { backgroundColor: iconColor + '22' }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <Text style={styles.rowLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: colors.border, true: colors.primary + '80' }}
      thumbColor={value ? colors.primary : colors.textTertiary}
    />
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { logout } = useAuth();
  const { primary } = useTheme();
  const { connected: untisConnected } = useUntis();

  // Notification toggles
  const [taskReminders,      setTaskReminders]      = useState(true);
  const [dailySummary,       setDailySummary]       = useState(true);
  const [levelUpCelebrations,setLevelUpCelebrations]= useState(true);

  // Reminder timing
  const TIMINGS = ['5 min', '15 min', '30 min', '1 hr'];
  const [selectedTiming, setSelectedTiming] = useState('15 min');

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is permanent and cannot be undone. All your data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => Alert.alert('Account Deleted', 'Your account has been deleted.'),
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      {/* ── Navbar ── */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Integrations ── */}
        <SectionHeader title="INTEGRATIONS" />
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('ConnectUntis')}
            activeOpacity={0.7}
          >
            <View style={[styles.rowIcon, { backgroundColor: '#F59E0B22' }]}>
              <Ionicons name="school-outline" size={18} color="#F59E0B" />
            </View>
            <Text style={styles.rowLabel}>Connect Untis</Text>
            <View style={styles.untisBadge}>
              <View style={[styles.untisDot, { backgroundColor: untisConnected ? colors.success : colors.textTertiary }]} />
              <Text style={[styles.untisBadgeText, { color: untisConnected ? colors.success : colors.textTertiary }]}>
                {untisConnected ? 'Connected' : 'Not connected'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* ── Preferences ── */}
        <SectionHeader title="PREFERENCES" />
        <View style={styles.card}>
          <SettingsRow
            icon="calendar-outline"
            label="Baseline Schedule"
            onPress={() => Alert.alert('Baseline Schedule', 'Configure your default weekly schedule.')}
            iconColor={primary}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="notifications-outline"
            label="Notification Timing"
            value={selectedTiming}
            onPress={() => {}}
            iconColor={colors.accentYellow}
          />
        </View>

        {/* ── Notifications ── */}
        <SectionHeader title="NOTIFICATIONS" />
        <View style={styles.card}>
          <ToggleRow
            icon="alarm-outline"
            label="Task Reminders"
            value={taskReminders}
            onToggle={setTaskReminders}
            iconColor={primary}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="sunny-outline"
            label="Daily Summary"
            value={dailySummary}
            onToggle={setDailySummary}
            iconColor={colors.accentYellow}
          />
          <View style={styles.divider} />
          <ToggleRow
            icon="star-outline"
            label="Level Up Celebrations"
            value={levelUpCelebrations}
            onToggle={setLevelUpCelebrations}
            iconColor="#A78BFA"
          />
        </View>

        {/* ── Reminder Timing ── */}
        <SectionHeader title="REMINDER TIMING" />
        <View style={styles.card}>
          <Text style={styles.timingLabel}>Remind me before tasks:</Text>
          <View style={styles.timingRow}>
            {TIMINGS.map(t => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.timingBtn,
                  selectedTiming === t && { backgroundColor: primary },
                ]}
                onPress={() => setSelectedTiming(t)}
              >
                <Text
                  style={[
                    styles.timingBtnText,
                    selectedTiming === t && { color: '#fff' },
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Account ── */}
        <SectionHeader title="ACCOUNT" />
        <View style={styles.card}>
          {/* Pro Card mini */}
          <View style={[styles.proMini, { borderColor: primary + '44' }]}>
            <Ionicons name="flash" size={18} color={primary} />
            <Text style={[styles.proMiniText, { color: primary }]}>LiveNote Pro</Text>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <SettingsRow
            icon="download-outline"
            label="Export Calendar (.ics)"
            onPress={() => Alert.alert('Export', 'Exporting your calendar…')}
            iconColor={colors.info}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="calendar-number-outline"
            label="Import Calendar (.ics)"
            onPress={() => navigation.navigate('ICSImport')}
            iconColor={colors.primary}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="shield-outline"
            label="Privacy Policy"
            onPress={() => Alert.alert('Privacy Policy', 'Visit livenote.app/privacy')}
            iconColor={colors.textSecondary}
          />
          <View style={styles.divider} />
          <SettingsRow
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => Alert.alert('Terms', 'Visit livenote.app/terms')}
            iconColor={colors.textSecondary}
          />
        </View>

        {/* ── Danger Zone ── */}
        <SectionHeader title="DANGER ZONE" />
        <View style={styles.card}>
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={18} color="#fff" />
            <Text style={styles.deleteBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* ── Version ── */}
        <Text style={styles.version}>LiveNote v1.0.0</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },

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
  navTitle: { fontSize: typography.h3, fontWeight: typography.bold, color: colors.textPrimary },

  content: { paddingHorizontal: spacing.lg },

  sectionHeader: {
    fontSize: typography.tiny,
    fontWeight: typography.bold,
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: colors.border },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: spacing.md,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: typography.body, color: colors.textPrimary },
  rowValue: { fontSize: typography.caption, color: colors.textSecondary, marginRight: 4 },

  untisBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 4 },
  untisDot:   { width: 7, height: 7, borderRadius: 4 },
  untisBadgeText: { fontSize: typography.tiny, fontWeight: typography.semibold },

  // Timing
  timingLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  timingRow: { flexDirection: 'row', gap: spacing.sm, paddingBottom: spacing.md },
  timingBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.medium,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
  },
  timingBtnText: { fontSize: typography.caption, color: colors.textSecondary, fontWeight: typography.medium },

  // Pro mini
  proMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.sm,
    marginVertical: spacing.sm,
  },
  proMiniText:  { flex: 1, fontSize: typography.body, fontWeight: typography.bold },
  activeBadge:  { backgroundColor: '#22C55E33', paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.round },
  activeBadgeText: { fontSize: typography.tiny, color: '#22C55E', fontWeight: typography.semibold },

  // Delete
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error,
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.md,
    marginVertical: spacing.md,
  },
  deleteBtnText: { color: '#fff', fontSize: typography.body, fontWeight: typography.bold },

  version: {
    textAlign: 'center',
    fontSize: typography.caption,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
});
