import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../ui/text';
import CreateStudentModal from './CreateStudentModal';
import CreateTeacherModal from './CreateTeacherModal';

/**
 * Simple role-routing wrapper that renders either CreateStudentModal or CreateTeacherModal.
 */
export default function CreateUserModal({
  role = 'student',
  allowRoleToggle = false,
  ...props
}) {
  const [activeRole, setActiveRole] = useState(role);

  useEffect(() => {
    setActiveRole(role);
  }, [role]);

  const headerBottom = allowRoleToggle ? (
    <View className="flex-row bg-muted/60 p-1 rounded-xl mt-1">
      {['student', 'teacher'].map((r) => {
        const isActive = activeRole === r;
        return (
          <TouchableOpacity
            key={r}
            onPress={() => setActiveRole(r)}
            activeOpacity={0.7}
            className={`flex-1 py-1.5 rounded-lg items-center justify-center ${
              isActive ? 'bg-primary shadow-sm' : ''
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                isActive ? 'text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {r === 'teacher' ? 'Faculty / Teacher' : 'Student'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  ) : null;

  if (activeRole === 'teacher') {
    return <CreateTeacherModal headerBottom={headerBottom} {...props} />;
  }

  return <CreateStudentModal headerBottom={headerBottom} {...props} />;
}
