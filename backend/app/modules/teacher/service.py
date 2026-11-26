from app.config.database import db
import re
from app.modules.teacher.model import Teacher
from app.modules.users.model import User
from fastapi.responses import JSONResponse


def save_teacher_profile(user_id: int, profile_data: dict):
    try:
        user = User.query.filter(User.id == user_id).first()
        if not user:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "User not found"}
            )

        employee_code = (
            profile_data.get("employee_code")
            or profile_data.get("faculty_id")
            or profile_data.get("identifier")
        )
        phone = profile_data.get("phone")
        photo = (
            profile_data.get("profile_image")
            or profile_data.get("photo")
            or profile_data.get("photo_url")
        )

        if employee_code:
            clean_code = str(employee_code).strip()
            existing = Teacher.query.filter(
                Teacher.employee_code == clean_code,
                Teacher.user_id != user_id
            ).first()
            if existing:
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "message": f"Employee code '{clean_code}' is already registered with another faculty member."
                    }
                )

        teacher = Teacher.query.filter(Teacher.user_id == user_id).first()
        if not teacher:
            teacher = Teacher(user_id=user_id)
            db.session.add(teacher)

        name = profile_data.get("name") or profile_data.get("username")
        email = profile_data.get("email")
        qualification = profile_data.get("qualification")
        specialization = profile_data.get("specialization") or profile_data.get("department")

        if name:
            user.username = str(name).strip()
        if email:
            user.email = str(email).strip().lower()
        if photo:
            user.profile_image = photo
        if qualification is not None:
            teacher.qualification = str(qualification).strip() or None
        if specialization is not None:
            teacher.specialization = str(specialization).strip() or None
        if employee_code is not None:
            teacher.employee_code = str(employee_code).strip() or None
        if phone is not None:
            teacher.phone = str(phone).strip() or None

        db.session.commit()

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Teacher profile saved successfully",
                "data": teacher.to_dict()
            }
        )

    except Exception as e:
        db.session.rollback()
        print("Save teacher profile error:", str(e))
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Internal Server Error",
                "error": str(e)
            }
        )


def get_teacher_profile(user_id: int):
    try:
        teacher = Teacher.query.filter(Teacher.user_id == user_id).first()
        if not teacher:
            user = User.query.filter(User.id == user_id).first()
            if user and user.role == "teacher":
                teacher = Teacher(user_id=user_id)
                db.session.add(teacher)
                db.session.commit()
            else:
                return JSONResponse(
                    status_code=404,
                    content={
                        "success": False,
                        "message": "Teacher profile not found"
                    }
                )

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": teacher.to_dict()
            }
        )

    except Exception as e:
        print("Get teacher profile error:", str(e))
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Internal Server Error",
                "error": str(e)
            }
        )


def get_all_teachers():
    try:
        teachers = Teacher.query.all()
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": [t.to_dict() for t in teachers]
            }
        )
    except Exception as e:
        print("Get all teachers error:", str(e))
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Internal Server Error",
                "error": str(e)
            }
        )


def get_teacher_courses(user_id: int):
    from app.modules.course.service import get_teacher_assigned_courses
    return get_teacher_assigned_courses(user_id)


def process_attendance_scan(user_id: int, scan_data: dict):
    from app.modules.attendance.service import record_attendance_session
    return record_attendance_session(user_id, scan_data)


def get_attendance_history(user_id: int):
    from app.modules.attendance.service import get_attendance_sessions_history
    return get_attendance_sessions_history(user_id)


def get_teacher_students(user_id: int):
    from sqlalchemy import or_
    from app.modules.course.model import Course, Subject, CourseEnrollment
    from app.modules.teacher.model import Teacher, TeacherAssignment
    from app.modules.student.model import Student
    from app.modules.attendance.model import AttendanceSession, AttendanceRecord

    try:
        user = User.query.filter(User.id == user_id).first()
        if not user or user.role != "teacher":
            return JSONResponse(
                status_code=403,
                content={"success": False, "message": "Only faculty members can view assigned students"}
            )

        teacher = Teacher.query.filter(Teacher.user_id == user_id).first()
        course_ids = []
        if teacher:
            assignments = TeacherAssignment.query.filter(
                TeacherAssignment.teacher_id == teacher.id,
                or_(TeacherAssignment.status.is_(None), TeacherAssignment.status != "inactive"),
            ).all()
            raw_cids = [
                a.course_id or (a.course_subject.course_id if a.course_subject else None)
                for a in assignments
            ]
            direct_subs = Subject.query.filter(Subject.teacher_id == teacher.id).all()
            raw_cids.extend([s.course_id for s in direct_subs if s.course_id])
            course_ids = list(dict.fromkeys([cid for cid in raw_cids if cid]))

        enrollments = []
        if course_ids:
            enrollments = CourseEnrollment.query.filter(
                CourseEnrollment.course_id.in_(course_ids),
                CourseEnrollment.status == "active"
            ).all()

        students = []
        if enrollments:
            student_ids = list(dict.fromkeys([e.student_id for e in enrollments]))
            students = Student.query.filter(Student.id.in_(student_ids)).all()
        elif course_ids:
            students = Student.query.filter(Student.course_id.in_(course_ids)).all()

        # Teacher sessions (only confirmed sessions count)
        teacher_session_ids = []
        if teacher:
            sessions = AttendanceSession.query.filter(
                AttendanceSession.teacher_id == teacher.id,
                AttendanceSession.is_confirmed == True,
            ).all()
            teacher_session_ids = [s.id for s in sessions]

        total_sessions_count = len(teacher_session_ids)

        student_data_list = []
        for std in students:
            std_user = std.user
            if not std_user:
                continue

            records = []
            if teacher_session_ids:
                records = AttendanceRecord.query.filter(
                    AttendanceRecord.student_id == std.id,
                    AttendanceRecord.session_id.in_(teacher_session_ids)
                ).all()

            present_count = sum(1 for r in records if r.status in ["Present", "Late"])
            absent_count = sum(1 for r in records if r.status == "Absent")
            late_count = sum(1 for r in records if r.status == "Late")

            if len(records) > 0:
                pct = round((present_count / len(records)) * 100)
            elif total_sessions_count > 0:
                pct = round((present_count / total_sessions_count) * 100)
            else:
                pct = 0

            if len(records) == 0 and total_sessions_count == 0:
                status_label = "Good"
            else:
                status_label = "Good" if pct >= 75 else "Warning" if pct >= 65 else "Critical"

            std_course_rel = std.enrolled_course.code if getattr(std, "enrolled_course", None) else None
            course_title = std.course or std_course_rel or (enrollments[0].course.code if enrollments and enrollments[0].course else "")
            semester_title = std.current_semester or (enrollments[0].semester if enrollments else "") or "Semester 1"

            nums = re.findall(r"\d+", str(semester_title)) if semester_title else []
            sem_num = int(nums[0]) if nums else 1

            student_data_list.append({
                "id": std.id,
                "student_id": std.id,
                "user_id": std_user.id,
                "name": std_user.username,
                "email": std_user.email,
                "roll_number": std.roll_number or f"STU-{1000 + std.id}",
                "course_id": std.course_id,
                "course": course_title,
                "semester_id": std.semester_id,
                "semester_number": sem_num,
                "phone": std.phone or "",
                "profile_image": std_user.profile_image,
                "attendance_percentage": pct,
                "total_classes": len(records) if records else total_sessions_count,
                "attended_classes": present_count,
                "absent_classes": absent_count,
                "late_classes": late_count,
                "status": status_label,
                "has_face": bool(std.face_embedding or std_user.profile_image),
                "has_voice": bool(std.voice_embedding),
            })

        # Sort with lowest attendance on top or by name
        student_data_list.sort(key=lambda s: s["name"].lower() if s["name"] else "")

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": student_data_list
            }
        )
    except Exception as e:
        print("Get teacher students error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to fetch teacher students", "error": str(e)}
        )


def get_teacher_reports(user_id: int):
    from sqlalchemy import or_
    from app.modules.course.model import Course, Subject, CourseEnrollment
    from app.modules.teacher.model import Teacher, TeacherAssignment
    from app.modules.student.model import Student
    from app.modules.attendance.model import AttendanceSession, AttendanceRecord

    try:
        user = User.query.filter(User.id == user_id).first()
        if not user or user.role != "teacher":
            return JSONResponse(
                status_code=403,
                content={"success": False, "message": "Only faculty members can view reports"}
            )

        teacher = Teacher.query.filter(Teacher.user_id == user_id).first()
        sessions = []
        assigned_subjects = []
        assigned_course_ids = set()

        if teacher:
            sessions = AttendanceSession.query.filter(
                AttendanceSession.teacher_id == teacher.id,
                AttendanceSession.is_confirmed == True,
            ).order_by(AttendanceSession.created_at.desc()).all()

            assignments = TeacherAssignment.query.filter(
                TeacherAssignment.teacher_id == teacher.id,
                or_(TeacherAssignment.status.is_(None), TeacherAssignment.status != "inactive"),
            ).all()
            seen_sub_ids = set()
            for a in assignments:
                c_id = a.course_id or (a.course_subject.course_id if a.course_subject else None)
                if c_id:
                    assigned_course_ids.add(c_id)
                sub_obj = a.subject or (a.course_subject.subject if a.course_subject else None)
                if sub_obj and sub_obj.id not in seen_sub_ids:
                    seen_sub_ids.add(sub_obj.id)
                    assigned_subjects.append(sub_obj)

            direct_subs = Subject.query.filter(Subject.teacher_id == teacher.id).all()
            for sub_obj in direct_subs:
                if sub_obj.course_id:
                    assigned_course_ids.add(sub_obj.course_id)
                if sub_obj.id not in seen_sub_ids:
                    seen_sub_ids.add(sub_obj.id)
                    assigned_subjects.append(sub_obj)

        total_sessions = len(sessions)
        total_present_sum = sum(s.total_present for s in sessions)
        total_enrolled_sum = sum(s.total_enrolled for s in sessions)

        overall_avg = round((total_present_sum / total_enrolled_sum) * 100) if total_enrolled_sum > 0 else 0

        # Real monitored student count across assigned courses
        monitored_student_ids = set()
        course_enrolled_map = {}
        for cid in assigned_course_ids:
            enr_rows = CourseEnrollment.query.filter(
                CourseEnrollment.course_id == cid,
                CourseEnrollment.status == "active",
            ).all()
            if enr_rows:
                course_enrolled_map[cid] = len(enr_rows)
                for row in enr_rows:
                    monitored_student_ids.add(row.student_id)
            else:
                direct_stds = Student.query.filter(Student.course_id == cid).all()
                course_enrolled_map[cid] = len(direct_stds)
                for std in direct_stds:
                    monitored_student_ids.add(std.id)

        # Subject-wise breakdown from conducted sessions
        subject_dict = {}
        for s in sessions:
            sub_name = s.subject.name if s.subject else "Subject"
            if sub_name not in subject_dict:
                subject_dict[sub_name] = {
                    "subject": sub_name,
                    "code": s.subject.code if s.subject else "",
                    "course": s.course.name if s.course else "",
                    "sessions_count": 0,
                    "total_present": 0,
                    "total_enrolled": 0,
                }
            subject_dict[sub_name]["sessions_count"] += 1
            subject_dict[sub_name]["total_present"] += s.total_present
            subject_dict[sub_name]["total_enrolled"] += s.total_enrolled

        subject_reports = []
        for sub_name, val in subject_dict.items():
            rate = round((val["total_present"] / val["total_enrolled"]) * 100) if val["total_enrolled"] > 0 else 0
            subject_reports.append({
                "subject": sub_name,
                "code": val["code"],
                "course": val["course"],
                "sessions_count": val["sessions_count"],
                "attendance_rate": rate,
                "enrolled_count": round(val["total_enrolled"] / max(val["sessions_count"], 1)),
            })

        # Add assigned subjects that have not had a session recorded yet
        reported_names = {r["subject"] for r in subject_reports}
        for sub in assigned_subjects:
            if sub.name not in reported_names:
                subject_reports.append({
                    "subject": sub.name,
                    "code": sub.code or "",
                    "course": sub.course.name if sub.course else "",
                    "sessions_count": 0,
                    "attendance_rate": 0,
                    "enrolled_count": course_enrolled_map.get(sub.course_id, 0),
                })

        # Daily trends from real sessions (last 7 sessions)
        daily_trends = []
        for s in sessions[:7]:
            rate = round((s.total_present / s.total_enrolled) * 100) if s.total_enrolled > 0 else 0
            daily_trends.append({
                "date": s.created_at.strftime("%d %b") if s.created_at else "Today",
                "subject": s.subject.name if s.subject else "Lecture",
                "rate": rate,
                "present": s.total_present,
                "absent": s.total_absent,
            })

        # Low-attendance students (< 75%) computed from real attendance records
        absent_students = []
        session_ids = [s.id for s in sessions]
        if session_ids:
            records = AttendanceRecord.query.filter(AttendanceRecord.session_id.in_(session_ids)).all()
            student_stats = {}
            for r in records:
                if not r.student or not r.student.user:
                    continue
                sid = r.student_id
                if sid not in student_stats:
                    student_stats[sid] = {
                        "name": r.student.user.username,
                        "roll_number": r.student.roll_number or f"STU-{1000 + sid}",
                        "course": r.student.course or "",
                        "total": 0,
                        "present": 0,
                        "absent": 0,
                    }
                student_stats[sid]["total"] += 1
                if r.status in ["Present", "Late"]:
                    student_stats[sid]["present"] += 1
                elif r.status == "Absent":
                    student_stats[sid]["absent"] += 1

            for stats in student_stats.values():
                if stats["total"] > 0:
                    pct = round((stats["present"] / stats["total"]) * 100)
                    if pct < 75:
                        absent_students.append({
                            "name": stats["name"],
                            "roll_number": stats["roll_number"],
                            "course": stats["course"],
                            "attendance_percentage": pct,
                            "missed_classes": stats["absent"],
                            "status": "Critical" if pct < 65 else "Warning",
                        })
            absent_students.sort(key=lambda item: item["attendance_percentage"])

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": {
                    "summary": {
                        "average_attendance": overall_avg,
                        "total_sessions": total_sessions,
                        "total_students_monitored": len(monitored_student_ids),
                        "critical_absentees_count": len(absent_students),
                    },
                    "subject_reports": subject_reports,
                    "daily_trends": daily_trends,
                    "absent_students": absent_students,
                }
            }
        )
    except Exception as e:
        print("Get teacher reports error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to fetch reports", "error": str(e)}
        )


