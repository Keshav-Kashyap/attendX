import asyncio
import logging
import os
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import or_

from app.config.database import db
from app.modules.course.model import CourseEnrollment
from app.modules.course.timetable_helper import parse_schedule_slots
from app.modules.notifications.fcm import send_push_to_users
from app.modules.notifications.model import NotificationLog
from app.modules.student.model import Student
from app.modules.teacher.model import TeacherAssignment

logger = logging.getLogger("attendx.scheduler")

REMINDER_LEAD_MINUTES = 5
POLL_INTERVAL_SECONDS = 30


def _get_now() -> datetime:
    tz_name = os.getenv("APP_TIMEZONE", "Asia/Kolkata").strip() or "Asia/Kolkata"
    try:
        return datetime.now(ZoneInfo(tz_name)).replace(tzinfo=None)
    except Exception:
        return datetime.now()


def _get_assignment_slots_for_day(assignment: TeacherAssignment, day_of_week: int, today_date) -> list[dict]:
    slots = []
    timetable_rows = getattr(assignment, "timetable_slots", None) or []
    if timetable_rows:
        for row in timetable_rows:
            if row.day_of_week != day_of_week:
                continue
            if row.effective_from and today_date < row.effective_from:
                continue
            if row.effective_until and today_date > row.effective_until:
                continue
            slots.append(
                {
                    "start_time": row.start_time,
                    "end_time": row.end_time,
                    "room_name": row.room.room_name if getattr(row, "room", None) else assignment.room,
                }
            )
        return slots

    if assignment.schedule:
        for parsed in parse_schedule_slots(assignment.schedule):
            if parsed["day_of_week"] == day_of_week:
                slots.append(
                    {
                        "start_time": parsed["start_time"],
                        "end_time": parsed["end_time"],
                        "room_name": assignment.room,
                    }
                )
    return slots


def _get_student_user_ids_for_assignment(assignment: TeacherAssignment) -> list[int]:
    course_id = assignment.course_id or (
        assignment.course_subject.course_id if assignment.course_subject else None
    )
    semester_id = assignment.semester_id or (
        assignment.course_subject.semester_id if assignment.course_subject else None
    )
    if not course_id:
        return []

    query = (
        db.session.query(Student.user_id)
        .join(CourseEnrollment, CourseEnrollment.student_id == Student.id)
        .filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.status == "active",
        )
    )
    if semester_id:
        query = query.filter(
            or_(
                CourseEnrollment.semester_id == semester_id,
                (CourseEnrollment.semester_id.is_(None) & (Student.semester_id == semester_id)),
            )
        )

    return [row[0] for row in query.all() if row[0] is not None]


def check_and_send_upcoming_class_reminders() -> int:
    """
    Finds classes starting in ~5 minutes and sends push notifications
    to both the assigned teacher and enrolled students (once per slot per day).
    """
    now = _get_now()
    today_date = now.date()
    today_str = today_date.isoformat()
    day_of_week = now.isoweekday()  # 1=Monday .. 7=Sunday

    window_start = now + timedelta(minutes=REMINDER_LEAD_MINUTES - 1)
    window_end = now + timedelta(minutes=REMINDER_LEAD_MINUTES, seconds=30)

    total_sent = 0
    try:
        assignments = TeacherAssignment.query.filter(
            TeacherAssignment.status == "active"
        ).all()

        for assignment in assignments:
            slots = _get_assignment_slots_for_day(assignment, day_of_week, today_date)
            for slot in slots:
                start_t = slot["start_time"]
                class_start_dt = datetime.combine(today_date, start_t)
                if not (window_start <= class_start_dt <= window_end):
                    continue

                start_key = start_t.strftime("%H:%M")
                dedup_key = f"class_reminder_5m:{assignment.id}:{today_str}:{start_key}"
                already_sent = NotificationLog.query.filter(
                    NotificationLog.dedup_key == dedup_key
                ).first()
                if already_sent:
                    continue

                subject_obj = assignment.subject or (
                    assignment.course_subject.subject if assignment.course_subject else None
                )
                subject_name = subject_obj.name if subject_obj else "Class"
                subject_code = subject_obj.code if subject_obj else ""
                subject_id = subject_obj.id if subject_obj else assignment.subject_id
                room_name = slot.get("room_name") or assignment.room or "Classroom"
                start_display = start_t.strftime("%I:%M %p").lstrip("0")
                teacher_name = (
                    assignment.teacher.user.username
                    if (assignment.teacher and assignment.teacher.user)
                    else "Faculty"
                )

                title = f"Class in 5 mins: {subject_name}"
                code_part = f" ({subject_code})" if subject_code else ""
                teacher_body = f"Your {subject_name}{code_part} class starts at {start_display} in {room_name}."
                student_body = f"{subject_name}{code_part} with {teacher_name} starts at {start_display} in {room_name}."

                payload_data = {
                    "type": "class_reminder_5m",
                    "assignment_id": str(assignment.id),
                    "subject_id": str(subject_id or ""),
                    "start_time": start_key,
                    "room": room_name,
                }

                # Record log first so concurrent/restarted runs cannot double-send
                log_entry = NotificationLog(
                    dedup_key=dedup_key,
                    notification_type="class_reminder_5m",
                    title=title,
                    body=student_body,
                    sent_count=0,
                )
                db.session.add(log_entry)
                db.session.commit()

                sent_for_slot = 0
                if assignment.teacher and assignment.teacher.user_id and assignment.teacher.is_active:
                    sent_for_slot += send_push_to_users(
                        user_ids=[assignment.teacher.user_id],
                        title=title,
                        body=teacher_body,
                        data=payload_data,
                        pref_field="class_reminders",
                    )

                student_user_ids = _get_student_user_ids_for_assignment(assignment)
                if student_user_ids:
                    sent_for_slot += send_push_to_users(
                        user_ids=student_user_ids,
                        title=title,
                        body=student_body,
                        data=payload_data,
                        pref_field="class_reminders",
                    )

                log_entry.sent_count = sent_for_slot
                db.session.commit()
                total_sent += sent_for_slot
    except Exception as exc:
        db.session.rollback()
        logger.error("Error in class reminder scheduler: %s", exc)
    finally:
        db.session.remove()

    return total_sent


async def run_class_reminder_scheduler():
    """Background loop that checks every 30s for classes starting in 5 minutes."""
    logger.info("Class reminder scheduler started (lead=%d mins, poll=%ds).", REMINDER_LEAD_MINUTES, POLL_INTERVAL_SECONDS)
    while True:
        try:
            await asyncio.to_thread(check_and_send_upcoming_class_reminders)
        except asyncio.CancelledError:
            logger.info("Class reminder scheduler stopped.")
            raise
        except Exception as exc:
            logger.error("Unexpected scheduler loop error: %s", exc)
        await asyncio.sleep(POLL_INTERVAL_SECONDS)
