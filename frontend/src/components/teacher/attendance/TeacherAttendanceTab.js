import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, RefreshControl } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AttendanceSessionStart from './AttendanceSessionStart';
import PhotoScannerCapture from './PhotoScannerCapture';
import AttendanceStatusTabs from './AttendanceStatusTabs';
import {
  useTeacherCourses,
  useScanAttendance,
  useConfirmAttendanceSession,
} from '../../../hooks/useTeacher';

export default function TeacherAttendanceTab({ user, preselectedSession }) {
  const { data: teacherCourses, isLoading: isCoursesLoading, refetch: refetchCourses } = useTeacherCourses();

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanOutcome, setScanOutcome] = useState(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const lastScanTriggerRef = useRef(null);

  const scanMutation = useScanAttendance();
  const confirmMutation = useConfirmAttendanceSession();

  // Sync preselected params or default first course accurately
  useEffect(() => {
    if (!teacherCourses || teacherCourses.length === 0) {
      if (preselectedSession?.course) {
        const fallbackCourse = {
          ...preselectedSession.course,
          subjects: preselectedSession.subject ? [preselectedSession.subject] : [],
        };
        setSelectedCourse(fallbackCourse);
        setSelectedSubject(preselectedSession.subject || null);
      }
      return;
    }

    if (preselectedSession) {
      const targetCourseId =
        preselectedSession.course?.id ||
        preselectedSession.course_id ||
        preselectedSession.courseId;
      const targetCourseCode =
        preselectedSession.course?.code ||
        preselectedSession.courseCode;

      const matchCourse = teacherCourses.find(
        (c) =>
          (targetCourseId && c.id === targetCourseId) ||
          (targetCourseCode && c.code === targetCourseCode) ||
          c.name === preselectedSession.courseName ||
          c.name === preselectedSession.course?.name
      );

      const resolvedCourse = matchCourse || teacherCourses[0];
      setSelectedCourse(resolvedCourse);

      const targetSubjectId =
        preselectedSession.subject?.id ||
        preselectedSession.subject_id ||
        preselectedSession.subjectId;
      const targetSubjectCode =
        preselectedSession.subject?.code ||
        preselectedSession.code;

      const matchSub = resolvedCourse.subjects?.find(
        (s) =>
          (targetSubjectId && s.id === targetSubjectId) ||
          (targetSubjectCode && s.code === targetSubjectCode) ||
          s.name === preselectedSession.subjectName ||
          s.name === preselectedSession.subject?.name
      );

      setSelectedSubject(matchSub || resolvedCourse.subjects?.[0] || preselectedSession.subject || null);
    } else if (!selectedCourse) {
      const firstCourse = teacherCourses[0];
      setSelectedCourse(firstCourse);
      setSelectedSubject(firstCourse.subjects?.[0] || null);
    }
  }, [preselectedSession, teacherCourses]);

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setSelectedSubject(course.subjects?.[0] || null);
    setScanResult(null);
    setScanOutcome(null);
    setIsConfirmed(false);
  };

  const handleSelectSubject = (subject) => {
    setSelectedSubject(subject);
    setScanResult(null);
    setScanOutcome(null);
    setIsConfirmed(false);
  };

  // Camera capture
  const handleTakePhoto = async () => {
    setErrorMessage('');
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage('Camera access is required to take classroom photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Data = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setCapturedPhotos((prev) => [...prev, base64Data]);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Camera capture failed.');
    }
  };

  // Auto-open camera when launched with autoLaunchCamera
  useEffect(() => {
    if (!preselectedSession?.autoLaunchCamera) return;
    const triggerKey = preselectedSession.scanTriggerId || 'auto';
    if (lastScanTriggerRef.current === triggerKey) return;
    lastScanTriggerRef.current = triggerKey;

    const timer = setTimeout(() => {
      handleTakePhoto();
    }, 150);

    return () => clearTimeout(timer);
  }, [preselectedSession?.autoLaunchCamera, preselectedSession?.scanTriggerId]);

  // Gallery multi-selection
  const handlePickGallery = async () => {
    setErrorMessage('');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map((a) =>
          a.base64 ? `data:image/jpeg;base64,${a.base64}` : a.uri
        );
        setCapturedPhotos((prev) => [...prev, ...newPhotos]);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Gallery upload failed.');
    }
  };

  const handleRemovePhoto = (index) => {
    setCapturedPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Submit scan to AI pipeline
  const handleSubmitScan = async () => {
    if (capturedPhotos.length === 0) {
      setErrorMessage('Please capture or upload at least one classroom photo.');
      return;
    }
    setErrorMessage('');
    setIsConfirmed(false);
    setScanOutcome(null);

    try {
      const payload = {
        photos: capturedPhotos,
        course_id: selectedCourse?.id,
        course: selectedCourse?.code || selectedCourse?.name,
        subject_id: selectedSubject?.id,
        subject: selectedSubject?.name || '',
        room: selectedSubject?.room || '',
        semester_id: selectedSubject?.semester_id,
      };

      const res = await scanMutation.mutateAsync(payload);
      if (res?.data) {
        setScanResult(res.data);
        const foundCount =
          res.data.present_students?.length || res.data.total_detected_faces || 0;
        setScanOutcome(foundCount > 0 ? 'detected' : 'no_face');
      } else {
        setScanOutcome('no_face');
      }
    } catch (err) {
      setScanOutcome('error');
      setErrorMessage(err.message || 'AI recognition failed. Please try again.');
    }
  };

  // When a student record is updated manually in modal or quick-toggle
  const handleRecordUpdated = (updatedRecord) => {
    if (!scanResult) return;

    // Collect all existing students uniquely
    const all = [
      ...(scanResult.present_students || []),
      ...(scanResult.absent_students || []),
    ].map((r) => {
      const matchKey = (r.id && updatedRecord.id && r.id === updatedRecord.id) ||
        (r.student_id && updatedRecord.student_id && r.student_id === updatedRecord.student_id) ||
        (r.roll_number && updatedRecord.roll_number && r.roll_number === updatedRecord.roll_number);
      return matchKey ? updatedRecord : r;
    });

    setScanResult({
      ...scanResult,
      present_students: all.filter((r) => r.status === 'Present'),
      absent_students: all.filter((r) => r.status === 'Absent'),
    });
  };

  // Confirm attendance and complete class session
  const handleConfirmAttendance = async (allRecords) => {
    try {
      const sessionId = scanResult?.id;
      if (sessionId) {
        const recordsPayload = (allRecords || []).map((r) => ({
          id: r.id,
          student_id: r.student_id,
          status: r.status,
        }));
        await confirmMutation.mutateAsync({
          sessionId,
          records: recordsPayload,
        });
      }
      setIsConfirmed(true);
    } catch (err) {
      setIsConfirmed(true);
    }
  };

  // Move to next class session smoothly
  const handleNextClass = () => {
    setCapturedPhotos([]);
    setScanResult(null);
    setScanOutcome(null);
    setIsConfirmed(false);
    setErrorMessage('');

    // Advance to next subject in course if available
    const subs = selectedCourse?.subjects || [];
    if (subs.length > 1 && selectedSubject) {
      const currentIdx = subs.findIndex(
        (s) => (s.id && s.id === selectedSubject.id) || (s.code && s.code === selectedSubject.code)
      );
      const nextIdx = (currentIdx + 1) % subs.length;
      setSelectedSubject(subs[nextIdx]);
    }
  };

  return (
    <ScrollView
      className="flex-1 px-4 pt-3"
      contentContainerStyle={{ paddingBottom: 130 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isCoursesLoading}
          onRefresh={refetchCourses}
          tintColor="#0066FF"
        />
      }
    >
      {/* 1. Active Session Parameters: Clean Card with Switch Modal */}
      <AttendanceSessionStart
        courses={teacherCourses || []}
        selectedCourse={selectedCourse}
        selectedSubject={selectedSubject}
        onSelectCourse={handleSelectCourse}
        onSelectSubject={handleSelectSubject}
      />

      {/* 2. Photo Capture / Scanner with Apple-style Analyze Button & Animation */}
      <PhotoScannerCapture
        photos={capturedPhotos}
        onTakePhoto={handleTakePhoto}
        onPickGallery={handlePickGallery}
        onRemovePhoto={handleRemovePhoto}
        onSubmitScan={handleSubmitScan}
        isScanning={scanMutation.isPending}
        scanOutcome={scanOutcome}
        errorMessage={errorMessage}
      />

      {/* 3. AI Results with Present & Absent verification */}
      {scanResult ? (
        <AttendanceStatusTabs
          scanResult={scanResult}
          onRecordUpdated={handleRecordUpdated}
          onConfirmAttendance={handleConfirmAttendance}
          isConfirming={confirmMutation.isPending}
          isConfirmed={isConfirmed}
          onNextClass={handleNextClass}
        />
      ) : null}
    </ScrollView>
  );
}
