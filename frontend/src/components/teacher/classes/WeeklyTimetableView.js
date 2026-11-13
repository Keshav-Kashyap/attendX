import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../../ui/text';
import ClassScheduleCard from './ClassScheduleCard';
import { parseScheduleSlots, formatMinutes } from '../../../utils/scheduleConflict';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDefaultDayTab() {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = dayNames[new Date().getDay()];
  return DAYS.includes(today) ? today : 'Mon';
}

export default function WeeklyTimetableView({ courses = [], onStartAttendance, onViewStudents }) {
  const [selectedDay, setSelectedDay] = useState(getDefaultDayTab);

  // Timetable schedule mapped dynamically by days from assigned courses (real data only)
  const timetableByDay = useMemo(() => {
    const map = { Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [] };

    if (courses && courses.length > 0) {
      courses.forEach((course) => {
        const subjects = course.subjects || [];
        subjects.forEach((sub) => {
          const slots = parseScheduleSlots(sub.schedule);
          const dashParts = (sub.schedule || '').split(' - ');
          const extractedTime =
            dashParts.length >= 2 && /\d{1,2}:\d{2}/.test(sub.schedule || '')
              ? dashParts.slice(1).join(' - ').trim()
              : null;

          slots.forEach((slot) => {
            if (!map[slot.dayName]) return;
            const timePart =
              extractedTime || `${formatMinutes(slot.startMins)} - ${formatMinutes(slot.endMins)}`;
            map[slot.dayName].push({
              subjectId: sub.id,
              subjectName: sub.name,
              code: sub.code,
              courseId: course.id,
              courseName: course.name,
              courseCode: course.code,
              semester: typeof sub.semester === 'object'
                ? (sub.semester?.name || `Semester ${sub.semester?.number || 1}`)
                : (sub.semester || 'Current Term'),
              time: timePart,
              startMins: slot.startMins,
              room: sub.room || 'Room TBA',
              studentsCount: course.enrolled_students_count ?? 0,
              course,
              subject: sub,
            });
          });
        });
      });

      DAYS.forEach((day) => {
        map[day].sort((a, b) => (a.startMins ?? 0) - (b.startMins ?? 0));
      });
    }

    return map;
  }, [courses]);

  const scheduleForDay = timetableByDay[selectedDay] || [];

  return (
    <View>
      {/* Weekday Switcher Tabs */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: '#f1f5f9',
          padding: 4,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#e2e8f0',
          marginBottom: 16,
        }}
      >
        {DAYS.map((day) => {
          const isSelected = selectedDay === day;
          return (
            <TouchableOpacity
              key={day}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              onPress={() => setSelectedDay(day)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isSelected ? '#0284c7' : 'transparent',
                elevation: isSelected ? 1 : 0,
                shadowColor: isSelected ? '#0284c7' : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: isSelected ? 0.15 : 0,
                shadowRadius: 2,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: isSelected ? '#ffffff' : '#64748b',
                }}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Schedule Items for Selected Day */}
      {scheduleForDay.length === 0 ? (
        <View className="p-6 bg-card border border-border rounded-2xl items-center">
          <Text className="text-xs text-muted-foreground">
            No lectures scheduled for {selectedDay}.
          </Text>
        </View>
      ) : (
        scheduleForDay.map((item, idx) => (
          <ClassScheduleCard
            key={`${selectedDay}-${item.code || item.subjectName}-${item.subjectId || idx}`}
            scheduleItem={item}
            onStartAttendance={onStartAttendance}
            onViewStudents={onViewStudents}
          />
        ))
      )}
    </View>
  );
}
