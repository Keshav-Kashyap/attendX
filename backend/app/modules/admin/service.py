from app.config.database import db
from datetime import datetime
from sqlalchemy import or_, func, text
from fastapi.responses import JSONResponse
from app.modules.course.model import Course, Semester, Subject, CourseEnrollment
from app.modules.teacher.model import Teacher, TeacherAssignment
from app.modules.student.model import Student
from app.modules.users.model import User
from app.utils.common import hash_password, send_user_welcome_email


def _teacher_conflict_response(conflict_info: dict) -> JSONResponse:
    t_name = conflict_info.get("teacher_name", "Faculty")
    d_name = conflict_info.get("day_name", "the requested day")
    c_start = conflict_info.get("conflict_start", "")
    c_end = conflict_info.get("conflict_end", "")
    c_sub = conflict_info.get("subject_name", "another class")
    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "conflict": True,
            "message": f"Teacher '{t_name}' is not available. Already scheduled on {d_name} ({c_start} - {c_end}) for subject '{c_sub}'. Please select another time slot or teacher.",
            "conflict_details": conflict_info,
        },
    )


def _room_conflict_response(room_name: str, conflict_info: dict) -> JSONResponse:
    d_name = conflict_info.get("day_name", "the requested day")
    c_start = conflict_info.get("conflict_start", "")
    c_end = conflict_info.get("conflict_end", "")
    c_sub = conflict_info.get("subject_name", "another class")
    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "conflict": True,
            "room_conflict": True,
            "message": f"Room '{room_name}' is not available at this time. Already booked on {d_name} ({c_start} - {c_end}) for '{c_sub}'. Please choose another room or change the timing.",
            "conflict_details": conflict_info,
        },
    )


def seed_default_admin_if_empty():
    """
    Ensures at least one active admin account exists in the database.
    Default: admin@gmail.com / admin123
    """
    try:
        admin = User.query.filter(User.role == "admin").first()
        if not admin:
            print("No admin user found. Creating default admin account...")
            default_admin = User(
                username="Admin",
                email="admin@gmail.com",
                password=hash_password("admin123"),
                role="admin",
                auth_provider="email",
                is_active=True,
            )
            db.session.add(default_admin)
            db.session.commit()
            print("Default admin created: admin@gmail.com / admin123")
    except Exception as e:
        db.session.rollback()
        print("Error checking or seeding default admin:", str(e))


# =========================================================================
# 1. COURSE CRUD OPERATIONS
# =========================================================================

def admin_get_all_courses():
    """
    Returns all courses with limited summary metadata and counts.
    Delegates to the unified Course module.
    """
    from app.modules.course.service import get_all_courses
    return get_all_courses()


def admin_create_course(payload: dict):
    """
    Creates a new course.
    Optional fields:
    - semesters: list of semester names (e.g. ["Semester 1", "Semester 2"])
    - default_subjects: optional list of initial subjects
    """
    try:
        name = payload.get("name")
        code = payload.get("code")
        description = payload.get("description")
        semesters = payload.get("semesters") or []

        if not name or not str(name).strip():
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Course name is required."}
            )

        if not code or not str(code).strip():
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Course code is required."}
            )

        clean_code = str(code).strip().upper()
        clean_name = str(name).strip()

        existing = Course.query.filter(func.upper(Course.code) == clean_code).first()
        if existing:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": f"Course code '{clean_code}' already exists."}
            )

        duration_years = int(payload.get("duration_years") or 3)
        total_semesters = int(payload.get("total_semesters") or (duration_years * 2))
        if semesters and len(semesters) > total_semesters:
            total_semesters = len(semesters)
            duration_years = max((total_semesters + 1) // 2, 1)

        course = Course(
            name=clean_name,
            code=clean_code,
            description=str(description).strip() if description else None,
            duration_years=duration_years,
            total_semesters=total_semesters
        )
        db.session.add(course)
        db.session.flush()

        # Generate Semester records for this course
        sem_objs = {}
        for sem_num in range(1, total_semesters + 1):
            sem = Semester(
                course_id=course.id,
                semester_number=sem_num,
                academic_year="2026-2027"
            )
            db.session.add(sem)
            db.session.flush()
            sem_objs[sem_num] = sem

        # If default_subjects were provided
        default_subjects = payload.get("subjects") or []
        for s_data in default_subjects:
            s_name = s_data.get("name")
            s_code = s_data.get("code")
            s_sem = s_data.get("semester") or (semesters[0] if semesters else 1)
            nums = re.findall(r"\d+", str(s_sem))
            sem_num_target = int(nums[0]) if nums else 1
            target_sem = sem_objs.get(sem_num_target)
            if s_name and s_code:
                subj = Subject(
                    course_id=course.id,
                    semester_id=target_sem.id if target_sem else None,
                    teacher_id=s_data.get("teacher_id"),
                    name=str(s_name).strip(),
                    code=str(s_code).strip().upper(),
                    room=s_data.get("room", "Block B, Hall 3"),
                    schedule=s_data.get("schedule", "Mon, Wed, Fri - 10:15 AM")
                )
                db.session.add(subj)

        db.session.commit()

        return JSONResponse(
            status_code=201,
            content={
                "success": True,
                "message": "Course created successfully with semesters",
                "data": course.to_dict(include_subjects=True)
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Admin create course error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to create course", "error": str(e)}
        )


def admin_update_course(course_id: int, payload: dict):
    """
    Updates course name, code, and description.
    """
    try:
        course = Course.query.filter(Course.id == course_id).first()
        if not course:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Course with id {course_id} not found."}
            )

        if "name" in payload and payload["name"]:
            course.name = str(payload["name"]).strip()

        if "code" in payload and payload["code"]:
            new_code = str(payload["code"]).strip().upper()
            if new_code != course.code:
                collision = Course.query.filter(
                    func.upper(Course.code) == new_code,
                    Course.id != course_id
                ).first()
                if collision:
                    return JSONResponse(
                        status_code=400,
                        content={"success": False, "message": f"Course code '{new_code}' already exists."}
                    )
                course.code = new_code

        if "description" in payload:
            desc = payload["description"]
            course.description = str(desc).strip() if desc else None

        db.session.commit()

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Course updated successfully",
                "data": course.to_dict(include_subjects=True)
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Admin update course error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to update course", "error": str(e)}
        )


def admin_delete_course(course_id: int):
    """
    Deletes course and cascaded relations (subjects, enrollments, teacher assignments).
    """
    try:
        course = Course.query.filter(Course.id == course_id).first()
        if not course:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Course with id {course_id} not found."}
            )

        course_name = course.name
        db.session.delete(course)
        db.session.commit()

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": f"Course '{course_name}' and all associated records deleted successfully."
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Admin delete course error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to delete course", "error": str(e)}
        )


# =========================================================================
# 2. SEMESTER & SUBJECT MANAGEMENT
# =========================================================================

def admin_get_course_semesters(course_id: int):
    """
    Returns unique semesters for a course with subjects count only (no full subjects).
    Delegates to the unified Course module.
    """
    from app.modules.course.service import get_course_semesters
    return get_course_semesters(course_id)


def admin_get_semester_subjects(semester_id: int):
    from app.modules.course.service import get_semester_subjects
    return get_semester_subjects(semester_id)


def admin_create_subject(course_id: int, payload: dict):
    """
    Adds a subject to a course with semester, schedule, room, and optional teacher assignment.
    """
    try:
        import re
        course = Course.query.filter(Course.id == course_id).first()
        if not course:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Course {course_id} not found."}
            )

        name = payload.get("name")
        code = payload.get("code")
        semester = payload.get("semester")
        semester_id = payload.get("semester_id")
        room = payload.get("room") or "Block B, Hall 3"
        schedule = payload.get("schedule") or "Mon, Wed, Fri - 10:15 AM"
        teacher_id = payload.get("teacher_id")
        academic_year = payload.get("academic_year") or "2026-2027"

        if not name or not str(name).strip():
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Subject name is required."}
            )

        if not code or not str(code).strip():
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Subject code is required."}
            )

        clean_code = str(code).strip().upper()
        clean_name = str(name).strip()
        clean_sem = str(semester).strip() if semester else "Semester 1"

        # Check duplicate code within the same course
        existing = Subject.query.filter(
            Subject.course_id == course_id,
            func.upper(Subject.code) == clean_code
        ).first()
        if existing:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": f"Subject code '{clean_code}' already exists in this course."}
            )

        # Resolve target semester
        target_sem = None
        if semester_id:
            target_sem = Semester.query.filter(
                Semester.id == semester_id,
                Semester.course_id == course_id
            ).first()

        if not target_sem and semester:
            nums = re.findall(r"\d+", str(semester))
            if nums:
                sem_num = int(nums[0])
                target_sem = Semester.query.filter(
                    Semester.course_id == course_id,
                    Semester.semester_number == sem_num
                ).first()

        clean_sem_name = target_sem.name if target_sem else clean_sem

        clean_room = str(room).strip()
        clean_sched = str(schedule).strip()

        from app.modules.course.timetable_helper import (
            check_room_schedule_conflict,
            check_teacher_schedule_conflict,
            sync_assignment_timetable,
        )

        # Check room availability regardless of teacher
        room_conflict, room_conflict_info = check_room_schedule_conflict(clean_room, clean_sched)
        if room_conflict:
            return _room_conflict_response(clean_room, room_conflict_info)

        # Check teacher availability if teacher_id is provided
        if teacher_id:
            teacher = Teacher.query.filter(Teacher.id == teacher_id).first()
            if not teacher:
                return JSONResponse(
                    status_code=404,
                    content={"success": False, "message": f"Teacher with ID {teacher_id} not found."}
                )

            has_conflict, conflict_info = check_teacher_schedule_conflict(teacher_id, clean_sched)
            if has_conflict:
                return _teacher_conflict_response(conflict_info)

        subject = Subject(
            course_id=course_id,
            semester_id=target_sem.id if target_sem else None,
            teacher_id=teacher_id if teacher_id else None,
            name=clean_name,
            code=clean_code,
            room=clean_room,
            schedule=clean_sched
        )
        db.session.add(subject)
        db.session.flush()

        # Teacher assignment if teacher_id is provided
        if teacher_id:
            from app.modules.course.model import CourseSubject
            from app.modules.course.timetable_helper import sync_assignment_timetable

            cs = CourseSubject.query.filter(
                CourseSubject.course_id == course_id,
                CourseSubject.subject_id == subject.id
            ).first()
            if not cs:
                cs = CourseSubject(
                    course_id=course_id,
                    semester_id=target_sem.id if target_sem else None,
                    subject_id=subject.id
                )
                db.session.add(cs)
                db.session.flush()

            assignment = TeacherAssignment(
                teacher_id=teacher_id,
                course_id=course_id,
                course_subject_id=cs.id if cs else None,
                subject_id=subject.id,
                room=subject.room,
                schedule=subject.schedule,
                academic_year=str(academic_year).strip(),
                status="active"
            )
            db.session.add(assignment)
            db.session.flush()

            # Sync timetable entries
            sync_assignment_timetable(assignment.id, subject.schedule)

        db.session.commit()

        return JSONResponse(
            status_code=201,
            content={
                "success": True,
                "message": "Subject created successfully",
                "data": subject.to_dict(include_course=True)
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Admin create subject error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to create subject", "error": str(e)}
        )


def admin_update_subject(subject_id: int, payload: dict):
    """
    Updates subject details (name, code, semester, room, schedule)
    and updates/assigns teacher if teacher_id is supplied.
    """
    try:
        import re
        subject = Subject.query.filter(Subject.id == subject_id).first()
        if not subject:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Subject {subject_id} not found."}
            )

        if "name" in payload and payload["name"]:
            subject.name = str(payload["name"]).strip()

        if "code" in payload and payload["code"]:
            new_code = str(payload["code"]).strip().upper()
            if new_code != subject.code:
                collision = Subject.query.filter(
                    Subject.course_id == subject.course_id,
                    func.upper(Subject.code) == new_code,
                    Subject.id != subject_id
                ).first()
                if collision:
                    return JSONResponse(
                        status_code=400,
                        content={"success": False, "message": f"Subject code '{new_code}' already exists in this course."}
                    )
                subject.code = new_code

        if "semester_id" in payload and payload["semester_id"]:
            target_sem = Semester.query.filter(
                Semester.id == payload["semester_id"],
                Semester.course_id == subject.course_id
            ).first()
            if target_sem:
                subject.semester_id = target_sem.id

        if "semester" in payload and payload["semester"]:
            nums = re.findall(r"\d+", str(payload["semester"]))
            if nums:
                sem_num = int(nums[0])
                target_sem = Semester.query.filter(
                    Semester.course_id == subject.course_id,
                    Semester.semester_number == sem_num
                ).first()
                if target_sem:
                    subject.semester_id = target_sem.id

        if "room" in payload:
            subject.room = str(payload["room"]).strip() if payload["room"] else subject.room

        if "schedule" in payload:
            subject.schedule = str(payload["schedule"]).strip() if payload["schedule"] else subject.schedule

        from app.modules.course.timetable_helper import (
            check_room_schedule_conflict,
            check_teacher_schedule_conflict,
            sync_assignment_timetable,
        )

        # Always check room conflict when room or schedule or teacher is updated
        if any(k in payload for k in ("room", "schedule", "teacher_id")) and subject.room and subject.schedule:
            room_conflict, room_conflict_info = check_room_schedule_conflict(
                room_str=subject.room,
                schedule_str=subject.schedule,
                exclude_subject_id=subject.id,
            )
            if room_conflict:
                return _room_conflict_response(subject.room, room_conflict_info)

        # Handle teacher assignment update (or schedule change for existing teacher)
        effective_teacher_id = payload["teacher_id"] if "teacher_id" in payload else subject.teacher_id
        if effective_teacher_id and ("teacher_id" in payload or "schedule" in payload or "room" in payload):
            has_conflict, conflict_info = check_teacher_schedule_conflict(
                teacher_id=effective_teacher_id,
                schedule_str=subject.schedule,
                exclude_subject_id=subject.id,
            )
            if has_conflict:
                return _teacher_conflict_response(conflict_info)

        if "teacher_id" in payload:
            teacher_id = payload["teacher_id"]
            academic_year = payload.get("academic_year") or "2026-2027"

            if teacher_id:
                subject.teacher_id = teacher_id

                # Find existing assignment or create new
                existing_assignment = TeacherAssignment.query.filter(
                    TeacherAssignment.course_id == subject.course_id,
                    TeacherAssignment.subject_id == subject.id
                ).first()

                from app.modules.course.model import CourseSubject
                cs = CourseSubject.query.filter(
                    CourseSubject.course_id == subject.course_id,
                    CourseSubject.subject_id == subject.id
                ).first()
                if not cs:
                    cs = CourseSubject(
                        course_id=subject.course_id,
                        semester_id=subject.semester_id,
                        subject_id=subject.id
                    )
                    db.session.add(cs)
                    db.session.flush()

                if existing_assignment:
                    existing_assignment.teacher_id = teacher_id
                    existing_assignment.course_subject_id = cs.id if cs else None
                    existing_assignment.room = subject.room
                    existing_assignment.schedule = subject.schedule
                    existing_assignment.academic_year = str(academic_year).strip()
                    assignment_to_sync = existing_assignment
                else:
                    new_assignment = TeacherAssignment(
                        teacher_id=teacher_id,
                        course_id=subject.course_id,
                        course_subject_id=cs.id if cs else None,
                        subject_id=subject.id,
                        room=subject.room,
                        schedule=subject.schedule,
                        academic_year=str(academic_year).strip(),
                        status="active"
                    )
                    db.session.add(new_assignment)
                    db.session.flush()
                    assignment_to_sync = new_assignment

                sync_assignment_timetable(assignment_to_sync.id, subject.schedule)
            elif teacher_id is None:
                subject.teacher_id = None
                # Remove teacher assignments for this subject
                TeacherAssignment.query.filter(
                    TeacherAssignment.course_id == subject.course_id,
                    TeacherAssignment.subject_id == subject.id
                ).delete()
        elif "room" in payload or "schedule" in payload:
            # Keep existing assignment room/schedule & timetable synced
            existing_assignments = TeacherAssignment.query.filter(
                TeacherAssignment.course_id == subject.course_id,
                TeacherAssignment.subject_id == subject.id,
            ).all()
            for a in existing_assignments:
                a.room = subject.room
                a.schedule = subject.schedule
                sync_assignment_timetable(a.id, subject.schedule)

        db.session.commit()

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Subject updated successfully",
                "data": subject.to_dict(include_course=True)
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Admin update subject error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to update subject", "error": str(e)}
        )


def admin_delete_subject(subject_id: int):
    """
    Deletes a subject and cascades related teacher assignments.
    """
    try:
        subject = Subject.query.filter(Subject.id == subject_id).first()
        if not subject:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Subject {subject_id} not found."}
            )

        name = subject.name
        db.session.delete(subject)
        db.session.commit()

        return JSONResponse(
            status_code=200,
            content={"success": True, "message": f"Subject '{name}' deleted successfully."}
        )
    except Exception as e:
        db.session.rollback()
        print("Admin delete subject error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to delete subject", "error": str(e)}
        )


# =========================================================================
# 3. BATCH & STUDENT ENROLLMENT MANAGEMENT
# =========================================================================

def admin_get_course_batches(course_id: int):
    """
    Returns batches (academic years) and enrolled students grouped by batch and semester.
    """
    try:
        course = Course.query.filter(Course.id == course_id).first()
        if not course:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Course not found"}
            )

        enrollments = CourseEnrollment.query.filter(
            CourseEnrollment.course_id == course_id
        ).all()

        batches_map = {}
        for enr in enrollments:
            batch_key = enr.academic_year or "General Batch"
            sem_key = enr.semester or "General Semester"

            if batch_key not in batches_map:
                batches_map[batch_key] = {}
            if sem_key not in batches_map[batch_key]:
                batches_map[batch_key][sem_key] = []

            batches_map[batch_key][sem_key].append(enr.to_dict())

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "course_id": course.id,
                "course_name": course.name,
                "total_enrolled": len(enrollments),
                "batches": batches_map
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Admin get batches error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to fetch course batches", "error": str(e)}
        )


def admin_enroll_batch(course_id: int, payload: dict):
    """
    Enrolls a batch of students to a course, specifying:
    - academic_year / batch (e.g. '2026-2027')
    - semester (e.g. 'Semester 1')
    - student_ids (list of student IDs) OR enroll_all_unassigned (bool)
    """
    try:
        course = Course.query.filter(Course.id == course_id).first()
        if not course:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Course {course_id} not found."}
            )

        academic_year = payload.get("academic_year") or payload.get("batch") or "2026-2027"
        semester = payload.get("semester") or "Semester 1"
        student_ids = payload.get("student_ids") or []
        enroll_all_unassigned = payload.get("enroll_all_unassigned", False)

        clean_batch = str(academic_year).strip()
        clean_sem = str(semester).strip()

        # If student_ids not provided but enroll_all_unassigned is True
        if not student_ids and enroll_all_unassigned:
            enrolled_subquery = db.session.query(CourseEnrollment.student_id).filter(
                CourseEnrollment.status == "active"
            ).subquery()
            unassigned_students = Student.query.filter(
                ~Student.id.in_(enrolled_subquery)
            ).all()
            student_ids = [s.id for s in unassigned_students]

        if not student_ids:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "No students selected for enrollment."}
            )

        enrolled_count = 0
        updated_count = 0

        for s_id in student_ids:
            student = Student.query.filter(Student.id == s_id).first()
            if not student:
                continue

            existing = CourseEnrollment.query.filter(
                CourseEnrollment.student_id == s_id,
                CourseEnrollment.course_id == course_id
            ).first()

            if existing:
                existing.academic_year = clean_batch
                existing.semester = clean_sem
                existing.status = "active"
                updated_count += 1
            else:
                new_enr = CourseEnrollment(
                    student_id=s_id,
                    course_id=course_id,
                    academic_year=clean_batch,
                    semester=clean_sem,
                    status="active"
                )
                db.session.add(new_enr)
                enrolled_count += 1

        db.session.commit()

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": f"Batch enrollment complete: {enrolled_count} newly enrolled, {updated_count} updated.",
                "data": {
                    "course_id": course_id,
                    "batch": clean_batch,
                    "semester": clean_sem,
                    "newly_enrolled": enrolled_count,
                    "updated": updated_count,
                }
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Admin enroll batch error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to enroll batch", "error": str(e)}
        )


def admin_update_enrollment(enrollment_id: int, payload: dict):
    """
    Updates student enrollment (semester, academic_year, status).
    """
    try:
        enrollment = CourseEnrollment.query.filter(CourseEnrollment.id == enrollment_id).first()
        if not enrollment:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Enrollment record not found."}
            )

        if "semester" in payload and payload["semester"]:
            enrollment.semester = str(payload["semester"]).strip()

        if "academic_year" in payload and payload["academic_year"]:
            enrollment.academic_year = str(payload["academic_year"]).strip()
        elif "batch" in payload and payload["batch"]:
            enrollment.academic_year = str(payload["batch"]).strip()

        if "status" in payload and payload["status"]:
            enrollment.status = str(payload["status"]).strip().lower()

        db.session.commit()

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Enrollment updated successfully",
                "data": enrollment.to_dict()
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Admin update enrollment error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to update enrollment", "error": str(e)}
        )


def admin_remove_enrollment(enrollment_id: int):
    """
    Removes student from course enrollment.
    """
    try:
        enrollment = CourseEnrollment.query.filter(CourseEnrollment.id == enrollment_id).first()
        if not enrollment:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Enrollment record not found."}
            )

        db.session.delete(enrollment)
        db.session.commit()

        return JSONResponse(
            status_code=200,
            content={"success": True, "message": "Student successfully removed from course."}
        )
    except Exception as e:
        db.session.rollback()
        print("Admin remove enrollment error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to remove enrollment", "error": str(e)}
        )


# =========================================================================
# 4. TEACHER ASSIGNMENT MANAGEMENT
# =========================================================================

def admin_get_all_teachers():
    """
    Returns list of all teachers for admin dashboard,
    including assigned classes/subjects, room, schedule, semester, and enrolled students.
    """
    try:
        teachers = Teacher.query.all()
        result = []
        for t in teachers:
            t_dict = t.to_dict()
            t_assignments = []
            if t.assignments:
                for a in t.assignments:
                    a_dict = a.to_dict()
                    sem = a.subject.semester if a.subject else None
                    a_dict["semester"] = sem

                    query = CourseEnrollment.query.filter(
                        CourseEnrollment.course_id == a.course_id,
                        CourseEnrollment.status == "active"
                    )
                    if sem:
                        query = query.filter(CourseEnrollment.semester == sem)

                    enrollments = query.all()
                    a_dict["students_count"] = len(enrollments)
                    a_dict["students"] = [
                        {
                            "id": e.student_id,
                            "name": e.student.user.username if (e.student and e.student.user) else None,
                            "email": e.student.user.email if (e.student and e.student.user) else None,
                            "roll_number": e.student.roll_number if e.student else None,
                            "status": e.status,
                            "semester": e.semester,
                            "academic_year": e.academic_year
                        }
                        for e in enrollments
                    ]
                    t_assignments.append(a_dict)

            t_dict["assignments"] = t_assignments
            t_dict["total_classes"] = len(t_assignments)
            t_dict["total_students"] = sum(a.get("students_count", 0) for a in t_assignments)
            result.append(t_dict)

        return JSONResponse(
            status_code=200,
            content={"success": True, "count": len(result), "data": result}
        )
    except Exception as e:
        db.session.rollback()
        print("Admin get all teachers error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to fetch teachers", "error": str(e)}
        )


def admin_create_teacher(payload: dict):
    """
    Creates a new teacher account along with login credentials, specialization/qualification, and optional subject assignment.
    """
    try:
        name = payload.get("name") or payload.get("username")
        email = payload.get("email")
        raw_password = payload.get("password")
        password = str(raw_password).strip() if raw_password and str(raw_password).strip() else "teacher123"
        employee_code = payload.get("employee_code") or payload.get("faculty_id")
        phone = payload.get("phone")
        qualification = payload.get("qualification")
        specialization = payload.get("specialization") or payload.get("department")
        joining_date_raw = payload.get("joining_date")
        course_id = payload.get("course_id")
        subject_id = payload.get("subject_id")
        room = payload.get("room") or "Block B, Hall 3"
        schedule = payload.get("schedule") or "Mon, Wed, Fri - 10:15 AM"

        if not name or not email:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Teacher name and email are required."}
            )

        clean_name = str(name).strip()
        clean_email = str(email).strip().lower()
        clean_password = str(password).strip()

        parsed_joining_date = None
        if joining_date_raw:
            try:
                parsed_joining_date = datetime.strptime(str(joining_date_raw).strip(), "%Y-%m-%d").date()
            except ValueError:
                parsed_joining_date = None

        # Check existing user
        existing_user = User.query.filter(User.email == clean_email).first()
        if existing_user:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": f"Email '{clean_email}' is already registered."}
            )

        # Generate or check employee code
        if employee_code:
            clean_code = str(employee_code).strip().upper()
            code_collision = Teacher.query.filter(Teacher.employee_code == clean_code).first()
            if code_collision:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": f"Employee code '{clean_code}' is already assigned to another faculty."}
                )
        else:
            t_count = Teacher.query.count()
            clean_code = f"FAC-{1000 + t_count + 1}"

        # Validate room availability upfront if optional immediate assignment is requested
        clean_room = str(room).strip()
        clean_sched = str(schedule).strip()
        if course_id and subject_id:
            from app.modules.course.timetable_helper import check_room_schedule_conflict
            room_conflict, room_conflict_info = check_room_schedule_conflict(
                clean_room,
                clean_sched,
                exclude_subject_id=subject_id,
            )
            if room_conflict:
                return _room_conflict_response(clean_room, room_conflict_info)

        # Create user
        new_user = User(
            username=clean_name,
            email=clean_email,
            password=hash_password(clean_password),
            role="teacher",
            auth_provider="email",
            is_active=True
        )
        db.session.add(new_user)
        db.session.flush()

        # Create teacher profile
        teacher = Teacher(
            user_id=new_user.id,
            employee_code=clean_code,
            phone=str(phone).strip() if phone else None,
            qualification=str(qualification).strip() if qualification else None,
            specialization=str(specialization).strip() if specialization else None,
            joining_date=parsed_joining_date,
        )
        db.session.add(teacher)
        db.session.flush()

        # Optional immediate assignment
        if course_id and subject_id:
            subj = Subject.query.filter(Subject.id == subject_id, Subject.course_id == course_id).first()
            if subj:
                from app.modules.course.model import CourseSubject
                from app.modules.course.timetable_helper import sync_assignment_timetable

                cs = CourseSubject.query.filter(
                    CourseSubject.course_id == course_id,
                    CourseSubject.subject_id == subject_id,
                ).first()
                if not cs:
                    cs = CourseSubject(
                        course_id=course_id,
                        semester_id=subj.semester_id,
                        subject_id=subject_id,
                    )
                    db.session.add(cs)
                    db.session.flush()

                assignment = TeacherAssignment(
                    teacher_id=teacher.id,
                    course_id=course_id,
                    course_subject_id=cs.id,
                    semester_id=subj.semester_id,
                    subject_id=subject_id,
                    room=clean_room,
                    schedule=clean_sched,
                    academic_year="2026-2027",
                    status="active",
                )
                db.session.add(assignment)
                db.session.flush()

                subj.teacher_id = teacher.id
                subj.room = clean_room
                subj.schedule = clean_sched
                sync_assignment_timetable(assignment.id, clean_sched)

        db.session.commit()
        send_user_welcome_email(clean_email, clean_name, clean_password, role="teacher")

        return JSONResponse(
            status_code=201,
            content={
                "success": True,
                "message": f"Teacher '{clean_name}' created successfully with code '{clean_code}'.",
                "data": teacher.to_dict()
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Admin create teacher error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to create teacher account", "error": str(e)}
        )


def admin_create_student(payload: dict):
    """
    Creates a new student account, profile, roll number, and enrolls into course & semester.
    """
    try:
        name = payload.get("name") or payload.get("username")
        email = payload.get("email")
        raw_password = payload.get("password")
        password = str(raw_password).strip() if raw_password and str(raw_password).strip() else "student123"
        roll_number = payload.get("roll_number")
        phone = payload.get("phone")
        course_id = payload.get("course_id")
        semester_id = payload.get("semester_id")
        semester = payload.get("semester") or "Semester 1"
        academic_year = payload.get("academic_year") or payload.get("batch") or "2026-2027"

        if not name or not email:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Student name and email are required."}
            )

        clean_name = str(name).strip()
        clean_email = str(email).strip().lower()
        clean_password = str(password).strip()

        # Check existing user
        existing_user = User.query.filter(User.email == clean_email).first()
        if existing_user:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": f"Email '{clean_email}' is already registered."}
            )

        # Generate or check roll number
        if roll_number:
            clean_roll = str(roll_number).strip().upper()
            roll_collision = Student.query.filter(Student.roll_number == clean_roll).first()
            if roll_collision:
                return JSONResponse(
                    status_code=400,
                    content={"success": False, "message": f"Roll number '{clean_roll}' is already assigned to another student."}
                )
        else:
            s_count = Student.query.count()
            clean_roll = f"STU-{1000 + s_count + 1}"

        # Resolve semester_id / semester name safely for the target course
        sem_name = str(semester).strip() if semester else "Semester 1"
        sem_obj = None
        if semester_id and course_id:
            sem_obj = Semester.query.filter(
                Semester.id == semester_id,
                Semester.course_id == course_id,
            ).first()
        if not sem_obj and course_id:
            nums = re.findall(r"\d+", str(sem_name))
            if nums:
                sem_obj = Semester.query.filter(
                    Semester.course_id == course_id,
                    Semester.semester_number == int(nums[0]),
                ).first()
        sem_id = sem_obj.id if sem_obj else None
        if sem_obj:
            sem_name = f"Semester {sem_obj.semester_number}"

        # Create user
        new_user = User(
            username=clean_name,
            email=clean_email,
            password=hash_password(clean_password),
            role="student",
            auth_provider="email",
            is_active=True
        )
        db.session.add(new_user)
        db.session.flush()

        # Create student profile
        student = Student(
            user_id=new_user.id,
            roll_number=clean_roll,
            semester_id=sem_id,
            semester=sem_name,
            phone=str(phone).strip() if phone else None
        )
        db.session.add(student)
        db.session.flush()

        # Process optional student photo (extract face embedding & upload to Cloudinary)
        photo = payload.get("profile_image") or payload.get("photo") or payload.get("photo_url")
        if photo:
            from app.modules.attendance.ml.face_pipeline import extract_face_embedding
            from app.utils.cloudinary import upload_image_to_cloudinary

            computed_face_emb, face_err = extract_face_embedding(photo)
            if computed_face_emb:
                student.face_embedding = computed_face_emb
            elif face_err:
                print(f"Optional student photo face extraction note for {clean_roll}: {face_err}")

            cloudinary_url = upload_image_to_cloudinary(
                photo,
                folder="attendx/students",
                public_id=f"student_{student.id}_{clean_roll}"
            )
            new_user.profile_image = cloudinary_url or photo

        # Enroll into course if provided
        if course_id:
            course = Course.query.filter(Course.id == course_id).first()
            if course:
                enrollment = CourseEnrollment(
                    student_id=student.id,
                    course_id=course_id,
                    semester_id=sem_id,
                    semester=sem_name,
                    academic_year=str(academic_year).strip(),
                    status="active"
                )
                db.session.add(enrollment)

        db.session.commit()
        send_user_welcome_email(clean_email, clean_name, clean_password, role="student")

        return JSONResponse(
            status_code=201,
            content={
                "success": True,
                "message": f"Student '{clean_name}' created successfully with Roll '{clean_roll}'.",
                "data": student.to_dict()
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Admin create student error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to create student account", "error": str(e)}
        )


def admin_get_all_students(search: str = None, course_id: int = None, semester_id: int = None):
    """
    Returns list of all students with their enrollments, roll numbers, course, and semester.
    """
    try:
        query = Student.query
        if search:
            q = f"%{str(search).strip()}%"
            query = query.join(User).filter(
                or_(
                    User.username.ilike(q),
                    User.email.ilike(q),
                    Student.roll_number.ilike(q),
                    Student.phone.ilike(q)
                )
            )
        students = query.order_by(Student.id.desc()).all()
        result = []
        for s in students:
            s_dict = s.to_dict()
            if course_id and s_dict.get("course_id") != course_id:
                continue
            if semester_id and s_dict.get("semester_id") != semester_id:
                continue
            result.append(s_dict)

        return JSONResponse(
            status_code=200,
            content={"success": True, "count": len(result), "data": result}
        )
    except Exception as e:
        db.session.rollback()
        print("Admin get all students error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to fetch students", "error": str(e)}
        )


def admin_get_teacher_assignments(course_id: int = None, teacher_id: int = None, subject_id: int = None):
    """
    Lists teacher assignments with optional filters.
    """
    try:
        query = TeacherAssignment.query
        if course_id:
            query = query.filter(TeacherAssignment.course_id == course_id)
        if teacher_id:
            query = query.filter(TeacherAssignment.teacher_id == teacher_id)
        if subject_id:
            query = query.filter(TeacherAssignment.subject_id == subject_id)

        assignments = query.order_by(TeacherAssignment.id.desc()).all()
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "count": len(assignments),
                "data": [a.to_dict() for a in assignments]
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Admin get teacher assignments error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to fetch teacher assignments", "error": str(e)}
        )


def admin_assign_teacher(payload: dict):
    """
    Assigns a teacher to a course and subject.
    Upserts if an assignment for (teacher_id, course_id, subject_id) or (course_id, subject_id) exists.
    """
    try:
        teacher_id = payload.get("teacher_id")
        course_id = payload.get("course_id")
        subject_id = payload.get("subject_id")
        room = payload.get("room") or "Block B, Hall 3"
        schedule = payload.get("schedule") or "Mon, Wed, Fri - 10:15 AM"
        academic_year = payload.get("academic_year") or payload.get("batch") or "2026-2027"

        if not teacher_id or not course_id or not subject_id:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "teacher_id, course_id, and subject_id are all required."
                }
            )

        # Validate existence
        teacher = Teacher.query.filter(Teacher.id == teacher_id).first()
        if not teacher:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Teacher {teacher_id} not found."}
            )

        course = Course.query.filter(Course.id == course_id).first()
        if not course:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Course {course_id} not found."}
            )

        subject = Subject.query.filter(Subject.id == subject_id, Subject.course_id == course_id).first()
        if not subject:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Subject {subject_id} not found under course {course_id}."}
            )

        clean_room = str(room).strip()
        clean_sched = str(schedule).strip()
        clean_year = str(academic_year).strip()

        # Check room & teacher availability for schedule
        from app.modules.course.timetable_helper import (
            check_room_schedule_conflict,
            check_teacher_schedule_conflict,
            sync_assignment_timetable,
        )
        room_conflict, room_conflict_info = check_room_schedule_conflict(
            room_str=clean_room,
            schedule_str=clean_sched,
            exclude_subject_id=subject_id,
        )
        if room_conflict:
            return _room_conflict_response(clean_room, room_conflict_info)

        has_conflict, conflict_info = check_teacher_schedule_conflict(
            teacher_id=teacher_id,
            schedule_str=clean_sched,
            exclude_subject_id=subject_id
        )
        if has_conflict:
            return _teacher_conflict_response(conflict_info)

        # Check existing assignment
        existing = TeacherAssignment.query.filter(
            TeacherAssignment.course_id == course_id,
            TeacherAssignment.subject_id == subject_id,
            TeacherAssignment.teacher_id == teacher_id
        ).first()

        from app.modules.course.model import CourseSubject
        cs = CourseSubject.query.filter(
            CourseSubject.course_id == course_id,
            CourseSubject.subject_id == subject_id
        ).first()
        if not cs:
            cs = CourseSubject(
                course_id=course_id,
                semester_id=subject.semester_id,
                subject_id=subject_id
            )
            db.session.add(cs)
            db.session.flush()

        if existing:
            existing.semester_id = subject.semester_id
            existing.course_subject_id = cs.id if cs else None
            existing.room = clean_room
            existing.schedule = clean_sched
            existing.academic_year = clean_year
            assignment = existing
            msg = "Teacher assignment updated successfully"
        else:
            assignment = TeacherAssignment(
                teacher_id=teacher_id,
                course_id=course_id,
                course_subject_id=cs.id if cs else None,
                semester_id=subject.semester_id,
                subject_id=subject_id,
                room=clean_room,
                schedule=clean_sched,
                academic_year=clean_year,
                status="active"
            )
            db.session.add(assignment)
            msg = "Teacher assigned successfully"

        db.session.flush()

        # Update subject default room, schedule, and teacher_id
        subject.teacher_id = teacher_id
        subject.room = clean_room
        subject.schedule = clean_sched

        # Sync timetable slots
        sync_assignment_timetable(assignment.id, clean_sched)

        db.session.commit()

        return JSONResponse(
            status_code=200 if existing else 201,
            content={
                "success": True,
                "message": msg,
                "data": assignment.to_dict()
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Admin assign teacher error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to assign teacher", "error": str(e)}
        )


def admin_update_teacher_assignment(assignment_id: int, payload: dict):
    """
    Updates teacher assignment room, schedule, academic_year, or reassigns teacher.
    Enforces both room and teacher conflict checks and syncs Subject + SubjectTimetable.
    """
    try:
        assignment = TeacherAssignment.query.filter(TeacherAssignment.id == assignment_id).first()
        if not assignment:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Teacher assignment record not found."}
            )

        next_teacher_id = payload.get("teacher_id") or assignment.teacher_id
        next_room = str(payload["room"]).strip() if payload.get("room") else assignment.room
        next_schedule = str(payload["schedule"]).strip() if payload.get("schedule") else assignment.schedule

        if payload.get("teacher_id"):
            teacher = Teacher.query.filter(Teacher.id == next_teacher_id).first()
            if not teacher:
                return JSONResponse(
                    status_code=404,
                    content={"success": False, "message": f"Teacher {next_teacher_id} not found."}
                )

        from app.modules.course.timetable_helper import (
            check_room_schedule_conflict,
            check_teacher_schedule_conflict,
            sync_assignment_timetable,
        )

        if next_room and next_schedule:
            room_conflict, room_conflict_info = check_room_schedule_conflict(
                room_str=next_room,
                schedule_str=next_schedule,
                exclude_assignment_id=assignment.id,
                exclude_subject_id=assignment.subject_id,
            )
            if room_conflict:
                return _room_conflict_response(next_room, room_conflict_info)

        if next_teacher_id and next_schedule:
            has_conflict, conflict_info = check_teacher_schedule_conflict(
                teacher_id=next_teacher_id,
                schedule_str=next_schedule,
                exclude_assignment_id=assignment.id,
            )
            if has_conflict:
                return _teacher_conflict_response(conflict_info)

        assignment.teacher_id = next_teacher_id
        assignment.room = next_room
        assignment.schedule = next_schedule

        if "academic_year" in payload and payload["academic_year"]:
            assignment.academic_year = str(payload["academic_year"]).strip()
        elif "batch" in payload and payload["batch"]:
            assignment.academic_year = str(payload["batch"]).strip()

        if assignment.subject:
            assignment.subject.teacher_id = next_teacher_id
            assignment.subject.room = next_room
            assignment.subject.schedule = next_schedule

        if next_schedule:
            sync_assignment_timetable(assignment.id, next_schedule)

        db.session.commit()

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Teacher assignment updated successfully",
                "data": assignment.to_dict()
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Admin update teacher assignment error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to update teacher assignment", "error": str(e)}
        )


def admin_remove_teacher_assignment(assignment_id: int):
    """
    Removes a teacher assignment.
    """
    try:
        assignment = TeacherAssignment.query.filter(TeacherAssignment.id == assignment_id).first()
        if not assignment:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Teacher assignment not found."}
            )

        db.session.delete(assignment)
        db.session.commit()

        return JSONResponse(
            status_code=200,
            content={"success": True, "message": "Teacher unassigned successfully."}
        )
    except Exception as e:
        db.session.rollback()
        print("Admin remove teacher assignment error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to remove teacher assignment", "error": str(e)}
        )


# =========================================================================
# 5. ADMIN COURSE & SYSTEM STATS OVERVIEW
# =========================================================================

def admin_get_stats():
    """
    Returns high-level statistics for Admin Course Management dashboard.
    Includes session clearing, safe attribute access, transient connection retry,
    and a reliable fallback so the client UI never breaks.
    """
    for attempt in range(2):
        try:
            try:
                db.session.rollback()
            except Exception:
                pass

            total_courses = Course.query.count()
            total_subjects = Subject.query.count()
            total_teachers = Teacher.query.count()
            total_students = Student.query.count()
            total_enrollments = CourseEnrollment.query.filter(CourseEnrollment.status == "active").count()
            total_assignments = TeacherAssignment.query.count()

            courses = Course.query.all()
            breakdown = []
            for c in courses:
                subs = c.subjects or []
                enrs = c.enrollments or []
                sem_set = set()
                for s in subs:
                    if s and s.semester:
                        sem_set.add(str(s.semester).strip())

                breakdown.append({
                    "id": c.id,
                    "code": c.code,
                    "name": c.name,
                    "subjects_count": len(subs),
                    "enrolled_students": len([e for e in enrs if getattr(e, "status", None) == "active"]),
                    "semesters": sorted(list(sem_set)),
                })

            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "data": {
                        "total_courses": total_courses,
                        "total_subjects": total_subjects,
                        "total_teachers": total_teachers,
                        "total_students": total_students,
                        "active_enrollments": total_enrollments,
                        "total_teacher_assignments": total_assignments,
                        "course_breakdown": breakdown
                    }
                }
            )
        except Exception as e:
            try:
                db.session.rollback()
            except Exception:
                pass
            print(f"Admin get stats error (attempt {attempt + 1}):", repr(e))
            if attempt == 0:
                import time
                time.sleep(0.3)
                continue

            return JSONResponse(
                status_code=200,
                content={
                    "success": True,
                    "data": {
                        "total_courses": 0,
                        "total_subjects": 0,
                        "total_teachers": 0,
                        "total_students": 0,
                        "active_enrollments": 0,
                        "total_teacher_assignments": 0,
                        "course_breakdown": []
                    },
                    "warning": f"Stats retrieved with fallback: {str(e)}"
                }
            )


def admin_check_teacher_availability(teacher_id: int, schedule: str, subject_id: int | None = None):
    """
    Checks if a teacher is available for a given timetable schedule without conflicts.
    """
    try:
        from app.modules.course.timetable_helper import check_teacher_schedule_conflict

        teacher = Teacher.query.filter(Teacher.id == teacher_id).first()
        if not teacher:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Teacher with ID {teacher_id} not found."}
            )

        clean_sched = str(schedule).strip() if schedule else ""
        if not clean_sched:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Schedule is required for availability check."}
            )

        has_conflict, conflict_info = check_teacher_schedule_conflict(
            teacher_id=teacher_id,
            schedule_str=clean_sched,
            exclude_subject_id=subject_id
        )

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "teacher_id": teacher_id,
                "teacher_name": teacher.user.username if teacher.user else "Faculty",
                "available": not has_conflict,
                "conflict": conflict_info if has_conflict else None,
                "message": (
                    f"Teacher is available for {clean_sched}."
                    if not has_conflict
                    else f"Teacher has a timetable clash on {conflict_info.get('day_name')} with subject '{conflict_info.get('subject_name')}'."
                )
            }
        )
    except Exception as e:
        print("Check teacher availability error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to check teacher availability", "error": str(e)}
        )


def admin_check_room_availability(room: str, schedule: str, subject_id: int | None = None):
    """
    Checks if a classroom/room is free for a given timetable schedule.
    """
    try:
        from app.modules.course.timetable_helper import check_room_schedule_conflict

        clean_room = str(room).strip() if room else ""
        clean_sched = str(schedule).strip() if schedule else ""
        if not clean_room or not clean_sched:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Room and schedule are required for availability check."}
            )

        has_conflict, conflict_info = check_room_schedule_conflict(
            room_str=clean_room,
            schedule_str=clean_sched,
            exclude_subject_id=subject_id,
        )

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "room": clean_room,
                "available": not has_conflict,
                "conflict": conflict_info if has_conflict else None,
                "message": (
                    f"Room '{clean_room}' is available."
                    if not has_conflict
                    else f"Room '{clean_room}' is not available at this time. Already booked on {conflict_info.get('day_name')} ({conflict_info.get('conflict_start')} - {conflict_info.get('conflict_end')}) for '{conflict_info.get('subject_name')}'."
                ),
            },
        )
    except Exception as e:
        print("Check room availability error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to check room availability", "error": str(e)}
        )


def admin_get_booked_room_slots():
    """
    Returns all currently booked (room, schedule) entries across active assignments
    and subjects so the UI can filter out unavailable slots upfront without polling on every click.
    """
    try:
        from app.modules.course.timetable_helper import normalize_room_name

        booked = []
        seen_subject_ids = set()

        for a in TeacherAssignment.query.filter(TeacherAssignment.status != "inactive").all():
            if a.subject_id:
                seen_subject_ids.add(a.subject_id)
            if not a.room or not a.schedule:
                continue
            booked.append({
                "room": a.room,
                "normalized_room": normalize_room_name(a.room),
                "schedule": a.schedule,
                "subject_id": a.subject_id,
                "subject_name": a.subject.name if a.subject else "Another Class",
                "subject_code": a.subject.code if a.subject else "",
            })

        for s in Subject.query.all():
            if s.id in seen_subject_ids or not s.room or not s.schedule:
                continue
            booked.append({
                "room": s.room,
                "normalized_room": normalize_room_name(s.room),
                "schedule": s.schedule,
                "subject_id": s.id,
                "subject_name": s.name,
                "subject_code": s.code,
            })

        return JSONResponse(
            status_code=200,
            content={"success": True, "data": booked},
        )
    except Exception as e:
        print("Get booked room slots error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to fetch booked room slots", "error": str(e)},
        )
