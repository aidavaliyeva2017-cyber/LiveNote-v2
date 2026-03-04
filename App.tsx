import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import { colors } from './src/theme';
import { AuthProvider } from './src/context/AuthContext';
import { EventsProvider } from './src/context/EventsContext';
import { configureNotificationHandler, requestNotificationPermissions } from './src/services/notifications';
import { RootNavigator } from './src/navigation/RootNavigator';

const App = () => {
  useEffect(() => {
    configureNotificationHandler();
    void requestNotificationPermissions();
  }, []);

  return (
    <AuthProvider>
      <EventsProvider>
        <NavigationContainer>
          <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <RootNavigator />
          </SafeAreaView>
        </NavigationContainer>
      </EventsProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default App;


