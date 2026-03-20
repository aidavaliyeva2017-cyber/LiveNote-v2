import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackParamList } from '../../navigation/AuthStack';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { useAuth } from '../../context/AuthContext';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { signInAsGuest } = useAuth();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.logoContainer}
      >
        <Text style={styles.logoText}>LN</Text>
      </LinearGradient>

      <Text style={styles.title}>LiveNote</Text>
      <Text style={styles.subtitle}>Dein KI-gestützter Kalender-Assistent</Text>

      <View style={styles.featuresRow}>
        <Card style={styles.featureCard}>
          <Ionicons name="calendar-outline" size={24} color={colors.primary} style={styles.featureIconGap} />
          <Text style={styles.featureLabel}>Kalender</Text>
        </Card>
        <Card style={styles.featureCard}>
          <Ionicons name="hardware-chip-outline" size={24} color={colors.primary} style={styles.featureIconGap} />
          <Text style={styles.featureLabel}>KI-Assistent</Text>
        </Card>
        <Card style={styles.featureCard}>
          <Ionicons name="flash-outline" size={24} color={colors.primary} style={styles.featureIconGap} />
          <Text style={styles.featureLabel}>Level Up</Text>
        </Card>
      </View>

      <View style={styles.footer}>
        <Button
          label="Konto erstellen"
          onPress={() => navigation.navigate('Register')}
        />

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>Bereits ein Konto? <Text style={{ color: colors.primary }}>Anmelden</Text></Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>oder</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.guestBtn}
          onPress={signInAsGuest}
          activeOpacity={0.7}
        >
          <Ionicons name="person-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.guestText}>Ohne Konto testen</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  logoContainer: {
    alignSelf: 'center',
    width: 96, height: 96,
    borderRadius: borderRadius.round,
    alignItems: 'center', justifyContent: 'center',
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
    flex: 1, alignItems: 'center',
    marginHorizontal: spacing.xs,
    backgroundColor: colors.surfaceVariant,
  },
  featureIconGap: { marginBottom: spacing.sm },
  featureLabel: { fontSize: typography.caption, color: colors.textSecondary },

  footer: {
    marginTop: 'auto',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  loginBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  loginText: { fontSize: typography.body, color: colors.textSecondary },

  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: spacing.sm, marginVertical: spacing.xs,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { fontSize: typography.caption, color: colors.textTertiary },

  guestBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.medium,
    borderWidth: 1, borderColor: colors.border,
  },
  guestText: { fontSize: typography.body, color: colors.textSecondary },
});
