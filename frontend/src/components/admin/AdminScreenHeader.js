import React, { useMemo } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Search, X, Plus } from 'lucide-react-native';
import { Text } from '../ui/text';
import { Badge } from '../ui/badge';

export default function AdminScreenHeader({
  title,
  subtitle,
  badgeText,
  searchQuery = '',
  setSearchQuery,
  searchPlaceholder = 'Search...',
  filterOptions = [],
  selectedFilter = 'all',
  onSelectFilter,
  allFilterLabel = 'All',
  className = '',
  onAddPress,
  addBtnText = '+ Add',
}) {
  const isAllSelected = !selectedFilter || selectedFilter === 'all';

  const normalizedOptions = useMemo(() => {
    return (filterOptions || []).map((item, index) => {
      if (typeof item === 'string') {
        return {
          key: `${item}-${index}`,
          value: item,
          label: item,
        };
      }
      const val =
        item.value !== undefined
          ? item.value
          : item.code !== undefined
            ? item.code
            : item.id !== undefined
              ? item.id
              : item.name;
      const lbl = item.label || item.code || item.name || String(val);
      return {
        key: String(item.key || item.id || `${val}-${index}`),
        value: val,
        label: item.count !== undefined ? `${lbl} (${item.count})` : lbl,
        raw: item,
      };
    });
  }, [filterOptions]);

  const isSelected = (optValue) => {
    if (selectedFilter === optValue) return true;
    if (
      typeof selectedFilter === 'string' &&
      typeof optValue === 'string' &&
      selectedFilter.toLowerCase() === optValue.toLowerCase()
    ) {
      return true;
    }
    return String(selectedFilter) === String(optValue);
  };

  return (
    <View className={className}>
      {/* Screen Title & Subtitle */}
      {title ? (
        <View className="mb-4">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-2xl font-medium text-foreground">{title}</Text>
            {badgeText ? (
              <Badge variant="secondary" className="px-2.5 py-0.5 rounded-full bg-muted/60">
                <Text className="text-[11px] font-bold text-muted-foreground">
                  {badgeText}
                </Text>
              </Badge>
            ) : null}
          </View>
          {subtitle ? (
            <Text className="text-xs text-muted-foreground">{subtitle}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Search Bar & Add Button */}
      {setSearchQuery ? (
        <View className="flex-row items-center gap-2.5 mb-3">
          {/* Compact Search Bar */}
          <View className="flex-1 flex-row items-center bg-card border border-border/80 rounded-2xl px-3 h-11 shadow-xs">
            <Search size={15} color="#94a3b8" />
            <TextInput
              className="flex-1 ml-2 text-xs text-foreground p-0"
              placeholder={searchPlaceholder}
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="p-1"
              >
                <X size={14} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Larger Prominent Add Button with Real Vector Plus Icon */}
          {onAddPress ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onAddPress}
              className="flex-row items-center justify-center bg-blue-600 px-4.5 h-11 min-w-[115px] rounded-2xl shadow-sm gap-1.5"
            >
              <Plus size={18} strokeWidth={2.8} color="#ffffff" />
              <Text className="text-white text-sm font-bold tracking-tight">
                {typeof addBtnText === 'string'
                  ? addBtnText.replace(/^\+\s*/, '')
                  : addBtnText}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {/* Filter Pills (Horizontal Scroll) */}
      {onSelectFilter ? (
        <View className="mb-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            className="flex-row gap-2 py-0.5"
          >
            {/* All Pill */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onSelectFilter('all')}
              className={`px-4 py-1.5 rounded-full border ${isAllSelected
                  ? 'bg-blue-600 border-blue-600 shadow-sm'
                  : 'bg-card border-border'
                }`}
            >
              <Text
                className={`text-xs font-bold ${isAllSelected ? 'text-white' : 'text-foreground'
                  }`}
              >
                {allFilterLabel}
              </Text>
            </TouchableOpacity>

            {/* Dynamic Filter Pills */}
            {normalizedOptions.map((opt) => {
              const active = isSelected(opt.value);
              return (
                <TouchableOpacity
                  key={opt.key}
                  activeOpacity={0.7}
                  onPress={() => onSelectFilter(active ? 'all' : opt.value)}
                  className={`px-4 py-1.5 rounded-full border ${active
                      ? 'bg-blue-600 border-blue-600 shadow-sm'
                      : 'bg-card border-border'
                    }`}
                >
                  <Text
                    className={`text-xs font-bold ${active ? 'text-white' : 'text-foreground'
                      }`}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
