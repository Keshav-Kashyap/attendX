import React from 'react';
import { usePathname } from 'expo-router';
import BottomNav from '../BottomNav';
import { AdminSpeedDial } from '../admin';
import { useKeyboardVisible } from '../ui/KeyboardSafeView';
import { useAuthStore } from '../../store/useAuthStore';
import { safeNavigate } from '../../utils/navigation';

const NAV_TAB_ROUTES = {
  '/home': 'home',
  '/admin_courses': 'admin_courses',
  '/classes': 'classes',
  '/attendance': 'attendance',
  '/reports': 'reports',
  '/history': 'history',
  '/profile': 'profile',
};

function resolveActiveTab(pathname) {
  if (!pathname) return null;
  if (
    pathname === '/users' ||
    pathname === '/users/teachers' ||
    pathname === '/users/students'
  ) {
    return 'users';
  }
  return NAV_TAB_ROUTES[pathname] || null;
}

export default function GlobalBottomChrome() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isKeyboardVisible = useKeyboardVisible();

  if (!isAuthenticated || !user || isKeyboardVisible) {
    return null;
  }

  const activeTab = resolveActiveTab(pathname);
  if (!activeTab) {
    return null;
  }

  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin';

  return (
    <>
      <BottomNav
        activeTab={activeTab}
        onTabPress={(tab) => {
          if (activeTab === tab) return;
          safeNavigate(`/${tab}`);
        }}
        user={user}
      />

      {isAdmin && activeTab !== 'users' && (
        <AdminSpeedDial bottomOffset={84} />
      )}
    </>
  );
}
