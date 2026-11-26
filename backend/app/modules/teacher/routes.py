from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.middleware.auth import token_required
from .service import (
    save_teacher_profile,
    get_teacher_profile,
    get_all_teachers,
    process_attendance_scan,
    get_attendance_history,
    get_teacher_courses,
    get_teacher_students,
    get_teacher_reports,
)

teacher_bp = APIRouter(
    prefix="/api/teacher",
    tags=["teacher"]
)


class TeacherProfileSchema(BaseModel):
    employee_code: Optional[str] = None
    faculty_id: Optional[str] = None
    identifier: Optional[str] = None
    phone: Optional[str] = None
    profile_image: Optional[str] = None
    photo: Optional[str] = None


class AttendanceScanSchema(BaseModel):
    photos: List[str]
    course_id: Optional[int] = None
    course: Optional[str] = None
    subject_id: Optional[int] = None
    subject: Optional[str] = "Computer Vision (CS-401)"
    room: Optional[str] = "Block B, Hall 3"
    batch: Optional[str] = None
    semester_id: Optional[int] = None


class AttendanceConfirmSchema(BaseModel):
    records: Optional[List[dict]] = None


@teacher_bp.post("/profile")
async def create_or_update_profile(
    payload: TeacherProfileSchema,
    user_id: int = Depends(token_required)
):
    return save_teacher_profile(user_id, payload.model_dump())


@teacher_bp.get("/profile")
async def get_profile(user_id: int = Depends(token_required)):
    return get_teacher_profile(user_id)


@teacher_bp.get("/all")
async def get_teachers(user_id: int = Depends(token_required)):
    return get_all_teachers()


@teacher_bp.get("/courses")
async def teacher_courses(user_id: int = Depends(token_required)):
    return get_teacher_courses(user_id)


@teacher_bp.get("/students")
async def teacher_students(user_id: int = Depends(token_required)):
    return get_teacher_students(user_id)


@teacher_bp.get("/reports")
async def teacher_reports(user_id: int = Depends(token_required)):
    return get_teacher_reports(user_id)


@teacher_bp.post("/attendance/scan")
async def scan_attendance(
    payload: AttendanceScanSchema,
    user_id: int = Depends(token_required)
):
    return process_attendance_scan(user_id, payload.model_dump())


@teacher_bp.get("/attendance/history")
async def attendance_history(user_id: int = Depends(token_required)):
    return get_attendance_history(user_id)


@teacher_bp.post("/attendance/sessions/{session_id}/confirm")
async def confirm_session(
    session_id: int,
    payload: Optional[AttendanceConfirmSchema] = None,
    user_id: int = Depends(token_required)
):
    from app.modules.attendance.service import confirm_attendance_session
    data = payload.model_dump() if payload else {}
    return confirm_attendance_session(user_id, session_id, data)
