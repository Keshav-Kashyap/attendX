import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../ui/text';
import Icon from '../ui/Icon';

export default function AdminStatMetricCard({
  title,
  value,
  icon,
  iconBg = 'bg-indigo-50',
  iconColor = '#3446D4',
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={onPress}
      style={{
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
      }}
      className="flex-1 bg-white rounded-[22px] p-4 border border-slate-100 justify-between"
    >
      <View className={`w-10 h-10 rounded-xl ${iconBg} items-center justify-center mb-3`}>
        <Icon name={icon} size={20} color={iconColor} />
      </View>

      <Text className="text-[24px] font-semibold text-slate-900 tracking-tight leading-tight">
        {value ?? 0}
      </Text>

      <Text className="text-[13px] font-normal text-slate-500 mt-0.5">
        {title}
      </Text>
    </TouchableOpacity>
  );
}
