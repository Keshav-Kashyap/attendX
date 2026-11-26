import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImagePlus, Trash2, Upload, User } from 'lucide-react-native';
import { Text } from './text';

function isValidImageAsset(asset) {
  if (!asset) return false;
  const mime = (asset.mimeType || '').toLowerCase();
  const name = (asset.fileName || asset.uri || '').toLowerCase();

  if (mime === 'application/pdf' || name.endsWith('.pdf')) {
    return false;
  }
  if (mime && !mime.startsWith('image/')) {
    return false;
  }
  return true;
}

async function extractImageDataUri(asset) {
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

/**
 * Reusable single-image upload field with instant preview (images only, no PDF).
 */
export function ImagePickerField({
  label = 'Upload Image',
  hint = 'JPG, PNG only',
  required = false,
  value = null,
  onChange,
  onError,
  disabled = false,
  containerClassName = 'mb-3',
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleUploadImage = async () => {
    if (disabled || isLoading) return;
    setIsLoading(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        onError?.('File/gallery access permission is required to upload an image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: false,
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (!isValidImageAsset(asset)) {
          onError?.('Only image files (JPG, PNG, WEBP) are allowed. PDF files are not supported.');
          return;
        }
        const dataUri = await extractImageDataUri(asset);
        if (dataUri) {
          onError?.('');
          onChange?.(dataUri);
        }
      }
    } catch (err) {
      onError?.('Could not open file picker. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className={containerClassName}>
      {label || hint ? (
        <View className="flex-row items-center justify-between mb-1.5">
          {label ? (
            <Text className="text-xs font-semibold text-foreground">
              {label} {required ? <Text className="text-destructive">*</Text> : null}
            </Text>
          ) : (
            <View />
          )}
          {hint ? (
            <Text className="text-[10px] text-muted-foreground">{hint}</Text>
          ) : null}
        </View>
      ) : null}

      <View className="flex-row items-center gap-3 p-3 bg-muted/30 border border-border rounded-2xl">
        {/* Image Preview */}
        <TouchableOpacity
          activeOpacity={0.8}
          disabled={disabled || isLoading}
          onPress={handleUploadImage}
          className="w-16 h-16 rounded-2xl bg-card border border-border items-center justify-center overflow-hidden"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : value ? (
            <Image
              source={{ uri: value }}
              style={{ width: 64, height: 64 }}
              resizeMode="cover"
            />
          ) : (
            <User size={24} color="#94a3b8" />
          )}
        </TouchableOpacity>

        {/* Upload Button & Actions */}
        <View className="flex-1">
      

          <View className="flex-row flex-wrap gap-1.5">
            <TouchableOpacity
              activeOpacity={0.75}
              disabled={disabled || isLoading}
              onPress={handleUploadImage}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/25"
            >
              {value ? (
                <ImagePlus size={13} color="#2563eb" />
              ) : (
                <Upload size={13} color="#2563eb" />
              )}
              <Text className="text-[11px] font-semibold text-primary">
                {value ? 'Change Image' : 'Upload Image'}
              </Text>
            </TouchableOpacity>

            {value ? (
              <TouchableOpacity
                activeOpacity={0.75}
                disabled={disabled || isLoading}
                onPress={() => onChange?.(null)}
                className="flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <Trash2 size={13} color="#dc2626" />
                <Text className="text-[11px] font-semibold text-destructive">
                  Remove
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

export default ImagePickerField;
