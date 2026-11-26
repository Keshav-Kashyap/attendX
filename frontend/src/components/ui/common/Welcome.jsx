import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, Pressable, StyleSheet, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, X, CheckCircle2 } from 'lucide-react-native';
import { Text } from '../text';
import { useUser } from '../../../hooks/useUser';

const Welcome = ({
  user: userProp,
  role: roleProp,
  title,
  showDate = true,
  rightAction,
  onNotificationPress,
  unreadCount = 0,
  notifications = [],
  className = '',
}) => {
  const { user: globalUser, role: globalRole } = useUser();
  const insets = useSafeAreaInsets();
  const topInset =
    Platform.OS === 'web'
      ? 0
      : insets?.top || (Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44);
  const user = userProp || globalUser;
  const role = (roleProp || user?.role || globalRole || 'admin').toLowerCase();
  const [showNotifications, setShowNotifications] = useState(false);

  const todayDateStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
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

  const handleBellPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
      return;
    }
    setShowNotifications(true);
  };

  return (
    <View className={className}>
      <View
        style={{
          backgroundColor: '#3446D4',
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          paddingHorizontal: 20,
          paddingTop: topInset + 16,
          paddingBottom: 56,
        }}
      >
        <View className="flex-row items-center justify-between">
          {/* Left Date + Greeting */}
          <View className="flex-1 mr-3">
            {showDate ? (
              <Text
                style={{ color: 'rgba(255,255,255,0.82)' }}
                className="text-xs font-medium"
                numberOfLines={1}
              >
                {todayDateStr}
              </Text>
            ) : null}
            <Text
              className="text-[21px] font-semibold text-white tracking-tight leading-snug mt-0.5"
              numberOfLines={role === 'teacher' ? 2 : 1}
            >
              {title || `Welcome back, ${displayName}`}
            </Text>
          </View>

          {/* Right Actions: Optional custom slot + Rounded-Square Notification Bell (No Profile Avatar) */}
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
              style={{ backgroundColor: 'rgba(255,255,255,0.16)' }}
              className="w-11 h-11 rounded-2xl items-center justify-center relative"
            >
              <Bell size={20} color="#ffffff" strokeWidth={2} />
              {unreadCount > 0 ? (
                <View className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 border border-white" />
              ) : null}
            </TouchableOpacity>
          </View>
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
