import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, Image, TextInput } from 'react-native';
import { Text } from '../../ui/text';
import { Badge } from '../../ui/badge';
import Icon from '../../ui/Icon';
import AttendanceCorrectionModal from './AttendanceCorrectionModal';

export default function AttendanceStatusTabs({ scanResult, onRecordUpdated }) {
  const [activeTab, setActiveTab] = useState('present'); // 'present', 'absent', 'late', 'pending'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);

  // De-duplicate all students by ID or roll_number
  const allRecords = useMemo(() => {
    if (!scanResult) return [];
    const list = [
      ...(scanResult.present_students || []).map((s) => ({ ...s, status: s.status || 'Present' })),
      ...(scanResult.absent_students || []).map((s) => ({ ...s, status: s.status || 'Absent' })),
      ...(scanResult.late_students || []).map((s) => ({ ...s, status: s.status || 'Late' })),
      ...(scanResult.pending_students || []).map((s) => ({ ...s, status: s.status || 'Pending Verification' })),
    ];

    const seen = new Set();
    return list.filter((item) => {
      const key = item.id || item.roll_number || item.name;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [scanResult]);

  if (!scanResult) return null;

  const presentList = allRecords.filter((r) => r.status === 'Present');
  const absentList = allRecords.filter((r) => r.status === 'Absent');
  const lateList = allRecords.filter((r) => r.status === 'Late');
  const pendingList = allRecords.filter(
    (r) => r.status === 'Pending Verification' || r.status === 'Pending'
  );

  const getActiveList = () => {
    switch (activeTab) {
      case 'present':
        return presentList;
      case 'absent':
        return absentList;
      case 'late':
        return lateList;
      case 'pending':
        return pendingList;
      default:
        return presentList;
    }
  };

  const activeStudents = getActiveList().filter((s) => {
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

  // Quick 1-tap toggle: toggle between Present and Absent
  const handleQuickToggle = (std) => {
    const nextStatus = std.status === 'Present' ? 'Absent' : 'Present';
    if (onRecordUpdated) {
      onRecordUpdated({ ...std, status: nextStatus });
    }
  };

  return (
    <View className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm mb-4">
      {/* Header: Recognition Results & Summary */}
      <View className="flex-row items-center justify-between pb-3 border-b border-border/60 mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-sm font-semibold text-foreground">
            AI Recognition Summary
          </Text>
          <Text className="text-[11px] text-muted-foreground mt-0.5">
            Session: {scanResult.session_code || 'ATT-LIVE'} • {allRecords.length} Students Detected
          </Text>
        </View>

        <Badge variant="outline" className="px-2.5 py-1 bg-emerald-500/10 border-emerald-500/25">
          <Text className="text-xs font-bold text-emerald-600">
            {scanResult.attendance_rate || `${attendancePercentage}% Rate`}
          </Text>
        </Badge>
      </View>

      {/* Modern Status Tabs Segmented Bar */}
      <View className="flex-row bg-muted/40 p-1 rounded-xl border border-border/60 mb-3">
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setActiveTab('present')}
          className={`flex-1 py-2 rounded-lg items-center justify-center ${
            activeTab === 'present' ? 'bg-emerald-500 shadow-sm' : 'bg-transparent'
          }`}
        >
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
          className={`flex-1 py-2 rounded-lg items-center justify-center ${
            activeTab === 'absent' ? 'bg-destructive shadow-sm' : 'bg-transparent'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'absent' ? 'text-white' : 'text-muted-foreground'
            }`}
          >
            Absent ({absentList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setActiveTab('late')}
          className={`flex-1 py-2 rounded-lg items-center justify-center ${
            activeTab === 'late' ? 'bg-amber-500 shadow-sm' : 'bg-transparent'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'late' ? 'text-white' : 'text-muted-foreground'
            }`}
          >
            Late ({lateList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => setActiveTab('pending')}
          className={`flex-1 py-2 rounded-lg items-center justify-center ${
            activeTab === 'pending' ? 'bg-primary shadow-sm' : 'bg-transparent'
          }`}
        >
          <Text
            className={`text-xs font-bold ${
              activeTab === 'pending' ? 'text-white' : 'text-muted-foreground'
            }`}
          >
            Review ({pendingList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter / Search Input */}
      {allRecords.length > 5 ? (
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
            No students found in {activeTab} status
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {activeStudents.map((std, idx) => (
            <View
              key={std.id || std.roll_number || idx}
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
                    {std.confidence ? (
                      <>
                        <Text className="text-[9px] text-muted-foreground">•</Text>
                        <Text className="text-[10px] text-emerald-600 font-medium">
                          {std.confidence}
                        </Text>
                      </>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Status Actions: Quick Toggle + Edit Button */}
              <View className="flex-row items-center gap-1.5">
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleQuickToggle(std)}
                  className={`px-2.5 py-1 rounded-lg border ${
                    std.status === 'Present'
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : std.status === 'Absent'
                      ? 'bg-destructive/10 border-destructive/30'
                      : std.status === 'Late'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-primary/10 border-primary/30'
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      std.status === 'Present'
                        ? 'text-emerald-600'
                        : std.status === 'Absent'
                        ? 'text-destructive'
                        : std.status === 'Late'
                        ? 'text-amber-600'
                        : 'text-primary'
                    }`}
                  >
                    {std.status}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleOpenCorrection(std)}
                  className="w-7 h-7 rounded-lg bg-muted/60 border border-border items-center justify-center"
                >
                  <Icon name="create" size={13} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

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
