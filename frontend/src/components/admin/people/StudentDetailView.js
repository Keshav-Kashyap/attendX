import React from 'react';
import { View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { ChevronLeft, Pencil } from 'lucide-react-native';
import { Text } from '../../ui/text';

export default function StudentDetailView({
  student,
  onBack,
  onEdit,
  onRemove,
}) {
  if (!student) return null;

  const name = student.name || student.user?.username || 'Aarav Gupta';
  const photo = student.profile_image || student.user?.profile_image || null;
  const roll = student.roll_number || 'CS21-007';
  const phone = student.phone || '+91 98765 00112';

  const courseCode = student.course || student.current_enrollment?.course?.code || 'B.Tech CSE';
  const semN = student.semester_number || (student.semester ? student.semester.replace(/[^0-9]/g, '') : '3') || '3';
  const semesterStr = `Sem ${semN}`;
  const overallAttendance = student.attendance_percentage ?? 84;

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AG';

  // Subject-wise attendance matching screenshot 3
  const subjectsAttendance = [
    {
      id: 1,
      name: 'Data Structures',
      attended: 28,
      total: 32,
      pct: 88,
    },
    {
      id: 2,
      name: 'Algorithms',
      attended: 30,
      total: 36,
      pct: 82,
    },
    {
      id: 3,
      name: 'Operating Systems',
      attended: 36,
      total: 40,
      pct: 91,
    },
    {
      id: 4,
      name: 'Database Systems',
      attended: 33,
      total: 44,
      pct: 76,
    },
  ];

  return (
    <View className="flex-1 bg-[#F5F6FA]">
      {/* Top Bar matching screenshot 3 */}
      <View className="flex-row items-center justify-between px-5 pt-3.5 pb-2.5">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          className="w-10 h-10 rounded-xl bg-white border border-slate-200 items-center justify-center shadow-xs"
        >
          <ChevronLeft size={20} color="#0F172A" strokeWidth={2.5} />
        </TouchableOpacity>

        <Text className="text-[17px] font-bold text-[#0F172A]">
          Student details
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onEdit}
          className="w-10 h-10 rounded-xl bg-white border border-slate-200 items-center justify-center shadow-xs"
        >
          <Pencil size={18} color="#0F172A" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-3"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Block matching screenshot 3 */}
        <View className="items-center my-3">
          <View className="w-20 h-20 rounded-[22px] bg-[#EEF2FF] items-center justify-center overflow-hidden mb-3">
            {photo ? (
              <Image source={{ uri: photo }} className="w-full h-full" resizeMode="cover" />
            ) : (
              <Text className="text-2xl font-extrabold text-[#3446D4]">
                {initials}
              </Text>
            )}
          </View>

          <Text className="text-[20px] font-bold text-[#0F172A] text-center">
            {name}
          </Text>

          <Text className="text-[13px] font-medium text-[#64748B] mt-0.5 text-center">
            {roll} · {phone}
          </Text>

          <View className="flex-row items-center gap-1.5 mt-2 justify-center">
            <View
              className={`px-2.5 py-1 rounded-full flex-row items-center gap-1.5 ${
                student.has_face_embedding || student.has_face
                  ? 'bg-emerald-50 border border-emerald-200/60'
                  : 'bg-amber-50 border border-amber-200/60'
              }`}
            >
              <View
                className={`w-2 h-2 rounded-full ${
                  student.has_face_embedding || student.has_face
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                }`}
              />
              <Text
                className={`text-[11px] font-semibold ${
                  student.has_face_embedding || student.has_face
                    ? 'text-emerald-700'
                    : 'text-amber-700'
                }`}
              >
                {student.has_face_embedding || student.has_face
                  ? 'Face Embedding Active'
                  : 'No Face Biometric'}
              </Text>
            </View>
          </View>
        </View>

        {/* 3 Mini Stat Cards matching screenshot 3 */}
        <View className="flex-row gap-3 my-3.5">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 items-center shadow-xs">
            <Text className="text-[18px] font-bold text-[#0F172A]" numberOfLines={1}>
              {courseCode}
            </Text>
            <Text className="text-[11px] font-medium text-[#64748B] mt-0.5 text-center">
              Course
            </Text>
          </View>

          <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 items-center shadow-xs">
            <Text className="text-[18px] font-bold text-[#0F172A]">
              {semesterStr}
            </Text>
            <Text className="text-[11px] font-medium text-[#64748B] mt-0.5 text-center">
              Semester
            </Text>
          </View>

          <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 items-center shadow-xs">
            <Text className="text-[18px] font-bold text-[#0F172A]">
              {overallAttendance}%
            </Text>
            <Text className="text-[11px] font-medium text-[#64748B] mt-0.5 text-center">
              Overall
            </Text>
          </View>
        </View>

        {/* Section: Subject-wise attendance matching screenshot 3 */}
        <View className="mt-2 mb-4">
          <Text className="text-[17px] font-bold text-[#0F172A] mb-3">
            Subject-wise attendance
          </Text>

          <View className="gap-3">
            {subjectsAttendance.map((item) => (
              <View
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs"
              >
                {/* Title + Green Percentage Tag */}
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-[15px] font-bold text-[#0F172A]">
                    {item.name}
                  </Text>
                  <View className="px-2 py-0.5 rounded-md bg-[#E8F5E9]">
                    <Text className="text-[11px] font-bold text-[#117A45]">
                      {item.pct}%
                    </Text>
                  </View>
                </View>

                {/* Subtitle */}
                <Text className="text-[12px] font-medium text-[#64748B] mb-2.5">
                  {item.attended} of {item.total} classes attended
                </Text>

                {/* Green Progress Bar */}
                <View className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <View
                    style={{ width: `${item.pct}%` }}
                    className="h-full rounded-full bg-[#117A45]"
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Actions matching screenshot 3 */}
        <View className="mt-3 gap-2.5 mb-6">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onEdit}
            className="w-full h-12 rounded-2xl bg-[#2563EB] items-center justify-center shadow-xs"
          >
            <Text className="text-[15px] font-bold text-white">Edit student</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onRemove}
            className="w-full h-12 rounded-2xl bg-[#FEE2E2]/60 items-center justify-center"
          >
            <Text className="text-[15px] font-bold text-[#DC2626]">Delete student</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
