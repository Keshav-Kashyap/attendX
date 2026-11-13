import React from 'react';
import { View, Platform, StatusBar } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import StudentProfileSetup from '../src/components/auth/StudentProfileSetup';
import KeyboardSafeView from '../src/components/ui/KeyboardSafeView';
import { useAuthStore } from '../src/store/useAuthStore';

export default function BiometricsPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/" />;
  }

  const containerStyle = {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  };

  return (
    <View style={containerStyle} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardSafeView>
        <StudentProfileSetup
          user={user}
          onComplete={() => router.replace('/home')}
        />
      </KeyboardSafeView>
    </View>
  );
}
