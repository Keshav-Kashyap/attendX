import React, { useMemo, useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text } from '../../ui/text';
import { Camera } from 'lucide-react-native';
import Welcome from '../../ui/common/Welcome';
import TodayClassesOverview from './TodayClassesOverview';
import NextClassCard from '../../ui/common/NextClassCard';
import UpcomingClassesList from '../../ui/common/UpcomingClassesList';
import RecentClassesList from '../../ui/common/RecentClassesList';
import QuickActionsGrid from './QuickActionsGrid';
import {
  useTeacherCourses,
  useTeacherAttendanceHistory,
  useTeacherReports,
} from '../../../hooks/useTeacher';
import { parseScheduleSlots, formatMinutes } from '../../../utils/scheduleConflict';

function isSameLocalDay(dateValue, referenceDate) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === referenceDate.getFullYear() &&
    d.getMonth() === referenceDate.getMonth() &&
    d.getDate() === referenceDate.getDate()
  );
}

export default function TeacherHomeTab({ user, onNavigateTab, onStartAttendanceSession, onOpenProfile }) {
  const {
    data: teacherCourses,
    isLoading: isCoursesLoading,
    isError: isCoursesError,
    error: coursesError,
    refetch: refetchCourses,
  } = useTeacherCourses();

  const {
    data: attendanceHistory,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    error: historyError,
    refetch: refetchHistory,
  } = useTeacherAttendanceHistory();

  const {
    data: reportsData,
    isLoading: isReportsLoading,
    refetch: refetchReports,
  } = useTeacherReports();

  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const isRefreshing = isCoursesLoading || isHistoryLoading || isReportsLoading;
  const handleRefresh = () => {
    setNowMs(Date.now());
    refetchCourses();
    refetchHistory();
    refetchReports();
  };

  const {
    todayClasses,
    todayRemainingClasses,
    nextDayClasses,
    nextDayLabel,
    todayCompletedCount,
    nextClass,
  } = useMemo(() => {
    const coursesArr = Array.isArray(teacherCourses) ? teacherCourses : [];
    const historyArr = Array.isArray(attendanceHistory) ? attendanceHistory : [];
    const now = new Date(nowMs);
    const jsDay = now.getDay();
    const todayIsoDay = jsDay === 0 ? 7 : jsDay;
    const nowMins = now.getHours() * 60 + now.getMinutes();

    const todaySessions = historyArr.filter((sess) =>
      isSameLocalDay(sess?.date || sess?.created_at, now)
    );

    const extracted = coursesArr.flatMap((course) =>
      (course.subjects || []).map((sub) => {
        const slots = parseScheduleSlots(sub.schedule);
        const firstSlot = slots[0] || null;
        const todaySlot = slots.find((s) => s.day === todayIsoDay) || null;
        const activeSlot = todaySlot || firstSlot;
        const daysLabel = slots.length > 0 ? slots.map((s) => s.dayName).join(', ') : '';

        let displayTime = 'Schedule TBA';
        if (sub.schedule && /\d{1,2}:\d{2}/.test(sub.schedule)) {
          const dashParts = sub.schedule.split(' - ');
          if (dashParts.length >= 2) {
            displayTime = dashParts.slice(1).join(' - ').trim();
          } else {
            displayTime = sub.schedule.trim();
          }
        } else if (activeSlot) {
          displayTime = `${formatMinutes(activeSlot.startMins)} - ${formatMinutes(activeSlot.endMins)}`;
        } else if (sub.schedule) {
          displayTime = sub.schedule;
        }

        const todaySessionsForSub = todaySessions.filter(
          (sess) =>
            (sub.id && sess.subject_id === sub.id) ||
            (sub.name &&
              (sess.subject_name || sess.subject || '').trim().toLowerCase() ===
                sub.name.trim().toLowerCase())
        );
        const matchedTodaySession = todaySessionsForSub[0] || null;

        const isCompletedToday = Boolean(matchedTodaySession);
        // If confirmed today when not scheduled today, or confirmed multiple times today,
        // treat the next upcoming scheduled slot for this subject as already completed early
        const skipNextUpcoming =
          (todaySlot === null && todaySessionsForSub.length > 0) ||
          (todaySlot !== null && todaySessionsForSub.length > 1);
        const isLiveNow = Boolean(
          todaySlot && nowMins >= todaySlot.startMins && nowMins < todaySlot.endMins
        );

        return {
          course,
          subject: sub,
          courseId: course.id,
          courseCode: course.code,
          courseName: course.name,
          subjectId: sub.id,
          subjectName: sub.name,
          code: sub.code || '',
          sectionName: sub.section_name || '',
          semester:
            sub.semester ||
            (sub.semester_number ? `Semester ${sub.semester_number}` : '') ||
            course.assigned_semesters?.[0]?.name ||
            '',
          time: sub.schedule || 'Schedule TBA',
          displayTime,
          start_time_str: activeSlot ? formatMinutes(activeSlot.startMins) : '',
          end_time_str: activeSlot ? formatMinutes(activeSlot.endMins) : '',
          daysLabel,
          durationMins: activeSlot ? Math.max(15, activeSlot.endMins - activeSlot.startMins) : null,
          room: sub.room || 'Room TBA',
          studentsCount: course.enrolled_students_count ?? 0,
          slots,
          todaySlot,
          isCompletedToday,
          skipNextUpcoming,
          todaySession: matchedTodaySession || null,
          isLiveNow,
        };
      })
    );

    const todaysList = extracted
      .filter((item) => item.todaySlot !== null)
      .sort((a, b) => a.todaySlot.startMins - b.todaySlot.startMins);

    const completedToday = todaysList.filter((item) => item.isCompletedToday).length;

    // Only today's classes whose end time has not yet passed and aren't already completed today
    const remainingToday = todaysList.filter(
      (item) => !item.isCompletedToday && nowMins < item.todaySlot.endMins
    );

    // Find next scheduled day's classes (tomorrow first, up to +7 days)
    let upcomingDayItems = [];
    let upcomingDayText = '';
    if (extracted.length > 0) {
      const skippedUpcomingKeys = new Set();
      for (let offset = 1; offset <= 7; offset += 1) {
        const targetDay = ((todayIsoDay + offset - 1) % 7) + 1;
        const candidates = extracted
          .map((item) => ({
            item,
            slot: item.slots.find((s) => s.day === targetDay) || null,
          }))
          .filter((entry) => {
            if (entry.slot === null) return false;
            const subKey = entry.item.subjectId || entry.item.subjectName;
            if (entry.item.skipNextUpcoming && !skippedUpcomingKeys.has(subKey)) {
              skippedUpcomingKeys.add(subKey);
              return false;
            }
            return true;
          })
          .sort((a, b) => a.slot.startMins - b.slot.startMins);

        if (candidates.length > 0) {
          const dayLabel = offset === 1 ? 'Tomorrow' : candidates[0].slot.dayName;
          upcomingDayText = dayLabel;
          upcomingDayItems = candidates.map(({ item, slot }) => ({
            ...item,
            displayTime: `${formatMinutes(slot.startMins)} - ${formatMinutes(slot.endMins)}`,
            start_time_str: formatMinutes(slot.startMins),
            end_time_str: formatMinutes(slot.endMins),
            durationMins: Math.max(15, slot.endMins - slot.startMins),
            nextDayLabel: dayLabel,
            day_name: dayLabel,
            isLiveNow: false,
            isCompletedToday: false,
          }));
          break;
        }
      }
    }

    let computedNext = null;
    if (remainingToday.length > 0) {
      const liveItem = remainingToday.find((item) => item.isLiveNow);
      const chosen = liveItem || remainingToday[0];
      computedNext = { ...chosen, nextDayLabel: 'Today', day_name: '' };
    } else if (upcomingDayItems.length > 0) {
      computedNext = upcomingDayItems[0];
    } else if (extracted.length > 0) {
      computedNext = {
        ...extracted[0],
        nextDayLabel: extracted[0].daysLabel || '',
        day_name: extracted[0].daysLabel || '',
      };
    }

    return {
      todayClasses: todaysList,
      todayRemainingClasses: remainingToday,
      nextDayClasses: upcomingDayItems.length > 0 ? upcomingDayItems : extracted,
      nextDayLabel: upcomingDayText,
      todayCompletedCount: completedToday,
      nextClass: computedNext,
    };
  }, [teacherCourses, attendanceHistory, nowMs]);

  const totalClassesCount = todayClasses.length;
  const completedAttendanceCount = todayCompletedCount;

  const avgAttendanceRate = reportsData?.summary?.average_attendance ?? 0;
  const totalSessionsCount =
    reportsData?.summary?.total_sessions ??
    (Array.isArray(attendanceHistory) ? attendanceHistory.length : 0);
  const auditsCount = reportsData?.summary?.critical_absentees_count ?? 0;
  const auditNote = reportsData?.absent_students?.[0]?.name
    ? `${reportsData.absent_students[0].name.split(' ')[0]} review`
    : '';

  const handleScanClassNow = () => {
    const scanPayload = {
      ...(nextClass || {}),
      autoLaunchCamera: true,
      scanTriggerId: Date.now(),
    };
    if (onStartAttendanceSession) {
      onStartAttendanceSession(scanPayload);
    } else if (onNavigateTab) {
      onNavigateTab('attendance', scanPayload);
    }
  };

  const handleStartAttendance = (classItem) => {
    if (onStartAttendanceSession) {
      onStartAttendanceSession(classItem);
    } else if (onNavigateTab) {
      onNavigateTab('attendance', {
        course: classItem?.course,
        subject: classItem?.subject,
      });
    }
  };

  return (
    <View className="flex-1 bg-[#F5F6FA] relative">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#3446D4" />
        }
      >
        {/* 1. Welcome Banner */}
        <Welcome user={user} role="teacher" />

        <View className="px-4 -mt-9">
          {/* 2. Overview Metric Cards */}
          <TodayClassesOverview
            totalClasses={totalClassesCount}
            completedAttendance={completedAttendanceCount}
            avgRate={avgAttendanceRate}
            totalSessions={totalSessionsCount}
            auditsCount={auditsCount}
            auditNote={auditNote}
            isLoading={isCoursesLoading || isHistoryLoading}
            isError={isCoursesError || isHistoryError}
            error={coursesError || historyError}
            onRetry={handleRefresh}
            onNavigateTab={onNavigateTab}
          />

          {/* 3. Hero Card: Next Upcoming Class (Shared Common Card) */}
          <NextClassCard
            role="teacher"
            nextClass={nextClass}
            isLoading={isCoursesLoading}
            onStartAttendance={handleStartAttendance}
            onPressSyllabus={() => onNavigateTab && onNavigateTab('classes')}
          />

          {/* 4. Upcoming / Scheduled Classes (Shared Common List) */}
          <UpcomingClassesList
            role="teacher"
            classes={todayRemainingClasses}
            upcomingClasses={nextDayClasses}
            upcomingDayLabel={nextDayLabel}
            isError={isCoursesError}
            error={coursesError}
            onRetry={handleRefresh}
            onPressClass={handleStartAttendance}
          />

          {/* 5. Recent Classes / Sessions Conducted (Shared Common List) */}
          <RecentClassesList
            role="teacher"
            recentClasses={attendanceHistory || []}
            onViewAll={() => onNavigateTab && onNavigateTab('reports')}
            onPressItem={() => onNavigateTab && onNavigateTab('reports')}
          />

          {/* 6. Quick Actions: Student Lookup & Export Reports */}
          <QuickActionsGrid onNavigateTab={onNavigateTab} />
        </View>
      </ScrollView>

      {/* Floating Bottom-Right Speed Dial Pill: Scan Now */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleScanClassNow}
        style={{
          backgroundColor: '#0066FF',
          shadowColor: '#0052cc',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.32,
          shadowRadius: 12,
          elevation: 6,
        }}
        className="absolute bottom-24 right-4 rounded-full px-4 py-3 flex-row items-center gap-2 border border-blue-400/35"
      >
        <Camera size={18} color="#ffffff" strokeWidth={2} />
        <Text className="text-sm font-medium text-white tracking-tight">
          Scan Now
        </Text>
      </TouchableOpacity>
    </View>
  );
}
