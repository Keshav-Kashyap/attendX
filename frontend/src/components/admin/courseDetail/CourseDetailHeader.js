import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { ArrowLeft, Pin, Share2 } from 'lucide-react-native';
import { Text } from '../../ui/text';

export default function CourseDetailHeader({
  courseCode = 'Course',
  semesterName = '',
  onBack,
  isPinned = false,
  onTogglePin,
  onShare,
}) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      {/* Back Button with Courses / Code / Semester breadcrumb */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onBack}
        className="flex-row items-center gap-2 flex-1 mr-3"
      >
        <View className="w-8 h-8 rounded-full bg-white border border-slate-200/70 items-center justify-center shadow-xs">
          <ArrowLeft size={16} color="#007AFF" strokeWidth={2.2} />
        </View>
        <Text className="text-sm font-semibold text-slate-800" numberOfLines={1}>
          {semesterName || courseCode}
        </Text>
      </TouchableOpacity>

      {/* Right Actions: Pin & Share */}
      <View className="flex-row items-center gap-2">
        {onTogglePin && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onTogglePin}
            className={`w-8 h-8 rounded-full items-center justify-center border ${
              isPinned
                ? 'bg-[#007AFF]/10 border-[#007AFF]/20'
                : 'bg-white border-slate-200/70'
            }`}
          >
            <Pin
              size={14}
              color={isPinned ? '#007AFF' : '#64748b'}
              strokeWidth={2}
              fill={isPinned ? '#007AFF' : 'none'}
            />
          </TouchableOpacity>
        )}

        {onShare && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onShare}
            className="w-8 h-8 rounded-full bg-white border border-slate-200/70 items-center justify-center"
          >
            <Share2 size={14} color="#64748b" strokeWidth={2} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
