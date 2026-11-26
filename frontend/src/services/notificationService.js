import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { apiClient } from '../api/client';

const FCM_TOKEN_STORAGE_KEY = '@attendx_fcm_token';
const DEFAULT_CHANNEL_ID = 'attendx_default';

// Ensure foreground notifications are displayed with alert, sound, and banner
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureAndroidNotificationChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(DEFAULT_CHANNEL_ID, {
    name: 'attendX Notifications',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2563eb',
    sound: 'default',
  });
}

/**
 * Requests permission, obtains the native FCM/APNs device push token,
 * and registers it with the attendX backend.
 */
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    await ensureAndroidNotificationChannel();

    if (!Device.isDevice) {
      console.log('[FCM] Physical device required for native push tokens.');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[FCM] Push notification permission denied.');
      return null;
    }

    console.log('[FCM] Fetching native device push token...');
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    const fcmToken = deviceToken?.data;
    if (!fcmToken) {
      console.warn('[FCM] Empty device push token returned.');
      return null;
    }

    console.log('[FCM] Got native token:', String(fcmToken).slice(0, 20) + '...');
    await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, String(fcmToken));
    const res = await apiClient('/api/notifications/device-token', {
      method: 'POST',
      body: {
        token: String(fcmToken),
        platform: Platform.OS,
      },
    });

    console.log('[FCM] Device token registered with backend:', res);
    return String(fcmToken);
  } catch (error) {
    // Non-fatal: Expo Go or missing google-services.json in local dev should not crash the app
    console.warn('[FCM] Registration skipped/failed:', error?.message || error);
    return null;
  }
}

export async function unregisterPushNotificationsAsync() {
  if (Platform.OS === 'web') return;
  try {
    const storedToken = await AsyncStorage.getItem(FCM_TOKEN_STORAGE_KEY);
    if (storedToken) {
      await apiClient('/api/notifications/device-token', {
        method: 'DELETE',
        body: { token: storedToken },
      });
      await AsyncStorage.removeItem(FCM_TOKEN_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('[FCM] Failed to unregister device token:', error?.message || error);
  }
}

export async function getNotificationPreferences() {
  return apiClient('/api/notifications/preferences', { method: 'GET' });
}

export async function updateNotificationPreferences(preferences) {
  return apiClient('/api/notifications/preferences', {
    method: 'PUT',
    body: preferences,
  });
}

export async function sendTestNotification() {
  return apiClient('/api/notifications/test', { method: 'POST' });
}
