import React, { useState, useMemo } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Users, Search, X, Plus, QrCode } from 'lucide-react-native';
import { Text } from '../../ui/text';
import { Skeleton, SkeletonCircle } from '../../ui/Skeleton';

export default function StudentsTab({
  course,
  students = [],
  isLoading = false,
  activeSemester = '',
  onEnrollBatch,
  onShareInvite,
}) {
  const [studentSearch, setStudentSearch] = useState('');

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    const q = studentSearch.toLowerCase();
    return students.filter((st) => {
      const name = (st.student_name || st.name || '').toLowerCase();
      const roll = (st.roll_number || st.roll || '').toLowerCase();
      return name.includes(q) || roll.includes(q);
    });
  }, [students, studentSearch]);

  return (
    <View className="mx-4">
      {/* Search Bar & Actions */}
      <View className="bg-white rounded-3xl p-4 border border-slate-200/70 shadow-sm mb-3.5">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-base font-medium text-slate-900">Enrolled Students</Text>
            <Text className="text-xs font-medium text-slate-500 mt-0.5">
              {students.length} {students.length === 1 ? 'Student' : 'Students'}{' '}
              {activeSemester ? `in ${activeSemester}` : `in ${course?.code}`}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            {onShareInvite && (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={onShareInvite}
                className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-full flex-row items-center gap-1"
              >
                <QrCode size={14} color="#2563EB" strokeWidth={2.2} />
                <Text className="text-xs font-semibold text-blue-600">Invite QR</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={onEnrollBatch}
              className="bg-[#007AFF] px-3.5 py-2 rounded-full flex-row items-center gap-1"
            >
              <Plus size={14} color="#ffffff" strokeWidth={2.4} />
              <Text className="text-xs font-medium text-white">Enroll Batch</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center bg-slate-100/80 rounded-2xl px-3 py-2.5">
          <Search size={15} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-2 text-xs font-medium text-slate-900 p-0"
            placeholder="Search student by name or roll number..."
            placeholderTextColor="#94a3b8"
            value={studentSearch}
            onChangeText={setStudentSearch}
          />
          {studentSearch ? (
            <TouchableOpacity onPress={() => setStudentSearch('')}>
              <X size={14} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Enrolled Students List */}
      <View className="bg-white rounded-3xl p-4 border border-slate-200/70 shadow-sm mb-4">
        {isLoading ? (
          <View className="gap-3">
            {[1, 2, 3].map((k) => (
              <View key={k} className="flex-row items-center justify-between py-2">
                <View className="flex-row items-center gap-3">
                  <SkeletonCircle size={40} />
                  <View className="gap-1.5">
                    <Skeleton width={110} height={13} borderRadius={4} />
                    <Skeleton width={80} height={10} borderRadius={4} />
                  </View>
                </View>
                <Skeleton width={60} height={20} borderRadius={10} />
              </View>
            ))}
          </View>
        ) : filteredStudents.length > 0 ? (
          filteredStudents.map((st, idx) => {
            const studentName = st.student_name || st.name || `Student ${idx + 1}`;
            const roll = st.roll_number || st.roll || '-';
            const status = st.status || 'Active';

            return (
              <View
                key={st.id || idx}
                className={`py-3 flex-row items-center justify-between ${
                  idx !== filteredStudents.length - 1 ? 'border-b border-slate-100' : ''
                }`}
              >
                <View className="flex-row items-center gap-3 flex-1 mr-2">
                  <View className="w-10 h-10 rounded-full bg-slate-100 items-center justify-center">
                    <Text className="text-xs font-medium text-slate-700">
                      {studentName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-slate-900" numberOfLines={1}>
                      {studentName}
                    </Text>
                    <Text className="text-[11px] font-medium text-slate-500">
                      Roll: {roll}
                    </Text>
                  </View>
                </View>

                <View className="bg-emerald-50 border border-emerald-200/70 px-2.5 py-0.5 rounded-full">
                  <Text className="text-[10px] font-medium text-emerald-700 capitalize">
                    {status}
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <View className="py-6 items-center text-center">
            <Users size={30} color="#cbd5e1" />
            <Text className="text-sm font-medium text-slate-800 mt-2">
              {students.length === 0
                ? 'No Students Enrolled'
                : 'No Students Match Filter'}
            </Text>
            <Text className="text-xs font-medium text-slate-500 text-center mt-1 mb-3">
              {students.length === 0
                ? `No students have been enrolled into ${activeSemester || 'this course'} yet.`
                : 'Try searching with a different name or roll number.'}
            </Text>
            {students.length === 0 && (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={onEnrollBatch}
                className="bg-[#007AFF] px-4 py-2 rounded-full flex-row items-center gap-1.5"
              >
                <Plus size={14} color="#ffffff" strokeWidth={2.4} />
                <Text className="text-xs font-medium text-white">Enroll Batch</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
