import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../context/AuthContext';

export const ProfileDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Profile</Text>
      <Text style={styles.subtitle}>{user?.email ?? 'Guest'}</Text>
      <Button label="Sign Out" onPress={logout} style={styles.signOutButton} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  heading: {
    fontSize: typography.h1,
    fontWeight: typography.bold as any,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  signOutButton: {
    marginTop: spacing.xl,
  },
});

