import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, X, CheckCircle2 } from 'lucide-react-native';
import { Text } from '../text';
import { Avatar, AvatarImage } from '../avatar';
import { useUser } from '../../../hooks/useUser';

const Welcome = ({
  user: userProp,
  role: roleProp,
  title,
  subtitle,
  showDate = true,
  rightAction,
  onAvatarPress,
  onNotificationPress,
  unreadCount = 0,
  notifications = [],
  className = '',
}) => {
  const router = useRouter();
  const { user: globalUser, role: globalRole } = useUser();
  const user = userProp || globalUser;
  const role = (roleProp || user?.role || globalRole || 'admin').toLowerCase();
  const [showNotifications, setShowNotifications] = useState(false);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const todayDateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Extract first name (or full name for teachers) with role fallback
  const rawName = user?.name || user?.username || '';
  const trimmedName = rawName.trim();
  const firstName = trimmedName
    ? trimmedName.split(/\s+/)[0]
    : role === 'admin'
    ? 'Admin'
    : role === 'teacher'
    ? 'Teacher'
    : 'Student';
  const displayName =
    role === 'teacher'
      ? trimmedName || 'Teacher'
      : firstName;

  const initials = rawName
    ? rawName
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('')
    : firstName.charAt(0).toUpperCase();

  const avatarUri =
    user?.profile_image ||
    user?.photo_url ||
    user?.student_profile?.profile_image ||
    user?.teacher_profile?.profile_image ||
    null;

  // Role-based default subtitle
  const defaultSubtitle = (() => {
    switch (role) {
      case 'admin':
        return 'Institution Curriculum & Attendance Overview';
      case 'teacher':
        return 'Faculty Attendance & Schedule Overview';
      case 'student':
        return 'Academic Progress & Attendance Overview';
      default:
        return 'Academic & Attendance Overview';
    }
  })();

  const displaySubtitle = subtitle !== undefined ? subtitle : defaultSubtitle;

  const handleProfilePress = () => {
    if (onAvatarPress) {
      onAvatarPress();
      return;
    }
    router.push('/profile');
  };

  const handleBellPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
      return;
    }
    setShowNotifications(true);
  };

  return (
    <View className={`mb-4 ${className}`.trim()}>
      <View className={`flex-row justify-between ${role === 'teacher' ? 'items-start' : 'items-center'}`}>
        {/* Left Greeting + Subtitle */}
        <View className="flex-1 mr-3">
          <Text
            className="text-xl font-medium text-foreground tracking-tight leading-snug"
            numberOfLines={role === 'teacher' ? undefined : 1}
          >
            {title || `${greeting}, ${displayName}`}
          </Text>
          {displaySubtitle ? (
            <Text
              className="text-xs font-medium text-muted-foreground mt-0.5"
              numberOfLines={role === 'teacher' ? 2 : 1}
            >
              {showDate ? `${todayDateStr} • ` : ''}{displaySubtitle}
            </Text>
          ) : showDate ? (
            <Text className="text-xs font-medium text-muted-foreground mt-0.5" numberOfLines={1}>
              {todayDateStr}
            </Text>
          ) : null}
        </View>

        {/* Right Actions: Optional custom slot + Notification Bell + Profile Avatar */}
        <View className="flex-row items-center gap-2">
          {rightAction ? (
            <View className="items-center justify-center">
              {rightAction}
            </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleBellPress}
            accessibilityLabel="Notifications"
            className="w-10 h-10 rounded-full bg-white border border-slate-200/80 items-center justify-center shadow-xs relative"
          >
            <Bell size={18} color="#334155" strokeWidth={2} />
            {unreadCount > 0 ? (
              <View className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 border border-white" />
            ) : null}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleProfilePress}
            accessibilityLabel="Open Profile"
            className="rounded-full"
          >
            <Avatar className="h-10 w-10 border border-slate-200/80 bg-[#007AFF]/10">
              {avatarUri ? (
                <AvatarImage source={{ uri: avatarUri }} />
              ) : (
                <View className="h-full w-full items-center justify-center rounded-full bg-[#007AFF]/10">
                  <Text className="text-xs font-medium text-[#007AFF]">{initials}</Text>
                </View>
              )}
            </Avatar>
          </TouchableOpacity>
        </View>
      </View>

      {/* Default Notifications Sheet Modal (used when onNotificationPress is not provided) */}
      <Modal
        visible={showNotifications}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowNotifications(false)}
      >
        <View className="flex-1 bg-black/40 justify-center items-center px-5">
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowNotifications(false)} />
          <View className="bg-white rounded-3xl p-5 w-full max-w-sm border border-slate-200/70 shadow-xl z-10">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-[#007AFF]/10 items-center justify-center">
                  <Bell size={16} color="#007AFF" />
                </View>
                <Text className="text-base font-medium text-slate-900">
                  Notifications
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowNotifications(false)}
                className="w-7 h-7 rounded-full bg-slate-100 items-center justify-center"
              >
                <X size={15} color="#64748b" />
              </TouchableOpacity>
            </View>

            {notifications.length > 0 ? (
              <View className="border-t border-slate-100">
                {notifications.map((item, idx) => (
                  <View
                    key={item.id || idx}
                    className={`py-3 ${idx !== notifications.length - 1 ? 'border-b border-slate-100' : ''}`}
                  >
                    <Text className="text-xs font-medium text-slate-900">
                      {item.title}
                    </Text>
                    {item.message ? (
                      <Text className="text-[11px] font-medium text-slate-500 mt-0.5">
                        {item.message}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ) : (
              <View className="py-6 items-center">
                <View className="w-11 h-11 rounded-full bg-emerald-50 items-center justify-center mb-2.5">
                  <CheckCircle2 size={22} color="#10b981" />
                </View>
                <Text className="text-sm font-medium text-slate-900">
                  You're All Caught Up
                </Text>
                <Text className="text-xs font-medium text-slate-500 text-center mt-1">
                  No new alerts or notifications right now.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Welcome;
