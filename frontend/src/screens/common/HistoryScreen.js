import React, { useState } from 'react';
import { View, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Text } from '../../components/ui/text';
import {
  StudentSubjectWiseList,
  StudentEmptyState,
} from '../../components/student';
import { Skeleton } from '../../components/ui/Skeleton';
import { useStudentAttendance } from '../../hooks/useStudent';
import { useTeacherAttendanceHistory } from '../../hooks/useTeacher';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Clock,
  MapPin,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react-native';

export default function HistoryScreen({ user }) {
  const isTeacher = user?.role === 'teacher';
  const [activeTab, setActiveTab] = useState('subject_wise'); // 'subject_wise' | 'sessions'

  // Student Attendance Query
  const {
    data: studentData,
    isLoading: isStudentLoading,
    isError: isStudentError,
    error: studentError,
    refetch: refetchStudent,
    isRefetching: isStudentRefetching,
  } = useStudentAttendance();

  // Teacher Attendance Query
  const {
    data: teacherSessions,
    isLoading: isTeacherLoading,
    isError: isTeacherError,
    error: teacherError,
    refetch: refetchTeacher,
    isRefetching: isTeacherRefetching,
  } = useTeacherAttendanceHistory();

  const isLoading = isTeacher ? isTeacherLoading : isStudentLoading;
  const isRefetching = isTeacher ? isTeacherRefetching : isStudentRefetching;
  const isError = isTeacher ? isTeacherError : isStudentError;
  const errorObj = isTeacher ? teacherError : studentError;
  const handleRefetch = isTeacher ? refetchTeacher : refetchStudent;

  const summary = studentData?.summary;
  const subjects = studentData?.subject_wise || [];
  const sessionRecords = studentData?.records || [];

  return (
    <ScrollView
      className="flex-1 bg-[#F5F6FA] px-4 pt-2"
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={handleRefetch}
          colors={['#3446D4']}
          tintColor="#3446D4"
        />
      }
    >
      {/* Page Title */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 19, fontWeight: '600', color: '#0f172a' }}>
          {isTeacher ? 'Attendance Records' : 'Attendance History'}
        </Text>
        <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
          {isTeacher
            ? 'Conducted batch classroom attendance sessions'
            : 'Detailed subject-wise breakdown & past activity logs'}
        </Text>
      </View>

      {/* Loading Skeleton */}
      {isLoading ? (
        <View style={{ gap: 14 }}>
          {/* Top Banner Skeleton */}
          <View style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', gap: 10 }}>
            <Skeleton width={140} height={18} borderRadius={6} />
            <Skeleton width="100%" height={24} borderRadius={6} />
          </View>
          {/* Segmented Control Skeleton */}
          <Skeleton width="100%" height={42} borderRadius={14} />
          {/* Cards Skeleton */}
          {[1, 2, 3].map((k) => (
            <View key={k} style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', gap: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Skeleton width={150} height={18} borderRadius={6} />
                <Skeleton width={60} height={24} borderRadius={12} />
              </View>
              <Skeleton width="100%" height={6} borderRadius={3} />
              <Skeleton width={120} height={14} borderRadius={4} />
            </View>
          ))}
        </View>
      ) : isError ? (
        /* Error State with Retry */
        <View
          style={{
            padding: 20,
            backgroundColor: '#fef2f2',
            borderWidth: 1,
            borderColor: '#fecaca',
            borderRadius: 20,
            alignItems: 'center',
            marginVertical: 10,
          }}
        >
          <AlertCircle size={32} color="#dc2626" />
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#dc2626', marginTop: 8 }}>
            Failed to Load Attendance History
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4, maxWidth: 280 }}>
            {errorObj?.message || 'Server error while fetching attendance details.'}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleRefetch()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: 12,
              backgroundColor: '#dc2626',
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 12,
            }}
          >
            <RefreshCw size={14} color="#ffffff" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#ffffff' }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : isTeacher ? (
        /* Teacher View: Conducted Sessions List */
        <View>
          {!teacherSessions || teacherSessions.length === 0 ? (
            <StudentEmptyState
              icon={Calendar}
              title="No Sessions Conducted"
              description="No attendance sessions have been initiated or recorded yet."
            />
          ) : (
            <View style={{ gap: 10 }}>
              {teacherSessions.map((s, idx) => (
                <View
                  key={s.id || idx}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                    padding: 16,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    shadowColor: '#0f172a',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.03,
                    shadowRadius: 4,
                    elevation: 1,
                  }}
                >
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>
                      {s.subject || s.subject_name || 'Classroom Session'}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      {s.created_at ? new Date(s.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'} • {s.room || 'Room 204'}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#eff6ff', borderRadius: 10 }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#0052cc' }}>
                        {s.total_present ?? s.total_detected ?? 0} Present
                      </Text>
                    </View>
                    <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
                      {s.session_code || ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      ) : (
        /* Student View: Subject-wise Breakdown & Session Timeline */
        <View>
          {/* Top Overall Ratio Summary Card */}
          <View
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#f1f5f9',
              padding: 13,
              marginBottom: 12,
              shadowColor: '#0f172a',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748b' }}>
                  Overall Ratio
                </Text>
                <Text style={{ fontSize: 23, fontWeight: '600', color: '#0f172a', marginTop: 1 }}>
                  {summary?.attendance_percentage ?? 0}%
                </Text>
              </View>

              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: (summary?.attendance_percentage ?? 0) >= 75 ? '#ecfdf5' : '#fef2f2',
                  borderWidth: 1,
                  borderColor: (summary?.attendance_percentage ?? 0) >= 75 ? '#a7f3d0' : '#fecaca',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {(summary?.attendance_percentage ?? 0) >= 75 ? (
                  <ShieldCheck size={14} color="#059669" />
                ) : (
                  <AlertTriangle size={14} color="#dc2626" />
                )}
                <Text
                  style={{
                    fontSize: 11.5,
                    fontWeight: '600',
                    color: (summary?.attendance_percentage ?? 0) >= 75 ? '#059669' : '#dc2626',
                  }}
                >
                  {summary?.status || 'Active'}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 10, paddingTop: 9, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
              <Text style={{ fontSize: 12, color: '#64748b' }}>
                Attended:{' '}
                <Text style={{ fontWeight: '600', color: '#10b981' }}>
                  {summary?.attended_classes ?? 0}
                </Text>
              </Text>
              <Text style={{ fontSize: 12, color: '#64748b' }}>
                Conducted:{' '}
                <Text style={{ fontWeight: '600', color: '#0f172a' }}>
                  {summary?.total_classes ?? 0}
                </Text>
              </Text>
              <Text style={{ fontSize: 12, color: '#64748b' }}>
                Missed:{' '}
                <Text style={{ fontWeight: '600', color: '#ef4444' }}>
                  {summary?.absent_classes ?? 0}
                </Text>
              </Text>
            </View>
          </View>

          {/* Segmented Control Tabs */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#e9ecf2',
              borderRadius: 14,
              padding: 3,
              marginBottom: 12,
            }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('subject_wise')}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: 'center',
                borderRadius: 11,
                backgroundColor: activeTab === 'subject_wise' ? '#ffffff' : 'transparent',
                shadowColor: activeTab === 'subject_wise' ? '#0f172a' : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: activeTab === 'subject_wise' ? 0.06 : 0,
                shadowRadius: 3,
                elevation: activeTab === 'subject_wise' ? 1 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: activeTab === 'subject_wise' ? '600' : '500',
                  color: activeTab === 'subject_wise' ? '#3446D4' : '#64748b',
                }}
              >
                Subject Breakdown
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveTab('sessions')}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: 'center',
                borderRadius: 11,
                backgroundColor: activeTab === 'sessions' ? '#ffffff' : 'transparent',
                shadowColor: activeTab === 'sessions' ? '#0f172a' : 'transparent',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: activeTab === 'sessions' ? 0.06 : 0,
                shadowRadius: 3,
                elevation: activeTab === 'sessions' ? 1 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: activeTab === 'sessions' ? '600' : '500',
                  color: activeTab === 'sessions' ? '#3446D4' : '#64748b',
                }}
              >
                Session Logs ({sessionRecords.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab 1: Subject-wise Breakdown */}
          {activeTab === 'subject_wise' && (
            <StudentSubjectWiseList subjects={subjects} />
          )}

          {/* Tab 2: Session Logs */}
          {activeTab === 'sessions' && (
            <View>
              {sessionRecords.length === 0 ? (
                <StudentEmptyState
                  icon={Clock}
                  title="No Session Logs"
                  description="No attendance logs have been recorded for your enrolled courses yet."
                />
              ) : (
                <View style={{ gap: 10 }}>
                  {sessionRecords.map((item, idx) => {
                    const normalizedStatus = (item.status || '').toLowerCase().trim();
                    const isPresent = normalizedStatus === 'present';
                    const isNotHeld =
                      item.is_conducted === false ||
                      normalizedStatus === 'class not held' ||
                      normalizedStatus === 'not held' ||
                      normalizedStatus === 'not_held';
                    const subjectCode = item.subject_code || '';
                    const subjectName = item.subject_name || 'Lecture';
                    const dateStr = item.formatted_date || (item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recorded');
                    const timeStr = item.time || '';
                    const room = item.room || 'Room 204';
                    const teacherName = item.teacher_name || 'Faculty';

                    return (
                      <View
                        key={item.id || idx}
                        style={{
                          backgroundColor: '#ffffff',
                          borderRadius: 18,
                          borderWidth: 1,
                          borderColor: '#f1f5f9',
                          padding: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          shadowColor: '#0f172a',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.04,
                          shadowRadius: 8,
                          elevation: 2,
                        }}
                      >
                        {/* Icon Indicator */}
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            backgroundColor: isPresent ? '#ecfdf5' : isNotHeld ? '#f1f5f9' : '#fef2f2',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                          }}
                        >
                          {isPresent ? (
                            <CheckCircle2 size={20} color="#10b981" />
                          ) : isNotHeld ? (
                            <MinusCircle size={20} color="#64748b" />
                          ) : (
                            <XCircle size={20} color="#ef4444" />
                          )}
                        </View>

                        {/* Middle Content */}
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text
                            numberOfLines={1}
                            style={{
                              fontSize: 14,
                              fontWeight: '600',
                              color: '#0f172a',
                              marginBottom: 3,
                            }}
                          >
                            {subjectCode ? `${subjectCode} · ${subjectName}` : subjectName}
                          </Text>

                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                            <Text style={{ fontSize: 11, color: '#64748b' }}>
                              {dateStr}{timeStr ? ` • ${timeStr}` : ''}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                              <MapPin size={10} color="#94a3b8" />
                              <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                                {room}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {/* Status Badge */}
                        <View
                          style={{
                            paddingHorizontal: 9,
                            paddingVertical: 4,
                            backgroundColor: isPresent ? '#ecfdf5' : isNotHeld ? '#f1f5f9' : '#fef2f2',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: isPresent ? '#a7f3d0' : isNotHeld ? '#cbd5e1' : '#fecaca',
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '600',
                              color: isPresent ? '#059669' : isNotHeld ? '#475569' : '#dc2626',
                            }}
                          >
                            {isPresent ? 'Present' : isNotHeld ? 'Class Not Held' : 'Absent'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
