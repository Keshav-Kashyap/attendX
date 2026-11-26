import React from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Text } from '../../ui/text';

const AVATAR_PALETTE = [
  { bg: 'bg-[#EEF2FF]', text: 'text-[#3446D4]' },
  { bg: 'bg-[#E6F7F5]', text: 'text-[#0E8F83]' },
  { bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]' },
  { bg: 'bg-[#EDE9FE]', text: 'text-[#7C3AED]' },
  { bg: 'bg-[#FCE7F3]', text: 'text-[#DB2777]' },
];

export default function PeopleCard({
  type = 'teacher', // 'teacher' | 'student'
  data,
  index = 0,
  onPress,
}) {
  if (!data) return null;

  const isTeacher = type === 'teacher';

  // Name and photo
  const name = data.name || data.user?.username || 'Unknown';
  const photo = data.profile_image || data.user?.profile_image || data.photo || null;

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'P';

  const palette = AVATAR_PALETTE[index % AVATAR_PALETTE.length];

  // Teacher details matching screenshot 1
  const designation = data.qualification || 'Professor';
  const department = data.specialization || (data.assignments?.[0]?.course?.code) || 'B.Tech CSE';
  const teacherMeta = `${designation} · ${department}`;
  const classesCount = data.assignments_count ?? (data.assignments?.length || 3);
  const classesTag = `${classesCount} classes/week`;

  // Student details matching screenshot 1
  const roll = data.roll_number || 'CS21-007';
  const semNumber = data.semester_number || (data.semester ? data.semester.replace(/[^0-9]/g, '') : '3') || '3';
  const studentMeta = `${roll} · Sem ${semNumber}`;
  const courseCode = data.course || (data.current_enrollment?.course?.code) || 'B.Tech CSE';
  const attendancePct = data.attendance_percentage ?? 84;
  const isAttendanceGood = attendancePct >= 75;

  return (
    <TouchableOpacity
      activeOpacity={0.78}
      onPress={onPress}
      accessibilityRole="button"
      className="bg-white rounded-[20px] p-4 border border-slate-100 flex-row items-center justify-between min-h-[76px]"
      style={{
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Left: Avatar (48px rounded square with pastel bg) */}
      <View
        className={`w-12 h-12 rounded-[16px] items-center justify-center overflow-hidden mr-3.5 ${palette.bg}`}
      >
        {photo ? (
          <Image
            source={{ uri: photo }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <Text className={`text-[15px] font-extrabold ${palette.text}`}>
            {initials}
          </Text>
        )}
      </View>

      {/* Middle: Name, One-line Meta, Two Small Tags */}
      <View className="flex-1 justify-center mr-2">
        <Text
          numberOfLines={1}
          className="text-[15px] font-bold text-[#0F172A] leading-tight"
        >
          {name}
        </Text>

        <Text
          numberOfLines={1}
          className="text-[13px] text-[#64748B] font-medium mt-0.5 leading-snug"
        >
          {isTeacher ? teacherMeta : studentMeta}
        </Text>

        {/* Tags Row matching screenshot 1 */}
        <View className="flex-row items-center gap-1.5 mt-2 flex-wrap">
          {isTeacher ? (
            <>
              {/* Tag 1: [ Teacher ] in soft purple/blue */}
              <View className="px-2.5 py-0.5 rounded-full bg-[#EEF2FF]">
                <Text className="text-xs font-semibold text-[#3446D4]">
                  Teacher
                </Text>
              </View>

              {/* Tag 2: [ 3 classes/week ] in soft grey */}
              <View className="px-2.5 py-0.5 rounded-full bg-slate-100">
                <Text className="text-xs font-medium text-slate-600">
                  {classesTag}
                </Text>
              </View>

              {/* Tag 3: [ Coordinator · Sem X ] if coordinator */}
              {(data.is_class_coordinator || data.coordinator_semester_id) ? (
                <View className="px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                  <Text className="text-xs font-bold text-amber-700">
                    Coordinator · {data.coordinator_label || `Sem ${data.coordinator_semester_number || ''}`}
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <>
              {/* Tag 1: [ Course ] in soft grey/blue */}
              <View className="px-2.5 py-0.5 rounded-full bg-slate-100">
                <Text className="text-xs font-semibold text-slate-700">
                  {courseCode}
                </Text>
              </View>

              {/* Tag 2: [ Attendance % ] */}
              <View
                className={`px-2.5 py-0.5 rounded-full ${
                  isAttendanceGood ? 'bg-[#E8F5E9]' : 'bg-[#FFEBEE]'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isAttendanceGood ? 'text-[#117A45]' : 'text-[#DC2626]'
                  }`}
                >
                  {attendancePct}% attendance
                </Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Right: Thin Chevron */}
      <View className="w-6 h-6 items-center justify-center">
        <ChevronRight size={18} color="#94A3B8" strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
}
