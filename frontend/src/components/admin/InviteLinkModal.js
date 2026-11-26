import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Pressable,
  Share,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import * as Linking from 'expo-linking';
import Svg, { Path } from 'react-native-svg';
import QRCode from 'qrcode/lib/core/qrcode';
import { X, Copy, Check, Share2, QrCode, RefreshCw, ShieldCheck } from 'lucide-react-native';
import { Text } from '../ui/text';
import { useAdminCourses, useCourseSemesters } from '../../hooks/useAdmin';
import { authService } from '../../services/authService';

function buildQrPath(value) {
  if (!value) return { size: 21, d: '' };
  try {
    const qr = QRCode.create(value, {
      errorCorrectionLevel: 'M',
    });
    const size = qr.modules.size;
    const data = qr.modules.data;
    let d = '';
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        if (data[r * size + c]) {
          d += `M${c},${r}h1v1h-1z`;
        }
      }
    }
    return { size, d };
  } catch (e) {
    return { size: 21, d: '' };
  }
}

export default function InviteLinkModal({
  visible,
  onClose,
  type = 'student', // 'student' | 'teacher'
  course = null,
  semesterObj = null,
  allowSwitch = false,
}) {
  const [copied, setCopied] = useState(false);
  const [activeType, setActiveType] = useState(type);
  const [pickedCourseId, setPickedCourseId] = useState(course?.id || null);
  const [pickedSemesterId, setPickedSemesterId] = useState(
    semesterObj?.id ?? semesterObj?.semester_number ?? null
  );

  const [tokenData, setTokenData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const needsPicker = allowSwitch && !course;
  const { data: coursesList = [] } = useAdminCourses({
    enabled: Boolean(visible && needsPicker),
  });
  const effectiveCourse = useMemo(() => {
    if (course) return course;
    return coursesList.find((c) => String(c.id) === String(pickedCourseId)) || coursesList[0] || null;
  }, [course, coursesList, pickedCourseId]);

  const { data: semestersList = [] } = useCourseSemesters(
    activeType === 'student' && needsPicker ? effectiveCourse?.id : null
  );
  const effectiveSemester = useMemo(() => {
    if (semesterObj) return semesterObj;
    return (
      semestersList.find(
        (s) =>
          String(s.id) === String(pickedSemesterId) ||
          String(s.semester_number) === String(pickedSemesterId)
      ) ||
      semestersList[0] ||
      null
    );
  }, [semesterObj, semestersList, pickedSemesterId]);

  useEffect(() => {
    if (visible) {
      setActiveType(type);
      setPickedCourseId(course?.id || null);
      setPickedSemesterId(semesterObj?.id ?? semesterObj?.semester_number ?? null);
      setCopied(false);
    } else {
      setTokenData(null);
      setTokenError('');
    }
  }, [visible, type, course?.id, semesterObj?.id, semesterObj?.semester_number]);

  const generateToken = useCallback(async () => {
    if (!visible) return;
    if (activeType === 'student' && !effectiveCourse?.id) return;

    setGenerating(true);
    setTokenError('');
    setCopied(false);
    try {
      const res = await authService.createInviteToken({
        role: activeType,
        courseId: activeType === 'student' ? effectiveCourse?.id : undefined,
        semesterId:
          activeType === 'student'
            ? effectiveSemester?.id ?? effectiveSemester?.semester_number
            : undefined,
        expiresInMinutes: 15,
      });
      setTokenData(res?.data || null);
    } catch (err) {
      setTokenError(err?.message || 'Failed to generate invite token');
      setTokenData(null);
    } finally {
      setGenerating(false);
    }
  }, [
    visible,
    activeType,
    effectiveCourse?.id,
    effectiveSemester?.id,
    effectiveSemester?.semester_number,
  ]);

  useEffect(() => {
    generateToken();
  }, [generateToken]);

  const inviteUrl = useMemo(() => {
    if (!tokenData?.token) return '';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return `${window.location.origin}/enroll?token=${encodeURIComponent(tokenData.token)}`;
    }
    return Linking.createURL('/enroll', {
      queryParams: { token: tokenData.token },
    });
  }, [tokenData?.token]);

  const { size, d } = useMemo(() => buildQrPath(inviteUrl), [inviteUrl]);

  const isStudent = activeType === 'student';
  const semLabel = effectiveSemester?.semester_number
    ? `Semester ${effectiveSemester.semester_number}`
    : '';

  const handleCopy = async () => {
    if (!inviteUrl) return;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
        return;
      }
      await Share.share({
        message: inviteUrl,
      });
    } catch (e) {
      // ignore
    }
  };

  const handleShare = async () => {
    if (!inviteUrl) return;
    const title = isStudent
      ? `Enroll in ${effectiveCourse?.code || 'Course'}${semLabel ? ` (${semLabel})` : ''}`
      : 'Teacher Onboarding Invite';
    try {
      await Share.share({
        title,
        message: isStudent
          ? `Join ${effectiveCourse?.name || effectiveCourse?.code || 'the course'}${semLabel ? ` - ${semLabel}` : ''} on AttendX (Single-use link, valid for 15 mins):\n${inviteUrl}`
          : `Join AttendX as a Faculty Member (Single-use link, valid for 15 mins):\n${inviteUrl}`,
        url: inviteUrl,
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/50 items-center justify-center px-5"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full max-w-sm bg-white rounded-3xl p-5 border border-slate-200"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2 flex-1 mr-2">
              <View className="w-9 h-9 rounded-xl bg-blue-50 items-center justify-center">
                <QrCode size={18} color="#2563EB" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold text-slate-900">
                  {isStudent ? 'Student Enrollment QR' : 'Teacher Invite QR'}
                </Text>
                <Text className="text-xs text-slate-500" numberOfLines={1}>
                  {isStudent
                    ? `${effectiveCourse?.code || 'Select Course'}${semLabel ? ` · ${semLabel}` : ''}`
                    : 'Direct faculty onboarding link'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
            >
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Security Badge */}
          <View className="flex-row items-center justify-between bg-emerald-50 border border-emerald-200/80 rounded-xl px-3 py-1.5 mb-2.5">
            <View className="flex-row items-center gap-1.5">
              <ShieldCheck size={14} color="#059669" />
              <Text className="text-[11px] font-semibold text-emerald-800">
                Single-use token · Valid for 15 mins
              </Text>
            </View>
            <TouchableOpacity
              onPress={generateToken}
              disabled={generating}
              className="flex-row items-center gap-1"
            >
              <RefreshCw size={12} color="#059669" />
              <Text className="text-[11px] font-bold text-emerald-700">New QR</Text>
            </TouchableOpacity>
          </View>

          {/* Optional Role & Course/Semester Picker when opened from SpeedDial */}
          {needsPicker && (
            <View className="mb-2">
              <View className="flex-row bg-slate-100 p-1 rounded-xl mb-2.5">
                {['student', 'teacher'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    activeOpacity={0.8}
                    onPress={() => setActiveType(r)}
                    className={`flex-1 py-1.5 rounded-lg items-center ${
                      activeType === r ? 'bg-white' : ''
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        activeType === r ? 'text-slate-900' : 'text-slate-500'
                      }`}
                    >
                      {r === 'student' ? 'Student' : 'Teacher'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {isStudent && coursesList.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-2"
                >
                  <View className="flex-row gap-1.5">
                    {coursesList.map((c) => {
                      const active = effectiveCourse?.id === c.id;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => {
                            setPickedCourseId(c.id);
                            setPickedSemesterId(null);
                          }}
                          className={`px-3 py-1.5 rounded-full border ${
                            active
                              ? 'bg-blue-600 border-blue-600'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <Text
                            className={`text-[11px] font-bold ${
                              active ? 'text-white' : 'text-slate-700'
                            }`}
                          >
                            {c.code}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              )}

              {isStudent && semestersList.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-1"
                >
                  <View className="flex-row gap-1.5">
                    {semestersList.map((s) => {
                      const active = effectiveSemester?.id === s.id;
                      return (
                        <TouchableOpacity
                          key={s.id || s.semester_number}
                          onPress={() => setPickedSemesterId(s.id)}
                          className={`px-2.5 py-1 rounded-full border ${
                            active
                              ? 'bg-blue-50 border-blue-500'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <Text
                            className={`text-[11px] font-semibold ${
                              active ? 'text-blue-700' : 'text-slate-600'
                            }`}
                          >
                            Sem {s.semester_number}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </View>
          )}

          {/* QR Code Box */}
          <View className="items-center justify-center bg-[#F8FAFC] border border-slate-200/80 rounded-2xl py-5 px-4 my-1.5 min-h-[220px]">
            {generating ? (
              <View className="items-center gap-2">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="text-xs text-slate-500">Generating secure QR token...</Text>
              </View>
            ) : tokenError ? (
              <View className="items-center gap-2 px-3">
                <Text className="text-xs text-red-600 text-center font-medium">{tokenError}</Text>
                <TouchableOpacity
                  onPress={generateToken}
                  className="px-4 py-2 bg-blue-600 rounded-xl"
                >
                  <Text className="text-xs font-bold text-white">Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View className="bg-white p-3.5 rounded-2xl border border-slate-200">
                  {d ? (
                    <Svg width={176} height={176} viewBox={`0 0 ${size} ${size}`}>
                      <Path d={d} fill="#0F172A" />
                    </Svg>
                  ) : null}
                </View>
                <Text className="text-xs text-slate-500 text-center mt-3 px-2">
                  {isStudent
                    ? 'Valid for 1 student enrollment. Tap "New QR" to generate another.'
                    : 'Valid for 1 teacher onboarding. Tap "New QR" to generate another.'}
                </Text>
              </>
            )}
          </View>

          {/* Direct Link Preview */}
          <View className="bg-slate-100 rounded-xl px-3 py-2.5 mt-2 mb-3">
            <Text numberOfLines={2} className="text-[11px] font-medium text-slate-600">
              {inviteUrl || 'Generating link...'}
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row gap-2.5">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCopy}
              disabled={!inviteUrl || generating}
              className="flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-100 border border-slate-200"
            >
              {copied ? (
                <>
                  <Check size={15} color="#16A34A" strokeWidth={2.5} />
                  <Text className="text-xs font-bold text-emerald-700">Copied</Text>
                </>
              ) : (
                <>
                  <Copy size={15} color="#0F172A" />
                  <Text className="text-xs font-bold text-slate-900">Copy Link</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleShare}
              disabled={!inviteUrl || generating}
              className="flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-xl bg-[#2563EB]"
            >
              <Share2 size={15} color="#FFFFFF" />
              <Text className="text-xs font-bold text-white">Share Link</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
