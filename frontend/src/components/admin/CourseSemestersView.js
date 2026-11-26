import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import {
  ArrowLeft,
  ChevronRight,
  Layers,
  Pencil,
  Trash2,
} from 'lucide-react-native';
import { Text } from '../ui/text';
import { Skeleton } from '../ui/Skeleton';

export default function CourseSemestersView({
  course,
  semesters = [],
  isLoading = false,
  onBack,
  onSelectSemester,
  onEditCourse,
  onDeleteCourse,
  children,
}) {
  if (!course) return null;

  const totalSemestersCount = course.total_semesters || semesters.length || 0;

  return (
    <View className="px-4 pt-3 pb-6">
      {/* Navigation Breadcrumb & Quick Actions */}
      <View className="flex-row items-center justify-between mb-3">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          className="flex-row items-center gap-2 flex-1 mr-2"
        >
          <ArrowLeft size={18} color="#2563eb" strokeWidth={2.5} />
          <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
            {course.code}
          </Text>
        </TouchableOpacity>

        {/* Top-Right Quick Action Icons */}
        <View className="flex-row items-center gap-1.5">
          {onEditCourse && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onEditCourse}
              accessibilityLabel="Edit Course"
              className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200/80 items-center justify-center"
            >
              <Pencil size={14} color="#2563eb" strokeWidth={2.2} />
            </TouchableOpacity>
          )}
          {onDeleteCourse && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onDeleteCourse}
              accessibilityLabel="Delete Course"
              className="w-8 h-8 rounded-full bg-red-50 border border-red-200/80 items-center justify-center"
            >
              <Trash2 size={14} color="#ef4444" strokeWidth={2.2} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Course Header Banner */}
      <View className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm mb-4">
        <View className="flex-row items-center gap-2 mb-2 flex-wrap">
          <View className="bg-blue-600 px-3 py-1 rounded-full">
            <Text className="text-xs font-medium text-white">{course.code}</Text>
          </View>
          <View className="bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
            <Text className="text-xs font-bold text-blue-700">
              {course.duration_years ? `${course.duration_years} Years Program` : '3 Years'}
            </Text>
          </View>
          <View className="bg-slate-100 px-3 py-1 rounded-full">
            <Text className="text-xs font-bold text-slate-700">
              {totalSemestersCount} Semesters
            </Text>
          </View>
        </View>

        <Text className="text-xl font-medium text-slate-900 leading-tight mb-1">
          {course.name}
        </Text>
        <Text className="text-xs text-slate-500">
          {course.description || 'Academic Curriculum & Semester Progression'}
        </Text>
      </View>

      {children ? (
        children
      ) : (
        <>
          {/* Section Title */}
      <View className="mb-3">
        <Text className="text-base font-medium text-slate-900">
          Select Semester
        </Text>
        <Text className="text-xs text-slate-500">
          Choose a semester to load subjects, roster, and schedule.
        </Text>
      </View>

      {/* Semesters List */}
      {isLoading ? (
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <View
              key={k}
              className="w-[48%] bg-white border border-slate-200 rounded-2xl p-3 gap-2.5"
            >
              <View className="flex-row items-center justify-between">
                <Skeleton width={80} height={16} borderRadius={6} />
                <Skeleton width={14} height={14} borderRadius={4} />
              </View>
              <Skeleton width={110} height={12} borderRadius={4} />
            </View>
          ))}
        </View>
      ) : semesters.length === 0 ? (
        <View className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 items-center">
          <Layers size={28} color="#94a3b8" />
          <Text className="text-sm font-bold text-slate-800 mt-2">
            No Semesters Configured
          </Text>
          <Text className="text-xs text-slate-500 mt-1 text-center">
            No semester entries were found for this course.
          </Text>
        </View>
      ) : (
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {semesters.map((sem) => (
            <TouchableOpacity
              key={sem.id || sem.semester_number}
              activeOpacity={0.75}
              onPress={() => onSelectSemester(sem)}
              className="w-[48%] bg-white border border-slate-200 rounded-2xl p-3"
            >
              {/* Semester Name */}
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sm font-bold text-slate-900">
                    Semester {sem.semester_number}
                  </Text>
                </View>

                <ChevronRight size={16} color="#94a3b8" />
              </View>

              {/* Stats */}
              <View className="flex-row items-center mt-3 gap-2">
                <Text className="text-[11px] font-medium text-slate-600">
                  {sem.subjects_count ?? 0} Subjects
                </Text>

                <View className="w-1 h-1 rounded-full bg-slate-300" />

                <Text className="text-[11px] font-medium text-slate-600">
                  {sem.students_count ?? 0} Students
                </Text>
              </View>

              {/* Lead Teacher / Coordinator */}
              <Text
                numberOfLines={1}
                className={`text-[11px] mt-1.5 font-medium ${
                  sem.coordinator_teacher_name ? 'text-blue-600' : 'text-slate-400'
                }`}
              >
                {sem.coordinator_teacher_name
                  ? `Lead: ${sem.coordinator_teacher_name}`
                  : 'No Lead Assigned'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
        </>
      )}
    </View>
  );
}
