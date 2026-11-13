import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../ui/text';

export default function AuthHeader({ role, onRoleChange }) {
  return (
    <View className="w-full">
      {/* Brand Header */}
      <View className="mb-6 items-center">
        <View className="h-14 w-14 rounded-2xl bg-primary items-center justify-center mb-3">
          <Text className="text-primary-foreground text-xl font-medium">AI</Text>
        </View>
        <Text className="text-2xl font-medium text-foreground">
          Attendance Portal
        </Text>
        <Text className="text-sm text-muted-foreground mt-1 text-center">
          Facial recognition and automated attendance management
        </Text>
      </View>

      {/* Role Selection */}
      <View className="mb-4">
        <Text className="text-xs font-semibold uppercase text-muted-foreground mb-2 text-center">
          Select Your Role
        </Text>
        <View className="flex-row bg-muted p-1 rounded-xl">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onRoleChange('student')}
            className={`flex-1 py-2 rounded-lg items-center ${role === 'student' ? 'bg-primary' : 'bg-transparent'
              }`}
          >
            <Text
              className={`text-sm font-semibold ${role === 'student' ? 'text-primary-foreground' : 'text-foreground'
                }`}
            >
              Student
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onRoleChange('teacher')}
            className={`flex-1 py-2 rounded-lg items-center ${role === 'teacher' ? 'bg-primary' : 'bg-transparent'
              }`}
          >
            <Text
              className={`text-sm font-semibold ${role === 'teacher' ? 'text-primary-foreground' : 'text-foreground'
                }`}
            >
              Teacher
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
