import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import {
  ArrowLeftRight,
  Plus,
  Users,
  ChevronRight,
  Trash2,
} from 'lucide-react-native';
import { Text } from '../../ui/text';

export default function ControlsTab({
  course,
  onAssignFaculty,
  onAddSubject,
  onEnrollBatch,
  onDeleteCourse,
}) {
  if (!course) return null;

  const controlItems = [
    {
      key: 'assign',
      title: 'Faculty Allocations',
      subtitle: 'Assign teachers to individual subjects',
      icon: <ArrowLeftRight size={15} color="#007AFF" />,
      onPress: onAssignFaculty,
    },
    {
      key: 'add',
      title: 'Add New Subject',
      subtitle: 'Append topic or module to curriculum',
      icon: <Plus size={16} color="#007AFF" />,
      onPress: onAddSubject,
    },
    {
      key: 'enroll',
      title: 'Batch Student Enrollment',
      subtitle: 'Bulk enroll batch into this course',
      icon: <Users size={15} color="#007AFF" />,
      onPress: onEnrollBatch,
    },
  ];

  return (
    <View className="mx-4 gap-3.5">
      <View className="bg-white rounded-3xl p-4 border border-slate-200/70 shadow-sm">
        <Text className="text-base font-medium text-slate-900 mb-0.5">Course Configuration</Text>
        <Text className="text-xs font-medium text-slate-500 mb-3">
          Manage faculty allocations, curriculum modules, and enrollments.
        </Text>

        <View className="border-t border-slate-100">
          {controlItems.map((item, idx) => (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.7}
              onPress={item.onPress}
              className={`py-3 flex-row items-center justify-between ${
                idx !== controlItems.length - 1 ? 'border-b border-slate-100' : ''
              }`}
            >
              <View className="flex-row items-center gap-3 flex-1 mr-2">
                <View className="w-8 h-8 rounded-xl bg-[#007AFF]/10 items-center justify-center">
                  {item.icon}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-slate-900">{item.title}</Text>
                  <Text className="text-[11px] font-medium text-slate-500">{item.subtitle}</Text>
                </View>
              </View>
              <ChevronRight size={16} color="#cbd5e1" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Danger Zone */}
      <View className="bg-white rounded-3xl p-4 border border-red-200/70 shadow-sm mb-4">
        <Text className="text-[11px] font-medium text-red-500 uppercase tracking-wider mb-2.5">
          Danger Zone
        </Text>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onDeleteCourse?.(course.id, course.code)}
          className="flex-row items-center justify-between"
        >
          <View className="flex-row items-center gap-3 flex-1 mr-2">
            <View className="w-8 h-8 rounded-xl bg-red-50 items-center justify-center">
              <Trash2 size={15} color="#ef4444" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-red-600">Delete This Course</Text>
              <Text className="text-[11px] font-medium text-slate-500">
                Permanently removes course and schedule links
              </Text>
            </View>
          </View>
          <View className="bg-red-50 border border-red-200 px-3 py-1 rounded-full">
            <Text className="text-xs font-medium text-red-600">Delete</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
