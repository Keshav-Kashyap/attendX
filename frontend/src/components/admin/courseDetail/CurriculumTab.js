import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import {
  GraduationCap,
  Calendar,
  MessageSquare,
  SlidersHorizontal,
  Trash2,
  BookOpen,
  UserCheck,
  Plus,
} from 'lucide-react-native';
import { Text } from '../../ui/text';
import { Skeleton, SkeletonCircle } from '../../ui/Skeleton';

export default function CurriculumTab({
  course,
  subjects = [],
  isLoading = false,
  activeSemester = '',
  onAddSubject,
  onDeleteSubject,
  onAssignFaculty,
  onViewTimetable,
  onSendMessage,
}) {
  if (isLoading) {
    return (
      <View className="mx-4 gap-4">
        <View className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm gap-3">
          <View className="flex-row justify-between items-center">
            <Skeleton width={120} height={12} borderRadius={4} />
            <Skeleton width={64} height={18} borderRadius={10} />
          </View>
          <View className="flex-row items-center gap-3">
            <SkeletonCircle size={48} />
            <View className="flex-1 gap-2">
              <Skeleton width="60%" height={16} borderRadius={4} />
              <Skeleton width="45%" height={12} borderRadius={4} />
            </View>
          </View>
        </View>

        <View className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm gap-3">
          <View className="flex-row justify-between items-center">
            <Skeleton width={90} height={18} borderRadius={4} />
            <Skeleton width={70} height={20} borderRadius={10} />
          </View>
          {[1, 2, 3].map((k) => (
            <View key={k} className="bg-slate-50 rounded-2xl p-3 flex-row items-center gap-3">
              <Skeleton width={50} height={28} borderRadius={10} />
              <View className="flex-1 gap-1.5">
                <Skeleton width="65%" height={14} borderRadius={4} />
                <Skeleton width="45%" height={11} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Determine lead faculty from the loaded semester subjects
  let leadTeacher = null;
  for (const sub of subjects) {
    if (sub.assigned_teachers && sub.assigned_teachers.length > 0) {
      const at = sub.assigned_teachers[0];
      leadTeacher = {
        name: at.teacher_name || 'Assigned Faculty',
        email: at.teacher_email || '',
        room: at.room || sub.room || '',
        schedule: at.schedule || sub.schedule || '',
      };
      break;
    } else if (sub.teacher_name) {
      leadTeacher = {
        name: sub.teacher_name,
        email: sub.teacher_email || '',
        room: sub.room || '',
        schedule: sub.schedule || '',
      };
      break;
    }
  }

  const teacherInitials = leadTeacher?.name
    ? leadTeacher.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('')
    : 'FL';

  return (
    <View>
      <View className="mx-4 mb-3.5 bg-white rounded-3xl p-4 border border-slate-200/70 shadow-sm">
        {/* Top Header */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[11px] font-medium text-[#007AFF] uppercase tracking-wider">
            Faculty Lead {activeSemester ? `• ${activeSemester}` : ''}
          </Text>
          <View
            className={`px-2.5 py-0.5 rounded-full border ${
              leadTeacher
                ? 'bg-emerald-50 border-emerald-200/70'
                : 'bg-slate-100 border-slate-200/70'
            }`}
          >
            <Text
              className={`text-[10px] font-medium ${
                leadTeacher ? 'text-emerald-700' : 'text-slate-500'
              }`}
            >
              {leadTeacher ? 'Assigned' : 'Unassigned'}
            </Text>
          </View>
        </View>

        {leadTeacher ? (
          <>
            {/* Faculty Info Row */}
            <View className="flex-row items-center gap-3 mb-3.5">
              <View className="relative">
                <View className="w-12 h-12 rounded-full bg-[#007AFF]/10 items-center justify-center">
                  <Text className="text-base font-medium text-[#007AFF]">
                    {teacherInitials}
                  </Text>
                </View>
                <View className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
              </View>

              <View className="flex-1">
                <Text className="text-base font-medium text-slate-900 leading-tight">
                  {leadTeacher.name}
                </Text>
                {leadTeacher.email ? (
                  <Text className="text-xs font-medium text-slate-500 mt-0.5">
                    {leadTeacher.email}
                  </Text>
                ) : null}

                <View className="flex-row items-center gap-3 mt-1.5 flex-wrap">
                  <View className="flex-row items-center gap-1">
                    <GraduationCap size={13} color="#64748b" />
                    <Text className="text-[11px] font-medium text-slate-500">
                      {subjects.length} {subjects.length === 1 ? 'Subject' : 'Subjects'}
                    </Text>
                  </View>
                  {leadTeacher.schedule ? (
                    <View className="flex-row items-center gap-1">
                      <Calendar size={13} color="#64748b" />
                      <Text className="text-[11px] font-medium text-slate-500" numberOfLines={1}>
                        {leadTeacher.schedule}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* Action Buttons Row */}
            <View className="flex-row gap-2.5">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onViewTimetable}
                className="flex-1 bg-slate-100/90 rounded-2xl py-2.5 px-3 flex-row items-center justify-center gap-1.5"
              >
                <Calendar size={14} color="#334155" />
                <Text className="text-xs font-medium text-slate-800">Timetable</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => onSendMessage?.(leadTeacher)}
                className="flex-1 bg-[#007AFF]/10 rounded-2xl py-2.5 px-3 flex-row items-center justify-center gap-1.5"
              >
                <MessageSquare size={14} color="#007AFF" />
                <Text className="text-xs font-medium text-[#007AFF]">Message</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* Empty Faculty State */
          <View className="py-2 items-center text-center">
            <UserCheck size={26} color="#94a3b8" />
            <Text className="text-sm font-medium text-slate-900 mt-2">
              No Faculty Lead for {activeSemester || 'this Semester'}
            </Text>
            <Text className="text-xs font-medium text-slate-500 text-center mt-1 mb-3">
              Allocate a teacher to coordinate {activeSemester} subjects.
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onAssignFaculty}
              className="bg-[#007AFF] px-4 py-2 rounded-full flex-row items-center gap-1.5"
            >
              <Plus size={14} color="#ffffff" strokeWidth={2.4} />
              <Text className="text-xs font-medium text-white">Assign Faculty</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View className="mx-4 mb-4 bg-white rounded-3xl p-4 border border-slate-200/70 shadow-sm">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-base font-medium text-slate-900">
            Subjects
          </Text>
          <View className="bg-slate-100 px-2.5 py-0.5 rounded-full">
            <Text className="text-[11px] font-medium text-slate-600">
              {subjects.length} {subjects.length === 1 ? 'Subject' : 'Subjects'}
            </Text>
          </View>
        </View>
        <Text className="text-xs font-medium text-slate-500 mb-3">
          Curriculum modules for {activeSemester}
        </Text>

        {subjects.length > 0 ? (
          <View className="border-t border-slate-100">
            {subjects.map((sub, idx) => {
              const assignedTeacherName =
                sub.assigned_teachers?.[0]?.teacher_name || sub.teacher_name || null;
              const subtitleParts = [
                sub.room ? `${sub.room}` : null,
                assignedTeacherName ? `${assignedTeacherName}` : null,
              ].filter(Boolean);

              return (
                <View
                  key={sub.id || idx}
                  className={`py-3 flex-row items-center justify-between ${
                    idx !== subjects.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <View className="flex-row items-center gap-3 flex-1 mr-2">
                    <View className="bg-slate-100 px-2.5 py-1.5 rounded-xl min-w-[52px] items-center justify-center">
                      <Text className="text-[11px] font-medium text-[#007AFF]">
                        {sub.code || `S${idx + 1}`}
                      </Text>
                    </View>

                    <View className="flex-1">
                      <Text
                        className="text-sm font-medium text-slate-900 leading-tight mb-0.5"
                        numberOfLines={1}
                      >
                        {sub.name}
                      </Text>
                      <Text
                        className="text-[11px] font-medium text-slate-500 leading-tight"
                        numberOfLines={1}
                      >
                        {subtitleParts.join(' • ') || sub.schedule || 'Configured'}
                      </Text>
                    </View>
                  </View>

                  {sub.id && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => onDeleteSubject?.(sub.id, sub.name)}
                      className="w-8 h-8 rounded-full bg-red-50/80 items-center justify-center"
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View className="py-6 items-center text-center">
            <BookOpen size={30} color="#cbd5e1" />
            <Text className="text-sm font-medium text-slate-800 mt-2">
              No Subjects in {activeSemester || 'this Semester'}
            </Text>
            <Text className="text-xs font-medium text-slate-500 text-center mt-1 mb-3">
              Add curriculum subjects to {activeSemester} to organize syllabus and lectures.
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

        {/* Edit / Add Subjects Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onAddSubject}
          className="mt-2 bg-slate-100/90 rounded-2xl py-2.5 flex-row items-center justify-center gap-2"
        >
          <SlidersHorizontal size={14} color="#007AFF" />
          <Text className="text-xs font-medium text-[#007AFF]">
            Manage Subjects
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
