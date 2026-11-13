import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '../../ui/text';
import { Badge } from '../../ui/badge';
import Icon from '../../ui/Icon';
import { useSaveTeacherProfile } from '../../../hooks/useTeacher';

export default function TabMyProfile({ user, onSaved }) {
  const teacherProfile = user?.teacher_profile;
  const [employeeCode, setEmployeeCode] = useState(teacherProfile?.employee_code || user?.identifier || '');
  const [phone, setPhone] = useState(teacherProfile?.phone || '');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const saveMutation = useSaveTeacherProfile();

  const handleSave = async () => {
    setStatusMsg({ text: '', type: '' });
    try {
      await saveMutation.mutateAsync({
        employee_code: employeeCode,
        phone: phone,
      });
      setStatusMsg({ text: 'Profile updated successfully!', type: 'success' });
      if (onSaved) onSaved();
    } catch (err) {
      setStatusMsg({ text: err.message || 'Failed to update profile.', type: 'error' });
    }
  };

  return (
    <View className="gap-4">
      {statusMsg.text ? (
        <View
          className={`p-3 rounded-xl border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-destructive/10 border-destructive/30'
          }`}
        >
          <Text
            className={`text-xs font-semibold ${
              statusMsg.type === 'success' ? 'text-emerald-500' : 'text-destructive'
            }`}
          >
            {statusMsg.text}
          </Text>
        </View>
      ) : null}

      {/* Account Info Read-only */}
      <View className="bg-muted/40 p-3.5 rounded-2xl border border-border">
        <View className="flex-row justify-between items-center pb-2.5 border-b border-border/60">
          <Text className="text-xs text-muted-foreground font-medium">Full Name</Text>
          <Text className="text-xs font-bold text-foreground">{user?.username || user?.name}</Text>
        </View>

        <View className="flex-row justify-between items-center py-2.5 border-b border-border/60">
          <Text className="text-xs text-muted-foreground font-medium">Official Email</Text>
          <Text className="text-xs font-bold text-foreground">{user?.email}</Text>
        </View>

        <View className="flex-row justify-between items-center pt-2.5">
          <Text className="text-xs text-muted-foreground font-medium">Designation / Role</Text>
          <Badge variant="warning" className="px-2 py-0">
            <Text className="text-[10px] font-bold">Faculty Member</Text>
          </Badge>
        </View>
      </View>

      {/* Editable Fields */}
      <View className="gap-3">
        <View>
          <Text className="text-xs font-bold text-foreground mb-1.5">
            Faculty / Employee ID
          </Text>
          <TextInput
            value={employeeCode}
            onChangeText={setEmployeeCode}
            placeholder="e.g. FAC-2024-007"
            placeholderTextColor="#94a3b8"
            className="w-full bg-card border border-border px-3.5 py-2.5 rounded-xl text-foreground text-sm font-semibold"
          />
        </View>

        <View>
          <Text className="text-xs font-bold text-foreground mb-1.5">
            Contact Phone Number
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            placeholderTextColor="#94a3b8"
            className="w-full bg-card border border-border px-3.5 py-2.5 rounded-xl text-foreground text-sm font-semibold"
          />
        </View>

        <View>
          <Text className="text-xs font-bold text-foreground mb-1.5">
            Academic Department
          </Text>
          <TextInput
            value={department}
            onChangeText={setDepartment}
            placeholder="e.g. Department of Computer Science"
            placeholderTextColor="#94a3b8"
            className="w-full bg-card border border-border px-3.5 py-2.5 rounded-xl text-foreground text-sm font-semibold"
          />
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSave}
        disabled={saveMutation.isPending}
        className="w-full bg-primary py-3 rounded-xl items-center justify-center mt-2 shadow-sm"
      >
        {saveMutation.isPending ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text className="text-white text-xs font-bold uppercase tracking-wider">
            Save Profile Details
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
