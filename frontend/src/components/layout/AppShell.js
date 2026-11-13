import React from 'react';
import { View, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import BottomNav from '../BottomNav';
import { AdminSpeedDial } from '../admin';
import KeyboardSafeView, { useKeyboardVisible } from '../ui/KeyboardSafeView';
import { useAuthStore } from '../../store/useAuthStore';

export default function AppShell({
  children,
  activeTab = 'home',
  hideBottomNav = false,
}) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isKeyboardVisible = useKeyboardVisible();

  const containerStyle = {
    flex: 1,
    height: '100%',
    position: 'relative',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  };

  const userRole = (user?.role || '').toLowerCase();
  const isTeacher = userRole === 'teacher';
  const isStudent = userRole === 'student';
  const isAdmin =
    userRole === 'admin' ||
    (!isTeacher && !isStudent) ||
    (activeTab && activeTab.startsWith('admin'));

  const showBottomChrome = !hideBottomNav && !isKeyboardVisible;

  return (
    <View style={containerStyle} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <KeyboardSafeView>
        {children}
      </KeyboardSafeView>

      {showBottomChrome && (
        <BottomNav
          activeTab={activeTab}
          onTabPress={(tab) => {
            if (activeTab === tab) return;
            router.replace(`/${tab}`);
          }}
          user={user}
        />
      )}

      {/* Floating Speed Dial for Admin across every page - rendered after BottomNav for top z-index on Android */}
      {isAdmin && !isKeyboardVisible && (
        <AdminSpeedDial bottomOffset={hideBottomNav ? 24 : 84} />
      )}
    </View>
  );
}
