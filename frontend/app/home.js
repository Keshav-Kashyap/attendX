import React from 'react';
import { useRouter, Redirect } from 'expo-router';
import AppShell from '../src/components/layout/AppShell';
import HomeScreen from '../src/screens/HomeScreen';
import { useAuthStore } from '../src/store/useAuthStore';

export default function HomePage() {
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

  if (user.role === 'teacher') {
    return <Redirect href="/teacher" />;
  }

  return (
    <AppShell activeTab="home">
      <HomeScreen user={user} />
    </AppShell>
  );
}
