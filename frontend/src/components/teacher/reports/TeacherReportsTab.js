import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Text } from '../../ui/text';
import Icon from '../../ui/Icon';
import ReportStatsOverview from './ReportStatsOverview';
import AttendanceTrendsChart from './AttendanceTrendsChart';
import SubjectWiseReportList from './SubjectWiseReportList';
import AbsentStudentsList from './AbsentStudentsList';
import ExportReportModal from './ExportReportModal';
import { useTeacherReports } from '../../../hooks/useTeacher';

export default function TeacherReportsTab({ user }) {
  const { data: reportsData, isLoading, refetch } = useTeacherReports();
  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <ScrollView
      className="flex-1 px-4 pt-3 pb-8"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#0284c7" />
      }
    >
      {/* Top Action Bar with Export Button */}
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-base font-medium text-foreground">
            Attendance Reports & Analytics
          </Text>
          <Text className="text-xs text-muted-foreground mt-0.5">
            Real-time classroom statistics and export
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowExportModal(true)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: '#0284c7',
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            elevation: 1,
            shadowColor: '#0284c7',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.15,
            shadowRadius: 2,
          }}
        >
          <Icon name="bar-chart" size={14} color="#ffffff" />
          <Text className="text-xs font-bold text-white">Export</Text>
        </TouchableOpacity>
      </View>

      {/* 1. High Level Summary KPIs */}
      <ReportStatsOverview summary={reportsData?.summary} />

      {/* 2. Daily & Monthly Attendance Trends */}
      <AttendanceTrendsChart dailyTrends={reportsData?.daily_trends} />

      {/* 3. Subject-wise Breakdown */}
      <SubjectWiseReportList subjectReports={reportsData?.subject_reports} />

      {/* 4. Critical Absentees Below 75% */}
      <AbsentStudentsList absentStudents={reportsData?.absent_students} />

      {/* 5. Export Report Modal */}
      <ExportReportModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        reportsData={reportsData}
      />
    </ScrollView>
  );
}
