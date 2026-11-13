import React, { useState } from 'react';
import { View, Modal, TextInput, TouchableOpacity } from 'react-native';
import { MessageSquare, X, Send } from 'lucide-react-native';
import { Text } from '../../ui/text';
import KeyboardSafeView from '../../ui/KeyboardSafeView';

export default function DirectMessageModal({
  visible,
  teacherName = 'Faculty Lead',
  courseCode = '',
  onClose,
  onSend,
}) {
  const [messageText, setMessageText] = useState('');

  const handleSend = () => {
    if (!messageText.trim()) return;
    onSend?.(messageText.trim());
    setMessageText('');
  };

  const handleClose = () => {
    setMessageText('');
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardSafeView className="bg-black/50 justify-center items-center px-4">
        <View className="bg-white rounded-3xl p-5 w-full max-w-sm border border-slate-100 shadow-xl">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center gap-2">
              <MessageSquare size={18} color="#2563eb" />
              <Text className="text-base font-medium text-slate-900">Send Message</Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-slate-500 mb-3">
            Direct notification to {teacherName} {courseCode ? `(${courseCode})` : ''}
          </Text>

          <TextInput
            className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 h-28 mb-4"
            placeholder="Write administrative notice or query..."
            placeholderTextColor="#94a3b8"
            multiline
            textAlignVertical="top"
            value={messageText}
            onChangeText={setMessageText}
          />

          <View className="flex-row gap-2.5">
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleClose}
              className="flex-1 py-2.5 bg-slate-100 rounded-xl items-center"
            >
              <Text className="text-xs font-bold text-slate-700">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSend}
              className="flex-1 py-2.5 bg-blue-600 rounded-xl items-center flex-row justify-center gap-1.5"
            >
              <Send size={14} color="#ffffff" />
              <Text className="text-xs font-bold text-white">Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardSafeView>
    </Modal>
  );
}
