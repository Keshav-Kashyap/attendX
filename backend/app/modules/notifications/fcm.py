import json
import logging
import os
from pathlib import Path
from typing import Iterable

import firebase_admin
from firebase_admin import credentials, messaging

from app.config.database import db
from app.modules.notifications.model import DeviceToken, NotificationPreference

logger = logging.getLogger("attendx.fcm")

BACKEND_ROOT = Path(__file__).resolve().parents[3]
_firebase_initialized = False


def _resolve_credentials_path() -> Path | None:
    raw_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "firebase-service-account.json").strip()
    if not raw_path:
        return None
    p = Path(raw_path)
    if not p.is_absolute():
        p = BACKEND_ROOT / p
    return p


def init_firebase() -> bool:
    """Lazily initializes Firebase Admin SDK if credentials are available."""
    global _firebase_initialized
    if _firebase_initialized or firebase_admin._apps:
        _firebase_initialized = True
        return True

    cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON", "").strip()
    try:
        if cred_json:
            cred_dict = json.loads(cred_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            print("[FCM] Firebase Admin SDK initialized from FIREBASE_CREDENTIALS_JSON.", flush=True)
            return True

        cred_path = _resolve_credentials_path()
        if cred_path and cred_path.exists():
            cred = credentials.Certificate(str(cred_path))
            firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            print(f"[FCM] Firebase Admin SDK initialized from {cred_path}.", flush=True)
            return True

        print(
            f"[FCM WARNING] Firebase credentials not found at {cred_path}. "
            "Push notifications are disabled until firebase-service-account.json is placed in backend/.",
            flush=True,
        )
        return False
    except Exception as exc:
        print(f"[FCM ERROR] Failed to initialize Firebase Admin SDK: {exc}", flush=True)
        return False


def filter_users_by_preference(user_ids: Iterable[int], pref_field: str | None) -> list[int]:
    """Filters user_ids, keeping users who have not explicitly disabled pref_field."""
    unique_ids = list({int(uid) for uid in user_ids if uid is not None})
    if not unique_ids or not pref_field:
        return unique_ids

    prefs = NotificationPreference.query.filter(NotificationPreference.user_id.in_(unique_ids)).all()
    disabled_ids = {p.user_id for p in prefs if getattr(p, pref_field, True) is False}
    return [uid for uid in unique_ids if uid not in disabled_ids]


def send_push_to_users(
    user_ids: Iterable[int],
    title: str,
    body: str,
    data: dict | None = None,
    pref_field: str | None = None,
) -> int:
    """Sends an FCM push notification to all active device tokens for the given user IDs."""
    target_user_ids = filter_users_by_preference(user_ids, pref_field)
    if not target_user_ids:
        print(f"[FCM] Skipped '{title}': no target users (or disabled in preferences).", flush=True)
        return 0

    tokens_rows = DeviceToken.query.filter(
        DeviceToken.user_id.in_(target_user_ids),
        DeviceToken.is_active.is_(True),
    ).all()

    if not tokens_rows:
        print(
            f"[FCM] No active device tokens found for user_ids={target_user_ids} (title='{title}'). "
            "Users must log in on a native Android/iOS build to register their FCM token.",
            flush=True,
        )
        return 0

    if not init_firebase():
        return 0

    print(
        f"[FCM] Sending '{title}' to {len(tokens_rows)} device(s) for user_ids={target_user_ids}...",
        flush=True,
    )

    str_data = {str(k): str(v) for k, v in (data or {}).items()}
    token_strings = [row.token for row in tokens_rows]
    success_total = 0

    # FCM send_each_for_multicast supports up to 500 tokens per batch
    for i in range(0, len(token_strings), 500):
        batch_tokens = token_strings[i : i + 500]
        message = messaging.MulticastMessage(
            tokens=batch_tokens,
            notification=messaging.Notification(title=title, body=body),
            data=str_data,
            android=messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(
                    channel_id="attendx_default",
                    sound="default",
                ),
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(sound="default"),
                )
            ),
        )
        try:
            response = messaging.send_each_for_multicast(message)
            success_total += response.success_count
            print(
                f"[FCM] Multicast result for '{title}': success={response.success_count}, failure={response.failure_count}",
                flush=True,
            )

            # Deactivate invalid/unregistered tokens
            stale_tokens = []
            for idx, send_resp in enumerate(response.responses):
                if not send_resp.success and send_resp.exception:
                    print(f"[FCM ERROR] Token[{idx}] failed: {send_resp.exception}", flush=True)
                    err_code = getattr(send_resp.exception, "code", "") or ""
                    err_msg = str(send_resp.exception).lower()
                    if (
                        "unregistered" in err_msg
                        or "not-registered" in err_msg
                        or "invalid-argument" in err_msg
                        or err_code in ("UNREGISTERED", "INVALID_ARGUMENT")
                    ):
                        stale_tokens.append(batch_tokens[idx])

            if stale_tokens:
                DeviceToken.query.filter(DeviceToken.token.in_(stale_tokens)).update(
                    {"is_active": False},
                    synchronize_session=False,
                )
                db.session.commit()
                print(f"[FCM] Deactivated {len(stale_tokens)} stale token(s).", flush=True)
        except Exception as exc:
            print(f"[FCM ERROR] FCM multicast send failed: {exc}", flush=True)

    return success_total


def notify_class_coordinator_assigned(teacher_user_id: int, semester) -> int:
    """Sends a push notification to a teacher when assigned/updated as Class Coordinator."""
    if not teacher_user_id or not semester:
        return 0

    course_code = semester.course.code if getattr(semester, "course", None) else ""
    course_name = semester.course.name if getattr(semester, "course", None) else ""
    sem_label = f"{course_code} · Semester {semester.semester_number}".strip(" ·")

    title = "Class Coordinator Assigned"
    body = f"You have been assigned as Class Coordinator for {sem_label}."
    if course_name:
        body = f"You have been assigned as Class Coordinator for {course_name} ({sem_label})."

    return send_push_to_users(
        user_ids=[teacher_user_id],
        title=title,
        body=body,
        data={
            "type": "coordinator_assigned",
            "semester_id": str(semester.id),
            "semester_number": str(semester.semester_number),
            "course_code": str(course_code),
        },
        pref_field="coordinator_alerts",
    )


def notify_attendance_session_completed(session, records) -> int:
    """
    Sends an individual FCM push notification to every student in the class
    when the teacher confirms attendance:
    - States whether the class is complete and if the student is Present or Absent
    - Includes formatted class presence percentage (e.g., 85% (34/40))
    - Includes the student's overall attendance percentage in that subject
    """
    if not session or not records:
        return 0

    from sqlalchemy import case, func
    from app.modules.attendance.model import AttendanceRecord, AttendanceSession

    total_enrolled = len(records)
    total_present = sum(1 for r in records if r.status == "Present")
    class_presence_pct = round((total_present / max(total_enrolled, 1)) * 100)
    print(
        f"[FCM] Attendance confirmed for session_id={session.id}: "
        f"notifying {total_enrolled} student(s) (Class Presence: {class_presence_pct}%).",
        flush=True,
    )

    subject_name = session.subject.name if getattr(session, "subject", None) else "Class"
    subject_code = session.subject.code if getattr(session, "subject", None) else ""
    code_part = f" ({subject_code})" if subject_code else ""

    student_ids = [r.student_id for r in records if r.student_id is not None]
    stats_map = {}
    if student_ids and session.subject_id:
        rows = (
            db.session.query(
                AttendanceRecord.student_id,
                func.count(AttendanceRecord.id).label("total_classes"),
                func.sum(case((AttendanceRecord.status == "Present", 1), else_=0)).label("present_classes"),
            )
            .join(AttendanceSession, AttendanceSession.id == AttendanceRecord.session_id)
            .filter(
                AttendanceSession.subject_id == session.subject_id,
                AttendanceSession.is_confirmed.is_(True),
                AttendanceRecord.student_id.in_(student_ids),
            )
            .group_by(AttendanceRecord.student_id)
            .all()
        )
        for sid, total_c, present_c in rows:
            total_c = int(total_c or 0)
            present_c = int(present_c or 0)
            pct = round((present_c / max(total_c, 1)) * 100)
            stats_map[sid] = (present_c, total_c, pct)

    total_sent = 0
    for rec in records:
        student = getattr(rec, "student", None)
        user_id = student.user_id if student else None
        if not user_id:
            continue

        status_label = "Present" if rec.status == "Present" else "Absent"
        title = f"{subject_name} Class Complete • {status_label}"

        presence_summary = f"Class Presence: {class_presence_pct}% ({total_present}/{total_enrolled})"
        student_stats = stats_map.get(rec.student_id)
        if student_stats:
            p_cnt, t_cnt, s_pct = student_stats
            subject_summary = f"Your Attendance: {s_pct}% ({p_cnt}/{t_cnt})"
        else:
            s_pct = 100 if status_label == "Present" else 0
            subject_summary = f"Your Attendance: {s_pct}%"

        body = (
            f"This {subject_name}{code_part} class is complete. "
            f"You are marked {status_label}. "
            f"{presence_summary} • {subject_summary}."
        )

        total_sent += send_push_to_users(
            user_ids=[user_id],
            title=title,
            body=body,
            data={
                "type": "attendance_completed",
                "session_id": str(session.id),
                "subject_id": str(session.subject_id or ""),
                "status": status_label,
                "class_presence_pct": str(class_presence_pct),
                "student_subject_pct": str(s_pct),
            },
            pref_field="attendance_alerts",
        )

    return total_sent
