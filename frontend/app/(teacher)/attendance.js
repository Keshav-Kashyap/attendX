import React from 'react';
import AppShell from '../../src/components/layout/AppShell';
import TeacherAttendanceTab from '../../src/components/teacher/attendance/TeacherAttendanceTab';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useTeacherSessionStore } from '../../src/store/useTeacherSessionStore';

export default function AttendancePage() {
  const user = useAuthStore((state) => state.user);
  const selectedClassSession = useTeacherSessionStore((state) => state.selectedClassSession);

  return (
    <AppShell activeTab="attendance">
      <TeacherAttendanceTab
        user={user}
        preselectedSession={selectedClassSession}
      />
    </AppShell>
  );
}
