import re
from datetime import datetime, time, timedelta
from app.config.database import db
from app.modules.course.model import Subject, SubjectTimetable
from app.modules.teacher.model import Teacher, TeacherAssignment

DAY_NAME_TO_INT = {
    "mon": 1,
    "monday": 1,
    "tue": 2,
    "tuesday": 2,
    "wed": 3,
    "wednesday": 3,
    "thu": 4,
    "thursday": 4,
    "fri": 5,
    "friday": 5,
    "sat": 6,
    "saturday": 6,
    "sun": 7,
    "sunday": 7,
}

INT_TO_DAY_NAME = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
    7: "Sunday",
}


def parse_time_str(time_str: str) -> time | None:
    """
    Parses strings like '10:15 AM', '09:00 AM', '14:30', '2:00 PM' into datetime.time.
    """
    if not time_str or not isinstance(time_str, str):
        return None

    cleaned = time_str.strip().upper()
    formats = [
        "%I:%M %p",
        "%I:%M%p",
        "%H:%M:%S",
        "%H:%M",
        "%I %p",
    ]
    for fmt in formats:
        try:
            return datetime.strptime(cleaned, fmt).time()
        except ValueError:
            continue
    return None


def add_minutes_to_time(base_time: time, minutes: int = 60) -> time:
    """
    Adds given minutes to a datetime.time object.
    """
    dt = datetime.combine(datetime.today(), base_time) + timedelta(minutes=minutes)
    return dt.time()


def normalize_room_name(room_str: str | None) -> str:
    """Normalizes room names so spacing/casing differences still match."""
    if not room_str or not isinstance(room_str, str):
        return ""
    return " ".join(room_str.strip().lower().split())


def parse_schedule_slots(schedule_str: str) -> list[dict]:
    """
    Extracts structured slot definitions from schedule strings.
    Examples:
    - 'Mon, Wed, Fri - 10:15 AM - 11:45 AM'
    - 'Mon - Fri - 09:00 AM - 10:30 AM'
    - 'Tue, Thu, Sat - 02:00 PM'
    """
    if not schedule_str or not isinstance(schedule_str, str):
        return []

    s = schedule_str.strip()
    if not s:
        return []

    # 1. Extract time tokens reliably even when days contain '-' (e.g. 'Mon - Fri - 09:00 AM - 10:30 AM')
    time_pattern = r"\b\d{1,2}:\d{2}(?::\d{2})?(?:\s*(?:AM|PM))?|\b\d{1,2}\s*(?:AM|PM)\b"
    time_matches = list(re.finditer(time_pattern, s, flags=re.IGNORECASE))

    start_time = None
    end_time = None
    if time_matches:
        days_part = s[:time_matches[0].start()].strip(" -•,\t")
        start_time = parse_time_str(time_matches[0].group(0))
        if len(time_matches) >= 2:
            end_time = parse_time_str(time_matches[1].group(0))
    else:
        parts = [p.strip() for p in s.split(" - ") if p.strip()]
        days_part = parts[0] if parts else s

    # 2. Identify Days
    days_set = set()
    days_lower = days_part.lower()

    if "mon - fri" in days_lower or "mon-fri" in days_lower:
        days_set.update([1, 2, 3, 4, 5])
    elif "mon - sat" in days_lower or "mon-sat" in days_lower or "daily" in days_lower or "full day" in days_lower or "all day" in days_lower:
        days_set.update([1, 2, 3, 4, 5, 6])
    elif "mwf" in days_lower:
        days_set.update([1, 3, 5])
    elif "tts" in days_lower:
        days_set.update([2, 4, 6])
    else:
        tokens = re.split(r"[\s,;/\-]+", days_lower)
        for t in tokens:
            cleaned_t = t.strip()
            if cleaned_t in DAY_NAME_TO_INT:
                days_set.add(DAY_NAME_TO_INT[cleaned_t])

    # Default to Monday, Wednesday, Friday if none parsed
    if not days_set:
        days_set = {1, 3, 5}

    if not start_time:
        start_time = time(10, 15)
    if not end_time:
        end_time = add_minutes_to_time(start_time, 90)

    # Ensure start_time < end_time
    if start_time >= end_time:
        end_time = add_minutes_to_time(start_time, 90)

    result = []
    for d in sorted(days_set):
        result.append({
            "day_of_week": d,
            "day_name": INT_TO_DAY_NAME.get(d, str(d)),
            "start_time": start_time,
            "end_time": end_time,
        })
    return result


def _find_slot_overlap(existing_slots: list[dict], new_slots: list[dict]) -> dict | None:
    """Returns the first overlapping slot dict or None."""
    for ex in existing_slots:
        for req in new_slots:
            if ex["day_of_week"] == req["day_of_week"]:
                if max(ex["start_time"], req["start_time"]) < min(ex["end_time"], req["end_time"]):
                    return ex
    return None


def _extract_assignment_slots(assignment: TeacherAssignment) -> list[dict]:
    """Reads SubjectTimetable rows for an assignment, falling back to parsed schedule."""
    timetable_slots = assignment.timetable_slots if getattr(assignment, "timetable_slots", None) else []
    if timetable_slots:
        return [
            {
                "day_of_week": ex.day_of_week,
                "start_time": ex.start_time,
                "end_time": ex.end_time,
            }
            for ex in timetable_slots
        ]
    if assignment.schedule:
        return parse_schedule_slots(assignment.schedule)
    return []


def check_teacher_schedule_conflict(
    teacher_id: int,
    schedule_str: str,
    exclude_assignment_id: int | None = None,
    exclude_subject_id: int | None = None
) -> tuple[bool, dict | None]:
    """
    Validates whether the teacher has any scheduling conflicts for the requested timetable slot.
    Returns:
        (is_conflict: bool, conflict_details: dict | None)
    """
    if not teacher_id or not schedule_str:
        return False, None

    new_slots = parse_schedule_slots(schedule_str)
    if not new_slots:
        return False, None

    query = TeacherAssignment.query.filter(
        TeacherAssignment.teacher_id == teacher_id,
        TeacherAssignment.status != "inactive"
    )
    if exclude_assignment_id:
        query = query.filter(TeacherAssignment.id != exclude_assignment_id)
    if exclude_subject_id:
        query = query.filter(TeacherAssignment.subject_id != exclude_subject_id)

    for a in query.all():
        ex_slots = _extract_assignment_slots(a)
        overlap = _find_slot_overlap(ex_slots, new_slots)
        if overlap:
            sub_name = a.subject.name if a.subject else "Another Subject"
            sub_code = a.subject.code if a.subject else ""
            return True, {
                "teacher_id": teacher_id,
                "teacher_name": a.teacher.user.username if (a.teacher and a.teacher.user) else "Faculty",
                "day_of_week": overlap["day_of_week"],
                "day_name": INT_TO_DAY_NAME.get(overlap["day_of_week"], str(overlap["day_of_week"])),
                "conflict_start": overlap["start_time"].strftime("%I:%M %p"),
                "conflict_end": overlap["end_time"].strftime("%I:%M %p"),
                "subject_name": sub_name,
                "subject_code": sub_code,
                "room": a.room or "Default Hall",
            }

    return False, None


def check_room_schedule_conflict(
    room_str: str,
    schedule_str: str,
    exclude_assignment_id: int | None = None,
    exclude_subject_id: int | None = None
) -> tuple[bool, dict | None]:
    """
    Validates whether a classroom/room is already booked at overlapping days & timings,
    regardless of which teacher or course uses it.
    """
    norm_room = normalize_room_name(room_str)
    if not norm_room or not schedule_str:
        return False, None

    new_slots = parse_schedule_slots(schedule_str)
    if not new_slots:
        return False, None

    checked_subject_ids = set()

    # 1. Check active TeacherAssignment entries in the same room
    assign_query = TeacherAssignment.query.filter(TeacherAssignment.status != "inactive")
    if exclude_assignment_id:
        assign_query = assign_query.filter(TeacherAssignment.id != exclude_assignment_id)
    if exclude_subject_id:
        assign_query = assign_query.filter(TeacherAssignment.subject_id != exclude_subject_id)

    for a in assign_query.all():
        if a.subject_id:
            checked_subject_ids.add(a.subject_id)
        if normalize_room_name(a.room) != norm_room:
            continue
        ex_slots = _extract_assignment_slots(a)
        overlap = _find_slot_overlap(ex_slots, new_slots)
        if overlap:
            sub_name = a.subject.name if a.subject else "Another Class"
            sub_code = a.subject.code if a.subject else ""
            return True, {
                "room": a.room or room_str.strip(),
                "day_of_week": overlap["day_of_week"],
                "day_name": INT_TO_DAY_NAME.get(overlap["day_of_week"], str(overlap["day_of_week"])),
                "conflict_start": overlap["start_time"].strftime("%I:%M %p"),
                "conflict_end": overlap["end_time"].strftime("%I:%M %p"),
                "subject_name": sub_name,
                "subject_code": sub_code,
                "teacher_name": a.teacher.user.username if (a.teacher and a.teacher.user) else None,
            }

    # 2. Check Subject rows without an active TeacherAssignment (unassigned classes still occupy rooms!)
    sub_query = Subject.query
    if exclude_subject_id:
        sub_query = sub_query.filter(Subject.id != exclude_subject_id)

    for s in sub_query.all():
        if s.id in checked_subject_ids:
            continue
        if normalize_room_name(s.room) != norm_room or not s.schedule:
            continue
        ex_slots = parse_schedule_slots(s.schedule)
        overlap = _find_slot_overlap(ex_slots, new_slots)
        if overlap:
            return True, {
                "room": s.room or room_str.strip(),
                "day_of_week": overlap["day_of_week"],
                "day_name": INT_TO_DAY_NAME.get(overlap["day_of_week"], str(overlap["day_of_week"])),
                "conflict_start": overlap["start_time"].strftime("%I:%M %p"),
                "conflict_end": overlap["end_time"].strftime("%I:%M %p"),
                "subject_name": s.name,
                "subject_code": s.code,
                "teacher_name": s.teacher.user.username if (s.teacher and s.teacher.user) else None,
            }

    return False, None


def sync_assignment_timetable(assignment_id: int, schedule_str: str, room_id: int | None = None):
    """
    Populates subject_timetable table for the given assignment based on its schedule string.
    """
    if not assignment_id or not schedule_str:
        return

    # Remove previous slots for this assignment
    SubjectTimetable.query.filter(SubjectTimetable.assignment_id == assignment_id).delete()

    slots = parse_schedule_slots(schedule_str)
    for slot in slots:
        st_entry = SubjectTimetable(
            assignment_id=assignment_id,
            room_id=room_id,
            day_of_week=slot["day_of_week"],
            start_time=slot["start_time"],
            end_time=slot["end_time"],
        )
        db.session.add(st_entry)
