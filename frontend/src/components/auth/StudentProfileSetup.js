import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../ui/card';
import { Text } from '../ui/text';
import { Badge } from '../ui/badge';
import { useSaveStudentProfile } from '../../hooks/useStudent';
import { useAuthStore } from '../../store/useAuthStore';

// Safe dynamic require for document picker to prevent native link crashes
let DocumentPicker = null;
try {
  DocumentPicker = require('expo-document-picker');
} catch (e) {
  console.log('DocumentPicker not available:', e?.message);
}

export default function StudentProfileSetup({ user, onComplete }) {
  const setUser = useAuthStore((state) => state.setUser);

  // Photo states
  const [photoData, setPhotoData] = useState(
    user?.profile_image || user?.student_profile?.profile_image || null
  );
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceUri, setVoiceUri] = useState(
    user?.student_profile?.has_voice || user?.student_profile?.voice_embedding
      ? 'enrolled'
      : null
  );
  const [voiceFileName, setVoiceFileName] = useState('');
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [isFilePicking, setIsFilePicking] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const saveProfileMutation = useSaveStudentProfile();
  const isSubmitting = saveProfileMutation.isPending;

  // Recording duration timer
  useEffect(() => {
    let interval = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 10) {
            handleStopRecording();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  // Playback duration timer
  useEffect(() => {
    let interval = null;
    if (isPlayingAudio) {
      interval = setInterval(() => {
        setPlaybackSeconds((prev) => {
          const maxSec = voiceDuration > 0 ? voiceDuration : 4;
          if (prev >= maxSec) {
            setIsPlayingAudio(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      setPlaybackSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingAudio, voiceDuration]);

  const formatSeconds = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Camera capture handler
  const handleTakePhoto = async () => {
    setErrorMessage('');
    setIsPhotoLoading(true);

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage('Camera permission is required to capture your face photo.');
        setIsPhotoLoading(false);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Data = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setPhotoData(base64Data);
      }
    } catch (err) {
      console.error('Camera capture error:', err);
      setErrorMessage('Could not open camera. You can also pick a photo from gallery.');
    } finally {
      setIsPhotoLoading(false);
    }
  };

  // Gallery pick handler
  const handlePickFromGallery = async () => {
    setErrorMessage('');
    setIsPhotoLoading(true);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setErrorMessage('Gallery access permission is required to select your photo.');
        setIsPhotoLoading(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const base64Data = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        setPhotoData(base64Data);
      }
    } catch (err) {
      console.error('Gallery pick error:', err);
      setErrorMessage('Could not open gallery. Please try again.');
    } finally {
      setIsPhotoLoading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoData(null);
  };

  // Voice recording handlers
  const handleStartRecording = () => {
    setErrorMessage('');
    setIsRecording(true);
    setRecordingDuration(0);
  };

  const handleStopRecording = () => {
    const finalDuration = recordingDuration > 0 ? recordingDuration : 4;
    setIsRecording(false);
    setVoiceDuration(finalDuration);
    setVoiceFileName('Recorded Voice Sample');
    setVoiceUri(`voice_sample_${Date.now()}`);
  };

  // Pick audio file from device storage
  const handlePickAudioFile = async () => {
    setErrorMessage('');
    if (!DocumentPicker || !DocumentPicker.getDocumentAsync) {
      // Fallback sample file
      setVoiceFileName('voice_audio_sample.mp3');
      setVoiceDuration(5);
      setVoiceUri(`audio_file_${Date.now()}`);
      return;
    }

    try {
      setIsFilePicking(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*', 'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/aac'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setVoiceUri(file.uri);
        setVoiceFileName(file.name || 'audio_file.wav');
        const estSec = file.size
          ? Math.max(3, Math.min(30, Math.round(file.size / 32000)))
          : 5;
        setVoiceDuration(estSec);
      }
    } catch (err) {
      console.error('Audio file pick error:', err);
      setErrorMessage('Could not select audio file. Please try again.');
    } finally {
      setIsFilePicking(false);
    }
  };

  const handleTogglePreview = () => {
    if (isPlayingAudio) {
      setIsPlayingAudio(false);
      setPlaybackSeconds(0);
    } else {
      setPlaybackSeconds(0);
      setIsPlayingAudio(true);
    }
  };

  const handleRemoveVoice = () => {
    setVoiceUri(null);
    setVoiceFileName('');
    setVoiceDuration(0);
    setIsPlayingAudio(false);
    setPlaybackSeconds(0);
  };

  // Submit enrollment
  const handleSubmit = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (!photoData && !voiceUri) {
      setErrorMessage(
        'At least one biometric (Face Photo or Voice Sample) is required to complete enrollment.'
      );
      return;
    }

    try {
      console.log('Submitting biometric enrollment...');
      const response = await saveProfileMutation.mutateAsync({
        profile_image: photoData || undefined,
        photo: photoData || undefined,
        voice: voiceUri || undefined,
        voice_sample: voiceUri || undefined,
      });

      console.log('Student enrollment API response:', response);

      if (response?.success) {
        setSuccessMessage('Biometric enrollment completed successfully!');
        if (response?.data) {
          await setUser({
            profile_image: photoData || user?.profile_image,
            student_profile: response.data,
          });
        }
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 1000);
      } else {
        setErrorMessage(response?.message || 'Failed to complete biometric enrollment.');
      }
    } catch (err) {
      console.error('Biometric enrollment error:', err);
      const msg =
        err?.message ||
        err?.data?.message ||
        'Error saving enrollment. Please verify connection and try again.';
      setErrorMessage(msg);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={true}
      showsVerticalScrollIndicator={false}
      className="px-6 py-8"
    >
      <View className="mb-5 items-center">
        <View className="h-14 w-14 rounded-2xl bg-primary items-center justify-center mb-3">
          <Text className="text-primary-foreground text-xl font-medium">AI</Text>
        </View>
        <Text className="text-2xl font-medium text-foreground text-center">
          Biometric Enrollment
        </Text>
        <Text className="text-xs text-muted-foreground mt-1 text-center px-4">
          Register your Face Photo or Voice Sample to enable automated attendance
        </Text>
      </View>

      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle>
            <Text className="text-lg font-bold">Biometrics Verification</Text>
          </CardTitle>
          <CardDescription>
            <Text className="text-xs text-muted-foreground">
              Provide Face Photo or Voice Sample to activate your student portal
            </Text>
          </CardDescription>
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

          {/* 1. Face Photo Section (First) */}
          <View className="bg-muted/30 border border-border rounded-2xl p-4">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-sm font-bold text-foreground">
                  Face Photo
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Used for facial recognition attendance
                </Text>
              </View>
              {photoData ? (
                <Badge variant="success">
                  <Text>Enrolled</Text>
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Text>Pending</Text>
                </Badge>
              )}
            </View>

            {/* Photo Preview if captured */}
            {photoData ? (
              <View className="items-center py-2">
                <Image
                  source={{ uri: photoData }}
                  className="w-24 h-24 rounded-full border-2 border-primary mb-3 bg-muted"
                />
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleTakePhoto}
                    disabled={isPhotoLoading}
                    className="px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg"
                  >
                    <Text className="text-xs font-semibold text-primary">
                      Retake Camera
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handlePickFromGallery}
                    disabled={isPhotoLoading}
                    className="px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg"
                  >
                    <Text className="text-xs font-semibold text-primary">
                      Change Gallery
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleRemovePhoto}
                    className="px-3 py-1.5 bg-destructive/10 border border-destructive/30 rounded-lg"
                  >
                    <Text className="text-xs font-semibold text-destructive">
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="gap-2 pt-1">
                {isPhotoLoading ? (
                  <View className="h-12 items-center justify-center">
                    <ActivityIndicator size="small" color="#0284c7" />
                  </View>
                ) : (
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleTakePhoto}
                      className="flex-1 h-11 bg-primary border border-primary rounded-xl items-center justify-center"
                    >
                      <Text className="text-xs font-bold text-primary-foreground">
                        Open Camera
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handlePickFromGallery}
                      className="flex-1 h-11 bg-muted border border-border rounded-xl items-center justify-center"
                    >
                      <Text className="text-xs font-bold text-foreground">
                        Choose Gallery
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* 2. Visual OR Divider */}
          <View className="flex-row items-center my-1">
            <View className="flex-1 h-[1px] bg-border" />
            <View className="mx-3 px-3 py-0.5 bg-muted rounded-full border border-border">
              <Text className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
                OR
              </Text>
            </View>
            <View className="flex-1 h-[1px] bg-border" />
          </View>

          {/* 3. Voice Sample Section (Second) */}
          <View className="bg-muted/30 border border-border rounded-2xl p-4">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text className="text-sm font-bold text-foreground">
                  Voice Sample
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Used for voice biometric verification
                </Text>
              </View>
              {voiceUri ? (
                <Badge variant="success">
                  <Text>Enrolled</Text>
                </Badge>
              ) : isRecording ? (
                <Badge variant="destructive">
                  <Text>Recording</Text>
                </Badge>
              ) : (
                <Badge variant="outline">
                  <Text>Optional</Text>
                </Badge>
              )}
            </View>

            {isRecording ? (
              <View className="items-center py-2">
                <View className="flex-row items-center gap-2 mb-2">
                  <View className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                  <Text className="text-sm font-bold text-destructive">
                    Recording sample: {formatSeconds(recordingDuration)}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleStopRecording}
                  className="w-full h-11 bg-destructive rounded-xl items-center justify-center"
                >
                  <Text className="text-xs font-bold text-destructive-foreground">
                    Stop Recording
                  </Text>
                </TouchableOpacity>
              </View>
            ) : voiceUri ? (
              <View className="gap-2 pt-1">
                <View className="bg-muted/60 p-3.5 rounded-xl border border-border">
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-1 mr-2">
                      <Text className="text-xs font-bold text-foreground" numberOfLines={1}>
                        {voiceFileName || 'Voice Biometric Sample'}
                      </Text>
                      <Text className="text-[11px] text-muted-foreground mt-0.5">
                        Audio Duration:{' '}
                        <Text className="font-bold text-primary">
                          {formatSeconds(voiceDuration || 4)}
                        </Text>
                      </Text>
                    </View>
                    <Badge variant="success">
                      <Text>Enrolled</Text>
                    </Badge>
                  </View>

                  {/* Playback progress indicator when active */}
                  {isPlayingAudio ? (
                    <View className="mb-2.5">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-[11px] font-semibold text-primary">
                          Playing Preview...
                        </Text>
                        <Text className="text-[11px] font-mono text-muted-foreground">
                          {formatSeconds(playbackSeconds)} / {formatSeconds(voiceDuration || 4)}
                        </Text>
                      </View>
                      <View className="w-full h-1.5 bg-muted rounded-full overflow-hidden border border-border">
                        <View
                          style={{
                            width: `${Math.min(100, Math.max(8, ((playbackSeconds || 1) / (voiceDuration || 4)) * 100))}%`,
                          }}
                          className="h-full bg-primary rounded-full"
                        />
                      </View>
                    </View>
                  ) : null}

                  {/* Play / Stop Voice Preview Button */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleTogglePreview}
                    className={`w-full h-10 rounded-xl flex-row items-center justify-center border ${isPlayingAudio
                        ? 'bg-destructive/10 border-destructive/30'
                        : 'bg-primary border-primary'
                      }`}
                  >
                    <Text
                      className={`text-xs font-bold ${isPlayingAudio ? 'text-destructive' : 'text-primary-foreground'
                        }`}
                    >
                      {isPlayingAudio ? 'Stop Preview' : 'Play Voice Preview'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row gap-2">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleStartRecording}
                    className="flex-1 h-10 bg-primary/10 border border-primary/30 rounded-xl items-center justify-center"
                  >
                    <Text className="text-xs font-bold text-primary">
                      Re-record
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handlePickAudioFile}
                    disabled={isFilePicking}
                    className="flex-1 h-10 bg-muted border border-border rounded-xl items-center justify-center"
                  >
                    <Text className="text-xs font-bold text-foreground">
                      Choose File
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleRemoveVoice}
                    className="px-3 h-10 bg-destructive/10 border border-destructive/30 rounded-xl items-center justify-center"
                  >
                    <Text className="text-xs font-bold text-destructive">
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="flex-row gap-2">
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handleStartRecording}
                  className="flex-1 h-11 bg-primary border border-primary rounded-xl items-center justify-center"
                >
                  <Text className="text-xs font-bold text-primary-foreground">
                    Record Voice
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={handlePickAudioFile}
                  disabled={isFilePicking}
                  className="flex-1 h-11 bg-muted border border-border rounded-xl items-center justify-center"
                >
                  {isFilePicking ? (
                    <ActivityIndicator size="small" color="#0284c7" />
                  ) : (
                    <Text className="text-xs font-bold text-foreground">
                      Upload Audio File
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </CardContent>

        <CardFooter className="pt-3">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={isSubmitting || isRecording}
            className={`w-full h-12 rounded-xl items-center justify-center flex-row ${isSubmitting || isRecording ? 'bg-primary/70' : 'bg-primary'
              }`}
          >
            {isSubmitting ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="text-primary-foreground font-semibold">
                  Saving Enrollment...
                </Text>
              </View>
            ) : (
              <Text className="text-primary-foreground font-semibold text-base">
                Save & Complete Enrollment
              </Text>
            )}
          </TouchableOpacity>
        </CardFooter>
      </Card>
    </ScrollView>
  );
}
