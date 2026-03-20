import React, { useEffect } from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthProvider } from './src/context/AuthContext';
import { EventsProvider } from './src/context/EventsContext';
import { GamificationProvider } from './src/context/GamificationContext';
import { FamilyProvider } from './src/context/FamilyContext';
import { NativeCalendarProvider } from './src/context/NativeCalendarContext';
import { UntisProvider } from './src/context/UntisContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { colors } from './src/theme';
import { configureNotificationHandler, requestNotificationPermissions } from './src/services/notifications';
import { RootNavigator } from './src/navigation/RootNavigator';

// ─── Inner app – has access to ThemeContext ───────────────────────────────────
const AppInner = () => {
  const { gradient, primary } = useTheme();

  const navTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary,
      background: 'transparent',
      card: 'transparent',
    },
  };

  return (
    <LinearGradient colors={gradient} style={styles.gradient}>
      <AuthProvider>
        <FamilyProvider>
          <UntisProvider>
            <NativeCalendarProvider>
              <EventsProvider>
                <GamificationProvider>
                  <NavigationContainer theme={navTheme}>
                    <SafeAreaView style={styles.safeArea}>
                      <StatusBar style="light" />
                      <RootNavigator />
                    </SafeAreaView>
                  </NavigationContainer>
                </GamificationProvider>
              </EventsProvider>
            </NativeCalendarProvider>
          </UntisProvider>
        </FamilyProvider>
      </AuthProvider>
    </LinearGradient>
  );
};

// ─── Root ─────────────────────────────────────────────────────────────────────
const App = () => {
  useEffect(() => {
    configureNotificationHandler();
    void requestNotificationPermissions();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: 'transparent' },
});

export default App;
