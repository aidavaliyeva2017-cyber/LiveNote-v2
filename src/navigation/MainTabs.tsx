import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TodayDashboard } from '../screens/today/TodayDashboard';
import { CalendarView } from '../screens/calendar/CalendarView';
import { AIChatScreen } from '../screens/chat/AIChatScreen';
import { ProfileStackNavigator } from './ProfileStack';
import { colors, typography } from '../theme';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export type MainTabParamList = {
  Today: undefined;
  Calendar: undefined;
  Chat: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabLabel = ({
  label, focused, primary,
}: {
  label: string; focused: boolean; primary: string;
}) => (
  <Text
    style={{
      fontSize: typography.caption,
      color: focused ? primary : colors.textSecondary,
    }}
  >
    {label}
  </Text>
);

export const MainTabsNavigator = () => {
  const { gradient, primary } = useTheme();
  const { bottom } = useSafeAreaInsets();

  // 50px for icons + labels, then the safe area gap above the home indicator
  const TAB_HEIGHT = 50 + bottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: gradient[0],
          borderTopColor: primary + '33',
          borderTopWidth: 1,
          height: TAB_HEIGHT,
          paddingTop: 8,
          paddingBottom: bottom > 0 ? bottom - 4 : 8,
        },
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayDashboard}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Today" focused={focused} primary={primary} />,
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={focused ? primary : colors.textSecondary}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarView}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Calendar" focused={focused} primary={primary} />,
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={size}
              color={focused ? primary : colors.textSecondary}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={AIChatScreen}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="AI Chat" focused={focused} primary={primary} />,
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? 'chatbubble' : 'chatbubble-outline'}
              size={size}
              color={focused ? primary : colors.textSecondary}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: ({ focused }) => <TabLabel label="Profile" focused={focused} primary={primary} />,
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={size}
              color={focused ? primary : colors.textSecondary}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
