import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '../ui/card';
import { Input } from '../ui/input';
import { Text } from '../ui/text';
import { useRegister, useLogin } from '../../hooks/useAuth';
import { courseService } from '../../services/courseService';

export default function SignupForm({ role, onLogin, onSwitchToLogin }) {
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [course, setCourse] = useState('');
  const [courseId, setCourseId] = useState(null);
  const [coursesList, setCoursesList] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const registerMutation = useRegister();
  const loginMutation = useLogin();

  const isSubmitting = registerMutation.isPending || loginMutation.isPending;

  // Fetch registered courses from backend for dropdown
  React.useEffect(() => {
    if (role === 'student') {
      let isMounted = true;
      setIsLoadingCourses(true);
      courseService
        .getAllCourses()
        .then((res) => {
          if (isMounted && res?.data && Array.isArray(res.data)) {
            setCoursesList(res.data);
            if (res.data.length > 0) {
              setCourse(res.data[0].code);
              setCourseId(res.data[0].id);
            }
          }
        })
        .catch((err) => {
          console.warn('Could not fetch courses list for signup:', err);
        })
        .finally(() => {
          if (isMounted) setIsLoadingCourses(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [role]);

  const handleSubmit = async () => {
    console.log("Signup handleSubmit triggered");
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim();
    const cleanPassword = password;
    const cleanName = name.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      const username = cleanName || cleanEmail.split('@')[0];

      console.log("Registering user:", { email: cleanEmail, username, role, courseId });

      const cleanIdentifier = identifier.trim() || undefined;

      const regResult = await registerMutation.mutateAsync({
        email: cleanEmail,
        password: cleanPassword,
        username,
        role,
        employee_code: role === 'teacher' ? cleanIdentifier : undefined,
        roll_number: role === 'student' ? cleanIdentifier : undefined,
        identifier: cleanIdentifier,
        course_id: role === 'student' ? (courseId || undefined) : undefined,
      });

      console.log("Registration API response:", regResult);

      if (regResult?.success) {
        setSuccessMessage('Account created successfully! Logging you in...');

        console.log("Attempting automatic login...");
        const loginResult = await loginMutation.mutateAsync({
          login: cleanEmail,
          email: cleanEmail,
          password: cleanPassword,
          role,
        });

        console.log("Login API response:", loginResult);

        if (loginResult?.success && onLogin) {
          const userData = loginResult.data?.user;
          if (userData) {
            onLogin(
              {
                ...userData,
                identifier: identifier.trim() || undefined,
                course_id: courseId || undefined,
              },
              { isSignup: true }
            );
          }
        }
      } else {
        setErrorMessage(regResult?.message || 'Registration failed');
      }
    } catch (err) {
      console.error("Signup error caught:", err);
      const msg =
        err?.message ||
        err?.data?.message ||
        'Registration failed. Please check your details and try again.';
      setErrorMessage(msg);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <Text className="text-xl font-bold text-foreground">Create Account</Text>
        <Text className="text-xs text-muted-foreground mt-0.5">
          Sign up as a {role === 'teacher' ? 'Faculty Member' : 'Student'} to get started
        </Text>
      </CardHeader>

      <CardContent className="gap-3">
        {errorMessage ? (
          <View className="bg-destructive/15 border border-destructive/30 rounded-lg p-3">
            <Text className="text-xs text-destructive font-medium">
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {successMessage ? (
          <View className="bg-emerald-500/15 border border-emerald-500/30 rounded-lg p-3">
            <Text className="text-xs text-emerald-700 font-medium">
              {successMessage}
            </Text>
          </View>
        ) : null}

        <View>
          <Text className="text-xs font-medium text-muted-foreground mb-1">
            Full Name
          </Text>
          <Input
            placeholder={role === 'teacher' ? 'e.g. Dr. Rajesh Kumar' : 'e.g. Rahul Verma'}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        <View>
          <Text className="text-xs font-medium text-muted-foreground mb-1">
            {role === 'teacher' ? 'Faculty ID' : 'Roll Number'} (Optional)
          </Text>
          <Input
            placeholder={role === 'teacher' ? 'e.g. FAC-2026' : 'e.g. 21BCS104'}
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
          />
        </View>

        {role === 'student' ? (
          <View className="relative z-30">
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-xs font-medium text-muted-foreground">
                Course / Degree
              </Text>
              {isLoadingCourses ? (
                <View className="flex-row items-center gap-1">
                  <ActivityIndicator size="small" color="#0284c7" />
                  <Text className="text-[10px] text-muted-foreground">Loading courses...</Text>
                </View>
              ) : null}
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-border bg-input/40 flex-row items-center justify-between"
            >
              <View className="flex-1 mr-2">
                {course ? (
                  <View className="flex-row items-center gap-2">
                    <View className="bg-primary/15 px-2 py-0.5 rounded-md">
                      <Text className="text-xs font-bold text-primary">
                        {coursesList.find((c) => c.id === courseId || c.code === course)?.code || course}
                      </Text>
                    </View>
                    <Text className="text-xs text-foreground font-medium flex-shrink" numberOfLines={1}>
                      {coursesList.find((c) => c.id === courseId || c.code === course)?.name || ''}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-xs text-muted-foreground">
                    Select your course...
                  </Text>
                )}
              </View>
              <Text className="text-xs text-muted-foreground font-bold">
                {isDropdownOpen ? '▲' : '▼'}
              </Text>
            </TouchableOpacity>

            {/* Dropdown Options List */}
            {isDropdownOpen ? (
              <View className="mt-1.5 border border-border rounded-xl bg-card overflow-hidden shadow-lg">
                {coursesList.length === 0 ? (
                  <View className="p-3 items-center">
                    <Text className="text-xs text-muted-foreground">
                      {isLoadingCourses ? 'Loading available courses...' : 'No courses found'}
                    </Text>
                  </View>
                ) : (
                  coursesList.map((item) => {
                    const isSelected = (courseId && item.id === courseId) || item.code === course;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        onPress={() => {
                          setCourse(item.code);
                          setCourseId(item.id);
                          setIsDropdownOpen(false);
                        }}
                        className={`p-3 flex-row items-center justify-between border-b border-border/40 ${
                          isSelected ? 'bg-primary/10' : ''
                        }`}
                      >
                        <View className="flex-1 mr-2">
                          <View className="flex-row items-center gap-2">
                            <Text className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                              {item.code}
                            </Text>
                            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                              {item.name}
                            </Text>
                          </View>
                        </View>
                        {isSelected ? (
                          <Text className="text-xs font-bold text-primary">✓</Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            ) : null}
          </View>
        ) : null}

        <View>
          <Text className="text-xs font-medium text-muted-foreground mb-1">
            Email Address
          </Text>
          <Input
            placeholder="user@university.edu"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View>
          <Text className="text-xs font-medium text-muted-foreground mb-1">
            Password
          </Text>
          <Input
            placeholder="Enter password (min 8 chars, 1 digit, 1 special)"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleSubmit}
          />
        </View>
      </CardContent>

      <CardFooter className="flex-col gap-3">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSubmit}
          disabled={isSubmitting}
          className={`w-full h-12 rounded-xl items-center justify-center flex-row ${
            isSubmitting ? 'bg-primary/70' : 'bg-primary'
          }`}
        >
          {isSubmitting ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#ffffff" />
              <Text className="text-primary-foreground font-semibold">
                Creating account...
              </Text>
            </View>
          ) : (
            <Text className="text-primary-foreground font-semibold text-base">
              Create {role === 'teacher' ? 'Teacher' : 'Student'} Account
            </Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-2">
          <Text className="text-xs text-muted-foreground">
            Already registered?{' '}
          </Text>
          <TouchableOpacity onPress={onSwitchToLogin} activeOpacity={0.7}>
            <Text className="text-xs font-bold text-primary">Login</Text>
          </TouchableOpacity>
        </View>
      </CardFooter>
    </Card>
  );
}
