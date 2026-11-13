const DAY_MAP = {
  mon: 1,
  monday: 1,
  tue: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
  sun: 7,
  sunday: 7,
};

const DAY_NAMES = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
};

function parseMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const cleaned = timeStr.trim().toUpperCase();
  const match = cleaned.match(/^(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(AM|PM)?$/);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const mins = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3] || '';

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + mins;
}

export function formatMinutes(totalMins) {
  const normalized = ((totalMins % 1440) + 1440) % 1440;
  const h24 = Math.floor(normalized / 60);
  const m = normalized % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

/**
 * Parses a schedule string (e.g. "Mon, Wed, Fri - 10:15 AM - 11:45 AM" or "Mon - Fri - 09:00 AM")
 * into [{ day, dayName, startMins, endMins }] matching backend timetable_helper.parse_schedule_slots.
 */
export function parseScheduleSlots(scheduleStr) {
  if (!scheduleStr || typeof scheduleStr !== 'string') return [];
  const s = scheduleStr.trim();
  if (!s) return [];

  const timeRegex = /\b\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:AM|PM))?|\b\d{1,2}\s*(?:AM|PM)\b/gi;
  const matches = [...s.matchAll(timeRegex)];

  let daysPart = s;
  let startMins = null;
  let endMins = null;

  if (matches.length > 0) {
    daysPart = s.slice(0, matches[0].index).replace(/[\s\-•,]+$/g, '');
    startMins = parseMinutes(matches[0][0]);
    if (matches.length >= 2) {
      endMins = parseMinutes(matches[1][0]);
    }
  } else {
    daysPart = s.split(' - ')[0] || s;
  }

  const daysLower = daysPart.toLowerCase();
  const daysSet = new Set();

  if (daysLower.includes('mon - fri') || daysLower.includes('mon-fri')) {
    [1, 2, 3, 4, 5].forEach((d) => daysSet.add(d));
  } else if (
    daysLower.includes('mon - sat') ||
    daysLower.includes('mon-sat') ||
    daysLower.includes('daily') ||
    daysLower.includes('full day') ||
    daysLower.includes('all day')
  ) {
    [1, 2, 3, 4, 5, 6].forEach((d) => daysSet.add(d));
  } else if (daysLower.includes('mwf')) {
    [1, 3, 5].forEach((d) => daysSet.add(d));
  } else if (daysLower.includes('tts')) {
    [2, 4, 6].forEach((d) => daysSet.add(d));
  } else {
    const tokens = daysLower.split(/[\s,;/\-]+/).filter(Boolean);
    tokens.forEach((tok) => {
      if (DAY_MAP[tok]) daysSet.add(DAY_MAP[tok]);
    });
  }

  if (daysSet.size === 0) {
    [1, 3, 5].forEach((d) => daysSet.add(d));
  }

  if (startMins === null) startMins = 10 * 60 + 15;
  if (endMins === null || startMins >= endMins) endMins = startMins + 90;

  return Array.from(daysSet)
    .sort((a, b) => a - b)
    .map((day) => ({
      day,
      dayName: DAY_NAMES[day] || String(day),
      startMins,
      endMins,
    }));
}

/**
 * Normalizes a room name so casing/extra spaces still match.
 */
export function normalizeRoomName(roomStr) {
  if (!roomStr || typeof roomStr !== 'string') return '';
  return roomStr.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Returns the first overlapping slot between two schedule strings, or null.
 */
export function findScheduleOverlap(scheduleA, scheduleB) {
  const slotsA = parseScheduleSlots(scheduleA);
  const slotsB = parseScheduleSlots(scheduleB);
  for (const a of slotsA) {
    for (const b of slotsB) {
      if (a.day === b.day && Math.max(a.startMins, b.startMins) < Math.min(a.endMins, b.endMins)) {
        return a;
      }
    }
  }
  return null;
}

/**
 * Checks in-memory whether (room, schedule) clashes with any entry in bookedSlots.
 * Returns { available: boolean, conflict: object | null }.
 */
export function getRoomConflict(room, schedule, bookedSlots = [], excludeSubjectId = null) {
  const normRoom = normalizeRoomName(room);
  if (!normRoom || !schedule || !bookedSlots || bookedSlots.length === 0) {
    return { available: true, conflict: null };
  }

  for (const entry of bookedSlots) {
    if (excludeSubjectId && entry.subject_id === excludeSubjectId) continue;
    const entryRoom = entry.normalized_room || normalizeRoomName(entry.room);
    if (entryRoom !== normRoom || !entry.schedule) continue;

    const overlap = findScheduleOverlap(entry.schedule, schedule);
    if (overlap) {
      return {
        available: false,
        conflict: {
          dayName: overlap.dayName,
          timeRange: `${formatMinutes(overlap.startMins)} - ${formatMinutes(overlap.endMins)}`,
          subjectName: entry.subject_name || 'Another Class',
          subjectCode: entry.subject_code || '',
          room: entry.room || room,
        },
      };
    }
  }

  return { available: true, conflict: null };
}

/**
 * Returns true if a given timeSlotStr on daysArray is free for the specified room.
 */
export function isTimeSlotAvailableForRoom(daysArray, timeSlotStr, room, bookedSlots = [], excludeSubjectId = null) {
  if (!daysArray || daysArray.length === 0 || !timeSlotStr) return true;
  const candidateSchedule = `${daysArray.join(', ')} - ${timeSlotStr}`;
  return getRoomConflict(room, candidateSchedule, bookedSlots, excludeSubjectId).available;
}

/**
 * Checks whether a teacher has any active assignment clashing with targetSchedule.
 * Returns { available: boolean, conflict: { dayName, timeRange, subjectName, subjectCode, room } | null }.
 */
export function getTeacherAvailability(teacher, targetSchedule) {
  if (!teacher || !targetSchedule) return { available: true, conflict: null };
  const targetSlots = parseScheduleSlots(targetSchedule);
  if (targetSlots.length === 0) return { available: true, conflict: null };

  const assignments = (teacher.assignments || []).filter((a) => a.status !== 'inactive');

  for (const assignment of assignments) {
    if (!assignment.schedule) continue;
    const existingSlots = parseScheduleSlots(assignment.schedule);
    for (const ex of existingSlots) {
      for (const req of targetSlots) {
        if (ex.day === req.day && Math.max(ex.startMins, req.startMins) < Math.min(ex.endMins, req.endMins)) {
          return {
            available: false,
            conflict: {
              dayName: ex.dayName,
              timeRange: `${formatMinutes(ex.startMins)} - ${formatMinutes(ex.endMins)}`,
              subjectName: assignment.subject_name || 'Another Class',
              subjectCode: assignment.subject_code || '',
              room: assignment.room || '',
            },
          };
        }
      }
    }
  }

  return { available: true, conflict: null };
}

