import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import TeacherProfileModal from '../../components/teacher/profile/TeacherProfileModal';
import TeacherHomeTab from '../../components/teacher/home/TeacherHomeTab';
import TeacherClassesTab from '../../components/teacher/classes/TeacherClassesTab';
import TeacherAttendanceTab from '../../components/teacher/attendance/TeacherAttendanceTab';
import TeacherStudentsTab from '../../components/teacher/students/TeacherStudentsTab';
import TeacherReportsTab from '../../components/teacher/reports/TeacherReportsTab';
import BottomNav from '../../components/BottomNav';
import KeyboardSafeView, { useKeyboardVisible } from '../../components/ui/KeyboardSafeView';

export default function TeacherScreen({ user, onLogout }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('home');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedClassSession, setSelectedClassSession] = useState(null);
  const isKeyboardVisible = useKeyboardVisible();

  const handleStartAttendanceFromAnywhere = (classItem) => {
    setSelectedClassSession(classItem);
    setActiveTab('attendance');
  };

  const handleNavigateTab = (tab, navParams) => {
    if (navParams) setSelectedClassSession(navParams);
    if (['home', 'classes', 'attendance', 'students', 'reports'].includes(tab)) {
      setActiveTab(tab);
    } else {
      router.push(`/${tab}`);
    }
  };

  return (
    <View className="flex-1 bg-background">
    
      {/* Active Tab Content Body */}
      <KeyboardSafeView>
        {activeTab === 'home' && (
          <TeacherHomeTab
            user={user}
            onNavigateTab={handleNavigateTab}
            onStartAttendanceSession={handleStartAttendanceFromAnywhere}
            onOpenProfile={() => setShowProfileModal(true)}
          />
        )}

        {activeTab === 'classes' && (
          <TeacherClassesTab
            user={user}
            onStartAttendanceSession={handleStartAttendanceFromAnywhere}
          />
        )}

        {activeTab === 'attendance' && (
          <TeacherAttendanceTab
            user={user}
            preselectedSession={selectedClassSession}
          />
        )}

        {activeTab === 'students' && (
          <TeacherStudentsTab user={user} />
        )}

        {activeTab === 'reports' && (
          <TeacherReportsTab user={user} />
        )}
      </KeyboardSafeView>

      {/* Teacher Bottom Navigation */}
      {!isKeyboardVisible && (
        <BottomNav
          activeTab={activeTab}
          onTabPress={(tab) => {
            setActiveTab(tab);
          }}
          user={user}
        />
      )}

      {/* Teacher Profile & Settings Modal */}
      <TeacherProfileModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onLogout={onLogout}
      />
    </View>
  );
}
