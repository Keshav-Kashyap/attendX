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

const DESIGNATION_OPTIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Adjunct Faculty',
];

export default function EditTeacherModal({
  visible,
  teacher,
  courses = [],
  onClose,
  onSubmit,
  isSubmitting = false,
}) {
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('Professor');
  const [department, setDepartment] = useState('B.Tech CSE');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [photo, setPhoto] = useState(null);
  const [coordinatorSemesterId, setCoordinatorSemesterId] = useState(null);

  const [showDesigDropdown, setShowDesigDropdown] = useState(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showCoordDropdown, setShowCoordDropdown] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (teacher && visible) {
      setName(teacher.name || teacher.user?.username || '');
      setDesignation(teacher.qualification || 'Professor');
      setDepartment(teacher.specialization || 'B.Tech CSE');
      setPhone(teacher.phone || '');
      setEmail(teacher.email || teacher.user?.email || '');
      setEmployeeCode(teacher.employee_code || '');
      setPhoto(teacher.profile_image || teacher.user?.profile_image || null);
      setCoordinatorSemesterId(teacher.coordinator_semester_id ?? null);
      setErrorMsg('');
      setShowDesigDropdown(false);
      setShowDeptDropdown(false);
      setShowCoordDropdown(false);
    }
  }, [teacher, visible]);

  const initials = name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AV';

  const courseList =
    courses && courses.length > 0
      ? courses.map((c) => c.code || 'B.Tech CSE')
      : ['B.Tech CSE', 'B.Tech ECE', 'BBA', 'B.Com', 'MBA'];

  const coordinatorOptions = React.useMemo(() => {
    const list = [
      { id: null, label: 'None (Not a Coordinator)', subtext: 'Regular faculty' }
    ];
    (courses || []).forEach((c) => {
      const semDetails = c.semester_details || [];
      if (semDetails.length > 0) {
        semDetails.forEach((s) => {
          const isTakenByOther = s.coordinator_teacher_id && s.coordinator_teacher_id !== teacher?.id;
          list.push({
            id: s.id,
            label: `${c.code || c.name} · Semester ${s.semester_number}`,
            subtext: isTakenByOther ? `Taken by ${s.coordinator_teacher_name}` : 'Available',
            isTakenByOther,
          });
        });
      }
    });
    return list;
  }, [courses, teacher]);

  const activeCoordOption = coordinatorOptions.find((opt) => opt.id === coordinatorSemesterId) || {
    id: null,
    label: teacher?.coordinator_label || 'None (Not a Coordinator)',
  };

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

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      qualification: designation,
      specialization: department,
      department: department,
      employee_code: employeeCode.trim() || undefined,
      profile_image: photo,
      coordinator_semester_id: coordinatorSemesterId,
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
              Edit teacher
            </Text>
          </View>

          <ScrollView
            className="flex-1 px-5 pt-4"
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar block */}
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
                placeholder="Dr. Anita Verma"
                placeholderTextColor="#94A3B8"
                className="h-11 rounded-xl bg-white border border-slate-200 px-3.5 text-sm font-semibold text-slate-900"
              />
            </View>

            {/* Field: Designation Dropdown */}
            <View className="mb-3.5">
              <Text className="text-xs font-bold text-slate-800 mb-1.5">
                Designation
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowDesigDropdown(!showDesigDropdown)}
                className="h-11 rounded-xl bg-white border border-slate-200 px-3.5 flex-row items-center justify-between"
              >
                <Text className="text-sm font-semibold text-slate-900">
                  {designation}
                </Text>
                <ChevronDown size={16} color="#0F172A" />
              </TouchableOpacity>

              {showDesigDropdown && (
                <View className="bg-white border border-slate-200 rounded-xl mt-1.5 overflow-hidden shadow-sm">
                  {DESIGNATION_OPTIONS.map((d) => (
                    <TouchableOpacity
                      key={d}
                      activeOpacity={0.7}
                      onPress={() => {
                        setDesignation(d);
                        setShowDesigDropdown(false);
                      }}
                      className={`px-3.5 py-2.5 border-b border-slate-100 ${
                        designation === d ? 'bg-blue-50' : ''
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          designation === d ? 'text-[#2563EB]' : 'text-slate-700'
                        }`}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Field: Department / Course Dropdown */}
            <View className="mb-3.5">
              <Text className="text-xs font-bold text-slate-800 mb-1.5">
                Department / Course
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowDeptDropdown(!showDeptDropdown)}
                className="h-11 rounded-xl bg-white border border-slate-200 px-3.5 flex-row items-center justify-between"
              >
                <Text className="text-sm font-semibold text-slate-900">
                  {department}
                </Text>
                <ChevronDown size={16} color="#0F172A" />
              </TouchableOpacity>

              {showDeptDropdown && (
                <View className="bg-white border border-slate-200 rounded-xl mt-1.5 overflow-hidden shadow-sm">
                  {courseList.map((c) => (
                    <TouchableOpacity
                      key={c}
                      activeOpacity={0.7}
                      onPress={() => {
                        setDepartment(c);
                        setShowDeptDropdown(false);
                      }}
                      className={`px-3.5 py-2.5 border-b border-slate-100 ${
                        department === c ? 'bg-blue-50' : ''
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          department === c ? 'text-[#2563EB]' : 'text-slate-700'
                        }`}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Field: Class Coordinator Dropdown */}
            <View className="mb-3.5">
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-xs font-bold text-slate-800">
                  Class Coordinator
                </Text>
                {coordinatorSemesterId ? (
                  <View className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                    <Text className="text-[10px] font-bold text-amber-700">Assigned</Text>
                  </View>
                ) : null}
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setShowCoordDropdown(!showCoordDropdown);
                  setShowDesigDropdown(false);
                  setShowDeptDropdown(false);
                }}
                className={`h-11 rounded-xl bg-white border px-3.5 flex-row items-center justify-between ${
                  coordinatorSemesterId ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                }`}
              >
                <Text
                  numberOfLines={1}
                  className={`text-sm font-semibold flex-1 mr-2 ${
                    coordinatorSemesterId ? 'text-amber-900' : 'text-slate-900'
                  }`}
                >
                  {activeCoordOption.label}
                </Text>
                <ChevronDown size={16} color="#0F172A" />
              </TouchableOpacity>

              {showCoordDropdown && (
                <View className="bg-white border border-slate-200 rounded-xl mt-1.5 overflow-hidden shadow-sm max-h-56">
                  <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {coordinatorOptions.map((opt) => {
                      const isSelected = coordinatorSemesterId === opt.id;
                      return (
                        <TouchableOpacity
                          key={String(opt.id)}
                          activeOpacity={0.7}
                          onPress={() => {
                            setCoordinatorSemesterId(opt.id);
                            setShowCoordDropdown(false);
                          }}
                          className={`px-3.5 py-2.5 border-b border-slate-100 flex-row items-center justify-between ${
                            isSelected ? 'bg-amber-50' : ''
                          }`}
                        >
                          <View className="flex-1 mr-2">
                            <Text
                              className={`text-xs font-bold ${
                                isSelected ? 'text-amber-700' : 'text-slate-700'
                              }`}
                            >
                              {opt.label}
                            </Text>
                            {opt.subtext ? (
                              <Text className="text-[11px] text-slate-400 font-medium mt-0.5">
                                {opt.subtext}
                              </Text>
                            ) : null}
                          </View>
                          {isSelected && (
                            <View className="w-2 h-2 rounded-full bg-amber-500" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Field: Phone */}
            <View className="mb-3.5">
              <Text className="text-xs font-bold text-slate-800 mb-1.5">
                Phone
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98100 11223"
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
                placeholder="anita.verma@college.edu"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                className="h-11 rounded-xl bg-white border border-slate-200 px-3.5 text-sm font-semibold text-slate-900"
              />
            </View>

            {/* Field: Employee ID */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-800 mb-1.5">
                Employee ID
              </Text>
              <TextInput
                value={employeeCode}
                onChangeText={setEmployeeCode}
                placeholder="FAC-1001"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                className="h-11 rounded-xl bg-white border border-slate-200 px-3.5 text-sm font-semibold text-slate-900"
              />
            </View>
          </ScrollView>

          {/* Sticky Bottom Actions */}
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
