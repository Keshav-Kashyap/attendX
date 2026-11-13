import React from 'react';
import { View, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Text } from '../../ui/text';
import { Badge } from '../../ui/badge';
import Icon from '../../ui/Icon';

export default function PhotoScannerCapture({
  photos = [],
  onTakePhoto,
  onPickGallery,
  onRemovePhoto,
  onSubmitScan,
  isScanning = false,
  errorMessage = '',
}) {
  const hasPhotos = photos.length > 0;

  return (
    <View className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm mb-4">
      {/* Title & Ready Badge */}
      <View className="flex-row items-center justify-between pb-3 border-b border-border/60 mb-3">
        <View className="flex-1 mr-2">
          <Text className="text-sm font-semibold text-foreground">
            Classroom Photos
          </Text>
          <Text className="text-[11px] text-muted-foreground mt-0.5">
            Capture multiple angles for high accuracy AI recognition
          </Text>
        </View>

        <Badge
          variant={hasPhotos ? 'success' : 'outline'}
          className="px-2 py-0.5"
        >
          <Text className="text-[10px] font-bold">
            {photos.length} Photo{photos.length !== 1 ? 's' : ''} Ready
          </Text>
        </Badge>
      </View>

      {/* Error Banner */}
      {errorMessage ? (
        <View className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl mb-3 flex-row items-center gap-2">
          <Icon name="alert-circle" size={16} color="#ef4444" />
          <Text className="text-xs text-destructive font-medium flex-1">
            {errorMessage}
          </Text>
        </View>
      ) : null}

      {/* Primary Capture Action Buttons: Camera & Gallery */}
      <View className="flex-row gap-2.5 mb-3.5">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onTakePhoto}
          className="flex-1 py-3 px-3 bg-[#0066FF] rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
        >
          <Icon name="camera" size={16} color="#ffffff" />
          <Text className="text-xs font-semibold text-white">Live Camera</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onPickGallery}
          className="flex-1 py-3 px-3 bg-muted/50 border border-border rounded-xl flex-row items-center justify-center gap-2"
        >
          <Icon name="images" size={16} color="#64748b" />
          <Text className="text-xs font-semibold text-foreground">Upload Photos</Text>
        </TouchableOpacity>
      </View>

      {/* Captured Photos Preview Thumbnails */}
      {hasPhotos ? (
        <View className="mb-3.5">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xs font-semibold text-foreground">
              Selected Shots ({photos.length})
            </Text>
            <Text className="text-[10px] text-muted-foreground">
              Tap ✕ to remove
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            {photos.map((item, idx) => (
              <View
                key={idx}
                className="relative w-24 h-24 rounded-xl overflow-hidden border border-border bg-black/10"
              >
                <Image
                  source={{ uri: typeof item === 'string' ? item : item.uri }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => onRemovePhoto(idx)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 items-center justify-center border border-white/20"
                >
                  <Text className="text-white text-[10px] font-bold">✕</Text>
                </TouchableOpacity>
                <View className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60">
                  <Text className="text-white text-[9px] font-bold">#{idx + 1}</Text>
                </View>
              </View>
            ))}

            {/* Quick Add More Tile */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onTakePhoto}
              className="w-24 h-24 rounded-xl border border-dashed border-border/80 bg-muted/20 items-center justify-center"
            >
              <Icon name="add" size={22} color="#0066FF" />
              <Text className="text-[10px] font-semibold text-primary mt-1">Add More</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      ) : (
        <View className="py-7 items-center justify-center bg-muted/20 rounded-xl border border-dashed border-border/80 mb-3.5">
          <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center mb-2">
            <Icon name="camera" size={24} color="#0066FF" />
          </View>
          <Text className="text-xs font-semibold text-foreground">
            No classroom photos added yet
          </Text>
          <Text className="text-[11px] text-muted-foreground mt-0.5">
            Take live photos or upload from classroom album
          </Text>
        </View>
      )}

      {/* Process AI Attendance Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onSubmitScan}
        disabled={isScanning || !hasPhotos}
        className={`w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-sm ${
          hasPhotos && !isScanning ? 'bg-[#0066FF]' : 'bg-muted border border-border'
        }`}
      >
        {isScanning ? (
          <>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text className="text-white text-xs font-semibold tracking-wide">
              Analyzing Classroom Faces...
            </Text>
          </>
        ) : (
          <>
            <Icon
              name="scan"
              size={16}
              color={hasPhotos ? '#ffffff' : '#94a3b8'}
            />
            <Text
              className={`text-xs font-semibold tracking-wide ${
                hasPhotos ? 'text-white' : 'text-muted-foreground'
              }`}
            >
              Analyze & Record Attendance
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}
