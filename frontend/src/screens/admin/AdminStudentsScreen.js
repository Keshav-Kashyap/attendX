import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import Icon from '../../components/ui/Icon';
import { Text } from '../../components/ui/text';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ConfirmDialog } from '../../components/ui/alert-dialog';
import CreateStudentModal from '../../components/admin/CreateStudentModal';
import BatchEnrollModal from '../../components/admin/BatchEnrollModal';
import { AdminScreenHeader, AdminEmptyState } from '../../components/admin';
import {
  useAdminStudents,
  useAdminCourses,
  useRemoveEnrollment,
} from '../../hooks/useAdmin';

const PASTEL_THEMES = [
  {
    avatarBg: 'bg-blue-100',
    avatarText: 'text-blue-600',
    badgeBg: 'bg-blue-50',
    badgeBorder: 'border-blue-200/60',
    badgeText: 'text-blue-700',
  },
  {
    avatarBg: 'bg-purple-100',
    avatarText: 'text-purple-600',
    badgeBg: 'bg-purple-50',
    badgeBorder: 'border-purple-200/60',
    badgeText: 'text-purple-700',
  },
  {
    avatarBg: 'bg-amber-100',
    avatarText: 'text-amber-700',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200/60',
    badgeText: 'text-amber-800',
  },
  {
    avatarBg: 'bg-emerald-100',
    avatarText: 'text-emerald-700',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200/60',
    badgeText: 'text-emerald-800',
  },
];

export default function AdminStudentsScreen({ user }) {
  const router = useRouter();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Modals state
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  const [showBatchEnrollModal, setShowBatchEnrollModal] = useState(false);

  // Queries & Mutations
  const {
    data: studentsRaw = [],
    isLoading: studentsLoading,
    refetch: refetchStudents,
    isRefetching,
  } = useAdminStudents();

  const { data: courses = [] } = useAdminCourses();
  const removeEnrollmentMutation = useRemoveEnrollment();

  // Normalize students array
  const students = useMemo(() => {
    if (Array.isArray(studentsRaw)) return studentsRaw;
    if (studentsRaw && Array.isArray(studentsRaw.data)) return studentsRaw.data;
    return [];
  }, [studentsRaw]);

  // Dynamic course filters derived from courses or student enrollments
  const courseFilterOptions = useMemo(() => {
    const map = new Map();
    courses.forEach((c) => {
      if (c.code) {
        map.set(String(c.id), { id: c.id, code: c.code.trim().toUpperCase(), name: c.name });
      }
    });

    // Also collect from students if any course not listed
    students.forEach((s) => {
      if (s.course_id && s.course && !map.has(String(s.course_id))) {
        map.set(String(s.course_id), { id: s.course_id, code: s.course.trim().toUpperCase(), name: s.course_name || s.course });
      }
    });

    return Array.from(map.values());
  }, [courses, students]);

  const studentFilterOptions = useMemo(() => {
    return courseFilterOptions.map((c) => {
      const count = students.filter(
        (s) =>
          String(s.course_id) === String(c.id) ||
          (s.course && s.course.toUpperCase() === c.code)
      ).length;
      return {
        key: String(c.id),
        value: String(c.id),
        label: `${c.code} (${count})`,
      };
    });
  }, [courseFilterOptions, students]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    let result = students;

    // 1. Course Filter
    if (selectedCourseFilter !== 'all') {
      result = result.filter((s) => {
        return (
          String(s.course_id) === String(selectedCourseFilter) ||
          (s.course && s.course.toLowerCase() === String(selectedCourseFilter).toLowerCase())
        );
      });
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((s) => {
        const nameMatch = s.name?.toLowerCase().includes(q);
        const emailMatch = s.email?.toLowerCase().includes(q);
        const rollMatch = s.roll_number?.toLowerCase().includes(q);
        const phoneMatch = s.phone?.toLowerCase().includes(q);
        const courseMatch = s.course?.toLowerCase().includes(q) || s.course_name?.toLowerCase().includes(q);
        const semMatch = s.semester?.toLowerCase().includes(q);
        return nameMatch || emailMatch || rollMatch || phoneMatch || courseMatch || semMatch;
      });
    }

    return result;
  }, [students, selectedCourseFilter, searchQuery]);

  // Handle Remove Student Enrollment
  const handleRemoveStudent = (student) => {
    setConfirmDialog({
      title: 'Remove Student',
      description: `Are you sure you want to remove ${student.name || 'this student'} (Roll No: ${student.roll_number || 'N/A'})? Course enrollment and associated attendance records will be removed.`,
      confirmText: 'Remove Student',
      cancelText: 'Cancel',
      variant: 'destructive',
      icon: 'trash',
      onConfirm: async () => {
        try {
          if (student.enrollment_id) {
            await removeEnrollmentMutation.mutateAsync(student.enrollment_id);
          }
          setConfirmDialog(null);
          refetchStudents();
        } catch (err) {
          setConfirmDialog({
            title: 'Action Failed',
            description: err?.message || 'Could not remove student.',
            confirmText: 'Close',
            variant: 'destructive',
            icon: 'warning',
            onConfirm: () => setConfirmDialog(null),
          });
        }
      },
    });
  };

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1 px-4 pt-3 pb-1"
        contentContainerStyle={{ paddingBottom: 96 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={studentsLoading || isRefetching}
            onRefresh={refetchStudents}
            tintColor="#0284c7"
          />
        }
      >
        {/* Standardized Admin Header */}
        <AdminScreenHeader
          title="Student Management"
          subtitle="Manage student enrollments, roll numbers, courses & cohort rosters."
          badgeText={`${students.length} Enrolled`}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search by student name, roll number, or course..."
          allFilterLabel={`All Students (${students.length})`}
          selectedFilter={selectedCourseFilter}
          onSelectFilter={setSelectedCourseFilter}
          filterOptions={studentFilterOptions}
          onAddPress={() => setShowCreateStudentModal(true)}
        />


        {/* Section Header */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-bold text-foreground">
            Enrolled Students ({filteredStudents.length})
          </Text>
        </View>

        {/* Students List */}
        {studentsLoading ? (
          <ActivityIndicator size="small" color="#0284c7" className="my-8" />
        ) : filteredStudents.length > 0 ? (
          filteredStudents.map((student, idx) => {
            const theme = PASTEL_THEMES[idx % PASTEL_THEMES.length];
            const initial = (student.name || 'S').charAt(0).toUpperCase();

            return (
              <Card
                key={student.id || idx}
                className="mb-3 border-border/80 bg-card shadow-sm overflow-hidden p-3.5"
              >
                <View className="flex-row items-start justify-between">
                  {/* Left: Avatar + Details */}
                  <View className="flex-row items-start flex-1 mr-2">
                    {student.profile_image ? (
                      <Image
                        source={{ uri: student.profile_image }}
                        className="w-11 h-11 rounded-full mr-3 border border-border"
                      />
                    ) : (
                      <View
                        className={`w-11 h-11 rounded-full ${theme.avatarBg} items-center justify-center mr-3`}
                      >
                        <Text className={`text-base font-medium ${theme.avatarText}`}>
                          {initial}
                        </Text>
                      </View>
                    )}

                    <View className="flex-1">
                      {/* Name & Roll Number */}
                      <View className="flex-row items-center gap-1.5 mb-1 flex-wrap">
                        <Text className="text-sm font-bold text-foreground">
                          {student.name || 'Student'}
                        </Text>
                        {student.roll_number ? (
                          <Badge variant="outline" className="px-1.5 py-0.2 bg-muted/40">
                            <Text className="text-[10px] font-mono font-bold text-primary">
                              {student.roll_number}
                            </Text>
                          </Badge>
                        ) : null}
                      </View>

                      {/* Course & Semester Badge */}
                      <View className="flex-row items-center gap-1.5 mb-2 flex-wrap">
                        {student.course ? (
                          <Badge variant="secondary" className="px-2 py-0.5 bg-blue-50">
                            <Text className="text-[10px] font-bold text-blue-700">
                              {student.course}
                            </Text>
                          </Badge>
                        ) : null}
                        {student.semester ? (
                          <Badge variant="outline" className="px-2 py-0.5 bg-muted/30">
                            <Text className="text-[10px] font-medium text-foreground">
                              {student.semester}
                            </Text>
                          </Badge>
                        ) : null}
                      </View>

                      {/* Contact Info */}
                      <View className="gap-0.5">
                        {student.email ? (
                          <View className="flex-row items-center gap-1.5">
                            <Icon name="mail-outline" size={12} color="#94a3b8" />
                            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                              {student.email}
                            </Text>
                          </View>
                        ) : null}

                        {student.phone ? (
                          <View className="flex-row items-center gap-1.5">
                            <Icon name="call-outline" size={12} color="#94a3b8" />
                            <Text className="text-xs text-muted-foreground">
                              {student.phone}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Biometrics Status Chips */}
                      <View className="flex-row items-center gap-2 mt-2.5 pt-2 border-t border-border/40">
                        <View className="flex-row items-center gap-1">
                          <Icon
                            name={student.has_face ? 'checkmark-circle' : 'close-circle'}
                            size={13}
                            color={student.has_face ? '#10b981' : '#94a3b8'}
                          />
                          <Text
                            className={`text-[10px] font-semibold ${student.has_face ? 'text-emerald-600' : 'text-muted-foreground'
                              }`}
                          >
                            {student.has_face ? 'Face ID Active' : 'No Face ID'}
                          </Text>
                        </View>

                        <View className="flex-row items-center gap-1">
                          <Icon
                            name={student.has_voice ? 'checkmark-circle' : 'close-circle'}
                            size={13}
                            color={student.has_voice ? '#10b981' : '#94a3b8'}
                          />
                          <Text
                            className={`text-[10px] font-semibold ${student.has_voice ? 'text-emerald-600' : 'text-muted-foreground'
                              }`}
                          >
                            {student.has_voice ? 'Voice ID Active' : 'No Voice ID'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Right: Direct Actions */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleRemoveStudent(student)}
                    className="p-2 rounded-xl bg-destructive/10 border border-destructive/20"
                  >
                    <Icon name="trash-outline" size={14} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
        ) : (
          <AdminEmptyState
            icon="people"
            title="No Students Found"
            description={
              searchQuery || selectedCourseFilter !== 'all'
                ? 'No students match your filter or search criteria.'
                : 'Get started by enrolling your first student or cohort.'
            }
            actionLabel="+ Add Student"
            onAction={() => setShowCreateStudentModal(true)}
          />
        )}
      </ScrollView>

      {/* MODAL: CREATE STUDENT */}
      <CreateStudentModal
        visible={showCreateStudentModal}
        onClose={() => setShowCreateStudentModal(false)}
        onSuccess={(created) => {
          refetchStudents();
          setConfirmDialog({
            title: 'Student Enrolled',
            description: `Student "${created?.user?.name || 'Student'}" registered with Roll No ${created?.roll_number || ''}.`,
            confirmText: 'Done',
            variant: 'default',
            icon: 'checkmark-circle',
            onConfirm: () => setConfirmDialog(null),
          });
        }}
      />

      {/* MODAL: BATCH ENROLL */}
      <BatchEnrollModal
        visible={showBatchEnrollModal}
        onClose={() => setShowBatchEnrollModal(false)}
        onSuccess={(res) => {
          refetchStudents();
          setConfirmDialog({
            title: 'Batch Enrolled',
            description: res?.message || 'Students successfully enrolled to course and semester.',
            confirmText: 'Done',
            variant: 'default',
            icon: 'checkmark-circle',
            onConfirm: () => setConfirmDialog(null),
          });
        }}
        onError={(err) => {
          setConfirmDialog({
            title: 'Batch Enrollment Failed',
            description: err?.message || 'Could not enroll student batch.',
            confirmText: 'Close',
            variant: 'destructive',
            icon: 'warning',
            onConfirm: () => setConfirmDialog(null),
          });
        }}
      />

      {/* CONFIRMATION DIALOG */}
      <ConfirmDialog
        visible={!!confirmDialog}
        title={confirmDialog?.title}
        description={confirmDialog?.description}
        confirmText={confirmDialog?.confirmText}
        cancelText={confirmDialog?.cancelText}
        variant={confirmDialog?.variant}
        icon={confirmDialog?.icon}
        loading={removeEnrollmentMutation.isPending}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    </View>
  );
}
