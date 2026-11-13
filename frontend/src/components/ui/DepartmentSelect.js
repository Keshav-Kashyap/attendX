import React, { useState, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Text } from './text';
import { Badge } from './badge';
import Icon from './Icon';
import KeyboardSafeView from './KeyboardSafeView';

export default function DepartmentSelect({
  value,
  onChange,
  onSelectCourse,
  courses = [],
  isLoading = false,
  label = 'Department',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 100% Dynamic - derived solely from database API courses
  const departmentOptions = useMemo(() => {
    return (courses || []).map((crs) => ({
      id: crs.id,
      name: crs.name,
      code: crs.code,
      subjects_count: crs.subjects_count || (crs.subjects ? crs.subjects.length : 0),
      total_semesters: crs.total_semesters || (crs.semesters ? crs.semesters.length : 0),
      course: crs,
    }));
  }, [courses]);

  // Search filter across database records
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return departmentOptions;
    const q = searchQuery.toLowerCase().trim();
    return departmentOptions.filter(
      (opt) =>
        (opt.name && opt.name.toLowerCase().includes(q)) ||
        (opt.code && opt.code.toLowerCase().includes(q))
    );
  }, [departmentOptions, searchQuery]);

  const handleSelect = (opt) => {
    onChange(opt.name);
    if (onSelectCourse && opt.course) {
      onSelectCourse(opt.course);
    }
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <View className="mb-3">
      {label ? (
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-xs font-semibold text-foreground">{label} *</Text>
          <Text className="text-[10px] text-muted-foreground">
            {departmentOptions.length} Programs from Database
          </Text>
        </View>
      ) : null}

      {/* Dropdown Trigger Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => setIsOpen(true)}
        className="flex-row items-center justify-between bg-muted/40 border border-border rounded-xl px-3 py-2.5"
      >
        <View className="flex-row items-center gap-2 flex-1 mr-2">
          <Icon name="school" size={16} color="#0284c7" />
          <Text
            numberOfLines={1}
            className={`text-xs font-medium ${value ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            {value || 'Select Department from Database...'}
          </Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color="#0284c7" />
        ) : (
          <Icon name="chevron-down" size={16} color="#64748b" />
        )}
      </TouchableOpacity>

      {/* Searchable Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent={true}
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardSafeView className="bg-black/60 justify-center items-center px-4">
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsOpen(false)} />
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-card border border-border rounded-2xl p-4 shadow-xl max-h-[80%] z-10"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-border mb-3">
              <View className="flex-row items-center gap-2">
                <Icon name="school" size={18} color="#0284c7" />
                <Text className="text-sm font-bold text-foreground">
                  Select Department 
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsOpen(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="p-1 rounded-full bg-muted/60"
              >
                <Icon name="close" size={16} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Search Input Bar */}
            <View className="flex-row items-center bg-muted/40 border border-border rounded-xl px-3 py-2 mb-3">
              <Icon name="search" size={15} color="#94a3b8" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search department or course code..."
                placeholderTextColor="#94a3b8"
                autoFocus={true}
                className="flex-1 ml-2 text-xs text-foreground p-0"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="close" size={14} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Department Options List (Direct from API) */}
            <ScrollView
              className="max-h-72"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {isLoading ? (
                <View className="py-6 items-center">
                  <ActivityIndicator size="small" color="#0284c7" />
                  <Text className="text-xs text-muted-foreground mt-2">
                    Loading departments from database...
                  </Text>
                </View>
              ) : filteredOptions.length === 0 ? (
                <View className="py-6 items-center">
                  <Text className="text-xs text-muted-foreground text-center">
                    {searchQuery.trim()
                      ? `No department found in database matching "${searchQuery}".`
                      : 'No departments found in database. Please add courses first.'}
                  </Text>
                </View>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = value?.toLowerCase() === opt.name.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      activeOpacity={0.7}
                      onPress={() => handleSelect(opt)}
                      className={`flex-row items-center justify-between p-3 rounded-xl mb-1.5 border ${
                        isSelected
                          ? 'bg-primary/10 border-primary/40'
                          : 'bg-muted/20 border-transparent hover:bg-muted/40'
                      }`}
                    >
                      <View className="flex-1 mr-2">
                        <View className="flex-row items-center gap-1.5 mb-0.5">
                          <Text
                            className={`text-xs font-bold ${
                              isSelected ? 'text-primary' : 'text-foreground'
                            }`}
                          >
                            {opt.name}
                          </Text>
                          {opt.code ? (
                            <Badge variant="outline" className="py-0 px-1.5 bg-card">
                              <Text className="text-[10px] font-bold">{opt.code}</Text>
                            </Badge>
                          ) : null}
                        </View>
                        <Text className="text-[10px] text-muted-foreground">
                          {opt.total_semesters ? `${opt.total_semesters} Semesters` : ''}
                          {opt.subjects_count ? ` • ${opt.subjects_count} Subjects` : ''}
                        </Text>
                      </View>

                      {isSelected ? (
                        <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                          <Icon name="check" size={12} color="#ffffff" />
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </KeyboardSafeView>
      </Modal>
    </View>
  );
}
