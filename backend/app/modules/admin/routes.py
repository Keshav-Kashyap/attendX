from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from app.modules.admin.decorator import admin_required
from app.modules.users.model import User
from app.modules.admin.service import (
    admin_get_all_courses,
    admin_create_course,
    admin_update_course,
    admin_delete_course,
    admin_get_course_semesters,
    admin_get_semester_subjects,
    admin_create_subject,
    admin_update_subject,
    admin_delete_subject,
    admin_get_course_batches,
    admin_enroll_batch,
    admin_update_enrollment,
    admin_get_all_teachers,
    admin_create_teacher,
    admin_create_student,
    admin_get_all_students,
    admin_get_teacher_assignments,
    admin_assign_teacher,
    admin_update_teacher_assignment,
    admin_remove_teacher_assignment,
    admin_check_teacher_availability,
    admin_check_room_availability,
    admin_get_booked_room_slots,
    admin_get_stats,
)

admin_bp = APIRouter(
    prefix="/api/admin",
    tags=["admin"]
)


# =========================================================================
# Temporary Helper: Open Route to Create or Reset Admin
# =========================================================================

class CreateAdminDirectSchema(BaseModel):
    email: Optional[str] = "admin@gmail.com"
    password: Optional[str] = "admin123"
    username: Optional[str] = "Admin"


@admin_bp.api_route("/create-admin", methods=["GET", "POST"])
async def create_admin_direct(payload: Optional[CreateAdminDirectSchema] = None):
    """
    Temporary route to easily create or reset an admin user without any auth.
    Defaults to: admin@gmail.com / admin123
    Can be accessed directly via browser URL (GET) or via POST request.
    """
    from app.config.database import db
    from app.utils.common import hash_password

    email = (payload.email if payload and payload.email else "admin@gmail.com").strip().lower()
    password = payload.password if payload and payload.password else "admin123"
    username = payload.username if payload and payload.username else "Admin"

    try:
        user = User.query.filter(User.email == email).first()
        if user:
            user.role = "admin"
            user.password = hash_password(password)
            user.is_active = True
            user.username = username
            msg = f"User '{email}' updated with role='admin' and password='{password}'!"
        else:
            user = User(
                email=email,
                username=username,
                password=hash_password(password),
                role="admin",
                auth_provider="email",
                is_active=True
            )
            db.session.add(user)
            msg = f"New Admin user '{email}' created with password='{password}'!"

        db.session.commit()

        return {
            "success": True,
            "message": msg,
            "credentials": {
                "email": user.email,
                "password": password,
                "role": user.role,
                "user_id": user.id
            }
        }
    except Exception as e:
        db.session.rollback()
        return {
            "success": False,
            "message": f"Error creating admin: {str(e)}"
        }


# =========================================================================
# Pydantic Schemas for Validation
# =========================================================================

class CourseCreateSchema(BaseModel):
    name: str = Field(..., description="Full course title, e.g. 'Bachelor of Computer Applications'")
    code: str = Field(..., description="Unique course code, e.g. 'BCA'")
    description: Optional[str] = Field(None, description="Course summary or details")
    duration_years: Optional[int] = Field(default=3, description="Course duration in years (e.g. 2, 3, 4)")
    total_semesters: Optional[int] = Field(default=None, description="Total semesters (e.g. 4, 6, 8)")
    semesters: Optional[List[str]] = Field(default=[], description="List of semesters, e.g. ['Semester 1', 'Semester 2']")
    subjects: Optional[List[dict]] = Field(default=[], description="Optional initial list of subjects")


class CourseUpdateSchema(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    duration_years: Optional[int] = None
    total_semesters: Optional[int] = None


class SubjectCreateSchema(BaseModel):
    name: str = Field(..., description="Subject name, e.g. 'Data Structures'")
    code: str = Field(..., description="Subject code, e.g. 'CS-201'")
    semester_id: Optional[int] = Field(None, description="Semester ID in semesters table")
    semester: Optional[str] = Field(default="Semester 1", description="Semester name e.g. 'Semester 1'")
    room: Optional[str] = Field(default="Block B, Hall 3", description="Classroom / Hall")
    schedule: Optional[str] = Field(default="Mon, Wed, Fri - 10:15 AM", description="Weekly timetable schedule")
    teacher_id: Optional[int] = Field(None, description="ID of teacher to assign immediately")
    academic_year: Optional[str] = Field(default="2026-2027", description="Academic year / batch")


class SubjectUpdateSchema(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    semester_id: Optional[int] = None
    semester: Optional[str] = None
    room: Optional[str] = None
    schedule: Optional[str] = None
    teacher_id: Optional[int] = None
    academic_year: Optional[str] = None


class BatchEnrollSchema(BaseModel):
    academic_year: Optional[str] = Field(default="2026-2027", description="Batch / Academic year e.g. '2026-2027'")
    batch: Optional[str] = None
    semester: Optional[str] = Field(default="Semester 1", description="Semester name e.g. 'Semester 1'")
    student_ids: Optional[List[int]] = Field(default=[], description="List of student IDs to enroll")
    enroll_all_unassigned: Optional[bool] = Field(default=False, description="Enroll all unassigned students")


class EnrollmentUpdateSchema(BaseModel):
    semester: Optional[str] = None
    academic_year: Optional[str] = None
    batch: Optional[str] = None
    status: Optional[str] = Field(None, description="Enrollment status: 'active', 'inactive', 'graduated'")


class TeacherAssignSchema(BaseModel):
    teacher_id: int = Field(..., description="ID of teacher profile")
    course_id: int = Field(..., description="ID of course")
    subject_id: int = Field(..., description="ID of subject")
    room: Optional[str] = Field(default="Block B, Hall 3", description="Assigned room")
    schedule: Optional[str] = Field(default="Mon, Wed, Fri - 10:15 AM", description="Assigned schedule")
    academic_year: Optional[str] = Field(default="2026-2027", description="Academic year / batch")


class TeacherAssignUpdateSchema(BaseModel):
    teacher_id: Optional[int] = None
    room: Optional[str] = None
    schedule: Optional[str] = None
    academic_year: Optional[str] = None
    batch: Optional[str] = None


class TeacherCreateSchema(BaseModel):
    name: str = Field(..., description="Teacher full name")
    email: str = Field(..., description="Teacher email address")
    password: Optional[str] = Field(default="teacher123", description="Initial login password")
    employee_code: Optional[str] = Field(None, description="Employee code e.g. FAC-1004")
    phone: Optional[str] = Field(None, description="Contact phone")
    qualification: Optional[str] = Field(None, description="Academic qualification e.g. Ph.D., M.Tech")
    specialization: Optional[str] = Field(None, description="Subject specialization e.g. AI & ML")
    department: Optional[str] = Field(None, description="Department name fallback")
    joining_date: Optional[str] = Field(None, description="Optional joining date (YYYY-MM-DD)")
    course_id: Optional[int] = Field(None, description="Initial course assignment")
    subject_id: Optional[int] = Field(None, description="Initial subject assignment")
    room: Optional[str] = Field(default="Block B, Hall 3", description="Assigned room")
    schedule: Optional[str] = Field(default="Mon, Wed, Fri - 10:15 AM", description="Assigned schedule")


class StudentCreateSchema(BaseModel):
    name: str = Field(..., description="Student full name")
    email: str = Field(..., description="Student email address")
    password: Optional[str] = Field(default="student123", description="Initial login password")
    roll_number: Optional[str] = Field(None, description="Roll number e.g. STU-1004")
    phone: Optional[str] = Field(None, description="Contact phone")
    profile_image: Optional[str] = Field(None, description="Optional base64 or URL student photo")
    photo: Optional[str] = Field(None, description="Optional alias for student photo")
    course_id: Optional[int] = Field(None, description="Course ID to enroll into")
    semester_id: Optional[int] = Field(None, description="Semester ID")
    semester: Optional[str] = Field(default="Semester 1", description="Semester name e.g. 'Semester 1'")
    academic_year: Optional[str] = Field(default="2026-2027", description="Academic year / batch")



@admin_bp.get("/courses")
@admin_bp.get("/courses/")
async def list_courses(current_admin: User = Depends(admin_required)):
    """List all courses with subjects count, teachers count, and semesters."""
    return admin_get_all_courses()


@admin_bp.post("/courses")
async def create_course(
    payload: CourseCreateSchema,
    current_admin: User = Depends(admin_required)
):
    """Create a new course with optional semesters and initial subjects."""
    return admin_create_course(payload.model_dump())


@admin_bp.put("/courses/{course_id}")
async def update_course(
    course_id: int,
    payload: CourseUpdateSchema,
    current_admin: User = Depends(admin_required)
):
    """Edit course name, code, or description."""
    return admin_update_course(course_id, payload.model_dump(exclude_unset=True))


@admin_bp.delete("/courses/{course_id}")
async def delete_course(
    course_id: int,
    current_admin: User = Depends(admin_required)
):
    """Delete a course and all associated subjects, enrollments, and assignments."""
    return admin_delete_course(course_id)


# =========================================================================
# 2. Semester & Subject Endpoints
# =========================================================================

@admin_bp.get("/courses/{course_id}/semesters")
async def list_course_semesters(
    course_id: int,
    current_admin: User = Depends(admin_required)
):
    """Get all distinct semesters for a course with subject and student summaries."""
    return admin_get_course_semesters(course_id)


@admin_bp.get("/semesters/{semester_id}/subjects")
async def list_semester_subjects(
    semester_id: int,
    current_admin: User = Depends(admin_required)
):
    return admin_get_semester_subjects(semester_id)


@admin_bp.post("/courses/{course_id}/subjects")
async def add_course_subject(
    course_id: int,
    payload: SubjectCreateSchema,
    current_admin: User = Depends(admin_required)
):
    """Add a new subject to a course with semester and optional teacher assignment."""
    return admin_create_subject(course_id, payload.model_dump())


@admin_bp.put("/subjects/{subject_id}")
async def update_course_subject(
    subject_id: int,
    payload: SubjectUpdateSchema,
    current_admin: User = Depends(admin_required)
):
    """Edit subject name, code, semester, room, schedule, or assigned teacher."""
    return admin_update_subject(subject_id, payload.model_dump(exclude_unset=True))


@admin_bp.delete("/subjects/{subject_id}")
async def delete_course_subject(
    subject_id: int,
    current_admin: User = Depends(admin_required)
):
    """Delete a subject from a course."""
    return admin_delete_subject(subject_id)


# =========================================================================
# 3. Batch & Enrollment Management Endpoints
# =========================================================================

@admin_bp.get("/courses/{course_id}/batches")
async def list_course_batches(
    course_id: int,
    current_admin: User = Depends(admin_required)
):
    """Get all student batches enrolled in a course grouped by academic year and semester."""
    return admin_get_course_batches(course_id)


@admin_bp.post("/courses/{course_id}/batches/enroll")
async def enroll_student_batch(
    course_id: int,
    payload: BatchEnrollSchema,
    current_admin: User = Depends(admin_required)
):
    """Enroll a batch of students to a course for a specific semester and academic year."""
    return admin_enroll_batch(course_id, payload.model_dump())


@admin_bp.put("/enrollments/{enrollment_id}")
async def update_student_enrollment(
    enrollment_id: int,
    payload: EnrollmentUpdateSchema,
    current_admin: User = Depends(admin_required)
):
    """Update student enrollment semester, batch, or status (e.g. active/inactive)."""
    return admin_update_enrollment(enrollment_id, payload.model_dump(exclude_unset=True))


@admin_bp.delete("/enrollments/{enrollment_id}")
async def remove_student_enrollment(
    enrollment_id: int,
    current_admin: User = Depends(admin_required)
):
    """Unenroll a student from a course."""
    return admin_remove_enrollment(enrollment_id)


# =========================================================================
# 4. Teacher Assignment Endpoints
# =========================================================================

@admin_bp.get("/teachers")
async def list_admin_teachers(current_admin: User = Depends(admin_required)):
    """List all teachers with contact info and currently assigned courses/subjects."""
    return admin_get_all_teachers()


@admin_bp.get("/teachers/check-availability")
async def check_teacher_free_slot(
    teacher_id: int = Query(...),
    schedule: str = Query(...),
    subject_id: Optional[int] = Query(None),
    current_admin: User = Depends(admin_required)
):
    """Check if a teacher is available for a specified timetable schedule."""
    return admin_check_teacher_availability(teacher_id, schedule, subject_id)


@admin_bp.get("/rooms/check-availability")
async def check_room_free_slot(
    room: str = Query(...),
    schedule: str = Query(...),
    subject_id: Optional[int] = Query(None),
    current_admin: User = Depends(admin_required)
):
    """Check if a classroom/room is available for a specified timetable schedule."""
    return admin_check_room_availability(room, schedule, subject_id)


@admin_bp.get("/rooms/booked-slots")
async def list_booked_room_slots(
    current_admin: User = Depends(admin_required)
):
    """Return all currently booked room schedules for instant upfront slot filtering."""
    return admin_get_booked_room_slots()


@admin_bp.post("/teachers")
async def create_new_teacher(
    payload: TeacherCreateSchema,
    current_admin: User = Depends(admin_required)
):
    """Register and create a new faculty member with credentials and optional subject assignment."""
    return admin_create_teacher(payload.model_dump())


@admin_bp.get("/students")
async def list_admin_students(
    search: Optional[str] = Query(None),
    course_id: Optional[int] = Query(None),
    semester_id: Optional[int] = Query(None),
    current_admin: User = Depends(admin_required)
):
    """List all students for admin with course, semester, and enrollment details."""
    return admin_get_all_students(search, course_id, semester_id)


@admin_bp.post("/students")
async def create_new_student(
    payload: StudentCreateSchema,
    current_admin: User = Depends(admin_required)
):
    """Register and create a new student with roll number and course/semester enrollment."""
    return admin_create_student(payload.model_dump())


@admin_bp.get("/teacher-assignments")
async def list_teacher_assignments(
    course_id: Optional[int] = Query(None),
    teacher_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    current_admin: User = Depends(admin_required)
):
    """List teacher assignments with optional filters by course, teacher, or subject."""
    return admin_get_teacher_assignments(course_id, teacher_id, subject_id)


@admin_bp.post("/teacher-assignments")
async def assign_teacher_to_course(
    payload: TeacherAssignSchema,
    current_admin: User = Depends(admin_required)
):
    """Assign a teacher to a course subject with room, schedule, and batch."""
    return admin_assign_teacher(payload.model_dump())


@admin_bp.put("/teacher-assignments/{assignment_id}")
async def update_teacher_assignment(
    assignment_id: int,
    payload: TeacherAssignUpdateSchema,
    current_admin: User = Depends(admin_required)
):
    """Update teacher assignment room, schedule, batch, or reassign teacher."""
    return admin_update_teacher_assignment(assignment_id, payload.model_dump(exclude_unset=True))


@admin_bp.delete("/teacher-assignments/{assignment_id}")
async def unassign_teacher(
    assignment_id: int,
    current_admin: User = Depends(admin_required)
):
    """Remove a teacher assignment."""
    return admin_remove_teacher_assignment(assignment_id)


@admin_bp.get("/stats")
async def get_admin_stats(current_admin: User = Depends(admin_required)):
    """Get course management metrics and breakdown for the admin dashboard."""
    return admin_get_stats()
