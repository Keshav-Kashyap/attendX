import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, G } from 'react-native-svg';
import {
  GraduationCap,
  Users,
  BookOpen,
  User,
} from 'lucide-react-native';
import { Text } from '../../components/ui/text';
import { Skeleton } from '../../components/ui/Skeleton';
import { useAdminStats } from '../../hooks/useAdmin';
import Welcome from '../../components/ui/common/Welcome';

const COURSE_ICON_THEMES = [
  { bg: '#ECEFFE', color: '#3446D4' },
  { bg: '#E1F5F2', color: '#0E8F83' },
  { bg: '#FFF3DC', color: '#B26A00' },
];

const CARD_SHADOW = {
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E5E9F2',
  ...Platform.select({
    web: {
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
    },
    android: {
      elevation: 2,
    },
    default: {
      shadowColor: '#0f172a',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
  }),
};

function RingChart({
  size = 74,
  strokeWidth = 9,
  percentage = 0,
  isEmpty = false,
  customColor = null,
  fontSize = 14,
}) {
  const clamped = Math.max(0, Math.min(100, Number(percentage) || 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const ringColor = customColor
    ? customColor
    : isEmpty
    ? '#CBD5E1'
    : clamped >= 75
    ? '#117A45'
    : '#C4301F';

  const textColor = isEmpty ? '#64748B' : ringColor;

  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <Svg width={size} height={size}>
        <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E9ECF2"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {clamped > 0 && !isEmpty ? (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={ringColor}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
            />
          ) : null}
        </G>
      </Svg>
      <Text
        style={{
          position: 'absolute',
          fontSize,
          fontWeight: '800',
          color: textColor,
        }}
      >
        {isEmpty ? '0%' : `${clamped}%`}
      </Text>
    </View>
  );
}

export default function AdminHomeView({ user, adminStats: initialStats, onNavigate }) {
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
  const totalTeachers = stats?.total_teachers ?? 0;
  const totalStudents = stats?.total_students ?? 0;
  const overallAvgAttendance = stats?.overall_attendance_rate ?? 0;
  const heldClasses = stats?.held_classes_count ?? 0;
  const totalClasses = stats?.total_classes_count ?? 0;
  const heldClassesPct = stats?.held_classes_percentage ?? 0;
  const courseBreakdown = stats?.course_breakdown ?? [];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#F2F4F8' }}
      contentContainerStyle={{ paddingBottom: 112, backgroundColor: '#F2F4F8', flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={statsLoading || isRefetching}
          onRefresh={refetchStats}
          tintColor="#3446D4"
        />
      }
    >
      {/* Top Header */}
      <Welcome user={user} role="admin" />

      {/* Overlapping Top 4 Stat Cards (2x2 Grid) */}
      <View style={{ paddingHorizontal: 18, marginTop: -36 }}>
        <View style={{ gap: 12 }}>
          {/* Row 1: Courses + Students & Teachers */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Box 1: Courses */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleNav('admin_courses')}
              accessibilityRole="button"
              accessibilityLabel="Courses"
              className="bg-white"
              style={[
                CARD_SHADOW,
                {
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  padding: 16,
                  minHeight: 112,
                  justifyContent: 'space-between',
                },
              ]}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: '#ECEFFE',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}
              >
                <BookOpen size={19} color="#3446D4" />
              </View>
              <Text style={{ fontSize: 24, fontWeight: '600', color: '#0F172A' }}>
                {totalCourses}
              </Text>
              <Text style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
                Courses
              </Text>
            </TouchableOpacity>

            {/* Box 2: Students & Teachers combined */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleNav('users/students')}
              accessibilityRole="button"
              accessibilityLabel="Students and Teachers"
              className="bg-white"
              style={[
                CARD_SHADOW,
                {
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  padding: 16,
                  minHeight: 112,
                  justifyContent: 'space-between',
                },
              ]}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: '#E1F5F2',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 10,
                }}
              >
                <Users size={19} color="#0E8F83" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <Text style={{ fontSize: 22, fontWeight: '600', color: '#0F172A' }}>
                  {totalStudents}
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B' }}>
                    {' '}Std
                  </Text>
                </Text>
                <Text style={{ fontSize: 14, color: '#CBD5E1' }}>·</Text>
                <Text style={{ fontSize: 22, fontWeight: '600', color: '#0F172A' }}>
                  {totalTeachers}
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748B' }}>
                    {' '}Tch
                  </Text>
                </Text>
              </View>
              <Text style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
                Students · Teachers
              </Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: Two Rings (Total Avg Attendance + Held vs Total Classes) */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {/* Box 3: Ring 1 - Total Students Avg Attendance */}
            <View
              className="bg-white"
              style={[
                CARD_SHADOW,
                {
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  padding: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
            >
              <RingChart
                size={64}
                strokeWidth={8}
                percentage={overallAvgAttendance}
                isEmpty={totalStudents === 0 && overallAvgAttendance === 0}
                fontSize={13}
              />
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: '600',
                  color: '#0F172A',
                  marginTop: 8,
                  textAlign: 'center',
                }}
                numberOfLines={1}
              >
                Avg. attendance
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                All courses
              </Text>
            </View>

            {/* Box 4: Ring 2 - Held Classes vs Total Classes */}
            <View
              className="bg-white"
              style={[
                CARD_SHADOW,
                {
                  flex: 1,
                  backgroundColor: '#FFFFFF',
                  borderRadius: 20,
                  padding: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
            >
              <RingChart
                size={64}
                strokeWidth={8}
                percentage={heldClassesPct}
                isEmpty={totalClasses === 0}
                customColor="#3446D4"
                fontSize={13}
              />
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: '600',
                  color: '#0F172A',
                  marginTop: 8,
                  textAlign: 'center',
                }}
                numberOfLines={1}
              >
                Held vs total
              </Text>
              <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                {heldClasses} / {totalClasses} classes
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* SECTION 1: COURSES (horizontal scroll) */}
      <View style={{ marginTop: 22 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 18,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>
            Courses
          </Text>
          <Text style={{ fontSize: 12.5, color: '#64748B' }}>
            Swipe to see all
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={218}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 18, paddingVertical: 6, gap: 12 }}
        >
          {statsLoading && !stats ? (
            [1, 2].map((item) => (
              <View
                key={item}
                className="bg-white"
                style={[
                  CARD_SHADOW,
                  {
                    width: 206,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    padding: 16,
                    justifyContent: 'space-between',
                  },
                ]}
              >
                <Skeleton width={38} height={38} borderRadius={12} />
                <View style={{ marginTop: 12, gap: 6 }}>
                  <Skeleton width={110} height={18} borderRadius={5} />
                  <Skeleton width={135} height={13} borderRadius={4} />
                </View>
                <View style={{ marginTop: 14 }}>
                  <Skeleton width="100%" height={34} borderRadius={12} />
                </View>
              </View>
            ))
          ) : (
            courseBreakdown.map((course, idx) => {
            const theme = COURSE_ICON_THEMES[idx % COURSE_ICON_THEMES.length];
            const studentsCount = course.enrolled_students ?? 0;
            const teachersCount = course.teachers_count ?? 0;

            return (
              <TouchableOpacity
                key={course.id || idx}
                activeOpacity={0.85}
                onPress={() =>
                  handleNav('admin_courses', {
                    courseId: course.id,
                    courseCode: course.code,
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`${course.name}, view course`}
                className="bg-white"
                style={[
                  CARD_SHADOW,
                  {
                    width: 206,
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    padding: 16,
                  },
                ]}
              >
                {/* 1. Small rounded icon box (38px) */}
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    backgroundColor: theme.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}
                >
                  <GraduationCap size={19} color={theme.color} />
                </View>

                {/* 2. Course name */}
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: '#0F172A',
                  }}
                >
                  {course.code || course.name}
                </Text>

                {/* 3. One grey line */}
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12.5,
                    color: '#64748B',
                    marginTop: 4,
                    marginBottom: 14,
                  }}
                >
                  {studentsCount} students · {teachersCount} teachers
                </Text>

                {/* 4. Full-width button badge (36px high, 11px radius) */}
                <View
                  style={{
                    height: 36,
                    borderRadius: 11,
                    backgroundColor: '#ECEFFE',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: '#3446D4',
                    }}
                  >
                    View course →
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
          )}
        </ScrollView>
      </View>

      {/* SECTION 2: QUICK ACCESS */}
      <View style={{ paddingHorizontal: 18, marginTop: 22 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: '#0F172A',
            marginBottom: 12,
          }}
        >
          Quick access
        </Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Tile 1: Manage teachers */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleNav('users/teachers')}
            accessibilityRole="button"
            accessibilityLabel="Manage teachers"
            className="bg-white"
            style={[
              CARD_SHADOW,
              {
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                padding: 14,
                minHeight: 44,
              },
            ]}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: '#ECEFFE',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              <GraduationCap size={18} color="#3446D4" />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>
              Manage teachers
            </Text>
            <Text style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>
              View, edit, delete
            </Text>
          </TouchableOpacity>

          {/* Tile 2: Manage students */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleNav('users/students')}
            accessibilityRole="button"
            accessibilityLabel="Manage students"
            className="bg-white"
            style={[
              CARD_SHADOW,
              {
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                padding: 14,
                minHeight: 44,
              },
            ]}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: '#E1F5F2',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
              }}
            >
              <User size={18} color="#0E8F83" />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0F172A' }}>
              Manage students
            </Text>
            <Text style={{ fontSize: 12.5, color: '#64748B', marginTop: 3 }}>
              View, edit, delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SECTION 3: AVERAGE ATTENDANCE BY COURSE (ring charts) */}
      <View style={{ paddingHorizontal: 18, marginTop: 22 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '700',
            color: '#0F172A',
            marginBottom: 12,
          }}
        >
          Average attendance by course
        </Text>

        <View
          className="bg-white"
          style={[
            CARD_SHADOW,
            {
              backgroundColor: '#FFFFFF',
              borderRadius: 18,
              padding: 16,
            },
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              rowGap: 18,
            }}
          >
            {statsLoading && !stats ? (
              [1, 2, 3].map((item) => (
                <View
                  key={item}
                  style={{
                    width: '33.333%',
                    alignItems: 'center',
                    paddingHorizontal: 4,
                  }}
                >
                  <Skeleton width={74} height={74} borderRadius={37} />
                  <View style={{ marginTop: 8 }}>
                    <Skeleton width={56} height={12} borderRadius={4} />
                  </View>
                </View>
              ))
            ) : (
              courseBreakdown.map((course, idx) => {
                const hasStudents = (course.enrolled_students ?? 0) > 0;
                const avg = course.average_attendance ?? 0;
                return (
                  <View
                    key={course.id || idx}
                    style={{
                      width: '33.333%',
                      alignItems: 'center',
                      paddingHorizontal: 4,
                    }}
                  >
                    <RingChart
                      size={74}
                      strokeWidth={9}
                      percentage={avg}
                      isEmpty={!hasStudents}
                      fontSize={14}
                    />
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 12,
                        fontWeight: '700',
                        color: '#0F172A',
                        marginTop: 8,
                        textAlign: 'center',
                      }}
                    >
                      {course.code || course.name}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          <Text
            style={{
              fontSize: 12.5,
              color: '#64748B',
              textAlign: 'center',
              marginTop: 16,
            }}
          >
            Green is 75% or more, red is below 75%
          </Text>
        </View>
      </View>

      {/* 28px empty space at the bottom */}
      <View style={{ height: 28 }} />
    </ScrollView>
  );
}
