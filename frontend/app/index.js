import React, { useEffect } from 'react';
import { View, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import AuthScreen from '../src/screens/Auth/AuthScreen';
import { useAuthStore } from '../src/store/useAuthStore';

export default function IndexPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  const containerStyle = {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
  };

  if (isLoading) {
    return (
      <View style={containerStyle} className="flex-1 bg-background items-center justify-center">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  if (isAuthenticated && user) {
    if (user.role === 'teacher') {
      return <Redirect href="/teacher" />;
    }

    const hasBiometrics = Boolean(
      user.profile_image ||
      user.student_profile?.profile_image ||
      user.student_profile?.has_face ||
      user.student_profile?.has_voice ||
      user.student_profile?.voice_embedding
    );

    if (user.role === 'student' && !hasBiometrics) {
      return <Redirect href="/biometrics" />;
    }

    return <Redirect href="/home" />;
  }

  const handleLogin = (userData, options = {}) => {
    if (options?.isSignup && userData?.role === 'student') {
      router.replace('/biometrics');
      return;
    }

    const hasBiometrics = Boolean(
      userData?.profile_image ||
      userData?.student_profile?.profile_image ||
      userData?.student_profile?.has_face ||
      userData?.student_profile?.has_voice ||
      userData?.student_profile?.voice_embedding
    );

    if (userData?.role === 'teacher') {
      router.replace('/teacher');
    } else if (userData?.role === 'student' && !hasBiometrics) {
      router.replace('/biometrics');
    } else {
      router.replace('/home');
    }
  };

  return (
    <View style={containerStyle} className="flex-1 bg-background">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AuthScreen onLogin={handleLogin} />
    </View>
  );
}
