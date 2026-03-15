import React from 'react';
import { AuthStackNavigator } from './AuthStack';
import { MainTabsNavigator } from './MainTabs';
import OnboardingStack from './OnboardingStack';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';

export const RootNavigator = () => {
  const { token, onboardingCompleted, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner />
      </View>
    );
  }

  if (!token) {
    return <AuthStackNavigator />;
  }

  if (!onboardingCompleted) {
    return <OnboardingStack />;
  }

  return <MainTabsNavigator />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
