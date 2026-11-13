import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from '../../components/ui/Icon';
import { Text } from '../../components/ui/text';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ConfirmDialog } from '../../components/ui/alert-dialog';
import {
  useAdminTeachers,
  useAdminCourses,
  useUnassignTeacher,
} from '../../hooks/useAdmin';
import { useRouter } from 'expo-router';
import { ScheduleDisplayBadge } from '../../components/ui/SchedulePicker';
import CreateTeacherModal from '../../components/admin/CreateTeacherModal';
import { AdminScreenHeader, AdminEmptyState } from '../../components/admin';

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

export default function AdminTeachersScreen({ user }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [expandedTeacherId, setExpandedTeacherId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showCreateTeacherModal, setShowCreateTeacherModal] = useState(false);

  // Queries
  const {
    data: teachers = [],
    isLoading: teachersLoading,
    refetch: refetchTeachers,
    isRefetching,
  } = useAdminTeachers();

  const { data: courses = [] } = useAdminCourses();
  const unassignTeacherMutation = useUnassignTeacher();

  // 100% Course-wise and Search filtering
  const filteredTeachers = useMemo(() => {
    let result = teachers;

    // 1. Course-wise filter
    if (selectedCourseFilter !== 'all') {
      result = result.filter((t) => {
        return (t.assignments || []).some(
          (a) =>
            String(a.course_id) === String(selectedCourseFilter) ||
            (a.course_code &&
              a.course_code.toLowerCase() === String(selectedCourseFilter).toLowerCase()) ||
            (a.course_name &&
              a.course_name.toLowerCase() === String(selectedCourseFilter).toLowerCase())
        );
      });
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((t) => {
        const nameMatch = t.name?.toLowerCase().includes(q);
        const emailMatch = t.email?.toLowerCase().includes(q);
        const codeMatch = t.employee_code?.toLowerCase().includes(q);
        const assignMatch = (t.assignments || []).some(
          (a) =>
            a.subject_name?.toLowerCase().includes(q) ||
            a.subject_code?.toLowerCase().includes(q) ||
            a.course_name?.toLowerCase().includes(q) ||
            a.course_code?.toLowerCase().includes(q)
        );
        return nameMatch || emailMatch || codeMatch || assignMatch;
      });
    }

    return result;
  }, [teachers, selectedCourseFilter, searchQuery]);

  const handleRemoveAssignment = (assignmentId, subjectName) => {
    setConfirmDialog({
      title: 'Remove Class Allocation',
      description: `Are you sure you want to remove this faculty allocation from "${subjectName}"? The timetable schedule and room assignment will be cleared.`,
      confirmText: 'Remove Allocation',
      cancelText: 'Cancel',
      variant: 'destructive',
      icon: 'trash',
      onConfirm: async () => {
        try {
          await unassignTeacherMutation.mutateAsync(assignmentId);
          setConfirmDialog(null);
          refetchTeachers();
        } catch (err) {
          setConfirmDialog({
            title: 'Action Failed',
            description:
              err?.data?.message || err?.message || 'Failed to remove assignment.',
            confirmText: 'Close',
            variant: 'destructive',
            icon: 'warning',
            onConfirm: () => setConfirmDialog(null),
          });
        }
      },
    });
  };

  const toggleTeacherSchedule = (id) => {
    setExpandedTeacherId((prev) => (prev === id ? null : id));
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
            refreshing={teachersLoading || isRefetching}
            onRefresh={refetchTeachers}
            tintColor="#0284c7"
          />
        }
      >

        {/* Standardized Admin Header */}
        <AdminScreenHeader
          title="Teacher Management"
          subtitle="Manage faculty accounts, assign courses & configure weekly timetables."
          badgeText={`${teachers.length} Faculty Listed`}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchPlaceholder="Search by faculty, subject, or code..."
          allFilterLabel="All Faculty"
          selectedFilter={selectedCourseFilter}
          onSelectFilter={setSelectedCourseFilter}
          filterOptions={courses}
          onAddPress={() => setShowCreateTeacherModal(true)}
        />


        {/* Section Header: FACULTY MEMBERS & WORKLOAD */}
        <View className="flex-row items-center justify-between mb-3 px-0.5">
          <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            FACULTY MEMBERS & WORKLOAD
          </Text>
          <Text className="text-xs font-semibold text-primary">Sort: Recent</Text>
        </View>

        {/* Faculty List */}
        {teachersLoading && !isRefetching ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color="#0284c7" />
            <Text className="text-xs text-muted-foreground mt-3">
              Loading faculty directory...
            </Text>
          </View>
        ) : filteredTeachers.length === 0 ? (
          <AdminEmptyState
            icon="people"
            title="No Faculty Found"
            description={
              searchQuery || selectedCourseFilter !== 'all'
                ? 'No faculty matched the selected course or search query.'
                : 'No faculty registered yet. Use "+ Add Faculty" to create one.'
            }
            actionLabel="+ Add Faculty"
            onAction={() => setShowCreateTeacherModal(true)}
          />
        ) : (
          filteredTeachers.map((teacher, idx) => {
            const theme = PASTEL_THEMES[idx % PASTEL_THEMES.length];
            const assignments = teacher.assignments || [];
            const activeModulesCount = assignments.length;
            const firstAssignment = assignments[0];
            const isExpanded = expandedTeacherId === teacher.id;

            // Two-letter initials
            const initials =
              (teacher.name || 'F')
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .map((n) => n[0] || '')
                .join('')
                .toUpperCase()
                .substring(0, 2) || 'FA';

            // Subtitle info
            const subjectSubtitle = firstAssignment?.subject_name
              ? `${firstAssignment.subject_name} • ID: ${teacher.employee_code || 'T-' + teacher.id}`
              : `${teacher.specialization || 'General Faculty'} • ID: ${teacher.employee_code || 'T-' + teacher.id}`;

            // Dept / Specialization badge label
            const deptBadgeLabel =
              firstAssignment?.course_code ||
              firstAssignment?.course_name ||
              teacher.specialization ||
              teacher.qualification ||
              'Academic Faculty';

            // Timetable window string
            const scheduleWindow = firstAssignment?.schedule || 'Mon - Fri (Standard)';

            return (
              <Card
                key={teacher.id}
                className="mb-3.5 border-border/80 rounded-2xl p-4 bg-card shadow-sm"
              >
                {/* Top Row: Avatar + Name + Dot + Subtitle + Badge + Menu */}
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center flex-1 mr-2">
                    {/* Pastel Avatar */}
                    <View
                      className={`w-12 h-12 rounded-full ${theme.avatarBg} items-center justify-center mr-3`}
                    >
                      <Text className={`font-bold text-sm ${theme.avatarText}`}>
                        {initials}
                      </Text>
                    </View>

                    {/* Faculty Info */}
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5 flex-wrap">
                        <Text className="font-bold text-foreground text-sm">
                          {teacher.name}
                        </Text>
                        <View className="w-2 h-2 rounded-full bg-emerald-500" />
                      </View>

                      <Text
                        numberOfLines={1}
                        className="text-[11px] text-muted-foreground mt-0.5"
                      >
                        {subjectSubtitle}
                      </Text>

                      {/* Dept / Course Badge */}
                      <View className="flex-row items-center mt-1">
                        <View
                          className={`px-2 py-0.5 rounded-md border ${theme.badgeBg} ${theme.badgeBorder}`}
                        >
                          <Text className={`text-[10px] font-bold ${theme.badgeText}`}>
                            Dept: {deptBadgeLabel}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Options Icon */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => toggleTeacherSchedule(teacher.id)}
                    className="p-1 rounded-full"
                  >
                    <Icon name="grid" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                {/* Middle Box: Assigned Courses & Timetable Window */}
                <View className="bg-muted/30 border border-border/40 rounded-xl p-3 my-3 flex-row items-center justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-[10px] font-medium text-muted-foreground">
                      Assigned Courses
                    </Text>
                    <Text className="text-xs font-bold text-foreground mt-0.5">
                      {activeModulesCount} Active {activeModulesCount === 1 ? 'Module' : 'Modules'}
                    </Text>
                  </View>

                  <View className="flex-1 pl-2 border-l border-border/40">
                    <Text className="text-[10px] font-medium text-muted-foreground">
                      Timetable Window
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="text-xs font-bold text-foreground mt-0.5"
                    >
                      {scheduleWindow}
                    </Text>
                  </View>
                </View>

                {/* Bottom Action Buttons: + Assign Course & Manage Schedule */}
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push({
                        pathname: '/admin_teacher_assign',
                        params: {
                          teacherId: String(teacher.id),
                          teacherName: teacher.name || '',
                          employeeCode: teacher.employee_code || '',
                          teacher: JSON.stringify(teacher),
                        },
                      })
                    }
                    className="flex-1 py-2 rounded-xl bg-blue-50 border border-blue-200/60 items-center justify-center shadow-xs"
                  >
                    <Text className="text-xs font-bold text-primary">
                      + Assign Course
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => toggleTeacherSchedule(teacher.id)}
                    className="flex-1 py-2 rounded-xl bg-muted/40 border border-border/70 items-center justify-center"
                  >
                    <Text className="text-xs font-semibold text-foreground">
                      {isExpanded ? 'Hide Schedule' : 'Manage Schedule'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Collapsible Assigned Classes Details */}
                {isExpanded && (
                  <View className="mt-3 pt-3 border-t border-border/70">
                    <Text className="text-[11px] font-bold text-foreground uppercase tracking-wider mb-2">
                      Allocated Classes & Timetables ({assignments.length})
                    </Text>

                    {assignments.length === 0 ? (
                      <View className="p-3 bg-muted/20 rounded-xl border border-dashed border-border items-center">
                        <Text className="text-xs text-muted-foreground text-center">
                          No active classes allocated yet.
                        </Text>
                      </View>
                    ) : (
                      assignments.map((assignment) => (
                        <View
                          key={assignment.id}
                          className="p-3 rounded-xl bg-muted/20 border border-border/60 mb-2"
                        >
                          <View className="flex-row items-start justify-between">
                            <View className="flex-1 mr-2">
                              <View className="flex-row items-center gap-1.5 mb-1">
                                <Badge variant="default" className="py-0 px-1.5">
                                  <Text className="text-[9px] font-bold">
                                    {assignment.course_code || 'Course'}
                                  </Text>
                                </Badge>
                                {assignment.semester ? (
                                  <Badge variant="secondary" className="py-0 px-1.5">
                                    <Text className="text-[9px] font-medium">
                                      {assignment.semester}
                                    </Text>
                                  </Badge>
                                ) : null}
                                <Text className="text-[10px] text-muted-foreground font-mono">
                                  {assignment.subject_code}
                                </Text>
                              </View>
                              <Text className="font-bold text-foreground text-xs">
                                {assignment.subject_name}
                              </Text>
                              <Text className="text-[10px] text-muted-foreground mt-0.5">
                                Room: {assignment.room || 'Block B, Hall 3'}
                              </Text>
                              <View className="mt-1.5">
                                <ScheduleDisplayBadge
                                  schedule={assignment.schedule}
                                  room={assignment.room}
                                />
                              </View>
                            </View>

                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() =>
                                handleRemoveAssignment(
                                  assignment.id,
                                  assignment.subject_name
                                )
                              }
                              className="p-1.5 rounded-lg bg-destructive/10"
                            >
                              <Icon name="trash" size={14} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}
              </Card>
            );
          })
        )}

      </ScrollView>

      {/* Create Teacher Modal */}
      <CreateTeacherModal
        visible={showCreateTeacherModal}
        onClose={() => setShowCreateTeacherModal(false)}
        onSuccess={(created) => {
          refetchTeachers();
          setConfirmDialog({
            title: 'Teacher Created',
            description: `Faculty member "${
              created?.user?.name || 'Teacher'
            }" registered successfully.`,
            confirmText: 'Done',
            variant: 'default',
            icon: 'checkmark-circle',
            onConfirm: () => setConfirmDialog(null),
          });
        }}
      />

      {/* Confirmation Alert Dialog */}
      <ConfirmDialog
        visible={!!confirmDialog}
        title={confirmDialog?.title}
        description={confirmDialog?.description}
        confirmText={confirmDialog?.confirmText}
        cancelText={confirmDialog?.cancelText}
        variant={confirmDialog?.variant}
        icon={confirmDialog?.icon}
        loading={unassignTeacherMutation.isPending}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    </View>
  );
}
