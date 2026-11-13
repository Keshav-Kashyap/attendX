import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Platform, Animated } from 'react-native';
import {
  Home,
  LayoutGrid,
  Users,
  GraduationCap,
  BookOpen,
  User,
  Scan,
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
                backgroundColor: '#2563eb',
                elevation: 6,
                shadowColor: '#2563eb',
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
          id: 'admin_teachers',
          label: 'Teachers',
          IconComponent: Users,
        },
        {
          id: 'admin_students',
          label: 'Students',
          IconComponent: GraduationCap,
        },
        {
          id: 'admin_courses',
          label: 'Courses',
          IconComponent: BookOpen,
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
          IconComponent: Scan,
        },
        {
          id: 'reports',
          label: 'Reports',
          IconComponent: BarChart3,
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
    <View className="px-5 pb-1 pt-1 bg-transparent items-center">
      <View
        style={{
          gap: 36,
          elevation: 12,
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          marginBottom:20,
        }}
        className="bg-card border border-border/80 rounded-full py-2 px-5 flex-row items-center"
      >
        {tabs.map((tab) => {
          const isActive =
            activeTab === tab.id ||
            (tab.id === 'admin_teachers' && activeTab === 'admin_teacher_assign');

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
