import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../../ui/text';

export default function CourseDetailTabs({
  activeTab = 'curriculum',
  onTabChange,
  studentCount = 0,
}) {
  const tabs = [
    { id: 'curriculum', label: 'Curriculum' },
    { id: 'students', label: `Students (${studentCount})` },
    { id: 'schedule', label: 'Schedule' },
    { id: 'controls', label: 'Controls' },
  ];

  return (
    <View className="mx-4 mb-4 bg-slate-200/70 p-1 rounded-2xl flex-row items-center">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            activeOpacity={0.75}
            onPress={() => onTabChange?.(tab.id)}
            className={`flex-1 py-2 rounded-xl items-center justify-center ${
              isActive ? 'bg-white shadow-sm' : ''
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                isActive ? 'text-slate-900' : 'text-slate-500'
              }`}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
