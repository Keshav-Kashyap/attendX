import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Pressable,
  StyleSheet,
} from 'react-native';
import { X, ChevronDown } from 'lucide-react-native';
import { Text } from '../../ui/text';
import PhotoPickerModal from './PhotoPickerModal';

export default function EditStudentModal({
  visible,
  student,
  courses = [],
  onClose,
  onSubmit,
  isSubmitting = false,
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [courseCode, setCourseCode] = useState('B.Tech CSE');
  const [semester, setSemester] = useState('3');
  const [photo, setPhoto] = useState(null);

  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [showSemesterDropdown, setShowSemesterDropdown] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (student && visible) {
      setName(student.name || student.user?.username || '');
      setPhone(student.phone || '');
      setEmail(student.email || student.user?.email || '');
      setRollNumber(student.roll_number || '');
      setCourseCode(
        student.course || student.current_enrollment?.course?.code || 'B.Tech CSE'
      );
      const semN = String(
        student.semester_number ||
          (student.semester ? student.semester.replace(/[^0-9]/g, '') : '3') ||
          '3'
      );
      setSemester(semN);
      setPhoto(student.profile_image || student.user?.profile_image || null);
      setErrorMsg('');
      setShowCourseDropdown(false);
      setShowSemesterDropdown(false);
    }
  }, [student, visible]);

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AG';

  const courseList =
    courses && courses.length > 0
      ? Array.from(new Set(courses.map((c) => c.code).filter(Boolean)))
      : ['MCA', 'B.Tech CSE', 'B.Tech ECE', 'BBA', 'B.Com', 'MBA'];

  const semesterList = ['1', '2', '3', '4', '5', '6', '7', '8'];

  const handleSave = () => {
    if (!name.trim()) {
      setErrorMsg('Full name is required');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setErrorMsg('Enter a valid 10-digit phone number');
      return;
    }

    const semNum = Number(semester) || 1;
    const matchedCourse = (courses || []).find(
      (c) =>
        (c.code || '').toUpperCase() === courseCode.toUpperCase() ||
        (c.name || '').toUpperCase() === courseCode.toUpperCase()
    );

    const matchedSemester = (matchedCourse?.semester_details || []).find(
      (s) => s.semester_number === semNum
    );

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      roll_number: rollNumber.trim() || undefined,
      course_id: matchedCourse?.id,
      course: courseCode,
      semester_id: matchedSemester?.id,
      semester: `Semester ${semNum}`,
      semester_number: semNum,
      profile_image: photo,
    };

    onSubmit?.(payload);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/45 justify-end">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View className="bg-white rounded-t-[28px] max-h-[92%] flex-col border-t border-slate-100 shadow-2xl z-10">
          {/* Header */}
          <View className="flex-row items-center px-5 pt-4 pb-3 border-b border-slate-100">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              className="w-9 h-9 rounded-xl border border-slate-200 items-center justify-center bg-white"
            >
              <X size={18} color="#0F172A" />
            </TouchableOpacity>

            <Text className="text-[17px] font-bold text-slate-900 ml-3.5">
              Edit student
            </Text>
          </View>

          <ScrollView
            className="flex-1 px-5 pt-4"
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar block matching screenshot 4 */}
            <View className="items-center mb-4">
              <View className="w-20 h-20 rounded-[22px] bg-[#EEF2FF] items-center justify-center overflow-hidden mb-2">
                {photo ? (
                  <Image source={{ uri: photo }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-2xl font-extrabold text-[#2563EB]">
                    {initials}
                  </Text>
                )}
              </View>

              <View className="flex-row items-center gap-4">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setPhotoModalVisible(true)}
                >
                  <Text className="text-xs font-bold text-[#2563EB]">
                    Change photo
                  </Text>
                </TouchableOpacity>

                {photo ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setPhoto(null)}
                  >
                    <Text className="text-xs font-bold text-[#DC2626]">
                      Remove photo
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {errorMsg ? (
              <View className="p-2.5 rounded-xl bg-red-50 border border-red-200 mb-3">
                <Text className="text-xs font-bold text-[#DC2626] text-center">
                  {errorMsg}
                </Text>
              </View>
            ) : null}

            {/* Field: Full name */}
            <View className="mb-3.5">
              <Text className="text-xs font-bold text-slate-800 mb-1.5">
                Full name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Aarav Gupta"
                placeholderTextColor="#94A3B8"
                className="h-11 rounded-xl bg-white border border-slate-200 px-3.5 text-sm font-semibold text-slate-900"
              />
            </View>

            {/* Field: Phone */}
            <View className="mb-3.5">
              <Text className="text-xs font-bold text-slate-800 mb-1.5">
                Phone
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="98765 00112"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                className="h-11 rounded-xl bg-white border border-slate-200 px-3.5 text-sm font-semibold text-slate-900"
              />
            </View>

            {/* Field: Email */}
            <View className="mb-3.5">
              <Text className="text-xs font-bold text-slate-800 mb-1.5">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@college.edu"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                className="h-11 rounded-xl bg-white border border-slate-200 px-3.5 text-sm font-semibold text-slate-900"
              />
            </View>

            {/* Field: Roll number */}
            <View className="mb-3.5">
              <Text className="text-xs font-bold text-slate-800 mb-1.5">
                Roll number
              </Text>
              <TextInput
                value={rollNumber}
                onChangeText={setRollNumber}
                placeholder="CS21-007"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                className="h-11 rounded-xl bg-white border border-slate-200 px-3.5 text-sm font-semibold text-slate-900"
              />
            </View>

            {/* Field: Course Dropdown */}
            <View className="mb-3.5">
              <Text className="text-xs font-bold text-slate-800 mb-1.5">
                Course
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowCourseDropdown(!showCourseDropdown)}
                className="h-11 rounded-xl bg-white border border-slate-200 px-3.5 flex-row items-center justify-between"
              >
                <Text className="text-sm font-semibold text-slate-900">
                  {courseCode}
                </Text>
                <ChevronDown size={16} color="#0F172A" />
              </TouchableOpacity>

              {showCourseDropdown && (
                <View className="bg-white border border-slate-200 rounded-xl mt-1.5 overflow-hidden shadow-sm">
                  {courseList.map((c) => (
                    <TouchableOpacity
                      key={c}
                      activeOpacity={0.7}
                      onPress={() => {
                        setCourseCode(c);
                        setShowCourseDropdown(false);
                      }}
                      className={`px-3.5 py-2.5 border-b border-slate-100 ${
                        courseCode === c ? 'bg-blue-50' : ''
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          courseCode === c ? 'text-[#2563EB]' : 'text-slate-700'
                        }`}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Field: Semester Dropdown */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-800 mb-1.5">
                Semester
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowSemesterDropdown(!showSemesterDropdown)}
                className="h-11 rounded-xl bg-white border border-slate-200 px-3.5 flex-row items-center justify-between"
              >
                <Text className="text-sm font-semibold text-slate-900">
                  {semester}
                </Text>
                <ChevronDown size={16} color="#0F172A" />
              </TouchableOpacity>

              {showSemesterDropdown && (
                <View className="bg-white border border-slate-200 rounded-xl mt-1.5 overflow-hidden shadow-sm">
                  {semesterList.map((s) => (
                    <TouchableOpacity
                      key={s}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSemester(s);
                        setShowSemesterDropdown(false);
                      }}
                      className={`px-3.5 py-2.5 border-b border-slate-100 ${
                        semester === s ? 'bg-blue-50' : ''
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          semester === s ? 'text-[#2563EB]' : 'text-slate-700'
                        }`}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Sticky Bottom Actions matching Screenshot 4 */}
          <View className="flex-row items-center px-5 py-4 border-t border-slate-100 bg-white">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              className="flex-1 h-12 rounded-xl bg-white border border-slate-200 items-center justify-center mr-3"
            >
              <Text className="text-sm font-bold text-slate-800">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSave}
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl bg-[#2563EB] items-center justify-center"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-sm font-bold text-white">Save changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <PhotoPickerModal
        visible={photoModalVisible}
        onClose={() => setPhotoModalVisible(false)}
        onSelectPhoto={(uri) => setPhoto(uri)}
        onRemovePhoto={() => setPhoto(null)}
        hasExistingPhoto={!!photo}
      />
    </Modal>
  );
}
