import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../ui/text';
import Icon from '../ui/Icon';
import KeyboardSafeView from '../ui/KeyboardSafeView';
import { useAdminCourses, useEnrollBatch } from '../../hooks/useAdmin';

export default function BatchEnrollModal({ visible, onClose, onSuccess, onError }) {
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState('Semester 1');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [validationError, setValidationError] = useState('');

  const { data: courses = [], isLoading: coursesLoading } = useAdminCourses();
  const enrollBatchMutation = useEnrollBatch();

  useEffect(() => {
    if (visible && courses && courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id);
      if (courses[0].semesters && courses[0].semesters.length > 0) {
        setSelectedSemester(courses[0].semesters[0]);
      }
    }
  }, [visible, courses, selectedCourseId]);

  const selectedCourse = (courses || []).find((c) => c.id === selectedCourseId);
  const semesters =
    selectedCourse?.semesters && selectedCourse.semesters.length > 0
      ? selectedCourse.semesters
      : ['Semester 1', 'Semester 2', 'Semester 3', 'Semester 4'];

  const handleClose = () => {
    setValidationError('');
    onClose?.();
  };

  const handleEnroll = () => {
    if (!selectedCourseId) {
      setValidationError('Please select a course for enrollment.');
      return;
    }

    if (!selectedSemester) {
      setValidationError('Please select a target semester.');
      return;
    }

    if (!academicYear.trim()) {
      setValidationError('Academic year is required (e.g. 2026-2027).');
      return;
    }

    setValidationError('');

    enrollBatchMutation.mutate(
      {
        courseId: Number(selectedCourseId),
        data: {
          academic_year: academicYear.trim(),
          semester: selectedSemester.trim(),
          enroll_all_unassigned: true,
        },
      },
      {
        onSuccess: (res) => {
          handleClose();
          onSuccess?.(res);
        },
        onError: (err) => {
          onError?.(err);
        },
      }
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardSafeView className="bg-black/60 items-center justify-center p-4">
        <TouchableOpacity
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View className="bg-card w-full max-w-sm p-5 rounded-2xl border border-border shadow-2xl">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-bold text-foreground">Batch Enrollment</Text>
            <TouchableOpacity onPress={handleClose} activeOpacity={0.7} className="p-1">
              <Icon name="close" size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <Text className="text-xs text-muted-foreground mb-4">
            Enroll students in bulk to a degree course, semester, and academic year.
          </Text>

          {validationError ? (
            <View className="bg-destructive/10 border border-destructive/20 p-2.5 rounded-xl mb-3">
              <Text className="text-xs text-destructive font-medium">{validationError}</Text>
            </View>
          ) : null}

          {/* Select Course */}
          <Text className="text-xs font-semibold text-foreground mb-1.5">Select Course</Text>
          {coursesLoading ? (
            <ActivityIndicator size="small" color="#0284c7" className="my-2" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5 mb-3">
              {(courses || []).map((c) => {
                const isSelected = selectedCourseId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    onPress={() => {
                      setSelectedCourseId(c.id);
                      if (c.semesters && c.semesters.length > 0) {
                        setSelectedSemester(c.semesters[0]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl border ${
                      isSelected ? 'bg-primary border-primary' : 'bg-muted/40 border-border'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isSelected ? 'text-primary-foreground' : 'text-foreground'
                      }`}
                    >
                      {c.code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Select Semester */}
          <Text className="text-xs font-semibold text-foreground mb-1.5">Select Semester</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5 mb-3">
            {semesters.map((sem) => {
              const isSelected = selectedSemester === sem;
              return (
                <TouchableOpacity
                  key={sem}
                  onPress={() => setSelectedSemester(sem)}
                  className={`px-3 py-1.5 rounded-xl border ${
                    isSelected ? 'bg-primary border-primary' : 'bg-muted/40 border-border'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      isSelected ? 'text-primary-foreground' : 'text-foreground'
                    }`}
                  >
                    {sem}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Academic Year */}
          <Text className="text-xs font-semibold text-foreground mb-1">Academic Year</Text>
          <TextInput
            value={academicYear}
            onChangeText={setAcademicYear}
            placeholder="e.g. 2026-2027"
            placeholderTextColor="#94a3b8"
            className="bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground mb-4"
          />

          {/* Action Buttons */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleClose}
              disabled={enrollBatchMutation.isPending}
              className="flex-1 py-2.5 rounded-xl border border-border bg-card items-center justify-center"
            >
              <Text className="text-xs font-bold text-foreground">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleEnroll}
              disabled={enrollBatchMutation.isPending}
              className="flex-1 py-2.5 rounded-xl bg-primary items-center justify-center"
            >
              {enrollBatchMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-xs font-bold text-primary-foreground">Enroll Cohort</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardSafeView>
    </Modal>
  );
}
