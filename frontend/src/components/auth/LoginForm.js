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
import { useLogin } from '../../hooks/useAuth';

export default function LoginForm({ role, onLogin, onSwitchToSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loginMutation = useLogin();
  const isSubmitting = loginMutation.isPending;

  const handleSubmit = async () => {
    console.log("Login handleSubmit triggered");
    setErrorMessage('');
    const cleanEmail = email.trim();
    const cleanPassword = password;

    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      console.log("Logging in user:", { email: cleanEmail });
      const result = await loginMutation.mutateAsync({
        login: cleanEmail,
        email: cleanEmail,
        password: cleanPassword,
      });

      console.log("Login API response:", result);

      if (result?.success) {
        const userData = result.data?.user;
        if (onLogin && userData) {
          onLogin(userData);
        }
      }
    } catch (err) {
      console.error("Login error caught:", err);
      const msg =
        err?.message ||
        err?.data?.message ||
        'Invalid credentials. Please check your email and password.';
      setErrorMessage(msg);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <Text className="text-xl font-bold text-foreground">Sign In</Text>
        <Text className="text-xs text-muted-foreground mt-0.5">
          Enter your credentials to access your {role === 'teacher' ? 'Faculty' : 'Student'} account
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
            placeholder="Enter password"
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
                Logging in...
              </Text>
            </View>
          ) : (
            <Text className="text-primary-foreground font-semibold text-base">
              Login as {role === 'teacher' ? 'Teacher' : 'Student'}
            </Text>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center mt-2">
          <Text className="text-xs text-muted-foreground">
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={onSwitchToSignup} activeOpacity={0.7}>
            <Text className="text-xs font-bold text-primary">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </CardFooter>
    </Card>
  );
}
