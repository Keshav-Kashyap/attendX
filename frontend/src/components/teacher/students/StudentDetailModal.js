import React from 'react';
import { View, Modal, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text } from '../../ui/text';
import { Badge } from '../../ui/badge';
import Icon from '../../ui/Icon';

export default function StudentDetailModal({ visible, onClose, student }) {
  if (!visible || !student) return null;

  const pct = student.attendance_percentage ?? 88;
  const isGood = pct >= 75;
  const isWarning = pct >= 65 && pct < 75;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-background rounded-t-3xl max-h-[88%] border-t border-border flex-col shadow-2xl">
          {/* Dismiss Bar */}
          <View className="items-center pt-3 pb-1">
            <View className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
          </View>

          {/* Modal Header */}
          <View className="px-5 pt-2 pb-4 border-b border-border/80 flex-row items-center justify-between">
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-14 h-14 rounded-2xl bg-primary/20 items-center justify-center overflow-hidden border-2 border-primary/40 mr-3">
                {student.profile_image ? (
                  <Image source={{ uri: student.profile_image }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Text className="text-xl font-medium text-primary">
                    {student.name?.charAt(0).toUpperCase() || 'S'}
                  </Text>
                )}
              </View>

              <View className="flex-1">
                <Text className="text-base font-medium text-foreground" numberOfLines={1}>
                  {student.name}
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  Roll: {student.roll_number}
                </Text>
                <Text className="text-[11px] text-primary font-bold">
                  {student.course || 'MCA'} • {student.semester || student.semester_name || 'Semester 1'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-muted/60 items-center justify-center border border-border"
            >
              <Text className="text-foreground text-xs font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="p-5 flex-1" showsVerticalScrollIndicator={false}>
            {/* Attendance Score Card */}
            <View className="p-4 bg-card border border-border/80 rounded-2xl shadow-sm mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-xs font-bold text-foreground">
                  Overall Attendance Percentage
                </Text>
                <Badge
                  variant={isGood ? 'success' : isWarning ? 'warning' : 'destructive'}
                  className="px-2.5 py-0.5"
                >
                  <Text className="text-xs font-bold">{pct}% {isGood ? 'Eligible' : 'Low'}</Text>
                </Badge>
              </View>

              {/* Visual Progress Bar */}
              <View className="w-full h-3 bg-muted rounded-full overflow-hidden my-2">
                <View
                  style={{ width: `${Math.min(pct, 100)}%` }}
                  className={`h-full rounded-full ${isGood ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-destructive'
                    }`}
                />
              </View>

              <Text className="text-[11px] text-muted-foreground text-center mt-1">
                75% minimum required for university semester examination eligibility.
              </Text>
            </View>

            {/* Attendance Breakdown Grid */}
            <View className="flex-row gap-2.5 mb-4">
              <View className="flex-1 p-3 bg-card border border-border rounded-xl items-center">
                <Text className="text-lg font-medium text-foreground">
                  {student.total_classes || 12}
                </Text>
                <Text className="text-[10px] text-muted-foreground font-semibold">Total Classes</Text>
              </View>

              <View className="flex-1 p-3 bg-card border border-emerald-500/30 rounded-xl items-center">
                <Text className="text-lg font-medium text-emerald-500">
                  {student.attended_classes || 10}
                </Text>
                <Text className="text-[10px] text-muted-foreground font-semibold">Attended</Text>
              </View>

              <View className="flex-1 p-3 bg-card border border-destructive/30 rounded-xl items-center">
                <Text className="text-lg font-medium text-destructive">
                  {student.absent_classes || 2}
                </Text>
                <Text className="text-[10px] text-muted-foreground font-semibold">Absent</Text>
              </View>

              <View className="flex-1 p-3 bg-card border border-amber-500/30 rounded-xl items-center">
                <Text className="text-lg font-medium text-amber-500">
                  {student.late_classes || 0}
                </Text>
                <Text className="text-[10px] text-muted-foreground font-semibold">Late</Text>
              </View>
            </View>

            {/* Student Contact & Department Details */}
            <View className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm mb-4 gap-2.5">
              <Text className="text-xs font-bold text-foreground mb-1">
                Student Profile Information
              </Text>

              <View className="flex-row justify-between py-1.5 border-b border-border/60">
                <Text className="text-xs text-muted-foreground font-medium">Email</Text>
                <Text className="text-xs font-bold text-foreground">{student.email || 'student@university.edu'}</Text>
              </View>

              <View className="flex-row justify-between py-1.5 border-b border-border/60">
                <Text className="text-xs text-muted-foreground font-medium">Contact Phone</Text>
                <Text className="text-xs font-bold text-foreground">{student.phone || '+91 98765 43210'}</Text>
              </View>

              <View className="flex-row justify-between py-1.5 border-b border-border/60">
                <Text className="text-xs text-muted-foreground font-medium">Face Biometrics</Text>
                <Badge variant={student.has_face ? 'success' : 'outline'} className="px-2 py-0">
                  <Text className="text-[9px] font-bold">
                    {student.has_face ? 'Enrolled' : 'Pending'}
                  </Text>
                </Badge>
              </View>

              <View className="flex-row justify-between py-1.5">
                <Text className="text-xs text-muted-foreground font-medium">Voice Biometrics</Text>
                <Badge variant={student.has_voice ? 'success' : 'outline'} className="px-2 py-0">
                  <Text className="text-[9px] font-bold">
                    {student.has_voice ? 'Enrolled' : 'Optional'}
                  </Text>
                </Badge>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onClose}
              style={{
                width: '100%',
                paddingVertical: 12,
                backgroundColor: '#0284c7',
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 8,
                elevation: 1,
                shadowColor: '#0284c7',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.15,
                shadowRadius: 2,
              }}
            >
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                Close Student Profile
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
