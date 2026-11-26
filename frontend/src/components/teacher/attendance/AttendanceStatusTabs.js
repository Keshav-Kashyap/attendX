import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, Image, TextInput, ActivityIndicator } from 'react-native';
import { Text } from '../../ui/text';
import { Badge } from '../../ui/badge';
import Icon from '../../ui/Icon';
import AttendanceCorrectionModal from './AttendanceCorrectionModal';

export default function AttendanceStatusTabs({
  scanResult,
  onRecordUpdated,
  onConfirmAttendance,
  isConfirming = false,
  isConfirmed = false,
  onNextClass,
}) {
  const [activeTab, setActiveTab] = useState('present'); // 'present' or 'absent'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  // De-duplicate all students by ID or roll_number
  const allRecords = useMemo(() => {
    if (!scanResult) return [];
    const list = [
      ...(scanResult.present_students || []).map((s) => ({
        ...s,
        status: s.status === 'Present' ? 'Present' : 'Absent',
      })),
      ...(scanResult.absent_students || []).map((s) => ({
        ...s,
        status: s.status === 'Present' ? 'Present' : 'Absent',
      })),
    ];

    const seen = new Set();
    return list.filter((item) => {
      const key = item.id || item.student_id || item.roll_number || item.name;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [scanResult]);

  if (!scanResult) return null;

  const presentList = allRecords.filter((r) => r.status === 'Present');
  const absentList = allRecords.filter((r) => r.status === 'Absent');

  const activeStudents = (activeTab === 'present' ? presentList : absentList).filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.roll_number && s.roll_number.toLowerCase().includes(q))
    );
  });

  const attendancePercentage = Math.round(
    (presentList.length / Math.max(allRecords.length, 1)) * 100
  );

  const handleOpenCorrection = (record) => {
    setSelectedRecordForCorrection(record);
    setShowCorrectionModal(true);
  };

  // Quick 1-tap manual tick to mark student as Present
  const handleMarkPresent = (std) => {
    if (onRecordUpdated) {
      onRecordUpdated({
        ...std,
        status: 'Present',
        confidence: std.confidence || 'Manual',
        remarks: 'Manually verified by faculty',
      });
    }
  };

  // Quick 1-tap toggle to mark student as Absent
  const handleMarkAbsent = (std) => {
    if (onRecordUpdated) {
      onRecordUpdated({
        ...std,
        status: 'Absent',
        confidence: null,
        remarks: 'Marked absent by faculty',
      });
    }
  };

  return (
    <View className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm mb-4">
      {/* Header: Recognition Results & Summary */}
      <View className="flex-row items-center justify-between pb-3 border-b border-border/60 mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-sm font-semibold text-foreground">
            Attendance Verification
          </Text>
          <Text className="text-[11px] text-muted-foreground mt-0.5">
            Session: {scanResult.session_code || 'ATT-LIVE'} • {allRecords.length} Enrolled Students
          </Text>
        </View>

        <Badge
          variant="outline"
          className={`px-2.5 py-1 ${
            isConfirmed
              ? 'bg-emerald-500/15 border-emerald-500/30'
              : 'bg-primary/10 border-primary/25'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              isConfirmed ? 'text-emerald-600' : 'text-primary'
            }`}
          >
            {isConfirmed ? '✓ Completed' : `${attendancePercentage}% Rate`}
          </Text>
        </Badge>
      </View>

      {/* Modern Status Tabs Segmented Bar (Only Present & Absent) */}
      <View className="flex-row bg-muted/40 p-1 rounded-xl border border-border/60 mb-3">
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setActiveTab('present')}
          className={`flex-1 py-2.5 rounded-lg items-center justify-center flex-row gap-1.5 ${
            activeTab === 'present' ? 'bg-emerald-500' : 'bg-transparent'
          }`}
        >
          <Icon
            name="check"
            size={14}
            color={activeTab === 'present' ? '#ffffff' : '#10b981'}
          />
          <Text
            className={`text-xs font-bold ${
              activeTab === 'present' ? 'text-white' : 'text-muted-foreground'
            }`}
          >
            Present ({presentList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setActiveTab('absent')}
          className={`flex-1 py-2.5 rounded-lg items-center justify-center flex-row gap-1.5 ${
            activeTab === 'absent' ? 'bg-destructive' : 'bg-transparent'
          }`}
        >
          <Icon
            name="close"
            size={14}
            color={activeTab === 'absent' ? '#ffffff' : '#ef4444'}
          />
          <Text
            className={`text-xs font-bold ${
              activeTab === 'absent' ? 'text-white' : 'text-muted-foreground'
            }`}
          >
            Absent ({absentList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter / Search Input */}
      {allRecords.length > 4 ? (
        <View className="flex-row items-center bg-muted/30 border border-border/70 rounded-xl px-3 py-1.5 mb-3">
          <Icon name="search" size={14} color="#64748b" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search student or roll number..."
            placeholderTextColor="#94a3b8"
            className="flex-1 ml-2 text-xs text-foreground font-medium py-1"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text className="text-muted-foreground text-xs font-bold">✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {/* Students List */}
      {activeStudents.length === 0 ? (
        <View className="py-8 items-center justify-center bg-muted/20 rounded-xl">
          <Text className="text-xs text-muted-foreground font-medium">
            No students in {activeTab} status
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {activeStudents.map((std, idx) => (
            <View
              key={std.id || std.student_id || std.roll_number || idx}
              className="p-3 bg-muted/20 rounded-xl border border-border/70 flex-row items-center justify-between"
            >
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center overflow-hidden border border-primary/20 mr-2.5">
                  {std.profile_image ? (
                    <Image source={{ uri: std.profile_image }} className="w-full h-full" />
                  ) : (
                    <Text className="text-xs font-bold text-primary">
                      {std.name?.charAt(0).toUpperCase() || 'S'}
                    </Text>
                  )}
                </View>

                <View className="flex-1">
                  <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>
                    {std.name || `Student ${idx + 1}`}
                  </Text>
                  <View className="flex-row items-center gap-1.5 mt-0.5">
                    <Text className="text-[10px] text-muted-foreground">
                      {std.roll_number || 'STU-001'}
                    </Text>
                    {std.status === 'Present' && std.confidence ? (
                      <>
                        <Text className="text-[9px] text-muted-foreground">•</Text>
                        <Text className="text-[10px] text-emerald-600 font-medium">
                          {std.confidence === 'Manual' ? 'Manual ✓' : `${std.confidence} match`}
                        </Text>
                      </>
                    ) : std.status === 'Absent' && std.remarks ? (
                      <>
                        <Text className="text-[9px] text-muted-foreground">•</Text>
                        <Text className="text-[10px] text-muted-foreground" numberOfLines={1}>
                          {std.remarks.includes('Biometric') ? 'No Biometrics' : 'Not Detected'}
                        </Text>
                      </>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Status Actions: Manual 1-Tap Tick for Absent, Quick Undo for Present */}
              <View className="flex-row items-center gap-1.5">
                {activeTab === 'absent' ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleMarkPresent(std)}
                    className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 active:bg-emerald-500/25"
                  >
                    <Icon name="check" size={13} color="#10b981" />
                    <Text className="text-[11px] font-bold text-emerald-600">
                      Mark Present
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleMarkAbsent(std)}
                    className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-xl bg-muted/60 border border-border active:bg-muted"
                  >
                    <Icon name="close" size={12} color="#64748b" />
                    <Text className="text-[10px] font-medium text-muted-foreground">
                      Mark Absent
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleOpenCorrection(std)}
                  className="w-7 h-7 rounded-lg bg-muted/60 border border-border items-center justify-center"
                >
                  <Icon name="pencil" size={13} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Confirmation & Complete Class Section */}
      <View className="mt-4 pt-3 border-t border-border/60">
        {isConfirmed ? (
          <View className="gap-2.5">
            <View className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3 flex-row items-center gap-2.5">
              <View className="w-7 h-7 rounded-full bg-emerald-500 items-center justify-center">
                <Icon name="check" size={15} color="#ffffff" />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  Class Attendance Confirmed!
                </Text>
                <Text className="text-[11px] text-emerald-600/90 dark:text-emerald-400/80 mt-0.5">
                  {presentList.length} Present • {absentList.length} Absent • Attendance finalized
                </Text>
              </View>
            </View>

            {onNextClass ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onNextClass}
                className="bg-primary active:bg-primary/90 py-3 rounded-xl flex-row items-center justify-center gap-2"
              >
                <Icon name="calendar" size={16} color="#ffffff" />
                <Text className="text-white text-xs font-bold">
                  Take Attendance for Next Class
                </Text>
                <Icon name="arrow-forward" size={14} color="#ffffff" />
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          <View className="gap-2">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onConfirmAttendance && onConfirmAttendance(allRecords)}
              disabled={isConfirming}
              className={`py-3.5 px-4 rounded-xl flex-row items-center justify-center gap-2 ${
                isConfirming ? 'bg-emerald-600/70' : 'bg-emerald-600 active:bg-emerald-700'
              }`}
            >
              {isConfirming ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Icon name="check" size={16} color="#ffffff" />
              )}
              <Text className="text-white text-xs font-bold">
                {isConfirming ? 'Confirming...' : 'Confirm Attendance'}
              </Text>
            </TouchableOpacity>

            <Text className="text-[10px] text-center text-muted-foreground">
              Review students and tap confirm to complete this lecture session.
            </Text>
          </View>
        )}
      </View>

      {/* Manual Correction Modal */}
      <AttendanceCorrectionModal
        visible={showCorrectionModal}
        onClose={() => setShowCorrectionModal(false)}
        record={selectedRecordForCorrection}
        onRecordUpdated={onRecordUpdated}
      />
    </View>
  );
}
