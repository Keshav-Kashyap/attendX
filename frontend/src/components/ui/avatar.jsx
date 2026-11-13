import * as React from 'react';
import { View, Image } from 'react-native';
import { cn } from '../../lib/utils';
import { Text } from './text';

const Avatar = React.forwardRef(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn(
      'relative flex h-14 w-14 shrink-0 overflow-hidden rounded-full bg-muted items-center justify-center',
      className
    )}
    {...props}
  />
));
Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef(({ className, ...props }, ref) => (
  <Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
));
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef(({ className, children, ...props }, ref) => (
  <View
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-primary',
      className
    )}
    {...props}
  >
    <Text className="text-primary-foreground font-bold text-base">{children}</Text>
  </View>
));
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarFallback, AvatarImage };
