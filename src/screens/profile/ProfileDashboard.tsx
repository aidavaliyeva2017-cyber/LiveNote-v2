import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useEvents } from '../../context/EventsContext';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, typography, borderRadius } from '../../theme';
import type { ProfileStackParamList } from '../../navigation/ProfileStack';

type Nav = NativeStackNavigationProp<ProfileStackParamList>;

// ─── XP helpers ──────────────────────────────────────────────────────────────
const XP_PER_LEVEL = 10;
function computeLevel(xp: number) { return Math.floor(xp / XP_PER_LEVEL) + 1; }
function xpProgress(xp: number) { return (xp % XP_PER_LEVEL) / XP_PER_LEVEL; }
function xpToNext(xp: number) { return XP_PER_LEVEL - (xp % XP_PER_LEVEL); }

const LEVEL_NAMES: Record<number, string> = {
  1: 'Rookie', 2: 'Explorer', 3: 'Adventurer', 4: 'Warrior',
  5: 'Champion', 6: 'Master', 7: 'Legend', 8: 'Mythic',
};
function levelName(level: number) {
  return LEVEL_NAMES[level] ?? 'Legend';
}

// ─── Level Circle ─────────────────────────────────────────────────────────────
const LevelCircle = ({ level, primary }: { level: number; primary: string }) => (
  <View style={[styles.levelCircle, { borderColor: primary }]}>
    <Text style={styles.levelLabel}>LVL</Text>
    <Text style={[styles.levelNumber, { color: primary }]}>{level}</Text>
  </View>
);

// ─── Menu Row ────────────────────────────────────────────────────────────────
const MenuRow = ({
  icon, label, onPress, iconColor = colors.textSecondary,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  iconColor?: string;
}) => (
  <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.menuIconWrap, { backgroundColor: iconColor + '22' }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <Text style={styles.menuLabel}>{label}</Text>
    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
  </TouchableOpacity>
);

// ─── Achievement Badge ────────────────────────────────────────────────────────
const AchievementBadge = ({
  iconName, label, unlocked,
}: {
  iconName: keyof typeof Ionicons.glyphMap; label: string; unlocked: boolean;
}) => (
  <View style={styles.achievement}>
    <View style={[styles.achievementIcon, !unlocked && styles.achievementLocked]}>
      <Ionicons name={iconName} size={22} color={unlocked ? colors.accentYellow : colors.textTertiary} />
    </View>
    <Text style={[styles.achievementLabel, !unlocked && { color: colors.textTertiary }]}>
      {label}
    </Text>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const ProfileDashboard: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuth();
  const { theme, primary } = useTheme();
  const { events } = useEvents();

  const xpTotal = useMemo(() => events.filter(e => e.completed).length, [events]);
  const level   = computeLevel(xpTotal);
  const progress = xpProgress(xpTotal);
  const toNext  = xpToNext(xpTotal);
  const tasksDone = useMemo(() => events.filter(e => e.completed).length, [events]);

  const streak = useMemo(() => {
    let s = 0;
    const today = new Date();
    const ms = 24 * 60 * 60 * 1000;
    let cursor = new Date(today);
    cursor.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const key = cursor.toDateString();
      if (!events.some(e => e.completed && e.start.toDateString() === key)) break;
      s++;
      cursor = new Date(cursor.getTime() - ms);
    }
    return s;
  }, [events]);

  const displayName = user?.email?.split('@')[0] ?? 'User';
  const initials    = displayName.slice(0, 2).toUpperCase();
  const email       = user?.email ?? '';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.headerAction}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Avatar ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <View style={[styles.avatar, { borderColor: primary }]}>
              <Text style={[styles.avatarInitials, { color: primary }]}>{initials}</Text>
            </View>
            <TouchableOpacity style={[styles.cameraBtn, { backgroundColor: primary }]}>
              <Ionicons name="camera" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{email}</Text>
        </View>

        {/* ── XP / Level Card ── */}
        <View style={styles.xpCard}>
          <View style={styles.xpCardTop}>
            <LevelCircle level={level} primary={primary} />
            <View style={styles.xpCardInfo}>
              <Text style={styles.xpLevelName}>
                Level {level} {levelName(level)}
              </Text>
              <Text style={styles.xpProgress}>
                {xpTotal % XP_PER_LEVEL} / {XP_PER_LEVEL} XP to Level {level + 1}
              </Text>
              <View style={styles.xpBarBg}>
                <View
                  style={[
                    styles.xpBarFill,
                    { width: `${Math.round(progress * 100)}%` as any },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statTile, { backgroundColor: colors.surface }]}>
            <Ionicons name="trophy" size={22} color={colors.accentYellow} />
            <Text style={[styles.statValue, { color: colors.accentYellow }]}>{xpTotal}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
          <View style={[styles.statTile, { backgroundColor: colors.surface }]}>
            <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            <Text style={[styles.statValue, { color: colors.success }]}>{tasksDone}</Text>
            <Text style={styles.statLabel}>Tasks Done</Text>
          </View>
          <View style={[styles.statTile, styles.streakTile]}>
            <Ionicons name="flame" size={22} color="#FF6B6B" />
            <Text style={[styles.statValue, { color: '#FF6B6B' }]}>{streak}</Text>
            <Text style={[styles.statLabel, { color: '#FF8A80' }]}>Streak</Text>
          </View>
        </View>

        {/* ── Achievements ── */}
        <View style={styles.card}>
          <View style={styles.achievementsHeader}>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming soon</Text>
            </View>
          </View>
          <View style={styles.achievementsRow}>
            <AchievementBadge iconName="flame"         label="Streak"  unlocked={streak > 0} />
            <AchievementBadge iconName="flash"         label="Speed"   unlocked={xpTotal > 5} />
            <AchievementBadge iconName="trophy"        label="Pro"     unlocked={level > 2} />
            <AchievementBadge iconName="star"          label="Master"  unlocked={level > 5} />
            <AchievementBadge iconName="diamond"       label="Legend"  unlocked={false} />
          </View>
        </View>

        {/* ── Menu ── */}
        <View style={styles.card}>
          <MenuRow icon="settings-outline"   label="Settings"        onPress={() => navigation.navigate('Settings')}    iconColor={colors.textSecondary} />
          <View style={styles.divider} />
          <MenuRow icon="information-circle-outline" label="About LiveNote"  onPress={() => navigation.navigate('About')}       iconColor={primary} />
          <View style={styles.divider} />
          <MenuRow icon="help-circle-outline" label="Help & Support"  onPress={() => Alert.alert('Help', 'Visit livenote.app/help for support.')} iconColor={colors.info} />
          <View style={styles.divider} />
          <MenuRow icon="chatbubble-outline"  label="Send Feedback"  onPress={() => Alert.alert('Feedback', 'Thank you! Feedback feature coming soon.')} iconColor={colors.success} />
          <View style={styles.divider} />
          <MenuRow icon="color-palette-outline" label="Change Theme"  onPress={() => navigation.navigate('ChangeTheme')} iconColor="#A78BFA" />
          <View style={styles.divider} />
          <MenuRow icon="people-outline"        label="Family Calendar" onPress={() => navigation.navigate('Family')} iconColor="#EC4899" />
        </View>

        {/* ── LiveNote Pro Card ── */}
        <View style={[styles.proCard, { borderColor: primary + '55' }]}>
          <View style={styles.proCardTop}>
            <View style={[styles.proIconWrap, { backgroundColor: primary + '33' }]}>
              <Ionicons name="flash" size={20} color={primary} />
            </View>
            <View style={styles.proCardText}>
              <View style={styles.proTitleRow}>
                <Text style={[styles.proTitle, { color: primary }]}>LiveNote Pro</Text>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              </View>
              <Text style={styles.proPrice}>$2.99/month</Text>
            </View>
          </View>
          <Text style={styles.proDesc}>
            Unlimited AI conversations, advanced scheduling, priority support.
          </Text>
        </View>

        {/* ── Sign Out ── */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: typography.h1,
    fontWeight: typography.bold,
    color: colors.textPrimary,
  },
  headerAction: { padding: 4 },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatarWrap: { position: 'relative', marginBottom: spacing.md },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceVariant,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 32, fontWeight: typography.bold },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  userName:  { fontSize: typography.h3, fontWeight: typography.bold, color: colors.textPrimary },
  userEmail: { fontSize: typography.caption, color: colors.textSecondary, marginTop: 2 },

  // XP Card
  xpCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  xpCardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  levelCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  levelLabel:  { fontSize: 9, color: colors.textSecondary, fontWeight: typography.bold, letterSpacing: 1 },
  levelNumber: { fontSize: 22, fontWeight: typography.bold, lineHeight: 26 },
  xpCardInfo:  { flex: 1 },
  xpLevelName: { fontSize: typography.body, fontWeight: typography.bold, color: colors.textPrimary, marginBottom: 2 },
  xpProgress:  { fontSize: typography.tiny, color: colors.textSecondary, marginBottom: spacing.sm },
  xpBarBg: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: 6,
    backgroundColor: colors.accentYellow,
    borderRadius: 3,
  },

  // Stats
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statTile: {
    flex: 1,
    borderRadius: borderRadius.medium,
    padding: spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  streakTile: { backgroundColor: '#FF6B6B22' },
  statValue: { fontSize: typography.h3, fontWeight: typography.bold },
  statLabel: { fontSize: typography.tiny, color: colors.textSecondary, textAlign: 'center' },

  // Card (shared)
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  // Achievements
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle:   { fontSize: typography.h3, fontWeight: typography.semibold, color: colors.textPrimary },
  comingSoonBadge: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.round,
  },
  comingSoonText: { fontSize: typography.tiny, color: colors.textSecondary },
  achievementsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  achievement:    { alignItems: 'center', gap: 4 },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentYellow + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementLocked: { backgroundColor: colors.surfaceVariant, opacity: 0.5 },
  achievementLabel: {
    fontSize: typography.tiny - 1,
    color: colors.textSecondary,
    fontWeight: typography.medium,
  },

  // Menu
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  menuIconWrap: {
    width: 34,
    height: 34,
    borderRadius: borderRadius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: typography.body, color: colors.textPrimary },
  divider:   { height: 1, backgroundColor: colors.border, marginVertical: 2 },

  // Pro Card
  proCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  proCardTop:   { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  proIconWrap:  { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  proCardText:  { flex: 1 },
  proTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  proTitle:     { fontSize: typography.h3, fontWeight: typography.bold },
  activeBadge:  { backgroundColor: '#22C55E33', paddingHorizontal: 8, paddingVertical: 2, borderRadius: borderRadius.round },
  activeBadgeText: { fontSize: typography.tiny, color: '#22C55E', fontWeight: typography.semibold },
  proPrice:     { fontSize: typography.tiny, color: colors.textSecondary, marginTop: 2 },
  proDesc:      { fontSize: typography.caption, color: colors.textSecondary, lineHeight: 18 },

  // Sign Out
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  signOutText: { fontSize: typography.body, color: colors.error, fontWeight: typography.medium },
});
