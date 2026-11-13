import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { Text } from '../../ui/text';
import { Badge } from '../../ui/badge';
import Icon from '../../ui/Icon';

export default function StudentCard({ student, onPress }) {
  const pct = student.attendance_percentage ?? 88;
  const isGood = pct >= 75;
  const isWarning = pct >= 65 && pct < 75;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress && onPress(student)}
      style={{
        padding: 14,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        elevation: 1,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      }}
    >
      <View className="flex-row items-center flex-1 mr-3">
        {/* Avatar / Photo */}
        <View className="w-11 h-11 rounded-2xl bg-primary/10 items-center justify-center overflow-hidden border border-primary/20 mr-3">
          {student.profile_image ? (
            <Image source={{ uri: student.profile_image }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <Text className="text-sm font-medium text-primary">
              {student.name?.charAt(0).toUpperCase() || 'S'}
            </Text>
          )}
        </View>

        {/* Student Details */}
        <View className="flex-1">
          <Text className="text-xs font-bold text-foreground" numberOfLines={1}>
            {student.name}
          </Text>
          <Text className="text-[11px] text-muted-foreground mt-0.5">
            Roll: {student.roll_number} • {student.course || 'MCA'} • {student.semester || student.semester_name || 'Semester 1'}
          </Text>

          {/* Quick attendance progress bar */}
          <View className="w-full h-1.5 bg-muted/60 rounded-full mt-2 overflow-hidden">
            <View
              style={{ width: `${Math.min(pct, 100)}%` }}
              className={`h-full rounded-full ${isGood ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-destructive'
                }`}
            />
          </View>
        </View>
      </View>

      {/* Attendance Percentage Badge */}
      <View className="items-end gap-1">
        <Badge
          variant={isGood ? 'success' : isWarning ? 'warning' : 'destructive'}
          className="px-2.5 py-0.5"
        >
          <Text className="text-xs font-medium">{pct}%</Text>
        </Badge>
        <Text className="text-[10px] text-muted-foreground font-semibold">
          {student.attended_classes || 0}/{student.total_classes || 0} Attended
        </Text>
      </View>
    </TouchableOpacity>
  );
}
