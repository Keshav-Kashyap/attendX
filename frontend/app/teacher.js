import React from 'react';
import { View, Platform, StatusBar } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import TeacherScreen from '../src/screens/teacher/TeacherScreen';
import { useAuthStore } from '../src/store/useAuthStore';
import { useLogout } from '../src/hooks/useAuth';

export default function TeacherPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const logoutMutation = useLogout();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/" />;
  }

  const handleLogout = () => {
    logoutMutation.mutate();
    router.replace('/');
  };

  const containerStyle = {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  };

  return (
    <View style={containerStyle} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <TeacherScreen user={user} onLogout={handleLogout} />
    </View>
  );
}
