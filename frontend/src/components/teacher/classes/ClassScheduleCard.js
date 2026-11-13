import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../../ui/text';
import { Badge } from '../../ui/badge';
import Icon from '../../ui/Icon';

export default function ClassScheduleCard({ scheduleItem, onStartAttendance, onViewStudents }) {
  return (
    <View className="p-4 bg-card border border-border/80 rounded-2xl shadow-sm mb-3">
      {/* Top row: Timing pill and Room badge */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-1.5">
          <Icon name="time" size={14} color="#0284c7" />
          <Text className="text-xs font-bold text-primary">
            {scheduleItem.time || '10:00–11:00 AM'}
          </Text>
        </View>

        <Badge variant="outline" className="px-2 py-0.5 bg-muted/60">
          <Text className="text-[10px] font-bold text-foreground">
            {scheduleItem.room || 'Block B, Hall 3'}
          </Text>
        </Badge>
      </View>

      {/* Subject and Course */}
      <Text className="text-base font-medium text-foreground">
        {scheduleItem.subjectName}
      </Text>

      <Text className="text-xs text-muted-foreground mt-0.5">
        {scheduleItem.courseCode || scheduleItem.courseName} • {
          typeof scheduleItem.semester === 'object'
            ? (scheduleItem.semester?.name || `Semester ${scheduleItem.semester?.number || 1}`)
            : (String(scheduleItem.semester || '').toLowerCase().includes('semester')
              ? scheduleItem.semester
              : `Semester ${scheduleItem.semester || '1'}`)
        }
      </Text>

      {/* Meta Row: Students & Actions */}
      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-border/60">
        <TouchableOpacity
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => onViewStudents && onViewStudents(scheduleItem)}
          className="flex-row items-center gap-1.5 py-1"
        >
          <Icon name="people" size={14} color="#64748b" />
          <Text className="text-xs font-semibold text-primary underline">
            {scheduleItem.studentsCount || 42} Assigned Students
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => onStartAttendance && onStartAttendance(scheduleItem)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            backgroundColor: 'rgba(2, 132, 199, 0.12)',
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(2, 132, 199, 0.25)',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Icon name="scan" size={12} color="#0284c7" />
          <Text className="text-xs font-bold text-primary">Take Attendance</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
