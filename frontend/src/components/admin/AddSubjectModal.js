import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {
  CheckCircle2,
  XCircle,
  Search,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  User,
  X,
} from 'lucide-react-native';
import { Text } from '../ui/text';
import KeyboardSafeView from '../ui/KeyboardSafeView';
import SchedulePicker from '../ui/SchedulePicker';
import { useCreateSubject, useAdminTeachers, useBookedRoomSlots } from '../../hooks/useAdmin';
import { getTeacherAvailability, getRoomConflict } from '../../utils/scheduleConflict';

const ROOM_PRESETS = [
  'Block B, Hall 3',
  'Lab 1',
  'Lab 2',
  'Seminar Hall',
  'Room 101',
  'Room 204',
];

export default function AddSubjectModal({
  visible,
  course,
  semester,
  semesterId,
  onClose,
  onSuccess,
  onError,
}) {
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [subjectRoom, setSubjectRoom] = useState('Block B, Hall 3');
  const [subjectSchedule, setSubjectSchedule] = useState('Mon, Wed, Fri - 10:15 AM - 11:45 AM');
  const [subjectTeacherId, setSubjectTeacherId] = useState('');
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');
  const [teacherNotice, setTeacherNotice] = useState('');
  const [validationError, setValidationError] = useState('');

  const createSubjectMutation = useCreateSubject();
  const { data: teachers = [], isLoading: teachersLoading } = useAdminTeachers();
  const { data: bookedRoomSlots = [] } = useBookedRoomSlots({ enabled: visible });

  // Instant in-memory room conflict check (no API call per click)
  const roomCheck = useMemo(() => {
    const cleanRoom = subjectRoom.trim();
    const cleanSched = subjectSchedule.trim();
    if (!cleanRoom || !cleanSched) return { available: true, message: '' };
    const result = getRoomConflict(cleanRoom, cleanSched, bookedRoomSlots);
    if (result.available) return { available: true, message: '' };
    const c = result.conflict;
    return {
      available: false,
      message: `Room '${cleanRoom}' is booked on ${c.dayName} (${c.timeRange}) for '${c.subjectName}'. Choose another room or day/time.`,
    };
  }, [subjectRoom, subjectSchedule, bookedRoomSlots]);

  const resolvedSemester = semester || course?.semesters?.[0] || 'Semester 1';

  // Compute live availability per teacher for the selected schedule
  const teachersWithAvailability = useMemo(() => {
    return (teachers || []).map((t) => ({
      ...t,
      availability: getTeacherAvailability(t, subjectSchedule),
    }));
  }, [teachers, subjectSchedule]);

  // Unique specializations extracted from teacher records
  const specializationOptions = useMemo(() => {
    const set = new Set();
    (teachers || []).forEach((t) => {
      if (t.specialization && String(t.specialization).trim()) {
        set.add(String(t.specialization).trim());
      }
    });
    return Array.from(set).sort();
  }, [teachers]);

  // Filter teachers by specialization & search query
  const filteredTeachers = useMemo(() => {
    const q = teacherSearch.trim().toLowerCase();
    return teachersWithAvailability.filter((t) => {
      if (
        selectedSpecialization !== 'all' &&
        (t.specialization || '').trim().toLowerCase() !== selectedSpecialization.toLowerCase()
      ) {
        return false;
      }
      if (!q) return true;
      return (
        (t.name || '').toLowerCase().includes(q) ||
        (t.employee_code || '').toLowerCase().includes(q) ||
        (t.specialization || '').toLowerCase().includes(q) ||
        (t.qualification || '').toLowerCase().includes(q) ||
        (t.email || '').toLowerCase().includes(q)
      );
    });
  }, [teachersWithAvailability, selectedSpecialization, teacherSearch]);

  const availableCount = useMemo(
    () => teachersWithAvailability.filter((t) => t.availability.available).length,
    [teachersWithAvailability]
  );

  const selectedTeacher = teachersWithAvailability.find(
    (t) => String(t.id) === String(subjectTeacherId)
  );

  // If schedule changes and currently selected teacher clashes, auto-deselect cleanly
  useEffect(() => {
    if (!subjectTeacherId) {
      setTeacherNotice('');
      return;
    }
    const current = teachersWithAvailability.find(
      (t) => String(t.id) === String(subjectTeacherId)
    );
    if (current && !current.availability.available) {
      const c = current.availability.conflict;
      setSubjectTeacherId('');
      setTeacherNotice(
        `${current.name || 'Selected teacher'} is not available on ${c?.dayName} (${c?.timeRange}) and was unselected.`
      );
    }
  }, [teachersWithAvailability, subjectTeacherId]);

  const handleClose = () => {
    setSubjectName('');
    setSubjectCode('');
    setSubjectTeacherId('');
    setIsTeacherDropdownOpen(false);
    setTeacherSearch('');
    setSelectedSpecialization('all');
    setTeacherNotice('');
    setValidationError('');
    onClose?.();
  };

  const handleAdd = () => {
    if (!course) return;
    if (!subjectName.trim() || !subjectCode.trim()) {
      setValidationError('Subject Name and Subject Code are required.');
      return;
    }
    if (!subjectRoom.trim()) {
      setValidationError('Classroom / Room is required.');
      return;
    }
    if (roomCheck.available === false) {
      setValidationError(
        roomCheck.message ||
          `Room '${subjectRoom.trim()}' is not available at this time. Please choose another room or change the timing.`
      );
      return;
    }
    if (selectedTeacher && !selectedTeacher.availability.available) {
      setValidationError('Selected teacher is not available for this schedule.');
      return;
    }

    setValidationError('');

    createSubjectMutation.mutate(
      {
        courseId: course.id,
        data: {
          name: subjectName.trim(),
          code: subjectCode.trim().toUpperCase(),
          semester_id: semesterId || undefined,
          semester: resolvedSemester,
          room: subjectRoom.trim(),
          schedule: subjectSchedule.trim(),
          teacher_id: subjectTeacherId ? Number(subjectTeacherId) : undefined,
        },
      },
      {
        onSuccess: (data) => {
          const addedName = subjectName.trim();
          handleClose();
          onSuccess?.(data, addedName);
        },
        onError: (err) => {
          const msg =
            err?.data?.message ||
            err?.response?.data?.message ||
            err?.message ||
            'Could not add subject.';
          setValidationError(msg);
          onError?.(err);
        },
      }
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardSafeView className="bg-black/50 justify-end">
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View
          style={{ maxHeight: '90%', display: 'flex', flexDirection: 'column' }}
          className="bg-white rounded-t-3xl p-5 border-t border-slate-200/80 shadow-2xl z-10"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
            <View className="flex-1 mr-2">
              <Text className="text-lg font-medium text-slate-900">
                Add Subject ({course?.code})
              </Text>
              <Text className="text-xs font-medium text-slate-500 mt-0.5">
                Adding to {resolvedSemester} • Room & teacher conflict checks active
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
            >
              <X size={16} color="#64748b" />
            </TouchableOpacity>
          </View>

          {validationError ? (
            <View className="bg-red-50 border border-red-200 p-2.5 rounded-2xl mt-3 flex-row items-start gap-2">
              <AlertTriangle size={15} color="#dc2626" />
              <Text className="text-xs font-medium text-red-700 flex-1">{validationError}</Text>
            </View>
          ) : null}

          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={{ paddingVertical: 12, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {/* Subject Code & Name */}
            <Text className="text-xs font-medium text-slate-700 mb-1">Subject Code</Text>
            <TextInput
              value={subjectCode}
              onChangeText={setSubjectCode}
              placeholder="e.g. CS-401, BCA-201"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
              className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-medium text-slate-900 mb-3"
            />

            <Text className="text-xs font-medium text-slate-700 mb-1">Subject Name</Text>
            <TextInput
              value={subjectName}
              onChangeText={setSubjectName}
              placeholder="e.g. Computer Vision"
              placeholderTextColor="#94a3b8"
              className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs font-medium text-slate-900 mb-3"
            />

            {/* Classroom / Room with Live Conflict Check */}
            <View className="mb-3">
              <Text className="text-xs font-medium text-slate-700 mb-1">Classroom / Room</Text>
              <TextInput
                value={subjectRoom}
                onChangeText={setSubjectRoom}
                placeholder="e.g. Block B, Hall 3"
                placeholderTextColor="#94a3b8"
                className={`bg-slate-50 border rounded-2xl px-3.5 py-2.5 text-xs font-medium text-slate-900 mb-1.5 ${
                  roomCheck.available === false ? 'border-red-300 bg-red-50/40' : 'border-slate-200'
                }`}
              />

              {/* Room Presets */}
              <View className="flex-row flex-wrap gap-1.5 mb-1.5">
                {ROOM_PRESETS.map((r) => {
                  const active = subjectRoom.trim().toLowerCase() === r.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={r}
                      activeOpacity={0.7}
                      onPress={() => setSubjectRoom(r)}
                      className={`px-2.5 py-1 rounded-full border ${
                        active ? 'bg-[#007AFF]/10 border-[#007AFF]/30' : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-medium ${
                          active ? 'text-[#007AFF]' : 'text-slate-500'
                        }`}
                      >
                        {r}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Room Status Indicator (instant, only warns if no free slot or conflict) */}
              {subjectRoom.trim() && roomCheck.available === false ? (
                <View className="bg-red-50 border border-red-200 rounded-xl px-2.5 py-2 flex-row items-start gap-1.5 mt-0.5">
                  <XCircle size={14} color="#dc2626" />
                  <Text className="text-[11px] font-medium text-red-700 flex-1">
                    {roomCheck.message}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Timetable Schedule Picker (filters out booked slots for selected room) */}
            <View className="mb-3">
              <SchedulePicker
                value={subjectSchedule}
                onChange={setSubjectSchedule}
                room={subjectRoom}
                bookedSlots={bookedRoomSlots}
                label="Class Timetable Schedule (Available Slots)"
              />
            </View>

            {/* Faculty / Teacher Assignment with Availability & Specialization Filter */}
            <View className="mb-3">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-xs font-medium text-slate-700">
                  Assign Faculty / Teacher ({availableCount}/{teachers.length} Available)
                </Text>
                {subjectTeacherId ? (
                  <TouchableOpacity
                    onPress={() => {
                      setSubjectTeacherId('');
                      setIsTeacherDropdownOpen(false);
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text className="text-[11px] font-medium text-red-600">Clear</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {teacherNotice ? (
                <View className="bg-amber-50 border border-amber-200 rounded-xl p-2 mb-2 flex-row items-start gap-1.5">
                  <AlertTriangle size={13} color="#d97706" />
                  <Text className="text-[11px] font-medium text-amber-800 flex-1">
                    {teacherNotice}
                  </Text>
                </View>
              ) : null}

              {/* Dropdown Trigger */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsTeacherDropdownOpen(!isTeacherDropdownOpen)}
                className="w-full min-h-[46px] px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 flex-row items-center justify-between"
              >
                <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                  <View
                    className={`w-7 h-7 rounded-full items-center justify-center ${
                      selectedTeacher ? 'bg-[#007AFF]/15' : 'bg-slate-200/70'
                    }`}
                  >
                    <User size={14} color={selectedTeacher ? '#007AFF' : '#64748b'} />
                  </View>
                  {selectedTeacher ? (
                    <View className="flex-1">
                      <Text className="text-xs font-medium text-slate-900" numberOfLines={1}>
                        {selectedTeacher.name ||
                          selectedTeacher.employee_code ||
                          `Teacher #${selectedTeacher.id}`}
                      </Text>
                      <Text className="text-[10px] font-medium text-slate-500" numberOfLines={1}>
                        {[selectedTeacher.employee_code, selectedTeacher.specialization, selectedTeacher.qualification]
                          .filter(Boolean)
                          .join(' • ') ||
                          selectedTeacher.email ||
                          'Faculty'}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-xs font-medium text-slate-500">
                      Select Available Faculty (Optional)...
                    </Text>
                  )}
                </View>

                {teachersLoading ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : isTeacherDropdownOpen ? (
                  <ChevronUp size={16} color="#64748b" />
                ) : (
                  <ChevronDown size={16} color="#64748b" />
                )}
              </TouchableOpacity>

              {/* Dropdown Options List with Specialization Filter & Availability Status */}
              {isTeacherDropdownOpen && (
                <View className="mt-2 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-lg">
                  {/* Search + Specialization Filter Header */}
                  <View className="p-2.5 bg-slate-50/80 border-b border-slate-100">
                    <View className="flex-row items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 mb-2">
                      <Search size={13} color="#94a3b8" />
                      <TextInput
                        value={teacherSearch}
                        onChangeText={setTeacherSearch}
                        placeholder="Search by name, code, or specialization..."
                        placeholderTextColor="#94a3b8"
                        className="flex-1 ml-2 text-xs font-medium text-slate-900 p-0"
                      />
                      {teacherSearch ? (
                        <TouchableOpacity onPress={() => setTeacherSearch('')}>
                          <X size={13} color="#94a3b8" />
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {specializationOptions.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 6 }}
                      >
                        {['all', ...specializationOptions].map((spec) => {
                          const isSpecActive =
                            selectedSpecialization.toLowerCase() === spec.toLowerCase();
                          return (
                            <TouchableOpacity
                              key={spec}
                              activeOpacity={0.75}
                              onPress={() => setSelectedSpecialization(spec)}
                              className={`px-2.5 py-1 rounded-full border ${
                                isSpecActive
                                  ? 'bg-[#007AFF] border-[#007AFF]'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <Text
                                className={`text-[10px] font-medium ${
                                  isSpecActive ? 'text-white' : 'text-slate-600'
                                }`}
                              >
                                {spec === 'all' ? 'All Specializations' : spec}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    )}
                  </View>

                  {teachersLoading ? (
                    <View className="p-4 items-center">
                      <ActivityIndicator size="small" color="#007AFF" />
                    </View>
                  ) : filteredTeachers.length === 0 ? (
                    <View className="p-4 items-center">
                      <Text className="text-xs font-medium text-slate-500">
                        {teachers.length === 0
                          ? 'No teachers registered yet'
                          : 'No teachers match this specialization or search'}
                      </Text>
                    </View>
                  ) : (
                    <ScrollView
                      style={{ maxHeight: 230 }}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={true}
                    >
                      {/* Unassigned Option */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => {
                          setSubjectTeacherId('');
                          setTeacherNotice('');
                          setIsTeacherDropdownOpen(false);
                        }}
                        className={`p-3 flex-row items-center justify-between border-b border-slate-100 ${
                          !subjectTeacherId ? 'bg-[#007AFF]/5' : ''
                        }`}
                      >
                        <View className="flex-row items-center gap-2.5">
                          <View className="w-7 h-7 rounded-full bg-slate-100 items-center justify-center">
                            <X size={13} color="#64748b" />
                          </View>
                          <Text
                            className={`text-xs font-medium ${
                              !subjectTeacherId ? 'text-[#007AFF]' : 'text-slate-700'
                            }`}
                          >
                            Unassigned (Assign Later)
                          </Text>
                        </View>
                        {!subjectTeacherId && <Check size={15} color="#007AFF" />}
                      </TouchableOpacity>

                      {/* Teacher Options with Available / Not Available Status */}
                      {filteredTeachers.map((t) => {
                        const isSelected = String(subjectTeacherId) === String(t.id);
                        const isAvailable = t.availability.available;
                        const conflict = t.availability.conflict;

                        return (
                          <TouchableOpacity
                            key={t.id}
                            disabled={!isAvailable}
                            activeOpacity={isAvailable ? 0.7 : 1}
                            onPress={() => {
                              if (!isAvailable) return;
                              setSubjectTeacherId(String(t.id));
                              setTeacherNotice('');
                              setIsTeacherDropdownOpen(false);
                            }}
                            className={`p-3 flex-row items-center justify-between border-b border-slate-100 ${
                              !isAvailable
                                ? 'bg-slate-50/80 opacity-60'
                                : isSelected
                                  ? 'bg-[#007AFF]/5'
                                  : 'bg-white'
                            }`}
                          >
                            <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                              <View
                                className={`w-7 h-7 rounded-full items-center justify-center ${
                                  !isAvailable
                                    ? 'bg-red-100'
                                    : isSelected
                                      ? 'bg-[#007AFF]/15'
                                      : 'bg-slate-100'
                                }`}
                              >
                                <User
                                  size={13}
                                  color={!isAvailable ? '#dc2626' : isSelected ? '#007AFF' : '#64748b'}
                                />
                              </View>
                              <View className="flex-1">
                                <Text
                                  className={`text-xs font-medium ${
                                    isSelected ? 'text-[#007AFF]' : 'text-slate-900'
                                  }`}
                                  numberOfLines={1}
                                >
                                  {t.name || t.employee_code || `Teacher #${t.id}`}
                                </Text>
                                <Text className="text-[10px] font-medium text-slate-500" numberOfLines={1}>
                                  {[t.employee_code, t.specialization, t.qualification]
                                    .filter(Boolean)
                                    .join(' • ') || t.email || ''}
                                </Text>
                                {!isAvailable && conflict ? (
                                  <Text className="text-[10px] font-medium text-red-600 mt-0.5" numberOfLines={1}>
                                    Busy: {conflict.dayName} {conflict.timeRange} • {conflict.subjectName}
                                  </Text>
                                ) : null}
                              </View>
                            </View>

                            {/* Availability Tick / Unavailable Badge */}
                            <View className="flex-row items-center gap-1.5">
                              {isAvailable ? (
                                <View className="flex-row items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 size={11} color="#059669" />
                                  <Text className="text-[10px] font-medium text-emerald-700">
                                    Available
                                  </Text>
                                </View>
                              ) : (
                                <View className="flex-row items-center gap-1 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                                  <XCircle size={11} color="#dc2626" />
                                  <Text className="text-[10px] font-medium text-red-600">
                                    Not Available
                                  </Text>
                                </View>
                              )}

                              {isSelected && isAvailable ? (
                                <Check size={14} color="#007AFF" />
                              ) : null}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          <View className="flex-row gap-2.5 pt-3 pb-1 border-t border-slate-100">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleClose}
              className="flex-1 h-11 rounded-2xl border border-slate-200 bg-slate-50 items-center justify-center"
            >
              <Text className="text-xs font-medium text-slate-700">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleAdd}
              disabled={createSubjectMutation.isPending || roomCheck.available === false}
              className={`flex-1 h-11 rounded-2xl items-center justify-center ${
                roomCheck.available === false ? 'bg-slate-300' : 'bg-[#007AFF]'
              }`}
            >
              {createSubjectMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-xs font-medium text-white">Add Subject</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardSafeView>
    </Modal>
  );
}
