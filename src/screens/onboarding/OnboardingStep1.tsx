import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../types/navigation';
import { colors, spacing, typography, borderRadius } from '../../theme';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingStep1'>;

const FEATURES = [
  {
    icon: '🤖',
    title: 'KI-Assistent',
    desc: 'Plane deinen Tag einfach per Chat',
  },
  {
    icon: '⚡',
    title: 'XP & Levels',
    desc: 'Werde produktiver mit Gamification',
  },
  {
    icon: '🔔',
    title: 'Smarte Erinnerungen',
    desc: 'Verpasse nie wieder einen Termin',
  },
];

export const OnboardingStep1: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#070A12', '#0A0E1A', '#0A0E1A', '#0B3A33']}
        locations={[0, 0.25, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Progress dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.dot, i === 0 && styles.dotActive]}
          />
        ))}
      </View>

      {/* Content */}
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Logo */}
        <Animated.View
          style={[styles.logoWrap, { transform: [{ scale: logoScale }] }]}
        >
          <LinearGradient
            colors={[colors.primary + '33', colors.primary + '11']}
            style={styles.logoGradient}
          >
            <Text style={styles.logoIcon}>✨</Text>
          </LinearGradient>
        </Animated.View>

        <Text style={styles.appName}>LiveNote</Text>
        <Text style={styles.tagline}>Dein smarter KI-Kalender</Text>

        {/* Feature list */}
        <View style={styles.features}>
          {FEATURES.map((f, i) => (
            <Animated.View
              key={f.icon}
              style={[
                styles.featureRow,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [-40, 0],
                        outputRange: [20 * (i + 1), 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </View>
      </Animated.View>

      {/* CTA */}
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('OnboardingStep2')}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={styles.btnText}>Los geht's →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoWrap: {
    marginBottom: spacing.lg,
  },
  logoGradient: {
    width: 96,
    height: 96,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: colors.primary + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 44,
  },

  appName: {
    fontSize: 36,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },

  features: {
    width: '100%',
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.large,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: { fontSize: 22 },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: typography.body,
    fontWeight: typography.semibold as any,
    color: colors.textPrimary,
  },
  featureDesc: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
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
    letterSpacing: 0.5,
  },
});
