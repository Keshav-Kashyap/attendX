import React from 'react';
import { View } from 'react-native';
import { Skeleton, SkeletonCircle } from '../ui/Skeleton';

export default function StudentHomeSkeleton() {
  return (
    <View className="gap-5">
      {/* Top Circular Progress Card Skeleton */}
      <View className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm">
        <View className="flex-row items-center justify-between mb-4">
          <Skeleton width={140} height={18} borderRadius={6} />
          <Skeleton width={80} height={20} borderRadius={12} />
        </View>

        <View className="flex-row items-center gap-5">
          {/* Circular Progress Skeleton */}
          <SkeletonCircle size={100} />

          {/* Metrics breakdown skeleton */}
          <View className="flex-1 gap-2.5">
            <View className="flex-row justify-between items-center">
              <Skeleton width={70} height={14} borderRadius={4} />
              <Skeleton width={50} height={16} borderRadius={6} />
            </View>
            <View className="flex-row justify-between items-center">
              <Skeleton width={80} height={14} borderRadius={4} />
              <Skeleton width={50} height={16} borderRadius={6} />
            </View>
            <View className="flex-row justify-between items-center">
              <Skeleton width={60} height={14} borderRadius={4} />
              <Skeleton width={50} height={16} borderRadius={6} />
            </View>
            <Skeleton width="100%" height={26} borderRadius={8} className="mt-1" />
          </View>
        </View>
      </View>

      {/* Next Upcoming Class Card Skeleton */}
      <View className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm gap-3">
        <View className="flex-row justify-between items-center">
          <Skeleton width={100} height={20} borderRadius={12} />
          <Skeleton width={90} height={20} borderRadius={12} />
        </View>
        <Skeleton width="70%" height={22} borderRadius={6} />
        <Skeleton width="45%" height={14} borderRadius={4} />
        <View className="flex-row gap-4 pt-2 border-t border-border/40 mt-1">
          <Skeleton width={120} height={16} borderRadius={4} />
          <Skeleton width={100} height={16} borderRadius={4} />
        </View>
      </View>

      {/* Schedule List Skeleton */}
      <View className="gap-3">
        <View className="flex-row justify-between items-center">
          <Skeleton width={130} height={18} borderRadius={6} />
          <Skeleton width={60} height={16} borderRadius={8} />
        </View>
        {[1, 2].map((k) => (
          <View
            key={k}
            className="bg-card border border-border/80 rounded-2xl p-3.5 flex-row items-center gap-3 shadow-sm"
          >
            <Skeleton width={52} height={52} borderRadius={14} />
            <View className="flex-1 gap-2">
              <Skeleton width="60%" height={16} borderRadius={4} />
              <Skeleton width="40%" height={12} borderRadius={4} />
            </View>
            <Skeleton width={65} height={22} borderRadius={10} />
          </View>
        ))}
      </View>

      {/* Recent Classes Skeleton */}
      <View className="gap-3">
        <View className="flex-row justify-between items-center">
          <Skeleton width={150} height={18} borderRadius={6} />
          <Skeleton width={50} height={16} borderRadius={8} />
        </View>
        {[1, 2].map((k) => (
          <View
            key={k}
            className="bg-card border border-border/80 rounded-2xl p-3.5 flex-row items-center gap-3 shadow-sm"
          >
            <Skeleton width={48} height={48} borderRadius={12} />
            <View className="flex-1 gap-2">
              <Skeleton width="65%" height={16} borderRadius={4} />
              <Skeleton width="45%" height={12} borderRadius={4} />
            </View>
            <Skeleton width={60} height={22} borderRadius={10} />
          </View>
        ))}
      </View>
    </View>
  );
}

