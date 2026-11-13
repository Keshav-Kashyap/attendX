import React from 'react';
import { View, ScrollView } from 'react-native';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Text } from '../../components/ui/text';

export default function ProfileScreen({ user, onLogout, onOpenBiometrics }) {
  const role = (user?.role || '').toLowerCase();
  const isTeacher = role === 'teacher';
  const isAdmin = role === 'admin';
  const isStudent = !isTeacher && !isAdmin;
  const studentProfile = user?.student_profile;
  const teacherProfile = user?.teacher_profile;

  const hasFace = Boolean(
    user?.profile_image ||
    studentProfile?.profile_image ||
    studentProfile?.has_face
  );
  const hasVoice = Boolean(
    studentProfile?.has_voice ||
    studentProfile?.voice_embedding
  );

  return (
    <ScrollView className="flex-1 bg-background px-5 pt-4 pb-8">
      {/* User Header */}
      <Card className="items-center py-6 mb-4">
        <Avatar className="h-20 w-20 mb-3">
          {user?.profile_image ? (
            <AvatarImage source={{ uri: user.profile_image }} />
          ) : (
            <AvatarFallback>
              <Text className="text-xl">
                {user?.username
                  ? user.username.charAt(0).toUpperCase()
                  : user?.name
                    ? user.name.charAt(0).toUpperCase()
                    : 'U'}
              </Text>
            </AvatarFallback>
          )}
        </Avatar>
        <Text className="text-xl font-bold text-foreground">
          {user?.username || user?.name}
        </Text>
        <Badge variant={isTeacher ? 'warning' : 'success'} className="mt-1">
          <Text>{user?.role} Account</Text>
        </Badge>
        <Text className="text-xs text-muted-foreground mt-1.5">{user?.email}</Text>
      </Card>

      {/* Account Info */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>
            <Text className="text-base font-bold">Account Details</Text>
          </CardTitle>
          <CardDescription>
            <Text className="text-xs text-muted-foreground">
              System registration parameters
            </Text>
          </CardDescription>
        </CardHeader>

        <CardContent className="gap-2">
          <View className="flex-row justify-between py-2 border-b border-border">
            <Text className="text-muted-foreground text-sm">
              {isAdmin ? 'Admin ID' : isTeacher ? 'Faculty ID' : 'Roll Number'}
            </Text>
            <Text className="text-foreground font-semibold text-sm">
              {isAdmin
                ? (user?.identifier || `ADM-${user?.id || 1}`)
                : isTeacher
                  ? (teacherProfile?.employee_code || user?.identifier || 'Not set')
                  : (studentProfile?.roll_number || user?.identifier || 'Not set')}
            </Text>
          </View>

          {studentProfile?.course ? (
            <View className="flex-row justify-between py-2 border-b border-border">
              <Text className="text-muted-foreground text-sm">Course</Text>
              <Text className="text-foreground font-semibold text-sm">
                {studentProfile.course}
              </Text>
            </View>
          ) : (
            <View className="flex-row justify-between py-2 border-b border-border">
              <Text className="text-muted-foreground text-sm">Department</Text>
              <Text className="text-foreground font-semibold text-sm">
                Computer Science & Engg
              </Text>
            </View>
          )}

          {studentProfile?.phone ? (
            <View className="flex-row justify-between py-2 border-b border-border">
              <Text className="text-muted-foreground text-sm">Phone</Text>
              <Text className="text-foreground font-semibold text-sm">
                {studentProfile.phone}
              </Text>
            </View>
          ) : null}

          {isStudent ? (
            <>
              <View className="flex-row justify-between py-2 border-b border-border items-center">
                <Text className="text-muted-foreground text-sm">Face Biometrics</Text>
                <Badge variant={hasFace ? 'success' : 'outline'}>
                  <Text>{hasFace ? 'Enrolled' : 'Not Enrolled'}</Text>
                </Badge>
              </View>

              <View className="flex-row justify-between py-2 border-b border-border items-center">
                <Text className="text-muted-foreground text-sm">Voice Biometrics</Text>
                <Badge variant={hasVoice ? 'success' : 'outline'}>
                  <Text>{hasVoice ? 'Enrolled' : 'Not Enrolled'}</Text>
                </Badge>
              </View>
            </>
          ) : null}

          <View className="flex-row justify-between py-2">
            <Text className="text-muted-foreground text-sm">System Access</Text>
            <Text className="text-foreground font-semibold text-sm">Active</Text>
          </View>
        </CardContent>
      </Card>

      {/* Biometric setup trigger button for students */}
      {isStudent && onOpenBiometrics ? (
        <View className="mb-3">
          <Button
            variant={hasFace || hasVoice ? 'outline' : 'default'}
            className="w-full"
            onPress={onOpenBiometrics}
          >
            <Text>
              {hasFace || hasVoice
                ? 'Update Biometric Samples'
                : 'Complete Biometric Enrollment'}
            </Text>
          </Button>
        </View>
      ) : null}

      {/* Actions */}
      <View className="mt-1">
        <Button
          variant="outline"
          className="w-full"
          onPress={onLogout}
        >
          <Text>Sign Out of Portal</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
