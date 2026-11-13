import React, { useState, useMemo } from 'react';
import { View, ScrollView, RefreshControl, Share } from 'react-native';
import { useRouter } from 'expo-router';

import CourseListView from '../../components/admin/CourseListView';
import CourseSemestersView from '../../components/admin/CourseSemestersView';
import {
  CourseDetailHeader,
  CourseHeroCard,
  CourseDetailActions,
  CourseDetailTabs,
  CurriculumTab,
  StudentsTab,
  ScheduleTab,
  ControlsTab,
  DirectMessageModal,
} from '../../components/admin/courseDetail';

import CreateCourseModal from '../../components/admin/CreateCourseModal';
import AddSubjectModal from '../../components/admin/AddSubjectModal';
import BatchEnrollModal from '../../components/admin/BatchEnrollModal';
import { ConfirmDialog } from '../../components/ui/alert-dialog';

import {
  useAdminCourses,
  useCourseSemesters,
  useSemesterSubjects,
  useAdminStudents,
  useDeleteCourse,
  useDeleteSubject,
} from '../../hooks/useAdmin';

export default function AdminCoursesScreen({ user }) {
  const router = useRouter();

  // Navigation & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('all');
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedSemesterObj, setSelectedSemesterObj] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('curriculum');
  const [isPinned, setIsPinned] = useState(false);

  // Modals state
  const [showCreateCourseModal, setShowCreateCourseModal] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [showBatchEnrollModal, setShowBatchEnrollModal] = useState(false);
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

  // Step 2: Lightweight semesters list when a course is opened
  const {
    data: semestersData = [],
    isLoading: semestersLoading,
    refetch: refetchSemesters,
  } = useCourseSemesters(selectedCourseId);

  const selectedSemesterId = selectedSemesterObj?.id ?? selectedSemesterObj?.semester_number ?? null;
  const selectedSemesterName = selectedSemesterObj
    ? `Semester ${selectedSemesterObj.semester_number}`
    : null;

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
    const listMatch = courses.find((c) => c.id === selectedCourseId);
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
        contentContainerStyle={{ paddingBottom: 96 }}
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
        {selectedCourseId && activeCourse && selectedSemesterObj ? (
          <View className="flex-1">
            {/* Header with Breadcrumb: Courses / Code / Semester */}
            <CourseDetailHeader
              courseCode={activeCourse.code}
              semesterName={selectedSemesterName}
              onBack={() => setSelectedSemesterObj(null)}
              isPinned={isPinned}
              onTogglePin={() => setIsPinned(!isPinned)}
              onShare={handleShareCourse}
            />

            {/* Course Hero Card with Semester Dropdown Selector */}
            <View className="pt-1">
              <CourseHeroCard
                course={activeCourse}
                activeSemester={selectedSemesterName}
                activeSemesterObj={selectedSemesterObj}
                semestersList={semestersData}
                onSemesterChange={(newSemObj) => setSelectedSemesterObj(newSemObj)}
              />
            </View>

            {/* Quick Action Buttons */}
            <CourseDetailActions
              onAddSubject={openAddSubjectForActiveSemester}
              onReassignFaculty={() => router.push('/admin_teacher_assign')}
              onExport={handleExportCourse}
            />

            {/* Segmented Tabs Control */}
            <CourseDetailTabs
              activeTab={activeDetailTab}
              onTabChange={setActiveDetailTab}
              studentCount={
                activeDetailTab === 'students' && !semesterStudentsLoading
                  ? semesterStudents.length
                  : selectedSemesterObj.students_count ?? activeCourse.enrolled_students_count ?? 0
              }
            />

            {/* Tab 1: Curriculum */}
            {activeDetailTab === 'curriculum' && (
              <CurriculumTab
                course={activeCourse}
                subjects={semesterSubjects}
                isLoading={semesterSubjectsLoading}
                activeSemester={selectedSemesterName}
                onAddSubject={openAddSubjectForActiveSemester}
                onDeleteSubject={handleDeleteSubject}
                onAssignFaculty={() => router.push('/admin_teacher_assign')}
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
                onAssignFaculty={() => router.push('/admin_teacher_assign')}
                onAddSubject={openAddSubjectForActiveSemester}
                onEnrollBatch={() => setShowBatchEnrollModal(true)}
                onDeleteCourse={handleDeleteCourse}
              />
            )}
          </View>
        ) : selectedCourseId && activeCourse ? (
          <CourseSemestersView
            course={activeCourse}
            semesters={semestersData}
            isLoading={semestersLoading}
            onBack={() => {
              setSelectedCourseId(null);
              setSelectedSemesterObj(null);
            }}
            onSelectSemester={(semObj) => {
              setSelectedSemesterObj(semObj);
              setActiveDetailTab('curriculum');
            }}
          />
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
              setSelectedCourseId(courseId);
              setSelectedSemesterObj(null);
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
