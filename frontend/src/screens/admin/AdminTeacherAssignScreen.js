import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import Icon from '../../components/ui/Icon';
import { Text } from '../../components/ui/text';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ConfirmDialog } from '../../components/ui/alert-dialog';
import { useAdminCourses, useAdminTeachers, useAssignTeacher } from '../../hooks/useAdmin';
import { router, useLocalSearchParams } from 'expo-router';
import SchedulePicker from '../../components/ui/SchedulePicker';

export default function AdminTeacherAssignScreen({ user }) {
  const params = useLocalSearchParams();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/users/teachers');
    }
  };
  const goBack = handleBack;

  const { data: allTeachers = [], isLoading: teachersLoading } = useAdminTeachers();
  const [chosenTeacherId, setChosenTeacherId] = useState(null);

  const selectedTeacher = useMemo(() => {
    if (params?.teacher) {
      if (typeof params.teacher === 'string') {
        try {
          return JSON.parse(params.teacher);
        } catch (e) {
          // ignore
        }
      } else {
        return params.teacher;
      }
    }
    if (params?.teacherId) {
      return {
        id: Number(params.teacherId),
        name: params.teacherName || 'Teacher',
        employee_code: params.employeeCode || '',
      };
    }
    if (chosenTeacherId) {
      return allTeachers.find((t) => t.id === chosenTeacherId) || null;
    }
    if (allTeachers && allTeachers.length > 0) {
      return allTeachers[0];
    }
    return null;
  }, [params, chosenTeacherId, allTeachers]);

  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [room, setRoom] = useState('Block B, Hall 3');
  const [schedule, setSchedule] = useState('Mon, Wed, Fri - 10:15 AM');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [courseSearch, setCourseSearch] = useState('');

  const { data: courses = [], isLoading: coursesLoading } = useAdminCourses();
  const assignTeacherMutation = useAssignTeacher();

  const filteredCourses = useMemo(() => {
    if (!courseSearch.trim()) return courses;
    const q = courseSearch.toLowerCase().trim();
    return courses.filter(
      (c) =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.code && c.code.toLowerCase().includes(q))
    );
  }, [courses, courseSearch]);

  const activeCourse = useMemo(() => courses.find((c) => c.id === selectedCourseId), [courses, selectedCourseId]);
  const courseSemesters = useMemo(() => activeCourse?.semesters || [], [activeCourse]);

  // Auto-select initial course and subject
  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      const firstCourse = courses[0];
      setSelectedCourseId(firstCourse.id);
      if (firstCourse.subjects && firstCourse.subjects.length > 0) {
        setSelectedSubjectId(firstCourse.subjects[0].id);
      }
    }
  }, [courses, selectedCourseId]);

  // Selected course subjects filtered by semester
  const selectedCourseSubjects = useMemo(() => {
    if (!selectedCourseId) return [];
    const course = courses.find((c) => c.id === selectedCourseId);
    const allSubs = course?.subjects || [];
    if (!selectedSemester || selectedSemester === 'all') return allSubs;
    return allSubs.filter((s) => (s.semester || '').toLowerCase() === selectedSemester.toLowerCase());
  }, [courses, selectedCourseId, selectedSemester]);

  const handleCourseChange = (courseId) => {
    setSelectedCourseId(courseId);
    setSelectedSemester('all');
    const crs = courses.find((c) => c.id === courseId);
    if (crs?.subjects && crs.subjects.length > 0) {
      setSelectedSubjectId(crs.subjects[0].id);
    } else {
      setSelectedSubjectId(null);
    }
  };

  const handleSemesterChange = (semName) => {
    setSelectedSemester(semName);
    const crs = courses.find((c) => c.id === selectedCourseId);
    const allSubs = crs?.subjects || [];
    const filteredSubs =
      semName === 'all'
        ? allSubs
        : allSubs.filter((s) => (s.semester || '').toLowerCase() === semName.toLowerCase());
    if (filteredSubs.length > 0) {
      setSelectedSubjectId(filteredSubs[0].id);
    } else {
      setSelectedSubjectId(null);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!selectedTeacher?.id) {
      setConfirmDialog({
        title: 'Missing Teacher',
        description: 'No teacher selected. Please select a teacher from the faculty list.',
        confirmText: 'Go Back',
        variant: 'default',
        icon: 'warning',
        onConfirm: () => {
          setConfirmDialog(null);
          handleBack();
        },
      });
      return;
    }

    if (!selectedCourseId || !selectedSubjectId) {
      setConfirmDialog({
        title: 'Required Fields',
        description: 'Please select both a course and a subject to assign to this faculty member.',
        confirmText: 'Understood',
        variant: 'default',
        icon: 'warning',
        onConfirm: () => setConfirmDialog(null),
      });
      return;
    }

    try {
      const activeSubject = selectedCourseSubjects.find((s) => s.id === selectedSubjectId);

      await assignTeacherMutation.mutateAsync({
        teacher_id: selectedTeacher.id,
        course_id: selectedCourseId,
        semester_id: activeSubject?.semester_id || null,
        semester: activeSubject?.semester || null,
        subject_id: selectedSubjectId,
        room: room.trim() || 'Block B, Hall 3',
        schedule: schedule.trim() || 'Mon, Wed, Fri - 10:15 AM',
        academic_year: academicYear.trim() || '2026-2027',
      });

      setConfirmDialog({
        title: 'Class Assigned Successfully',
        description: `Class timetable (${schedule}) has been successfully allocated to ${selectedTeacher.name}.`,
        confirmText: 'Done',
        variant: 'default',
        icon: 'checkmark-circle',
        onConfirm: () => {
          setConfirmDialog(null);
          router.replace('/users/teachers');
        },
      });
    } catch (err) {
      setConfirmDialog({
        title: 'Allocation Failed',
        description: err?.data?.message || err?.message || 'Failed to assign teacher to class.',
        confirmText: 'Dismiss',
        variant: 'destructive',
        icon: 'warning',
        onConfirm: () => setConfirmDialog(null),
      });
    }
  };

  // Initials for avatar
  const initials = (selectedTeacher?.name || 'T')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedSubject = selectedCourseSubjects.find((s) => s.id === selectedSubjectId);

  return (
    <View className="flex-1 bg-background">
      {/* Top Header with Back Button */}
      <View className="px-4 pt-3 pb-3 bg-card border-b border-border flex-row items-center justify-between shadow-sm">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="flex-row items-center gap-1.5 py-1 px-2 rounded-xl bg-muted/60"
        >
          <Icon name="arrow-back" size={18} color="#0284c7" />
          <Text className="text-xs font-semibold text-primary">Teachers</Text>
        </TouchableOpacity>

        <View className="items-center">
          <Text className="text-base font-bold text-foreground">Assign Class</Text>
          <Text className="text-[10px] text-muted-foreground">Class Timetable Allocation</Text>
        </View>

        <View style={{ width: 68 }} />
      </View>

      {/* Main Form ScrollView */}
      <ScrollView
        className="flex-1 px-4 pt-4 pb-8"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Selected Faculty Overview Card */}
        <Card className="mb-4 p-4 border-primary/20 bg-primary/5 flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center border border-primary/30 mr-3.5">
            <Text className="text-primary font-bold text-base">{initials}</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1.5 flex-wrap">
              <Text className="text-base font-bold text-foreground">
                {selectedTeacher?.name || 'Faculty Member'}
              </Text>
              {selectedTeacher?.employee_code ? (
                <Badge variant="outline" className="py-0 px-1.5">
                  <Text className="text-[10px] font-semibold">{selectedTeacher.employee_code}</Text>
                </Badge>
              ) : null}
            </View>
            <Text className="text-xs text-muted-foreground mt-0.5">
              {selectedTeacher?.email || 'faculty@university.edu'}
            </Text>
          </View>
        </Card>

        {/* Faculty Selector (When opened without preselected teacher) */}
        {!params?.teacher && !params?.teacherId && allTeachers.length > 0 ? (
          <View className="mb-4">
            <Text className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Select Faculty Member
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
              {allTeachers.map((t) => {
                const isSelected = selectedTeacher?.id === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setChosenTeacherId(t.id)}
                    className={`px-3.5 py-2 rounded-xl border flex-row items-center gap-1.5 ${
                      isSelected ? 'bg-blue-600 border-blue-600' : 'bg-card border-border'
                    }`}
                  >
                    <Icon name="person" size={13} color={isSelected ? '#ffffff' : '#64748b'} />
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-white' : 'text-foreground'
                      }`}
                    >
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        {/* Step 1: Select Course / Department */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-bold text-foreground uppercase tracking-wider">
              1. Select Course / Department
            </Text>
            <Text className="text-[10px] text-muted-foreground">
              {filteredCourses.length} Programs Available
            </Text>
          </View>

          {/* Search bar for courses/departments */}
          <View className="flex-row items-center bg-card border border-border rounded-xl px-3 py-2 mb-2">
            <Icon name="search" size={15} color="#94a3b8" />
            <TextInput
              value={courseSearch}
              onChangeText={setCourseSearch}
              placeholder="Search department or course by name or code..."
              placeholderTextColor="#94a3b8"
              className="flex-1 ml-2 text-xs text-foreground p-0"
            />
            {courseSearch ? (
              <TouchableOpacity onPress={() => setCourseSearch('')}>
                <Icon name="close" size={14} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {coursesLoading ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color="#0284c7" />
              <Text className="text-xs text-muted-foreground mt-2">Loading courses...</Text>
            </View>
          ) : filteredCourses.length === 0 ? (
            <Card className="p-4 items-center">
              <Text className="text-xs text-muted-foreground">
                No courses or departments found matching "{courseSearch}".
              </Text>
            </Card>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              className="flex-row gap-2 py-1"
            >
              {filteredCourses.map((crs) => {
                const isSelected = selectedCourseId === crs.id;
                return (
                  <TouchableOpacity
                    key={crs.id}
                    activeOpacity={0.7}
                    onPress={() => handleCourseChange(crs.id)}
                    className={`px-3.5 py-2.5 rounded-2xl border ${
                      isSelected
                        ? 'bg-primary border-primary'
                        : 'bg-card border-border'
                    }`}
                  >
                    <View className="flex-row items-center gap-1.5 mb-0.5">
                      <Text
                        className={`text-sm font-bold ${
                          isSelected ? 'text-primary-foreground' : 'text-foreground'
                        }`}
                      >
                        {crs.code}
                      </Text>
                      {crs.subjects_count ? (
                        <Badge variant="outline" className={`py-0 px-1 ${isSelected ? 'bg-primary-foreground/20' : 'bg-muted'}`}>
                          <Text className={`text-[9px] font-semibold ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                            {crs.subjects_count} Subs
                          </Text>
                        </Badge>
                      ) : null}
                    </View>
                    <Text
                      numberOfLines={1}
                      className={`text-[10px] ${
                        isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                      }`}
                    >
                      {crs.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Step 2: Select Semester */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-bold text-foreground uppercase tracking-wider">
              2. Select Semester
            </Text>
            <Text className="text-[10px] text-muted-foreground">
              {courseSemesters.length} Semesters Available
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            className="flex-row gap-2 py-1"
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleSemesterChange('all')}
              className={`px-3.5 py-2 rounded-xl border ${selectedSemester === 'all'
                  ? 'bg-primary border-primary shadow-sm'
                  : 'bg-card border-border'
                }`}
            >
              <Text
                className={`text-xs font-bold ${selectedSemester === 'all' ? 'text-primary-foreground' : 'text-foreground'
                  }`}
              >
                All Semesters
              </Text>
            </TouchableOpacity>
            {courseSemesters.map((sem) => {
              const isSelected = selectedSemester.toLowerCase() === sem.name.toLowerCase();
              return (
                <TouchableOpacity
                  key={sem.id || sem.semester_number}
                  activeOpacity={0.7}
                  onPress={() => handleSemesterChange(sem.name)}
                  className={`px-3.5 py-2 rounded-xl border ${isSelected
                      ? 'bg-primary border-primary shadow-sm'
                      : 'bg-card border-border'
                    }`}
                >
                  <Text
                    className={`text-xs font-bold ${isSelected ? 'text-primary-foreground' : 'text-foreground'
                      }`}
                  >
                    {sem.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Step 3: Select Subject */}
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-bold text-foreground uppercase tracking-wider">
              3. Select Subject
            </Text>
            <Text className="text-[10px] text-muted-foreground">
              {selectedCourseSubjects.length} Available Subjects
            </Text>
          </View>

          {selectedCourseSubjects.length === 0 ? (
            <Card className="p-4 items-center bg-muted/20 border-dashed">
              <Text className="text-xs text-muted-foreground text-center">
                This course has no subjects configured yet for the selected semester.
              </Text>
            </Card>
          ) : (
            <View className="gap-2">
              {selectedCourseSubjects.map((sub) => {
                const isSelected = selectedSubjectId === sub.id;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    activeOpacity={0.7}
                    onPress={() => setSelectedSubjectId(sub.id)}
                    className={`p-3.5 rounded-2xl border flex-row justify-between items-center ${isSelected
                        ? 'bg-primary/10 border-primary shadow-sm'
                        : 'bg-card border-border'
                      }`}
                  >
                    <View className="flex-1 mr-2">
                      <View className="flex-row items-center gap-1.5 mb-1">
                        <Badge variant="outline" className="py-0 px-2 bg-card">
                          <Text className="text-[10px] font-bold">{sub.code}</Text>
                        </Badge>
                        {sub.semester ? (
                          <Badge variant="secondary" className="py-0 px-1.5">
                            <Text className="text-[10px] font-medium">{sub.semester}</Text>
                          </Badge>
                        ) : null}
                      </View>
                      <Text className="font-bold text-foreground text-sm">{sub.name}</Text>
                    </View>

                    {isSelected ? (
                      <View className="w-6 h-6 rounded-full bg-primary items-center justify-center">
                        <Icon name="check" size={14} color="#ffffff" />
                      </View>
                    ) : (
                      <View className="w-6 h-6 rounded-full border border-border items-center justify-center bg-muted/40" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Step 4: Classroom / Room */}
        <View className="mb-4">
          <Text className="text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
            4. Classroom / Room
          </Text>
          <TextInput
            className="bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground mb-1.5"
            placeholder="e.g. Block B, Hall 3"
            placeholderTextColor="#94a3b8"
            value={room}
            onChangeText={setRoom}
          />
          <View className="flex-row gap-1.5 flex-wrap">
            {['Block B, Hall 3', 'Lab 1', 'Lab 2', 'Seminar Hall', 'Room 101', 'Room 204'].map((r) => (
              <TouchableOpacity
                key={r}
                activeOpacity={0.7}
                onPress={() => setRoom(r)}
                className={`px-2.5 py-1 rounded-lg border ${
                  room === r ? 'bg-primary/10 border-primary/40' : 'bg-muted/30 border-border/60'
                }`}
              >
                <Text
                  className={`text-[10px] font-semibold ${
                    room === r ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Step 5: 6-Day Timetable Schedule Picker */}
        <View className="mb-4">
          <SchedulePicker
            value={schedule}
            onChange={setSchedule}
            label="5. Timetable Schedule (6 Working Days)"
          />
        </View>

        {/* Step 6: Academic Year / Batch */}
        <View className="mb-5">
          <Text className="text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
            6. Academic Year / Batch
          </Text>
          <TextInput
            className="bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground"
            placeholder="e.g. 2026-2027"
            placeholderTextColor="#94a3b8"
            value={academicYear}
            onChangeText={setAcademicYear}
          />
        </View>

        {/* Allocation Summary Preview */}
        {selectedSubject && (
          <Card className="mb-6 p-4 bg-muted/30 border-border">
            <Text className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Allocation Summary
            </Text>
            <View className="gap-1.5">
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted-foreground">Course & Semester:</Text>
                <Text className="text-xs font-semibold text-foreground">
                  {selectedCourse?.code} • {selectedSubject.semester || 'Semester 1'}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted-foreground">Subject:</Text>
                <Text className="text-xs font-semibold text-foreground">
                  {selectedSubject.name} ({selectedSubject.code})
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted-foreground">Room:</Text>
                <Text className="text-xs font-semibold text-foreground">{room || 'TBD'}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-xs text-muted-foreground">Timetable:</Text>
                <Text className="text-xs font-bold text-primary">{schedule}</Text>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>

      {/* Fixed Sticky Action Bar at Bottom */}
      <View className="px-4 py-3 bg-card border-t border-border flex-row gap-3 shadow-lg">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleBack}
          className="flex-1 h-12 rounded-xl border border-input bg-card items-center justify-center"
        >
          <Text className="text-sm font-semibold text-foreground">Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          disabled={assignTeacherMutation.isPending || !selectedSubjectId}
          onPress={handleConfirmAssignment}
          className={`flex-1 h-12 rounded-xl items-center justify-center ${assignTeacherMutation.isPending || !selectedSubjectId
              ? 'bg-primary/50'
              : 'bg-primary'
            }`}
        >
          {assignTeacherMutation.isPending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-sm font-bold text-primary-foreground">
              Confirm Allocation
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Confirmation / Feedback Dialog */}
      <ConfirmDialog
        visible={!!confirmDialog}
        title={confirmDialog?.title}
        description={confirmDialog?.description}
        confirmText={confirmDialog?.confirmText}
        cancelText={confirmDialog?.cancelText}
        variant={confirmDialog?.variant}
        icon={confirmDialog?.icon}
        loading={assignTeacherMutation.isPending}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    </View>
  );
}
