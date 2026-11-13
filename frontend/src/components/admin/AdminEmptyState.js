import React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/text';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import Icon from '../ui/Icon';

/**
 * Reusable Empty / Not Found State Card for Admin screens and tabs
 */
export default function AdminEmptyState({
  icon = 'people',
  iconSize = 36,
  iconColor = '#94a3b8',
  title = 'No Records Found',
  description,
  actionLabel,
  onAction,
  className = '',
  buttonClassName = 'mt-3.5 bg-primary rounded-xl',
  children,
}) {
  return (
    <Card className={`p-8 items-center justify-center text-center border-dashed ${className}`}>
      {typeof icon === 'string' ? (
        <Icon name={icon} size={iconSize} color={iconColor} />
      ) : (
        icon
      )}

      {title ? (
        <Text className="text-sm font-bold text-foreground mt-2.5 text-center">
          {title}
        </Text>
      ) : null}

      {description ? (
        <Text className="text-xs text-muted-foreground text-center mt-1 max-w-xs">
          {description}
        </Text>
      ) : null}

      {actionLabel && onAction ? (
        <Button
          size="sm"
          onPress={onAction}
          className={buttonClassName}
        >
          <Text className="text-primary-foreground text-xs font-semibold">
            {actionLabel}
          </Text>
        </Button>
      ) : null}

      {children}
    </Card>
  );
}
