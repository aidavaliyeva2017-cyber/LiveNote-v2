import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TodayDashboard } from '../screens/today/TodayDashboard';
import { CalendarView } from '../screens/calendar/CalendarView';
import { AIChatScreen } from '../screens/chat/AIChatScreen';
import { ProfileDashboard } from '../screens/profile/ProfileDashboard';
import { colors, typography } from '../theme';
import { Text } from 'react-native';

export type MainTabParamList = {
  Today: undefined;
  Calendar: undefined;
  Chat: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabLabel = ({ label, focused }: { label: string; focused: boolean }) => (
  <Text
    style={{
      fontSize: typography.caption,
      color: focused ? colors.primary : colors.textSecondary,
    }}
  >
    {label}
  </Text>
);

export const MainTabsNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111827',
          borderTopColor: '#1F2937',
        },
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayDashboard}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Today" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarView}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Calendar" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={AIChatScreen}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="AI Chat" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileDashboard}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

