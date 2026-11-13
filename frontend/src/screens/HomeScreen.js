import React from 'react';
import { useRouter, Redirect } from 'expo-router';
import { useAdminStats } from '../hooks/useAdmin';
import AdminHomeView from './admin/AdminHomeView';
import StudentHomeView from './student/StudentHomeView';

export default function HomeScreen({ user, onNavigate }) {
  const router = useRouter();
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';
  const { data: adminStats } = useAdminStats();

  const handleNav = (route, params) => {
    if (onNavigate) {
      onNavigate(route, params);
      return;
    }
    const path = route.startsWith('/') ? route : `/${route}`;
    if (params && Object.keys(params).length > 0) {
      router.push({ pathname: path, params });
    } else {
      router.push(path);
    }
  };

  if (isTeacher) {
    return <Redirect href="/teacher" />;
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
