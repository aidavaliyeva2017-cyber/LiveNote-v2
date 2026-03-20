import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileDashboard } from '../screens/profile/ProfileDashboard';
import { SettingsScreen } from '../screens/profile/SettingsScreen';
import { AboutScreen } from '../screens/profile/AboutScreen';
import { ChangeThemeScreen } from '../screens/profile/ChangeThemeScreen';
import { FamilyScreen } from '../screens/family/FamilyScreen';
import { JoinFamilyScreen } from '../screens/family/JoinFamilyScreen';
import { ConnectUntisScreen } from '../screens/untis/ConnectUntisScreen';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  Settings: undefined;
  About: undefined;
  ChangeTheme: undefined;
  Family: undefined;
  JoinFamily: undefined;
  ConnectUntis: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStackNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileDashboard} />
    <Stack.Screen name="Settings"    component={SettingsScreen} />
    <Stack.Screen name="About"       component={AboutScreen} />
    <Stack.Screen name="ChangeTheme" component={ChangeThemeScreen} />
    <Stack.Screen name="Family"       component={FamilyScreen} />
    <Stack.Screen name="JoinFamily"   component={JoinFamilyScreen} />
    <Stack.Screen name="ConnectUntis" component={ConnectUntisScreen} />
  </Stack.Navigator>
);
