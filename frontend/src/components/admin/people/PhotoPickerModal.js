import React from 'react';
import { View, Modal, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Image as ImageIcon, Trash2, X } from 'lucide-react-native';
import { Text } from '../../ui/text';

async function getAssetDataUri(asset) {
  if (!asset) return null;
  if (asset.base64) {
    const mime = asset.mimeType && asset.mimeType.startsWith('image/')
      ? asset.mimeType
      : 'image/jpeg';
    return `data:${mime};base64,${asset.base64}`;
  }
  if (asset.uri) {
    try {
      const resp = await fetch(asset.uri);
      const blob = await resp.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(asset.uri);
        reader.readAsDataURL(blob);
      });
    } catch {
      return asset.uri;
    }
  }
  return null;
}

export default function PhotoPickerModal({
  visible,
  onClose,
  onSelectPhoto,
  onRemovePhoto,
  hasExistingPhoto = false,
}) {
  const handleCamera = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = await getAssetDataUri(asset);
        onSelectPhoto?.(uri);
        onClose?.();
      }
    } catch (e) {
      // ignore
    }
  };

  const handleGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const uri = await getAssetDataUri(asset);
        onSelectPhoto?.(uri);
        onClose?.();
      }
    } catch (e) {
      // ignore
    }
  };

  const handleRemove = () => {
    onRemovePhoto?.();
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View className="bg-white rounded-t-3xl p-5 border-t border-slate-200 shadow-2xl z-10 pb-8">
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <Text className="text-base font-bold text-slate-900">Profile Photo</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              className="w-7 h-7 rounded-full bg-slate-100 items-center justify-center"
            >
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View className="gap-2.5">
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleCamera}
              className="flex-row items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60"
            >
              <View className="w-10 h-10 rounded-xl bg-indigo-50 items-center justify-center">
                <Camera size={20} color="#3446D4" strokeWidth={2.2} />
              </View>
              <View>
                <Text className="text-sm font-bold text-slate-900">Take Photo</Text>
                <Text className="text-xs text-slate-500">Capture a picture with the camera</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleGallery}
              className="flex-row items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60"
            >
              <View className="w-10 h-10 rounded-xl bg-indigo-50 items-center justify-center">
                <ImageIcon size={20} color="#3446D4" strokeWidth={2.2} />
              </View>
              <View>
                <Text className="text-sm font-bold text-slate-900">Choose from Gallery</Text>
                <Text className="text-xs text-slate-500">Select an existing photo from storage</Text>
              </View>
            </TouchableOpacity>

            {hasExistingPhoto && (
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleRemove}
                className="flex-row items-center gap-3.5 p-3.5 rounded-2xl bg-red-50/60 border border-red-200/60"
              >
                <View className="w-10 h-10 rounded-xl bg-red-100/80 items-center justify-center">
                  <Trash2 size={20} color="#C4301F" strokeWidth={2.2} />
                </View>
                <View>
                  <Text className="text-sm font-bold text-[#C4301F]">Remove Photo</Text>
                  <Text className="text-xs text-slate-500">Reset to name initials</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            className="mt-4 py-3 rounded-xl bg-slate-100 items-center justify-center"
          >
            <Text className="text-sm font-bold text-slate-700">Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
