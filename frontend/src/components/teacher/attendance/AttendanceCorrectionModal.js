import React, { useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Text } from '../../ui/text';
import { Badge } from '../../ui/badge';
import Icon from '../../ui/Icon';
import KeyboardSafeView from '../../ui/KeyboardSafeView';
import { useUpdateAttendanceRecord } from '../../../hooks/useTeacher';

export default function AttendanceCorrectionModal({ visible, onClose, record, onRecordUpdated }) {
  const [selectedStatus, setSelectedStatus] = useState('Present');
  const [remarks, setRemarks] = useState('');
  const updateMutation = useUpdateAttendanceRecord();

  useEffect(() => {
    if (record) {
      setSelectedStatus(record.status || 'Present');
      setRemarks(record.remarks || '');
    }
  }, [record]);

  if (!visible || !record) return null;

  const statuses = [
    { id: 'Present', label: 'Present', color: 'emerald' },
    { id: 'Absent', label: 'Absent', color: 'red' },
    { id: 'Late', label: 'Late', color: 'amber' },
    { id: 'Pending Verification', label: 'Pending', color: 'sky' },
  ];

  const handleSave = async () => {
    try {
      if (record.id) {
        await updateMutation.mutateAsync({
          recordId: record.id,
          status: selectedStatus,
          remarks: remarks,
        });
      }
      if (onRecordUpdated) {
        onRecordUpdated({ ...record, status: selectedStatus, remarks });
      }
      onClose();
    } catch (err) {
      console.log('Update record error:', err);
      // Even if offline/local, still update local state
      if (onRecordUpdated) {
        onRecordUpdated({ ...record, status: selectedStatus, remarks });
      }
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardSafeView className="bg-black/60 items-center justify-center p-4">
        <View className="bg-card w-full max-w-sm rounded-3xl border border-border p-5 shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-border/80">
            <View>
              <Text className="text-sm font-medium text-foreground">
                Manual Attendance Correction
              </Text>
              <Text className="text-[11px] text-muted-foreground mt-0.5">
                Override AI detection result
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              className="w-7 h-7 rounded-full bg-muted/60 items-center justify-center border border-border"
            >
              <Text className="text-foreground text-xs font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Student Info */}
          <View className="py-3 bg-muted/30 p-3 rounded-2xl border border-border/60 my-3">
            <Text className="text-xs font-bold text-foreground">
              {record.name || 'Student'}
            </Text>
            <Text className="text-[11px] text-muted-foreground mt-0.5">
              Roll No: {record.roll_number || 'N/A'} • {record.course || 'MCA'}
            </Text>
          </View>

          {/* Status Selection Buttons */}
          <Text className="text-xs font-bold text-foreground mb-2">
            Select Attendance Status:
          </Text>

          <View className="flex-row flex-wrap gap-2 mb-4">
            {statuses.map((st) => {
              const isSelected = selectedStatus === st.id;
              return (
                <TouchableOpacity
                  key={st.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedStatus(st.id)}
                  className={`flex-1 min-w-[45%] py-2.5 rounded-xl items-center border ${isSelected
                      ? st.id === 'Present'
                        ? 'bg-emerald-500/20 border-emerald-500'
                        : st.id === 'Absent'
                          ? 'bg-destructive/20 border-destructive'
                          : st.id === 'Late'
                            ? 'bg-amber-500/20 border-amber-500'
                            : 'bg-sky-500/20 border-sky-500'
                      : 'bg-muted/30 border-border'
                    }`}
                >
                  <Text
                    className={`text-xs font-bold ${isSelected
                        ? st.id === 'Present'
                          ? 'text-emerald-500'
                          : st.id === 'Absent'
                            ? 'text-destructive'
                            : st.id === 'Late'
                              ? 'text-amber-500'
                              : 'text-sky-500'
                        : 'text-muted-foreground'
                      }`}
                  >
                    {st.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Remarks input */}
          <View className="mb-4">
            <Text className="text-xs font-bold text-foreground mb-1.5">
              Reason / Remarks (Optional)
            </Text>
            <TextInput
              value={remarks}
              onChangeText={setRemarks}
              placeholder="e.g. Teacher verified manually in classroom"
              placeholderTextColor="#94a3b8"
              className="bg-muted/40 border border-border px-3 py-2 rounded-xl text-foreground text-xs font-medium"
            />
          </View>

          {/* Action buttons */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              className="flex-1 py-2.5 bg-muted/60 border border-border rounded-xl items-center"
            >
              <Text className="text-xs font-bold text-foreground">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleSave}
              disabled={updateMutation.isPending}
              className="flex-1 py-2.5 bg-primary rounded-xl items-center justify-center shadow-sm"
            >
              {updateMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-xs font-bold text-white">Save Correction</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardSafeView>
    </Modal>
  );
}
