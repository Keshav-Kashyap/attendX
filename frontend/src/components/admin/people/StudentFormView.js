import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { X, Camera } from 'lucide-react-native';
import { Text } from '../../ui/text';
import PhotoPickerModal from './PhotoPickerModal';

const SEMESTER_OPTIONS = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'];

export default function StudentFormView({
  mode = 'edit', // 'edit' | 'add'
  student = null,
  courses = [],
  onClose,
  onSubmit,
  isSubmitting = false,
}) {
  const isEdit = mode === 'edit';

  // Form fields
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [courseCode, setCourseCode] = useState('B.Tech CSE');
  const [semester, setSemester] = useState('Sem 3');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [dob, setDob] = useState('2003-05-14');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [photo, setPhoto] = useState(null);

  // UI state
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  useEffect(() => {
    if (isEdit && student) {
      setName(student.name || student.user?.username || '');
      setRollNumber(student.roll_number || '');
      setCourseCode(student.course || student.current_enrollment?.course?.code || 'B.Tech CSE');
      const semN = student.semester_number || (student.semester ? student.semester.replace(/[^0-9]/g, '') : '3') || '3';
      setSemester(`Sem ${semN}`);
      setPhone(student.phone || '');
      setEmail(student.email || student.user?.email || '');
      setGuardianName(student.guardian_name || 'Rajesh Gupta');
      setGuardianPhone(student.guardian_phone || '9876509999');
      setDob(student.dob || '2003-05-14');
      setAddress(student.address || '42 University Enclave, Sector 12');
      setIsActive(student.is_active !== false);
      setPhoto(student.profile_image || student.user?.profile_image || null);
      setIsDirty(false);
    } else {
      setName('');
      setRollNumber('');
      setCourseCode(courses[0]?.code || 'B.Tech CSE');
      setSemester('Sem 1');
      setPhone('');
      setEmail('');
      setGuardianName('');
      setGuardianPhone('');
      setDob('2004-06-12');
      setAddress('');
      setIsActive(true);
      setPhoto(null);
      setIsDirty(false);
    }
  }, [student, isEdit, courses]);

  const handleFieldChange = (setter) => (val) => {
    setter(val);
    setIsDirty(true);
  };

  const handleClose = () => {
    if (isDirty) {
      setShowDiscardDialog(true);
    } else {
      onClose?.();
    }
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = 'Full name is required';

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      errs.phone = 'Enter a 10 digit phone number';
    }

    if (!email.trim() || !email.includes('@')) {
      errs.email = 'Enter a valid email address';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const matchedCourse = courses.find(
      (c) =>
        (c.code || '').trim().toUpperCase() === courseCode.trim().toUpperCase() ||
        (c.name || '').trim().toUpperCase() === courseCode.trim().toUpperCase()
    );

    const semNumOnly = Number(semester.replace(/[^0-9]/g, '')) || 1;
    const matchedSemester = (matchedCourse?.semester_details || []).find(
      (s) => s.semester_number === semNumOnly
    );

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      roll_number: rollNumber.trim() || undefined,
      phone: phone.trim(),
      course_id: matchedCourse?.id,
      course: courseCode,
      semester_id: matchedSemester?.id,
      semester: `Semester ${semNumOnly}`,
      semester_number: semNumOnly,
      guardian_name: guardianName.trim(),
      guardian_phone: guardianPhone.trim(),
      dob: dob.trim(),
      address: address.trim(),
      is_active: isActive,
      profile_image: photo,
    };

    onSubmit?.(payload);
  };

  return (
    <View className="flex-1 bg-[#F5F6FA]">
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-[18px] py-3.5 bg-white border-b border-slate-200/80">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleClose}
          className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
        >
          <X size={18} color="#475569" />
        </TouchableOpacity>

        <Text className="text-[17px] font-bold text-slate-900">
          {isEdit ? 'Edit student' : 'Add student'}
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSave}
          disabled={isSubmitting || (isEdit && !isDirty)}
          className={`px-3.5 py-1.5 rounded-full ${
            (!isEdit || isDirty) && !isSubmitting
              ? 'bg-[#0E8F83]'
              : 'bg-slate-200'
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              className={`text-xs font-bold ${
                (!isEdit || isDirty) && !isSubmitting
                  ? 'text-white'
                  : 'text-slate-400'
              }`}
            >
              {isEdit ? 'Save' : 'Add'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-[18px] pt-4"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Section */}
        <View className="items-center mb-5">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setPhotoModalVisible(true)}
            className="relative"
          >
            <View className="w-[84px] h-[84px] rounded-[24px] bg-[#E6F7F5] items-center justify-center overflow-hidden border-2 border-teal-100 shadow-sm">
              {photo ? (
                <Image source={{ uri: photo }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className="text-3xl font-extrabold text-[#0E8F83]">
                  {name ? name[0].toUpperCase() : 'S'}
                </Text>
              )}
            </View>

            {/* Camera badge */}
            <View className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#0E8F83] items-center justify-center border-2 border-white shadow-sm">
              <Camera size={13} color="#FFFFFF" strokeWidth={2.4} />
            </View>
          </TouchableOpacity>
          <Text className="text-xs text-slate-500 font-medium mt-2">
            Tap to change photo
          </Text>
        </View>

        {/* Form Fields Card */}
        <View className="bg-white rounded-[18px] p-4 border border-slate-200/70 shadow-sm gap-3.5 mb-4">
          {/* Full Name */}
          <View>
            <Text className="text-xs font-bold text-slate-700 mb-1.5">
              Full name *
            </Text>
            <TextInput
              value={name}
              onChangeText={handleFieldChange(setName)}
              placeholder="e.g. Aarav Gupta"
              placeholderTextColor="#94A3B8"
              className={`h-12 px-3.5 rounded-[14px] bg-slate-50 border text-[14px] font-semibold text-slate-900 ${
                errors.name ? 'border-[#C4301F] bg-red-50/20' : 'border-slate-200'
              }`}
            />
            {errors.name && (
              <Text className="text-[11px] font-bold text-[#C4301F] mt-1">
                {errors.name}
              </Text>
            )}
          </View>

          {/* Roll Number */}
          <View>
            <Text className="text-xs font-bold text-slate-700 mb-1.5">
              Roll number
            </Text>
            <TextInput
              value={rollNumber}
              onChangeText={handleFieldChange(setRollNumber)}
              placeholder="e.g. CS21-007"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              className="h-12 px-3.5 rounded-[14px] bg-slate-50 border border-slate-200 text-[14px] font-semibold text-slate-900"
            />
          </View>

          {/* Course Dropdown */}
          <View>
            <Text className="text-xs font-bold text-slate-700 mb-1.5">
              Course
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
              <View className="flex-row gap-2">
                {(courses.length > 0
                  ? courses
                  : [{ code: 'B.Tech CSE' }, { code: 'B.Tech ECE' }, { code: 'BBA' }, { code: 'B.Com' }, { code: 'MBA' }]
                ).map((c) => {
                  const code = c.code || 'B.Tech CSE';
                  const isSel = courseCode === code;
                  return (
                    <TouchableOpacity
                      key={code}
                      activeOpacity={0.7}
                      onPress={() => {
                        setCourseCode(code);
                        setIsDirty(true);
                      }}
                      className={`px-3 py-2 rounded-xl border ${
                        isSel
                          ? 'bg-[#0E8F83] border-[#0E8F83]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSel ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Semester (1 to 6) */}
          <View>
            <Text className="text-xs font-bold text-slate-700 mb-1.5">
              Semester
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
              <View className="flex-row gap-2">
                {SEMESTER_OPTIONS.map((opt) => {
                  const isSel = semester === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSemester(opt);
                        setIsDirty(true);
                      }}
                      className={`px-3 py-2 rounded-xl border ${
                        isSel
                          ? 'bg-[#0E8F83] border-[#0E8F83]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          isSel ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Phone */}
          <View>
            <Text className="text-xs font-bold text-slate-700 mb-1.5">
              Phone (10 digits) *
            </Text>
            <TextInput
              value={phone}
              onChangeText={handleFieldChange(setPhone)}
              placeholder="e.g. 9876501234"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={15}
              className={`h-12 px-3.5 rounded-[14px] bg-slate-50 border text-[14px] font-semibold text-slate-900 ${
                errors.phone ? 'border-[#C4301F] bg-red-50/20' : 'border-slate-200'
              }`}
            />
            {errors.phone && (
              <Text className="text-[11px] font-bold text-[#C4301F] mt-1">
                {errors.phone}
              </Text>
            )}
          </View>

          {/* Email */}
          <View>
            <Text className="text-xs font-bold text-slate-700 mb-1.5">
              Email *
            </Text>
            <TextInput
              value={email}
              onChangeText={handleFieldChange(setEmail)}
              placeholder="e.g. aarav.gupta@college.edu"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              className={`h-12 px-3.5 rounded-[14px] bg-slate-50 border text-[14px] font-semibold text-slate-900 ${
                errors.email ? 'border-[#C4301F] bg-red-50/20' : 'border-slate-200'
              }`}
            />
            {errors.email && (
              <Text className="text-[11px] font-bold text-[#C4301F] mt-1">
                {errors.email}
              </Text>
            )}
          </View>

          {/* Guardian Name */}
          <View>
            <Text className="text-xs font-bold text-slate-700 mb-1.5">
              Guardian name
            </Text>
            <TextInput
              value={guardianName}
              onChangeText={handleFieldChange(setGuardianName)}
              placeholder="e.g. Rajesh Gupta"
              placeholderTextColor="#94A3B8"
              className="h-12 px-3.5 rounded-[14px] bg-slate-50 border border-slate-200 text-[14px] font-semibold text-slate-900"
            />
          </View>

          {/* Guardian Phone */}
          <View>
            <Text className="text-xs font-bold text-slate-700 mb-1.5">
              Guardian phone
            </Text>
            <TextInput
              value={guardianPhone}
              onChangeText={handleFieldChange(setGuardianPhone)}
              placeholder="e.g. 9876509999"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={15}
              className="h-12 px-3.5 rounded-[14px] bg-slate-50 border border-slate-200 text-[14px] font-semibold text-slate-900"
            />
          </View>

          {/* Date of Birth */}
          <View>
            <Text className="text-xs font-bold text-slate-700 mb-1.5">
              Date of birth (YYYY-MM-DD)
            </Text>
            <TextInput
              value={dob}
              onChangeText={handleFieldChange(setDob)}
              placeholder="e.g. 2003-05-14"
              placeholderTextColor="#94A3B8"
              className="h-12 px-3.5 rounded-[14px] bg-slate-50 border border-slate-200 text-[14px] font-semibold text-slate-900"
            />
          </View>

          {/* Address */}
          <View>
            <Text className="text-xs font-bold text-slate-700 mb-1.5">
              Address
            </Text>
            <TextInput
              value={address}
              onChangeText={handleFieldChange(setAddress)}
              placeholder="e.g. 42 University Enclave, Sector 12"
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={2}
              className="h-16 px-3.5 py-2 rounded-[14px] bg-slate-50 border border-slate-200 text-[14px] font-semibold text-slate-900"
            />
          </View>

          {/* Status Toggle (Active / Inactive) */}
          <View className="flex-row items-center justify-between pt-2 border-t border-slate-100">
            <View>
              <Text className="text-xs font-bold text-slate-900">
                Status: {isActive ? 'Active' : 'Inactive'}
              </Text>
              <Text className="text-[11px] text-slate-500">
                {isActive ? 'Currently enrolled in semester' : 'Suspended or graduated'}
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={(val) => {
                setIsActive(val);
                setIsDirty(true);
              }}
              trackColor={{ false: '#CBD5E1', true: '#0E8F83' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Bar */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200/80 flex-row gap-3">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleClose}
          className="flex-1 h-12 rounded-[14px] bg-slate-100 items-center justify-center"
        >
          <Text className="text-sm font-bold text-slate-700">Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={isSubmitting || (isEdit && !isDirty)}
          className={`flex-1 h-12 rounded-[14px] items-center justify-center ${
            (!isEdit || isDirty) && !isSubmitting
              ? 'bg-[#0E8F83]'
              : 'bg-slate-200'
          }`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              className={`text-[15px] font-bold ${
                (!isEdit || isDirty) && !isSubmitting
                  ? 'text-white'
                  : 'text-slate-400'
              }`}
            >
              {isEdit ? 'Save changes' : 'Add student'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Discard Changes Dialog */}
      {showDiscardDialog && (
        <View className="absolute inset-0 bg-black/50 items-center justify-center px-6 z-50">
          <View className="bg-white rounded-3xl p-5 w-full max-w-sm border border-slate-200 shadow-2xl">
            <Text className="text-lg font-bold text-slate-900 mb-1">
              Discard changes?
            </Text>
            <Text className="text-xs text-slate-500 mb-4">
              You have unsaved changes. Leaving will lose your input.
            </Text>
            <View className="flex-row gap-2.5">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowDiscardDialog(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 items-center justify-center"
              >
                <Text className="text-xs font-bold text-slate-700">Keep editing</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setShowDiscardDialog(false);
                  onClose?.();
                }}
                className="flex-1 py-3 rounded-xl bg-red-500 items-center justify-center"
              >
                <Text className="text-xs font-bold text-white">Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Photo Picker Modal */}
      <PhotoPickerModal
        visible={photoModalVisible}
        onClose={() => setPhotoModalVisible(false)}
        onSelectPhoto={(uri) => {
          setPhoto(uri);
          setIsDirty(true);
        }}
        onRemovePhoto={() => {
          setPhoto(null);
          setIsDirty(true);
        }}
        hasExistingPhoto={!!photo}
      />
    </View>
  );
}
