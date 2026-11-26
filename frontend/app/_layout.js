import "../global.css";
import React, { useEffect } from 'react';
import { StatusBar, LogBox, View, ActivityIndicator } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import { useAuthStore } from '../src/store/useAuthStore';
import { registerForPushNotificationsAsync } from '../src/services/notificationService';
import GlobalBottomChrome from '../src/components/layout/GlobalBottomChrome';

LogBox.ignoreLogs([
  'SafeAreaView has been deprecated',
  'Cannot connect to Expo CLI',
  '[API Error]',
  'Failed to fetch',
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  const loadStoredAuth = useAuthStore((state) => state.loadStoredAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  useEffect(() => {
    if (!isAuthenticated) return;
    registerForPushNotificationsAsync();

    const receivedSub = Notifications.addNotificationReceivedListener(() => {});
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data || {};
      if (data?.type === 'class_reminder_5m' || data?.type === 'coordinator_assigned') {
        router.push('/home');
      } else if (data?.type === 'attendance_completed') {
        router.push('/(student)/history');
      }
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }, [isAuthenticated]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ActivityIndicator size="small" color="#2563eb" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'none',
          }}
        >
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="enroll" options={{ animation: 'none' }} />
          <Stack.Screen name="home" options={{ animation: 'none' }} />
          <Stack.Screen name="profile" options={{ animation: 'none' }} />
          <Stack.Screen name="(admin)" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="(teacher)" options={{ headerShown: false, animation: 'none' }} />
          <Stack.Screen name="(student)" options={{ headerShown: false, animation: 'none' }} />
        </Stack>
        <GlobalBottomChrome />
      </View>
    </QueryClientProvider>
  );
}
