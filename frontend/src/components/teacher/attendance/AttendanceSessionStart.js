import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Text } from '../../ui/text';
import { Badge } from '../../ui/badge';
import Icon from '../../ui/Icon';

export default function AttendanceSessionStart({
  courses = [],
  selectedCourse,
  selectedSubject,
  onSelectCourse,
  onSelectSubject,
}) {
  const [showClassPickerModal, setShowClassPickerModal] = useState(false);

  // De-duplicate courses by ID or code
  const uniqueCourses = useMemo(() => {
    if (!Array.isArray(courses)) return [];
    const seen = new Set();
    return courses.filter((c) => {
      const key = c?.id || c?.code || c?.name;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [courses]);

  // Current course's available subjects de-duplicated
  const availableSubjects = useMemo(() => {
    const subs = selectedCourse?.subjects || [];
    const seen = new Set();
    return subs.filter((s) => {
      const key = s?.id || s?.code || s?.name;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [selectedCourse]);

  // Fallback room, semester, batch
  const displayRoom = selectedSubject?.room || 'Block B, Hall 3';
  const displaySemester =
    selectedSubject?.semester ||
    (selectedSubject?.semester_number ? `Semester ${selectedSubject.semester_number}` : null) ||
    (selectedCourse?.semester ? `Semester ${selectedCourse.semester}` : 'Semester 2');
  const displayBatch =
    selectedSubject?.enrolled_count ??
    (selectedCourse?.enrolled_students_count || 16);

  const handleSelectBoth = (course, subject) => {
    onSelectCourse(course);
    if (subject) onSelectSubject(subject);
    setShowClassPickerModal(false);
  };

  return (
    <View
      className="bg-white border border-[#E6EAF2] rounded-[24px] p-4 mb-4"
      style={{
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Header with Live Status */}
      <View className="flex-row items-start justify-between mb-3.5">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-[#16A34A]" />
            <Text className="text-xs font-semibold text-[#15803D]">
              Attendance session
            </Text>
          </View>
          <Text className="text-[20px] font-bold text-[#0F172A] mt-1 leading-tight">
            {selectedSubject?.name || 'Select Lecture Class'}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setShowClassPickerModal(true)}
          className="px-3.5 py-2 rounded-full bg-[#EEF2FF] flex-row items-center gap-1.5"
        >
          <Icon name="refresh" size={14} color="#3446D4" />
          <Text className="text-xs font-bold text-[#3446D4]">Switch</Text>
        </TouchableOpacity>
      </View>

      {/* Primary Details Box */}
      <View className="bg-[#F8FAFC] rounded-2xl p-3.5 border border-[#EEF2F6] mb-3">
        <View className="flex-row items-start justify-between mb-2">
          <Text className="text-[14px] font-semibold text-[#1E293B] flex-1 mr-2 leading-snug" numberOfLines={2}>
            {selectedCourse?.name || 'Academic Degree Program'}
          </Text>
          {selectedSubject?.code ? (
            <View className="px-2.5 py-1 rounded-full bg-[#EEF2FF]">
              <Text className="text-[11px] font-bold text-[#3446D4]">{selectedSubject.code}</Text>
            </View>
          ) : null}
        </View>

        <View className="flex-row items-center flex-wrap gap-3">
          <View className="flex-row items-center gap-1">
            <Icon name="school" size={13} color="#64748B" />
            <Text className="text-xs text-[#64748B] font-medium">
              {selectedCourse?.code || 'MCAINT'}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Icon name="calendar" size={13} color="#64748B" />
            <Text className="text-xs text-[#64748B] font-medium">
              {displaySemester}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Icon name="people" size={13} color="#64748B" />
            <Text className="text-xs text-[#64748B] font-medium">
              {displayBatch} students
            </Text>
          </View>
        </View>
      </View>

      {/* Info Boxes (Room & Schedule) */}
      <View className="flex-row gap-2.5">
        <View className="flex-1 p-3 bg-[#F8FAFC] rounded-2xl border border-[#EEF2F6] flex-row items-center gap-2.5">
          <View className="w-9 h-9 rounded-full bg-[#EEF2FF] items-center justify-center">
            <Icon name="location" size={16} color="#3446D4" />
          </View>
          <View className="flex-1">
            <Text className="text-[11px] text-[#64748B] font-medium">Lecture room</Text>
            <Text className="text-[13px] font-bold text-[#0F172A] mt-0.5" numberOfLines={1}>
              {displayRoom}
            </Text>
          </View>
        </View>

        <View className="flex-1 p-3 bg-[#F8FAFC] rounded-2xl border border-[#EEF2F6] flex-row items-center gap-2.5">
          <View className="w-9 h-9 rounded-full bg-[#E6F7F5] items-center justify-center">
            <Icon name="time" size={16} color="#0E8F83" />
          </View>
          <View className="flex-1">
            <Text className="text-[11px] text-[#64748B] font-medium">Time slot</Text>
            <Text className="text-[13px] font-bold text-[#0F172A] mt-0.5" numberOfLines={1}>
              {selectedSubject?.schedule ? selectedSubject.schedule.split(' - ').slice(-1)[0] : 'Current Session'}
            </Text>
          </View>
        </View>
      </View>

      {/* Class Switcher Modal (Clean Apple-like bottom sheet) */}
      <Modal
        visible={showClassPickerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowClassPickerModal(false)}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-card rounded-t-3xl border-t border-border max-h-[80%] p-5 pb-8 shadow-2xl">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-border/80 mb-3">
              <View>
                <Text className="text-base font-semibold text-foreground">
                  Select Class Session
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  Choose from your assigned courses & subjects
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowClassPickerModal(false)}
                className="w-8 h-8 rounded-full bg-muted/60 items-center justify-center border border-border"
              >
                <Text className="text-foreground text-sm font-bold">✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mt-1">
              {uniqueCourses.map((course) => {
                const subs = course.subjects || [];
                const courseSubs = subs.filter((s, idx, arr) =>
                  idx === arr.findIndex((x) => (x.id && x.id === s.id) || (x.code && x.code === s.code))
                );

                return (
                  <View key={course.id || course.code} className="mb-4">
                    <View className="flex-row items-center gap-2 mb-2 px-1">
                      <Icon name="school" size={14} color="#0066FF" />
                      <Text className="text-xs font-bold text-foreground flex-1" numberOfLines={1}>
                        {course.name} ({course.code})
                      </Text>
                    </View>

                    <View className="gap-2">
                      {courseSubs.length === 0 ? (
                        <View className="p-3 bg-muted/20 rounded-xl border border-border/50">
                          <Text className="text-xs text-muted-foreground">No subjects found in this course</Text>
                        </View>
                      ) : (
                        courseSubs.map((sub) => {
                          const isSelected =
                            selectedCourse?.id === course.id &&
                            (selectedSubject?.id === sub.id || selectedSubject?.code === sub.code);

                          return (
                            <TouchableOpacity
                              key={sub.id || sub.code}
                              activeOpacity={0.75}
                              onPress={() => handleSelectBoth(course, sub)}
                              className={`p-3 rounded-xl border flex-row items-center justify-between ${
                                isSelected
                                  ? 'bg-primary/10 border-primary'
                                  : 'bg-muted/30 border-border/70'
                              }`}
                            >
                              <View className="flex-1 mr-2">
                                <View className="flex-row items-center gap-2 mb-0.5">
                                  <Text
                                    className={`text-xs font-semibold ${
                                      isSelected ? 'text-primary' : 'text-foreground'
                                    }`}
                                  >
                                    {sub.name}
                                  </Text>
                                  <Badge
                                    variant="outline"
                                    className={`px-1.5 py-0 ${
                                      isSelected ? 'bg-primary/15 border-primary/30' : 'bg-muted border-border'
                                    }`}
                                  >
                                    <Text
                                      className={`text-[9px] font-bold ${
                                        isSelected ? 'text-primary' : 'text-muted-foreground'
                                      }`}
                                    >
                                      {sub.code}
                                    </Text>
                                  </Badge>
                                </View>
                                <Text className="text-[11px] text-muted-foreground">
                                  {sub.semester || (sub.semester_number ? `Semester ${sub.semester_number}` : 'Semester 2')}
                                  {sub.enrolled_count ? ` • ${sub.enrolled_count} Students` : ''} • {sub.room || 'Block B, Hall 3'}
                                </Text>
                              </View>

                              {isSelected ? (
                                <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                                  <Text className="text-white text-[10px] font-bold">✓</Text>
                                </View>
                              ) : (
                                <Text className="text-xs text-muted-foreground font-medium">Select</Text>
                              )}
                            </TouchableOpacity>
                          );
                        })
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
