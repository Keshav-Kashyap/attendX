import React from 'react';
import { View } from 'react-native';
import { Text } from '../../ui/text';
import { Badge } from '../../ui/badge';
import Icon from '../../ui/Icon';

export default function AbsentStudentsList({ absentStudents = [] }) {
  const list = absentStudents && absentStudents.length > 0 ? absentStudents : [
    { name: 'Karan Mehra', roll_number: 'MCA-2024-005', course: 'Integrated MCA', attendance_percentage: 62, missed_classes: 6, status: 'Critical' },
    { name: 'Rohan Gupta', roll_number: 'MCA-2024-032', course: 'Integrated MCA', attendance_percentage: 67, missed_classes: 5, status: 'Warning' },
    { name: 'Simran Kaur', roll_number: 'MCA-2024-008', course: 'Integrated MCA', attendance_percentage: 71, missed_classes: 4, status: 'Warning' },
  ];

  return (
    <View className="bg-card border border-destructive/30 rounded-2xl p-4 shadow-sm mb-5">
      <View className="flex-row items-center justify-between pb-3 border-b border-border/60 mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-6 h-6 rounded-lg bg-destructive/15 items-center justify-center">
            <Icon name="warning" size={14} color="#ef4444" />
          </View>
          <View>
            <Text className="text-sm font-medium text-foreground">
              Critical & Absent Students List
            </Text>
            <Text className="text-[11px] text-muted-foreground mt-0.5">
              Students falling below the 75% examination threshold
            </Text>
          </View>
        </View>

        <Badge variant="destructive" className="px-2 py-0.5">
          <Text className="text-[10px] font-bold">{list.length} Alerts</Text>
        </Badge>
      </View>

      <View className="gap-2.5">
        {list.map((item, idx) => (
          <View
            key={idx}
            className="p-3 bg-muted/40 rounded-xl border border-destructive/20 flex-row items-center justify-between"
          >
            <View className="flex-1 mr-2">
              <Text className="text-xs font-bold text-foreground">
                {item.name}
              </Text>
              <Text className="text-[10px] text-muted-foreground mt-0.5">
                Roll: {item.roll_number} • {item.course}
              </Text>
            </View>

            <View className="items-end gap-1">
              <Badge
                variant={item.status === 'Critical' ? 'destructive' : 'warning'}
                className="px-2 py-0.5"
              >
                <Text className="text-[10px] font-medium">{item.attendance_percentage}%</Text>
              </Badge>
              <Text className="text-[10px] text-destructive font-semibold">
                {item.missed_classes || 4} Missed
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
