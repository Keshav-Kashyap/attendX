import React, { useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowRight,
  Clock,
  BookOpen,
  Users,
} from 'lucide-react-native';
import { Text } from '../ui/text';
import AdminScreenHeader from './AdminScreenHeader';
import AdminEmptyState from './AdminEmptyState';

const ACCENT = '#3B3FE0';

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function MetaChip({ icon: Icon, label }) {
  return (
    <View className="flex-row items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#F3F4FA]">
      <Icon size={14} color="#3A3F57" strokeWidth={2} />
      <Text className="text-[13px] font-medium text-[#3A3F57]">{label}</Text>
    </View>
  );
}

function CourseCard({ course, onPress }) {
  const years = Number(course.duration_years) || 3;
  const subjectsCount = course.subjects_count ?? (course.subjects || []).length;
  const enrolledCount = course.enrolled_students_count ?? 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${course.name}, ${course.code}. Open curriculum and timetable`}
      className="mb-3"
    >
      <View
        className="bg-white rounded-[22px] p-5 gap-3.5"
        style={{
          shadowColor: '#14172B',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        }}
      >
        {/* Code badge + arrow */}
        <View className="flex-row items-center justify-between">
          <View className="px-3 py-1.5 rounded-[10px] bg-[#EEEFFC]">
            <Text
              className="text-[13px] font-bold"
              style={{ color: ACCENT, letterSpacing: 0.8 }}
            >
              {course.code}
            </Text>
          </View>
          <View className="w-9 h-9 rounded-full bg-[#EEEFFC] items-center justify-center">
            <ArrowRight size={18} color={ACCENT} strokeWidth={2.4} />
          </View>
        </View>

        {/* Title (+ optional description) */}
        <View>
          <Text className="text-[22px] leading-[27px] font-bold text-[#14172B]">
            {course.name}
          </Text>
          {course.description ? (
            <Text
              className="text-xs text-muted-foreground mt-1.5"
              numberOfLines={2}
            >
              {course.description}
            </Text>
          ) : null}
        </View>

        {/* Meta chips */}
        <View className="flex-row flex-wrap gap-2">
          <MetaChip icon={Clock} label={plural(years, 'Year')} />
          <MetaChip icon={BookOpen} label={plural(subjectsCount, 'Subject')} />
          <MetaChip icon={Users} label={`${enrolledCount} Enrolled`} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CourseListView({
  courses = [],
  coursesLoading = false,
  searchQuery = '',
  setSearchQuery,
  selectedCourseFilter = 'all',
  setSelectedCourseFilter,
  courseCodeFilters = [],
  filteredCourses = [],
  onSelectCourse,
  onDeleteCourse,
  onOpenCreateCourse,
}) {
  const filterOptions = useMemo(() => {
    return (courseCodeFilters || []).map((code) => {
      const count = courses.filter(
        (c) => (c.code || '').trim().toUpperCase() === code
      ).length;
      return {
        key: code,
        value: code,
        label: `${code} (${count})`,
      };
    });
  }, [courseCodeFilters, courses]);

  return (
    <View className="flex-1">
      {/* Standardized Admin Header */}
      <AdminScreenHeader
        title="Course Management"
        subtitle="Manage academic curriculum, departments, subjects & class schedules."
        badgeText={`${courses.length} Courses`}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchPlaceholder="Search by course name, code, or subject..."
        allFilterLabel={`All Courses (${courses.length})`}
        selectedFilter={selectedCourseFilter}
        onSelectFilter={setSelectedCourseFilter}
        filterOptions={filterOptions}
        onAddPress={onOpenCreateCourse}
      />

      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-3 px-0.5">
        <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          ACTIVE COURSES
        </Text>
        <Text className="text-xs font-semibold text-primary">
          {filteredCourses.length} of {courses.length}
        </Text>
      </View>

      {/* Courses Cards */}
      {coursesLoading ? (
        <ActivityIndicator size="small" color="#2563eb" className="my-6" />
      ) : filteredCourses.length > 0 ? (
        filteredCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onPress={() => onSelectCourse(course.id)}
          />
        ))
      ) : (
        <AdminEmptyState
          icon="school"
          title="No Courses Found"
          description={
            searchQuery || selectedCourseFilter !== 'all'
              ? 'No courses match your filter or search criteria.'
              : 'Get started by adding your first academic course or degree.'
          }
          actionLabel="+ Add Course"
          onAction={onOpenCreateCourse}
        />
      )}
    </View>
  );
}