import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../ui/text';
import Icon from '../ui/Icon';

export default function AdminStatMetricCard({
  title,
  value,
  icon,
  iconBg = 'bg-blue-50',
  iconColor = '#0284c7',
  borderColor = 'border-border/80',
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      className={`flex-1 bg-card rounded-2xl p-4 border ${borderColor} shadow-sm justify-between`}
    >
      <View className="mb-2">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-2xl font-bold text-foreground tracking-tight">
            {value ?? 0}
          </Text>
          <View className={`w-10 h-10 rounded-xl ${iconBg} items-center justify-center`}>
            <Icon name={icon} size={20} color={iconColor} />
          </View>
        </View>

        <Text className="text-xs font-semibold text-muted-foreground">
          {title}
        </Text>
      </View>

     
    </TouchableOpacity>
  );
}
