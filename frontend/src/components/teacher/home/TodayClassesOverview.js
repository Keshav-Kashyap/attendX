import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../../ui/text';
import StatCard from '../../StatCard';
import { Skeleton } from '../../ui/Skeleton';
import { AlertTriangle, RefreshCw, BookOpen, PieChart, Shield } from 'lucide-react-native';

export default function TodayClassesOverview({
  totalClasses = 0,
  completedAttendance = 0,
  avgRate = 0,
  totalSessions = 0,
  auditsCount = 0,
  auditNote = '',
  isLoading = false,
  isError = false,
  error = null,
  onRetry = null,
  onNavigateTab = null,
}) {
  if (isError) {
    return (
      <View className="mb-5 p-4 rounded-2xl bg-red-500/10 border border-red-500/25">
        <View className="flex-row items-center gap-2.5 mb-2">
          <View className="w-8 h-8 rounded-full bg-red-500/15 items-center justify-center">
            <AlertTriangle size={18} color="#ef4444" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-red-500">
              Failed to load overview data
            </Text>
            <Text className="text-[11px] text-muted-foreground mt-0.5">
              {error?.message || 'Could not connect to the API server.'}
            </Text>
          </View>
        </View>

        {onRetry && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onRetry}
            className="flex-row items-center justify-center gap-1.5 py-2 px-3.5 bg-red-500 rounded-xl self-start mt-1"
          >
            <RefreshCw size={14} color="#ffffff" />
            <Text className="text-[11px] font-bold text-white">
              Retry
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-row gap-2.5 mb-5">
        {[1, 2, 3].map((key) => (
          <View
            key={key}
            className="flex-1 bg-card rounded-2xl border border-border/80 p-3.5 shadow-sm gap-2"
          >
            <View className="flex-row justify-between items-center">
              <Skeleton width={48} height={12} borderRadius={4} />
              <Skeleton width={16} height={16} borderRadius={4} />
            </View>
            <Skeleton width={56} height={24} borderRadius={6} />
            <Skeleton width="100%" height={4} borderRadius={2} />
            <Skeleton width={64} height={10} borderRadius={4} />
          </View>
        ))}
      </View>
    );
  }

  const classesLeft = Math.max(0, totalClasses - completedAttendance);
  const lectureProgress = totalClasses > 0
    ? Math.min(100, Math.round((completedAttendance / totalClasses) * 100))
    : 0;
  const rateProgress = Math.min(100, Math.max(0, Number(avgRate) || 0));
  const auditProgress = auditsCount > 0 ? Math.min(100, auditsCount * 33) : 5;

  const cardShadow = {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  };

  return (
    <View className="flex-row gap-3 mb-5">
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onNavigateTab ? () => onNavigateTab('classes') : undefined}
        style={cardShadow}
        className="flex-1 bg-white border border-slate-100 rounded-[22px] p-4 justify-between"
      >
        <View className="w-10 h-10 rounded-xl bg-[#EEF2FF] items-center justify-center mb-3">
          <BookOpen size={19} color="#3446D4" />
        </View>
        <Text className="text-[24px] font-semibold text-slate-900 tracking-tight leading-tight">
          {completedAttendance}/{totalClasses}
        </Text>
        <Text className="text-[13px] font-normal text-slate-500 mt-0.5">
          Lectures · {totalClasses === 0 ? 'No classes' : classesLeft === 0 ? 'All done' : `${classesLeft} left`}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.82}
        onPress={onNavigateTab ? () => onNavigateTab('reports') : undefined}
        style={cardShadow}
        className="flex-1 bg-white border border-slate-100 rounded-[22px] p-4 justify-between"
      >
        <View className="w-10 h-10 rounded-xl bg-[#EDE9FE] items-center justify-center mb-3">
          <PieChart size={19} color="#7C3AED" />
        </View>
        <Text className="text-[24px] font-semibold text-slate-900 tracking-tight leading-tight">
          {avgRate > 0 ? `${avgRate}%` : '0%'}
        </Text>
        <Text className="text-[13px] font-normal text-slate-500 mt-0.5">
          Avg. Rate · {totalSessions > 0 ? `${totalSessions} sessions` : 'No sessions'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
