import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../text';
import { Skeleton } from '../Skeleton';
import {
  Calendar,
  Clock,
  User,
  Users,
  DoorOpen,
  BookOpen,
  Camera,
} from 'lucide-react-native';

function getCountdownSuffix(nextClass, isUpcomingToday) {
  if (!nextClass || !isUpcomingToday) return '';
  const rawStart =
    nextClass.start_time_str ||
    (nextClass.displayTime || nextClass.time || '').split('-')[0].trim();
  const match = rawStart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return '';

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  const now = new Date();
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);

  const diffMins = Math.round((target.getTime() - now.getTime()) / 60000);
  if (diffMins <= 0) return '';
  if (diffMins < 60) return ` (in ${diffMins} ${diffMins === 1 ? 'min' : 'mins'})`;
  const hrs = Math.floor(diffMins / 60);
  const rem = diffMins % 60;
  return rem > 0 ? ` (in ${hrs}h ${rem}m)` : ` (in ${hrs}h)`;
}

export default function NextClassCard({
  nextClass,
  role = 'student',
  isLoading = false,
  onPressSyllabus,
  onStartAttendance,
}) {
  const isTeacher = role === 'teacher';

  if (isLoading) {
    return (
      <View className="mb-5">
        <View className="flex-row items-center justify-between mb-2.5">
          <Skeleton width={110} height={18} borderRadius={6} />
          <Skeleton width={80} height={14} borderRadius={6} />
        </View>
        <View className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm gap-3">
          <View className="flex-row justify-between items-center">
            <Skeleton width={70} height={24} borderRadius={12} />
            <Skeleton width={110} height={24} borderRadius={12} />
          </View>
          <Skeleton width="72%" height={22} borderRadius={6} />
          <View className="flex-row gap-2">
            <Skeleton width={135} height={30} borderRadius={10} />
            <Skeleton width={95} height={30} borderRadius={10} />
          </View>
          <Skeleton width="100%" height={40} borderRadius={14} />
        </View>
      </View>
    );
  }

  if (!nextClass) {
    return (
      <View className="mb-5">
        <View className="flex-row items-center justify-between mb-2.5">
          <View className="flex-row items-center gap-2">
            <Clock size={16} color="#3B28CC" />
            <Text className="text-base font-medium text-slate-900">
              Up Next
            </Text>
          </View>
          <Text className="text-xs font-medium text-slate-400">
            No Sessions
          </Text>
        </View>

        <View className="p-5 bg-white rounded-3xl border border-slate-100 items-center justify-center shadow-sm">
          <View className="w-11 h-11 rounded-full bg-slate-100 items-center justify-center mb-2">
            <Calendar size={20} color="#94a3b8" />
          </View>
          <Text className="text-sm font-medium text-slate-900">
            No Classes Scheduled
          </Text>
          <Text className="text-xs font-medium text-slate-500 mt-0.5 text-center">
            {isTeacher
              ? 'You have no upcoming class sessions assigned yet.'
              : 'You have no pending or upcoming class sessions allocated for today.'}
          </Text>
        </View>
      </View>
    );
  }

  const courseCode = nextClass.course_code || nextClass.courseCode || '';
  const courseName = nextClass.course_name || nextClass.courseName || '';
  const subjectCode = nextClass.subject_code || nextClass.code || '';
  const subjectName = nextClass.subject_name || nextClass.subjectName || 'Class Lecture';
  const semesterStr = nextClass.semester || nextClass.subject?.semester || '';
  const sectionStr = nextClass.sectionName || nextClass.subject?.section_name || '';

  const timeStr = nextClass.displayTime || nextClass.time || 'Schedule TBA';
  const timeParts = timeStr.split(/[-–]/).map((p) => p.trim()).filter(Boolean);
  const startTimeStr = nextClass.start_time_str || timeParts[0] || '';
  const endTimeStr = nextClass.end_time_str || (timeParts.length > 1 ? timeParts[1] : '');
  const hasValidTime = startTimeStr && startTimeStr !== 'Schedule TBA';

  const roomStr = nextClass.room || 'Room TBA';
  const teacherName = nextClass.teacher_name || nextClass.teacherName || 'Faculty';
  const enrolledCount = nextClass.studentsCount ?? nextClass.course?.enrolled_students_count ?? 0;

  const statusLabel = nextClass.status || (nextClass.isLiveNow ? 'In Progress' : 'Upcoming');
  const dayLabel = nextClass.day_name || (nextClass.nextDayLabel && nextClass.nextDayLabel !== 'Today' ? nextClass.nextDayLabel : '');
  const isInProgress = Boolean(nextClass.isLiveNow) || statusLabel === 'In Progress';
  const isFutureDay = Boolean(dayLabel) || statusLabel.startsWith('Scheduled');
  const isUpcomingToday = !isInProgress && !isFutureDay;

  const countdownSuffix = getCountdownSuffix(nextClass, isUpcomingToday);

  const headerTitle = isInProgress
    ? 'In Progress Now'
    : `Up Next${countdownSuffix}`;

  const rightMeta = isInProgress
    ? (endTimeStr ? `Ends ${endTimeStr}` : 'Live')
    : isFutureDay && dayLabel
      ? (hasValidTime ? `${dayLabel} • ${startTimeStr}` : dayLabel)
      : hasValidTime
        ? `Starts ${startTimeStr}`
        : '';

  const accentBarClass = isInProgress ? 'bg-emerald-500' : 'bg-amber-500';

  const teacherMetaParts = [
    courseName || courseCode,
    semesterStr,
    sectionStr ? `Sec ${sectionStr}` : '',
  ].filter(Boolean);

  const teacherRightPillText = courseCode
    ? `${courseCode} • ${enrolledCount} Students`
    : `${enrolledCount} Students`;

  return (
    <View className="mb-5">
      {/* External Section Header */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center gap-2 flex-1 mr-2">
          <Clock size={16} color="#3B28CC" />
          <Text className="text-base font-medium text-slate-900" numberOfLines={1}>
            {headerTitle}
          </Text>
        </View>
        {rightMeta ? (
          <Text className="text-xs font-medium text-slate-500">
            {rightMeta}
          </Text>
        ) : null}
      </View>

      {/* Main Card with Left Accent Stripe */}
      <View className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-row">
        <View className={`w-1.5 ${accentBarClass}`} />

        <View className="flex-1 p-4">
          {/* Top Pills Row: Subject Code & Faculty / Roster */}
          <View className="flex-row items-center justify-between mb-2.5 gap-2">
            <View className="bg-slate-100 px-2.5 py-1 rounded-full">
              <Text className="text-[11px] font-medium text-slate-600">
                {subjectCode || courseCode || 'CLASS'}
              </Text>
            </View>

            <View className="bg-slate-100 pl-1.5 pr-2.5 py-1 rounded-full flex-row items-center gap-1.5 max-w-[65%]">
              <View className="w-4 h-4 rounded-full bg-indigo-100 items-center justify-center">
                {isTeacher ? (
                  <Users size={10} color="#3B28CC" />
                ) : (
                  <User size={10} color="#3B28CC" />
                )}
              </View>
              <Text className="text-[11px] font-medium text-slate-700" numberOfLines={1}>
                {isTeacher ? teacherRightPillText : teacherName}
              </Text>
            </View>
          </View>

          {/* Subject Name */}
          <Text
            className={`text-lg font-medium text-slate-900 ${
              isTeacher && teacherMetaParts.length > 0 ? 'mb-0.5' : 'mb-3'
            }`}
            numberOfLines={2}
          >
            {subjectName}
          </Text>

          {isTeacher && teacherMetaParts.length > 0 ? (
            <Text className="text-xs font-medium text-slate-500 mb-3" numberOfLines={1}>
              {teacherMetaParts.join(' • ')}
            </Text>
          ) : null}

          {/* Time & Room Chips */}
          <View className="flex-row items-center gap-2 flex-wrap mb-3.5">
            <View className="flex-row items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-xl">
              <Clock size={13} color="#64748b" />
              <Text className="text-xs font-medium text-slate-600">
                {timeStr}
              </Text>
            </View>

            <View className="flex-row items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-xl">
              <DoorOpen size={13} color="#64748b" />
              <Text className="text-xs font-medium text-slate-600">
                {roomStr}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          {isTeacher ? (
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => onStartAttendance && onStartAttendance(nextClass)}
                className="flex-1 bg-[#0066FF] rounded-2xl py-2.5 px-4 flex-row items-center justify-center gap-2"
              >
                <Camera size={15} color="#ffffff" />
                <Text className="text-sm font-medium text-white">
                  {nextClass.isCompletedToday ? 'Rescan Attendance' : 'Take Attendance'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => onPressSyllabus && onPressSyllabus(nextClass)}
                className="bg-slate-100/90 border border-slate-200/60 rounded-2xl py-2.5 px-4 flex-row items-center justify-center gap-1.5"
              >
                <BookOpen size={15} color="#0f172a" />
                <Text className="text-sm font-medium text-slate-900">
                  Syllabus
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => onPressSyllabus && onPressSyllabus(nextClass)}
              className="bg-slate-100/90 border border-slate-200/60 rounded-2xl py-2.5 flex-row items-center justify-center gap-2"
            >
              <BookOpen size={15} color="#0f172a" />
              <Text className="text-sm font-medium text-slate-900">
                Syllabus
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

