import React from 'react';
import AppShell from '../../../src/components/layout/AppShell';
import AdminTeacherAssignScreen from '../../../src/screens/admin/AdminTeacherAssignScreen';
import { useAuthStore } from '../../../src/store/useAuthStore';

export default function AdminTeacherAssignPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <AppShell>
      <AdminTeacherAssignScreen user={user} />
    </AppShell>
  );
}
