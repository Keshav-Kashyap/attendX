import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '../ui/text';
import { useUpdateCourse } from '../../hooks/useAdmin';
import ModalWrapper, { FormSection } from '../ui/ModalWrapper';
import FormField from '../ui/FormField';

const DURATION_OPTIONS = [
  { years: 1, label: '1 Year', sems: 2 },
  { years: 2, label: '2 Years', sems: 4 },
  { years: 3, label: '3 Years', sems: 6 },
  { years: 4, label: '4 Years', sems: 8 },
  { years: 5, label: '5 Years', sems: 10 },
];

export default function EditCourseModal({
  visible,
  course,
  onClose,
  onSuccess,
  onError,
}) {
  const [courseName, setCourseName] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [durationYears, setDurationYears] = useState(3);
  const [courseDesc, setCourseDesc] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const updateCourseMutation = useUpdateCourse();

  useEffect(() => {
    if (course && visible) {
      setCourseName(course.name || '');
      setCourseCode(course.code || '');
      const defaultDuration =
        Number(course.duration_years) ||
        (course.total_semesters ? Math.round(course.total_semesters / 2) : 3);
      setDurationYears(defaultDuration);
      setCourseDesc(course.description || '');
      setErrorMessage('');
    }
  }, [course, visible]);

  const handleClose = () => {
    setErrorMessage('');
    onClose?.();
  };

  const handleSubmit = async () => {
    setErrorMessage('');

    if (!courseCode.trim() || !courseName.trim()) {
      setErrorMessage('Course Code and Course Name are required.');
      return;
    }

    if (!course?.id) {
      setErrorMessage('Course identifier is missing.');
      return;
    }

    const years = Number(durationYears) || 3;
    const totalSems = years * 2;

    const payload = {
      name: courseName.trim(),
      code: courseCode.trim().toUpperCase(),
      duration_years: years,
      total_semesters: totalSems,
      description: courseDesc.trim() || undefined,
    };

    try {
      const data = await updateCourseMutation.mutateAsync({
        courseId: course.id,
        data: payload,
      });
      handleClose();
      onSuccess?.(data);
    } catch (err) {
      const msg =
        err?.data?.detail ||
        err?.data?.message ||
        err?.message ||
        'Failed to update course.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
      onError?.(err);
    }
  };

  return (
    <ModalWrapper
      visible={visible}
      onClose={handleClose}
      title="Edit Course"
      subtitle="Update degree title, course code, duration and curriculum details."
      errorMessage={errorMessage}
      onSubmit={handleSubmit}
      isSubmitting={updateCourseMutation.isPending}
      submitText="Save Changes"
      cancelText="Cancel"
    >
      {/* Course Code */}
      <FormField
        label="Course Code"
        required
        value={courseCode}
        onChangeText={setCourseCode}
        placeholder="e.g. MCA, BCA, B.Tech CSE"
        autoCapitalize="characters"
      />

      {/* Course Name */}
      <FormField
        label="Course Name"
        required
        value={courseName}
        onChangeText={setCourseName}
        placeholder="e.g. Master of Computer Applications"
      />

      {/* Course Duration Selector */}
      <FormSection
        title="Course Duration"
        subtitle="Select degree duration to calculate required semesters."
        headerRight={
          <View className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
            <Text className="text-[11px] font-bold text-primary">
              {durationYears * 2} Semesters
            </Text>
          </View>
        }
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="py-1"
        >
          <View className="flex-row gap-2">
            {DURATION_OPTIONS.map((opt) => {
              const isSelected = durationYears === opt.years;
              return (
                <TouchableOpacity
                  key={opt.years}
                  activeOpacity={0.7}
                  onPress={() => setDurationYears(opt.years)}
                  className={`px-3.5 py-2 rounded-xl border ${
                    isSelected
                      ? 'bg-primary border-primary'
                      : 'bg-card border-border'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? 'text-primary-foreground' : 'text-foreground'
                    }`}
                  >
                    {opt.label}
                  </Text>
                  <Text
                    className={`text-[10px] ${
                      isSelected
                        ? 'text-primary-foreground/80'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {opt.sems} Semesters
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </FormSection>

      {/* Description */}
      <FormField
        label="Description (Optional)"
        value={courseDesc}
        onChangeText={setCourseDesc}
        placeholder="Enter course description, specialization or curriculum notes..."
        multiline
        numberOfLines={3}
      />
    </ModalWrapper>
  );
}
