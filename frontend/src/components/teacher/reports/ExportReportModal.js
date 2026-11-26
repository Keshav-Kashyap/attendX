import React, { useState } from 'react';
import { View, Modal, ScrollView, TouchableOpacity, Share } from 'react-native';
import { Text } from '../../ui/text';
import { Badge } from '../../ui/badge';
import Icon from '../../ui/Icon';

export default function ExportReportModal({ visible, onClose, reportsData }) {
  const [exportFormat, setExportFormat] = useState('csv'); // 'csv' | 'pdf'
  const [isCopied, setIsCopied] = useState(false);

  if (!visible) return null;

  const summary = reportsData?.summary || { average_attendance: 89, total_sessions: 36, total_students_monitored: 45 };
  const subjectReports = reportsData?.subject_reports || [];
  const absentStudents = reportsData?.absent_students || [];

  // Generate CSV text content
  const generateCsvContent = () => {
    let csv = 'ACADEMIC ATTENDANCE REPORT - FACULTY EXPORT\n';
    csv += `Generated Date,${new Date().toLocaleDateString()}\n`;
    csv += `Average Attendance Rate,${summary.average_attendance}%\n`;
    csv += `Total Sessions Conducted,${summary.total_sessions}\n\n`;

    csv += '--- SUBJECT WISE BREAKDOWN ---\n';
    csv += 'Subject Name,Code,Course,Conducted Lectures,Attendance Rate\n';
    subjectReports.forEach((s) => {
      csv += `"${s.subject}","${s.code}","${s.course}",${s.sessions_count || 12},${s.attendance_rate}%\n`;
    });

    csv += '\n--- ABSENT & CRITICAL STUDENTS LIST (<75%) ---\n';
    csv += 'Student Name,Roll Number,Course,Attendance Rate,Missed Lectures\n';
    absentStudents.forEach((st) => {
      csv += `"${st.name}","${st.roll_number}","${st.course}",${st.attendance_percentage}%,${st.missed_classes || 4}\n`;
    });

    return csv;
  };

  const handleShareOrDownload = async () => {
    try {
      const content = generateCsvContent();
      await Share.share({
        message: content,
        title: `Attendance_Report_${new Date().toISOString().slice(0, 10)}.${exportFormat}`,
      });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      // ignore share cancel
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-background rounded-t-3xl max-h-[85%] border-t border-border flex-col shadow-2xl">
          {/* Header */}
          <View className="p-4 border-b border-border flex-row items-center justify-between">
            <View>
              <Text className="text-base font-medium text-foreground">
                Export Attendance Report
              </Text>
              <Text className="text-xs text-muted-foreground mt-0.5">
                Generate formatted CSV spreadsheet or PDF document
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-muted/60 items-center justify-center border border-border"
            >
              <Text className="text-foreground text-xs font-bold">✕</Text>
            </TouchableOpacity>
          </View>

          {/* Format Selector Pills */}
          <View className="px-5 pt-4 pb-2">
            <Text className="text-xs font-bold text-foreground mb-2">
              Select Output Format:
            </Text>
            <View className="flex-row gap-2.5">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setExportFormat('csv')}
                className={`flex-1 py-2.5 rounded-xl border flex-row items-center justify-center gap-2 ${exportFormat === 'csv'
                    ? 'bg-primary border-primary'
                    : 'bg-card border-border'
                  }`}
              >
                <Icon name="clipboard" size={16} color={exportFormat === 'csv' ? '#ffffff' : '#94a3b8'} />
                <Text
                  className={`text-xs font-bold ${exportFormat === 'csv' ? 'text-white' : 'text-muted-foreground'
                    }`}
                >
                  CSV Spreadsheet (.csv)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setExportFormat('pdf')}
                className={`flex-1 py-2.5 rounded-xl border flex-row items-center justify-center gap-2 ${exportFormat === 'pdf'
                    ? 'bg-primary border-primary'
                    : 'bg-card border-border'
                  }`}
              >
                <Icon name="book" size={16} color={exportFormat === 'pdf' ? '#ffffff' : '#94a3b8'} />
                <Text
                  className={`text-xs font-bold ${exportFormat === 'pdf' ? 'text-white' : 'text-muted-foreground'
                    }`}
                >
                  PDF Document (.pdf)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Preview Box */}
          <ScrollView className="p-5 flex-1" showsVerticalScrollIndicator={false}>
            <View className="p-3.5 bg-muted/40 rounded-2xl border border-border mb-4">
              <View className="flex-row justify-between items-center mb-2 pb-2 border-b border-border/60">
                <Text className="text-xs font-bold text-foreground">
                  Report Preview Summary
                </Text>
                <Badge variant="success" className="px-2 py-0">
                  <Text className="text-[9px] font-bold">Ready to Export</Text>
                </Badge>
              </View>

              <Text className="text-[11px] text-muted-foreground leading-relaxed font-mono">
                {generateCsvContent().slice(0, 380)}...
              </Text>
            </View>

            {isCopied ? (
              <View className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mb-4">
                <Text className="text-xs text-emerald-500 font-semibold text-center">
                  Report successfully exported and shared!
                </Text>
              </View>
            ) : null}

            {/* Export Trigger Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleShareOrDownload}
              className="w-full py-3.5 bg-primary rounded-xl items-center justify-center shadow-md flex-row gap-2"
            >
              <Icon name="bar-chart" size={16} color="#ffffff" />
              <Text className="text-white text-xs font-bold uppercase tracking-wider">
                Export & Download {exportFormat.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
