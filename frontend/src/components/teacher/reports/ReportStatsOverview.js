import React from 'react';
import { View } from 'react-native';
import { Text } from '../../ui/text';
import Icon from '../../ui/Icon';

export default function ReportStatsOverview({ summary }) {
  const avg = summary?.average_attendance ?? 89;
  const sessions = summary?.total_sessions ?? 36;
  const students = summary?.total_students_monitored ?? 45;
  const absentees = summary?.critical_absentees_count ?? 3;

  return (
    <View className="flex-row flex-wrap gap-2.5 mb-5">
      {/* 1. Average Attendance */}
      <View className="flex-1 min-w-[46%] p-3.5 bg-card border border-border/80 rounded-2xl shadow-sm">
        <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center mb-1.5">
          <Icon name="bar-chart" size={16} color="#0284c7" />
        </View>
        <Text className="text-2xl font-medium text-foreground">{avg}%</Text>
        <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
          Avg Attendance
        </Text>
      </View>

      {/* 2. Total Sessions */}
      <View className="flex-1 min-w-[46%] p-3.5 bg-card border border-border/80 rounded-2xl shadow-sm">
        <View className="w-8 h-8 rounded-xl bg-purple-500/10 items-center justify-center mb-1.5">
          <Icon name="clipboard" size={16} color="#8b5cf6" />
        </View>
        <Text className="text-2xl font-medium text-foreground">{sessions}</Text>
        <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
          Conducted Sessions
        </Text>
      </View>

      {/* 3. Students Monitored */}
      <View className="flex-1 min-w-[46%] p-3.5 bg-card border border-border/80 rounded-2xl shadow-sm">
        <View className="w-8 h-8 rounded-xl bg-emerald-500/10 items-center justify-center mb-1.5">
          <Icon name="people" size={16} color="#10b981" />
        </View>
        <Text className="text-2xl font-medium text-foreground">{students}</Text>
        <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
          Active Students
        </Text>
      </View>

      {/* 4. Critical Absentees */}
      <View className="flex-1 min-w-[46%] p-3.5 bg-card border border-destructive/30 rounded-2xl shadow-sm">
        <View className="w-8 h-8 rounded-xl bg-destructive/10 items-center justify-center mb-1.5">
          <Icon name="warning" size={16} color="#ef4444" />
        </View>
        <Text className="text-2xl font-medium text-destructive">{absentees}</Text>
        <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
          Below 75% Alert
        </Text>
      </View>
    </View>
  );
}
