import * as React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { cn } from '../../lib/utils';
import { Text } from './text';
import Icon from './Icon';

const AlertDialog = ({ visible, onClose, children }) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 items-center justify-center p-5">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {children}
      </View>
    </Modal>
  );
};

const AlertDialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <View
    ref={ref}
    className={cn(
      'w-full max-w-sm rounded-2xl bg-card p-6 border border-border shadow-2xl z-10',
      className
    )}
    {...props}
  >
    {children}
  </View>
));
AlertDialogContent.displayName = 'AlertDialogContent';

const AlertDialogHeader = ({ className, ...props }) => (
  <View className={cn('flex flex-col space-y-2 pb-4', className)} {...props} />
);

const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn('text-lg font-bold text-foreground text-center', className)}
    {...props}
  />
));
AlertDialogTitle.displayName = 'AlertDialogTitle';

const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn('text-xs text-muted-foreground text-center mt-1 leading-5', className)}
    {...props}
  />
));
AlertDialogDescription.displayName = 'AlertDialogDescription';

const AlertDialogFooter = ({ className, ...props }) => (
  <View className={cn('flex flex-row gap-2.5 pt-2', className)} {...props} />
);

/**
 * High-level React Native Reusable Confirmation Modal
 * Replaces generic OS Alert.alert with a clean, branded dialog.
 */
export function ConfirmDialog({
  visible,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'destructive',
  icon = 'warning',
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!visible) return null;

  const isDestructive = variant === 'destructive';

  return (
    <AlertDialog visible={visible} onClose={loading ? undefined : onCancel}>
      <AlertDialogContent>
        {/* Visual Icon Badge */}
        <View className="items-center mb-3">
          <View
            className={cn(
              'w-12 h-12 rounded-full items-center justify-center border',
              isDestructive
                ? 'bg-destructive/10 border-destructive/20'
                : 'bg-primary/10 border-primary/20'
            )}
          >
            <Icon
              name={icon}
              size={24}
              color={isDestructive ? '#ef4444' : '#0284c7'}
            />
          </View>
        </View>

        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>

        <AlertDialogFooter>
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={loading}
            onPress={onCancel}
            className="flex-1 h-11 rounded-xl border border-input bg-card items-center justify-center"
          >
            <Text className="text-sm font-semibold text-foreground">{cancelText}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            disabled={loading}
            onPress={onConfirm}
            className={cn(
              'flex-1 h-11 rounded-xl items-center justify-center',
              isDestructive ? 'bg-destructive' : 'bg-primary',
              loading && 'opacity-60'
            )}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-sm font-bold text-white">{confirmText}</Text>
            )}
          </TouchableOpacity>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
};
