import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from './ui/text';
import Icon from './ui/Icon';

/**
 * Reusable StatCard Component
 * Suitable for Admin, Teacher, Student dashboards and overview screens.
 *
 * Props:
 * - title: string - Label displayed in top header (e.g. 'Courses', 'Faculty')
 * - value: string | number - Main metric to display
 * - icon: string | React component / element - Icon name (from Icon.js) or Lucide component
 * - iconColor: string - Color hex code for the icon
 * - iconSize: number - Size of the icon (default 16)
 * - actionText: string - Optional highlight/action text at the bottom (e.g. 'Manage Faculty >')
 * - description: string - Optional subtitle/description text
 * - loading: boolean - Whether data is loading
 * - onPress: () => void - Optional click handler (makes card interactive)
 * - className: string - Tailwind CSS classes for the card container
 * - valueClassName: string - Tailwind CSS classes for the value text
 * - style: object - React Native style object
 * - children: React.ReactNode - Any custom additional elements inside the card
 */
export default function StatCard({
  title,
  value,
  icon,
  iconColor = '#0284c7',
  iconSize = 16,
  actionText,
  description,
  loading = false,
  onPress,
  className = 'flex-1 min-w-[45%] bg-card p-3 rounded-xl border border-border/70 shadow-sm',
  valueClassName = 'text-xl font-bold text-foreground',
  style,
  children,
}) {
  const Container = onPress ? TouchableOpacity : View;
  const containerProps = onPress
    ? { activeOpacity: 0.7, onPress, className, style }
    : { className, style };

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return <Icon name={icon} size={iconSize} color={iconColor} />;
    }
    if (React.isValidElement(icon)) {
      return icon;
    }
    if (typeof icon === 'function') {
      const IconComp = icon;
      return <IconComp size={iconSize} color={iconColor} />;
    }
    return null;
  };

  return (
    <Container {...containerProps}>
      <View className="flex-row items-center justify-between mb-1">
        <Text numberOfLines={1} className="text-xs text-muted-foreground font-medium flex-1 mr-1">{title}</Text>
        {renderIcon()}
      </View>

      <Text numberOfLines={1} className={valueClassName}>
        {loading ? '...' : (value ?? 0)}
      </Text>

      {actionText ? (
        <Text numberOfLines={1} className="text-[10px] text-primary font-semibold mt-0.5">{actionText}</Text>
      ) : null}

      {description ? (
        <Text numberOfLines={1} className="text-[10px] text-muted-foreground mt-0.5">{description}</Text>
      ) : null}

      {children}
    </Container>
  );
}

export { StatCard, StatCard as StatsCard };
