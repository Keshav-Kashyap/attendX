import React, { useEffect } from 'react';
import { router } from 'expo-router';
import AppShell from '../src/components/layout/AppShell';
import HomeScreen from '../src/screens/HomeScreen';
import { useAuthStore } from '../src/store/useAuthStore';

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user)) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading || !isAuthenticated || !user) {
    return null;
  }

  return (
    <AppShell activeTab="home" fullBleedTop={true}>
      <HomeScreen user={user} />
    </AppShell>
  );
}
