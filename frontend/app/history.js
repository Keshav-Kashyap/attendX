import React from 'react';
import { useRouter, Redirect } from 'expo-router';
import AppShell from '../src/components/layout/AppShell';
import HistoryScreen from '../src/screens/common/HistoryScreen';
import { useAuthStore } from '../src/store/useAuthStore';

export default function HistoryPage() {
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

  return (
    <AppShell activeTab="history">
      <HistoryScreen user={user} />
    </AppShell>
  );
}
