import React, { useState } from 'react';
import { View, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '../../../../src/components/ui/text';
import { Skeleton } from '../../../../src/components/ui/Skeleton';
import {
  useAdminTeachers,
  useAdminCourses,
  useUpdateTeacher,
  useDeleteTeacher,
} from '../../../../src/hooks/useAdmin';
import TeacherDetailView from '../../../../src/components/admin/people/TeacherDetailView';
import EditTeacherModal from '../../../../src/components/admin/people/EditTeacherModal';
import { ConfirmDialog } from '../../../../src/components/ui/alert-dialog';

export default function AdminTeacherDetailPage() {
  const { id } = useLocalSearchParams();

  const {
    data: teachers = [],
    isLoading: teachersLoading,
    refetch: refetchTeachers,
  } = useAdminTeachers();

  const {
    data: courses = [],
    refetch: refetchCourses,
  } = useAdminCourses();

  const updateTeacherMutation = useUpdateTeacher();
  const deleteTeacherMutation = useDeleteTeacher();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const containerStyle = {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
    backgroundColor: '#F5F6FA',
  };

  const teacher = teachers.find((t) => String(t.id) === String(id));

  if (teachersLoading && !teacher) {
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
          <Skeleton width="100%" height={64} borderRadius={14} />
        </View>
      </View>
    );
  }

  if (!teacher) {
    return (
      <View style={containerStyle} className="flex-1 bg-[#F5F6FA] items-center justify-center p-6">
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Text className="text-base font-bold text-slate-800 mb-2">Teacher not found</Text>
        <Text className="text-sm text-slate-500 mb-4 text-center">
          The requested teacher record could not be found or may have been removed.
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

  const handleSaveTeacher = async (payload) => {
    try {
      await updateTeacherMutation.mutateAsync({
        teacherId: teacher.id,
        data: payload,
      });
      setEditModalVisible(false);
      refetchTeachers();
      refetchCourses();
    } catch (err) {
      alert(err?.message || 'Failed to update teacher');
    }
  };

  const handleAssignCoordinator = async (semesterId) => {
    try {
      await updateTeacherMutation.mutateAsync({
        teacherId: teacher.id,
        data: { coordinator_semester_id: semesterId },
      });
      refetchTeachers();
      refetchCourses();
    } catch (err) {
      alert(err?.message || 'Failed to update Class Coordinator');
    }
  };

  const handleRemoveTeacher = () => {
    setConfirmDialog({
      title: 'Delete Faculty Member?',
      description: `Are you sure you want to delete ${teacher.name || 'this teacher'}? This action cannot be undone.`,
      confirmText: 'Delete Faculty',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteTeacherMutation.mutateAsync(teacher.id);
          setConfirmDialog(null);
          refetchTeachers();
          router.back();
        } catch (err) {
          alert(err?.message || 'Failed to delete teacher');
        }
      },
    });
  };

  return (
    <View style={containerStyle} className="flex-1 bg-[#F5F6FA]">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <TeacherDetailView
        teacher={teacher}
        courses={courses}
        onBack={() => router.back()}
        onEdit={() => setEditModalVisible(true)}
        onRemove={handleRemoveTeacher}
        onAssignCoordinator={handleAssignCoordinator}
        isAssigningCoordinator={updateTeacherMutation.isPending}
      />

      <EditTeacherModal
        visible={editModalVisible}
        teacher={teacher}
        courses={courses}
        onClose={() => setEditModalVisible(false)}
        onSubmit={handleSaveTeacher}
        isSubmitting={updateTeacherMutation.isPending}
      />

      <ConfirmDialog
        visible={!!confirmDialog}
        title={confirmDialog?.title}
        description={confirmDialog?.description}
        confirmText={confirmDialog?.confirmText}
        cancelText={confirmDialog?.cancelText}
        variant={confirmDialog?.variant}
        loading={deleteTeacherMutation.isPending}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    </View>
  );
}
