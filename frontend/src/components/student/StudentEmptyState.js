import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../ui/text';
import { Card } from '../ui/card';

export default function StudentEmptyState({
  icon: IconComponent,
  iconSize = 36,
  iconColor = '#94a3b8',
  title = 'No Data Available',
  description,
  actionLabel,
  onAction,
  className = '',
  children,
}) {
  return (
    <Card className={`p-6 items-center justify-center text-center border-dashed border-border/80 bg-card rounded-2xl ${className}`}>
      {IconComponent && (
        <View className="w-12 h-12 rounded-full bg-muted/60 items-center justify-center mb-2.5">
          <IconComponent size={iconSize} color={iconColor} strokeWidth={1.8} />
        </View>
      )}

      {title ? (
        <Text className="text-sm font-bold text-foreground text-center">
          {title}
        </Text>
      ) : null}

      {description ? (
        <Text className="text-xs text-muted-foreground text-center mt-1 max-w-xs leading-relaxed">
          {description}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAction}
          className="mt-3.5 px-4 py-2 bg-primary rounded-xl"
        >
          <Text className="text-white text-xs font-bold text-center">
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}

      {children}
    </Card>
  );
}

