import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../ui/text';
import Icon from '../ui/Icon';
import DepartmentSelect from '../ui/DepartmentSelect';
import SchedulePicker from '../ui/SchedulePicker';
import {
  useAdminCourses,
  useCourseSemesters,
  useSemesterSubjects,
  useCreateTeacher,
} from '../../hooks/useAdmin';
import ModalWrapper, { FormSection } from '../ui/ModalWrapper';
import FormField from '../ui/FormField';
import DropdownField from '../ui/DropdownField';
import {
  buildCourseOptions,
  buildSemesterOptions,
} from '../../utils/courseOptions';

const ROOM_PRESETS = [
  'Block B, Hall 3',
  'Lab 1',
  'Lab 2',
  'Seminar Hall',
  'Room 101',
  'Room 204',
];

const SPECIALIZATION_PRESETS = [
  'Computer Science',
  'AI & ML',
  'Data Science',
  'Cyber Security',
  'Networking',
  'Database Systems',
  'Software Engineering',
  'Mathematics',
];

const QUALIFICATION_PRESETS = ['Ph.D.', 'M.Tech', 'MCA', 'M.Sc.', 'B.Tech'];

const INITIAL_TEACHER_FORM = {
  name: '',
  email: '',
  password: 'teacher123',
  employee_code: '',
  phone: '',
  department: 'Computer Science & Engineering',
  specialization: '',
  qualification: '',
  course_id: null,
  semester_id: null,
  semester: '',
  subject_id: null,
  room: 'Block B, Hall 3',
  schedule: 'Mon, Wed, Fri - 10:15 AM',
  academic_year: '2026-2027',
};

export default function CreateTeacherModal({
  visible,
  onClose,
  onSuccess,
  title = 'Register Faculty Member',
  subtitle = 'Create a teacher login and configure department assignments.',
  headerBottom,
}) {
  const [formData, setFormData] = useState(INITIAL_TEACHER_FORM);
  const [assignNow, setAssignNow] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { data: courses = [], isLoading: coursesLoading } = useAdminCourses();
  const { data: fetchedSemesters = [], isLoading: semestersLoading } =
    useCourseSemesters(formData.course_id);
  const { data: semesterSubjects = [], isLoading: subjectsLoading } =
    useSemesterSubjects(formData.semester_id, {
      enabled: assignNow && Boolean(formData.semester_id),
    });

  const createTeacherMutation = useCreateTeacher();

  const updateFields = (patch) =>
    setFormData((prev) => ({ ...prev, ...patch }));

  const selectedCourse = useMemo(
    () => (courses || []).find((c) => c.id === formData.course_id) || null,
    [courses, formData.course_id]
  );

  const courseOptions = useMemo(() => buildCourseOptions(courses), [courses]);

  const semesterOptions = useMemo(
    () => buildSemesterOptions(formData.course_id, fetchedSemesters, selectedCourse),
    [formData.course_id, fetchedSemesters, selectedCourse]
  );

  // Sync first semester when selected course semesters load
  useEffect(() => {
    if (!formData.course_id || semesterOptions.length === 0) {
      if (!formData.course_id && (formData.semester || formData.semester_id)) {
        updateFields({ semester: '', semester_id: null });
      }
      return;
    }

    const matchingOpt = semesterOptions.find((opt) => opt.value === formData.semester);
    if (matchingOpt) {
      if (matchingOpt.semesterId !== formData.semester_id) {
        updateFields({ semester_id: matchingOpt.semesterId });
      }
    } else {
      updateFields({
        semester: semesterOptions[0].value,
        semester_id: semesterOptions[0].semesterId,
      });
    }
  }, [formData.course_id, semesterOptions, formData.semester, formData.semester_id]);

  const resetForm = () => {
    setFormData(INITIAL_TEACHER_FORM);
    setAssignNow(false);
    setErrorMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  const handleSubmit = async () => {
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Faculty name is required.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('A valid Email address is required.');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (assignNow) {
      if (!formData.course_id) {
        setErrorMessage('Please select a course for assignment.');
        return;
      }
      if (!formData.subject_id) {
        setErrorMessage('Please select a subject to assign to this teacher.');
        return;
      }
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      employee_code: formData.employee_code.trim().toUpperCase() || undefined,
      department: formData.department.trim() || undefined,
      specialization: formData.specialization.trim() || undefined,
      qualification: formData.qualification.trim() || undefined,
      phone: formData.phone.trim() || undefined,
    };

    if (assignNow && formData.course_id && formData.subject_id) {
      payload.course_id = Number(formData.course_id);
      payload.subject_id = Number(formData.subject_id);
      payload.semester = formData.semester || 'Semester 1';
      payload.room = formData.room.trim() || 'Block B, Hall 3';
      payload.schedule = formData.schedule.trim() || 'Mon, Wed, Fri - 10:15 AM';
      payload.academic_year = formData.academic_year.trim() || '2026-2027';
    }

    try {
      const result = await createTeacherMutation.mutateAsync(payload);
      resetForm();
      if (onSuccess) onSuccess(result);
      onClose?.();
    } catch (err) {
      const msg =
        err?.data?.detail ||
        err?.data?.message ||
        err?.message ||
        'Failed to create teacher account.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  const selectedCourseLabel = selectedCourse
    ? `${selectedCourse.code} - ${selectedCourse.name}`
    : '';

  return (
    <ModalWrapper
      visible={visible}
      onClose={handleClose}
      title={title}
      subtitle={subtitle}
      headerBottom={headerBottom}
      errorMessage={errorMessage}
      onSubmit={handleSubmit}
      isSubmitting={createTeacherMutation.isPending}
      submitText="Create Teacher"
      maxHeight="92%"
    >
      <FormField
        label="Full Name"
        required
        value={formData.name}
        onChangeText={(val) => updateFields({ name: val })}
        placeholder="e.g. Dr. Rajesh Sharma"
      />

      <FormField
        label="Email Address"
        required
        value={formData.email}
        onChangeText={(val) => updateFields({ email: val })}
        placeholder="e.g. rajesh.sharma@college.edu"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <FormField
        label="Initial Password"
        required
        hint="Default: teacher123"
        value={formData.password}
        onChangeText={(val) => updateFields({ password: val })}
        placeholder="Enter minimum 6 characters"
        secureTextEntry={false}
        autoCapitalize="none"
      />

      <View className="flex-row gap-2 mb-3">
        <View className="flex-1">
          <FormField
            label="Employee Code"
            value={formData.employee_code}
            onChangeText={(val) => updateFields({ employee_code: val })}
            placeholder="Auto (FAC-100X)"
            autoCapitalize="characters"
            containerClassName="mb-0"
          />
        </View>

        <View className="flex-1">
          <FormField
            label="Phone Number"
            value={formData.phone}
            onChangeText={(val) => updateFields({ phone: val })}
            placeholder="+91 9876543210"
            keyboardType="phone-pad"
            containerClassName="mb-0"
          />
        </View>
      </View>

      <DepartmentSelect
        value={formData.department}
        onChange={(val) => updateFields({ department: val })}
        onSelectCourse={(crs) => {
          if (crs?.id) {
            updateFields({
              course_id: crs.id,
              semester: '',
              semester_id: null,
              subject_id: null,
            });
          }
        }}
        courses={courses}
        isLoading={coursesLoading}
        label="Department"
      />

      {/* Specialization Input & Presets */}
      <View className="mb-3">
        <FormField
          label="Specialization"
          value={formData.specialization}
          onChangeText={(val) => updateFields({ specialization: val })}
          placeholder="e.g. AI & ML, Database Systems, Networking"
          containerClassName="mb-1.5"
        />
        <View className="flex-row flex-wrap gap-1.5">
          {SPECIALIZATION_PRESETS.map((spec) => {
            const active = formData.specialization.trim().toLowerCase() === spec.toLowerCase();
            return (
              <TouchableOpacity
                key={spec}
                activeOpacity={0.7}
                onPress={() => updateFields({ specialization: active ? '' : spec })}
                className={`px-2.5 py-1 rounded-full border ${
                  active ? 'bg-[#007AFF] border-[#007AFF]' : 'bg-muted/30 border-border/70'
                }`}
              >
                <Text
                  className={`text-[10px] font-medium ${
                    active ? 'text-white' : 'text-muted-foreground'
                  }`}
                >
                  {spec}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Qualification Input & Presets */}
      <View className="mb-3">
        <FormField
          label="Qualification"
          value={formData.qualification}
          onChangeText={(val) => updateFields({ qualification: val })}
          placeholder="e.g. Ph.D., M.Tech, MCA"
          containerClassName="mb-1.5"
        />
        <View className="flex-row flex-wrap gap-1.5">
          {QUALIFICATION_PRESETS.map((qual) => {
            const active = formData.qualification.trim().toLowerCase() === qual.toLowerCase();
            return (
              <TouchableOpacity
                key={qual}
                activeOpacity={0.7}
                onPress={() => updateFields({ qualification: active ? '' : qual })}
                className={`px-2.5 py-1 rounded-full border ${
                  active ? 'bg-[#007AFF] border-[#007AFF]' : 'bg-muted/30 border-border/70'
                }`}
              >
                <Text
                  className={`text-[10px] font-medium ${
                    active ? 'text-white' : 'text-muted-foreground'
                  }`}
                >
                  {qual}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Direct Class Allocation (Optional Toggle) */}
      <FormSection
        title="Assign Class Workload Now"
        subtitle="Optional: Immediately allocate a course and subject to this teacher."
        onHeaderPress={() => setAssignNow(!assignNow)}
        headerRight={
          <View
            className={`w-6 h-6 rounded-md items-center justify-center border ${
              assignNow ? 'bg-primary border-primary' : 'bg-muted border-border'
            }`}
          >
            {assignNow ? <Icon name="checkmark" size={14} color="#ffffff" /> : null}
          </View>
        }
      >
        {assignNow ? (
          <View className="mt-1 pt-3 border-t border-border/60">
            <DropdownField
              label="Course"
              required
              placeholder="Select a course..."
              selectedLabel={selectedCourseLabel}
              options={courseOptions}
              selectedValue={formData.course_id}
              onSelect={(opt) =>
                updateFields({
                  course_id: opt.value,
                  semester: '',
                  semester_id: null,
                  subject_id: null,
                })
              }
              isLoading={coursesLoading}
              emptyText="No courses found."
            />

            <DropdownField
              label="Semester"
              required
              placeholder={formData.course_id ? 'Select semester...' : 'Select a course first'}
              selectedLabel={formData.semester}
              options={semesterOptions}
              selectedValue={formData.semester}
              onSelect={(opt) =>
                updateFields({
                  semester: opt.value,
                  semester_id: opt.semesterId || null,
                  subject_id: null,
                })
              }
              isLoading={semestersLoading}
              disabled={!formData.course_id}
              emptyText="No semesters available for this course."
            />

            {selectedCourse ? (
              <View className="mb-3">
                <Text className="text-xs font-medium text-foreground mb-1.5">
                  Select Subject
                </Text>
                {subjectsLoading ? (
                  <ActivityIndicator size="small" color="#0284c7" />
                ) : semesterSubjects.length === 0 ? (
                  <Text className="text-xs font-medium text-muted-foreground italic py-1">
                    No subjects found for {formData.semester || 'this semester'}.
                  </Text>
                ) : (
                  <View className="flex-row flex-wrap gap-1.5">
                    {semesterSubjects.map((sub) => {
                      const isSelected = formData.subject_id === sub.id;
                      return (
                        <TouchableOpacity
                          key={sub.id}
                          onPress={() => updateFields({ subject_id: sub.id })}
                          className={`px-2.5 py-1.5 rounded-lg border ${
                            isSelected
                              ? 'bg-primary border-primary'
                              : 'bg-card border-border'
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium ${
                              isSelected ? 'text-primary-foreground' : 'text-foreground'
                            }`}
                          >
                            {sub.code}
                          </Text>
                          <Text
                            className={`text-[10px] font-medium ${
                              isSelected
                                ? 'text-primary-foreground/80'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {sub.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : null}

            <View className="mt-2 mb-3">
              <Text className="text-xs font-medium text-foreground mb-1">
                Assigned Room
              </Text>
              <TextInput
                value={formData.room}
                onChangeText={(val) => updateFields({ room: val })}
                placeholder="Block B, Hall 3"
                placeholderTextColor="#94a3b8"
                className="bg-card border border-border rounded-xl px-2.5 py-1.5 text-xs font-medium text-foreground mb-1.5"
              />
              <View className="flex-row gap-1 flex-wrap">
                {ROOM_PRESETS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    activeOpacity={0.7}
                    onPress={() => updateFields({ room: r })}
                    className={`px-2 py-0.5 rounded-md border ${
                      formData.room === r
                        ? 'bg-primary/10 border-primary/40'
                        : 'bg-muted/30 border-border/60'
                    }`}
                  >
                    <Text
                      className={`text-[9px] font-medium ${
                        formData.room === r ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <SchedulePicker
              value={formData.schedule}
              onChange={(val) => updateFields({ schedule: val })}
              compact={true}
              label="Timetable Schedule"
            />
          </View>
        ) : null}
      </FormSection>
    </ModalWrapper>
  );
}
