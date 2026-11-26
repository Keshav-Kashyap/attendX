import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { Mail, Phone, Home, Sun, Shield, Check } from 'lucide-react-native';
import { Text } from '../../components/ui/text';
import { useAuthStore } from '../../store/useAuthStore';
import { useSaveTeacherProfile } from '../../hooks/useTeacher';
import { useSaveStudentProfile } from '../../hooks/useStudent';
import { useAdminCourses } from '../../hooks/useAdmin';
import EditTeacherModal from '../../components/admin/people/EditTeacherModal';
import EditStudentModal from '../../components/admin/people/EditStudentModal';

export default function ProfileScreen({ user, onLogout, onOpenBiometrics }) {
  const role = (user?.role || '').toLowerCase();
  const isTeacher = role === 'teacher';
  const isAdmin = role === 'admin';
  const isStudent = !isTeacher && !isAdmin;
  const studentProfile = user?.student_profile;
  const teacherProfile = user?.teacher_profile;

  const setUser = useAuthStore((state) => state.setUser);
  const saveTeacherMutation = useSaveTeacherProfile();
  const saveStudentMutation = useSaveStudentProfile();
  const { data: courses = [] } = useAdminCourses();

  const [showTeacherEdit, setShowTeacherEdit] = useState(false);
  const [showStudentEdit, setShowStudentEdit] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const displayName =
    user?.name ||
    user?.username ||
    (isAdmin ? 'Rohit Sharma' : isTeacher ? 'Dr. Anita Verma' : 'Aarav Gupta');

  const initials =
    displayName
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'RS';

  const userSubtitle = isAdmin
    ? 'College Administrator'
    : isTeacher
      ? (teacherProfile?.qualification
          ? `${teacherProfile.qualification} · ${teacherProfile.specialization || 'B.Tech CSE'}`
          : 'Faculty Member')
      : (studentProfile?.course
          ? `${studentProfile.course} · Sem ${studentProfile.semester_number || studentProfile.semester || '3'}`
          : 'College Student');

  const emailDisplay =
    user?.email ||
    (isAdmin
      ? 'rohit@brightpath.edu'
      : isTeacher
        ? 'anita@brightpath.edu'
        : 'aarav@brightpath.edu');

  const phoneDisplay =
    (isTeacher
      ? teacherProfile?.phone
      : isStudent
        ? studentProfile?.phone
        : user?.phone) ||
    user?.phone ||
    '+91 98765 43210';

  const collegeDisplay = 'BrightPath College, Agra';

  const handleTeacherSubmit = async (payload) => {
    try {
      await saveTeacherMutation.mutateAsync(payload);
      if (setUser && user) {
        await setUser({
          ...user,
          username: payload.name || user.username,
          name: payload.name || user.name,
          email: payload.email || user.email,
          profile_image:
            payload.profile_image !== undefined
              ? payload.profile_image
              : user.profile_image,
          teacher_profile: {
            ...(user.teacher_profile || {}),
            ...payload,
          },
        });
      }
      setShowTeacherEdit(false);
      showToast('Profile updated successfully');
    } catch (err) {
      showToast(err?.message || 'Failed to update profile');
    }
  };

  const handleStudentSubmit = async (payload) => {
    try {
      await saveStudentMutation.mutateAsync(payload);
      if (setUser && user) {
        await setUser({
          ...user,
          username: payload.name || user.username,
          name: payload.name || user.name,
          email: payload.email || user.email,
          profile_image:
            payload.profile_image !== undefined
              ? payload.profile_image
              : user.profile_image,
          student_profile: {
            ...(user.student_profile || {}),
            ...payload,
          },
        });
      }
      setShowStudentEdit(false);
      showToast('Profile updated successfully');
    } catch (err) {
      showToast(err?.message || 'Failed to update profile');
    }
  };

  const handleAccountSettings = () => {
    if (isTeacher) {
      setShowTeacherEdit(true);
    } else if (isStudent) {
      setShowStudentEdit(true);
    } else {
      Alert.alert(
        'Account Settings',
        `Logged in as ${displayName}\nEmail: ${emailDisplay}\nRole: ${userSubtitle}`
      );
    }
  };

  const handlePrivacySecurity = () => {
    if (isStudent && onOpenBiometrics) {
      Alert.alert(
        'Privacy & Security',
        'Manage your biometric enrollment and identity verification samples.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Manage Biometrics', onPress: onOpenBiometrics },
        ]
      );
    } else {
      Alert.alert(
        'Privacy & Security',
        'Your profile data and biometric credentials are protected with end-to-end encryption.'
      );
    }
  };

  const teacherData = isTeacher
    ? {
        name: displayName,
        qualification: teacherProfile?.qualification || 'Professor',
        specialization:
          teacherProfile?.specialization ||
          teacherProfile?.department ||
          'B.Tech CSE',
        department:
          teacherProfile?.department ||
          teacherProfile?.specialization ||
          'B.Tech CSE',
        phone: phoneDisplay,
        email: emailDisplay,
        employee_code: teacherProfile?.employee_code || user?.identifier || '',
        profile_image:
          user?.profile_image || teacherProfile?.profile_image || null,
      }
    : null;

  const studentData = isStudent
    ? {
        name: displayName,
        phone: phoneDisplay,
        email: emailDisplay,
        roll_number: studentProfile?.roll_number || user?.identifier || '',
        course: studentProfile?.course || 'B.Tech CSE',
        semester: String(
          studentProfile?.semester_number || studentProfile?.semester || '3'
        ),
        semester_number: studentProfile?.semester_number || 3,
        profile_image:
          user?.profile_image || studentProfile?.profile_image || null,
      }
    : null;

  const profilePhotoUri =
    user?.profile_image ||
    (isTeacher
      ? teacherProfile?.profile_image
      : studentProfile?.profile_image);

  return (
    <ScrollView
      className="flex-1 bg-[#F5F6FA]"
      contentContainerStyle={{
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 120,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Toast Alert Banner */}
      {toastMessage && (
        <View className="mb-4 flex-row items-center justify-between rounded-xl bg-emerald-600 px-4 py-3 shadow-sm">
          <View className="flex-row items-center gap-2">
            <Check size={16} color="#FFFFFF" />
            <Text className="text-xs font-bold text-white">{toastMessage}</Text>
          </View>
        </View>
      )}

      {/* Screen Title */}
      <Text className="text-[24px] font-extrabold text-[#0F172A] mb-6">Profile</Text>

      {/* Profile Avatar Block */}
      <View className="items-center mb-6">
        <View className="w-[84px] h-[84px] rounded-[26px] bg-[#2563EB] items-center justify-center shadow-sm overflow-hidden">
          {profilePhotoUri ? (
            <Image
              source={{ uri: profilePhotoUri }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Text className="text-white text-2xl font-bold tracking-wider">
              {initials}
            </Text>
          )}
        </View>
        <Text className="text-[19px] font-bold text-[#0F172A] mt-3">
          {displayName}
        </Text>
        <Text className="text-[13px] font-medium text-[#64748B] mt-0.5">
          {userSubtitle}
        </Text>
      </View>

      {/* User Information Card */}
      <View className="bg-white rounded-[20px] px-5 py-1 shadow-sm border border-slate-100/80 mb-3.5">
        {/* Email Row */}
        <View className="flex-row items-center py-3.5 border-b border-slate-100">
          <Mail
            size={18}
            color="#64748B"
            strokeWidth={1.8}
            style={{ marginRight: 16 }}
          />
          <View className="flex-1 justify-center">
            <Text className="text-[11.5px] font-medium text-[#64748B]">Email</Text>
            <Text className="text-[14px] font-semibold text-[#0F172A] mt-0.5">
              {emailDisplay}
            </Text>
          </View>
        </View>

        {/* Phone Row */}
        <View className="flex-row items-center py-3.5 border-b border-slate-100">
          <Phone
            size={18}
            color="#64748B"
            strokeWidth={1.8}
            style={{ marginRight: 16 }}
          />
          <View className="flex-1 justify-center">
            <Text className="text-[11.5px] font-medium text-[#64748B]">Phone</Text>
            <Text className="text-[14px] font-semibold text-[#0F172A] mt-0.5">
              {phoneDisplay}
            </Text>
          </View>
        </View>

        {/* College Row */}
        <View className="flex-row items-center py-3.5">
          <Home
            size={18}
            color="#64748B"
            strokeWidth={1.8}
            style={{ marginRight: 16 }}
          />
          <View className="flex-1 justify-center">
            <Text className="text-[11.5px] font-medium text-[#64748B]">
              College
            </Text>
            <Text className="text-[14px] font-semibold text-[#0F172A] mt-0.5">
              {collegeDisplay}
            </Text>
          </View>
        </View>
      </View>

      {/* Settings Card */}
      <View className="bg-white rounded-[20px] px-5 py-1 shadow-sm border border-slate-100/80 mb-3.5">
        {/* Account settings */}
        <TouchableOpacity
          onPress={handleAccountSettings}
          activeOpacity={0.7}
          className="flex-row items-center py-4 border-b border-slate-100"
        >
          <Sun
            size={19}
            color="#64748B"
            strokeWidth={1.8}
            style={{ marginRight: 16 }}
          />
          <Text className="text-[15px] font-semibold text-[#0F172A]">
            Account settings
          </Text>
        </TouchableOpacity>

        {/* Privacy & security */}
        <TouchableOpacity
          onPress={handlePrivacySecurity}
          activeOpacity={0.7}
          className="flex-row items-center py-4"
        >
          <Shield
            size={19}
            color="#64748B"
            strokeWidth={1.8}
            style={{ marginRight: 16 }}
          />
          <Text className="text-[15px] font-semibold text-[#0F172A]">
            Privacy & security
          </Text>
        </TouchableOpacity>
      </View>

      {/* Log out Button */}
      <TouchableOpacity
        onPress={onLogout}
        activeOpacity={0.7}
        className="bg-white rounded-[20px] py-4 items-center justify-center shadow-sm border border-slate-100/80 mb-6"
      >
        <Text className="text-[15px] font-bold text-[#DC2626]">Log out</Text>
      </TouchableOpacity>

      {/* Edit Teacher Modal */}
      {isTeacher && teacherData && (
        <EditTeacherModal
          visible={showTeacherEdit}
          teacher={teacherData}
          courses={courses}
          onClose={() => setShowTeacherEdit(false)}
          onSubmit={handleTeacherSubmit}
          isSubmitting={saveTeacherMutation.isPending}
        />
      )}

      {/* Edit Student Modal */}
      {isStudent && studentData && (
        <EditStudentModal
          visible={showStudentEdit}
          student={studentData}
          courses={courses}
          onClose={() => setShowStudentEdit(false)}
          onSubmit={handleStudentSubmit}
          isSubmitting={saveStudentMutation.isPending}
        />
      )}
    </ScrollView>
  );
}
