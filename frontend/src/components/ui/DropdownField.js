import React, { useState, useMemo } from 'react';
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Text } from './text';
import Icon from './Icon';
import KeyboardSafeView from './KeyboardSafeView';

/**
 * Reusable searchable dropdown modal field
 */
export function DropdownField({
  label,
  required = false,
  placeholder = 'Select an option...',
  selectedLabel = '',
  options = [],
  selectedValue,
  onSelect,
  isLoading = false,
  disabled = false,
  iconName = 'chevron-down',
  emptyText = 'No options available.',
  containerClassName = 'mb-3',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter(
      (opt) =>
        (opt.label && opt.label.toLowerCase().includes(q)) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(q))
    );
  }, [options, search]);

  const handleClose = () => {
    setIsOpen(false);
    setSearch('');
  };

  return (
    <View className={containerClassName}>
      {label ? (
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-xs font-medium text-foreground">
            {label}
            {required ? <Text className="text-destructive"> *</Text> : null}
          </Text>
          {options.length > 0 && !disabled ? (
            <Text className="text-[10px] font-medium text-muted-foreground">
              {options.length} {options.length === 1 ? 'Option' : 'Options'}
            </Text>
          ) : null}
        </View>
      ) : null}

      <TouchableOpacity
        activeOpacity={0.75}
        disabled={disabled}
        onPress={() => !disabled && setIsOpen(true)}
        className={`flex-row items-center justify-between rounded-xl px-3.5 py-2.5 border ${
          disabled
            ? 'bg-muted/20 border-border/50 opacity-60'
            : 'bg-card border-border'
        }`}
      >
        <Text
          numberOfLines={1}
          className={`flex-1 mr-2 text-xs font-medium ${
            selectedLabel ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          {selectedLabel || placeholder}
        </Text>
        {isLoading ? (
          <ActivityIndicator size="small" color="#0284c7" />
        ) : (
          <Icon name={iconName} size={16} color="#64748b" />
        )}
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <KeyboardSafeView className="bg-black/60 justify-center items-center px-4">
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card border border-border rounded-2xl p-4 shadow-xl max-h-[75%] z-10"
          >
            <View className="flex-row items-center justify-between pb-3 border-b border-border mb-3">
              <Text className="text-sm font-medium text-foreground">
                {label || 'Select Option'}
              </Text>
              <TouchableOpacity
                onPress={handleClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="p-1 rounded-full bg-muted/60"
              >
                <Icon name="close" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            {options.length > 5 ? (
              <View className="flex-row items-center bg-muted/40 border border-border rounded-xl px-3 py-2 mb-3">
                <Icon name="search" size={15} color="#94a3b8" />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder={`Search ${label ? label.toLowerCase() : 'options'}...`}
                  placeholderTextColor="#94a3b8"
                  className="flex-1 ml-2 text-xs font-medium text-foreground"
                />
              </View>
            ) : null}

            {filteredOptions.length === 0 ? (
              <View className="py-6 items-center">
                <Text className="text-xs font-medium text-muted-foreground text-center">
                  {emptyText}
                </Text>
              </View>
            ) : (
              <ScrollView
                style={{ maxHeight: 320 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View className="gap-1.5">
                  {filteredOptions.map((opt) => {
                    const isSelected = opt.value === selectedValue;
                    return (
                      <TouchableOpacity
                        key={String(opt.value)}
                        activeOpacity={0.75}
                        onPress={() => {
                          onSelect(opt);
                          handleClose();
                        }}
                        className={`flex-row items-center justify-between px-3 py-2.5 rounded-xl border ${
                          isSelected
                            ? 'bg-primary/10 border-primary/40'
                            : 'bg-muted/20 border-border/60'
                        }`}
                      >
                        <View className="flex-1 mr-2">
                          <Text
                            className={`text-xs font-medium ${
                              isSelected ? 'text-primary' : 'text-foreground'
                            }`}
                            numberOfLines={1}
                          >
                            {opt.label}
                          </Text>
                          {opt.subLabel ? (
                            <Text
                              className="text-[11px] font-medium text-muted-foreground mt-0.5"
                              numberOfLines={1}
                            >
                              {opt.subLabel}
                            </Text>
                          ) : null}
                        </View>
                        {isSelected ? (
                          <Icon name="checkmark" size={16} color="#0284c7" />
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </Pressable>
        </KeyboardSafeView>
      </Modal>
    </View>
  );
}

export default DropdownField;

