import React from 'react';
import { useRouter, Redirect } from 'expo-router';
import AppShell from '../src/components/layout/AppShell';
import ProfileScreen from '../src/screens/common/ProfileScreen';
import { useAuthStore } from '../src/store/useAuthStore';
import { useLogout } from '../src/hooks/useAuth';

export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const logoutMutation = useLogout();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/" />;
  }

  const handleLogout = () => {
    logoutMutation.mutate();
    router.replace('/');
  };

  return (
    <AppShell activeTab="profile">
      <ProfileScreen
        user={user}
        onLogout={handleLogout}
        onOpenBiometrics={() => router.push('/biometrics')}
      />
    </AppShell>
  );
}
