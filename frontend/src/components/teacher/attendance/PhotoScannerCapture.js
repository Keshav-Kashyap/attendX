import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Animated,
  Easing,
  Pressable,
  AccessibilityInfo,
} from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Path } from 'react-native-svg';
import { Text } from '../../ui/text';
import { Badge } from '../../ui/badge';
import Icon from '../../ui/Icon';

const BUTTON_WIDTH = 220;
const BUTTON_HEIGHT = 52;
const BORDER_RADIUS = 26;

export default function PhotoScannerCapture({
  photos = [],
  onTakePhoto,
  onPickGallery,
  onRemovePhoto,
  onSubmitScan,
  isScanning = false,
  scanOutcome = null, // 'detected' | 'no_face' | 'error' | null
  errorMessage = '',
}) {
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [cardHeight, setCardHeight] = useState(220);
  const [btnState, setBtnState] = useState('idle'); // 'idle' | 'analyzing' | 'detected' | 'no_face' | 'error'
  const [reduceMotion, setReduceMotion] = useState(false);
  const [checkDashOffset, setCheckDashOffset] = useState(28);

  const hasPhotos = photos.length > 0;
  const activePhoto = photos[activePhotoIdx] || photos[0] || null;

  // Animation values
  const pressScaleAnim = useRef(new Animated.Value(1)).current;
  const auroraSpinAnim = useRef(new Animated.Value(0)).current;
  const scanBeamAnim = useRef(new Animated.Value(0)).current;
  const bracketScaleAnim = useRef(new Animated.Value(1.35)).current;
  const bracketOpacityAnim = useRef(new Animated.Value(0)).current;
  const checkDrawAnim = useRef(new Animated.Value(28)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const labelOpacityAnim = useRef(new Animated.Value(1)).current;
  const labelSlideAnim = useRef(new Animated.Value(0)).current;

  const resetTimerRef = useRef(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReduceMotion(Boolean(enabled));
    });
  }, []);

  useEffect(() => {
    if (activePhotoIdx >= photos.length && photos.length > 0) {
      setActivePhotoIdx(photos.length - 1);
    } else if (photos.length === 0) {
      setActivePhotoIdx(0);
    }
  }, [photos.length, activePhotoIdx]);

  // Sync btnState with isScanning & scanOutcome
  useEffect(() => {
    if (isScanning) {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
      setBtnState('analyzing');
      return;
    }

    if (btnState === 'analyzing' && scanOutcome) {
      setBtnState(scanOutcome);
      resetTimerRef.current = setTimeout(() => {
        setBtnState('idle');
      }, 2200);
    } else if (!isScanning && !scanOutcome && btnState === 'analyzing') {
      setBtnState('idle');
    }
  }, [isScanning, scanOutcome]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  // Label fade + slide up transition on state change
  useEffect(() => {
    if (reduceMotion) {
      labelOpacityAnim.setValue(1);
      labelSlideAnim.setValue(0);
      return;
    }
    labelOpacityAnim.setValue(0);
    labelSlideAnim.setValue(8);
    Animated.parallel([
      Animated.timing(labelOpacityAnim, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(labelSlideAnim, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [btnState, reduceMotion, labelOpacityAnim, labelSlideAnim]);

  // Aurora border rotation (1 rotation every 1.4s) & photo scan beam sweep
  useEffect(() => {
    if (btnState === 'analyzing' && !reduceMotion) {
      auroraSpinAnim.setValue(0);
      scanBeamAnim.setValue(0);

      const spinLoop = Animated.loop(
        Animated.timing(auroraSpinAnim, {
          toValue: 1,
          duration: 1400,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      const beamLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanBeamAnim, {
            toValue: 1,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scanBeamAnim, {
            toValue: 0,
            duration: 1100,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      spinLoop.start();
      beamLoop.start();
      return () => {
        spinLoop.stop();
        beamLoop.stop();
      };
    } else {
      auroraSpinAnim.setValue(0);
      scanBeamAnim.setValue(0);
    }
  }, [btnState, reduceMotion, auroraSpinAnim, scanBeamAnim]);

  // Face detected: spring corner brackets (1.35 -> 1) + self-drawing white checkmark
  useEffect(() => {
    if (btnState === 'detected') {
      if (reduceMotion) {
        bracketScaleAnim.setValue(1);
        bracketOpacityAnim.setValue(1);
        checkDrawAnim.setValue(0);
        setCheckDashOffset(0);
        return;
      }
      bracketScaleAnim.setValue(1.35);
      bracketOpacityAnim.setValue(0);
      checkDrawAnim.setValue(28);
      setCheckDashOffset(28);

      const listenerId = checkDrawAnim.addListener(({ value }) => {
        setCheckDashOffset(value);
      });

      Animated.parallel([
        Animated.spring(bracketScaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(bracketOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(checkDrawAnim, {
          toValue: 0,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();

      return () => {
        checkDrawAnim.removeListener(listenerId);
      };
    } else {
      bracketOpacityAnim.setValue(0);
    }
  }, [btnState, reduceMotion, bracketScaleAnim, bracketOpacityAnim, checkDrawAnim]);

  // No face / Error: shake once horizontally
  useEffect(() => {
    if ((btnState === 'no_face' || btnState === 'error') && !reduceMotion) {
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -3, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 45, useNativeDriver: true }),
      ]).start();
    } else {
      shakeAnim.setValue(0);
    }
  }, [btnState, reduceMotion, shakeAnim]);

  const handlePressIn = () => {
    if (btnState === 'analyzing' || !hasPhotos) return;
    Animated.spring(pressScaleAnim, {
      toValue: 0.95,
      friction: 6,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 180,
      useNativeDriver: true,
    }).start();
  };

  const auroraRotate = auroraSpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const scanBeamTranslateY = scanBeamAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(40, cardHeight - 44)],
  });

  const handleSelectSource = (type) => {
    setShowSourceModal(false);
    setTimeout(() => {
      if (type === 'camera') {
        onTakePhoto?.();
      } else if (type === 'gallery') {
        onPickGallery?.();
      }
    }, 120);
  };

  const buttonLabel =
    btnState === 'analyzing'
      ? 'Analyzing...'
      : btnState === 'detected'
      ? 'Face Detected'
      : btnState === 'no_face'
      ? 'No Face Found'
      : btnState === 'error'
      ? 'Try Again'
      : 'Analyze';

  const isGreen = btnState === 'detected';
  const isOrange = btnState === 'no_face' || btnState === 'error';
  const isAnalyzing = btnState === 'analyzing';

  return (
    <View
      className="bg-white border border-[#E6EAF2] rounded-[24px] p-4 mb-4"
      style={{
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Title & Ready Badge */}
      <View className="flex-row items-start justify-between mb-3.5">
        <View className="flex-1 mr-3">
          <Text className="text-[17px] font-bold text-[#0F172A]">
            Classroom photos
          </Text>
          <Text className="text-xs text-[#64748B] mt-0.5 leading-snug">
            Take a few photos from different angles for better accuracy
          </Text>
        </View>

        <View
          className={`px-3 py-1.5 rounded-2xl ${
            hasPhotos ? 'bg-[#ECFDF5]' : 'bg-[#F1F5F9]'
          }`}
        >
          <Text
            className={`text-[11px] font-semibold text-center ${
              hasPhotos ? 'text-[#059669]' : 'text-[#64748B]'
            }`}
          >
            {photos.length} photo{photos.length !== 1 ? 's' : ''}{'\n'}ready
          </Text>
        </View>
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

      {/* Photo Showcase Area */}
      {hasPhotos ? (
        <View className="mb-5">
          {/* Main 4:3 Rounded Photo Card (16px radius) with Scan Beam & Yellow Face Brackets */}
          <View
            onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}
            style={{
              width: '100%',
              aspectRatio: 4 / 3,
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: '#0f172a',
              position: 'relative',
            }}
            className="border border-border/80 shadow-xs mb-3"
          >
            <Image
              source={{
                uri: typeof activePhoto === 'string' ? activePhoto : activePhoto?.uri,
              }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />

            {/* Translucent Blue Scan Beam sweeping up & down while analyzing */}
            {isAnalyzing && (
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  height: 44,
                  transform: [{ translateY: scanBeamTranslateY }],
                }}
              >
                <Svg width="100%" height="44">
                  <Defs>
                    <LinearGradient id="scanBeamGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#0a84ff" stopOpacity="0" />
                      <Stop offset="0.5" stopColor="#0a84ff" stopOpacity="0.45" />
                      <Stop offset="0.85" stopColor="#38bdf8" stopOpacity="0.85" />
                      <Stop offset="1" stopColor="#0a84ff" stopOpacity="0" />
                    </LinearGradient>
                  </Defs>
                  <Rect x="0" y="0" width="100%" height="44" fill="url(#scanBeamGrad)" />
                </Svg>
              </Animated.View>
            )}

            {/* Four Yellow (#ffd60a) Rounded Corner Brackets when face detected */}
            {btnState === 'detected' && (
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute',
                  top: '18%',
                  left: '20%',
                  right: '20%',
                  bottom: '18%',
                  opacity: bracketOpacityAnim,
                  transform: [{ scale: bracketScaleAnim }],
                }}
              >
                {/* Top-Left Bracket */}
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: 28,
                    height: 28,
                    borderTopWidth: 3.5,
                    borderLeftWidth: 3.5,
                    borderColor: '#ffd60a',
                    borderTopLeftRadius: 10,
                  }}
                />
                {/* Top-Right Bracket */}
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 28,
                    height: 28,
                    borderTopWidth: 3.5,
                    borderRightWidth: 3.5,
                    borderColor: '#ffd60a',
                    borderTopRightRadius: 10,
                  }}
                />
                {/* Bottom-Left Bracket */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: 28,
                    height: 28,
                    borderBottomWidth: 3.5,
                    borderLeftWidth: 3.5,
                    borderColor: '#ffd60a',
                    borderBottomLeftRadius: 10,
                  }}
                />
                {/* Bottom-Right Bracket */}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 28,
                    height: 28,
                    borderBottomWidth: 3.5,
                    borderRightWidth: 3.5,
                    borderColor: '#ffd60a',
                    borderBottomRightRadius: 10,
                  }}
                />
              </Animated.View>
            )}

            {/* Photo counter badge */}
            <View className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60">
              <Text className="text-white text-[10px] font-bold">
                Shot #{activePhotoIdx + 1} of {photos.length}
              </Text>
            </View>

            {/* Remove current photo button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onRemovePhoto(activePhotoIdx)}
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/65 items-center justify-center border border-white/30"
            >
              <Text className="text-white text-[11px] font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Compact Multi-Shot Strip + Add More */}
          <View className="flex-row items-center justify-between mb-2 px-0.5">
            <Text className="text-xs font-semibold text-foreground">
              Selected Shots ({photos.length})
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowSourceModal(true)}
              className="flex-row items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20"
            >
              <Icon name="add" size={12} color="#0066FF" />
              <Text className="text-[11px] font-semibold text-primary">Add Photo</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
          >
            {photos.map((item, idx) => {
              const isSelected = idx === activePhotoIdx;
              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.8}
                  onPress={() => setActivePhotoIdx(idx)}
                  className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 ${
                    isSelected ? 'border-[#0a84ff]' : 'border-border/70'
                  }`}
                >
                  <Image
                    source={{ uri: typeof item === 'string' ? item : item.uri }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setShowSourceModal(true)}
              className="w-14 h-14 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 items-center justify-center"
            >
              <Icon name="add" size={18} color="#0066FF" />
            </TouchableOpacity>
          </ScrollView>
        </View>
      ) : (
        /* Empty State: Clean, interactive Add Classroom Photo Card */
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setShowSourceModal(true)}
          className="py-8 px-4 items-center justify-center bg-[#FAFBFD] rounded-2xl border-[1.5px] border-dashed border-[#CBD5E1] mb-4"
        >
          <View className="w-12 h-12 rounded-2xl bg-[#EEF2FF] items-center justify-center mb-3">
            <Icon name="camera" size={22} color="#3446D4" />
          </View>
          <Text className="text-[15px] font-bold text-[#0F172A]">
            Add classroom photo
          </Text>
          <Text className="text-xs text-[#64748B] mt-1 text-center">
            Tap to use the camera or choose from gallery
          </Text>

          <View className="mt-4 px-4 py-2 rounded-full bg-[#EEF2FF] flex-row items-center gap-1.5">
            <Icon name="add" size={14} color="#3446D4" />
            <Text className="text-xs font-bold text-[#3446D4]">Select photo source</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Full-Width "✦ Analyze" Action Button */}
      <View className="w-full my-0.5">
        <Animated.View
          style={{
            width: '100%',
            transform: [
              { scale: pressScaleAnim },
              { translateX: shakeAnim },
            ],
          }}
        >
          <Pressable
            onPress={() => {
              if (!hasPhotos) {
                setShowSourceModal(true);
                return;
              }
              if (!isAnalyzing) {
                onSubmitScan?.();
              }
            }}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={isAnalyzing}
            accessibilityRole="button"
            accessibilityLabel={buttonLabel}
            accessibilityState={{ disabled: isAnalyzing, busy: isAnalyzing }}
            style={{
              width: '100%',
              height: 50,
              borderRadius: 16,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isGreen
                ? '#1f9d55'
                : isOrange
                ? '#c25e00'
                : isAnalyzing
                ? '#ffffff'
                : hasPhotos
                ? '#3446D4'
                : '#E5E9F2',
              borderWidth: isAnalyzing ? 0 : 0,
              shadowColor: hasPhotos ? '#3446D4' : '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: hasPhotos ? 0.22 : 0,
              shadowRadius: 8,
              elevation: hasPhotos ? 3 : 0,
            }}
          >
            {/* Rotating 3px Aurora Gradient Border when Analyzing */}
            {isAnalyzing && (
              <>
                <Animated.View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    width: 560,
                    height: 560,
                    transform: [{ rotate: auroraRotate }],
                  }}
                >
                  <Svg width="560" height="560" viewBox="0 0 560 560">
                    <Defs>
                      <LinearGradient id="auroraBorder" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0" stopColor="#0a84ff" />
                        <Stop offset="0.33" stopColor="#bf5af2" />
                        <Stop offset="0.66" stopColor="#ff375f" />
                        <Stop offset="1" stopColor="#ff9f0a" />
                      </LinearGradient>
                    </Defs>
                    <Rect x="0" y="0" width="560" height="560" fill="url(#auroraBorder)" />
                  </Svg>
                </Animated.View>

                {/* Inner White Pill leaving crisp 3px aurora border */}
                <View
                  pointerEvents="none"
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: 3,
                    right: 3,
                    bottom: 3,
                    borderRadius: 13,
                    backgroundColor: '#ffffff',
                  }}
                />
              </>
            )}

            {/* Animated Label + Icon Content */}
            <Animated.View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: labelOpacityAnim,
                transform: [{ translateY: labelSlideAnim }],
              }}
            >
              {isGreen ? (
                <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M5 13l4 4L19 7"
                    stroke="#ffffff"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="28"
                    strokeDashoffset={checkDashOffset}
                  />
                </Svg>
              ) : !isOrange && !isAnalyzing ? (
                <Icon
                  name="sparkles"
                  size={17}
                  color={hasPhotos ? '#ffffff' : '#94A3B8'}
                />
              ) : null}

              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color:
                    isGreen || isOrange || (hasPhotos && !isAnalyzing)
                      ? '#ffffff'
                      : isAnalyzing
                      ? '#1d1d1f'
                      : '#94A3B8',
                  letterSpacing: -0.2,
                }}
              >
                {buttonLabel}
              </Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>

      {/* Photo Source Selection Bottom Sheet Modal */}
      <Modal
        visible={showSourceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSourceModal(false)}
      >
        <Pressable
          onPress={() => setShowSourceModal(false)}
          className="flex-1 bg-black/55 justify-end"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-card rounded-t-3xl border-t border-border p-5 pb-8 shadow-2xl"
          >
            {/* Modal Drag Indicator */}
            <View className="w-12 h-1.5 rounded-full bg-muted-foreground/30 self-center mb-4" />

            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-border/70 mb-4">
              <View>
                <Text className="text-base font-bold text-foreground">
                  Add Classroom Photo
                </Text>
                <Text className="text-xs text-muted-foreground mt-0.5">
                  Choose photo source for AI attendance recognition
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowSourceModal(false)}
                className="w-7 h-7 rounded-full bg-muted/60 items-center justify-center border border-border"
              >
                <Text className="text-foreground text-xs font-bold">✕</Text>
              </TouchableOpacity>
            </View>

            {/* Option 1: Live Camera */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSelectSource('camera')}
              className="p-4 rounded-2xl bg-muted/30 border border-border/80 flex-row items-center gap-3.5 mb-3"
            >
              <View className="w-12 h-12 rounded-2xl bg-[#0066FF]/10 items-center justify-center border border-[#0066FF]/20">
                <Icon name="camera" size={24} color="#0066FF" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground">
                  Take Live Photo
                </Text>
                <Text className="text-[11px] text-muted-foreground mt-0.5">
                  Use camera to capture classroom attendance right now
                </Text>
              </View>
              <Icon name="chevron-right" size={16} color="#94a3b8" />
            </TouchableOpacity>

            {/* Option 2: Upload from Gallery */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleSelectSource('gallery')}
              className="p-4 rounded-2xl bg-muted/30 border border-border/80 flex-row items-center gap-3.5 mb-4"
            >
              <View className="w-12 h-12 rounded-2xl bg-emerald-500/10 items-center justify-center border border-emerald-500/20">
                <Icon name="image" size={24} color="#10b981" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-foreground">
                  Choose from Gallery
                </Text>
                <Text className="text-[11px] text-muted-foreground mt-0.5">
                  Select existing photos from device gallery (multi-select supported)
                </Text>
              </View>
              <Icon name="chevron-right" size={16} color="#94a3b8" />
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowSourceModal(false)}
              className="py-3 rounded-xl bg-muted/50 border border-border items-center justify-center"
            >
              <Text className="text-xs font-semibold text-muted-foreground">
                Cancel
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
