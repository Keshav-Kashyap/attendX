import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../../ui/text';
import { Badge } from '../../ui/badge';
import Icon from '../../ui/Icon';

export default function CourseHierarchyView({ courses = [], onStartAttendance, onViewStudents }) {
  const [expandedCourseId, setExpandedCourseId] = useState(courses?.[0]?.id || 1);

  const toggleCourse = (id) => {
    setExpandedCourseId(expandedCourseId === id ? null : id);
  };

  if (!courses || courses.length === 0) {
    return (
      <View className="p-4 bg-card rounded-2xl border border-border items-center">
        <Text className="text-xs text-muted-foreground">No assigned courses found.</Text>
      </View>
    );
  }

  return (
    <View className="gap-3">
      {courses.map((course) => {
        const isExpanded = expandedCourseId === course.id;
        const subjects = course.subjects || [];

        // Group subjects by semester
        const semesterMap = {};
        subjects.forEach((sub) => {
          const sem = typeof sub.semester === 'object'
            ? (sub.semester?.name || `Semester ${sub.semester?.number || 1}`)
            : (sub.semester || 'General');
          if (!semesterMap[sem]) semesterMap[sem] = [];
          semesterMap[sem].push(sub);
        });

        return (
          <View
            key={course.id}
            className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-sm"
          >
            {/* Course Header Bar */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => toggleCourse(course.id)}
              style={{
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(241, 245, 249, 0.4)',
              }}
            >
              <View className="flex-1 mr-2">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Badge variant="outline" className="px-2 py-0 bg-primary/10 border-primary/30">
                    <Text className="text-[10px] font-bold text-primary">{course.code}</Text>
                  </Badge>
                  <Text className="text-[11px] text-muted-foreground font-semibold">
                    {course.enrolled_students_count ?? 0} Students Enrolled
                  </Text>
                </View>

                <Text className="text-sm font-medium text-foreground">
                  {course.name}
                </Text>
              </View>

              <View className="flex-row items-center gap-2">
                <Badge variant="outline" className="px-2 py-0.5 bg-card">
                  <Text className="text-[10px] font-bold text-muted-foreground">
                    {subjects.length} Subjects
                  </Text>
                </Badge>
                <Text className="text-sm font-bold text-primary">
                  {isExpanded ? '▲' : '▼'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Expanded Semester -> Subject tree */}
            {isExpanded ? (
              <View className="p-4 pt-2 border-t border-border/60 gap-3">
                {Object.keys(semesterMap).length === 0 ? (
                  <Text className="text-xs text-muted-foreground italic py-2">
                    No subjects registered under this course.
                  </Text>
                ) : (
                  Object.keys(semesterMap).map((semKey) => (
                    <View key={semKey} className="gap-2">
                      {/* Semester Divider Label */}
                      <View className="flex-row items-center gap-2 mt-1">
                        <View className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <Text className="text-xs font-bold text-primary uppercase tracking-wider">
                          {semKey}
                        </Text>
                        <View className="flex-1 h-[1px] bg-border" />
                      </View>

                      {/* Subjects in this Semester */}
                      {semesterMap[semKey].map((sub) => (
                        <View
                          key={sub.id}
                          className="p-3 bg-muted/40 rounded-xl border border-border flex-row items-center justify-between"
                        >
                          <View className="flex-1 mr-2">
                            <View className="flex-row items-center gap-1.5 mb-0.5">
                              <Text className="text-xs font-bold text-foreground">
                                {sub.name}
                              </Text>
                              <Badge variant="outline" className="px-1.5 py-0 bg-card">
                                <Text className="text-[9px] font-semibold text-muted-foreground">
                                  {sub.code}
                                </Text>
                              </Badge>
                            </View>

                            <Text className="text-[11px] text-muted-foreground">
                              {sub.room || 'Room TBA'} • {sub.schedule || 'Schedule TBA'}
                            </Text>
                          </View>

                          <View className="flex-row items-center gap-1.5">
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={() =>
                                onViewStudents &&
                                onViewStudents({
                                  ...sub,
                                  subjectName: sub.name,
                                  courseCode: course.code,
                                })
                              }
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                backgroundColor: '#ffffff',
                                borderWidth: 1,
                                borderColor: '#e2e8f0',
                                borderRadius: 8,
                              }}
                            >
                              <Text className="text-[10px] font-bold text-muted-foreground">
                                Students
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() =>
                                onStartAttendance &&
                                onStartAttendance({
                                  course,
                                  subject: sub,
                                  subjectName: sub.name,
                                  courseCode: course.code,
                                })
                              }
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                backgroundColor: '#0284c7',
                                borderRadius: 8,
                              }}
                            >
                              <Text className="text-[10px] font-bold text-white">Scan</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  ))
                )}
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
