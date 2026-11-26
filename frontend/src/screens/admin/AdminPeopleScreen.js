import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { safeNavigate, safePush } from '../../utils/navigation';
import {
  Search,
  X,
  Plus,
  Check,
  QrCode,
} from 'lucide-react-native';
import { Text } from '../../components/ui/text';
import { Skeleton } from '../../components/ui/Skeleton';
import InviteLinkModal from '../../components/admin/InviteLinkModal';

import {
  PeopleCard,
  EditTeacherModal,
  EditStudentModal,
} from '../../components/admin/people';

import {
  useAdminTeachers,
  useAdminStudents,
  useAdminCourses,
  useCreateTeacher,
  useUpdateTeacher,
  useCreateStudent,
  useUpdateStudent,
} from '../../hooks/useAdmin';

const DEFAULT_COURSES = [
  'All',
  'B.Tech CSE',
  'B.Tech ECE',
  'BBA',
  'B.Com',
  'MBA',
];

const DEFAULT_SEMESTERS = [
  'All',
  'Sem 1',
  'Sem 2',
  'Sem 3',
  'Sem 4',
  'Sem 5',
  'Sem 6',
];

// Fallback college roster if backend DB has no records yet
const INITIAL_TEACHERS = [
  {
    id: 1,
    name: 'Dr. Anita Verma',
    qualification: 'Professor',
    specialization: 'B.Tech CSE',
    phone: '+91 98100 11223',
    email: 'anita.verma@college.edu',
    assignments_count: 3,
    is_active: true,
  },
  {
    id: 2,
    name: 'Dr. Suresh Rao',
    qualification: 'Associate Professor',
    specialization: 'B.Tech ECE',
    phone: '+91 98100 22334',
    email: 'suresh.rao@college.edu',
    assignments_count: 3,
    is_active: true,
  },
  {
    id: 3,
    name: 'Meera Kapoor',
    qualification: 'Assistant Professor',
    specialization: 'BBA',
    phone: '+91 98100 33445',
    email: 'meera.kapoor@college.edu',
    assignments_count: 3,
    is_active: true,
  },
  {
    id: 4,
    name: 'Rahul Mehta',
    qualification: 'Professor',
    specialization: 'B.Com',
    phone: '+91 98100 44556',
    email: 'rahul.mehta@college.edu',
    assignments_count: 3,
    is_active: true,
  },
  {
    id: 5,
    name: 'Priya Nair',
    qualification: 'Associate Professor',
    specialization: 'MBA',
    phone: '+91 98100 55667',
    email: 'priya.nair@college.edu',
    assignments_count: 3,
    is_active: true,
  },
  {
    id: 6,
    name: 'Karan Bhatia',
    qualification: 'Assistant Professor',
    specialization: 'B.Tech CSE',
    phone: '+91 98100 66778',
    email: 'karan.bhatia@college.edu',
    assignments_count: 3,
    is_active: true,
  },
];

const INITIAL_STUDENTS = [
  {
    id: 101,
    name: 'Aarav Gupta',
    roll_number: 'CS21-007',
    course: 'B.Tech CSE',
    semester_number: 3,
    phone: '+91 98765 00112',
    email: 'aarav.gupta@college.edu',
    attendance_percentage: 84,
  },
  {
    id: 102,
    name: 'Diya Singh',
    roll_number: 'EC20-021',
    course: 'B.Tech ECE',
    semester_number: 5,
    phone: '+91 98765 00113',
    email: 'diya.singh@college.edu',
    attendance_percentage: 75,
  },
  {
    id: 103,
    name: 'Kabir Malhotra',
    roll_number: 'CS20-014',
    course: 'B.Tech CSE',
    semester_number: 5,
    phone: '+91 98765 00114',
    email: 'kabir.malhotra@college.edu',
    attendance_percentage: 66,
  },
  {
    id: 104,
    name: 'Sneha Joshi',
    roll_number: 'BB22-018',
    course: 'BBA',
    semester_number: 2,
    phone: '+91 98765 00115',
    email: 'sneha.joshi@college.edu',
    attendance_percentage: 83,
  },
];

export default function AdminPeopleScreen({
  user,
  mode = 'teachers',
  initialGroup,
  initialCourseFilter,
}) {
  const activeTab = mode || (initialGroup === 'students' ? 'students' : 'teachers');

  // Search & Filter State matching screenshot 1
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(
    initialCourseFilter ? String(initialCourseFilter) : 'All'
  );
  const [selectedSemester, setSelectedSemester] = useState('All');

  useEffect(() => {
    if (initialCourseFilter) {
      setSelectedCourse(String(initialCourseFilter));
      setSelectedSemester('All');
    }
  }, [initialCourseFilter]);

  // Edit/Add Modal States
  const [editTeacherModalVisible, setEditTeacherModalVisible] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);

  const [editStudentModalVisible, setEditStudentModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Toast & Invite Modal State
  const [toastMessage, setToastMessage] = useState(null);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);

  // Queries
  const {
    data: rawTeachers = [],
    isLoading: teachersLoading,
    refetch: refetchTeachers,
    isRefetching: teachersRefetching,
  } = useAdminTeachers();

  const {
    data: rawStudents = [],
    isLoading: studentsLoading,
    refetch: refetchStudents,
    isRefetching: studentsRefetching,
  } = useAdminStudents();

  const { data: courses = [], refetch: refetchCourses } = useAdminCourses();

  // Mutations
  const createTeacherMutation = useCreateTeacher();
  const updateTeacherMutation = useUpdateTeacher();

  const createStudentMutation = useCreateStudent();
  const updateStudentMutation = useUpdateStudent();

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Combine real API data with fallback
  const allTeachers = useMemo(() => {
    if (rawTeachers && rawTeachers.length > 0) return rawTeachers;
    return INITIAL_TEACHERS;
  }, [rawTeachers]);

  const allStudents = useMemo(() => {
    if (rawStudents && rawStudents.length > 0) return rawStudents;
    return INITIAL_STUDENTS;
  }, [rawStudents]);

  // Dynamic Course Options
  const courseOptions = useMemo(() => {
    if (courses && courses.length > 0) {
      const list = ['All'];
      courses.forEach((c) => {
        if (c.code && !list.includes(c.code)) list.push(c.code);
      });
      return list;
    }
    return DEFAULT_COURSES;
  }, [courses]);

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    let result = allTeachers;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((t) => {
        const name = (t.name || t.user?.username || '').toLowerCase();
        const phone = (t.phone || '').toLowerCase();
        const code = (t.employee_code || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || code.includes(q);
      });
    }

    if (selectedCourse !== 'All') {
      result = result.filter((t) => {
        const spec = (t.specialization || '').toUpperCase();
        const assignmentsMatch = (t.assignments || []).some(
          (a) => (a.course?.code || a.course_code || '').toUpperCase() === selectedCourse.toUpperCase()
        );
        return spec.includes(selectedCourse.toUpperCase()) || assignmentsMatch;
      });
    }

    return result;
  }, [allTeachers, searchQuery, selectedCourse]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    let result = allStudents;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((s) => {
        const name = (s.name || s.user?.username || '').toLowerCase();
        const roll = (s.roll_number || '').toLowerCase();
        const phone = (s.phone || '').toLowerCase();
        return name.includes(q) || roll.includes(q) || phone.includes(q);
      });
    }

    if (selectedCourse !== 'All') {
      result = result.filter((s) => {
        const code = (s.course || s.current_enrollment?.course?.code || '').toUpperCase();
        return code === selectedCourse.toUpperCase();
      });
    }

    if (selectedSemester !== 'All') {
      const targetSem = selectedSemester.replace(/[^0-9]/g, '');
      result = result.filter((s) => {
        const semNum = String(
          s.semester_number || (s.semester ? s.semester.replace(/[^0-9]/g, '') : '')
        );
        return semNum === targetSem;
      });
    }

    return result;
  }, [allStudents, searchQuery, selectedCourse, selectedSemester]);

  const handleRefresh = () => {
    if (activeTab === 'teachers') {
      refetchTeachers();
    } else {
      refetchStudents();
    }
  };

  // Submit Teacher (Edit or Add)
  const handleSaveTeacher = async (payload) => {
    try {
      if (editingTeacher && editingTeacher.id) {
        await updateTeacherMutation.mutateAsync({
          teacherId: editingTeacher.id,
          data: payload,
        });
        showToast('Teacher updated');
      } else {
        await createTeacherMutation.mutateAsync(payload);
        showToast('Teacher added');
      }
      setEditTeacherModalVisible(false);
      refetchTeachers();
      refetchCourses();
    } catch (err) {
      alert(err?.message || 'Failed to save teacher');
    }
  };

  // Submit Student (Edit or Add)
  const handleSaveStudent = async (payload) => {
    try {
      if (editingStudent && editingStudent.id) {
        await updateStudentMutation.mutateAsync({
          studentId: editingStudent.id,
          data: payload,
        });
        showToast('Student updated');
      } else {
        await createStudentMutation.mutateAsync(payload);
        showToast('Student added');
      }
      setEditStudentModalVisible(false);
      refetchStudents();
    } catch (err) {
      alert(err?.message || 'Failed to save student');
    }
  };

  // =========================================================================
  // SCREEN 1: LIST VIEW (matching Screenshot 1)
  // =========================================================================
  const foundCount =
    activeTab === 'teachers'
      ? `${filteredTeachers.length} teachers found`
      : `${filteredStudents.length} students found`;

  const isLoading =
    activeTab === 'teachers' ? teachersLoading : studentsLoading;

  return (
    <View className="flex-1 bg-[#F5F6FA] relative">
      {/* Toast Alert */}
      {toastMessage && (
        <View className="absolute top-3 left-4 right-4 z-50 bg-[#117A45] rounded-2xl py-3 px-4 flex-row items-center justify-between shadow-lg">
          <View className="flex-row items-center gap-2">
            <Check size={16} color="#FFFFFF" strokeWidth={2.6} />
            <Text className="text-xs font-bold text-white">{toastMessage}</Text>
          </View>
          <TouchableOpacity onPress={() => setToastMessage(null)}>
            <X size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 132 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={teachersRefetching || studentsRefetching}
            onRefresh={handleRefresh}
            tintColor="#2563EB"
          />
        }
      >
        {/* Title: Teachers & students matching Screenshot 1 */}
        <View className="px-5 pt-4 pb-2">
          <View className="flex-row items-center justify-between mb-3.5">
            <Text className="text-[24px] font-bold text-[#0F172A] tracking-tight">
              Teachers & students
            </Text>
            {activeTab === 'teachers' && (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setInviteModalVisible(true)}
                className="flex-row items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full"
              >
                <QrCode size={15} color="#2563EB" strokeWidth={2.2} />
                <Text className="text-xs font-bold text-blue-600">Invite QR</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Search Bar with Search Icon */}
          <View className="bg-white rounded-[16px] px-3.5 flex-row items-center border border-slate-200/80 h-12 shadow-xs mb-3.5">
            <Search size={18} color="#94A3B8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={
                activeTab === 'teachers'
                  ? 'Search by name or phone'
                  : 'Search by name, roll no. or phone'
              }
              placeholderTextColor="#94A3B8"
              className="flex-1 ml-2.5 text-[14px] font-semibold text-slate-900"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                className="w-6 h-6 rounded-full bg-slate-100 items-center justify-center"
              >
                <X size={14} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          {/* Segmented Page Switcher */}
          <View className="bg-[#E2E8F0]/70 p-1 rounded-2xl flex-row items-center mb-4">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (activeTab === 'teachers') return;
                safeNavigate('/users/teachers');
              }}
              className={`flex-1 py-2.5 rounded-[14px] items-center justify-center ${
                activeTab === 'teachers'
                  ? 'bg-white'
                  : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-[14px] font-bold ${
                  activeTab === 'teachers' ? 'text-[#0F172A]' : 'text-[#64748B]'
                }`}
              >
                Teachers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                if (activeTab === 'students') return;
                safeNavigate('/users/students');
              }}
              className={`flex-1 py-2.5 rounded-[14px] items-center justify-center ${
                activeTab === 'students'
                  ? 'bg-white'
                  : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-[14px] font-bold ${
                  activeTab === 'students' ? 'text-[#0F172A]' : 'text-[#64748B]'
                }`}
              >
                Students
              </Text>
            </TouchableOpacity>
          </View>

          {/* Filter 1: Course matching Screenshot 1 */}
          <View className="mb-2">
            <Text className="text-xs font-medium text-[#64748B] mb-1.5">
              Course
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="py-0.5"
            >
              <View className="flex-row gap-2">
                {courseOptions.map((c) => {
                  const isSel = selectedCourse === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      activeOpacity={0.7}
                      onPress={() => setSelectedCourse(c)}
                      className={`px-4 py-1.5 rounded-full border ${
                        isSel
                          ? 'bg-[#0F172A] border-[#0F172A]'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSel ? 'text-white' : 'text-slate-800'
                        }`}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Filter 2: Semester matching Screenshot 1 */}
          <View className="mb-2.5">
            <Text className="text-xs font-medium text-[#64748B] mb-1.5">
              Semester
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="py-0.5"
            >
              <View className="flex-row gap-2">
                {DEFAULT_SEMESTERS.map((s) => {
                  const isSel = selectedSemester === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      activeOpacity={0.7}
                      onPress={() => setSelectedSemester(s)}
                      className={`px-4 py-1.5 rounded-full border ${
                        isSel
                          ? 'bg-[#0F172A] border-[#0F172A]'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSel ? 'text-white' : 'text-slate-800'
                        }`}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Count Indicator matching Screenshot 1 */}
          <View className="pt-1 pb-2">
            <Text className="text-[12.5px] font-medium text-[#64748B]">
              {foundCount}
            </Text>
          </View>
        </View>

        {/* Cards List matching Screenshot 1 */}
        <View className="px-5 gap-3">
          {isLoading ? (
            [1, 2, 3, 4, 5].map((k) => (
              <View
                key={k}
                className="bg-white rounded-[20px] p-4 border border-slate-100 flex-row items-center gap-3.5 min-h-[76px]"
              >
                <Skeleton width={48} height={48} borderRadius={16} />
                <View className="flex-1 gap-1.5">
                  <Skeleton width={140} height={16} borderRadius={4} />
                  <Skeleton width={110} height={12} borderRadius={4} />
                  <View className="flex-row gap-2 mt-1">
                    <Skeleton width={70} height={14} borderRadius={4} />
                    <Skeleton width={80} height={14} borderRadius={4} />
                  </View>
                </View>
              </View>
            ))
          ) : activeTab === 'teachers' ? (
            filteredTeachers.map((teacher, index) => (
              <PeopleCard
                key={teacher.id || index}
                type="teacher"
                data={teacher}
                index={index}
                onPress={() => safePush(`/users/teachers/${teacher.id}`)}
              />
            ))
          ) : (
            filteredStudents.map((student, index) => (
              <PeopleCard
                key={student.id || index}
                type="student"
                data={student}
                index={index}
                onPress={() => safePush(`/users/students/${student.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating "+" Button in deep blue matching Screenshot 1 */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          if (activeTab === 'teachers') {
            setEditingTeacher(null);
            setEditTeacherModalVisible(true);
          } else {
            setEditingStudent(null);
            setEditStudentModalVisible(true);
          }
        }}
        accessibilityRole="button"
        className="absolute bottom-24 right-5 w-14 h-14 rounded-2xl bg-[#2563EB] items-center justify-center shadow-lg"
        style={{
          shadowColor: '#2563EB',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 10,
          elevation: 8,
        }}
      >
        <Plus size={26} color="#FFFFFF" strokeWidth={2.8} />
      </TouchableOpacity>

      {/* Teacher Invite QR Modal */}
      <InviteLinkModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        type="teacher"
      />

      {/* Edit/Add Teacher Modal */}
      <EditTeacherModal
        visible={editTeacherModalVisible}
        teacher={editingTeacher}
        courses={courses}
        onClose={() => setEditTeacherModalVisible(false)}
        onSubmit={handleSaveTeacher}
        isSubmitting={updateTeacherMutation.isPending || createTeacherMutation.isPending}
      />

      {/* Edit/Add Student Modal */}
      <EditStudentModal
        visible={editStudentModalVisible}
        student={editingStudent}
        courses={courses}
        onClose={() => setEditStudentModalVisible(false)}
        onSubmit={handleSaveStudent}
        isSubmitting={updateStudentMutation.isPending || createStudentMutation.isPending}
      />
    </View>
  );
}
