import React from 'react';
import { router } from 'expo-router';
import AppShell from '../../src/components/layout/AppShell';
import TeacherClassesTab from '../../src/components/teacher/classes/TeacherClassesTab';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTeacherSessionStore } from '../../src/store/useTeacherSessionStore';

export default function ClassesPage() {
  const user = useAuthStore((state) => state.user);
  const setSelectedClassSession = useTeacherSessionStore((state) => state.setSelectedClassSession);

  return (
    <AppShell activeTab="classes">
      <TeacherClassesTab
        user={user}
        onStartAttendanceSession={(classItem) => {
          setSelectedClassSession(classItem);
          router.push('/attendance');
        }}
      />
    </AppShell>
  );
}
