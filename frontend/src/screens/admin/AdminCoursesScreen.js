import React, { useState, useMemo, useEffect } from 'react';
import { View, ScrollView, RefreshControl, Share } from 'react-native';
import { router } from 'expo-router';
import { Skeleton } from '../../components/ui/Skeleton';
import { safePush } from '../../utils/navigation';

import CourseListView from '../../components/admin/CourseListView';
import CourseSemestersView from '../../components/admin/CourseSemestersView';
import {
  CourseDetailActions,
  CourseDetailTabs,
  CurriculumTab,
  StudentsTab,
  ScheduleTab,
  ControlsTab,
  DirectMessageModal,
} from '../../components/admin/courseDetail';
import { Text } from '../../components/ui/text';

import CreateCourseModal from '../../components/admin/CreateCourseModal';
import EditCourseModal from '../../components/admin/EditCourseModal';
import AddSubjectModal from '../../components/admin/AddSubjectModal';
import BatchEnrollModal from '../../components/admin/BatchEnrollModal';
import InviteLinkModal from '../../components/admin/InviteLinkModal';
import { ConfirmDialog } from '../../components/ui/alert-dialog';

import {
  useAdminCourses,
  useCourseSemesters,
  useSemesterSubjects,
  useAdminStudents,
  useAdminTeachers,
  useUpdateTeacher,
  useDeleteCourse,
  useDeleteSubject,
} from '../../hooks/useAdmin';

export default function AdminCoursesScreen({ user, initialCourseId, initialCourseCode, initialSemesterId }) {
  // Navigation & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [selectedCourseId, setSelectedCourseId] = useState(
    initialCourseId ? (Number(initialCourseId) || initialCourseId) : null
  );
  const [selectedSemesterObj, setSelectedSemesterObj] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('curriculum');
  const [isPinned, setIsPinned] = useState(false);

  // Modals state
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState(null);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showBatchEnrollModal, setShowBatchEnrollModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedTeacherForMessage, setSelectedTeacherForMessage] = useState(null);
  const [selectedCourseForSubject, setSelectedCourseForSubject] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  // Step 1: Lightweight courses list (counts only)
  const {
    data: courses = [],
    isLoading: coursesLoading,
    refetch: refetchCourses,
    isRefetching,
  } = useAdminCourses();

  useEffect(() => {
    if (!initialCourseId && !initialCourseCode) {
      setSelectedCourseId(null);
      setSelectedSemesterObj(null);
      return;
    }
    if (courses && courses.length > 0) {
      const match = courses.find(
        (c) =>
          (initialCourseId && String(c.id) === String(initialCourseId)) ||
          (initialCourseCode && c.code === initialCourseCode)
      );
      if (match) {
        setSelectedCourseId(match.id);
      }
    }
  }, [initialCourseId, initialCourseCode, courses]);

  // Step 2: Lightweight semesters list when a course is opened
  const {
    data: semestersData = [],
    isLoading: semestersLoading,
    refetch: refetchSemesters,
  } = useCourseSemesters(selectedCourseId);

  useEffect(() => {
    if (!initialSemesterId) {
      setSelectedSemesterObj(null);
      return;
    }
    if (semestersData && semestersData.length > 0) {
      const semMatch = semestersData.find(
        (s) =>
          String(s.id) === String(initialSemesterId) ||
          String(s.semester_number) === String(initialSemesterId)
      );
      if (semMatch) {
        setSelectedSemesterObj(semMatch);
      }
    }
  }, [initialSemesterId, semestersData]);

  const selectedSemesterId =
    selectedSemesterObj?.id ??
    selectedSemesterObj?.semester_number ??
    (initialSemesterId ? (Number(initialSemesterId) || initialSemesterId) : null);

  const activeSemesterObj = useMemo(() => {
    if (selectedSemesterObj) {
      return semestersData.find((s) => s.id === selectedSemesterObj.id) || selectedSemesterObj;
    }
    if (initialSemesterId && semestersData.length > 0) {
      return (
        semestersData.find(
          (s) =>
            String(s.id) === String(initialSemesterId) ||
            String(s.semester_number) === String(initialSemesterId)
        ) || null
      );
    }
    return null;
  }, [semestersData, selectedSemesterObj, initialSemesterId]);

  const selectedSemesterName = activeSemesterObj
    ? `Semester ${activeSemesterObj.semester_number}`
    : null;

  const { data: teachersList = [], refetch: refetchTeachers } = useAdminTeachers();
  const updateTeacherMutation = useUpdateTeacher();

  // Step 3: Lazy-load subjects ONLY for semester_id when a semester is opened
  const {
    data: semesterSubjects = [],
    isLoading: semesterSubjectsLoading,
    refetch: refetchSemesterSubjects,
  } = useSemesterSubjects(selectedSemesterId);

  // Step 4: Lazy-load students ONLY when the Students tab is opened for that semester
  const {
    data: semesterStudents = [],
    isLoading: semesterStudentsLoading,
    refetch: refetchSemesterStudents,
  } = useAdminStudents(
    {
      course_id: selectedCourseId,
      semester_id: selectedSemesterObj?.id || undefined,
    },
    {
      enabled: Boolean(selectedCourseId && selectedSemesterObj && activeDetailTab === 'students'),
    }
  );

  const deleteCourseMutation = useDeleteCourse();
  const deleteSubjectMutation = useDeleteSubject();

  // Active course summary from lightweight courses list + loaded semester details
  const activeCourse = useMemo(() => {
    if (!selectedCourseId) return null;
    const listMatch = courses.find((c) => String(c.id) === String(selectedCourseId));
    if (!listMatch) return null;
    const semNames =
      semestersData && semestersData.length > 0
        ? semestersData.map((s) => `Semester ${s.semester_number}`)
        : [];
    return {
      ...listMatch,
      semesters: semNames,
    };
  }, [courses, selectedCourseId, semestersData]);

  // Derived filter chips for all courses list
  const courseCodeFilters = useMemo(() => {
    const set = new Set();
    courses.forEach((c) => {
      if (c.code) {
        set.add(c.code.trim().toUpperCase());
      }
    });
    return Array.from(set);
  }, [courses]);

  // Filtered course list
  const filteredCourses = useMemo(() => {
    let result = courses;

    if (selectedCourseFilter !== 'all') {
      result = result.filter(
        (c) => (c.code || '').trim().toUpperCase() === selectedCourseFilter
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((c) => {
        const nameMatch = c.name?.toLowerCase().includes(q);
        const codeMatch = c.code?.toLowerCase().includes(q);
        const descMatch = c.description?.toLowerCase().includes(q);
        return nameMatch || codeMatch || descMatch;
      });
    }

    return result;
  }, [courses, selectedCourseFilter, searchQuery]);

  // Handlers
  const handleShareCourse = async () => {
    if (!activeCourse) return;
    try {
      const subjectNames = (semesterSubjects || []).map((s) => s.name).join(', ');
      await Share.share({
        title: activeCourse.name,
        message: `Course: ${activeCourse.name} (${activeCourse.code})\nSemester: ${selectedSemesterName || 'All'}\nSubjects: ${subjectNames || 'None configured'}`,
      });
    } catch (e) {
      // ignore
    }
  };

  const handleExportCourse = () => {
    setConfirmDialog({
      title: 'Export Curriculum Dossier',
      description: `Course syllabus and student roster for ${activeCourse?.code} (${selectedSemesterName || 'All Semesters'}) are ready for PDF/CSV download.`,
      confirmText: 'Download Dossier',
      cancelText: 'Cancel',
      variant: 'default',
      icon: 'download',
      onConfirm: () => setConfirmDialog(null),
    });
  };

  const handleDeleteCourse = (courseId, code) => {
    setConfirmDialog({
      title: 'Delete Course',
      description: `Are you sure you want to delete course ${code}? Associated subjects, schedules, and enrollments will be permanently removed.`,
      confirmText: 'Delete Course',
      cancelText: 'Cancel',
      variant: 'destructive',
      icon: 'trash',
      onConfirm: async () => {
        try {
          await deleteCourseMutation.mutateAsync(courseId);
          setSelectedCourseId(null);
          setSelectedSemesterObj(null);
          setConfirmDialog(null);
          refetchCourses();
        } catch (err) {
          setConfirmDialog({
            title: 'Deletion Failed',
            description: err?.message || 'Could not delete course.',
            confirmText: 'Close',
            variant: 'destructive',
            icon: 'warning',
            onConfirm: () => setConfirmDialog(null),
          });
        }
      },
    });
  };

  const handleDeleteSubject = (subjectId, subjectName) => {
    setConfirmDialog({
      title: 'Delete Subject',
      description: `Are you sure you want to delete "${subjectName}"? Faculty allocations and schedule entries will also be removed.`,
      confirmText: 'Delete Subject',
      cancelText: 'Cancel',
      variant: 'destructive',
      icon: 'trash',
      onConfirm: async () => {
        try {
          await deleteSubjectMutation.mutateAsync({
            subjectId,
            courseId: activeCourse.id,
          });
          setConfirmDialog(null);
          refetchCourses();
          if (selectedCourseId) {
            refetchSemesters();
          }
          if (selectedSemesterId) {
            refetchSemesterSubjects();
          }
        } catch (err) {
          setConfirmDialog({
            title: 'Deletion Failed',
            description: err?.message || 'Could not delete subject.',
            confirmText: 'Close',
            variant: 'destructive',
            icon: 'warning',
            onConfirm: () => setConfirmDialog(null),
          });
        }
      },
    });
  };

  const handleSendMessageSubmit = () => {
    setShowMessageModal(false);
    setConfirmDialog({
      title: 'Message Dispatched',
      description: `Your communication was successfully delivered to ${selectedTeacherForMessage?.name || 'Faculty'}.`,
      confirmText: 'Done',
      variant: 'default',
      icon: 'check',
      onConfirm: () => setConfirmDialog(null),
    });
  };

  const openAddSubjectForActiveSemester = () => {
    if (!activeCourse) return;
    const semList = selectedSemesterName
      ? [selectedSemesterName, ...(activeCourse.semesters || []).filter((s) => s !== selectedSemesterName)]
      : activeCourse.semesters || [];
    setSelectedCourseForSubject({
      ...activeCourse,
      semesters: semList,
    });
    setShowAddSubjectModal(true);
  };

  const handleAssignLeadTeacher = async (teacherId) => {
    if (!activeSemesterObj?.id) return;
    try {
      const currentCoordId = activeSemesterObj.coordinator_teacher_id;
      if (teacherId === null) {
        if (!currentCoordId) return;
        await updateTeacherMutation.mutateAsync({
          teacherId: currentCoordId,
          data: { coordinator_semester_id: null },
        });
      } else {
        if (currentCoordId && currentCoordId !== teacherId) {
          await updateTeacherMutation.mutateAsync({
            teacherId: currentCoordId,
            data: { coordinator_semester_id: null },
          });
        }
        await updateTeacherMutation.mutateAsync({
          teacherId,
          data: { coordinator_semester_id: activeSemesterObj.id },
        });
      }
      await Promise.all([refetchSemesters(), refetchCourses(), refetchTeachers()]);
    } catch (err) {
      setConfirmDialog({
        title: 'Assignment Failed',
        description: err?.message || 'Could not assign Lead Teacher for this semester.',
        confirmText: 'Close',
        variant: 'destructive',
        icon: 'warning',
        onConfirm: () => setConfirmDialog(null),
      });
    }
  };

  const handleEditCourse = (course) => {
    setCourseToEdit(course);
    setShowEditCourseModal(true);
  };

  const handleRefreshAll = () => {
    refetchCourses();
    if (selectedCourseId) {
      refetchSemesters();
    }
    if (selectedCourseId && selectedSemesterId) {
      refetchSemesterSubjects();
      if (activeDetailTab === 'students') {
        refetchSemesterStudents();
      }
    }
  };

  return (
    <View className={`flex-1 ${selectedCourseId ? 'bg-[#F5F5F7]' : 'bg-background'}`}>
      <ScrollView
        className={`flex-1 ${!selectedCourseId ? 'px-4 pt-3 pb-1' : ''}`}
        contentContainerStyle={{ paddingBottom: 124 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={coursesLoading || isRefetching || semestersLoading || semesterSubjectsLoading}
            onRefresh={handleRefreshAll}
            tintColor="#007AFF"
          />
        }
      >
        {((initialCourseId || initialCourseCode) && (coursesLoading || !activeCourse)) ||
        (initialSemesterId && (semestersLoading || !activeSemesterObj)) ? (
          <View className="px-4 pt-4 gap-3">
            <Skeleton width={120} height={24} borderRadius={8} />
            <Skeleton width="100%" height={140} borderRadius={20} />
            <Skeleton width="100%" height={80} borderRadius={16} />
            <Skeleton width="100%" height={80} borderRadius={16} />
          </View>
        ) : selectedCourseId && activeCourse ? (
          <CourseSemestersView
            course={activeCourse}
            semesters={semestersData}
            isLoading={semestersLoading}
            onBack={() => {
              if (router.canGoBack()) {
                router.back();
              } else if (activeSemesterObj) {
                setSelectedSemesterObj(null);
              } else {
                setSelectedCourseId(null);
                setSelectedSemesterObj(null);
              }
            }}
            onSelectSemester={(semObj) => {
              safePush({
                pathname: '/admin_courses',
                params: {
                  courseId: String(selectedCourseId),
                  semesterId: String(semObj.id ?? semObj.semester_number),
                },
              });
            }}
            onEditCourse={() => handleEditCourse(activeCourse)}
            onDeleteCourse={() => handleDeleteCourse(activeCourse.id, activeCourse.code)}
          >
            {activeSemesterObj ? (
              <View className="flex-1 -mx-4">
                {/* Active Semester Title */}
                <View className="px-4 mb-2 flex-row items-center justify-between">
                  <Text className="text-base font-bold text-slate-900">
                    {selectedSemesterName}
                  </Text>
                </View>

                {/* Quick Action Buttons */}
                <CourseDetailActions
                  onAddSubject={openAddSubjectForActiveSemester}
                  onReassignFaculty={() => router.push('/users/assign')}
                  onExport={handleExportCourse}
                />

                {/* Segmented Tabs Control */}
                <CourseDetailTabs
                  activeTab={activeDetailTab}
                  onTabChange={setActiveDetailTab}
                  studentCount={
                    activeDetailTab === 'students' && !semesterStudentsLoading
                      ? semesterStudents.length
                      : activeSemesterObj.students_count ?? activeCourse.enrolled_students_count ?? 0
                  }
                />

                {/* Tab 1: Curriculum */}
                {activeDetailTab === 'curriculum' && (
                  <CurriculumTab
                    course={activeCourse}
                    semesterObj={activeSemesterObj}
                    subjects={semesterSubjects}
                    teachers={teachersList}
                    isLoading={semesterSubjectsLoading}
                    isAssigningLead={updateTeacherMutation.isPending}
                    activeSemester={selectedSemesterName}
                    onAddSubject={openAddSubjectForActiveSemester}
                    onDeleteSubject={handleDeleteSubject}
                    onAssignLeadTeacher={handleAssignLeadTeacher}
                    onViewTimetable={() => setActiveDetailTab('schedule')}
                    onSendMessage={(teacher) => {
                      setSelectedTeacherForMessage(teacher);
                      setShowMessageModal(true);
                    }}
                  />
                )}

                {/* Tab 2: Students */}
                {activeDetailTab === 'students' && (
                  <StudentsTab
                    course={activeCourse}
                    students={semesterStudents}
                    isLoading={semesterStudentsLoading}
                    activeSemester={selectedSemesterName}
                    onEnrollBatch={() => setShowBatchEnrollModal(true)}
                    onShareInvite={() => setShowInviteModal(true)}
                  />
                )}

                {/* Tab 3: Schedule */}
                {activeDetailTab === 'schedule' && (
                  <ScheduleTab
                    course={activeCourse}
                    subjects={semesterSubjects}
                    isLoading={semesterSubjectsLoading}
                    activeSemester={selectedSemesterName}
                    onAddSubject={openAddSubjectForActiveSemester}
                  />
                )}

                {/* Tab 4: Controls */}
                {activeDetailTab === 'controls' && (
                  <ControlsTab
                    course={activeCourse}
                    onAssignFaculty={() => router.push('/users/assign')}
                    onAddSubject={openAddSubjectForActiveSemester}
                    onEnrollBatch={() => setShowBatchEnrollModal(true)}
                    onEditCourse={() => handleEditCourse(activeCourse)}
                    onDeleteCourse={handleDeleteCourse}
                  />
                )}
              </View>
            ) : null}
          </CourseSemestersView>
        ) : (
          <CourseListView
            courses={courses}
            coursesLoading={coursesLoading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCourseFilter={selectedCourseFilter}
            setSelectedCourseFilter={setSelectedCourseFilter}
            courseCodeFilters={courseCodeFilters}
            filteredCourses={filteredCourses}
            onSelectCourse={(courseId) => {
              safePush({
                pathname: '/admin_courses',
                params: { courseId: String(courseId) },
              });
            }}
            onDeleteCourse={handleDeleteCourse}
            onOpenCreateCourse={() => setShowCreateCourseModal(true)}
          />
        )}
      </ScrollView>

      {/* MODAL: DIRECT MESSAGE TO FACULTY */}
      <DirectMessageModal
        visible={showMessageModal}
        teacherName={selectedTeacherForMessage?.name || 'Faculty Lead'}
        courseCode={activeCourse?.code || ''}
        onClose={() => setShowMessageModal(false)}
        onSend={handleSendMessageSubmit}
      />

      {/* MODAL: STUDENT ENROLLMENT QR / LINK */}
      <InviteLinkModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        type="student"
        course={activeCourse}
        semesterObj={activeSemesterObj}
      />

      {/* MODAL: CREATE COURSE */}
      <CreateCourseModal
        visible={showCreateCourseModal}
        onClose={() => setShowCreateCourseModal(false)}
        onSuccess={() => {
          refetchCourses();
          setConfirmDialog({
            title: 'Course Created',
            description: 'New course has been created successfully in the curriculum.',
            confirmText: 'Done',
            variant: 'default',
            icon: 'check',
            onConfirm: () => setConfirmDialog(null),
          });
        }}
        onError={(err) => {
          setConfirmDialog({
            title: 'Failed to Create Course',
            description: err?.message || 'An unexpected error occurred.',
            confirmText: 'Close',
            variant: 'destructive',
            icon: 'warning',
            onConfirm: () => setConfirmDialog(null),
          });
        }}
      />

      {/* MODAL: EDIT COURSE */}
      <EditCourseModal
        visible={showEditCourseModal}
        course={courseToEdit}
        onClose={() => {
          setShowEditCourseModal(false);
          setCourseToEdit(null);
        }}
        onSuccess={() => {
          refetchCourses();
          if (selectedCourseId) {
            refetchSemesters();
          }
          setConfirmDialog({
            title: 'Course Updated',
            description: 'Course details have been successfully updated.',
            confirmText: 'Done',
            variant: 'default',
            icon: 'check',
            onConfirm: () => setConfirmDialog(null),
          });
        }}
        onError={(err) => {
          setConfirmDialog({
            title: 'Failed to Update Course',
            description: err?.message || 'An unexpected error occurred.',
            confirmText: 'Close',
            variant: 'destructive',
            icon: 'warning',
            onConfirm: () => setConfirmDialog(null),
          });
        }}
      />

      {/* MODAL: ADD SUBJECT */}
      <AddSubjectModal
        visible={showAddSubjectModal}
        course={selectedCourseForSubject}
        semester={selectedSemesterName}
        semesterId={selectedSemesterObj?.id}
        onClose={() => setShowAddSubjectModal(false)}
        onSuccess={(_, subjectName) => {
          refetchCourses();
          if (selectedCourseId) {
            refetchSemesters();
          }
          if (selectedSemesterId) {
            refetchSemesterSubjects();
          }
          setConfirmDialog({
            title: 'Subject Added',
            description: `Subject "${subjectName}" has been added to ${selectedCourseForSubject?.code} (${selectedSemesterName || 'Curriculum'}).`,
            confirmText: 'Done',
            variant: 'default',
            icon: 'check',
            onConfirm: () => setConfirmDialog(null),
          });
        }}
      />

      {/* MODAL: BATCH ENROLL */}
      <BatchEnrollModal
        visible={showBatchEnrollModal}
        onClose={() => setShowBatchEnrollModal(false)}
        onSuccess={() => {
          refetchCourses();
          if (selectedCourseId) {
            refetchSemesters();
          }
          if (selectedSemesterId && activeDetailTab === 'students') {
            refetchSemesterStudents();
          }
          setConfirmDialog({
            title: 'Batch Enrolled',
            description: 'Batch students have been successfully registered into this course.',
            confirmText: 'Done',
            variant: 'default',
            icon: 'check',
            onConfirm: () => setConfirmDialog(null),
          });
        }}
        onError={(err) => {
          setConfirmDialog({
            title: 'Enrollment Failed',
            description: err?.message || 'Could not enroll batch.',
            confirmText: 'Close',
            variant: 'destructive',
            icon: 'warning',
            onConfirm: () => setConfirmDialog(null),
          });
        }}
      />

      {/* CONFIRMATION / ALERT DIALOG */}
      <ConfirmDialog
        visible={!!confirmDialog}
        title={confirmDialog?.title}
        description={confirmDialog?.description}
        confirmText={confirmDialog?.confirmText}
        cancelText={confirmDialog?.cancelText}
        variant={confirmDialog?.variant}
        icon={confirmDialog?.icon}
        loading={deleteCourseMutation.isPending || deleteSubjectMutation.isPending}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    </View>
  );
}
