import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../text';
import {
  Calendar,
  CalendarClock,
  ChevronRight,
  BookOpen,
} from 'lucide-react-native';

export default function UpcomingClassesList({
  classes = [],
  upcomingClasses = [],
  upcomingDayLabel = '',
  nextClass = null,
  role = 'student',
  isError = false,
  error = null,
  onRetry = null,
  onPressClass = null,
}) {
  const isTeacher = role === 'teacher';

  if (isError) {
    return (
      <View className="mb-6">
        <View className="flex-row items-center gap-2 mb-2.5">
          <CalendarClock size={16} color="#3B28CC" />
          <Text className="text-base font-medium text-slate-900">
            Upcoming Classes
          </Text>
        </View>
        <View className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <Text className="text-xs font-medium text-red-500">
            Failed to load class schedule
          </Text>
          <Text className="text-[11px] font-medium text-slate-500 mt-0.5">
            {error?.message || 'Server error while fetching classes.'}
          </Text>
          {onRetry ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onRetry}
              className="mt-2 bg-red-500 py-1.5 px-3 rounded-lg self-start"
            >
              <Text className="text-[11px] font-medium text-white">Retry</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  }

  let displayClasses = [];
  let sectionTitle = 'Upcoming Classes';
  let countLabel = '0 Sessions';

  if (isTeacher) {
    const showingToday = Array.isArray(classes) && classes.length > 0;
    displayClasses = showingToday
      ? classes
      : Array.isArray(upcomingClasses)
        ? upcomingClasses
        : [];
    if (showingToday) {
      sectionTitle = 'Upcoming Classes';
      countLabel = `${displayClasses.length} ${displayClasses.length === 1 ? 'Session' : 'Sessions'} Today`;
    } else if (displayClasses.length > 0) {
      sectionTitle =
        upcomingDayLabel === 'Tomorrow'
          ? "Tomorrow's Classes"
          : upcomingDayLabel
            ? `Upcoming • ${upcomingDayLabel}`
            : 'Upcoming Classes';
      countLabel = `${displayClasses.length} ${displayClasses.length === 1 ? 'Session' : 'Sessions'}`;
    } else {
      sectionTitle = 'Upcoming Classes';
      countLabel = '0 Sessions';
    }
  } else {
    const upcomingOnly = (classes || []).filter((c) => c.status !== 'Completed');
    displayClasses = nextClass
      ? upcomingOnly.filter(
          (c) => !(c.subject_id === nextClass.subject_id && c.time === nextClass.time)
        )
      : upcomingOnly;
    const isFutureDayList =
      displayClasses.length > 0 &&
      displayClasses.every((c) => (c.status || '').startsWith('Scheduled'));
    const futureDay = isFutureDayList ? displayClasses[0]?.day_name : '';
    sectionTitle = futureDay ? `Upcoming • ${futureDay}` : 'Upcoming Classes';
    countLabel = isFutureDayList
      ? `${displayClasses.length} ${displayClasses.length === 1 ? 'Session' : 'Sessions'}`
      : `${displayClasses.length} ${displayClasses.length === 1 ? 'Session' : 'Sessions'} Remaining`;
  }

  const hasNoSourceClasses = isTeacher
    ? displayClasses.length === 0
    : !classes || classes.length === 0;

  if (hasNoSourceClasses) {
    return (
      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-2.5">
          <View className="flex-row items-center gap-2">
            <CalendarClock size={16} color="#3B28CC" />
            <Text className="text-base font-medium text-slate-900">
              Upcoming Classes
            </Text>
          </View>
          <Text className="text-xs font-medium text-slate-500">
            0 Sessions
          </Text>
        </View>

        <View className="p-5 bg-white rounded-3xl border border-slate-100 items-center shadow-sm">
          <Calendar size={22} color="#94a3b8" />
          <Text className="text-xs font-medium text-slate-900 mt-2">
            No Sessions Scheduled Today
          </Text>
          <Text className="text-[11px] font-medium text-slate-500 mt-0.5 text-center">
            {isTeacher
              ? 'No assigned class periods were found on your timetable yet.'
              : 'There are no assigned class periods on your timetable for today.'}
          </Text>
        </View>
      </View>
    );
  }

  const showingTodayForTeacher = isTeacher && Array.isArray(classes) && classes.length > 0;

  return (
    <View className="mb-6">
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center gap-2">
          <CalendarClock size={16} color="#3B28CC" />
          <Text className="text-base font-medium text-slate-900">
            {sectionTitle}
          </Text>
        </View>
        <Text className="text-xs font-medium text-slate-500">
          {countLabel}
        </Text>
      </View>

      {displayClasses.length === 0 ? (
        <View className="p-4 bg-white rounded-2xl border border-slate-100 items-center shadow-sm">
          <Text className="text-xs font-medium text-slate-500">
            No additional sessions remaining today
          </Text>
        </View>
      ) : (
        <View className="gap-2.5">
          {displayClasses.map((item, idx) => {
            const subjectCode = item.subject_code || item.code || '';
            const subjectName = item.subject_name || item.subjectName || 'Lecture';
            const timeStr = item.displayTime || item.time || 'Schedule TBA';
            const room = item.room || 'Room TBA';
            const RowWrapper = onPressClass ? TouchableOpacity : View;

            const dayTag = item.nextDayLabel || item.day_name || item.daysLabel || '';
            const isFutureStudentItem =
              !isTeacher && (item.status || '').startsWith('Scheduled') && item.day_name;
            const subtitleText = isTeacher
              ? showingTodayForTeacher
                ? `${timeStr} • ${room}${typeof item.studentsCount === 'number' ? ` • ${item.studentsCount} Students` : ''}`
                : `${dayTag ? `${dayTag} • ` : ''}${timeStr} • ${room}${typeof item.studentsCount === 'number' ? ` • ${item.studentsCount} Students` : ''}`
              : isFutureStudentItem
                ? `${item.day_name} • ${timeStr} • ${room}`
                : `${timeStr} • ${room}`;

            return (
              <RowWrapper
                key={`${item.subject_id || item.subjectId || subjectCode || idx}-${idx}`}
                {...(onPressClass ? { activeOpacity: 0.75, onPress: () => onPressClass(item) } : {})}
                className="bg-white rounded-2xl border border-slate-100 p-3.5 shadow-sm flex-row items-center justify-between"
              >
                <View className="w-11 h-11 rounded-2xl bg-slate-100 items-center justify-center mr-3">
                  <BookOpen size={18} color="#475569" />
                </View>

                <View className="flex-1 mr-2">
                  <Text className="text-sm font-medium text-slate-900" numberOfLines={1}>
                    {subjectName}
                    {subjectCode ? (
                      <Text className="text-xs font-medium text-slate-400">  {subjectCode}</Text>
                    ) : null}
                  </Text>
                  <Text className="text-xs font-medium text-slate-500 mt-0.5" numberOfLines={1}>
                    {subtitleText}
                  </Text>
                </View>

                {isTeacher && item.isCompletedToday ? (
                  <View className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 mr-1">
                    <Text className="text-[10px] font-medium text-emerald-700">Done</Text>
                  </View>
                ) : isTeacher && item.isLiveNow ? (
                  <View className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 mr-1">
                    <Text className="text-[10px] font-medium text-[#0066FF]">Live</Text>
                  </View>
                ) : null}

                <ChevronRight size={16} color="#94a3b8" />
              </RowWrapper>
            );
          })}
        </View>
      )}
    </View>
  );
}

