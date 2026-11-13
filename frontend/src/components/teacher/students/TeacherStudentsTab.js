import React, { useState } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import { Text } from '../../ui/text';
import StudentSearchBar from './StudentSearchBar';
import StudentCard from './StudentCard';
import StudentDetailModal from './StudentDetailModal';
import { useTeacherStudents } from '../../../hooks/useTeacher';

export default function TeacherStudentsTab({ user }) {
  const { data: students, isLoading, refetch } = useTeacherStudents();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'good', 'warning', 'critical'
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Fallback demo students if database is empty initially
  const rawList = (students && students.length > 0)
    ? students
    : [
        { id: 1, name: 'Aarav Patel', roll_number: 'MCA-2024-001', course: 'Integrated MCA', attendance_percentage: 95, total_classes: 14, attended_classes: 13, absent_classes: 1, late_classes: 0, status: 'Good', has_face: true, has_voice: true },
        { id: 2, name: 'Ananya Sharma', roll_number: 'MCA-2024-002', course: 'Integrated MCA', attendance_percentage: 88, total_classes: 14, attended_classes: 12, absent_classes: 2, late_classes: 0, status: 'Good', has_face: true, has_voice: false },
        { id: 3, name: 'Devendra Verma', roll_number: 'MCA-2024-003', course: 'Integrated MCA', attendance_percentage: 92, total_classes: 14, attended_classes: 13, absent_classes: 1, late_classes: 0, status: 'Good', has_face: true, has_voice: true },
        { id: 4, name: 'Isha Nair', roll_number: 'MCA-2024-004', course: 'Integrated MCA', attendance_percentage: 78, total_classes: 14, attended_classes: 11, absent_classes: 3, late_classes: 0, status: 'Good', has_face: true, has_voice: false },
        { id: 5, name: 'Karan Mehra', roll_number: 'MCA-2024-005', course: 'Integrated MCA', attendance_percentage: 62, total_classes: 14, attended_classes: 9, absent_classes: 5, late_classes: 0, status: 'Critical', has_face: false, has_voice: false },
        { id: 6, name: 'Pooja Joshi', roll_number: 'MCA-2024-006', course: 'Integrated MCA', attendance_percentage: 94, total_classes: 14, attended_classes: 13, absent_classes: 1, late_classes: 0, status: 'Good', has_face: true, has_voice: true },
        { id: 7, name: 'Rohan Gupta', roll_number: 'MCA-2024-032', course: 'Integrated MCA', attendance_percentage: 67, total_classes: 14, attended_classes: 9, absent_classes: 4, late_classes: 1, status: 'Warning', has_face: true, has_voice: false },
        { id: 8, name: 'Simran Kaur', roll_number: 'MCA-2024-008', course: 'Integrated MCA', attendance_percentage: 71, total_classes: 14, attended_classes: 10, absent_classes: 3, late_classes: 1, status: 'Warning', has_face: true, has_voice: true },
      ];

  // Filtering
  const filteredStudents = rawList.filter((s) => {
    // 1. Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name && s.name.toLowerCase().includes(q);
      const matchRoll = s.roll_number && s.roll_number.toLowerCase().includes(q);
      if (!matchName && !matchRoll) return false;
    }

    // 2. Status filter
    const pct = s.attendance_percentage ?? 88;
    if (statusFilter === 'good' && pct < 75) return false;
    if (statusFilter === 'warning' && (pct < 65 || pct >= 75)) return false;
    if (statusFilter === 'critical' && pct >= 65) return false;

    return true;
  });

  const handleOpenStudent = (s) => {
    setSelectedStudent(s);
    setShowModal(true);
  };

  return (
    <View className="flex-1 px-4 pt-3">
      {/* Search Bar & Filter Chips */}
      <StudentSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        totalCount={rawList.length}
      />

      {/* Student List */}
      <ScrollView
        className="flex-1 pb-8"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#0284c7" />
        }
      >
        {filteredStudents.length === 0 ? (
          <View className="p-8 bg-card border border-border rounded-2xl items-center justify-center mt-4">
            <Text className="text-xs font-semibold text-muted-foreground">
              No students match the selected filter.
            </Text>
          </View>
        ) : (
          filteredStudents.map((std, idx) => (
            <StudentCard
              key={std.id || idx}
              student={std}
              onPress={handleOpenStudent}
            />
          ))
        )}
      </ScrollView>

      {/* Student Profile Modal */}
      <StudentDetailModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        student={selectedStudent}
      />
    </View>
  );
}
