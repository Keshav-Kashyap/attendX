import React, { useState } from 'react';
import { View, Switch } from 'react-native';
import { Text } from '../../ui/text';
import { Clock, CheckCircle2, AlertTriangle, ClipboardList } from 'lucide-react-native';

export default function TabNotifications() {
  const [classReminders, setClassReminders] = useState(true);
  const [scanAlerts, setScanAlerts] = useState(true);
  const [absenteeAlerts, setAbsenteeAlerts] = useState(true);
  const [dailySummary, setDailySummary] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleToggle = (setter, val) => {
    setter(val);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  const notificationItems = [
    {
      title: 'Upcoming Class Reminders',
      desc: 'Receive alerts 15 minutes before your scheduled lecture starts.',
      value: classReminders,
      toggle: (val) => handleToggle(setClassReminders, val),
      IconComp: Clock,
    },
    {
      title: 'AI Scan Processed Alerts',
      desc: 'Confirmation when classroom face recognition completes and records are ready.',
      value: scanAlerts,
      toggle: (val) => handleToggle(setScanAlerts, val),
      IconComp: CheckCircle2,
    },
    {
      title: 'Low Attendance Student Alerts',
      desc: 'Notify when a student drops below 75% attendance threshold.',
      value: absenteeAlerts,
      toggle: (val) => handleToggle(setAbsenteeAlerts, val),
      IconComp: AlertTriangle,
    },
    {
      title: 'Daily Attendance Digest',
      desc: 'Evening summary report of all sessions and absentees for the day.',
      value: dailySummary,
      toggle: (val) => handleToggle(setDailySummary, val),
      IconComp: ClipboardList,
    },
  ];

  return (
    <View className="gap-3">
      {savedNotice ? (
        <View className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <Text className="text-xs text-emerald-500 font-semibold text-center">
            Preferences automatically saved.
          </Text>
        </View>
      ) : null}

      {notificationItems.map((item, idx) => {
        const IconComponent = item.IconComp;
        return (
          <View
            key={idx}
            className="p-3.5 bg-card border border-border/80 rounded-2xl flex-row items-center justify-between"
          >
            <View className="flex-1 mr-3">
              <View className="flex-row items-center gap-1.5 mb-1">
                <IconComponent size={16} color="#0284c7" />
                <Text className="text-xs font-bold text-foreground">{item.title}</Text>
              </View>
              <Text className="text-[11px] text-muted-foreground leading-snug">
                {item.desc}
              </Text>
            </View>

            <Switch
              value={item.value}
              onValueChange={item.toggle}
              trackColor={{ false: '#334155', true: '#0284c7' }}
              thumbColor={item.value ? '#ffffff' : '#94a3b8'}
            />
          </View>
        );
      })}
    </View>
  );
}
