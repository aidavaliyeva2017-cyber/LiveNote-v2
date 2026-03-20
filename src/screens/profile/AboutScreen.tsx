import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../context/ThemeContext';
import { colors, spacing, typography, borderRadius } from '../../theme';

const TIPS = [
  {
    title: 'Talk to LiveNote naturally',
    body: 'Just type or speak what you need: "Remind me to call Mom at 3pm" and LiveNote will schedule it automatically.',
  },
  {
    title: 'Use "What\'s On Today?" for quick overviews',
    body: 'Tap the sparkle button on Today tab for an AI-powered summary of your day, next tasks, and priorities.',
  },
  {
    title: 'Complete tasks to earn XP',
    body: 'Every completed task earns you XP. Level up to unlock achievements and track your productivity streak.',
  },
  {
    title: 'Swipe tasks to complete quickly',
    body: 'In the Today view, tap the circle next to any task to mark it complete instantly and earn your XP.',
  },
];

const TipItem = ({ tip }: { tip: typeof TIPS[number] }) => {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={styles.tipRow}
      onPress={() => setOpen(o => !o)}
      activeOpacity={0.8}
    >
      <View style={styles.tipHeader}>
        <View style={[styles.tipDot, { backgroundColor: theme.primary }]} />
        <Text style={styles.tipTitle}>{tip.title}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textTertiary}
        />
      </View>
      {open && <Text style={styles.tipBody}>{tip.body}</Text>}
    </TouchableOpacity>
  );
};

export const AboutScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  return (
    <View style={styles.root}>
      {/* ── Navbar ── */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>About LiveNote</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── App Icon ── */}
        <View style={styles.iconSection}>
          <LinearGradient
            colors={[theme.primary + 'CC', theme.primary + '66']}
            style={styles.appIcon}
          >
            <Ionicons name="flash" size={48} color="#fff" />
          </LinearGradient>
          <Text style={styles.appName}>LiveNote</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        {/* ── Description ── */}
        <View style={styles.card}>
          <Text style={styles.description}>
            LiveNote is your AI-powered calendar assistant. Describe your tasks in natural
            language and the AI plans everything for you — reminders, scheduling, and
            smart prioritization. Powered by Anthropic Claude.
          </Text>
        </View>

        {/* ── How To Use ── */}
        <Text style={styles.sectionHeader}>HOW TO USE LIVENOTE</Text>
        <View style={styles.card}>
          {TIPS.map((tip, i) => (
            <React.Fragment key={tip.title}>
              {i > 0 && <View style={styles.divider} />}
              <TipItem tip={tip} />
            </React.Fragment>
          ))}
        </View>

        {/* ── Actions ── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: theme.primary }]}
            onPress={() => Alert.alert('Support', 'Email us at support@livenote.app')}
          >
            <Ionicons name="mail-outline" size={18} color={theme.primary} />
            <Text style={[styles.actionBtnText, { color: theme.primary }]}>Contact Support</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.accentYellow }]}
            onPress={() => Alert.alert('Rate LiveNote', 'Thanks for your support! Rating coming soon.')}
          >
            <Ionicons name="star-outline" size={18} color={colors.accentYellow} />
            <Text style={[styles.actionBtnText, { color: colors.accentYellow }]}>Rate LiveNote</Text>
          </TouchableOpacity>
        </View>

        {/* ── Social ── */}
        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => Linking.openURL('https://instagram.com')}
          >
            <Ionicons name="logo-instagram" size={22} color="#E1306C" />
            <Text style={styles.socialText}>Instagram</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialBtn}
            onPress={() => Linking.openURL('https://tiktok.com')}
          >
            <Ionicons name="logo-tiktok" size={22} color={colors.textPrimary} />
            <Text style={styles.socialText}>TikTok</Text>
          </TouchableOpacity>
        </View>

        {/* ── Footer ── */}
        <Text style={styles.footer}>Made with ❤️ by the LiveNote team</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },

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

  // Icon section
  iconSection: { alignItems: 'center', paddingVertical: spacing.xl },
  appIcon: {
    width: 100,
    height: 100,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: typography.h1,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  versionBadge: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.round,
  },
  versionText: { fontSize: typography.caption, color: colors.textSecondary },

  // Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  sectionHeader: {
    fontSize: typography.tiny,
    fontWeight: typography.bold,
    color: colors.textTertiary,
    letterSpacing: 1.2,
    marginBottom: spacing.sm,
    marginLeft: 4,
  },

  // Tips
  tipRow: { paddingVertical: spacing.sm },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  tipDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  tipTitle: { flex: 1, fontSize: typography.body, color: colors.textPrimary, fontWeight: typography.medium },
  tipBody:  {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.sm,
    marginLeft: 20,
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 2 },

  // Actions
  actionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.large,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  actionBtnText: { fontSize: typography.caption, fontWeight: typography.semibold },

  // Social
  socialRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.large,
    backgroundColor: colors.surface,
  },
  socialText: { fontSize: typography.caption, color: colors.textPrimary, fontWeight: typography.medium },

  footer: {
    textAlign: 'center',
    fontSize: typography.caption,
    color: colors.textTertiary,
    marginBottom: spacing.md,
  },
});
