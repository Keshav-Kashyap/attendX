import React, { useEffect, useRef } from 'react';
import { View, Animated, Platform } from 'react-native';

export function Skeleton({
  width,
  height,
  borderRadius = 8,
  style,
  className = '',
}) {
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const useNative = Platform.OS !== 'web';
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: useNative,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: useNative,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: '#cbd5e1',
          opacity: opacityAnim,
        },
        style,
      ]}
      className={className}
    />
  );
}

export function SkeletonCircle({ size = 48, style, className = '' }) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
      className={className}
    />
  );
}

export default Skeleton;

