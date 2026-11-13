import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../../ui/text';
import { Badge } from '../../ui/badge';

export default function AttendanceTrendsChart({ dailyTrends = [] }) {
  const [period, setPeriod] = useState('daily'); // 'daily' | 'monthly'

  const dataDaily = dailyTrends && dailyTrends.length > 0 ? dailyTrends : [
    { date: 'Mon', rate: 93, present: 41, absent: 3 },
    { date: 'Tue', rate: 87, present: 39, absent: 5 },
    { date: 'Wed', rate: 82, present: 35, absent: 7 },
    { date: 'Thu', rate: 91, present: 40, absent: 4 },
    { date: 'Fri', rate: 88, present: 38, absent: 6 },
  ];

  const dataMonthly = [
    { date: 'Jul', rate: 92, present: 42, absent: 3 },
    { date: 'Aug', rate: 89, present: 40, absent: 5 },
    { date: 'Sep', rate: 85, present: 38, absent: 7 },
    { date: 'Oct', rate: 90, present: 41, absent: 4 },
  ];

  const currentDataset = period === 'daily' ? dataDaily : dataMonthly;

  return (
    <View className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm mb-5">
      {/* Header & Toggle */}
      <View className="flex-row items-center justify-between pb-3 border-b border-border/60 mb-4">
        <View>
          <Text className="text-sm font-medium text-foreground">
            Attendance Rate Trends
          </Text>
          <Text className="text-[11px] text-muted-foreground mt-0.5">
            Classroom presence metrics over time
          </Text>
        </View>

        <View className="flex-row bg-muted/60 p-0.5 rounded-xl border border-border">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPeriod('daily')}
            className={`px-2.5 py-1 rounded-lg ${period === 'daily' ? 'bg-primary' : ''}`}
          >
            <Text
              className={`text-[10px] font-bold ${period === 'daily' ? 'text-white' : 'text-muted-foreground'
                }`}
            >
              Daily
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setPeriod('monthly')}
            className={`px-2.5 py-1 rounded-lg ${period === 'monthly' ? 'bg-primary' : ''}`}
          >
            <Text
              className={`text-[10px] font-bold ${period === 'monthly' ? 'text-white' : 'text-muted-foreground'
                }`}
            >
              Monthly
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Visual Chart Bars */}
      <View className="flex-row items-end justify-between h-36 pt-4 pb-2 px-1">
        {currentDataset.map((item, idx) => {
          const heightPct = Math.max(item.rate, 20);
          return (
            <View key={idx} className="items-center flex-1">
              {/* Rate percentage on top */}
              <Text className="text-[10px] font-bold text-foreground mb-1">
                {item.rate}%
              </Text>

              {/* Bar Container */}
              <View className="w-8 h-24 bg-muted/50 rounded-xl justify-end overflow-hidden p-0.5">
                <View
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-lg ${item.rate >= 90
                      ? 'bg-emerald-500'
                      : item.rate >= 80
                        ? 'bg-primary'
                        : 'bg-amber-500'
                    }`}
                />
              </View>

              {/* Label below bar */}
              <Text className="text-[10px] font-semibold text-muted-foreground mt-2">
                {item.date}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
