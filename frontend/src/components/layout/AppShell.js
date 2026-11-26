import React from 'react';
import { View, Platform, StatusBar } from 'react-native';
import KeyboardSafeView from '../ui/KeyboardSafeView';

export default function AppShell({ children, fullBleedTop = false }) {
  const containerStyle = {
    flex: 1,
    height: '100%',
    position: 'relative',
    paddingTop: fullBleedTop
      ? 0
      : Platform.OS === 'android'
      ? StatusBar.currentHeight || 0
      : 0,
  };

  return (
    <View style={containerStyle} className="flex-1 bg-background">
      <StatusBar
        barStyle={fullBleedTop ? 'light-content' : 'dark-content'}
        backgroundColor={fullBleedTop ? '#3446D4' : '#ffffff'}
        translucent={fullBleedTop}
      />

      <KeyboardSafeView>
        {children}
      </KeyboardSafeView>
    </View>
  );
}
