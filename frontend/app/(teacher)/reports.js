import React from 'react';
import AppShell from '../../src/components/layout/AppShell';
import TeacherReportsTab from '../../src/components/teacher/reports/TeacherReportsTab';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function ReportsPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <AppShell activeTab="reports">
      <TeacherReportsTab user={user} />
    </AppShell>
  );
}
