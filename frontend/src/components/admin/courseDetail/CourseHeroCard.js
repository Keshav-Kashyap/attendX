import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, ScrollView } from 'react-native';
import {
  ChevronDown,
  Check,
  X,
  Layers,
} from 'lucide-react-native';
import { Text } from '../../ui/text';

export default function CourseHeroCard({
  course,
  activeSemester = 'Semester 1',
  activeSemesterObj = null,
  semestersList = [],
  onSemesterChange,
}) {
  const [showSemesterPicker, setShowSemesterPicker] = useState(false);

  if (!course) return null;

  const totalSemestersCount = course.total_semesters || semestersList.length || (course.duration_years || 3) * 2;
  const durationYears = course.duration_years || 3;

  const normalizedSemesters =
    semestersList && semestersList.length > 0
      ? semestersList
      : Array.from({ length: totalSemestersCount }, (_, i) => ({
          id: i + 1,
          semester_number: i + 1,
          subjects_count: 0,
          students_count: 0,
        }));

  return (
    <View className="mx-4 mb-3.5 bg-white rounded-3xl p-5 border border-slate-200/70 shadow-sm">
      {/* Top Meta Pills & Semester Switcher */}
      <View className="flex-row items-center justify-between gap-2 mb-3">
        <View className="flex-row items-center gap-2 flex-wrap flex-1">
          <View className="bg-slate-900 px-2.5 py-1 rounded-full">
            <Text className="text-[11px] font-medium text-white tracking-wide">
              {course.code}
            </Text>
          </View>

          <View className="bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-full flex-row items-center gap-1.5">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <Text className="text-[11px] font-medium text-emerald-700">
              {durationYears} Years • {totalSemestersCount} Sems
            </Text>
          </View>
        </View>

        {/* Apple-style Semester Switcher Pill */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowSemesterPicker(true)}
          className="bg-slate-100/90 px-3 py-1 rounded-full flex-row items-center gap-1 border border-slate-200/70"
        >
          <Text className="text-xs font-medium text-[#007AFF]">
            {activeSemester || 'Semester 1'}
          </Text>
          <ChevronDown size={13} color="#007AFF" strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* Course Title & Description */}
      <Text className="text-xl font-medium text-slate-900 tracking-tight leading-snug">
        {course.name}
      </Text>

      {course.description ? (
        <Text className="text-xs font-medium text-slate-500 mt-1.5 leading-relaxed">
          {course.description}
        </Text>
      ) : null}

      {/* SEMESTER SWITCHER MODAL */}
      <Modal
        visible={showSemesterPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSemesterPicker(false)}
      >
        <View className="flex-1 bg-black/40 justify-center items-center px-4">
          <View className="bg-white rounded-3xl p-5 w-full max-w-sm border border-slate-200/70 shadow-xl max-h-[75%]">
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center gap-2">
                <View className="w-7 h-7 rounded-xl bg-[#007AFF]/10 items-center justify-center">
                  <Layers size={15} color="#007AFF" />
                </View>
                <Text className="text-base font-medium text-slate-900">Switch Semester</Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowSemesterPicker(false)}
                className="w-7 h-7 rounded-full bg-slate-100 items-center justify-center"
              >
                <X size={15} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs font-medium text-slate-500 mb-3.5 ml-9">
              Select target semester for {course.code}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="bg-slate-50/80 rounded-2xl border border-slate-200/70 overflow-hidden">
                {normalizedSemesters.map((semObj, sIdx) => {
                  const semLabel = `Semester ${semObj.semester_number}`;
                  const isSelected =
                    (activeSemesterObj?.id && semObj.id === activeSemesterObj.id) ||
                    semLabel.toLowerCase() === (activeSemester || '').toLowerCase();
                  const count = semObj.subjects_count ?? 0;

                  return (
                    <TouchableOpacity
                      key={semObj.id || sIdx}
                      activeOpacity={0.7}
                      onPress={() => {
                        onSemesterChange?.(semObj);
                        setShowSemesterPicker(false);
                      }}
                      className={`px-3.5 py-3 flex-row items-center justify-between ${
                        sIdx !== normalizedSemesters.length - 1 ? 'border-b border-slate-200/70' : ''
                      } ${isSelected ? 'bg-[#007AFF]/5' : 'bg-white'}`}
                    >
                      <View className="flex-row items-center gap-3">
                        <View
                          className={`w-8 h-8 rounded-xl items-center justify-center ${
                            isSelected ? 'bg-[#007AFF]' : 'bg-slate-100'
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium ${
                              isSelected ? 'text-white' : 'text-slate-600'
                            }`}
                          >
                            S{semObj.semester_number}
                          </Text>
                        </View>
                        <View>
                          <Text
                            className={`text-sm font-medium ${
                              isSelected ? 'text-[#007AFF]' : 'text-slate-900'
                            }`}
                          >
                            {semLabel}
                          </Text>
                          <Text className="text-[11px] font-medium text-slate-400">
                            {count} {count === 1 ? 'Subject' : 'Subjects'}
                          </Text>
                        </View>
                      </View>

                      {isSelected && <Check size={16} color="#007AFF" strokeWidth={2.5} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
