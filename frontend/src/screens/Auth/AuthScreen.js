import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import KeyboardSafeView from '../../components/ui/KeyboardSafeView';
import AuthHeader from '../../components/auth/AuthHeader';
import LoginForm from '../../components/auth/LoginForm';
import SignupForm from '../../components/auth/SignupForm';

export default function AuthScreen({ onLogin }) {
  const [role, setRole] = useState('student');
  const [isLogin, setIsLogin] = useState(true);

  return (
    <KeyboardSafeView className="bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        showsVerticalScrollIndicator={false}
        className="px-6 py-10"
      >
        <AuthHeader role={role} onRoleChange={setRole} />

        {isLogin ? (
          <LoginForm
            role={role}
            onLogin={(data, opts) => onLogin && onLogin(data, opts || { isSignup: false })}
            onSwitchToSignup={() => setIsLogin(false)}
          />
        ) : (
          <SignupForm
            role={role}
            onLogin={(data, opts) => onLogin && onLogin(data, opts || { isSignup: true })}
            onSwitchToLogin={() => setIsLogin(true)}
          />
        )}
      </ScrollView>
    </KeyboardSafeView>
  );
}
