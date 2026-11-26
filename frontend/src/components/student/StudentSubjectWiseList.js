import React from 'react';
import { View } from 'react-native';
import { Text } from '../ui/text';
import { BookOpen, User, MapPin, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react-native';

export default function StudentSubjectWiseList({ subjects = [] }) {
  if (!subjects || subjects.length === 0) {
    return (
      <View
        style={{
          padding: 24,
          backgroundColor: '#ffffff',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#e2e8f0',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BookOpen size={28} color="#94a3b8" />
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginTop: 8 }}>
          No Subjects Enrolled
        </Text>
        <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2, textAlign: 'center' }}>
          No curriculum subjects are currently linked to your enrolled course.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {subjects.map((sub, idx) => {
        const total = sub.total_classes ?? 0;
        const attended = sub.attended_classes ?? 0;
        const percentage = sub.percentage ?? (total > 0 ? Math.round((attended / total) * 100) : 0);
        const isSafe = percentage >= 75;
        const hasSessions = total > 0;

        let statusBg = '#ecfdf5';
        let statusBorder = '#a7f3d0';
        let statusText = '#059669';
        let barColor = '#10b981';

        if (!hasSessions) {
          statusBg = '#f1f5f9';
          statusBorder = '#e2e8f0';
          statusText = '#64748b';
          barColor = '#94a3b8';
        } else if (!isSafe) {
          if (percentage >= 60) {
            statusBg = '#fffbeb';
            statusBorder = '#fde68a';
            statusText = '#d97706';
            barColor = '#f59e0b';
          } else {
            statusBg = '#fef2f2';
            statusBorder = '#fecaca';
            statusText = '#dc2626';
            barColor = '#ef4444';
          }
        }

        return (
          <View
            key={sub.subject_id || sub.code || idx}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#f1f5f9',
              padding: 13,
              shadowColor: '#0f172a',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            {/* Top row: Subject Code/Name and Percentage Badge */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 6,
              }}
            >
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 14.5,
                    fontWeight: '600',
                    color: '#0f172a',
                  }}
                >
                  {sub.subject_code ? `${sub.subject_code} · ${sub.subject_name}` : sub.subject_name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 3 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <User size={11} color="#64748b" />
                    <Text style={{ fontSize: 11, color: '#64748b' }}>
                      {sub.teacher_name || 'Faculty'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <MapPin size={10} color="#94a3b8" />
                    <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                      {sub.room || 'Room 204'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Percentage Badge */}
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  backgroundColor: statusBg,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: statusBorder,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: statusText,
                  }}
                >
                  {hasSessions ? `${percentage}%` : '0%'}
                </Text>
                <Text
                  style={{
                    fontSize: 9.5,
                    fontWeight: '500',
                    color: statusText,
                    marginTop: -1,
                  }}
                >
                  {hasSessions ? (isSafe ? 'Safe' : 'Low') : 'Pending'}
                </Text>
              </View>
            </View>

            {/* Horizontal Progress Bar */}
            <View
              style={{
                height: 5,
                backgroundColor: '#f1f5f9',
                borderRadius: 3,
                overflow: 'hidden',
                marginVertical: 8,
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${Math.min(Math.max(percentage, 0), 100)}%`,
                  backgroundColor: barColor,
                  borderRadius: 3,
                }}
              />
            </View>

            {/* Bottom info row: Ratio and Status */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 11.5, fontWeight: '400', color: '#64748b' }}>
                <Text style={{ fontWeight: '600', color: '#0f172a' }}>{attended}</Text> of{' '}
                <Text style={{ fontWeight: '600', color: '#0f172a' }}>{total}</Text> lectures attended
              </Text>

              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '500',
                  color: isSafe && hasSessions ? '#059669' : (hasSessions ? '#dc2626' : '#64748b'),
                }}
              >
                {hasSessions
                  ? (isSafe ? 'Eligible for Exams' : 'Attendance Shortage')
                  : 'Classes not commenced'}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

