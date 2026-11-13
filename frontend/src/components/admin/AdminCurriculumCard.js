import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { Text } from '../ui/text';
import { Badge } from '../ui/badge';

function toTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .trim()
    .split(' ')
    .map((word) => {
      if (!word) return '';
      const upper = word.toUpperCase();
      if (['AI', 'IT', 'CS', 'DS', 'MCA', 'BCA', 'MBA', 'BBA', 'B.TECH', 'M.TECH', 'BSC', 'MSC'].includes(upper)) {
        return upper;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export default function AdminCurriculumCard({ course, onPress }) {
  if (!course) return null;

  const courseName = toTitleCase(course.name || 'Unnamed Course');
  const departmentName = toTitleCase(course.department || course.description || 'Degree Program');
  const enrolledCount = course.enrolled_students_count ?? course.enrolled_students ?? course.students_count ?? 0;

  const durationYears = course.duration_years
    ? `${course.duration_years} Years`
    : course.total_semesters
    ? `${Math.ceil(course.total_semesters / 2)} Years`
    : course.semesters && course.semesters.length > 0
    ? `${Math.ceil(course.semesters.length / 2)} Years`
    : '3 Years';

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={{ width: 230 }}
      className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm justify-between"
    >
      <View>
        {/* Top Header: Badge on left, Duration text on right without badge */}
        <View className="flex-row items-center justify-between mb-3">
          <Badge variant="secondary" className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/50">
            <Text className="text-[11px] font-bold text-blue-700">
              {course.code || 'COURSE'}
            </Text>
          </Badge>

          <Text className="text-xs font-semibold text-muted-foreground">
            {durationYears}
          </Text>
        </View>

        {/* Course Title in Sentence/Title Case */}
        <Text
          className="text-sm font-bold text-foreground leading-snug mb-1"
          numberOfLines={2}
        >
          {courseName}
        </Text>

        {/* Department or Degree Type */}
        <Text
          className="text-xs text-muted-foreground font-medium"
          numberOfLines={1}
        >
          {departmentName}
        </Text>
      </View>

      {/* Footer Action: Enrolled with Refined Color & Circular Arrow Icon */}
      <View className="pt-3 mt-3 border-t border-border/40 flex-row items-center justify-between">
        <Text className="text-xs font-semibold text-slate-600">
          <Text className="font-bold text-foreground">{enrolledCount}</Text> Enrolled
        </Text>

        <View className="w-7 h-7 rounded-full bg-blue-50 border border-blue-200/60 items-center justify-center">
          <ArrowRight size={14} color="#0284c7" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
