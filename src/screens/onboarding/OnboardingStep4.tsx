import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types/navigation';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingStep4'>;

type PermissionState = 'idle' | 'granted' | 'denied';

export const OnboardingStep4: React.FC<Props> = () => {
  const { completeOnboarding, userName } = useAuth();
  const [permState, setPermState] = useState<PermissionState>('idle');
  const [loading, setLoading] = useState(false);

  const checkAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Gentle pulse on the icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const playCheck = () => {
    Animated.spring(checkAnim, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const requestNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      setPermState('granted');
      playCheck();
    } else {
      setPermState('denied');
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    await completeOnboarding();
    // RootNavigator re-renders → routes to MainTabs automatically
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#070A12', '#0A0E1A', '#0A0E1A', '#0B3A33']}
        locations={[0, 0.25, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, i === 3 && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.content}>
        {/* Hero icon */}
        <Animated.View style={[styles.heroWrap, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient
            colors={[colors.primary + '33', colors.primary + '11']}
            style={styles.heroGradient}
          >
            <Text style={styles.heroIcon}>🎉</Text>
          </LinearGradient>
        </Animated.View>

        <Text style={styles.title}>
          {userName !== 'User' ? `Du bist bereit, ${userName}!` : 'Du bist bereit!'}
        </Text>
        <Text style={styles.subtitle}>
          LiveNote ist eingerichtet und wartet auf dich.
        </Text>

        {/* Notification card */}
        <View style={styles.notifCard}>
          <View style={styles.notifCardHeader}>
            <Text style={styles.notifIcon}>🔔</Text>
            <View style={styles.notifCardText}>
              <Text style={styles.notifCardTitle}>Smarte Erinnerungen</Text>
              <Text style={styles.notifCardDesc}>
                Erlaube Benachrichtigungen, damit LiveNote dich rechtzeitig an Termine erinnert.
              </Text>
            </View>
          </View>

          {permState === 'idle' && (
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={requestNotifications}
              activeOpacity={0.8}
            >
              <Text style={styles.notifBtnText}>Benachrichtigungen erlauben</Text>
            </TouchableOpacity>
          )}

          {permState === 'granted' && (
            <Animated.View
              style={[
                styles.permGranted,
                {
                  transform: [
                    {
                      scale: checkAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                  opacity: checkAnim,
                },
              ]}
            >
              <Text style={styles.permGrantedText}>✓ Aktiviert</Text>
            </Animated.View>
          )}

          {permState === 'denied' && (
            <Text style={styles.permDenied}>
              Nicht aktiviert — du kannst das später in den Einstellungen ändern.
            </Text>
          )}
        </View>

        {/* Feature preview */}
        <View style={styles.previewList}>
          {[
            '✨ KI-Chat ist bereit',
            '📅 Kalender eingerichtet',
            '⚡ XP-System aktiviert',
          ].map((item) => (
            <View key={item} style={styles.previewRow}>
              <Text style={styles.previewText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleFinish}
          disabled={loading}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>
              {loading ? 'Wird gestartet…' : 'LiveNote starten 🚀'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 64,
    paddingBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
  },

  heroWrap: {
    marginBottom: spacing.lg,
  },
  heroGradient: {
    width: 100,
    height: 100,
    borderRadius: 34,
    borderWidth: 1.5,
    borderColor: colors.primary + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: { fontSize: 48 },

  title: {
    fontSize: 26,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },

  notifCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.large,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  notifCardHeader: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  notifIcon: { fontSize: 28 },
  notifCardText: { flex: 1 },
  notifCardTitle: {
    fontSize: typography.body,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  notifCardDesc: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  notifBtn: {
    backgroundColor: colors.primary + '22',
    borderWidth: 1,
    borderColor: colors.primary + '66',
    borderRadius: borderRadius.medium,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  notifBtnText: {
    fontSize: typography.caption,
    color: colors.primary,
    fontWeight: typography.semibold as any,
  },
  permGranted: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  permGrantedText: {
    fontSize: typography.caption,
    color: colors.success,
    fontWeight: typography.bold as any,
  },
  permDenied: {
    fontSize: typography.caption,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.xs,
  },

  previewList: {
    width: '100%',
    gap: spacing.sm,
  },
  previewRow: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.medium,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  previewText: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 48,
  },
  btn: {
    borderRadius: borderRadius.large,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  btnText: {
    fontSize: typography.body,
    fontWeight: typography.bold as any,
    color: '#fff',
    letterSpacing: 0.3,
  },
});
