import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import AppShell from '../../../../src/components/layout/AppShell';
import AdminPeopleScreen from '../../../../src/screens/admin/AdminPeopleScreen';
import { useAuthStore } from '../../../../src/store/useAuthStore';

export default function AdminTeachersPage() {
  const params = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);

  return (
    <AppShell>
      <AdminPeopleScreen
        user={user}
        mode="teachers"
        initialCourseFilter={params?.courseFilter}
      />
    </AppShell>
  );
}
