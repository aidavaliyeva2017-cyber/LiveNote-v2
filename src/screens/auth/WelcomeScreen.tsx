import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { colors, spacing, typography, borderRadius } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.logoContainer}
      >
        <Text style={styles.logoText}>LN</Text>
      </LinearGradient>

      <Text style={styles.title}>LiveNote</Text>
      <Text style={styles.subtitle}>Your AI-powered calendar assistant</Text>

      <View style={styles.featuresRow}>
        <Card style={styles.featureCard}>
          <Text style={styles.featureIcon}>📅</Text>
          <Text style={styles.featureLabel}>Smart Calendar</Text>
        </Card>
        <Card style={styles.featureCard}>
          <Text style={styles.featureIcon}>🤖</Text>
          <Text style={styles.featureLabel}>AI Powered</Text>
        </Card>
        <Card style={styles.featureCard}>
          <Text style={styles.featureIcon}>⚡</Text>
          <Text style={styles.featureLabel}>Level Up</Text>
        </Card>
      </View>

      <View style={styles.footer}>
        <Button
          label="✨ Get Started"
          onPress={() => navigation.navigate('Register')}
        />
        <Text
          style={styles.signIn}
          onPress={() => navigation.navigate('Login')}
        >
          Sign In
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  logoContainer: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: borderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoText: {
    fontSize: typography.h2,
    color: colors.textPrimary,
    fontWeight: typography.bold as any,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  featureCard: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
    backgroundColor: colors.surfaceVariant,
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  featureLabel: {
    fontSize: typography.caption,
    color: colors.textSecondary,
  },
  footer: {
    marginTop: 'auto',
    marginBottom: spacing.xl,
  },
  signIn: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: typography.body,
  },
});

