import React, { useState } from 'react';
import { View, Modal, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { Text } from '../../ui/text';
import { Badge } from '../../ui/badge';
import Icon from '../../ui/Icon';
import KeyboardSafeView from '../../ui/KeyboardSafeView';
import { useTeacherStudents } from '../../../hooks/useTeacher';

export default function SubjectStudentsModal({ visible, onClose, classItem }) {
  const { data: allStudents } = useTeacherStudents();
  const [searchQuery, setSearchQuery] = useState('');

  if (!visible) return null;

  // Filter students matching the course or all
  const filtered = (allStudents && allStudents.length > 0 ? allStudents : [
    { id: 1, name: 'Aarav Patel', roll_number: 'MCA-2024-001', attendance_percentage: 95, status: 'Good' },
    { id: 2, name: 'Ananya Sharma', roll_number: 'MCA-2024-002', attendance_percentage: 88, status: 'Good' },
    { id: 3, name: 'Devendra Verma', roll_number: 'MCA-2024-003', attendance_percentage: 92, status: 'Good' },
    { id: 4, name: 'Isha Nair', roll_number: 'MCA-2024-004', attendance_percentage: 78, status: 'Good' },
    { id: 5, name: 'Karan Mehra', roll_number: 'MCA-2024-005', attendance_percentage: 68, status: 'Warning' },
    { id: 6, name: 'Pooja Joshi', roll_number: 'MCA-2024-006', attendance_percentage: 94, status: 'Good' },
  ]).filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.name && s.name.toLowerCase().includes(q)) ||
      (s.roll_number && s.roll_number.toLowerCase().includes(q))
    );
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardSafeView className="bg-black/60 justify-end">
        <View className="bg-background rounded-t-3xl max-h-[85%] border-t border-border flex-col shadow-2xl">
          {/* Header */}
          <View className="p-4 border-b border-border flex-row items-center justify-between">
            <View className="flex-1 mr-2">
              <Text className="text-base font-medium text-foreground" numberOfLines={1}>
                {classItem?.subjectName || 'Subject'} Roster
              </Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                {classItem?.courseCode || 'Course'} • {filtered.length} Students Assigned
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-muted/60 items-center justify-center border border-border"
            >
              <Text className="text-foreground text-xs font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="p-3 border-b border-border/60 bg-muted/20">
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by student name or roll number..."
              placeholderTextColor="#94a3b8"
              className="bg-card border border-border px-3.5 py-2 rounded-xl text-foreground text-xs font-medium"
            />
          </View>

          {/* Students List */}
          <ScrollView className="p-4" showsVerticalScrollIndicator={false}>
            {filtered.map((std, idx) => (
              <View
                key={std.id || idx}
                className="p-3 bg-card border border-border/80 rounded-xl mb-2 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center overflow-hidden border border-primary/20 mr-2.5">
                    {std.profile_image ? (
                      <Image source={{ uri: std.profile_image }} className="w-full h-full" />
                    ) : (
                      <Text className="text-xs font-medium text-primary">
                        {std.name?.charAt(0).toUpperCase() || 'S'}
                      </Text>
                    )}
                  </View>

                  <View className="flex-1">
                    <Text className="text-xs font-bold text-foreground" numberOfLines={1}>
                      {std.name}
                    </Text>
                    <Text className="text-[10px] text-muted-foreground">
                      Roll: {std.roll_number}
                    </Text>
                  </View>
                </View>

                <Badge
                  variant={
                    std.attendance_percentage >= 75
                      ? 'success'
                      : std.attendance_percentage >= 65
                        ? 'warning'
                        : 'destructive'
                  }
                  className="px-2 py-0.5"
                >
                  <Text className="text-[10px] font-bold">
                    {std.attendance_percentage}%
                  </Text>
                </Badge>
              </View>
            ))}
          </ScrollView>
        </View>
      </KeyboardSafeView>
    </Modal>
  );
}
