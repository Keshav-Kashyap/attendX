import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  GraduationCap,
  Calendar,
  MessageSquare,
  SlidersHorizontal,
  Trash2,
  BookOpen,
  UserCheck,
  Plus,
  X,
  Check,
  ArrowLeftRight,
} from 'lucide-react-native';
import { Text } from '../../ui/text';
import { Skeleton, SkeletonCircle } from '../../ui/Skeleton';

export default function CurriculumTab({
  course,
  semesterObj = null,
  subjects = [],
  teachers = [],
  isLoading = false,
  isAssigningLead = false,
  activeSemester = '',
  onAddSubject,
  onDeleteSubject,
  onAssignLeadTeacher,
  onViewTimetable,
  onSendMessage,
}) {
  const [showLeadModal, setShowLeadModal] = useState(false);
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

  // Strictly use the semester's Class Coordinator / Lead Teacher from the API
  const coordTeacherId = semesterObj?.coordinator_teacher_id || null;
  const coordTeacherName = semesterObj?.coordinator_teacher_name || null;

  const matchedTeacherObj = coordTeacherId
    ? (teachers || []).find((t) => t.id === coordTeacherId)
    : null;

  const leadTeacher =
    coordTeacherId && coordTeacherName
      ? {
          id: coordTeacherId,
          name: coordTeacherName,
          email: matchedTeacherObj?.email || matchedTeacherObj?.user?.email || '',
          qualification: matchedTeacherObj?.qualification || '',
          specialization: matchedTeacherObj?.specialization || '',
        }
      : null;

  const teacherInitials = leadTeacher?.name
    ? leadTeacher.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('')
    : 'FL';

  const handlePickTeacher = async (teacherId) => {
    setShowLeadModal(false);
    if (onAssignLeadTeacher) {
      await onAssignLeadTeacher(teacherId);
    }
  };

  return (
    <View>
      <View className="mx-4 mb-3.5 bg-white rounded-3xl p-4 border border-slate-200/70 shadow-sm">
        {/* Top Header */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[11px] font-medium text-[#007AFF] uppercase tracking-wider">
            Lead Teacher {activeSemester ? `• ${activeSemester}` : ''}
          </Text>
          <View className="flex-row items-center gap-2">
            {leadTeacher && (
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={isAssigningLead}
                onPress={() => setShowLeadModal(true)}
                className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200/80 flex-row items-center gap-1"
              >
                <ArrowLeftRight size={10} color="#475569" />
                <Text className="text-[10px] font-semibold text-slate-700">Change</Text>
              </TouchableOpacity>
            )}
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
                      Class Coordinator · {subjects.length} {subjects.length === 1 ? 'Subject' : 'Subjects'}
                    </Text>
                  </View>
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
              No Lead Teacher for {activeSemester || 'this Semester'}
            </Text>
            <Text className="text-xs font-medium text-slate-500 text-center mt-1 mb-3">
              Assign a Class Coordinator to lead {activeSemester || 'this semester'}.
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={isAssigningLead}
              onPress={() => setShowLeadModal(true)}
              className="bg-[#007AFF] px-4 py-2 rounded-full flex-row items-center gap-1.5"
            >
              {isAssigningLead ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Plus size={14} color="#ffffff" strokeWidth={2.4} />
                  <Text className="text-xs font-medium text-white">Assign Lead Teacher</Text>
                </>
              )}
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

      {/* ASSIGN LEAD TEACHER (CLASS COORDINATOR) MODAL */}
      <Modal
        visible={showLeadModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowLeadModal(false)}
      >
        <View className="flex-1 bg-black/45 justify-end">
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowLeadModal(false)}
          />

          <View className="bg-white rounded-t-[28px] max-h-[75%] border-t border-slate-100 shadow-2xl z-10">
            <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
              <View>
                <Text className="text-[17px] font-bold text-slate-900">
                  Assign Lead Teacher
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  Class Coordinator for {course?.code} · {activeSemester}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowLeadModal(false)}
                className="w-9 h-9 rounded-xl border border-slate-200 items-center justify-center bg-white"
              >
                <X size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="px-5 py-3"
              contentContainerStyle={{ paddingBottom: 28 }}
              showsVerticalScrollIndicator={false}
            >
              {leadTeacher && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handlePickTeacher(null)}
                  className="p-3.5 rounded-2xl border border-red-200 bg-red-50/60 mb-2.5 flex-row items-center justify-between"
                >
                  <View>
                    <Text className="text-sm font-bold text-red-700">
                      Remove Lead Teacher
                    </Text>
                    <Text className="text-xs text-red-500 mt-0.5">
                      Unassign {leadTeacher.name} from {activeSemester}
                    </Text>
                  </View>
                  <X size={16} color="#DC2626" />
                </TouchableOpacity>
              )}

              {teachers && teachers.length > 0 ? (
                teachers.map((t) => {
                  const tName = t.name || t.user?.username || `Teacher #${t.id}`;
                  const isCurrent = t.id === coordTeacherId;
                  const isLeadingOther =
                    Boolean(t.coordinator_semester_id) &&
                    t.coordinator_semester_id !== semesterObj?.id;

                  return (
                    <TouchableOpacity
                      key={t.id}
                      activeOpacity={0.75}
                      onPress={() => handlePickTeacher(t.id)}
                      className={`p-3.5 rounded-2xl border mb-2 flex-row items-center justify-between ${
                        isCurrent
                          ? 'bg-blue-50 border-blue-300'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <View className="flex-1 mr-3">
                        <Text
                          className={`text-sm font-bold ${
                            isCurrent ? 'text-[#007AFF]' : 'text-slate-900'
                          }`}
                        >
                          {tName}
                        </Text>
                        <Text
                          className={`text-xs mt-0.5 ${
                            isCurrent
                              ? 'text-blue-600 font-semibold'
                              : isLeadingOther
                              ? 'text-amber-600 font-medium'
                              : 'text-slate-400'
                          }`}
                        >
                          {isCurrent
                            ? `Current Lead for ${activeSemester}`
                            : isLeadingOther
                            ? `Currently Lead for ${t.coordinator_label || `Sem ${t.coordinator_semester_number}`}`
                            : `${t.qualification || 'Faculty'} · ${t.specialization || 'Available'}`}
                        </Text>
                      </View>

                      {isCurrent && (
                        <View className="w-7 h-7 rounded-full bg-[#007AFF] items-center justify-center">
                          <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View className="py-8 items-center">
                  <Text className="text-sm font-semibold text-slate-500">
                    No teachers found
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
