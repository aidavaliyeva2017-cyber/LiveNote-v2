import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingStep1 } from '../screens/onboarding/OnboardingStep1';
import { OnboardingStep2 } from '../screens/onboarding/OnboardingStep2';
import { OnboardingStep3 } from '../screens/onboarding/OnboardingStep3';
import { OnboardingStep4 } from '../screens/onboarding/OnboardingStep4';
import { OnboardingStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export default function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="OnboardingStep1" component={OnboardingStep1} />
      <Stack.Screen name="OnboardingStep2" component={OnboardingStep2} />
      <Stack.Screen name="OnboardingStep3" component={OnboardingStep3} />
      <Stack.Screen name="OnboardingStep4" component={OnboardingStep4} />
    </Stack.Navigator>
  );
}
