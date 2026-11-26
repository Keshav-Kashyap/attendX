import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import AppShell from '../../src/components/layout/AppShell';
import AdminCoursesScreen from '../../src/screens/admin/AdminCoursesScreen';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function AdminCoursesPage() {
  const params = useLocalSearchParams();
  const user = useAuthStore((state) => state.user);

  return (
    <AppShell activeTab="admin_courses">
      <AdminCoursesScreen
        user={user}
        initialCourseId={params?.courseId}
        initialCourseCode={params?.courseCode}
        initialSemesterId={params?.semesterId}
      />
    </AppShell>
  );
}
