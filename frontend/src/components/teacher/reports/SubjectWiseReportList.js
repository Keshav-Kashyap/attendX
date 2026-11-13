import React from 'react';
import { View } from 'react-native';
import { Text } from '../../ui/text';
import { Badge } from '../../ui/badge';

export default function SubjectWiseReportList({ subjectReports = [] }) {
  const list = subjectReports && subjectReports.length > 0 ? subjectReports : [
    { subject: 'Computer Vision', code: 'CS-401', course: 'Integrated MCA', sessions_count: 14, attendance_rate: 92, enrolled_count: 42 },
    { subject: 'Machine Learning', code: 'CS-402', course: 'Integrated MCA', sessions_count: 12, attendance_rate: 86, enrolled_count: 40 },
    { subject: 'Cloud Computing & DevOps', code: 'CS-403', course: 'Integrated MCA', sessions_count: 10, attendance_rate: 81, enrolled_count: 39 },
    { subject: 'Database Management Systems', code: 'BCA-201', course: 'BCA (Hons)', sessions_count: 8, attendance_rate: 88, enrolled_count: 45 },
  ];

  return (
    <View className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm mb-5">
      <View className="flex-row items-center justify-between pb-3 border-b border-border/60 mb-3">
        <View>
          <Text className="text-sm font-medium text-foreground">
            Subject-wise Attendance Reports
          </Text>
          <Text className="text-[11px] text-muted-foreground mt-0.5">
            Module breakdown and engagement rates
          </Text>
        </View>

        <Badge variant="outline" className="px-2 py-0.5 bg-muted/60">
          <Text className="text-[10px] font-bold text-foreground">
            {list.length} Subjects
          </Text>
        </Badge>
      </View>

      <View className="gap-3">
        {list.map((item, idx) => {
          const rate = item.attendance_rate || 85;
          const isHigh = rate >= 88;
          return (
            <View
              key={idx}
              className="p-3.5 bg-muted/30 rounded-xl border border-border/70"
            >
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-1 mr-2">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-xs font-bold text-foreground">
                      {item.subject}
                    </Text>
                    <Badge variant="outline" className="px-1.5 py-0 bg-card">
                      <Text className="text-[9px] font-semibold text-muted-foreground">
                        {item.code}
                      </Text>
                    </Badge>
                  </View>
                  <Text className="text-[11px] text-muted-foreground mt-0.5">
                    {item.course} • {item.sessions_count || 12} Lectures Conducted
                  </Text>
                </View>

                <Badge
                  variant={isHigh ? 'success' : 'default'}
                  className="px-2 py-0.5"
                >
                  <Text className="text-xs font-bold">{rate}%</Text>
                </Badge>
              </View>

              {/* Progress Bar */}
              <View className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                <View
                  style={{ width: `${rate}%` }}
                  className={`h-full rounded-full ${isHigh ? 'bg-emerald-500' : 'bg-primary'}`}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
