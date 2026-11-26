import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  X,
  Camera,
  Trash2,
  Plus,
  BookOpen,
  MapPin,
  Clock,
  Calendar,
  Check,
} from 'lucide-react-native';
import { Text } from '../../ui/text';
import PhotoPickerModal from './PhotoPickerModal';

const DESIGNATION_OPTIONS = [
  'Professor',
  'Associate Professor',
  'Assistant Professor',
  'Adjunct Faculty',
];

export default function TeacherFormView({
  mode = 'edit', // 'edit' | 'add'
  teacher = null,
  courses = [],
  onClose,
  onSubmit,
  isSubmitting = false,
}) {
  const isEdit = mode === 'edit';

  // Form fields
  const [name, setName] = useState('');
  const [designation, setDesignation] = useState('Professor');
  const [department, setDepartment] = useState('B.Tech CSE');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [joiningDate, setJoiningDate] = useState('2024-01-15');
  const [isActive, setIsActive] = useState(true);
  const [photo, setPhoto] = useState(null);

  // Assigned classes state
  const [classesList, setClassesList] = useState([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [newSubj, setNewSubj] = useState('');
  const [newCourse, setNewCourse] = useState('B.Tech CSE');
  const [newSem, setNewSem] = useState('Semester 3');
  const [newDay, setNewDay] = useState('Mon, Wed, Fri');
  const [newTime, setNewTime] = useState('10:15 AM');
  const [newRoom, setNewRoom] = useState('Block B, Hall 3');

  // UI helpers
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  useEffect(() => {
    if (isEdit && teacher) {
      setName(teacher.name || teacher.user?.username || '');
      setDesignation(teacher.qualification || 'Professor');
      setDepartment(teacher.specialization || 'B.Tech CSE');
      setPhone(teacher.phone || '');
      setEmail(teacher.email || teacher.user?.email || '');
      setEmployeeCode(teacher.employee_code || '');
      setJoiningDate(teacher.joining_date || '2024-01-15');
      setIsActive(teacher.is_active !== false);
      setPhoto(teacher.profile_image || teacher.user?.profile_image || null);

      if (teacher.assignments && teacher.assignments.length > 0) {
        setClassesList(
          teacher.assignments.map((a, i) => ({
            id: a.id || i + 1,
            subject: a.subject?.name || a.subject_name || 'Subject',
            course: a.course?.code || a.course_code || 'B.Tech CSE',
            semester: a.semester || 'Semester 3',
            day: 'Mon, Wed, Fri',
            time: a.schedule || '10:15 AM',
            room: a.room || 'Block B, Hall 3',
          }))
        );
      } else {
        setClassesList([
          {
            id: 1,
            subject: 'Data Structures & Algorithms',
            course: 'B.Tech CSE',
            semester: 'Semester 3',
            day: 'Mon, Wed, Fri',
            time: '10:15 AM',
            room: 'Block B, Hall 3',
          },
        ]);
      }
      setIsDirty(false);
    } else {
      setName('');
      setDesignation('Professor');
      setDepartment(courses[0]?.code || 'B.Tech CSE');
      setPhone('');
      setEmail('');
      setEmployeeCode('');
      setJoiningDate('2024-01-15');
      setIsActive(true);
      setPhoto(null);
      setClassesList([]);
      setIsDirty(false);
    }
  }, [teacher, isEdit, courses]);

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

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      qualification: designation,
      specialization: department,
      department: department,
      employee_code: employeeCode.trim() || undefined,
      joining_date: joiningDate || undefined,
      is_active: isActive,
      profile_image: photo,
      classes: classesList,
    };

    onSubmit?.(payload);
  };

  const handleAddClass = () => {
    if (!newSubj.trim()) return;
    setClassesList([
      ...classesList,
      {
        id: Date.now(),
        subject: newSubj.trim(),
        course: newCourse,
        semester: newSem,
        day: newDay,
        time: newTime,
        room: newRoom,
      },
    ]);
    setNewSubj('');
    setShowClassModal(false);
    setIsDirty(true);
  };

  const handleRemoveClass = (id) => {
    setClassesList(classesList.filter((c) => c.id !== id));
    setIsDirty(true);
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
          {isEdit ? 'Edit teacher' : 'Add teacher'}
        </Text>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSave}
          disabled={isSubmitting || (isEdit && !isDirty)}
          className={`px-3.5 py-1.5 rounded-full ${
            (!isEdit || isDirty) && !isSubmitting
              ? 'bg-[#3446D4]'
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
            <View className="w-[84px] h-[84px] rounded-[24px] bg-[#EEF0FF] items-center justify-center overflow-hidden border-2 border-indigo-100 shadow-sm">
              {photo ? (
                <Image source={{ uri: photo }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <Text className="text-3xl font-extrabold text-[#3446D4]">
                  {name ? name[0].toUpperCase() : 'T'}
                </Text>
              )}
            </View>

            {/* Camera badge */}
            <View className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#3446D4] items-center justify-center border-2 border-white shadow-sm">
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
              placeholder="e.g. Dr. Anita Verma"
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

          {/* Designation Dropdown Chips */}
          <View>
            <Text className="text-xs font-bold text-slate-700 mb-1.5">
              Designation
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
              <View className="flex-row gap-2">
                {DESIGNATION_OPTIONS.map((opt) => {
                  const isSel = designation === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      activeOpacity={0.7}
                      onPress={() => {
                        setDesignation(opt);
                        setIsDirty(true);
                      }}
                      className={`px-3 py-2 rounded-xl border ${
                        isSel
                          ? 'bg-[#3446D4] border-[#3446D4]'
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

          {/* Department / Course Dropdown */}
          <View>
            <Text className="text-xs font-bold text-slate-700 mb-1.5">
              Department / Course
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-1">
              <View className="flex-row gap-2">
                {(courses.length > 0 ? courses : [{ code: 'B.Tech CSE' }, { code: 'B.Tech ECE' }, { code: 'BBA' }, { code: 'B.Com' }, { code: 'MBA' }]).map((c) => {
                  const code = c.code || 'B.Tech CSE';
                  const isSel = department === code;
                  return (
                    <TouchableOpacity
                      key={code}
                      activeOpacity={0.7}
                      onPress={() => {
                        setDepartment(code);
                        setIsDirty(true);
                      }}
                      className={`px-3 py-2 rounded-xl border ${
                        isSel
                          ? 'bg-[#3446D4] border-[#3446D4]'
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

          {/* Phone (10 digits) */}
          <View>
            <Text className="text-xs font-bold text-slate-700 mb-1.5">
              Phone (10 digits) *
            </Text>
            <TextInput
              value={phone}
              onChangeText={handleFieldChange(setPhone)}
              placeholder="e.g. 9876543210"
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
              placeholder="e.g. anita.verma@college.edu"
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

          {/* Employee ID */}
          <View>
            <Text className="text-xs font-bold text-slate-700 mb-1.5">
              Employee ID
            </Text>
            <TextInput
              value={employeeCode}
              onChangeText={handleFieldChange(setEmployeeCode)}
              placeholder="e.g. FAC-1004"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              className="h-12 px-3.5 rounded-[14px] bg-slate-50 border border-slate-200 text-[14px] font-semibold text-slate-900"
            />
          </View>

          {/* Joining Date */}
          <View>
            <Text className="text-xs font-bold text-slate-700 mb-1.5">
              Joining date (YYYY-MM-DD)
            </Text>
            <TextInput
              value={joiningDate}
              onChangeText={handleFieldChange(setJoiningDate)}
              placeholder="e.g. 2024-01-15"
              placeholderTextColor="#94A3B8"
              className="h-12 px-3.5 rounded-[14px] bg-slate-50 border border-slate-200 text-[14px] font-semibold text-slate-900"
            />
          </View>

          {/* Status Toggle (Active / On leave) */}
          <View className="flex-row items-center justify-between pt-2 border-t border-slate-100">
            <View>
              <Text className="text-xs font-bold text-slate-900">
                Status: {isActive ? 'Active' : 'On leave'}
              </Text>
              <Text className="text-[11px] text-slate-500">
                {isActive ? 'Available for classes' : 'Temporarily away from schedule'}
              </Text>
            </View>
            <Switch
              value={isActive}
              onValueChange={(val) => {
                setIsActive(val);
                setIsDirty(true);
              }}
              trackColor={{ false: '#CBD5E1', true: '#3446D4' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section: Assigned Classes */}
        <View className="bg-white rounded-[18px] p-4 border border-slate-200/70 shadow-sm mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <View>
              <Text className="text-[15px] font-bold text-slate-900">
                Assigned classes
              </Text>
              <Text className="text-xs text-slate-500">
                {classesList.length} subjects allocated
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowClassModal(true)}
              className="flex-row items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/70"
            >
              <Plus size={14} color="#3446D4" strokeWidth={2.5} />
              <Text className="text-xs font-bold text-[#3446D4]">Add class</Text>
            </TouchableOpacity>
          </View>

          {classesList.length === 0 ? (
            <View className="p-4 items-center justify-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
              <Text className="text-xs text-slate-500">No classes assigned yet.</Text>
            </View>
          ) : (
            <View className="gap-2.5">
              {classesList.map((item) => (
                <View
                  key={item.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-2">
                    <Text className="text-sm font-bold text-slate-900" numberOfLines={1}>
                      {item.subject}
                    </Text>
                    <Text className="text-xs text-slate-500 font-medium mt-0.5">
                      {item.course} · {item.semester}
                    </Text>
                    <Text className="text-[11px] text-slate-500 mt-0.5">
                      {item.day} · {item.time} ({item.room})
                    </Text>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleRemoveClass(item.id)}
                    className="w-8 h-8 rounded-full bg-red-50 border border-red-200 items-center justify-center"
                  >
                    <Trash2 size={14} color="#C4301F" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Sub-Modal: Add Class */}
        {showClassModal && (
          <View className="bg-white rounded-[18px] p-4 border border-indigo-200 shadow-md mb-4 gap-2.5">
            <Text className="text-sm font-bold text-slate-900">Add Assigned Class</Text>
            <TextInput
              value={newSubj}
              onChangeText={setNewSubj}
              placeholder="Subject Name (e.g. Operating Systems)"
              placeholderTextColor="#94A3B8"
              className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
            />
            <View className="flex-row gap-2">
              <TextInput
                value={newCourse}
                onChangeText={setNewCourse}
                placeholder="Course (e.g. B.Tech CSE)"
                placeholderTextColor="#94A3B8"
                className="flex-1 h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
              />
              <TextInput
                value={newSem}
                onChangeText={setNewSem}
                placeholder="Semester"
                placeholderTextColor="#94A3B8"
                className="flex-1 h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
              />
            </View>
            <View className="flex-row gap-2">
              <TextInput
                value={newTime}
                onChangeText={setNewTime}
                placeholder="Time (e.g. 10:15 AM)"
                placeholderTextColor="#94A3B8"
                className="flex-1 h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
              />
              <TextInput
                value={newRoom}
                onChangeText={setNewRoom}
                placeholder="Room (e.g. Hall 3)"
                placeholderTextColor="#94A3B8"
                className="flex-1 h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
              />
            </View>
            <View className="flex-row gap-2 mt-1">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowClassModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 items-center justify-center"
              >
                <Text className="text-xs font-bold text-slate-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleAddClass}
                className="flex-1 py-2 rounded-xl bg-[#3446D4] items-center justify-center"
              >
                <Text className="text-xs font-bold text-white">Save Class</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
              ? 'bg-[#3446D4]'
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
              {isEdit ? 'Save changes' : 'Add teacher'}
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
