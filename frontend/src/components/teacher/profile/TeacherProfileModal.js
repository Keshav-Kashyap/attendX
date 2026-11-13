import React, { useState } from 'react';
import { View, Modal, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text } from '../../ui/text';
import { Badge } from '../../ui/badge';
import { User, KeyRound, Bell, HelpCircle, LogOut, X } from 'lucide-react-native';
import TabMyProfile from './TabMyProfile';
import TabChangePassword from './TabChangePassword';
import TabNotifications from './TabNotifications';
import TabHelpSupport from './TabHelpSupport';
import KeyboardSafeView from '../../ui/KeyboardSafeView';

export default function TeacherProfileModal({ visible, onClose, user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('profile'); // 'profile', 'password', 'notifications', 'support'
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const teacherProfile = user?.teacher_profile;
  const displayName = user?.name || user?.username || 'Teacher';
  const facultyCode = teacherProfile?.employee_code || user?.identifier || 'FAC-01';

  const menuItems = [
    { id: 'profile', label: 'My Profile', IconComponent: User },
    { id: 'password', label: 'Password', IconComponent: KeyRound },
    { id: 'notifications', label: 'Alerts', IconComponent: Bell },
    { id: 'support', label: 'Support', IconComponent: HelpCircle },
  ];

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    if (onClose) onClose();
    if (onLogout) onLogout();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardSafeView style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' }}>
        <View
          style={{
            height: '82%',
            maxHeight: '90%',
            backgroundColor: '#ffffff',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Handle / Drag Bar */}
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: '#cbd5e1' }} />
          </View>

          {/* Modal Top Header: Teacher Info, Logout Button & Close Button */}
          <View
            style={{
              paddingHorizontal: 18,
              paddingTop: 8,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: '#f1f5f9',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Left: Avatar & Identity */}
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 18,
                  backgroundColor: '#eff6ff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: '#dbeafe',
                  marginRight: 12,
                }}
              >
                {user?.profile_image ? (
                  <Image
                    source={{ uri: user.profile_image }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#0052cc' }}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text numberOfLines={1} style={{ fontSize: 16, fontWeight: '900', color: '#0f172a' }}>
                    {displayName}
                  </Text>
                  <View
                    style={{
                      paddingHorizontal: 7,
                      paddingVertical: 1.5,
                      borderRadius: 8,
                      backgroundColor: '#fef3c7',
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#b45309' }}>
                      Faculty
                    </Text>
                  </View>
                </View>

                <Text numberOfLines={1} style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                  {user?.email}
                </Text>

                <Text style={{ fontSize: 11, fontWeight: '700', color: '#0052cc', marginTop: 1 }}>
                  ID: {facultyCode}
                </Text>
              </View>
            </View>

            {/* Right: Direct Logout Button & Close X */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowLogoutConfirm(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 14,
                  backgroundColor: '#fee2e2',
                  borderWidth: 1,
                  borderColor: '#fca5a5',
                }}
              >
                <LogOut size={15} color="#ef4444" />
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#ef4444' }}>
                  Logout
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#f1f5f9',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                }}
              >
                <X size={18} color="#475569" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout Confirmation Banner (if clicked) */}
          {showLogoutConfirm && (
            <View
              style={{
                marginHorizontal: 16,
                marginTop: 12,
                padding: 14,
                backgroundColor: '#fef2f2',
                borderWidth: 1.5,
                borderColor: '#ef4444',
                borderRadius: 18,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#991b1b', textAlign: 'center', marginBottom: 4 }}>
                Log out of faculty portal?
              </Text>
              <Text style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginBottom: 12 }}>
                You will need your username and password to log back in.
              </Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setShowLogoutConfirm(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    backgroundColor: '#ffffff',
                    borderWidth: 1,
                    borderColor: '#cbd5e1',
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleConfirmLogout}
                  style={{
                    flex: 1,
                    paddingVertical: 9,
                    backgroundColor: '#ef4444',
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '800', color: '#ffffff' }}>
                    Yes, Logout
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Tab Navigation Pill Bar */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderBottomWidth: 1,
              borderBottomColor: '#f1f5f9',
              backgroundColor: '#f8fafc',
            }}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {menuItems.map((item) => {
                const isActive = activeMenu === item.id;
                const IconComp = item.IconComponent;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.75}
                    onPress={() => setActiveMenu(item.id)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      backgroundColor: isActive ? '#0052cc' : '#ffffff',
                      borderWidth: 1,
                      borderColor: isActive ? '#0052cc' : '#e2e8f0',
                      shadowColor: '#0f172a',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: isActive ? 0.15 : 0.02,
                      shadowRadius: 2,
                      elevation: isActive ? 2 : 0,
                    }}
                  >
                    <IconComp
                      size={14}
                      color={isActive ? '#ffffff' : '#64748b'}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: isActive ? '#ffffff' : '#475569',
                      }}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Active Tab Body Content */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 18, paddingBottom: 50 }}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {activeMenu === 'profile' && (
              <TabMyProfile user={user} onSaved={() => {}} />
            )}

            {activeMenu === 'password' && (
              <TabChangePassword onPasswordChanged={() => {}} />
            )}

            {activeMenu === 'notifications' && (
              <TabNotifications />
            )}

            {activeMenu === 'support' && (
              <TabHelpSupport />
            )}

            {/* Red Logout Bar at Bottom */}
            <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setShowLogoutConfirm(true)}
                style={{
                  width: '100%',
                  paddingVertical: 13,
                  backgroundColor: '#fee2e2',
                  borderWidth: 1,
                  borderColor: '#fca5a5',
                  borderRadius: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <LogOut size={16} color="#ef4444" />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#ef4444' }}>
                  Sign Out / Log Out
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardSafeView>
    </Modal>
  );
}
