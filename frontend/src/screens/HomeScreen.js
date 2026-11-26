import React from 'react';
import { useAdminStats } from '../hooks/useAdmin';
import AdminHomeView from './admin/AdminHomeView';
import StudentHomeView from './student/StudentHomeView';
import TeacherHomeTab from '../components/teacher/home/TeacherHomeTab';
import { useTeacherSessionStore } from '../store/useTeacherSessionStore';
import { safeNavigate, safePush } from '../utils/navigation';

export default function HomeScreen({ user, onNavigate }) {
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const { data: adminStats } = useAdminStats();
  const setSelectedClassSession = useTeacherSessionStore((state) => state.setSelectedClassSession);

  const handleNav = (route, params) => {
    if (onNavigate) {
      onNavigate(route, params);
      return;
    }
    const path = route.startsWith('/') ? route : `/${route}`;
    if (params && Object.keys(params).length > 0) {
      safePush({ pathname: path, params });
    } else {
      safeNavigate(path);
    }
  };

  if (isTeacher) {
    return (
      <TeacherHomeTab
        user={user}
        onNavigateTab={(tab, navParams) => {
          if (navParams) setSelectedClassSession(navParams);
          safeNavigate(`/${tab}`);
        }}
        onStartAttendanceSession={(classItem) => {
          setSelectedClassSession(classItem);
          safeNavigate('/attendance');
        }}
        onOpenProfile={() => safeNavigate('/profile')}
      />
    );
  }

  if (isAdmin) {
    return (
      <AdminHomeView
        user={user}
        adminStats={adminStats}
        onNavigate={handleNav}
      />
    );
  }

  // Fallback for student role
  return <StudentHomeView user={user} onNavigate={handleNav} />;
}
