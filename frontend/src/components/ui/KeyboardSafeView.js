import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  View,
} from 'react-native';

/**
 * Tracks whether the soft keyboard is currently open on mobile devices.
 */
export function useKeyboardVisible() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return isKeyboardVisible;
}

/**
 * Cross-platform KeyboardAvoidingView wrapper for screens and modals.
 * Shifts/pads content upward when the keyboard opens on both iOS and Android.
 */
export default function KeyboardSafeView({
  children,
  style,
  className = '',
  keyboardVerticalOffset = 0,
  enabled = true,
}) {
  if (Platform.OS === 'web' || !enabled) {
    return (
      <View style={[{ flex: 1 }, style]} className={className}>
        {children}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={[{ flex: 1 }, style]}
      className={className}
    >
      {children}
    </KeyboardAvoidingView>
  );
}

