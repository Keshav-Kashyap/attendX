from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, Any
from app.middleware.auth import token_required
from .service import (
    save_student_profile,
    get_student_profile,
    get_student_dashboard,
    get_student_attendance_details,
)

student_bp = APIRouter(
    prefix="/api/student",
    tags=["student"]
)


class StudentProfileSchema(BaseModel):
    roll_number: Optional[str] = None
    course_id: Optional[int] = None
    phone: Optional[str] = None
    profile_image: Optional[str] = None
    photo: Optional[str] = None
    voice: Optional[str] = None
    voice_sample: Optional[str] = None
    face_embedding: Optional[Any] = None
    voice_embedding: Optional[Any] = None


@student_bp.post("/profile")
async def create_or_update_profile(
    payload: StudentProfileSchema,
    user_id: int = Depends(token_required)
):
    return save_student_profile(user_id, payload.model_dump())


@student_bp.get("/profile")
async def get_profile(user_id: int = Depends(token_required)):
    return get_student_profile(user_id)


@student_bp.get("/courses")
async def get_courses(user_id: int = Depends(token_required)):
    from app.modules.course.service import get_student_enrolled_courses
    return get_student_enrolled_courses(user_id)


@student_bp.get("/dashboard")
async def get_dashboard(user_id: int = Depends(token_required)):
    return get_student_dashboard(user_id)


@student_bp.get("/attendance")
async def get_attendance(user_id: int = Depends(token_required)):
    return get_student_attendance_details(user_id)

