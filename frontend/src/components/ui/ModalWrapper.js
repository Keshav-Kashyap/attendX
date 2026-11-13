import React from 'react';
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Text } from './text';
import Icon from './Icon';
import KeyboardSafeView from './KeyboardSafeView';

/**
 * Reusable card / section container for grouped form fields
 */
export function FormSection({
  title,
  subtitle,
  headerRight,
  onHeaderPress,
  containerClassName = 'mb-3',
  children,
}) {
  const HeaderWrapper = onHeaderPress ? TouchableOpacity : View;

  return (
    <View className={`p-3 bg-muted/30 border border-border rounded-2xl ${containerClassName}`}>
      {(title || subtitle || headerRight) ? (
        <HeaderWrapper
          activeOpacity={onHeaderPress ? 0.7 : 1}
          onPress={onHeaderPress}
          className="flex-row items-center justify-between mb-2.5"
        >
          <View className="flex-1 mr-2">
            {title ? (
              <Text className="text-xs font-bold text-foreground">
                {title}
              </Text>
            ) : null}
            {subtitle ? (
              <Text className="text-[11px] text-muted-foreground mt-0.5">
                {subtitle}
              </Text>
            ) : null}
          </View>
          {headerRight}
        </HeaderWrapper>
      ) : null}
      {children}
    </View>
  );
}

/**
 * Standard keyboard-safe bottom-sheet modal wrapper
 */
export default function ModalWrapper({
  visible,
  onClose,
  title,
  subtitle,
  errorMessage,
  onSubmit,
  isSubmitting = false,
  submitText = 'Submit',
  cancelText = 'Cancel',
  height,
  maxHeight = '90%',
  children,
  footer,
  headerBottom,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardSafeView className="bg-black/60 justify-end">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[
            { maxHeight, display: 'flex', flexDirection: 'column' },
            height ? { height } : null,
          ]}
          className="bg-card rounded-t-3xl p-5 border-t border-border shadow-2xl z-10"
        >
          {/* Header */}
          <View className="pb-3 border-b border-border">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-2">
                <Text className="text-lg font-bold text-foreground">
                  {title}
                </Text>
                {subtitle ? (
                  <Text className="text-xs text-muted-foreground mt-0.5">
                    {subtitle}
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                className="w-8 h-8 rounded-full bg-muted items-center justify-center"
              >
                <Icon name="close" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {headerBottom ? (
              <View className="mt-2.5">
                {headerBottom}
              </View>
            ) : null}
          </View>

          {/* Form Content */}
          <ScrollView
            style={{ flexShrink: 1 }}
            contentContainerStyle={{ paddingVertical: 12, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {/* Error Banner */}
            {errorMessage ? (
              <View className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-xl">
                <Text className="text-xs font-semibold text-destructive">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {children}
          </ScrollView>

          {/* Action Footer */}
          {footer !== undefined ? (
            footer
          ) : (
            <View className="flex-row gap-2 pt-3 border-t border-border">
              <TouchableOpacity
                onPress={onClose}
                disabled={isSubmitting}
                activeOpacity={0.7}
                className="flex-1 py-2.5 rounded-xl border border-border items-center justify-center bg-muted/40"
              >
                <Text className="text-xs font-semibold text-foreground">{cancelText}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onSubmit}
                disabled={isSubmitting}
                activeOpacity={0.8}
                className="flex-1 py-2.5 rounded-xl bg-primary items-center justify-center"
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-xs font-bold text-primary-foreground">
                    {submitText}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardSafeView>
    </Modal>
  );
}

