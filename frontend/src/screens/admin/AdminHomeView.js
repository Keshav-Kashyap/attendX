import React from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Text } from '../../components/ui/text';
import { Badge } from '../../components/ui/badge';
import Icon from '../../components/ui/Icon';
import { useAdminStats } from '../../hooks/useAdmin';
import AdminStatMetricCard from '../../components/admin/AdminStatMetricCard';
import AdminCurriculumCard from '../../components/admin/AdminCurriculumCard';
import Welcome from '../../components/ui/common/Welcome';

export default function AdminHomeView({ user, adminStats: initialStats, onNavigate }) {
  const router = useRouter();

  // Queries
  const {
    data: liveStats,
    isLoading: statsLoading,
    refetch: refetchStats,
    isRefetching,
  } = useAdminStats();

  const stats = liveStats || initialStats;

  const handleNav = (route, params) => {
    if (onNavigate) {
      onNavigate(route, params);
      return;
    }
    const path = route.startsWith('/') ? route : `/${route}`;
    if (params && Object.keys(params).length > 0) {
      router.push({ pathname: path, params });
    } else {
      router.push(path);
    }
  };

  const totalCourses = stats?.total_courses ?? 0;
  const totalSubjects = stats?.total_subjects ?? 0;
  const totalTeachers = stats?.total_teachers ?? 0;
  const totalStudents = stats?.total_students ?? 0;
  const totalAssignments = stats?.total_teacher_assignments ?? 0;
  const activeEnrollments = stats?.active_enrollments ?? 0;
  const courseBreakdown = stats?.course_breakdown ?? [];

  return (
    <ScrollView
      className="flex-1 bg-background px-4 pt-2.5 pb-0"
      contentContainerStyle={{ paddingBottom: 96 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={statsLoading || isRefetching}
          onRefresh={refetchStats}
          tintColor="#0284c7"
        />
      }
    >
      {/* Welcome Banner */}
      <Welcome user={user} role="admin" />

      {/* 2x2 Core Institutional KPI Grid */}
      <View className="mb-5">
        <View className="gap-2.5">
          {/* Row 1: Courses & Teachers */}
          <View className="flex-row gap-2.5">
            <AdminStatMetricCard
              title="Degree Programs"
              value={totalCourses}
              icon="school"
              iconBg="bg-blue-50"
              iconColor="#0284c7"
              badgeText={`${totalSubjects} Subjects`}
              badgeBg="bg-blue-50"
              badgeColor="text-blue-700"
              subtitle="Manage Curriculum"
              onPress={() => handleNav('admin_courses')}
            />

            <AdminStatMetricCard
              title="Faculty Members"
              value={totalTeachers}
              icon="people"
              iconBg="bg-emerald-50"
              iconColor="#059669"
              badgeText="Active Staff"
              badgeBg="bg-emerald-50"
              badgeColor="text-emerald-700"
              subtitle="Faculty Directory"
              onPress={() => handleNav('admin_teachers')}
            />
          </View>

          {/* Row 2: Students & Class Allocations */}
          <View className="flex-row gap-2.5">
            <AdminStatMetricCard
              title="Students Enrolled"
              value={totalStudents}
              icon="person"
              iconBg="bg-purple-50"
              iconColor="#7c3aed"
              badgeText={`${activeEnrollments} Enrolled`}
              badgeBg="bg-purple-50"
              badgeColor="text-purple-700"
              subtitle="Cohort Rosters"
              onPress={() => handleNav('admin_students')}
            />

            <AdminStatMetricCard
              title="Class Schedules"
              value={totalAssignments}
              icon="calendar"
              iconBg="bg-amber-50"
              iconColor="#d97706"
              badgeText="Timetable"
              badgeBg="bg-amber-50"
              badgeColor="text-amber-800"
              subtitle="Assign Schedules"
              onPress={() => handleNav('admin_teacher_assign')}
            />
          </View>
        </View>
      </View>

      {/* Academic Curriculum Section with Horizontal X-Scroll Cards */}
      {courseBreakdown.length > 0 ? (
        <View className="mb-5">
          {/* Clean Modern Section Heading */}
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <View className="flex-row items-center gap-2">
                <Text className="text-base font-bold text-foreground">
                  Academic Curriculum
                </Text>
               
              </View>
              <Text className="text-xs text-muted-foreground mt-0.5">
                Swipe to explore courses, subjects & schedules
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => handleNav('admin_courses')}
              activeOpacity={0.7}
              className="flex-row items-center gap-1 bg-muted/60 px-3 py-1.5 rounded-full"
            >
              <Text className="text-xs font-semibold text-primary">View All</Text>
              <ChevronRight size={12} color="#0284c7" />
            </TouchableOpacity>
          </View>

          {/* Horizontal X-Scroll Course Cards Carousel */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16, gap: 12 }}
            className="overflow-visible"
          >
            {courseBreakdown.map((course) => (
              <AdminCurriculumCard
                key={course.id}
                course={course}
                onPress={() => handleNav('admin_courses', { courseId: course.id })}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
    </ScrollView>
  );
}
