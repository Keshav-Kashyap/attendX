import React, { useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../../ui/text';
import { Badge } from '../../ui/badge';
import Icon from '../../ui/Icon';

export default function AttendanceHistoryList({ sessions = [], onSelectSession }) {
  // De-duplicate sessions by id or session_code
  const uniqueSessions = useMemo(() => {
    if (!Array.isArray(sessions)) return [];
    const seen = new Set();
    return sessions.filter((s) => {
      const key = s?.id || s?.session_code || s?.session_id;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [sessions]);

  if (!uniqueSessions || uniqueSessions.length === 0) {
    return (
      <View className="bg-card border border-border/80 rounded-2xl p-5 items-center mb-6">
        <Icon name="clipboard" size={24} color="#94a3b8" />
        <Text className="text-xs font-semibold text-muted-foreground mt-2">
          No past attendance sessions recorded yet
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-2.5">
        <Text className="text-sm font-semibold text-foreground">
          Recent Attendance Sessions
        </Text>
        <Text className="text-xs text-muted-foreground">
          {uniqueSessions.length} Recorded
        </Text>
      </View>

      <View className="gap-2.5">
        {uniqueSessions.slice(0, 10).map((item, idx) => {
          const rawDate = item.date || item.created_at;
          const dateStr = rawDate
            ? new Date(rawDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Recent Session';

          return (
            <TouchableOpacity
              key={item.id || item.session_code || idx}
              activeOpacity={0.8}
              onPress={() => onSelectSession && onSelectSession(item)}
              className="p-3.5 bg-card border border-border/80 rounded-2xl flex-row items-center justify-between shadow-sm"
            >
              <View className="flex-1 mr-2">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Badge variant="outline" className="px-1.5 py-0 bg-primary/10 border-primary/20">
                    <Text className="text-[10px] font-bold text-primary">
                      {item.session_code || `ATT-00${item.id || idx + 1}`}
                    </Text>
                  </Badge>
                  <Text className="text-[11px] text-muted-foreground font-medium">
                    {dateStr}
                  </Text>
                </View>

                <Text className="text-xs font-semibold text-foreground" numberOfLines={1}>
                  {item.subject || item.subject_name || 'Classroom Lecture'}
                </Text>
                <Text className="text-[10px] text-muted-foreground mt-0.5">
                  {item.course || item.course_code || 'MCAINT'} • {item.room || 'Block B, Hall 3'} • {item.photos_count || 1} photo(s)
                </Text>
              </View>

              <View className="items-end">
                <Badge variant="success" className="px-2 py-0.5 mb-1">
                  <Text className="text-[10px] font-bold">
                    {item.total_present ?? item.total_detected ?? 0} Present
                  </Text>
                </Badge>
                <Text className="text-[10px] text-muted-foreground">
                  {item.total_absent ?? 0} Absent
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
