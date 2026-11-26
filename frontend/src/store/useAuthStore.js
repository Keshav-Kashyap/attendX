import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setStoredToken } from '../api/client';
import { unregisterPushNotificationsAsync } from '../services/notificationService';

const USER_STORAGE_KEY = '@ai_attendance_user';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (userData, token) => {
    try {
      const normalizedUser = {
        ...userData,
        name: userData?.username || userData?.name || 'User',
      };

      set({
        user: normalizedUser,
        token: token || null,
        isAuthenticated: !!userData,
        isLoading: false,
      });

      if (token) {
        await setStoredToken(token);
      }
      if (userData) {
        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));
      }
    } catch (error) {
      console.error('Failed to save auth to storage:', error);
    }
  },

  setUser: async (userData) => {
    try {
      const current = get().user || {};
      const updated = {
        ...current,
        ...userData,
        name: userData?.username || userData?.name || current.name || 'User',
      };

      set({ user: updated });
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update user in storage:', error);
    }
  },

  logout: async () => {
    try {
      await unregisterPushNotificationsAsync();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });

      await setStoredToken(null);
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear auth from storage:', error);
    }
  },

  loadStoredAuth: async () => {
    try {
      const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;

      if (parsedUser) {
        set({
          user: parsedUser,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Failed to restore auth from storage:', error);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));
