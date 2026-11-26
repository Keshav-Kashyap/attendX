import React, { useEffect } from 'react';
import { View, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { Slot, router } from 'expo-router';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function AdminGroupLayout() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <View
        style={{
          flex: 1,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
        }}
        className="flex-1 bg-[#F5F6FA] items-center justify-center"
      >
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ActivityIndicator size="large" color="#3446D4" />
      </View>
    );
  }

  return <Slot />;
}
