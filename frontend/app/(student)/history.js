import React from 'react';
import AppShell from '../../src/components/layout/AppShell';
import HistoryScreen from '../../src/screens/common/HistoryScreen';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function HistoryPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <AppShell activeTab="history">
      <HistoryScreen user={user} />
    </AppShell>
  );
}
