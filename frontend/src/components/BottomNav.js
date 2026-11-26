import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Platform, Animated } from 'react-native';
import {
  Home,
  LayoutGrid,
  Users,
  GraduationCap,
  BookOpen,
  User,
  ScanFace,
  BarChart3,
  Clock,
} from 'lucide-react-native';

function NavTabButton({ tab, isActive, onPress }) {
  const anim = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: isActive ? 1 : 0,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [isActive, anim]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  const IconComponent = tab.IconComponent;
  const isCenterPrimary = Boolean(tab.isCenterPrimary);

  if (isCenterPrimary) {
    return (
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={tab.label}
        style={[
          Platform.OS === 'web' ? { cursor: 'pointer' } : undefined,
          { marginTop: -18, marginHorizontal: 2 },
        ]}
        className="items-center justify-center"
      >
        <Animated.View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale }],
            backgroundColor: isActive ? '#2536C4' : '#3446D4',
            borderWidth: 3,
            borderColor: '#FFFFFF',
            elevation: isActive ? 10 : 7,
            shadowColor: '#3446D4',
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: isActive ? 0.45 : 0.3,
            shadowRadius: 10,
          }}
        >
          <IconComponent
            size={24}
            color="#ffffff"
            strokeWidth={2.3}
          />
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={tab.label}
      style={Platform.OS === 'web' ? { cursor: 'pointer' } : undefined}
      className="items-center justify-center"
    >
      <Animated.View
        style={[
          {
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale }],
          },
          isActive
            ? {
                backgroundColor: '#3446D4',
                elevation: 6,
                shadowColor: '#3446D4',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
              }
            : {
                backgroundColor: 'transparent',
              },
        ]}
      >
        <IconComponent
          size={20}
          color={isActive ? '#ffffff' : '#64748b'}
          strokeWidth={isActive ? 2.4 : 1.9}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function BottomNav({ activeTab, onTabPress, user }) {
  const isAdmin = user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  const tabs = isAdmin
    ? [
        {
          id: 'home',
          label: 'Home',
          IconComponent: Home,
        },
        {
          id: 'users',
          label: 'Teachers & students',
          IconComponent: Users,
        },
        {
          id: 'admin_courses',
          label: 'Courses',
          IconComponent: BookOpen,
        },
        {
          id: 'profile',
          label: 'Profile',
          IconComponent: User,
        },
      ]
    : isTeacher
    ? [
        {
          id: 'home',
          label: 'Dashboard',
          IconComponent: LayoutGrid,
        },
        {
          id: 'classes',
          label: 'Classes',
          IconComponent: GraduationCap,
        },
        {
          id: 'attendance',
          label: 'Scan',
          IconComponent: ScanFace,
          isCenterPrimary: true,
        },
        {
          id: 'reports',
          label: 'Reports',
          IconComponent: BarChart3,
        },
        {
          id: 'profile',
          label: 'Profile',
          IconComponent: User,
        },
      ]
    : [
        {
          id: 'home',
          label: 'Home',
          IconComponent: Home,
        },
        {
          id: 'history',
          label: 'History',
          IconComponent: Clock,
        },
        {
          id: 'profile',
          label: 'Profile',
          IconComponent: User,
        },
      ];

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        alignItems: 'center',
        zIndex: 40,
      }}
      className="px-4 pb-1 pt-1"
    >
      <View
        style={{
          gap: isTeacher ? 14 : isAdmin ? 22 : 36,
          elevation: 12,
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.14,
          shadowRadius: 16,
          marginBottom: 16,
          backgroundColor: '#ffffff',
        }}
        className="border border-slate-200/80 rounded-full py-2 px-4 flex-row items-center"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <NavTabButton
              key={tab.id}
              tab={tab}
              isActive={isActive}
              onPress={() => onTabPress(tab.id)}
            />
          );
        })}
      </View>
    </View>
  );
}
