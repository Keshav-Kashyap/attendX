import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text } from '../../ui/text';
import Icon from '../../ui/Icon';
import CourseHierarchyView from './CourseHierarchyView';
import WeeklyTimetableView from './WeeklyTimetableView';
import SubjectStudentsModal from './SubjectStudentsModal';
import { useTeacherCourses } from '../../../hooks/useTeacher';

export default function TeacherClassesTab({ user, onStartAttendanceSession }) {
  const [activeSubView, setActiveSubView] = useState('timetable'); // 'timetable' | 'courses'
  const [selectedClassForStudents, setSelectedClassForStudents] = useState(null);
  const [showStudentsModal, setShowStudentsModal] = useState(false);

  const { data: teacherCourses, isLoading, refetch } = useTeacherCourses();

  const handleViewStudents = (item) => {
    setSelectedClassForStudents(item);
    setShowStudentsModal(true);
  };

  return (
    <ScrollView
      className="flex-1 px-4 pt-3"
      contentContainerStyle={{ paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled={true}
      delaysContentTouches={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#0284c7" />
      }
    >
      {/* Sub-view Switcher: Timetable vs Course Structure */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: '#f1f5f9',
          padding: 4,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#e2e8f0',
          marginBottom: 16,
        }}
      >
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setActiveSubView('timetable')}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: activeSubView === 'timetable' ? '#ffffff' : 'transparent',
            borderWidth: activeSubView === 'timetable' ? 1 : 0,
            borderColor: activeSubView === 'timetable' ? '#e2e8f0' : 'transparent',
            elevation: activeSubView === 'timetable' ? 1 : 0,
            shadowColor: activeSubView === 'timetable' ? '#000000' : 'transparent',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: activeSubView === 'timetable' ? 0.05 : 0,
            shadowRadius: 2,
          }}
        >
          <Icon
            name="calendar"
            size={14}
            color={activeSubView === 'timetable' ? '#0284c7' : '#94a3b8'}
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: activeSubView === 'timetable' ? '#0284c7' : '#64748b',
            }}
          >
            Weekly Timetable
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setActiveSubView('courses')}
          style={{
            flex: 1,
            paddingVertical: 10,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            backgroundColor: activeSubView === 'courses' ? '#ffffff' : 'transparent',
            borderWidth: activeSubView === 'courses' ? 1 : 0,
            borderColor: activeSubView === 'courses' ? '#e2e8f0' : 'transparent',
            elevation: activeSubView === 'courses' ? 1 : 0,
            shadowColor: activeSubView === 'courses' ? '#000000' : 'transparent',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: activeSubView === 'courses' ? 0.05 : 0,
            shadowRadius: 2,
          }}
        >
          <Icon
            name="school"
            size={14}
            color={activeSubView === 'courses' ? '#0284c7' : '#94a3b8'}
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: activeSubView === 'courses' ? '#0284c7' : '#64748b',
            }}
          >
            My Courses & Subjects
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main View Display */}
      {activeSubView === 'timetable' ? (
        <WeeklyTimetableView
          courses={teacherCourses}
          onStartAttendance={onStartAttendanceSession}
          onViewStudents={handleViewStudents}
        />
      ) : (
        <CourseHierarchyView
          courses={teacherCourses}
          onStartAttendance={onStartAttendanceSession}
          onViewStudents={handleViewStudents}
        />
      )}

      {/* Assigned Students Modal */}
      <SubjectStudentsModal
        visible={showStudentsModal}
        onClose={() => setShowStudentsModal(false)}
        classItem={selectedClassForStudents}
      />
    </ScrollView>
  );
}
