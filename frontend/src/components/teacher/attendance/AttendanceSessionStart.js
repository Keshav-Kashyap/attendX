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
    selectedCourse?.enrolled_students_count ||
    selectedSubject?.enrolled_count ||
    16;

  const handleSelectBoth = (course, subject) => {
    onSelectCourse(course);
    if (subject) onSelectSubject(subject);
    setShowClassPickerModal(false);
  };

  return (
    <View className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm mb-4">
      {/* Header with Live Status */}
      <View className="flex-row items-center justify-between pb-3 border-b border-border/60 mb-3">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center gap-1.5">
            <View className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Attendance Session
            </Text>
          </View>
          <Text className="text-base font-semibold text-foreground mt-0.5">
            {selectedSubject?.name || 'Select Lecture Class'}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowClassPickerModal(true)}
          className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 flex-row items-center gap-1"
        >
          <Icon name="refresh" size={13} color="#0066FF" />
          <Text className="text-xs font-medium text-primary">Switch</Text>
        </TouchableOpacity>
      </View>

      {/* Primary Details Row */}
      <View className="bg-muted/30 rounded-xl p-3 border border-border/60 mb-3">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-xs font-medium text-foreground flex-1 mr-2" numberOfLines={1}>
            {selectedCourse?.name || 'Academic Degree Program'}
          </Text>
          {selectedSubject?.code ? (
            <Badge variant="outline" className="px-1.5 py-0 bg-primary/10 border-primary/25">
              <Text className="text-[10px] font-bold text-primary">{selectedSubject.code}</Text>
            </Badge>
          ) : null}
        </View>

        <View className="flex-row items-center gap-3">
          <View className="flex-row items-center gap-1">
            <Icon name="school" size={12} color="#64748b" />
            <Text className="text-[11px] text-muted-foreground font-medium">
              {selectedCourse?.code || 'MCAINT'}
            </Text>
          </View>
          <Text className="text-[10px] text-muted-foreground">•</Text>
          <View className="flex-row items-center gap-1">
            <Icon name="calendar" size={12} color="#64748b" />
            <Text className="text-[11px] text-muted-foreground font-medium">
              {displaySemester}
            </Text>
          </View>
          <Text className="text-[10px] text-muted-foreground">•</Text>
          <View className="flex-row items-center gap-1">
            <Icon name="people" size={12} color="#64748b" />
            <Text className="text-[11px] text-muted-foreground font-medium">
              {displayBatch} Students
            </Text>
          </View>
        </View>
      </View>

      {/* Info Badges (Room & Schedule) */}
      <View className="flex-row gap-2">
        <View className="flex-1 p-2 bg-muted/20 rounded-xl border border-border/50 flex-row items-center gap-2">
          <View className="w-6 h-6 rounded-lg bg-primary/10 items-center justify-center">
            <Icon name="location" size={12} color="#0066FF" />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] text-muted-foreground font-medium">Lecture Room</Text>
            <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>
              {displayRoom}
            </Text>
          </View>
        </View>

        <View className="flex-1 p-2 bg-muted/20 rounded-xl border border-border/50 flex-row items-center gap-2">
          <View className="w-6 h-6 rounded-lg bg-emerald-500/10 items-center justify-center">
            <Icon name="time" size={12} color="#10b981" />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] text-muted-foreground font-medium">Time Slot</Text>
            <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>
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
                                  {sub.semester || (sub.semester_number ? `Semester ${sub.semester_number}` : 'Semester 2')} • {sub.room || 'Block B, Hall 3'}
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
