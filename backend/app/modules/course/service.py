from app.config.database import db
from sqlalchemy import or_, func
import re
from app.modules.course.model import Course, Semester, Subject, CourseEnrollment
from app.modules.student.model import Student
from app.modules.teacher.model import Teacher, TeacherAssignment
from app.modules.users.model import User
from fastapi.responses import JSONResponse


def get_all_courses(teacher_id: int = None, user_id: int = None, role: str = None):
    """
    Returns limited course overview data:
    - ID, name, code, description, duration, total_semesters
    - semesters_count, subjects_count, enrolled_students_count
    - semesters list (names only for badges)
    Does NOT include full subjects array or deep nested semester objects.
    """
    try:
        query = Course.query.order_by(Course.id.desc())

        # If filtered by teacher_id or user_id for teacher
        target_teacher_id = teacher_id
        if not target_teacher_id and user_id:
            user = User.query.filter(User.id == user_id).first()
            if user and (role == "teacher" or user.role == "teacher"):
                teacher = Teacher.query.filter(Teacher.user_id == user_id).first()
                if teacher:
                    target_teacher_id = teacher.id

        if target_teacher_id:
            assigned_course_ids = [
                a.course_id for a in TeacherAssignment.query.filter(
                    TeacherAssignment.teacher_id == target_teacher_id
                ).all()
            ]
            if assigned_course_ids:
                query = query.filter(Course.id.in_(list(set(assigned_course_ids))))

        courses = query.all()

        result = []
        for c in courses:
            # Limited summary data only
            c_dict = c.to_dict(include_subjects=False, include_semesters=False)
            result.append(c_dict)

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "count": len(result),
                "data": result
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Get all courses error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to fetch courses", "error": str(e)}
        )


def get_course_by_id(course_id: int, include_subjects: bool = False):
    """
    Returns single course overview with counts.
    Subjects are excluded by default unless include_subjects=True.
    """
    try:
        course = Course.query.filter(Course.id == course_id).first()
        if not course:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Course with id {course_id} not found."}
            )

        data = course.to_dict(include_subjects=include_subjects, include_semesters=False)
        return JSONResponse(
            status_code=200,
            content={"success": True, "data": data}
        )
    except Exception as e:
        db.session.rollback()
        print("Get course error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to fetch course", "error": str(e)}
        )

def get_course_semesters(course_id: int):
  
    try:
        course = Course.query.filter(Course.id == course_id).first()
        if not course:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Course with id {course_id} not found."}
            )

        db_semesters = (
            Semester.query.filter(Semester.course_id == course_id)
            .order_by(Semester.semester_number)
            .all()
        )

        result = []
        if db_semesters:
            for sem in db_semesters:
                # Count enrolled students for this semester
                students_count = CourseEnrollment.query.filter(
                    CourseEnrollment.course_id == course_id,
                    CourseEnrollment.semester_id == sem.id,
                    CourseEnrollment.status == "active"
                ).count()

                sem_dict = sem.to_dict(include_subjects=False)
                sem_dict["students_count"] = students_count
                result.append(sem_dict)
        else:
            # Fallback if no Semester rows generated yet
            total_sems = course.total_semesters or ((course.duration_years or 3) * 2)
            for sem_num in range(1, total_sems + 1):
                sub_count = Subject.query.filter(
                    Subject.course_id == course_id,
                    Subject.semester_id == None
                ).count()
                result.append({
                    "id": sem_num,
                    "course_id": course.id,
                    "semester_number": sem_num,
                    "subjects_count": sub_count if sem_num == 1 else 0,
                    "students_count": 0,
                    "created_at": None,
                })

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "course_id": course.id,
                "data": result,
                
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Get course semesters error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to fetch course semesters", "error": str(e)}
        )



def get_semester_subjects(semester_id: int):
    """
    Returns minimal subject list for a given semester_id directly from Semester/Subject.
    """
    try:
        semester = Semester.query.filter(Semester.id == semester_id).first()
        if not semester:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Semester with id {semester_id} not found."}
            )

        subjects = (
            Subject.query.filter(Subject.semester_id == semester.id)
            .order_by(Subject.id.asc())
            .all()
        )

        subject_list = []
        for s in subjects:
            primary_a = s.assignments[0] if getattr(s, "assignments", None) else None
            teacher_obj = s.teacher or (primary_a.teacher if primary_a else None)
            subject_list.append({
                "id": s.id,
                "name": s.name,
                "code": s.code,
                "room": primary_a.room if primary_a and primary_a.room else s.room,
                "schedule": primary_a.schedule if primary_a and primary_a.schedule else s.schedule,
                "teacher_id": s.teacher_id or (primary_a.teacher_id if primary_a else None),
                "teacher_name": teacher_obj.user.username if (teacher_obj and teacher_obj.user) else None,
                "teacher_email": teacher_obj.user.email if (teacher_obj and teacher_obj.user) else None,
            })

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "semester_id": semester.id,
                "data": subject_list,
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Get semester subjects error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to fetch semester subjects", "error": str(e)}
        )


def get_course_subjects(course_id: int, semester_id: int = None, semester: str = None):
    """
    Returns subjects of a course, optionally filtered by semester.
    """
    try:
        course = Course.query.filter(Course.id == course_id).first()
        if not course:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Course with id {course_id} not found."}
            )

        query = Subject.query.filter(Subject.course_id == course_id)
        if semester_id:
            query = query.filter(Subject.semester_id == semester_id)
        elif semester:
            query = query.filter(func.lower(Subject.semester) == func.lower(semester.strip()))

        subjects = query.all()
        subject_list = [s.to_dict(include_course=True) for s in subjects]

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "course_id": course.id,
                "course_name": course.name,
                "course_code": course.code,
                "count": len(subject_list),
                "data": subject_list
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Get course subjects error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to fetch course subjects", "error": str(e)}
        )


def create_course(course_data: dict):
    try:
        name = course_data.get("name")
        code = course_data.get("code")
        description = course_data.get("description")
        duration_years = int(course_data.get("duration_years") or 3)
        total_semesters = int(course_data.get("total_semesters") or (duration_years * 2))

        if not name or not code:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Course name and code are required."}
            )

        clean_code = str(code).strip().upper()
        clean_name = str(name).strip()

        existing = Course.query.filter(Course.code == clean_code).first()
        if existing:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": f"Course with code '{clean_code}' already exists."}
            )

        course = Course(
            name=clean_name,
            code=clean_code,
            description=str(description).strip() if description else None,
            duration_years=duration_years,
            total_semesters=total_semesters
        )
        db.session.add(course)
        db.session.flush()

        # Automatically generate semester records (1 year = 2 semesters)
        for sem_num in range(1, total_semesters + 1):
            sem = Semester(
                course_id=course.id,
                semester_number=sem_num,
                academic_year="2026-2027"
            )
            db.session.add(sem)

        db.session.commit()

        return JSONResponse(
            status_code=201,
            content={
                "success": True,
                "message": "Course created successfully with semesters",
                "data": course.to_dict(include_subjects=False, include_semesters=False)
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Create course error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to create course", "error": str(e)}
        )


def update_course(course_id: int, course_data: dict):
    try:
        course = Course.query.filter(Course.id == course_id).first()
        if not course:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Course with id {course_id} not found."}
            )

        if "name" in course_data and course_data["name"]:
            course.name = str(course_data["name"]).strip()

        if "code" in course_data and course_data["code"]:
            new_code = str(course_data["code"]).strip().upper()
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

        if "description" in course_data:
            desc = course_data["description"]
            course.description = str(desc).strip() if desc else None

        if "duration_years" in course_data and course_data["duration_years"]:
            course.duration_years = int(course_data["duration_years"])

        if "total_semesters" in course_data and course_data["total_semesters"]:
            course.total_semesters = int(course_data["total_semesters"])

        db.session.commit()

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Course updated successfully",
                "data": course.to_dict(include_subjects=False, include_semesters=False)
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Update course error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to update course", "error": str(e)}
        )


def delete_course(course_id: int):
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
        print("Delete course error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to delete course", "error": str(e)}
        )


def create_subject(course_id: int, subject_data: dict):
    try:
        course = Course.query.filter(Course.id == course_id).first()
        if not course:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Course not found"}
            )

        name = subject_data.get("name")
        code = subject_data.get("code")
        semester_val = subject_data.get("semester")
        semester_id = subject_data.get("semester_id")
        room = subject_data.get("room") or "Block B, Hall 3"
        schedule = subject_data.get("schedule") or "Mon, Wed, Fri - 10:15 AM"
        teacher_id = subject_data.get("teacher_id")

        if not name or not code:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Subject name and code are required."}
            )

        # Resolve semester
        target_sem = None
        if semester_id:
            target_sem = Semester.query.filter(
                Semester.id == semester_id,
                Semester.course_id == course_id
            ).first()

        if not target_sem and semester_val:
            nums = re.findall(r"\d+", str(semester_val))
            if nums:
                sem_num = int(nums[0])
                target_sem = Semester.query.filter(
                    Semester.course_id == course_id,
                    Semester.semester_number == sem_num
                ).first()

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
            d_name = room_conflict_info.get("day_name", "the requested day")
            c_start = room_conflict_info.get("conflict_start", "")
            c_end = room_conflict_info.get("conflict_end", "")
            c_sub = room_conflict_info.get("subject_name", "another class")
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "conflict": True,
                    "room_conflict": True,
                    "message": f"Room '{clean_room}' is not available at this time. Already booked on {d_name} ({c_start} - {c_end}) for '{c_sub}'. Please choose another room or change the timing.",
                    "conflict_details": room_conflict_info,
                },
            )

        # Check teacher availability
        if teacher_id:
            has_conflict, conflict_info = check_teacher_schedule_conflict(teacher_id, clean_sched)
            if has_conflict:
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
                        "conflict_details": conflict_info
                    }
                )

        subject = Subject(
            course_id=course_id,
            semester_id=target_sem.id if target_sem else None,
            teacher_id=teacher_id if teacher_id else None,
            name=str(name).strip(),
            code=str(code).strip().upper(),
            room=clean_room,
            schedule=clean_sched
        )
        db.session.add(subject)
        db.session.flush()

        # Teacher assignment if teacher_id provided
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
                room=clean_room,
                schedule=clean_sched,
                status="active"
            )
            db.session.add(assignment)
            db.session.flush()

            sync_assignment_timetable(assignment.id, clean_sched)

        db.session.commit()

        return JSONResponse(
            status_code=201,
            content={
                "success": True,
                "message": "Subject created successfully",
                "data": subject.to_dict()
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Create subject error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to create subject", "error": str(e)}
        )


def update_subject(subject_id: int, subject_data: dict):
    try:
        subject = Subject.query.filter(Subject.id == subject_id).first()
        if not subject:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Subject with id {subject_id} not found."}
            )

        if "name" in subject_data and subject_data["name"]:
            subject.name = str(subject_data["name"]).strip()

        if "code" in subject_data and subject_data["code"]:
            subject.code = str(subject_data["code"]).strip().upper()

        if "room" in subject_data and subject_data["room"]:
            subject.room = str(subject_data["room"]).strip()

        if "schedule" in subject_data and subject_data["schedule"]:
            subject.schedule = str(subject_data["schedule"]).strip()

        if "teacher_id" in subject_data:
            subject.teacher_id = subject_data["teacher_id"]

        if "semester_id" in subject_data:
            subject.semester_id = subject_data["semester_id"]

        from app.modules.course.timetable_helper import (
            check_room_schedule_conflict,
            check_teacher_schedule_conflict,
            sync_assignment_timetable,
        )

        if any(k in subject_data for k in ("room", "schedule", "teacher_id")) and subject.room and subject.schedule:
            room_conflict, room_conflict_info = check_room_schedule_conflict(
                subject.room,
                subject.schedule,
                exclude_subject_id=subject.id,
            )
            if room_conflict:
                d_name = room_conflict_info.get("day_name", "the requested day")
                c_start = room_conflict_info.get("conflict_start", "")
                c_end = room_conflict_info.get("conflict_end", "")
                c_sub = room_conflict_info.get("subject_name", "another class")
                return JSONResponse(
                    status_code=400,
                    content={
                        "success": False,
                        "conflict": True,
                        "room_conflict": True,
                        "message": f"Room '{subject.room}' is not available at this time. Already booked on {d_name} ({c_start} - {c_end}) for '{c_sub}'. Please choose another room or change the timing.",
                        "conflict_details": room_conflict_info,
                    },
                )

            if subject.teacher_id:
                has_conflict, conflict_info = check_teacher_schedule_conflict(
                    subject.teacher_id,
                    subject.schedule,
                    exclude_subject_id=subject.id,
                )
                if has_conflict:
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

            for a in TeacherAssignment.query.filter(TeacherAssignment.subject_id == subject.id).all():
                a.room = subject.room
                a.schedule = subject.schedule
                if subject.teacher_id:
                    a.teacher_id = subject.teacher_id
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
        print("Update subject error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to update subject", "error": str(e)}
        )


def delete_subject(subject_id: int):
    try:
        subject = Subject.query.filter(Subject.id == subject_id).first()
        if not subject:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": f"Subject with id {subject_id} not found."}
            )

        sub_name = subject.name
        db.session.delete(subject)
        db.session.commit()

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": f"Subject '{sub_name}' deleted successfully."
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Delete subject error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to delete subject", "error": str(e)}
        )


def get_course_students(course_id: int):
    try:
        course = Course.query.filter(Course.id == course_id).first()
        if not course:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Course not found"}
            )

        enrollments = CourseEnrollment.query.filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.status == "active"
        ).all()

        student_list = [e.student.to_dict() for e in enrollments if e.student]

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": {
                    "course_id": course.id,
                    "course_name": course.name,
                    "course_code": course.code,
                    "total_students": len(student_list),
                    "students": student_list
                }
            }
        )
    except Exception as e:
        db.session.rollback()
        print("Get course students error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to fetch course students", "error": str(e)}
        )


# =========================================================================
# COMMON ROLE BRIDGES: TEACHER & STUDENT ASSIGNED COURSES
# =========================================================================

def get_teacher_assigned_courses(user_id: int):
    """
    Centralized method for teacher courses using the common Course module.
    Returns assigned courses along with ONLY the teacher's assigned subjects,
    schedule, room, semester info, and accurate enrolled student count.
    """
    try:
        teacher = Teacher.query.filter(Teacher.user_id == user_id).first()
        if not teacher:
            return JSONResponse(
                status_code=200,
                content={"success": True, "count": 0, "data": []}
            )

        assignments = TeacherAssignment.query.filter(
            TeacherAssignment.teacher_id == teacher.id,
            or_(TeacherAssignment.status.is_(None), TeacherAssignment.status != "inactive"),
        ).all()

        direct_subjects = Subject.query.filter(Subject.teacher_id == teacher.id).all()

        course_subjects_map = {}  # course_id -> {subject_id: subject_dict}
        course_ids_order = []

        def ensure_course_bucket(cid: int):
            if cid not in course_subjects_map:
                course_subjects_map[cid] = {}
                course_ids_order.append(cid)

        for a in assignments:
            c_id = a.course_id or (a.course_subject.course_id if a.course_subject else None)
            if not c_id:
                continue
            ensure_course_bucket(c_id)

            sub_obj = a.subject or (a.course_subject.subject if a.course_subject else None)
            if sub_obj and sub_obj.id not in course_subjects_map[c_id]:
                s_dict = sub_obj.to_dict(include_course=False)
                if a.room:
                    s_dict["room"] = a.room
                if a.schedule:
                    s_dict["schedule"] = a.schedule
                if a.academic_year:
                    s_dict["academic_year"] = a.academic_year
                if a.section:
                    s_dict["section_name"] = a.section.section_name
                sem_num = (
                    s_dict.get("semester_number")
                    or (a.semester_rel.semester_number if a.semester_rel else None)
                    or (a.course_subject.semester.semester_number if a.course_subject and a.course_subject.semester else None)
                )
                if sem_num and not s_dict.get("semester"):
                    s_dict["semester_number"] = sem_num
                    s_dict["semester"] = f"Semester {sem_num}"
                course_subjects_map[c_id][sub_obj.id] = s_dict

        for sub in direct_subjects:
            if not sub.course_id:
                continue
            ensure_course_bucket(sub.course_id)
            if sub.id not in course_subjects_map[sub.course_id]:
                course_subjects_map[sub.course_id][sub.id] = sub.to_dict(include_course=False)

        if not course_ids_order:
            return JSONResponse(
                status_code=200,
                content={"success": True, "count": 0, "data": []}
            )

        courses = Course.query.filter(Course.id.in_(course_ids_order)).order_by(Course.id.asc()).all()

        result = []
        for c in courses:
            c_dict = c.to_dict(include_subjects=False, include_semesters=False)
            active_enr_count = CourseEnrollment.query.filter(
                CourseEnrollment.course_id == c.id,
                CourseEnrollment.status == "active",
            ).count()
            if active_enr_count == 0:
                active_enr_count = Student.query.filter(Student.course_id == c.id).count()

            assigned_subs = sorted(
                course_subjects_map.get(c.id, {}).values(),
                key=lambda s: (s.get("semester_number") or 999, s.get("id") or 0),
            )

            sem_map = {}
            for s in assigned_subs:
                sem_label = s.get("semester")
                sem_num = s.get("semester_number")
                if sem_label and sem_label not in sem_map:
                    sem_map[sem_label] = {
                        "id": s.get("semester_id"),
                        "semester_number": sem_num,
                        "name": sem_label,
                    }

            c_dict["enrolled_students_count"] = active_enr_count
            c_dict["subjects"] = assigned_subs
            c_dict["assigned_subjects_count"] = len(assigned_subs)
            c_dict["assigned_semesters"] = list(sem_map.values())
            result.append(c_dict)

        return JSONResponse(
            status_code=200,
            content={"success": True, "count": len(result), "data": result}
        )
    except Exception as e:
        db.session.rollback()
        print("Get teacher assigned courses error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to fetch teacher courses", "error": str(e)}
        )


def get_student_enrolled_courses(user_id: int):
    """
    Centralized method for student enrolled course(s) using the common Course module.
    """
    try:
        student = Student.query.filter(Student.user_id == user_id).first()
        if not student:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Student profile not found"}
            )

        enrollments = CourseEnrollment.query.filter(
            CourseEnrollment.student_id == student.id,
            CourseEnrollment.status == "active"
        ).all()

        result = []
        for enr in enrollments:
            course = enr.course
            if course:
                c_dict = course.to_dict(include_subjects=False, include_semesters=False)
                c_dict["enrolled_semester"] = enr.semester
                c_dict["enrolled_semester_id"] = enr.semester_id
                c_dict["academic_year"] = enr.academic_year
                result.append(c_dict)

        # Fallback to student.course_id if no explicit enrollment records
        if not result and student.course_id:
            c = Course.query.filter(Course.id == student.course_id).first()
            if c:
                c_dict = c.to_dict(include_subjects=False, include_semesters=False)
                c_dict["enrolled_semester"] = student.current_semester or "Semester 1"
                result.append(c_dict)

        return JSONResponse(
            status_code=200,
            content={"success": True, "count": len(result), "data": result}
        )
    except Exception as e:
        db.session.rollback()
        print("Get student enrolled courses error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to fetch student courses", "error": str(e)}
        )


def seed_default_courses_if_empty():
    pass
