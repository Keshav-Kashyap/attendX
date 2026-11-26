import React, { useState, useRef } from 'react';
import {
  View,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  BookPlus,
  UserPlus,
  GraduationCap,
  ArrowLeftRight,
  Layers,
  QrCode,
} from 'lucide-react-native';
import { Text } from '../ui/text';
import CreateCourseModal from './CreateCourseModal';
import CreateTeacherModal from './CreateTeacherModal';
import CreateStudentModal from './CreateStudentModal';
import BatchEnrollModal from './BatchEnrollModal';
import InviteLinkModal from './InviteLinkModal';

function SpeedDialActionItem({ item, anim, onPress }) {
  const IconComponent = item.icon || Plus;
  const iconColor = item.color || '#2563eb';
  const badgeBg = item.badgeBg || '#eff6ff';

  // Smooth vertical slide only - no scale or translateX to prevent flipping/distortion
  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY }],
      }}
    >
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#ffffff',
          paddingVertical: 10,
          paddingLeft: 10,
          paddingRight: 20,
          borderRadius: 28,
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.16,
          shadowRadius: 10,
          elevation: 7,
          borderWidth: 1,
          borderColor: '#e2e8f0',
          ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
        }}
      >
        {/* Left Icon Badge with Soft Pastel Background */}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: badgeBg,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <IconComponent
            size={22}
            color={iconColor}
            strokeWidth={2.4}
          />
        </View>

        {/* Text Label */}
        <Text
          style={{
            color: '#0f172a',
            fontSize: 15.5,
            fontWeight: '600',
            letterSpacing: 0.1,
          }}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AdminSpeedDial({
  actions,
  onAddCourse,
  onAddFaculty,
  onEnrollStudent,
  onBatchEnroll,
  onAssignFaculty,
  bottomOffset = 84,
  rightOffset = 20,
}) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  // Animation values
  const mainAnim = useRef(new Animated.Value(0)).current;
  const timeoutIdsRef = useRef([]);

  // Modal triggers for global action creation
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showBatchEnrollModal, setShowBatchEnrollModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const handleCreateCourse = () => {
    if (onAddCourse) {
      onAddCourse();
    } else {
      setShowCourseModal(true);
    }
  };

  const handleAddFaculty = () => {
    if (onAddFaculty) {
      onAddFaculty();
    } else {
      setShowTeacherModal(true);
    }
  };

  const handleEnrollStudent = () => {
    if (onEnrollStudent) {
      onEnrollStudent();
    } else {
      setShowStudentModal(true);
    }
  };

  const handleBatchEnroll = () => {
    if (onBatchEnroll) {
      onBatchEnroll();
    } else {
      setShowBatchEnrollModal(true);
    }
  };

  const handleAssignFaculty = () => {
    if (onAssignFaculty) {
      onAssignFaculty();
    } else {
      router.push('/users/assign');
    }
  };

  // Speed Dial action items with clean white card theme and matching pastel badges
  const defaultActions = [
    {
      id: 'add_course',
      label: 'Add Course',
      icon: BookPlus,
      color: '#2563eb',
      badgeBg: '#eff6ff',
      onPress: handleCreateCourse,
    },
    {
      id: 'enroll_student',
      label: 'Enroll Student',
      icon: GraduationCap,
      color: '#6366f1',
      badgeBg: '#eef2ff',
      onPress: handleEnrollStudent,
    },
    {
      id: 'batch_enroll',
      label: 'Batch Enroll',
      icon: Layers,
      color: '#0284c7',
      badgeBg: '#f0f9ff',
      onPress: handleBatchEnroll,
    },
    {
      id: 'add_faculty',
      label: 'Add Faculty',
      icon: UserPlus,
      color: '#16a34a',
      badgeBg: '#f0fdf4',
      onPress: handleAddFaculty,
    },
    {
      id: 'assign_faculty',
      label: 'Assign Faculty',
      icon: ArrowLeftRight,
      color: '#9333ea',
      badgeBg: '#faf5ff',
      onPress: handleAssignFaculty,
    },
    {
      id: 'invite_qr',
      label: 'Invite QR',
      icon: QrCode,
      color: '#0284c7',
      badgeBg: '#e0f2fe',
      onPress: () => setShowInviteModal(true),
    },
  ];

  const speedDialItems = actions || defaultActions;

  // Staggered animated values for each item
  const itemAnims = useRef(
    speedDialItems.map(() => new Animated.Value(0))
  ).current;

  while (itemAnims.length < speedDialItems.length) {
    itemAnims.push(new Animated.Value(0));
  }

  // Open animation: 100% native driver compatible
  const handleOpen = () => {
    setIsOpen(true);
    mainAnim.setValue(0);
    itemAnims.forEach((anim) => anim.setValue(0));

    // Clear any previous pending timeouts
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];

    // 1. Fade backdrop and rotate FAB button
    Animated.timing(mainAnim, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // 2. Stagger pop-up for action pills (bottom item closest to FAB expands first)
    const total = speedDialItems.length;
    speedDialItems.forEach((_, index) => {
      const delay = (total - 1 - index) * 35;
      const tid = setTimeout(() => {
        Animated.spring(itemAnims[index], {
          toValue: 1,
          tension: 70,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }, delay);
      timeoutIdsRef.current.push(tid);
    });
  };

  // Close animation: collapses pills down and rotates FAB back
  const handleClose = (callback) => {
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];

    Animated.parallel([
      Animated.timing(mainAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      ...itemAnims.slice(0, speedDialItems.length).map((anim) =>
        Animated.timing(anim, {
          toValue: 0,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        })
      ),
    ]).start(() => {
      setIsOpen(false);
      if (typeof callback === 'function') {
        callback();
      }
    });
  };

  const handleActionPress = (action) => {
    handleClose(() => {
      action.onPress?.();
    });
  };

  const fabRotation = mainAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      {/* 1. Closed State FAB Button */}
      <View
        pointerEvents="box-none"
        style={{
          position: Platform.OS === 'web' ? 'fixed' : 'absolute',
          bottom: bottomOffset,
          right: rightOffset,
          zIndex: 999999,
          elevation: 99,
          opacity: isOpen ? 0 : 1,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleOpen}
          style={{
            width: 62,
            height: 62,
            borderRadius: 31,
            backgroundColor: '#2563eb',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#1d4ed8',
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.38,
            shadowRadius: 10,
            elevation: 9,
            borderWidth: 1.5,
            borderColor: 'rgba(255, 255, 255, 0.45)',
            ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
          }}
        >
          <Plus size={32} color="#ffffff" strokeWidth={2.8} />
        </TouchableOpacity>
      </View>

      {/* 2. Open State Animated Overlay & Upward Speed Dial Menu */}
      <Modal
        visible={isOpen}
        transparent
        statusBarTranslucent
        animationType="none"
        onRequestClose={() => handleClose()}
      >
        <View style={{ flex: 1 }}>
          {/* Backdrop Overlay - tapping anywhere outside closes the speed dial */}
          <TouchableWithoutFeedback onPress={() => handleClose()}>
            <Animated.View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.65)',
                opacity: mainAnim,
              }}
            />
          </TouchableWithoutFeedback>

          {/* Speed Dial Action Items & Rotating FAB */}
          <View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              bottom: bottomOffset,
              right: rightOffset,
              alignItems: 'flex-end',
              overflow: 'visible',
              zIndex: 99999,
              elevation: 30,
            }}
          >
            {/* Upward Stack of Animated Action Pills */}
            <View style={{ marginBottom: 16, alignItems: 'flex-end', gap: 12, overflow: 'visible' }}>
              {speedDialItems.map((item, index) => {
                const anim = itemAnims[index] || mainAnim;
                return (
                  <SpeedDialActionItem
                    key={item.id}
                    item={item}
                    anim={anim}
                    onPress={() => handleActionPress(item)}
                  />
                );
              })}
            </View>

            {/* Rotating FAB Button in Open State */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handleClose()}
              style={{
                width: 62,
                height: 62,
                borderRadius: 31,
                backgroundColor: '#2563eb',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#1d4ed8',
                shadowOffset: { width: 0, height: 5 },
                shadowOpacity: 0.42,
                shadowRadius: 10,
                elevation: 10,
                borderWidth: 1.5,
                borderColor: 'rgba(255, 255, 255, 0.45)',
                ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
              }}
            >
              <Animated.View
                style={{
                  transform: [{ rotate: fabRotation }],
                }}
              >
                <Plus size={32} color="#ffffff" strokeWidth={2.8} />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Built-in Modals for Global Speed Dial Actions */}
      <CreateCourseModal
        visible={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        onSuccess={() => {
          setShowCourseModal(false);
          queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        }}
      />

      <CreateTeacherModal
        visible={showTeacherModal}
        onClose={() => setShowTeacherModal(false)}
        onSuccess={() => {
          setShowTeacherModal(false);
          queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        }}
      />

      <CreateStudentModal
        visible={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        onSuccess={() => {
          setShowStudentModal(false);
          queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        }}
      />

      <BatchEnrollModal
        visible={showBatchEnrollModal}
        onClose={() => setShowBatchEnrollModal(false)}
        onSuccess={() => {
          setShowBatchEnrollModal(false);
          queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
          queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
        }}
      />

      <InviteLinkModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        type="student"
        allowSwitch={true}
      />
    </>
  );
}
