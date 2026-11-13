import React from 'react';
import { View, TextInput } from 'react-native';
import { Text } from './text';

/**
 * Common labeled text input / custom form field
 */
export function FormField({
  label,
  required = false,
  hint,
  value,
  onChangeText,
  placeholder,
  placeholderTextColor = '#94a3b8',
  keyboardType = 'default',
  autoCapitalize = 'none',
  secureTextEntry = false,
  multiline = false,
  numberOfLines = 1,
  className = '',
  containerClassName = 'mb-3',
  children,
  ...restProps
}) {
  return (
    <View className={containerClassName}>
      {label || hint ? (
        <View className="flex-row items-center justify-between mb-1">
          {label ? (
            <Text className="text-xs font-semibold text-foreground">
              {label} {required ? <Text className="text-destructive">*</Text> : null}
            </Text>
          ) : (
            <View />
          )}
          {typeof hint === 'string' ? (
            <Text className="text-[10px] text-muted-foreground">{hint}</Text>
          ) : (
            hint
          )}
        </View>
      ) : null}

      {children || (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          className={`bg-muted/40 border border-border rounded-xl px-3 py-2 text-xs text-foreground ${className}`}
          {...restProps}
        />
      )}
    </View>
  );
}

export default FormField;

