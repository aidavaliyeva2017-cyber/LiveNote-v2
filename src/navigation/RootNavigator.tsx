import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthStackNavigator } from './AuthStack';
import { MainTabsNavigator } from './MainTabs';
import OnboardingStack from './OnboardingStack';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ResetPasswordScreen } from '../screens/auth/ResetPasswordScreen';
import { GuestUpgradeModal } from '../components/auth/GuestUpgradeModal';
import { colors, spacing, typography } from '../theme';

// ─── Guest Banner ─────────────────────────────────────────────────────────────
const GuestBanner = ({ onRegister }: { onRegister: () => void }) => (
  <View style={styles.banner}>
    <Ionicons name="person-outline" size={16} color={colors.accentYellow} />
    <Text style={styles.bannerText} numberOfLines={1}>
      Gast-Modus – Daten nur lokal gespeichert
    </Text>
    <TouchableOpacity style={styles.bannerBtn} onPress={onRegister}>
      <Text style={styles.bannerBtnText}>Konto erstellen</Text>
    </TouchableOpacity>
  </View>
);

// ─── Root Navigator ───────────────────────────────────────────────────────────
export const RootNavigator = () => {
  const { user, isGuest, onboardingCompleted, pendingPasswordReset, loading } = useAuth();
  const [upgradeVisible, setUpgradeVisible] = useState(false);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  if (pendingPasswordReset) {
    return <ResetPasswordScreen />;
  }

  if (!user) {
    return <AuthStackNavigator />;
  }

  if (!isGuest && !onboardingCompleted) {
    return <OnboardingStack />;
  }

  return (
    <View style={{ flex: 1 }}>
      {isGuest && <GuestBanner onRegister={() => setUpgradeVisible(true)} />}
      <MainTabsNavigator />
      {isGuest && (
        <GuestUpgradeModal
          visible={upgradeVisible}
          onClose={() => setUpgradeVisible(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accentYellow + '20',
    borderBottomWidth: 1,
    borderBottomColor: colors.accentYellow + '40',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bannerText: {
    flex: 1,
    fontSize: typography.caption,
    color: colors.accentYellow,
  },
  bannerBtn: {
    backgroundColor: colors.accentYellow,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bannerBtnText: {
    fontSize: typography.tiny,
    fontWeight: typography.bold as any,
    color: '#000',
  },
});
