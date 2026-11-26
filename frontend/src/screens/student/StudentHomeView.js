import React from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Text } from '../../components/ui/text';
import Welcome from '../../components/ui/common/Welcome';
import {
  StudentAttendanceProgress,
  StudentNextClassCard,
  StudentUpcomingClassesList,
  StudentRecentClassesList,
  StudentHomeSkeleton,
  StudentEmptyState,
} from '../../components/student';
import { useStudentDashboard } from '../../hooks/useStudent';
import { AlertCircle, RefreshCw } from 'lucide-react-native';

export default function StudentHomeView({ user, onNavigate }) {
  const {
    data: dashboardData,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useStudentDashboard();

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

  const summary = dashboardData?.summary;
  const nextClass = dashboardData?.next_class;
  const upcomingClasses = dashboardData?.upcoming_classes || [];
  const recentClasses = dashboardData?.recent_classes || [];

  return (
    <ScrollView
      className="flex-1 bg-[#F5F6FA]"
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          colors={['#3446D4']}
          tintColor="#3446D4"
        />
      }
    >
      {/* Top Greeting Banner */}
      <Welcome
        user={user}
        role="student"
      />

      <View className="px-5 -mt-8">

      {/* Loading Skeleton State */}
      {isLoading ? (
        <StudentHomeSkeleton />
      ) : isError ? (
        /* Error State with Retry */
        <View
          style={{
            padding: 20,
            backgroundColor: '#fef2f2',
            borderWidth: 1,
            borderColor: '#fecaca',
            borderRadius: 20,
            alignItems: 'center',
            marginVertical: 10,
          }}
        >
          <AlertCircle size={32} color="#dc2626" />
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#dc2626', marginTop: 8 }}>
            Unable to Load Dashboard
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4, maxWidth: 280 }}>
            {error?.message || 'Could not fetch attendance records from server. Please check connection.'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => refetch()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: 12,
              backgroundColor: '#dc2626',
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 12,
            }}
          >
            <RefreshCw size={14} color="#ffffff" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#ffffff' }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Real Dashboard Content */
        <View>
          {/* 1. Overall Attendance Circular Progress Bar & Attended / Total Ratio */}
          <StudentAttendanceProgress
            summary={summary}
            onViewDetails={() => handleNav('history')}
          />

          {/* 2. Next Upcoming Class Card */}
          <StudentNextClassCard nextClass={nextClass} />

          {/* 3. Today's Upcoming Classes / Schedule */}
          <StudentUpcomingClassesList classes={upcomingClasses} />

          {/* 4. Recent Classes Conducted (Past sessions marked) */}
          <StudentRecentClassesList
            recentClasses={recentClasses}
            onViewAll={() => handleNav('history')}
          />
        </View>
      )}
      </View>
    </ScrollView>
  );
}
