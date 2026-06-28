import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/theme';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import MainTabNavigator from './MainTabNavigator';

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: ['https://uangq.vercel.app', Linking.createURL('/')],
  config: {
    screens: {
      Main: {
        screens: {
          Profil: {
            screens: {
              UpdatePassword: 'update-password',
            },
          },
        },
      },
    },
  },
};

export default function AppNavigator() {
  const { session, initialized } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('has_seen_onboarding').then((value) => {
      setHasSeenOnboarding(value === 'true');
    });
  }, []);

  if (!initialized || hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgPrimary }}>
        <ActivityIndicator size="large" color={COLORS.purple} />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session && session.user ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <>
            {!hasSeenOnboarding && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
