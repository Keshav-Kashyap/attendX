import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Calendar, Building2, User, Clock, Plus } from 'lucide-react-native';
import { Text } from '../../ui/text';
import { Skeleton } from '../../ui/Skeleton';

export default function ScheduleTab({
  course,
  subjects = [],
  isLoading = false,
  activeSemester = '',
  onAddSubject,
}) {
  const scheduledItems = subjects.filter((s) => s.schedule || s.room);

  return (
    <View className="mx-4">
      <View className="bg-white rounded-3xl p-4 border border-slate-200/70 shadow-sm mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1 mr-2">
            <Text className="text-base font-medium text-slate-900">
              Lecture Timetable {activeSemester ? `• ${activeSemester}` : ''}
            </Text>
            <Text className="text-xs font-medium text-slate-500 mt-0.5">
              Allocated rooms and class schedules for {course?.code}
            </Text>
          </View>
          <View className="w-8 h-8 rounded-full bg-[#007AFF]/10 items-center justify-center">
            <Calendar size={16} color="#007AFF" />
          </View>
        </View>

        {isLoading ? (
          <View className="gap-3">
            {[1, 2].map((k) => (
              <View key={k} className="bg-slate-50 rounded-2xl p-3.5 gap-2">
                <Skeleton width="65%" height={14} borderRadius={4} />
                <Skeleton width="40%" height={11} borderRadius={4} />
                <Skeleton width="85%" height={12} borderRadius={4} />
              </View>
            ))}
          </View>
        ) : scheduledItems.length > 0 ? (
          <View className="border-t border-slate-100">
            {scheduledItems.map((sub, idx) => {
              const assignedTeacher =
                sub.assigned_teachers?.[0]?.teacher_name ||
                sub.teacher_name ||
                'Unassigned Faculty';

              return (
                <View
                  key={sub.id || idx}
                  className={`py-3.5 ${
                    idx !== scheduledItems.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 mr-2">
                      <Text className="text-sm font-medium text-slate-900 leading-tight">
                        {sub.name}
                      </Text>
                      <Text className="text-[11px] font-medium text-[#007AFF] mt-0.5">
                        {sub.code}
                      </Text>
                    </View>
                    {sub.room ? (
                      <View className="bg-slate-100 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                        <Building2 size={11} color="#475569" />
                        <Text className="text-[10px] font-medium text-slate-700">
                          {sub.room}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1.5 flex-1 mr-2">
                      <Clock size={12} color="#94a3b8" />
                      <Text className="text-xs font-medium text-slate-500" numberOfLines={1}>
                        {sub.schedule || 'Schedule Not Set'}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-1">
                      <User size={12} color="#94a3b8" />
                      <Text className="text-xs font-medium text-slate-500" numberOfLines={1}>
                        {assignedTeacher}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="py-6 items-center text-center">
            <Calendar size={30} color="#cbd5e1" />
            <Text className="text-sm font-medium text-slate-800 mt-2">
              No Schedules Configured
            </Text>
            <Text className="text-xs font-medium text-slate-500 text-center mt-1 mb-3">
              Add class timings and room locations to {activeSemester || 'this semester'} subjects.
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onAddSubject}
              className="bg-[#007AFF] px-4 py-2 rounded-full flex-row items-center gap-1.5"
            >
              <Plus size={14} color="#ffffff" strokeWidth={2.4} />
              <Text className="text-xs font-medium text-white">Add Subject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
