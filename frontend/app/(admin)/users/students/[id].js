import React, { useState } from 'react';
import { View, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '../../../../src/components/ui/text';
import { Skeleton } from '../../../../src/components/ui/Skeleton';
import {
  useAdminStudents,
  useAdminCourses,
  useUpdateStudent,
  useDeleteStudent,
} from '../../../../src/hooks/useAdmin';
import StudentDetailView from '../../../../src/components/admin/people/StudentDetailView';
import EditStudentModal from '../../../../src/components/admin/people/EditStudentModal';
import { ConfirmDialog } from '../../../../src/components/ui/alert-dialog';

export default function AdminStudentDetailPage() {
  const { id } = useLocalSearchParams();

  const {
    data: students = [],
    isLoading: studentsLoading,
    refetch: refetchStudents,
  } = useAdminStudents();

  const {
    data: courses = [],
  } = useAdminCourses();

  const updateStudentMutation = useUpdateStudent();
  const deleteStudentMutation = useDeleteStudent();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const containerStyle = {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
    backgroundColor: '#F5F6FA',
  };

  const student = students.find((s) => String(s.id) === String(id));

  if (studentsLoading && !student) {
    return (
      <View style={containerStyle} className="flex-1 bg-[#F5F6FA] p-5 gap-4">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Skeleton width={100} height={24} borderRadius={8} />
        <View className="bg-white rounded-3xl p-5 gap-3">
          <View className="flex-row items-center gap-3.5">
            <Skeleton width={64} height={64} borderRadius={20} />
            <View className="flex-1 gap-2">
              <Skeleton width="70%" height={20} borderRadius={6} />
              <Skeleton width="50%" height={14} borderRadius={4} />
            </View>
          </View>
          <Skeleton width="100%" height={44} borderRadius={12} />
        </View>
        <View className="bg-white rounded-3xl p-5 gap-3">
          <Skeleton width={140} height={16} borderRadius={5} />
          <Skeleton width="100%" height={64} borderRadius={14} />
        </View>
      </View>
    );
  }

  if (!student) {
    return (
      <View style={containerStyle} className="flex-1 bg-[#F5F6FA] items-center justify-center p-6">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Text className="text-base font-bold text-slate-800 mb-2">Student not found</Text>
        <Text className="text-sm text-slate-500 mb-4 text-center">
          The requested student record could not be found or may have been removed.
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-5 py-2.5 bg-[#2563EB] rounded-xl"
        >
          <Text className="text-white font-bold text-sm">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSaveStudent = async (payload) => {
    try {
      await updateStudentMutation.mutateAsync({
        studentId: student.id,
        data: payload,
      });
      setEditModalVisible(false);
      refetchStudents();
    } catch (err) {
      alert(err?.message || 'Failed to update student');
    }
  };

  const handleRemoveStudent = () => {
    setConfirmDialog({
      title: 'Delete Student?',
      description: `Are you sure you want to remove ${student.name || 'this student'}? This action cannot be undone.`,
      confirmText: 'Delete Student',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteStudentMutation.mutateAsync(student.id);
          setConfirmDialog(null);
          refetchStudents();
          router.back();
        } catch (err) {
          alert(err?.message || 'Failed to delete student');
        }
      },
    });
  };

  return (
    <View style={containerStyle} className="flex-1 bg-[#F5F6FA]">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <StudentDetailView
        student={student}
        courses={courses}
        onBack={() => router.back()}
        onEdit={() => setEditModalVisible(true)}
        onRemove={handleRemoveStudent}
      />

      <EditStudentModal
        visible={editModalVisible}
        student={student}
        courses={courses}
        onClose={() => setEditModalVisible(false)}
        onSubmit={handleSaveStudent}
        isSubmitting={updateStudentMutation.isPending}
      />

      <ConfirmDialog
        visible={!!confirmDialog}
        title={confirmDialog?.title}
        description={confirmDialog?.description}
        confirmText={confirmDialog?.confirmText}
        cancelText={confirmDialog?.cancelText}
        variant={confirmDialog?.variant}
        loading={deleteStudentMutation.isPending}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    </View>
  );
}
