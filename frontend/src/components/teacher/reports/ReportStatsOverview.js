import React from 'react';
import { View } from 'react-native';
import { Text } from '../../ui/text';
import Icon from '../../ui/Icon';

const CARD_SHADOW = {
  shadowColor: '#0f172a',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.06,
  shadowRadius: 12,
  elevation: 3,
};

export default function ReportStatsOverview({ summary }) {
  const avg = summary?.average_attendance ?? 0;
  const sessions = summary?.total_sessions ?? 0;
  const students = summary?.total_students_monitored ?? 0;
  const absentees = summary?.critical_absentees_count ?? 0;

  return (
    <View className="gap-3 mb-5">
      {/* Row 1: Avg Attendance & Conducted Sessions */}
      <View className="flex-row gap-3">
        <View
          style={CARD_SHADOW}
          className="flex-1 bg-white rounded-[22px] p-4 border border-slate-100 justify-between"
        >
          <View className="w-10 h-10 rounded-xl bg-[#ECEFFE] items-center justify-center mb-3">
            <Icon name="bar-chart" size={19} color="#3446D4" />
          </View>
          <Text className="text-[24px] font-semibold text-slate-900 tracking-tight leading-tight">
            {avg}%
          </Text>
          <Text className="text-[13px] font-normal text-slate-500 mt-0.5">
            Avg Attendance
          </Text>
        </View>

        <View
          style={CARD_SHADOW}
          className="flex-1 bg-white rounded-[22px] p-4 border border-slate-100 justify-between"
        >
          <View className="w-10 h-10 rounded-xl bg-[#EDE9FE] items-center justify-center mb-3">
            <Icon name="clipboard" size={19} color="#7C3AED" />
          </View>
          <Text className="text-[24px] font-semibold text-slate-900 tracking-tight leading-tight">
            {sessions}
          </Text>
          <Text className="text-[13px] font-normal text-slate-500 mt-0.5">
            Conducted Sessions
          </Text>
        </View>
      </View>

      {/* Row 2: Active Students & Below 75% Alert */}
      <View className="flex-row gap-3">
        <View
          style={CARD_SHADOW}
          className="flex-1 bg-white rounded-[22px] p-4 border border-slate-100 justify-between"
        >
          <View className="w-10 h-10 rounded-xl bg-[#E1F5F2] items-center justify-center mb-3">
            <Icon name="people" size={19} color="#0E8F83" />
          </View>
          <Text className="text-[24px] font-semibold text-slate-900 tracking-tight leading-tight">
            {students}
          </Text>
          <Text className="text-[13px] font-normal text-slate-500 mt-0.5">
            Active Students
          </Text>
        </View>

        <View
          style={CARD_SHADOW}
          className="flex-1 bg-white rounded-[22px] p-4 border border-slate-100 justify-between"
        >
          <View className="w-10 h-10 rounded-xl bg-[#FEE2E2] items-center justify-center mb-3">
            <Icon name="warning" size={19} color="#DC2626" />
          </View>
          <Text className="text-[24px] font-semibold text-[#DC2626] tracking-tight leading-tight">
            {absentees}
          </Text>
          <Text className="text-[13px] font-normal text-slate-500 mt-0.5">
            Below 75% Alert
          </Text>
        </View>
      </View>
    </View>
  );
}
