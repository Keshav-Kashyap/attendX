import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../text';
import { CheckCircle2, XCircle, MinusCircle, ChevronRight, History } from 'lucide-react-native';

export default function RecentClassesList({
  recentClasses = [],
  role = 'student',
  onViewAll,
  onPressItem,
}) {
  const isTeacher = role === 'teacher';

  if (!recentClasses || recentClasses.length === 0) {
    return (
      <View className="mb-8">
        <View className="flex-row items-center justify-between mb-2.5">
          <View className="flex-row items-center gap-2">
            <History size={16} color="#3B28CC" />
            <Text className="text-base font-medium text-slate-900">
              Recent Classes
            </Text>
          </View>
          <Text className="text-xs font-medium text-slate-500">
            0 Sessions
          </Text>
        </View>

        <View className="p-5 bg-white rounded-3xl border border-slate-100 items-center shadow-sm">
          <History size={22} color="#94a3b8" />
          <Text className="text-xs font-medium text-slate-900 mt-2">
            No Recent Classes Recorded
          </Text>
          <Text className="text-[11px] font-medium text-slate-500 mt-0.5 text-center">
            Attendance history will appear here once classes are conducted and marked.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-8">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center gap-2">
          <History size={16} color="#3B28CC" />
          <Text className="text-base font-medium text-slate-900">
            Recent Classes
          </Text>
        </View>
        {onViewAll ? (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onViewAll}
            className="flex-row items-center gap-0.5"
          >
            <Text className="text-xs font-medium text-[#3B28CC]">
              View History
            </Text>
            <ChevronRight size={14} color="#3B28CC" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Recent Class Items */}
      <View className="gap-2.5">
        {recentClasses.slice(0, 5).map((item, idx) => {
          const subjectCode = item.subject_code || item.course_code || '';
          const subjectName = item.subject_name || item.subject || 'Class Lecture';
          const rawDate = item.date || item.created_at;
          const dateStr =
            item.formatted_date ||
            (rawDate
              ? new Date(rawDate).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                })
              : 'Recent');
          const room = item.room || 'Room TBA';
          const RowWrapper = onPressItem ? TouchableOpacity : View;

          if (isTeacher) {
            const totalPresent = item.total_present ?? 0;
            const totalEnrolled = item.total_enrolled ?? 0;
            const rateNum =
              totalEnrolled > 0
                ? Math.round((totalPresent / totalEnrolled) * 100)
                : parseInt(item.attendance_rate, 10) || 0;
            const rateLabel = item.attendance_rate || `${rateNum}%`;
            const isHealthyRate = rateNum >= 75;
            const pillBgClass = isHealthyRate
              ? 'bg-emerald-50 border-emerald-200'
              : rateNum >= 50
                ? 'bg-amber-50 border-amber-200'
                : 'bg-red-50 border-red-200';
            const pillTextClass = isHealthyRate
              ? 'text-emerald-700'
              : rateNum >= 50
                ? 'text-amber-700'
                : 'text-red-600';

            return (
              <RowWrapper
                key={item.id || item.session_code || idx}
                {...(onPressItem ? { activeOpacity: 0.75, onPress: () => onPressItem(item) } : {})}
                className="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-sm flex-row items-center justify-between"
              >
                <View className="w-11 h-11 rounded-2xl items-center justify-center mr-3 bg-blue-50">
                  <CheckCircle2 size={20} color="#0066FF" />
                </View>

                <View className="flex-1 mr-2">
                  <Text className="text-sm font-medium text-slate-900" numberOfLines={1}>
                    {subjectName}
                    {subjectCode ? (
                      <Text className="text-xs font-medium text-slate-400">  {subjectCode}</Text>
                    ) : null}
                  </Text>

                  <Text className="text-xs font-medium text-slate-500 mt-0.5" numberOfLines={1}>
                    {dateStr} • {totalPresent}/{totalEnrolled} Present • {room}
                  </Text>
                </View>

                <View className={`px-2.5 py-1 rounded-full border ${pillBgClass}`}>
                  <Text className={`text-[11px] font-medium ${pillTextClass}`}>
                    {rateLabel}
                  </Text>
                </View>
              </RowWrapper>
            );
          }

          const normalizedStatus = (item.status || '').toLowerCase().trim();
          const isPresent = normalizedStatus === 'present';
          const isNotHeld =
            item.is_conducted === false ||
            normalizedStatus === 'class not held' ||
            normalizedStatus === 'not held' ||
            normalizedStatus === 'not_held';
          const timeStr = item.time || '';

          return (
            <RowWrapper
              key={item.id || item.session_code || idx}
              {...(onPressItem ? { activeOpacity: 0.75, onPress: () => onPressItem(item) } : {})}
              className="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-sm flex-row items-center justify-between"
            >
              <View
                className={`w-11 h-11 rounded-2xl items-center justify-center mr-3 ${
                  isPresent ? 'bg-emerald-50' : isNotHeld ? 'bg-slate-100' : 'bg-red-50'
                }`}
              >
                {isPresent ? (
                  <CheckCircle2 size={20} color="#10b981" />
                ) : isNotHeld ? (
                  <MinusCircle size={20} color="#64748b" />
                ) : (
                  <XCircle size={20} color="#ef4444" />
                )}
              </View>

              <View className="flex-1 mr-2">
                <Text className="text-sm font-medium text-slate-900" numberOfLines={1}>
                  {subjectName}
                  {subjectCode ? (
                    <Text className="text-xs font-medium text-slate-400">  {subjectCode}</Text>
                  ) : null}
                </Text>

                <Text className="text-xs font-medium text-slate-500 mt-0.5" numberOfLines={1}>
                  {dateStr}{timeStr ? ` • ${timeStr}` : ''} • {room}
                </Text>
              </View>

              <View
                className={`px-2.5 py-1 rounded-full border ${
                  isPresent
                    ? 'bg-emerald-50 border-emerald-200'
                    : isNotHeld
                      ? 'bg-slate-100 border-slate-200'
                      : 'bg-red-50 border-red-200'
                }`}
              >
                <Text
                  className={`text-[11px] font-medium ${
                    isPresent
                      ? 'text-emerald-700'
                      : isNotHeld
                        ? 'text-slate-600'
                        : 'text-red-600'
                  }`}
                >
                  {isPresent ? 'Present' : isNotHeld ? 'Class Not Held' : 'Absent'}
                </Text>
              </View>
            </RowWrapper>
          );
        })}
      </View>
    </View>
  );
}

