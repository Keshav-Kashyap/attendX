import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronLeft,
  Pencil,
  Award,
  Calendar,
  Clock,
  MapPin,
  Users,
  X,
  Check,
  Plus,
} from 'lucide-react-native';
import { Text } from '../../ui/text';

const DAY_ORDER = {
  Mon: 1,
  Monday: 1,
  Tue: 2,
  Tuesday: 2,
  Wed: 3,
  Wednesday: 3,
  Thu: 4,
  Thursday: 4,
  Fri: 5,
  Friday: 5,
  Sat: 6,
  Saturday: 6,
  Sun: 7,
  Sunday: 7,
};

const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_INDEX_TO_SHORT = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
};

function formatTime12h(timeStr) {
  if (!timeStr) return '';
  // Already has AM/PM
  if (/[AP]M/i.test(timeStr)) return timeStr.trim();
  const parts = String(timeStr).split(':');
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  const m = parts[1].padStart(2, '0');
  if (Number.isNaN(h)) return timeStr;
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${suffix}`;
}

function getTodayShortDay() {
  const jsDay = new Date().getDay(); // 0=Sun, 1=Mon...
  const map = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
  return map[jsDay];
}

function buildTimetableEntries(assignments = []) {
  const entries = [];
  const todayShort = getTodayShortDay();

  assignments.forEach((a, idx) => {
    const subjectName = a.subject_name || a.subject?.name || 'Subject';
    const subjectCode = a.subject_code || a.subject?.code || '';
    const courseCode = a.course_code || a.course?.code || '';
    const semNum = a.semester_number ?? a.semester ?? '';
    const room = a.room || 'TBA';
    const studentsCount = a.students_count ?? 0;

    const metaParts = [];
    if (courseCode) metaParts.push(courseCode);
    if (semNum) metaParts.push(`Sem ${semNum}`);
    const courseSemLabel = metaParts.join(' · ');

    if (Array.isArray(a.timetable_slots) && a.timetable_slots.length > 0) {
      a.timetable_slots.forEach((slot, sIdx) => {
        const shortDay =
          DAY_INDEX_TO_SHORT[slot.day_of_week] ||
          (slot.day_name ? slot.day_name.slice(0, 3) : 'Mon');
        const start = formatTime12h(slot.start_time);
        const end = formatTime12h(slot.end_time);
        const timeRange = end ? `${start} - ${end}` : start;
        const slotRoom = slot.room_name || room;

        entries.push({
          id: `${a.id || idx}-slot-${slot.id || sIdx}`,
          day: shortDay,
          dayOrder: DAY_ORDER[shortDay] || 9,
          startTime: start,
          timeRange,
          isToday: shortDay === todayShort,
          subject: subjectName,
          subjectCode,
          courseSemLabel,
          room: slotRoom,
          studentsCount,
        });
      });
    } else if (a.schedule) {
      // Parse schedule string like "Mon, Wed, Fri - 10:15 AM" or "Mon, Wed · 09:00 AM - 10:00 AM"
      const parts = String(a.schedule).split(/\s*[-–·]\s*/);
      const daysPart = parts[0] || '';
      const timePart = parts.slice(1).join(' - ') || 'Scheduled';

      const matchedDays = [];
      Object.keys(DAY_ORDER).forEach((key) => {
        if (key.length === 3 && new RegExp(`\\b${key}`, 'i').test(daysPart)) {
          if (!matchedDays.includes(key)) matchedDays.push(key);
        }
      });

      const daysToUse = matchedDays.length > 0 ? matchedDays : ['Mon'];
      daysToUse.forEach((d, dIdx) => {
        entries.push({
          id: `${a.id || idx}-sched-${dIdx}`,
          day: d,
          dayOrder: DAY_ORDER[d] || 9,
          startTime: timePart,
          timeRange: timePart,
          isToday: d === todayShort,
          subject: subjectName,
          subjectCode,
          courseSemLabel,
          room,
          studentsCount,
        });
      });
    } else {
      entries.push({
        id: `${a.id || idx}-raw`,
        day: 'TBA',
        dayOrder: 99,
        startTime: 'TBA',
        timeRange: 'Time TBA',
        isToday: false,
        subject: subjectName,
        subjectCode,
        courseSemLabel,
        room,
        studentsCount,
      });
    }
  });

  return entries.sort((x, y) => {
    if (x.dayOrder !== y.dayOrder) return x.dayOrder - y.dayOrder;
    return String(x.startTime).localeCompare(String(y.startTime));
  });
}

export default function TeacherDetailView({
  teacher,
  courses = [],
  onBack,
  onEdit,
  onRemove,
  onAssignCoordinator,
  isAssigningCoordinator = false,
}) {
  const [selectedDay, setSelectedDay] = useState('All');
  const [coordModalVisible, setCoordModalVisible] = useState(false);

  if (!teacher) return null;

  const name = teacher.name || teacher.user?.username || 'Teacher';
  const photo = teacher.profile_image || teacher.user?.profile_image || null;
  const designation = teacher.qualification || 'Faculty';
  const department = teacher.specialization || 'General';
  const phone = teacher.phone || 'No phone';
  const email = teacher.email || teacher.user?.email || '';

  const initials =
    name
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'T';

  const rawAssignments = teacher.assignments || [];
  const timetableEntries = useMemo(
    () => buildTimetableEntries(rawAssignments),
    [rawAssignments]
  );

  const filteredTimetable = useMemo(() => {
    if (selectedDay === 'All') return timetableEntries;
    return timetableEntries.filter((e) => e.day === selectedDay);
  }, [timetableEntries, selectedDay]);

  const totalSubjects = rawAssignments.length;
  const classesPerWeek = timetableEntries.length;
  const totalStudents =
    teacher.total_students ??
    rawAssignments.reduce((acc, a) => acc + (a.students_count || 0), 0);

  const coordinatorOptions = useMemo(() => {
    const list = [];
    (courses || []).forEach((c) => {
      const semDetails = c.semester_details || [];
      semDetails.forEach((s) => {
        const isCurrent =
          s.id === teacher.coordinator_semester_id ||
          s.coordinator_teacher_id === teacher.id;
        const isTakenByOther =
          Boolean(s.coordinator_teacher_id) && s.coordinator_teacher_id !== teacher.id;
        list.push({
          id: s.id,
          label: `${c.code || c.name} · Semester ${s.semester_number}`,
          courseName: c.name,
          isCurrent,
          isTakenByOther,
          takenByName: s.coordinator_teacher_name,
        });
      });
    });
    return list;
  }, [courses, teacher]);

  const isCoordinator = Boolean(
    teacher.is_class_coordinator || teacher.coordinator_semester_id
  );
  const coordinatorLabel =
    teacher.coordinator_label ||
    (teacher.coordinator_course && teacher.coordinator_semester_number
      ? `${teacher.coordinator_course} · Semester ${teacher.coordinator_semester_number}`
      : teacher.coordinator_semester ||
        (teacher.coordinator_semester_number
          ? `Semester ${teacher.coordinator_semester_number}`
          : ''));

  const handleSelectSemester = async (semesterId) => {
    setCoordModalVisible(false);
    if (onAssignCoordinator) {
      await onAssignCoordinator(semesterId);
    }
  };

  return (
    <View className="flex-1 bg-[#F5F6FA]">
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-5 pt-3.5 pb-2.5">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          className="w-10 h-10 rounded-xl bg-white border border-slate-200 items-center justify-center shadow-xs"
        >
          <ChevronLeft size={20} color="#0F172A" strokeWidth={2.5} />
        </TouchableOpacity>

        <Text className="text-[17px] font-bold text-[#0F172A]">
          Teacher details
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
        {/* Profile Block */}
        <View className="items-center my-3">
          <View className="w-20 h-20 rounded-[22px] bg-[#EEF2FF] items-center justify-center overflow-hidden mb-3">
            {photo ? (
              <Image
                source={{ uri: photo }}
                className="w-full h-full"
                resizeMode="cover"
              />
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
            {designation} · {department}
          </Text>

          <Text className="text-[13px] font-medium text-[#64748B] mt-0.5 text-center">
            {phone}{email ? ` · ${email}` : ''}
          </Text>
        </View>

        {/* 3 Mini Stat Cards */}
        <View className="flex-row gap-3 my-3">
          <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 items-center shadow-xs">
            <Text className="text-[22px] font-bold text-[#0F172A]">
              {classesPerWeek}
            </Text>
            <Text className="text-[11px] font-medium text-[#64748B] mt-0.5 text-center">
              Classes / week
            </Text>
          </View>

          <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 items-center shadow-xs">
            <Text className="text-[22px] font-bold text-[#0F172A]">
              {totalSubjects}
            </Text>
            <Text className="text-[11px] font-medium text-[#64748B] mt-0.5 text-center">
              Subjects
            </Text>
          </View>

          <View className="flex-1 bg-white rounded-2xl p-4 border border-slate-100 items-center shadow-xs">
            <Text className="text-[22px] font-bold text-[#0F172A]">
              {totalStudents}
            </Text>
            <Text className="text-[11px] font-medium text-[#64748B] mt-0.5 text-center">
              Students
            </Text>
          </View>
        </View>

        {/* Class Coordinator Card (View + Direct Assign/Change) */}
        <View
          className={`rounded-2xl p-4 border my-2 flex-row items-center justify-between ${
            isCoordinator
              ? 'bg-amber-50/80 border-amber-200'
              : 'bg-white border-slate-200'
          }`}
        >
          <View className="flex-row items-center flex-1 mr-3">
            <View
              className={`w-11 h-11 rounded-xl items-center justify-center mr-3 ${
                isCoordinator ? 'bg-amber-100' : 'bg-slate-100'
              }`}
            >
              <Award
                size={20}
                color={isCoordinator ? '#B45309' : '#64748B'}
                strokeWidth={2.2}
              />
            </View>

            <View className="flex-1">
              <Text
                className={`text-[11px] font-bold uppercase tracking-wider ${
                  isCoordinator ? 'text-amber-700' : 'text-slate-400'
                }`}
              >
                Class Coordinator
              </Text>
              <Text
                numberOfLines={1}
                className={`text-[15px] font-bold mt-0.5 ${
                  isCoordinator ? 'text-amber-950' : 'text-slate-700'
                }`}
              >
                {isCoordinator ? coordinatorLabel : 'Not assigned yet'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            disabled={isAssigningCoordinator}
            onPress={() => setCoordModalVisible(true)}
            className={`px-3.5 py-2 rounded-xl flex-row items-center ${
              isCoordinator
                ? 'bg-white border border-amber-300'
                : 'bg-[#2563EB]'
            }`}
          >
            {isAssigningCoordinator ? (
              <ActivityIndicator
                size="small"
                color={isCoordinator ? '#B45309' : '#FFFFFF'}
              />
            ) : (
              <>
                {!isCoordinator && (
                  <Plus size={14} color="#FFFFFF" strokeWidth={2.5} style={{ marginRight: 4 }} />
                )}
                <Text
                  className={`text-xs font-bold ${
                    isCoordinator ? 'text-amber-800' : 'text-white'
                  }`}
                >
                  {isCoordinator ? 'Change' : 'Assign'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Section: Weekly Timetable */}
        <View className="mt-4 mb-4">
          <View className="flex-row items-center justify-between mb-2.5">
            <View className="flex-row items-center">
              <Calendar size={18} color="#0F172A" strokeWidth={2.2} />
              <Text className="text-[17px] font-bold text-[#0F172A] ml-2">
                Weekly Timetable
              </Text>
            </View>
            <Text className="text-xs font-semibold text-slate-500">
              {filteredTimetable.length} {filteredTimetable.length === 1 ? 'slot' : 'slots'}
            </Text>
          </View>

          {/* Day Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-3"
            contentContainerStyle={{ gap: 8 }}
          >
            {['All', ...SHORT_DAYS].map((day) => {
              const active = selectedDay === day;
              const isToday = day === getTodayShortDay();
              return (
                <TouchableOpacity
                  key={day}
                  activeOpacity={0.75}
                  onPress={() => setSelectedDay(day)}
                  className={`px-3.5 py-1.5 rounded-full border ${
                    active
                      ? 'bg-[#2563EB] border-[#2563EB]'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold ${
                      active
                        ? 'text-white'
                        : isToday
                        ? 'text-[#2563EB]'
                        : 'text-slate-600'
                    }`}
                  >
                    {day}
                    {isToday && !active ? ' · Today' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Timetable List */}
          {filteredTimetable.length > 0 ? (
            <View className="gap-2.5">
              {filteredTimetable.map((item) => (
                <View
                  key={item.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex-row items-center"
                >
                  {/* Left Day & Time Block */}
                  <View
                    className={`w-[74px] py-2 px-2 rounded-xl items-center justify-center mr-3.5 ${
                      item.isToday ? 'bg-[#2563EB]' : 'bg-[#EEF2FF]'
                    }`}
                  >
                    <Text
                      className={`text-[12px] font-extrabold ${
                        item.isToday ? 'text-white' : 'text-[#2563EB]'
                      }`}
                    >
                      {item.day}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className={`text-[10px] font-semibold mt-0.5 ${
                        item.isToday ? 'text-blue-100' : 'text-[#3446D4]'
                      }`}
                    >
                      {item.startTime}
                    </Text>
                  </View>

                  {/* Middle Subject + Details */}
                  <View className="flex-1 mr-2">
                    <View className="flex-row items-center">
                      <Text
                        numberOfLines={1}
                        className="text-[15px] font-bold text-[#0F172A] flex-1"
                      >
                        {item.subject}
                      </Text>
                      {item.subjectCode ? (
                        <View className="px-2 py-0.5 rounded-md bg-slate-100 ml-2">
                          <Text className="text-[10px] font-bold text-slate-600">
                            {item.subjectCode}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {item.courseSemLabel ? (
                      <Text
                        numberOfLines={1}
                        className="text-[12px] font-semibold text-[#2563EB] mt-0.5"
                      >
                        {item.courseSemLabel}
                      </Text>
                    ) : null}

                    <View className="flex-row items-center flex-wrap gap-x-3 gap-y-1 mt-1.5">
                      <View className="flex-row items-center">
                        <Clock size={12} color="#64748B" />
                        <Text className="text-[11px] font-medium text-slate-500 ml-1">
                          {item.timeRange}
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <MapPin size={12} color="#64748B" />
                        <Text className="text-[11px] font-medium text-slate-500 ml-1">
                          {item.room}
                        </Text>
                      </View>

                      {item.studentsCount > 0 ? (
                        <View className="flex-row items-center">
                          <Users size={12} color="#64748B" />
                          <Text className="text-[11px] font-medium text-slate-500 ml-1">
                            {item.studentsCount}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-white rounded-2xl p-6 border border-slate-100 items-center justify-center">
              <Calendar size={28} color="#94A3B8" strokeWidth={1.8} />
              <Text className="text-sm font-bold text-slate-700 mt-2">
                {selectedDay === 'All'
                  ? 'No classes assigned yet'
                  : `No classes scheduled on ${selectedDay}`}
              </Text>
              <Text className="text-xs text-slate-400 mt-0.5 text-center">
                {selectedDay === 'All'
                  ? 'Assign subjects to this teacher from Courses to see their timetable.'
                  : 'Tap "All" to view the full weekly schedule.'}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Actions */}
        <View className="mt-3 gap-2.5 mb-6">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onEdit}
            className="w-full h-12 rounded-2xl bg-[#2563EB] items-center justify-center shadow-xs"
          >
            <Text className="text-[15px] font-bold text-white">Edit teacher</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onRemove}
            className="w-full h-12 rounded-2xl bg-[#FEE2E2]/60 items-center justify-center"
          >
            <Text className="text-[15px] font-bold text-[#DC2626]">
              Delete teacher
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Direct Class Coordinator Assignment Bottom Sheet Modal */}
      <Modal
        visible={coordModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setCoordModalVisible(false)}
      >
        <View className="flex-1 bg-black/45 justify-end">
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setCoordModalVisible(false)}
          />

          <View className="bg-white rounded-t-[28px] max-h-[75%] border-t border-slate-100 shadow-2xl z-10">
            <View className="flex-row items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
              <View>
                <Text className="text-[17px] font-bold text-slate-900">
                  Assign Class Coordinator
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  Select a semester for {name}
                </Text>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setCoordModalVisible(false)}
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
              {isCoordinator && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleSelectSemester(null)}
                  className="p-3.5 rounded-2xl border border-red-200 bg-red-50/60 mb-2.5 flex-row items-center justify-between"
                >
                  <View>
                    <Text className="text-sm font-bold text-red-700">
                      Remove Class Coordinator
                    </Text>
                    <Text className="text-xs text-red-500 mt-0.5">
                      Unassign from {coordinatorLabel}
                    </Text>
                  </View>
                  <X size={16} color="#DC2626" />
                </TouchableOpacity>
              )}

              {coordinatorOptions.length > 0 ? (
                coordinatorOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.75}
                    onPress={() => handleSelectSemester(opt.id)}
                    className={`p-3.5 rounded-2xl border mb-2 flex-row items-center justify-between ${
                      opt.isCurrent
                        ? 'bg-amber-50 border-amber-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <View className="flex-1 mr-3">
                      <Text
                        className={`text-sm font-bold ${
                          opt.isCurrent ? 'text-amber-900' : 'text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        className={`text-xs mt-0.5 ${
                          opt.isTakenByOther
                            ? 'text-orange-600 font-semibold'
                            : opt.isCurrent
                            ? 'text-amber-700 font-semibold'
                            : 'text-slate-400'
                        }`}
                      >
                        {opt.isCurrent
                          ? 'Currently assigned to this teacher'
                          : opt.isTakenByOther
                          ? `Already assigned to ${opt.takenByName}`
                          : 'Available'}
                      </Text>
                    </View>

                    {opt.isCurrent && (
                      <View className="w-7 h-7 rounded-full bg-amber-500 items-center justify-center">
                        <Check size={14} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))
              ) : (
                <View className="py-8 items-center">
                  <Text className="text-sm font-semibold text-slate-500">
                    No semesters found
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
