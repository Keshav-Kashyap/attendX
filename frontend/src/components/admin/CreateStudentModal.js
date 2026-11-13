import React, { useState, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import {
  useAdminCourses,
  useCourseSemesters,
  useCreateStudent,
} from '../../hooks/useAdmin';
import ModalWrapper, { FormSection } from '../ui/ModalWrapper';
import FormField from '../ui/FormField';
import DropdownField from '../ui/DropdownField';
import ImagePickerField from '../ui/ImagePickerField';
import {
  buildCourseOptions,
  buildSemesterOptions,
} from '../../utils/courseOptions';

const INITIAL_STUDENT_FORM = {
  name: '',
  email: '',
  roll_number: '',
  phone: '',
  profile_image: null,
  course_id: null,
  semester_id: null,
  semester: '',
  academic_year: '2026-2027',
};

export default function CreateStudentModal({
  visible,
  onClose,
  onSuccess,
  title = 'Register & Enroll Student',
  subtitle = 'Create a new student profile and assign them to a course semester.',
  headerBottom,
}) {
  const [formData, setFormData] = useState(INITIAL_STUDENT_FORM);
  const [errorMessage, setErrorMessage] = useState('');

  const { data: courses = [], isLoading: coursesLoading } = useAdminCourses();
  const { data: fetchedSemesters = [], isLoading: semestersLoading } =
    useCourseSemesters(formData.course_id);

  const createStudentMutation = useCreateStudent();

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

  // Pre-select first course when opening modal
  useEffect(() => {
    if (visible && !formData.course_id && courses && courses.length > 0) {
      updateFields({ course_id: courses[0].id });
    }
  }, [visible, courses, formData.course_id]);

  // Sync first semester when course semesters load
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
    setFormData({
      ...INITIAL_STUDENT_FORM,
      course_id: courses && courses.length > 0 ? courses[0].id : null,
    });
    setErrorMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose?.();
  };

  const handleSubmit = async () => {
    setErrorMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Student name is required.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('A valid Email address is required.');
      return;
    }

    if (!formData.course_id) {
      setErrorMessage('Please select a course to enroll the student.');
      return;
    }

    if (!formData.semester) {
      setErrorMessage('Please select a semester for enrollment.');
      return;
    }

    const payload = {
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      roll_number: formData.roll_number.trim().toUpperCase() || undefined,
      phone: formData.phone.trim() || undefined,
      profile_image: formData.profile_image || undefined,
      course_id: Number(formData.course_id),
      semester_id: formData.semester_id ? Number(formData.semester_id) : undefined,
      academic_year: formData.academic_year.trim() || '2026-2027',
    };

    try {
      const result = await createStudentMutation.mutateAsync(payload);
      resetForm();
      if (onSuccess) onSuccess(result);
      onClose?.();
    } catch (err) {
      const msg =
        err?.data?.detail ||
        err?.data?.message ||
        err?.message ||
        'Failed to create student account.';
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
      isSubmitting={createStudentMutation.isPending}
      submitText="Create & Enroll"
      maxHeight="92%"
    >
      <ImagePickerField
        label="Student Photo"
        hint="Optional - 1 image only (no PDF)"
        value={formData.profile_image}
        onChange={(img) => updateFields({ profile_image: img })}
        onError={(msg) => setErrorMessage(msg)}
        disabled={createStudentMutation.isPending}
      />

      <FormField
        label="Student Full Name"
        required
        value={formData.name}
        onChangeText={(val) => updateFields({ name: val })}
        placeholder="e.g. Aarav Sharma"
      />

      <FormField
        label="Email Address"
        required
        value={formData.email}
        onChangeText={(val) => updateFields({ email: val })}
        placeholder="e.g. aarav.sharma@gmail.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View className="flex-row gap-2 mb-3">
        <View className="flex-1">
          <FormField
            label="Roll Number"
            value={formData.roll_number}
            onChangeText={(val) => updateFields({ roll_number: val })}
            placeholder="Auto (STU-100X)"
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

      <FormSection
        title="Course & Semester Enrollment *"
        subtitle="Select a course first, then pick its target semester."
      >
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
            })
          }
          isLoading={coursesLoading}
          emptyText="No courses found. Create a course first."
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
            })
          }
          isLoading={semestersLoading}
          disabled={!formData.course_id}
          emptyText="No semesters available for this course."
        />

        <FormField
          label="Academic Year / Batch"
          value={formData.academic_year}
          onChangeText={(val) => updateFields({ academic_year: val })}
          placeholder="2026-2027"
          containerClassName="mb-0"
        />
      </FormSection>
    </ModalWrapper>
  );
}
