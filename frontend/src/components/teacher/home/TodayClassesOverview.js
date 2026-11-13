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

  return (
    <View className="flex-row gap-2.5 mb-5">
      <StatCard
        title="Lectures"
        value={`${completedAttendance}/${totalClasses}`}
        icon={BookOpen}
        iconColor="#0284c7"
        description={
          totalClasses === 0
            ? 'No classes today'
            : classesLeft === 0
            ? 'All done'
            : `${classesLeft} left`
        }
        onPress={onNavigateTab ? () => onNavigateTab('classes') : undefined}
        className="flex-1 bg-card border border-border/80 rounded-2xl p-3.5 shadow-sm justify-between"
        valueClassName="text-xl font-bold text-foreground mt-0.5"
      >
        <View className="h-1 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
          <View
            style={{ width: `${lectureProgress}%`, backgroundColor: '#0284c7' }}
            className="h-full rounded-full"
          />
        </View>
      </StatCard>

      <StatCard
        title="Avg. Rate"
        value={avgRate > 0 ? `${avgRate}%` : '0%'}
        icon={PieChart}
        iconColor="#8b5cf6"
        description={totalSessions > 0 ? `${totalSessions} sessions` : 'No sessions yet'}
        onPress={onNavigateTab ? () => onNavigateTab('reports') : undefined}
        className="flex-1 bg-card border border-border/80 rounded-2xl p-3.5 shadow-sm justify-between"
        valueClassName="text-xl font-bold text-foreground mt-0.5"
      >
        <View className="h-1 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
          <View
            style={{ width: `${rateProgress}%`, backgroundColor: '#8b5cf6' }}
            className="h-full rounded-full"
          />
        </View>
      </StatCard>

      <StatCard
        title="Audits"
        value={auditsCount}
        icon={Shield}
        iconColor="#ef4444"
        description={
          auditNote || (auditsCount > 0 ? `${auditsCount} flagged` : 'All regular')
        }
        onPress={onNavigateTab ? () => onNavigateTab('reports') : undefined}
        className="flex-1 bg-card border border-border/80 rounded-2xl p-3.5 shadow-sm justify-between"
        valueClassName="text-xl font-bold text-foreground mt-0.5"
      >
        <View className="h-1 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
          <View
            style={{ width: `${auditProgress}%`, backgroundColor: '#ef4444' }}
            className="h-full rounded-full"
          />
        </View>
      </StatCard>
    </View>
  );
}
