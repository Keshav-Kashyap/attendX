from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional
from app.middleware.auth import token_required
from .service import (
    get_all_courses,
    get_course_by_id,
    get_course_semesters,
    get_semester_subjects,
    get_course_subjects,
    create_course,
    update_course,
    delete_course,
    create_subject,
    update_subject,
    delete_subject,
    get_course_students,
)

course_bp = APIRouter(
    prefix="/api/courses",
    tags=["courses"]
)


class CourseCreateSchema(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    duration_years: Optional[int] = 3
    total_semesters: Optional[int] = None


class CourseUpdateSchema(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    duration_years: Optional[int] = None
    total_semesters: Optional[int] = None


class SubjectCreateSchema(BaseModel):
    name: str
    code: str
    semester_id: Optional[int] = None
    semester: Optional[str] = None
    room: Optional[str] = "Block B, Hall 3"
    schedule: Optional[str] = "Mon, Wed, Fri - 10:15 AM"
    teacher_id: Optional[int] = None


class SubjectUpdateSchema(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    semester_id: Optional[int] = None
    semester: Optional[str] = None
    room: Optional[str] = None
    schedule: Optional[str] = None
    teacher_id: Optional[int] = None


# =========================================================================
# LEVEL 1: ALL COURSES (Lightweight Summary with Counts)
# =========================================================================

@course_bp.get("")
@course_bp.get("/")
async def list_courses(
    teacher_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    role: Optional[str] = Query(None),
):
    """
    Returns limited course overview data (counts only).
    Does NOT return all semesters or all subjects arrays.
    """
    return get_all_courses(teacher_id=teacher_id, user_id=user_id, role=role)


@course_bp.post("")
async def add_course(payload: CourseCreateSchema, user_id: int = Depends(token_required)):
    return create_course(payload.model_dump())


# =========================================================================
# LEVEL 2: COURSE SEMESTERS (Semesters with Subjects Count, No Full Subjects)
# =========================================================================

@course_bp.get("/{course_id}/semesters")
async def list_course_semesters(course_id: int):
    """
    When a particular course is opened: returns its semesters.
    Each semester includes subjects_count, but NOT full subjects list.
    """
    return get_course_semesters(course_id)


# =========================================================================
# LEVEL 3: SEMESTER SUBJECTS (Full Subject Details on Semester Open)
# =========================================================================

@course_bp.get("/semesters/{semester_id}/subjects")
async def list_semester_subjects(semester_id: int):
    """
    When a particular semester is opened/clicked: returns all subjects for that semester.
    """
    return get_semester_subjects(semester_id)


@course_bp.get("/{course_id}/subjects")
async def list_course_subjects(
    course_id: int,
    semester_id: Optional[int] = Query(None),
    semester: Optional[str] = Query(None)
):
    """
    Returns subjects of a course, optionally filtered by semester.
    """
    return get_course_subjects(course_id, semester_id=semester_id, semester=semester)


# =========================================================================
# COURSE DETAILS, ENROLLMENTS & CRUD
# =========================================================================

@course_bp.get("/{course_id}")
async def get_course(course_id: int, include_subjects: bool = Query(False)):
    return get_course_by_id(course_id, include_subjects=include_subjects)


@course_bp.put("/{course_id}")
async def update_course_endpoint(
    course_id: int,
    payload: CourseUpdateSchema,
    user_id: int = Depends(token_required)
):
    return update_course(course_id, payload.model_dump(exclude_unset=True))


@course_bp.delete("/{course_id}")
async def delete_course_endpoint(course_id: int, user_id: int = Depends(token_required)):
    return delete_course(course_id)


@course_bp.get("/{course_id}/students")
async def list_course_students(course_id: int):
    return get_course_students(course_id)


# =========================================================================
# SUBJECT CRUD
# =========================================================================

@course_bp.post("/{course_id}/subjects")
async def add_subject(
    course_id: int,
    payload: SubjectCreateSchema,
    user_id: int = Depends(token_required)
):
    return create_subject(course_id, payload.model_dump())


@course_bp.put("/subjects/{subject_id}")
async def update_subject_endpoint(
    subject_id: int,
    payload: SubjectUpdateSchema,
    user_id: int = Depends(token_required)
):
    return update_subject(subject_id, payload.model_dump(exclude_unset=True))


@course_bp.delete("/subjects/{subject_id}")
async def delete_subject_endpoint(subject_id: int, user_id: int = Depends(token_required)):
    return delete_subject(subject_id)
