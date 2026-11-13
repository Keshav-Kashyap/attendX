import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Stop } from 'react-native-svg';
import { Text } from '../ui/text';
import {
  BadgeCheck,
  TrendingUp,
  TrendingDown,
  Clock,
} from 'lucide-react-native';

export default function StudentAttendanceProgress({ summary, onViewDetails }) {
  const totalClasses = summary?.total_classes ?? 0;
  const attendedClasses = summary?.attended_classes ?? 0;
  const rawPercentage = summary?.attendance_percentage ?? (
    totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100 * 10) / 10 : 0
  );
  const percentage = Number.isFinite(Number(rawPercentage)) ? Number(rawPercentage) : 0;

  const isSafe = percentage >= 75.0;
  const hasClasses = totalClasses > 0;
  const semesterLabel = summary?.semester || summary?.course_code || 'Current Semester';

  // Circular progress dimensions (96px matches w-24 h-24)
  const size = 96;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedProgress = Math.min(Math.max(percentage, 0), 100);
  const strokeDashoffset = circumference - (circumference * normalizedProgress) / 100;

  const classesBuffer = hasClasses && isSafe
    ? Math.max(0, Math.floor(attendedClasses / 0.75 - totalClasses))
    : 0;
  const classesNeeded = hasClasses && !isSafe
    ? Math.max(1, Math.ceil((0.75 * totalClasses - attendedClasses) / 0.25))
    : 0;
  const thresholdDelta = Math.round((percentage - 75) * 10) / 10;

  let statusConfig = {
    pillBgClass: 'bg-emerald-200/80',
    pillDotClass: 'bg-emerald-900',
    pillTextClass: 'text-emerald-950',
    pillLabel: 'Min 75% Met',
    ringLabel: 'SECURE',
    ringLabelClass: 'text-teal-700',
    gradStart: '#0D5C63',
    gradEnd: '#3B28CC',
    accentTextClass: 'text-[#3B28CC]',
    subtitleText: 'Threshold requirement satisfied',
    trendBgClass: 'bg-emerald-100/80',
    trendTextClass: 'text-emerald-800',
    trendIconColor: '#047857',
    trendBadgeText: `+${Math.abs(thresholdDelta)}%`,
    trendCaption: 'above 75% min',
    thirdColLabel: 'Can Miss',
    thirdColValue: `${classesBuffer} left`,
    thirdColClass: 'text-teal-700',
  };

  if (!hasClasses) {
    statusConfig = {
      pillBgClass: 'bg-slate-100',
      pillDotClass: 'bg-slate-500',
      pillTextClass: 'text-slate-600',
      pillLabel: 'No Classes Yet',
      ringLabel: 'PENDING',
      ringLabelClass: 'text-slate-500',
      gradStart: '#94A3B8',
      gradEnd: '#CBD5E1',
      accentTextClass: 'text-slate-500',
      subtitleText: 'No attendance recorded yet',
      trendBgClass: 'bg-slate-100',
      trendTextClass: 'text-slate-600',
      trendIconColor: '#64748B',
      trendBadgeText: '0%',
      trendCaption: 'awaiting sessions',
      thirdColLabel: 'Can Miss',
      thirdColValue: '0 left',
      thirdColClass: 'text-slate-500',
    };
  } else if (!isSafe) {
    const isCritical = percentage < 60;
    statusConfig = {
      pillBgClass: isCritical ? 'bg-red-100' : 'bg-amber-100',
      pillDotClass: isCritical ? 'bg-red-700' : 'bg-amber-700',
      pillTextClass: isCritical ? 'text-red-900' : 'text-amber-900',
      pillLabel: isCritical ? 'Critical (< 60%)' : 'Below 75%',
      ringLabel: isCritical ? 'CRITICAL' : 'AT RISK',
      ringLabelClass: isCritical ? 'text-red-600' : 'text-amber-600',
      gradStart: isCritical ? '#DC2626' : '#D97706',
      gradEnd: isCritical ? '#EF4444' : '#F59E0B',
      accentTextClass: isCritical ? 'text-red-600' : 'text-amber-600',
      subtitleText: 'Threshold requirement not met',
      trendBgClass: isCritical ? 'bg-red-100/80' : 'bg-amber-100/80',
      trendTextClass: isCritical ? 'text-red-700' : 'text-amber-800',
      trendIconColor: isCritical ? '#DC2626' : '#B45309',
      trendBadgeText: `${thresholdDelta}%`,
      trendCaption: 'below 75% min',
      thirdColLabel: 'Need',
      thirdColValue: `${classesNeeded} more`,
      thirdColClass: isCritical ? 'text-red-600' : 'text-amber-600',
    };
  }

  const statColumns = [
    { key: 'held', label: 'Classes Held', value: totalClasses, valueClass: 'text-slate-900', hasBorder: true },
    { key: 'attended', label: 'Attended', value: attendedClasses, valueClass: 'text-[#3B28CC]', hasBorder: true },
    { key: 'margin', label: statusConfig.thirdColLabel, value: statusConfig.thirdColValue, valueClass: statusConfig.thirdColClass, hasBorder: false },
  ];

  const CardWrapper = onViewDetails ? TouchableOpacity : View;

  return (
    <CardWrapper
      {...(onViewDetails ? { activeOpacity: 0.85, onPress: onViewDetails } : {})}
      className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm mb-5"
    >
      {/* Top Header Row: Semester Badge & Threshold Pill */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center flex-1 mr-3">
          <View className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100/70 items-center justify-center mr-2.5">
            <BadgeCheck size={17} color="#3B28CC" />
          </View>
          <Text className="text-base font-medium text-slate-900 flex-1" numberOfLines={1}>
            {semesterLabel}
          </Text>
        </View>

        <View className={`flex-row items-center gap-1.5 px-3 py-1 rounded-full ${statusConfig.pillBgClass}`}>
          <View className={`w-1.5 h-1.5 rounded-full ${statusConfig.pillDotClass}`} />
          <Text className={`text-[11px] font-medium ${statusConfig.pillTextClass}`}>
            {statusConfig.pillLabel}
          </Text>
        </View>
      </View>

      {/* Middle Section: Circular Progress Ring on Left, Summary Readout on Right */}
      <View className="flex-row items-center gap-4 mb-5">
        <View className="w-24 h-24 items-center justify-center relative">
          <Svg width={size} height={size}>
            <Defs>
              <LinearGradient id="attendanceRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={statusConfig.gradStart} />
                <Stop offset="100%" stopColor={statusConfig.gradEnd} />
              </LinearGradient>
            </Defs>
            <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#EAECF0"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={hasClasses ? 'url(#attendanceRingGrad)' : '#CBD5E1'}
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={hasClasses ? strokeDashoffset : circumference}
                strokeLinecap="round"
                fill="none"
              />
            </G>
          </Svg>

          <View className="absolute inset-0 items-center justify-center">
            <Text className={`text-2xl font-medium tracking-tight ${statusConfig.accentTextClass}`}>
              {hasClasses ? Math.round(percentage) : 0}
              <Text className={`text-xs font-medium ${statusConfig.accentTextClass}`}>%</Text>
            </Text>
            <Text className={`text-[10px] font-medium tracking-wider mt-0.5 ${statusConfig.ringLabelClass}`}>
              {statusConfig.ringLabel}
            </Text>
          </View>
        </View>

        <View className="flex-1">
          <Text className="text-base font-medium text-slate-900">
            Overall Attendance
          </Text>
          <Text className="text-xs font-medium text-slate-500 mt-0.5 mb-2.5" numberOfLines={1}>
            {statusConfig.subtitleText}
          </Text>

          <View className="flex-row items-center gap-2 flex-wrap">
            <View className={`flex-row items-center gap-1 px-2.5 py-1 rounded-full ${statusConfig.trendBgClass}`}>
              {!hasClasses ? (
                <Clock size={12} color={statusConfig.trendIconColor} />
              ) : isSafe ? (
                <TrendingUp size={12} color={statusConfig.trendIconColor} />
              ) : (
                <TrendingDown size={12} color={statusConfig.trendIconColor} />
              )}
              <Text className={`text-xs font-medium ${statusConfig.trendTextClass}`}>
                {statusConfig.trendBadgeText}
              </Text>
            </View>
            <Text className="text-xs font-medium text-slate-500">
              {statusConfig.trendCaption}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom 3-Column Metrics Strip */}
      <View className="bg-slate-100/80 rounded-2xl py-3 px-2 flex-row items-center">
        {statColumns.map((col) => (
          <View
            key={col.key}
            className={`flex-1 items-center ${col.hasBorder ? 'border-r border-slate-200/80' : ''}`}
          >
            <Text className="text-[11px] font-medium text-slate-500">
              {col.label}
            </Text>
            <Text className={`text-base font-medium mt-0.5 ${col.valueClass}`}>
              {col.value}
            </Text>
          </View>
        ))}
      </View>
    </CardWrapper>
  );
}

