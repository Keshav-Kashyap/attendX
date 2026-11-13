import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '../../ui/text';
import { useChangePassword } from '../../../hooks/useTeacher';

export default function TabChangePassword({ onPasswordChanged }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const changeMutation = useChangePassword();

  const handleSubmit = async () => {
    setStatusMsg({ text: '', type: '' });

    if (!oldPassword || !newPassword || !confirmPassword) {
      setStatusMsg({ text: 'Please fill in all password fields.', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setStatusMsg({ text: 'New password must be at least 6 characters.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatusMsg({ text: 'New password and confirmation do not match.', type: 'error' });
      return;
    }

    try {
      const response = await changeMutation.mutateAsync({
        old_password: oldPassword,
        new_password: newPassword,
      });

      if (response?.success) {
        setStatusMsg({ text: 'Password successfully changed!', type: 'success' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (onPasswordChanged) onPasswordChanged();
      } else {
        setStatusMsg({ text: response?.message || 'Failed to update password.', type: 'error' });
      }
    } catch (err) {
      setStatusMsg({ text: err.message || 'Error updating password. Check old password.', type: 'error' });
    }
  };

  return (
    <View className="gap-4">
      <View className="p-3 bg-muted/40 rounded-xl border border-border">
        <Text className="text-xs text-muted-foreground leading-relaxed">
          Ensure your new password contains at least 6 characters with a combination of letters and numbers for account security.
        </Text>
      </View>

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

      <View className="gap-3">
        <View>
          <Text className="text-xs font-bold text-foreground mb-1.5">
            Current / Old Password
          </Text>
          <TextInput
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry
            placeholder="Enter current password"
            placeholderTextColor="#94a3b8"
            className="w-full bg-card border border-border px-3.5 py-2.5 rounded-xl text-foreground text-sm font-semibold"
          />
        </View>

        <View>
          <Text className="text-xs font-bold text-foreground mb-1.5">
            New Password
          </Text>
          <TextInput
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            placeholder="Enter at least 6 characters"
            placeholderTextColor="#94a3b8"
            className="w-full bg-card border border-border px-3.5 py-2.5 rounded-xl text-foreground text-sm font-semibold"
          />
        </View>

        <View>
          <Text className="text-xs font-bold text-foreground mb-1.5">
            Confirm New Password
          </Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            placeholder="Re-enter new password"
            placeholderTextColor="#94a3b8"
            className="w-full bg-card border border-border px-3.5 py-2.5 rounded-xl text-foreground text-sm font-semibold"
          />
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handleSubmit}
        disabled={changeMutation.isPending}
        className="w-full bg-primary py-3 rounded-xl items-center justify-center mt-2 shadow-sm"
      >
        {changeMutation.isPending ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text className="text-white text-xs font-bold uppercase tracking-wider">
            Update Password
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
