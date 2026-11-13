import React from 'react';
import { View, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import AppShell from '../src/components/layout/AppShell';
import AdminCoursesScreen from '../src/screens/admin/AdminCoursesScreen';
import { useAuthStore } from '../src/store/useAuthStore';

export default function AdminCoursesPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  const containerStyle = {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  };

  if (isLoading) {
    return (
      <View style={containerStyle} className="flex-1 bg-background items-center justify-center">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/" />;
  }

  return (
    <AppShell activeTab="admin_courses">
      <AdminCoursesScreen user={user} />
    </AppShell>
  );
}
