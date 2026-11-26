import React from 'react';
import AppShell from '../../src/components/layout/AppShell';
import TeacherStudentsTab from '../../src/components/teacher/students/TeacherStudentsTab';
import { useAuthStore } from '../../src/store/useAuthStore';

export default function StudentsPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <AppShell activeTab="students">
      <TeacherStudentsTab user={user} />
    </AppShell>
  );
}
