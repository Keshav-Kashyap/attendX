import React from 'react';
import { View, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from '../../ui/text';
import { Search } from 'lucide-react-native';

export default function StudentSearchBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  totalCount = 0,
}) {
  const filters = [
    { id: 'all', label: `All (${totalCount})` },
    { id: 'good', label: 'Good (≥75%)' },
    { id: 'warning', label: 'Warning (65-74%)' },
    { id: 'critical', label: 'Critical (<65%)' },
  ];

  return (
    <View className="mb-4">
      {/* Search Input Box */}
      <View className="bg-card border border-border/80 rounded-2xl px-3.5 py-2.5 flex-row items-center gap-2 shadow-sm mb-3">
        <Search size={16} color="#94a3b8" />
        <TextInput
          value={searchQuery}
          onChangeText={onSearchChange}
          placeholder="Search by student name or roll number..."
          placeholderTextColor="#94a3b8"
          className="flex-1 text-foreground text-xs font-medium p-0"
        />
        {searchQuery ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onSearchChange('')}
            className="w-5 h-5 rounded-full bg-muted/80 items-center justify-center"
          >
            <Text className="text-foreground text-[10px] font-bold">✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Chips Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
        {filters.map((f) => {
          const isSelected = statusFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              activeOpacity={0.75}
              onPress={() => onStatusFilterChange(f.id)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isSelected ? '#0284c7' : '#e2e8f0',
                backgroundColor: isSelected ? '#0284c7' : '#ffffff',
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: isSelected ? '#ffffff' : '#64748b',
                }}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
