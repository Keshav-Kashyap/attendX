import re
from datetime import datetime, time, timedelta
from sqlalchemy import or_, desc
from app.config.database import db
from app.modules.student.model import Student
from app.modules.users.model import User
from app.modules.course.model import (
    Course,
    Subject,
    CourseEnrollment,
    Semester,
    SubjectTimetable,
)
from app.modules.teacher.model import Teacher, TeacherAssignment
from app.modules.attendance.model import AttendanceSession, AttendanceRecord
from app.modules.course.timetable_helper import parse_schedule_slots, INT_TO_DAY_NAME
from fastapi.responses import JSONResponse


def save_student_profile(user_id: int, profile_data: dict):
    try:
        user = User.query.filter(User.id == user_id).first()
        if not user:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "User not found"}
            )

        student = Student.query.filter(Student.user_id == user_id).first()
        if not student:
            student = Student(user_id=user_id)
            db.session.add(student)
            db.session.flush()

        roll_number = profile_data.get("roll_number")
        course_id = profile_data.get("course_id")
        phone = profile_data.get("phone")
        photo = profile_data.get("profile_image") or profile_data.get("photo") or profile_data.get("photo_url")
        voice = profile_data.get("voice") or profile_data.get("voice_sample")

        # Validation: At least one biometric (photo/face or voice sample) is required
        has_face = bool(photo or student.face_embedding or user.profile_image)
        has_voice = bool(voice or student.voice_embedding)

        if not has_face and not has_voice:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "At least one biometric (photo or voice sample) is required to complete student profile."
                }
            )

        # Check unique roll number if provided
        if roll_number:
            roll_number = str(roll_number).strip()
            existing = Student.query.filter(
                Student.roll_number == roll_number,
                Student.user_id != user_id
            ).first()
            if existing:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "message": f"Roll number '{roll_number}' is already registered with another student."
                    }
                )

        # Store photo in User model as profile_image and extract face embedding in backend
        face_emb = profile_data.get("face_embedding")
        if face_emb and isinstance(face_emb, (list, dict)):
            student.face_embedding = face_emb

        if "profile_image" in profile_data or "photo" in profile_data or "photo_url" in profile_data:
            raw_photo = profile_data.get("profile_image") if "profile_image" in profile_data else (profile_data.get("photo") or profile_data.get("photo_url"))
            if not raw_photo:
                user.profile_image = None
                student.face_embedding = None
            else:
                photo_str = str(raw_photo).strip()
                from app.modules.attendance.ml.face_pipeline import extract_face_embedding
                from app.utils.cloudinary import upload_image_to_cloudinary

                is_new_photo = (photo_str != (user.profile_image or ""))
                needs_embedding = is_new_photo or (not student.face_embedding)

                if needs_embedding:
                    computed_face_emb, face_err = extract_face_embedding(photo_str)
                    if computed_face_emb:
                        student.face_embedding = computed_face_emb
                    elif face_emb:
                        student.face_embedding = face_emb
                    elif face_err and not student.face_embedding:
                        return JSONResponse(
                            status_code=400,
                            content={"success": False, "message": face_err}
                        )

                if is_new_photo:
                    # Upload student photo to Cloudinary
                    public_id = f"student_{student.id or user_id}_{student.roll_number or user_id}"
                    cloudinary_url = upload_image_to_cloudinary(
                        photo_str,
                        folder="attendx/students",
                        public_id=public_id
                    )
                    user.profile_image = cloudinary_url or photo_str

        # Extract voice embedding in backend
        voice_emb = profile_data.get("voice_embedding")
        if voice_emb and isinstance(voice_emb, (list, dict)):
            student.voice_embedding = voice_emb

        if voice:
            from app.modules.attendance.ml.voice_pipeline import extract_voice_embedding
            computed_voice_emb, voice_err = extract_voice_embedding(voice)
            if computed_voice_emb:
                student.voice_embedding = computed_voice_emb
            elif voice_emb:
                student.voice_embedding = voice_emb

        # Update student and user fields cleanly
        name = profile_data.get("name") or profile_data.get("username")
        email = profile_data.get("email")
        if name:
            user.username = str(name).strip()
        if email:
            user.email = str(email).strip().lower()

        if roll_number is not None:
            student.roll_number = str(roll_number).strip() or None
        if phone is not None:
            student.phone = str(phone).strip() or None

        # Manage course membership and semester strictly via CourseEnrollment & Student
        semester_val = profile_data.get("semester_id") or profile_data.get("semester_number") or profile_data.get("semester")
        if course_id or semester_val:
            from app.modules.course.model import Course, Semester, CourseEnrollment
            import re

            enr = CourseEnrollment.query.filter(CourseEnrollment.student_id == student.id).first()
            target_course_id = None
            if course_id:
                target_course = Course.query.filter(Course.id == course_id).first()
                if target_course:
                    target_course_id = target_course.id
            if not target_course_id and enr:
                target_course_id = enr.course_id

            sem_obj = None
            target_sem_num = None
            if semester_val:
                try:
                    sem_num_candidate = int(semester_val)
                    # Check if it directly matches a semester ID
                    sem_by_id = Semester.query.filter(Semester.id == sem_num_candidate).first()
                    if sem_by_id:
                        sem_obj = sem_by_id
                    else:
                        target_sem_num = sem_num_candidate
                except (ValueError, TypeError):
                    nums = re.findall(r"\d+", str(semester_val))
                    if nums:
                        target_sem_num = int(nums[0])

            if not sem_obj and target_course_id and target_sem_num:
                sem_obj = Semester.query.filter(
                    Semester.course_id == target_course_id,
                    Semester.semester_number == target_sem_num
                ).first()
                if not sem_obj:
                    sem_obj = Semester(course_id=target_course_id, semester_number=target_sem_num)
                    db.session.add(sem_obj)
                    db.session.flush()

            if sem_obj:
                student.semester_id = sem_obj.id

            if enr:
                if target_course_id:
                    enr.course_id = target_course_id
                if sem_obj:
                    enr.semester_id = sem_obj.id
                enr.status = "active"
            elif target_course_id:
                enr = CourseEnrollment(
                    student_id=student.id,
                    course_id=target_course_id,
                    semester_id=sem_obj.id if sem_obj else None,
                    status="active"
                )
                db.session.add(enr)

        db.session.commit()

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Student profile and biometrics saved successfully",
                "data": student.to_dict()
            }
        )

    except Exception as e:
        db.session.rollback()
        print("Save student profile error:", str(e))
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Internal Server Error",
                "error": str(e)
            }
        )


def get_student_profile(user_id: int):
    try:
        student = Student.query.filter(Student.user_id == user_id).first()
        if not student:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "message": "Student profile not found. Please complete profile registration."
                }
            )

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": student.to_dict()
            }
        )

    except Exception as e:
        print("Get student profile error:", str(e))
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Internal Server Error",
                "error": str(e)
            }
        )


def _get_or_create_student(user_id: int):
    user = User.query.filter(User.id == user_id).first()
    if not user:
        return None, None

    student = Student.query.filter(Student.user_id == user_id).first()
    if not student:
        student = Student(
            user_id=user_id,
            roll_number=user.identifier or f"STD-{user_id}"
        )
        db.session.add(student)
        db.session.flush()

    return user, student


def _get_student_courses_and_subjects(student: Student):
    enrollments = CourseEnrollment.query.filter(
        CourseEnrollment.student_id == student.id,
        CourseEnrollment.status == "active"
    ).all()

    enrolled_course_ids = [e.course_id for e in enrollments]
    primary_course = None
    semester_name = student.semester or "Semester 1"

    if enrollments:
        primary_course = enrollments[0].course
        semester_name = enrollments[0].semester or semester_name
    elif student.course_id:
        primary_course = Course.query.filter(Course.id == student.course_id).first()
        if primary_course:
            enrolled_course_ids.append(primary_course.id)

    # Fallback to first course if student has no enrollments yet
    if not primary_course:
        primary_course = Course.query.first()
        if primary_course:
            enrolled_course_ids.append(primary_course.id)
            auto_enr = CourseEnrollment(
                student_id=student.id,
                course_id=primary_course.id,
                status="active"
            )
            db.session.add(auto_enr)
            db.session.flush()

    subjects = []
    if enrolled_course_ids:
        subject_query = Subject.query.filter(Subject.course_id.in_(enrolled_course_ids))
        if student.semester_id:
            subject_query = subject_query.filter(
                or_(Subject.semester_id == student.semester_id, Subject.semester_id.is_(None))
            )
        subjects = subject_query.all()
        if not subjects:
            subjects = Subject.query.filter(Subject.course_id.in_(enrolled_course_ids)).all()

    return primary_course, semester_name, subjects, enrolled_course_ids


def _get_subject_teacher_name(sub: Subject) -> str:
    if sub.teacher and sub.teacher.user:
        return sub.teacher.user.username
    if getattr(sub, "assignments", None):
        pa = sub.assignments[0]
        if pa.teacher and pa.teacher.user:
            return pa.teacher.user.username
    return "Faculty"


def _get_subject_day_slots(sub: Subject, target_day: int) -> list[dict]:
    slots_found = []
    if getattr(sub, "assignments", None):
        for a in sub.assignments:
            if getattr(a, "timetable_slots", None):
                for st in a.timetable_slots:
                    if st.day_of_week == target_day:
                        slots_found.append({
                            "start_time": st.start_time,
                            "end_time": st.end_time,
                            "room": a.room or sub.room or "Room 204",
                        })
    if not slots_found and sub.schedule:
        for p in parse_schedule_slots(sub.schedule):
            if p.get("day_of_week") == target_day:
                slots_found.append({
                    "start_time": p.get("start_time"),
                    "end_time": p.get("end_time"),
                    "room": sub.room or "Room 204",
                })
    return slots_found


def _compute_student_attendance_stats(student: Student, subjects: list, enrolled_course_ids: list):
    """Computes overall and subject-wise attendance stats across conducted sessions only."""
    subject_ids = [s.id for s in subjects]

    if subject_ids:
        conducted_sessions = AttendanceSession.query.filter(
            AttendanceSession.subject_id.in_(subject_ids),
            AttendanceSession.is_confirmed == True,
        ).all()
        conducted_session_ids = [s.id for s in conducted_sessions]
    elif enrolled_course_ids:
        conducted_sessions = AttendanceSession.query.filter(
            AttendanceSession.course_id.in_(enrolled_course_ids),
            AttendanceSession.is_confirmed == True,
        ).all()
        conducted_session_ids = [s.id for s in conducted_sessions]
    else:
        conducted_sessions = []
        conducted_session_ids = []

    all_student_records = AttendanceRecord.query.filter(
        AttendanceRecord.student_id == student.id
    ).all()

    if conducted_session_ids:
        relevant_session_id_set = set(conducted_session_ids)
        attended_count = sum(
            1
            for r in all_student_records
            if r.status == "Present" and r.session_id in relevant_session_id_set
        )
        total_classes_count = len(conducted_session_ids)
    else:
        attended_count = sum(1 for r in all_student_records if r.status == "Present")
        total_classes_count = len(all_student_records)

    absent_count = max(0, total_classes_count - attended_count)
    attendance_percentage = (
        round((attended_count / total_classes_count) * 100, 1)
        if total_classes_count > 0
        else 0.0
    )

    subject_wise = []
    for sub in subjects:
        sub_sessions = AttendanceSession.query.filter(
            AttendanceSession.subject_id == sub.id,
            AttendanceSession.is_confirmed == True,
        ).all()
        sub_session_ids = [s.id for s in sub_sessions]
        sub_total = len(sub_session_ids)

        sub_attended = 0
        if sub_session_ids:
            sub_attended = AttendanceRecord.query.filter(
                AttendanceRecord.student_id == student.id,
                AttendanceRecord.session_id.in_(sub_session_ids),
                AttendanceRecord.status == "Present",
            ).count()

        if sub_total == 0:
            sub_records = AttendanceRecord.query.join(AttendanceSession).filter(
                AttendanceRecord.student_id == student.id,
                AttendanceSession.subject_id == sub.id,
                AttendanceSession.is_confirmed == True,
            ).all()
            if sub_records:
                sub_total = len(sub_records)
                sub_attended = len([r for r in sub_records if r.status == "Present"])

        sub_absent = max(0, sub_total - sub_attended)
        sub_percentage = round((sub_attended / sub_total) * 100, 1) if sub_total > 0 else 0.0

        subject_wise.append({
            "subject_id": sub.id,
            "subject_name": sub.name,
            "subject_code": sub.code,
            "room": sub.room or "Room 204",
            "schedule": sub.schedule or "Mon, Wed, Fri - 10:00 AM",
            "teacher_name": _get_subject_teacher_name(sub),
            "total_classes": sub_total,
            "attended_classes": sub_attended,
            "absent_classes": sub_absent,
            "percentage": sub_percentage,
            "status": "Safe" if sub_percentage >= 75.0 else ("Critical" if sub_total > 0 else "Pending"),
        })

    return total_classes_count, attended_count, absent_count, attendance_percentage, subject_wise


def _build_student_recent_classes(student: Student, subjects: list, lookback_days: int = 7, limit: int | None = None):
    """
    Combines conducted AttendanceSessions (Present / Absent) with past scheduled
    timetable classes where the teacher never took attendance (Class Not Held).
    """
    subject_ids = [s.id for s in subjects]
    student_records = AttendanceRecord.query.filter(
        AttendanceRecord.student_id == student.id
    ).all()
    records_by_session = {r.session_id: r for r in student_records}

    session_query = AttendanceSession.query.filter(AttendanceSession.is_confirmed == True)
    if subject_ids:
        session_query = session_query.filter(
            or_(
                AttendanceSession.subject_id.in_(subject_ids),
                AttendanceSession.id.in_(list(records_by_session.keys())) if records_by_session else False,
            )
        )
    elif records_by_session:
        session_query = session_query.filter(
            AttendanceSession.id.in_(list(records_by_session.keys()))
        )
    else:
        session_query = session_query.filter(AttendanceSession.id == -1)

    conducted_sessions = session_query.order_by(
        AttendanceSession.date.desc(),
        AttendanceSession.id.desc(),
    ).all()

    items = []
    conducted_keys = set()

    for sess in conducted_sessions:
        sub = sess.subject
        crs = sess.course
        rec = records_by_session.get(sess.id)
        if sess.subject_id and sess.date:
            conducted_keys.add((sess.subject_id, sess.date.date()))

        status_val = rec.status if rec else "Absent"
        t_name = sess.teacher.user.username if (sess.teacher and sess.teacher.user) else "Faculty"
        dt_obj = sess.date or (rec.matched_at if rec else None) or datetime.now()
        dt_str = dt_obj.strftime("%d %b %Y")
        time_str = dt_obj.strftime("%I:%M %p")

        items.append({
            "id": rec.id if rec else f"sess-{sess.id}",
            "session_id": sess.id,
            "session_code": sess.session_code,
            "subject_id": sess.subject_id,
            "subject_name": sub.name if sub else (crs.name if crs else "Class Session"),
            "subject_code": sub.code if sub else "",
            "course_name": crs.name if crs else "",
            "course_code": crs.code if crs else "",
            "room": sess.room or (sub.room if sub else "Room 204"),
            "teacher_name": t_name,
            "status": status_val,
            "is_conducted": True,
            "confidence": (rec.confidence if rec and rec.confidence else None),
            "date": dt_obj.isoformat(),
            "formatted_date": dt_str,
            "time": time_str,
            "_sort_dt": dt_obj,
        })

    # Include past scheduled timetable slots over recent days where attendance was not taken
    now = datetime.now()
    today_date = now.date()
    current_time = now.time()

    for days_back in range(0, lookback_days):
        target_date = today_date - timedelta(days=days_back)
        target_day = target_date.isoweekday()
        for sub in subjects:
            if (sub.id, target_date) in conducted_keys:
                continue

            day_slots = _get_subject_day_slots(sub, target_day)
            for s in day_slots:
                st_obj = s.get("start_time")
                et_obj = s.get("end_time")
                if days_back == 0 and et_obj and current_time <= et_obj:
                    # Class today is still upcoming or in progress
                    continue

                slot_start = st_obj or time(9, 0)
                slot_dt = datetime.combine(target_date, slot_start)
                time_str = (
                    f"{st_obj.strftime('%I:%M %p')} - {et_obj.strftime('%I:%M %p')}"
                    if (st_obj and et_obj)
                    else (sub.schedule or "")
                )

                items.append({
                    "id": f"not-held-{sub.id}-{target_date.isoformat()}-{slot_start.strftime('%H%M')}",
                    "session_id": None,
                    "session_code": None,
                    "subject_id": sub.id,
                    "subject_name": sub.name,
                    "subject_code": sub.code,
                    "course_name": sub.course.name if sub.course else "",
                    "course_code": sub.course.code if sub.course else "",
                    "room": s.get("room") or sub.room or "Room 204",
                    "teacher_name": _get_subject_teacher_name(sub),
                    "status": "Class Not Held",
                    "is_conducted": False,
                    "confidence": None,
                    "date": slot_dt.isoformat(),
                    "formatted_date": target_date.strftime("%d %b %Y"),
                    "time": time_str,
                    "_sort_dt": slot_dt,
                })

    items.sort(key=lambda x: x["_sort_dt"], reverse=True)
    for it in items:
        it.pop("_sort_dt", None)

    return items[:limit] if limit else items


def get_student_dashboard(user_id: int):
    try:
        user, student = _get_or_create_student(user_id)
        if not user or not student:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Student profile not found"}
            )

        course, semester_name, subjects, enrolled_course_ids = _get_student_courses_and_subjects(student)

        (
            total_classes_count,
            attended_count,
            absent_count,
            attendance_percentage,
            subject_wise,
        ) = _compute_student_attendance_stats(student, subjects, enrolled_course_ids)

        if attendance_percentage >= 75.0:
            status_text = "Safe (> 75%)"
        elif total_classes_count > 0:
            status_text = "At Risk (< 75%)"
        else:
            status_text = "No Classes Recorded"

        # 4. Today's Classes & Next Class Calculation
        now = datetime.now()
        current_day = now.isoweekday()  # 1 = Mon ... 7 = Sun
        current_time = now.time()

        # Confirmed attendance sessions today (even if taken before scheduled slot time)
        today_start = datetime.combine(now.date(), datetime.min.time())
        today_end = datetime.combine(now.date(), datetime.max.time())
        today_confirmed_sessions = AttendanceSession.query.filter(
            AttendanceSession.is_confirmed == True,
            AttendanceSession.date >= today_start,
            AttendanceSession.date <= today_end,
        ).all()
        today_confirmed_count_by_sub = {}
        for s in today_confirmed_sessions:
            if s.subject_id:
                today_confirmed_count_by_sub[s.subject_id] = today_confirmed_count_by_sub.get(s.subject_id, 0) + 1
        today_confirmed_subject_ids = set(today_confirmed_count_by_sub.keys())
        today_slots_count_by_sub = {}

        today_slots = []
        for sub in subjects:
            teacher_name = "Faculty"
            if sub.teacher and sub.teacher.user:
                teacher_name = sub.teacher.user.username
            elif sub.assignments and sub.assignments[0].teacher and sub.assignments[0].teacher.user:
                teacher_name = sub.assignments[0].teacher.user.username

            slots_found = []
            if sub.assignments:
                for a in sub.assignments:
                    if getattr(a, "timetable_slots", None):
                        for st in a.timetable_slots:
                            if st.day_of_week == current_day:
                                slots_found.append({
                                    "start_time": st.start_time,
                                    "end_time": st.end_time,
                                    "room": a.room or sub.room or "Room 204",
                                })

            if not slots_found and sub.schedule:
                parsed = parse_schedule_slots(sub.schedule)
                for p in parsed:
                    if p.get("day_of_week") == current_day:
                        slots_found.append({
                            "start_time": p.get("start_time"),
                            "end_time": p.get("end_time"),
                            "room": sub.room or "Room 204",
                        })

            for s in slots_found:
                today_slots_count_by_sub[sub.id] = today_slots_count_by_sub.get(sub.id, 0) + 1
                st_obj = s.get("start_time")
                et_obj = s.get("end_time")
                time_str = f"{st_obj.strftime('%I:%M %p')} - {et_obj.strftime('%I:%M %p')}" if (st_obj and et_obj) else (sub.schedule or "10:00 AM - 11:30 AM")

                is_confirmed_today = sub.id in today_confirmed_subject_ids
                status_label = "Upcoming"
                if is_confirmed_today:
                    status_label = "Completed"
                elif st_obj and et_obj:
                    if current_time < st_obj:
                        status_label = "Upcoming"
                    elif st_obj <= current_time <= et_obj:
                        status_label = "In Progress"
                    else:
                        status_label = "Completed"

                today_slots.append({
                    "subject_id": sub.id,
                    "subject_name": sub.name,
                    "subject_code": sub.code,
                    "course_name": course.name if course else "",
                    "course_code": course.code if course else "",
                    "room": s.get("room") or sub.room or "Room 204",
                    "teacher_name": teacher_name,
                    "time": time_str,
                    "start_time_str": st_obj.strftime('%I:%M %p') if st_obj else "10:00 AM",
                    "end_time_str": et_obj.strftime('%I:%M %p') if et_obj else "11:30 AM",
                    "start_time_sort": st_obj.isoformat() if st_obj else "00:00",
                    "status": status_label,
                    "day_name": INT_TO_DAY_NAME.get(current_day, "Today"),
                })

        today_slots.sort(key=lambda x: x["start_time_sort"])

        today_remaining = [
            slot for slot in today_slots
            if slot["status"] in ["In Progress", "Upcoming"]
        ]
        next_class = today_remaining[0] if today_remaining else None
        next_day_slots = []

        # If no more classes today, find the upcoming scheduled session(s) in upcoming days
        if not next_class and subjects:
            skipped_upcoming_subs = set()
            for days_ahead in range(1, 8):
                target_day = ((current_day - 1 + days_ahead) % 7) + 1
                upcoming_candidates = []
                for sub in subjects:
                    # If this subject had an extra/early confirmed session today (more than today's scheduled slots),
                    # skip its very next upcoming occurrence (e.g., tomorrow's class taken today)
                    if (
                        today_confirmed_count_by_sub.get(sub.id, 0) > today_slots_count_by_sub.get(sub.id, 0)
                        and sub.id not in skipped_upcoming_subs
                    ):
                        has_slot_on_target = False
                        if sub.assignments:
                            for a in sub.assignments:
                                if getattr(a, "timetable_slots", None) and any(
                                    st.day_of_week == target_day for st in a.timetable_slots
                                ):
                                    has_slot_on_target = True
                                    break
                        if not has_slot_on_target and sub.schedule:
                            if any(p.get("day_of_week") == target_day for p in parse_schedule_slots(sub.schedule)):
                                has_slot_on_target = True
                        if has_slot_on_target:
                            skipped_upcoming_subs.add(sub.id)
                            continue

                    teacher_name = _get_subject_teacher_name(sub)
                    if sub.schedule:
                        parsed = parse_schedule_slots(sub.schedule)
                        for p in parsed:
                            if p.get("day_of_week") == target_day:
                                st_obj = p.get("start_time")
                                et_obj = p.get("end_time")
                                time_str = f"{st_obj.strftime('%I:%M %p')} - {et_obj.strftime('%I:%M %p')}" if (st_obj and et_obj) else (sub.schedule or "10:00 AM")
                                day_label = "Tomorrow" if days_ahead == 1 else INT_TO_DAY_NAME.get(target_day, "")
                                upcoming_candidates.append({
                                    "subject_id": sub.id,
                                    "subject_name": sub.name,
                                    "subject_code": sub.code,
                                    "course_name": course.name if course else "",
                                    "course_code": course.code if course else "",
                                    "room": sub.room or "Room 204",
                                    "teacher_name": teacher_name,
                                    "time": time_str,
                                    "start_time_str": st_obj.strftime('%I:%M %p') if st_obj else "10:00 AM",
                                    "end_time_str": et_obj.strftime('%I:%M %p') if et_obj else "11:30 AM",
                                    "start_time_sort": st_obj.isoformat() if st_obj else "00:00",
                                    "status": f"Scheduled ({day_label})",
                                    "day_name": day_label,
                                })
                if upcoming_candidates:
                    upcoming_candidates.sort(key=lambda x: x["start_time_sort"])
                    next_class = upcoming_candidates[0]
                    next_day_slots = upcoming_candidates
                    break

        upcoming_classes_payload = today_remaining if today_remaining else next_day_slots

        # 5. Recent Classes (Conducted Sessions + Unmarked Past Scheduled Classes)
        recent_classes = _build_student_recent_classes(student, subjects, lookback_days=7, limit=10)

        db.session.commit()

        summary = {
            "total_classes": total_classes_count,
            "attended_classes": attended_count,
            "absent_classes": absent_count,
            "attendance_percentage": attendance_percentage,
            "status": status_text,
            "course_name": course.name if course else "Enrolled Course",
            "course_code": course.code if course else "",
            "semester": semester_name,
            "roll_number": student.roll_number or user.identifier or "Student",
            "student_name": user.username,
        }

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": {
                    "summary": summary,
                    "next_class": next_class,
                    "upcoming_classes": upcoming_classes_payload,
                    "recent_classes": recent_classes,
                    "subject_wise": subject_wise,
                }
            }
        )

    except Exception as e:
        db.session.rollback()
        print("Get student dashboard error:", str(e))
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Failed to load student dashboard",
                "error": str(e)
            }
        )


def get_student_attendance_details(user_id: int):
    try:
        user, student = _get_or_create_student(user_id)
        if not user or not student:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Student profile not found"}
            )

        course, semester_name, subjects, enrolled_course_ids = _get_student_courses_and_subjects(student)

        (
            total_classes_count,
            attended_count,
            absent_count,
            attendance_percentage,
            subject_wise,
        ) = _compute_student_attendance_stats(student, subjects, enrolled_course_ids)

        for sw in subject_wise:
            sw["status"] = (
                "Safe (> 75%)"
                if sw["percentage"] >= 75.0
                else ("At Risk (< 75%)" if sw["total_classes"] > 0 else "Pending")
            )

        history_records = _build_student_recent_classes(student, subjects, lookback_days=7)

        db.session.commit()

        summary = {
            "total_classes": total_classes_count,
            "attended_classes": attended_count,
            "absent_classes": absent_count,
            "attendance_percentage": attendance_percentage,
            "status": "Safe (> 75%)" if attendance_percentage >= 75.0 else ("At Risk (< 75%)" if total_classes_count > 0 else "No classes recorded"),
            "course_name": course.name if course else "Enrolled Course",
            "course_code": course.code if course else "",
            "semester": semester_name,
            "roll_number": student.roll_number or user.identifier or "Student",
        }

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": {
                    "summary": summary,
                    "subject_wise": subject_wise,
                    "records": history_records,
                }
            }
        )

    except Exception as e:
        db.session.rollback()
        print("Get student attendance details error:", str(e))
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Failed to load student attendance details",
                "error": str(e)
            }
        )
