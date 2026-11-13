import React, { useState, useEffect, useMemo } from 'react';
import { View, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Text } from './text';
import { Badge } from './badge';
import Icon from './Icon';
import { isTimeSlotAvailableForRoom } from '../../utils/scheduleConflict';

const WEEKDAYS = [
  { id: 'Mon', label: 'Mon', full: 'Monday' },
  { id: 'Tue', label: 'Tue', full: 'Tuesday' },
  { id: 'Wed', label: 'Wed', full: 'Wednesday' },
  { id: 'Thu', label: 'Thu', full: 'Thursday' },
  { id: 'Fri', label: 'Fri', full: 'Friday' },
  { id: 'Sat', label: 'Sat', full: 'Saturday' },
];

const PRESET_TIME_SLOTS = [
  '09:00 AM - 10:30 AM',
  '10:15 AM - 11:45 AM',
  '11:45 AM - 01:15 PM',
  '01:45 PM - 03:15 PM',
  '02:00 PM - 03:30 PM',
  '03:30 PM - 05:00 PM',
];

const DAY_PRESETS = [
  { label: 'Mon - Fri', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  { label: 'MWF', days: ['Mon', 'Wed', 'Fri'] },
  { label: 'TTS', days: ['Tue', 'Thu', 'Sat'] },
  { label: 'Mon - Sat', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
];

const START_TIMES = [
  '08:30 AM',
  '09:00 AM',
  '10:00 AM',
  '10:15 AM',
  '11:00 AM',
  '11:45 AM',
  '01:00 PM',
  '01:45 PM',
  '02:00 PM',
  '03:30 PM',
];

const DURATIONS = [
  { label: '45m', minutes: 45 },
  { label: '1h', minutes: 60 },
  { label: '1.5h', minutes: 90 },
  { label: '2h', minutes: 120 },
];

function addMinutesToTime(timeStr, minutesToAdd) {
  try {
    const parts = timeStr.trim().split(' ');
    const [hhStr, mmStr] = parts[0].split(':');
    let hours = parseInt(hhStr, 10);
    const minutes = parseInt(mmStr, 10);
    const period = parts[1].toUpperCase();

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const totalMinutes = hours * 60 + minutes + minutesToAdd;
    let newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    const newPeriod = newHours >= 12 ? 'PM' : 'AM';

    let displayHours = newHours % 12;
    if (displayHours === 0) displayHours = 12;

    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(displayHours)}:${pad(newMinutes)} ${newPeriod}`;
  } catch (e) {
    return timeStr;
  }
}

export default function SchedulePicker({
  value,
  onChange,
  label = 'Weekly Class Timetable Schedule',
  compact = false,
  room = '',
  bookedSlots = [],
  excludeSubjectId = null,
}) {
  const parseInitial = () => {
    if (!value) return { days: ['Mon', 'Wed', 'Fri'], slot: '10:15 AM - 11:45 AM', custom: '' };

    const parts = value.split(' - ');
    const daysPart = parts[0] || '';
    const timePart = parts.slice(1).join(' - ') || '10:15 AM - 11:45 AM';

    const selected = WEEKDAYS.filter((d) =>
      daysPart.toLowerCase().includes(d.id.toLowerCase())
    ).map((d) => d.id);

    const isPreset = PRESET_TIME_SLOTS.includes(timePart);

    return {
      days: selected.length > 0 ? selected : ['Mon', 'Wed', 'Fri'],
      slot: isPreset ? timePart : 'custom',
      custom: isPreset ? '' : timePart,
    };
  };

  const initial = parseInitial();
  const [selectedDays, setSelectedDays] = useState(initial.days);
  const [selectedSlot, setSelectedSlot] = useState(initial.slot);
  const [selectedStartTime, setSelectedStartTime] = useState('10:15 AM');
  const [selectedDuration, setSelectedDuration] = useState(90);
  const [customTime, setCustomTime] = useState(initial.custom);
  const [showCustom, setShowCustom] = useState(initial.slot === 'custom');
  const [builderMode, setBuilderMode] = useState(false);

  // Filter preset time slots to ONLY those available for selectedDays + room
  const availablePresetSlots = useMemo(() => {
    if (!room || !bookedSlots || bookedSlots.length === 0) return PRESET_TIME_SLOTS;
    return PRESET_TIME_SLOTS.filter((slot) =>
      isTimeSlotAvailableForRoom(selectedDays, slot, room, bookedSlots, excludeSubjectId)
    );
  }, [selectedDays, room, bookedSlots, excludeSubjectId]);

  // Filter Time Builder start times to ONLY those free for (selectedDays, selectedDuration, room)
  const availableStartTimes = useMemo(() => {
    if (!room || !bookedSlots || bookedSlots.length === 0) return START_TIMES;
    return START_TIMES.filter((st) => {
      const slotStr = `${st} - ${addMinutesToTime(st, selectedDuration)}`;
      return isTimeSlotAvailableForRoom(selectedDays, slotStr, room, bookedSlots, excludeSubjectId);
    });
  }, [selectedDays, selectedDuration, room, bookedSlots, excludeSubjectId]);

  const handleApplyBuilder = (startTime, durationMins) => {
    const endTime = addMinutesToTime(startTime, durationMins);
    const computedSlot = `${startTime} - ${endTime}`;
    setSelectedSlot(computedSlot);
    setShowCustom(false);
  };

  // Auto-switch to an available slot whenever days or room change
  useEffect(() => {
    if (!room || !bookedSlots || bookedSlots.length === 0) return;
    if (!builderMode && !showCustom) {
      if (availablePresetSlots.length > 0 && !availablePresetSlots.includes(selectedSlot)) {
        setSelectedSlot(availablePresetSlots[0]);
      }
    } else if (builderMode) {
      if (availableStartTimes.length > 0 && !availableStartTimes.includes(selectedStartTime)) {
        const nextStart = availableStartTimes[0];
        setSelectedStartTime(nextStart);
        handleApplyBuilder(nextStart, selectedDuration);
      }
    }
  }, [
    room,
    bookedSlots,
    builderMode,
    showCustom,
    availablePresetSlots,
    availableStartTimes,
    selectedSlot,
    selectedStartTime,
    selectedDuration,
  ]);

  useEffect(() => {
    const daysStr = selectedDays.join(', ');
    const timeStr = showCustom
      ? customTime.trim() || '10:15 AM - 11:45 AM'
      : selectedSlot;
    if (daysStr) {
      onChange(`${daysStr} - ${timeStr}`);
    } else {
      onChange(`Mon, Wed, Fri - ${timeStr}`);
    }
  }, [selectedDays, selectedSlot, customTime, showCustom]);

  const toggleDay = (dayId) => {
    setSelectedDays((prev) => {
      if (prev.includes(dayId)) {
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== dayId);
      } else {
        return WEEKDAYS.filter((d) => prev.includes(d.id) || d.id === dayId).map((d) => d.id);
      }
    });
  };

  const applyPreset = (days) => {
    setSelectedDays(days);
  };

  const formattedPreview = `${selectedDays.join(', ')} • ${
    showCustom ? customTime || 'Custom' : selectedSlot
  }`;

  return (
    <View className={`bg-card border border-border rounded-2xl ${compact ? 'p-3 mb-3' : 'p-4 mb-4'} shadow-sm`}>
      {/* Header with Title and Days Count Badge */}
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-1.5 flex-1 mr-2">
          <Icon name="time" size={15} color="#0284c7" />
          <Text className={`${compact ? 'text-xs' : 'text-sm'} font-bold text-foreground`}>
            {label}
          </Text>
        </View>
        <Badge variant="secondary" className="px-2 py-0.5">
          <Text className="text-[10px] font-bold text-primary">
            {selectedDays.length} {selectedDays.length === 1 ? 'Day' : 'Days'} Selected
          </Text>
        </Badge>
      </View>

      {/* 1. Day Presets Buttons Row */}
      <View className="flex-row items-center gap-1.5 mb-2 flex-wrap">
        <Text className="text-[10px] font-semibold text-muted-foreground mr-1">
          Presets:
        </Text>
        {DAY_PRESETS.map((p, idx) => {
          const isMatch =
            p.days.length === selectedDays.length &&
            p.days.every((d) => selectedDays.includes(d));
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.7}
              onPress={() => applyPreset(p.days)}
              className={`px-2.5 py-1 rounded-lg border ${
                isMatch
                  ? 'bg-primary border-primary shadow-sm'
                  : 'bg-muted/40 border-border/80'
              }`}
            >
              <Text
                className={`text-[10px] font-bold ${
                  isMatch ? 'text-primary-foreground' : 'text-foreground'
                }`}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 2. Individual Working Day Buttons (Mon to Sat) */}
      <View className="flex-row justify-between gap-1 mb-3">
        {WEEKDAYS.map((day) => {
          const isSelected = selectedDays.includes(day.id);
          return (
            <TouchableOpacity
              key={day.id}
              activeOpacity={0.7}
              onPress={() => toggleDay(day.id)}
              className={`flex-1 py-1.5 rounded-xl items-center justify-center border ${
                isSelected
                  ? 'bg-primary border-primary shadow-sm'
                  : 'bg-muted/30 border-border'
              }`}
            >
              <Text
                className={`text-[11px] font-bold ${
                  isSelected ? 'text-primary-foreground' : 'text-foreground'
                }`}
              >
                {day.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Time Slots Selection */}
      <View className="pt-2 border-t border-border/60 mb-2">
        <View className="flex-row items-center justify-between mb-1.5">
          <Text className="text-[11px] font-semibold text-foreground">
            Class Time Slot
          </Text>
          <View className="flex-row gap-1">
            <TouchableOpacity
              onPress={() => setBuilderMode(false)}
              className={`px-2 py-0.5 rounded-md ${!builderMode ? 'bg-primary/10' : 'bg-transparent'}`}
            >
              <Text className={`text-[10px] font-bold ${!builderMode ? 'text-primary' : 'text-muted-foreground'}`}>
                Presets
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setBuilderMode(true)}
              className={`px-2 py-0.5 rounded-md ${builderMode ? 'bg-primary/10' : 'bg-transparent'}`}
            >
              <Text className={`text-[10px] font-bold ${builderMode ? 'text-primary' : 'text-muted-foreground'}`}>
                Time Builder
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {!builderMode ? (
          /* Available Presets buttons grid */
          availablePresetSlots.length > 0 ? (
            <View className="flex-row flex-wrap gap-1.5">
              {availablePresetSlots.map((slot) => {
                const isSelected = !showCustom && selectedSlot === slot;
                return (
                  <TouchableOpacity
                    key={slot}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSelectedSlot(slot);
                      setShowCustom(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-xl border ${
                      isSelected
                        ? 'bg-primary border-primary shadow-sm'
                        : 'bg-muted/40 border-border'
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-semibold ${
                        isSelected ? 'text-primary-foreground' : 'text-foreground'
                      }`}
                    >
                      {slot}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <Text className="text-[11px] font-medium text-amber-800">
                All preset slots are booked in this room for the selected days. Switch to Time Builder or pick another room/day.
              </Text>
            </View>
          )
        ) : (
          /* Time Builder: Start Time + Duration buttons (filtered to available slots) */
          <View className="bg-muted/20 border border-border/60 rounded-xl p-2.5">
            <Text className="text-[10px] font-bold text-muted-foreground mb-1">
              1. Select Available Start Time:
            </Text>
            {availableStartTimes.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row gap-1 mb-2"
              >
                {availableStartTimes.map((st) => {
                  const isSelected = selectedStartTime === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      onPress={() => {
                        setSelectedStartTime(st);
                        handleApplyBuilder(st, selectedDuration);
                      }}
                      className={`px-2 py-1 rounded-lg border ${
                        isSelected ? 'bg-primary border-primary' : 'bg-card border-border'
                      }`}
                    >
                      <Text className={`text-[10px] font-bold ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <Text className="text-[11px] font-medium text-amber-700 mb-2">
                No start times free for {selectedDuration}m in this room on selected days.
              </Text>
            )}

            <Text className="text-[10px] font-bold text-muted-foreground mb-1">
              2. Select Duration:
            </Text>
            <View className="flex-row gap-1.5">
              {DURATIONS.map((dur) => {
                const isSelected = selectedDuration === dur.minutes;
                return (
                  <TouchableOpacity
                    key={dur.label}
                    onPress={() => {
                      setSelectedDuration(dur.minutes);
                      handleApplyBuilder(selectedStartTime, dur.minutes);
                    }}
                    className={`flex-1 py-1 rounded-lg border items-center ${
                      isSelected ? 'bg-primary border-primary' : 'bg-card border-border'
                    }`}
                  >
                    <Text className={`text-[10px] font-bold ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {dur.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* 4. Live Schedule Output Preview */}
      <View className="pt-2 border-t border-border/50 flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <Icon name="calendar" size={13} color="#0284c7" />
          <Text className="text-[10px] text-muted-foreground">Generated Timetable:</Text>
        </View>
        <Badge variant="outline" className="px-2 py-0.5 bg-primary/5 border-primary/30">
          <Text className="text-[11px] font-bold text-primary">{formattedPreview}</Text>
        </Badge>
      </View>
    </View>
  );
}

export function ScheduleDisplayBadge({ schedule, room }) {
  if (!schedule) {
    return (
      <View className="flex-row items-center gap-1">
        <Text className="text-[11px] text-muted-foreground">TBD</Text>
      </View>
    );
  }

  const parts = schedule.split(' - ');
  const daysStr = parts[0] || '';
  const timeStr = parts.slice(1).join(' - ') || '';

  const activeDays = WEEKDAYS.filter((d) =>
    daysStr.toLowerCase().includes(d.id.toLowerCase())
  ).map((d) => d.id);

  return (
    <View className="gap-1.5">
      <View className="flex-row items-center gap-1.5 flex-wrap">
        <View className="flex-row gap-0.5 bg-muted/60 p-0.5 rounded-md">
          {WEEKDAYS.map((d) => {
            const isActive = activeDays.includes(d.id);
            return (
              <View
                key={d.id}
                className={`w-4 h-4 rounded-sm items-center justify-center ${
                  isActive ? 'bg-primary' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-[8px] font-bold ${
                    isActive ? 'text-primary-foreground' : 'text-muted-foreground/60'
                  }`}
                >
                  {d.label[0]}
                </Text>
              </View>
            );
          })}
        </View>

        {timeStr ? (
          <Badge variant="outline" className="py-0 px-1.5 bg-card">
            <Text className="text-[10px] font-medium text-foreground">{timeStr}</Text>
          </Badge>
        ) : (
          <Badge variant="outline" className="py-0 px-1.5 bg-card">
            <Text className="text-[10px] font-medium text-foreground">{daysStr}</Text>
          </Badge>
        )}
      </View>

      {room ? (
        <View className="flex-row items-center gap-1">
          <Text className="text-[10px] font-medium text-muted-foreground">
            Room: <Text className="font-semibold text-foreground">{room}</Text>
          </Text>
        </View>
      ) : null}
    </View>
  );
}
