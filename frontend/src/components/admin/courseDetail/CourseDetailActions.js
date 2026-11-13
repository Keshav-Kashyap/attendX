import React from 'react';
import { ScrollView, TouchableOpacity } from 'react-native';
import { Plus, ArrowLeftRight, Download } from 'lucide-react-native';
import { Text } from '../../ui/text';

export default function CourseDetailActions({
  onAddSubject,
  onReassignFaculty,
  onExport,
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="px-4 mb-3.5"
      contentContainerStyle={{ gap: 8, paddingRight: 20 }}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onAddSubject}
        className="bg-[#007AFF] px-4 py-2 rounded-full flex-row items-center gap-1.5 shadow-sm"
      >
        <Plus size={15} color="#ffffff" strokeWidth={2.4} />
        <Text className="text-xs font-medium text-white">Add Subject</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onReassignFaculty}
        className="bg-white border border-slate-200/70 px-3.5 py-2 rounded-full flex-row items-center gap-1.5"
      >
        <ArrowLeftRight size={14} color="#007AFF" strokeWidth={2} />
        <Text className="text-xs font-medium text-slate-700">Reassign Faculty</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onExport}
        className="bg-white border border-slate-200/70 px-3.5 py-2 rounded-full flex-row items-center gap-1.5"
      >
        <Download size={14} color="#64748b" strokeWidth={2} />
        <Text className="text-xs font-medium text-slate-700">Export</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
