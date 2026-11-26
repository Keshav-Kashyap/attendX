import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
  GraduationCap,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  User,
} from 'lucide-react-native';
import { Text } from '../src/components/ui/text';
import { Input } from '../src/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader } from '../src/components/ui/card';
import KeyboardSafeView from '../src/components/ui/KeyboardSafeView';
import { authService } from '../src/services/authService';
import { useAuthStore } from '../src/store/useAuthStore';

export default function EnrollPage() {
  const params = useLocalSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  const token = typeof params?.token === 'string' ? params.token.trim() : '';

  const [inviteInfo, setInviteInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [inviteError, setInviteError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [identifier, setIdentifier] = useState(''); // Teacher employee code only
  const [qualification, setQualification] = useState('');
  const [specialization, setSpecialization] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;
    if (!token) {
      setInviteError('Missing invite token. Please scan a valid QR code or open a valid invite link.');
      setLoadingInfo(false);
      return () => {
        active = false;
      };
    }

    setLoadingInfo(true);
    setInviteError('');
    authService
      .getInviteInfo(token)
      .then((res) => {
        if (!active) return;
        if (res?.valid && res?.data) {
          setInviteInfo(res.data);
        } else {
          setInviteError(res?.message || 'This invite link is invalid or expired.');
        }
      })
      .catch((err) => {
        if (!active) return;
        setInviteError(err?.message || 'This invite link is invalid, already used, or expired.');
      })
      .finally(() => {
        if (active) setLoadingInfo(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const role = inviteInfo?.role === 'teacher' ? 'teacher' : 'student';
  const isStudent = role === 'student';
  const courseObj = inviteInfo?.course;
  const semObj = inviteInfo?.semester;

  const pickPhoto = async (useCamera = false) => {
    setErrorMessage('');
    try {
      if (useCamera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setErrorMessage('Camera permission is required to take your profile photo.');
          return;
        }
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setErrorMessage('Gallery permission is required to select your profile photo.');
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
          });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        if (asset.base64) {
          const mime = asset.mimeType || 'image/jpeg';
          setProfileImage(`data:${mime};base64,${asset.base64}`);
        } else if (asset.uri) {
          setProfileImage(asset.uri);
        }
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Could not capture or select photo.');
    }
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail || !password) {
      setErrorMessage('Please fill in your name, email, and password.');
      return;
    }

    if (isStudent && !profileImage) {
      setErrorMessage('Please capture or upload a clear front-facing profile photo for attendance.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        invite_token: token,
        email: cleanEmail,
        password,
        username: cleanName,
        role,
        phone: phone.trim() || undefined,
      };

      if (isStudent) {
        payload.profile_image = profileImage;
      } else {
        if (identifier.trim()) payload.employee_code = identifier.trim();
        if (qualification.trim()) payload.qualification = qualification.trim();
        if (specialization.trim()) payload.specialization = specialization.trim();
      }

      await authService.register(payload);
      const loginRes = await authService.login({
        email: cleanEmail,
        password,
        role,
      });

      const userData = loginRes?.data?.user || loginRes?.user;
      const authToken = loginRes?.data?.access_token || loginRes?.access_token || loginRes?.token;

      if (userData && authToken) {
        await setAuth(userData, authToken);
        router.replace('/home');
      } else {
        router.replace('/');
      }
    } catch (err) {
      setErrorMessage(err?.message || 'Registration failed. Please check your details.');
    } finally {
      setSubmitting(false);
    }
  };

  const containerStyle = {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0,
  };

  return (
    <View style={containerStyle} className="flex-1 bg-[#F5F6FA]">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardSafeView className="flex-1">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back to Login */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => router.replace('/')}
            className="flex-row items-center gap-1.5 mb-4 self-start"
          >
            <ArrowLeft size={18} color="#2563EB" />
            <Text className="text-sm font-semibold text-blue-600">Back to Login</Text>
          </TouchableOpacity>

          {loadingInfo ? (
            <View className="bg-white rounded-3xl p-8 border border-slate-200/80 items-center justify-center gap-3 mt-6">
              <ActivityIndicator size="large" color="#2563EB" />
              <Text className="text-sm font-semibold text-slate-700">
                Verifying your invite link...
              </Text>
            </View>
          ) : inviteError ? (
            <View className="bg-white rounded-3xl p-6 border border-red-200 items-center gap-3 mt-6">
              <View className="w-14 h-14 rounded-2xl bg-red-50 items-center justify-center">
                <AlertCircle size={28} color="#EF4444" />
              </View>
              <Text className="text-lg font-bold text-slate-900 text-center">
                Invite Link Unavailable
              </Text>
              <Text className="text-xs text-slate-600 text-center leading-relaxed">
                {inviteError}
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.replace('/')}
                className="mt-2 px-6 py-3 bg-[#2563EB] rounded-xl"
              >
                <Text className="text-white font-bold text-sm">Go to Login</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Invite Context Card */}
              <View className="bg-white rounded-3xl p-4 border border-slate-200/80 mb-4 flex-row items-center gap-3.5">
                <View
                  className={`w-12 h-12 rounded-2xl items-center justify-center ${
                    isStudent ? 'bg-blue-50' : 'bg-emerald-50'
                  }`}
                >
                  {isStudent ? (
                    <BookOpen size={22} color="#2563EB" />
                  ) : (
                    <GraduationCap size={22} color="#0E8F83" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-base font-bold text-slate-900">
                    {isStudent ? 'Student Course Enrollment' : 'Faculty Onboarding'}
                  </Text>
                  {isStudent ? (
                    <Text className="text-xs font-medium text-slate-600 mt-0.5">
                      {courseObj
                        ? `${courseObj.code} — ${courseObj.name}${
                            semObj?.semester_number ? ` · Semester ${semObj.semester_number}` : ''
                          }`
                        : 'Verified Course Enrollment'}
                    </Text>
                  ) : (
                    <Text className="text-xs font-medium text-slate-600 mt-0.5">
                      Create your teacher account to manage classes & attendance
                    </Text>
                  )}
                </View>
                <CheckCircle2 size={20} color="#16A34A" />
              </View>

              {/* Form Card */}
              <Card className="bg-white border-slate-200/80 rounded-3xl">
                <CardHeader>
                  <Text className="text-lg font-bold text-slate-900">
                    {isStudent ? 'Enter Your Details' : 'Faculty Profile Details'}
                  </Text>
                  <Text className="text-xs text-slate-500 mt-0.5">
                    {isStudent
                      ? 'Your roll number will be assigned automatically.'
                      : 'Single-use invite verified. Complete your profile to join AttendX.'}
                  </Text>
                </CardHeader>

                <CardContent className="gap-3.5">
                  {errorMessage ? (
                    <View className="bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                      <Text className="text-xs font-medium text-red-700">{errorMessage}</Text>
                    </View>
                  ) : null}

                  {/* Profile Photo Capture / Upload for Student Face Embedding */}
                  {isStudent && (
                    <View className="items-center bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-4">
                      <View className="w-24 h-24 rounded-full bg-blue-50 border-2 border-blue-200 items-center justify-center overflow-hidden mb-3">
                        {profileImage ? (
                          <Image
                            source={{ uri: profileImage }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        ) : (
                          <User size={36} color="#2563EB" />
                        )}
                      </View>
                      <Text className="text-xs font-bold text-slate-800 mb-1">
                        Profile Photo (Required for Face Attendance) *
                      </Text>
                      <Text className="text-[11px] text-slate-500 text-center mb-3">
                        Upload or capture a clear front-facing photo
                      </Text>
                      <View className="flex-row gap-2.5 w-full">
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => pickPhoto(true)}
                          className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-600"
                        >
                          <Camera size={15} color="#FFFFFF" />
                          <Text className="text-xs font-bold text-white">Camera</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => pickPhoto(false)}
                          className="flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-slate-200"
                        >
                          <ImageIcon size={15} color="#0F172A" />
                          <Text className="text-xs font-bold text-slate-900">Gallery</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  <View>
                    <Text className="text-xs font-medium text-slate-500 mb-1">Full Name *</Text>
                    <Input
                      placeholder="e.g. Aarav Sharma"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>

                  <View>
                    <Text className="text-xs font-medium text-slate-500 mb-1">Email Address *</Text>
                    <Input
                      placeholder="user@university.edu"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>

                  <View>
                    <Text className="text-xs font-medium text-slate-500 mb-1">Password *</Text>
                    <Input
                      placeholder="Create a strong password"
                      secureTextEntry
                      autoCapitalize="none"
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>

                  {!isStudent && (
                    <View>
                      <Text className="text-xs font-medium text-slate-500 mb-1">
                        Employee / Faculty Code
                      </Text>
                      <Input
                        placeholder="e.g. FAC-1010"
                        autoCapitalize="characters"
                        value={identifier}
                        onChangeText={setIdentifier}
                      />
                    </View>
                  )}

                  <View>
                    <Text className="text-xs font-medium text-slate-500 mb-1">Phone Number</Text>
                    <Input
                      placeholder="+91 98765 43210"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>

                  {!isStudent && (
                    <>
                      <View>
                        <Text className="text-xs font-medium text-slate-500 mb-1">Qualification</Text>
                        <Input
                          placeholder="e.g. Ph.D. CS / M.Tech"
                          value={qualification}
                          onChangeText={setQualification}
                        />
                      </View>
                      <View>
                        <Text className="text-xs font-medium text-slate-500 mb-1">Specialization</Text>
                        <Input
                          placeholder="e.g. AI, Data Structures"
                          value={specialization}
                          onChangeText={setSpecialization}
                        />
                      </View>
                    </>
                  )}
                </CardContent>

                <CardFooter>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={handleSubmit}
                    disabled={submitting}
                    className={`w-full h-12 rounded-xl items-center justify-center flex-row ${
                      submitting ? 'bg-blue-400' : 'bg-[#2563EB]'
                    }`}
                  >
                    {submitting ? (
                      <View className="flex-row items-center gap-2">
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text className="text-white font-semibold">
                          {isStudent ? 'Enrolling & Generating Face ID...' : 'Creating account...'}
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-white font-semibold text-base">
                        {isStudent ? 'Complete Enrollment' : 'Join as Teacher'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </CardFooter>
              </Card>
            </>
          )}
        </ScrollView>
      </KeyboardSafeView>
    </View>
  );
}
