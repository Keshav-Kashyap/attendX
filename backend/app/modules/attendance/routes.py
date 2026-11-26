from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.middleware.auth import token_required
from .service import (
    record_attendance_session,
    get_attendance_sessions_history,
    get_session_details,
    update_attendance_record,
    confirm_attendance_session,
)

attendance_bp = APIRouter(
    prefix="/api/attendance",
    tags=["attendance"]
)


class AttendanceScanSchema(BaseModel):
    photos: List[str]
    course_id: Optional[int] = None
    course: Optional[str] = None
    subject_id: Optional[int] = None
    subject: Optional[str] = "Computer Vision (CS-401)"
    room: Optional[str] = "Block B, Hall 3"
    batch: Optional[str] = None
    semester_id: Optional[int] = None


class AttendanceRecordUpdateSchema(BaseModel):
    status: str
    remarks: Optional[str] = None


class AttendanceConfirmSchema(BaseModel):
    records: Optional[List[dict]] = None


@attendance_bp.post("/scan")
async def scan_attendance(
    payload: AttendanceScanSchema,
    user_id: int = Depends(token_required)
):
    return record_attendance_session(user_id, payload.model_dump())


@attendance_bp.get("/history")
async def attendance_history(user_id: int = Depends(token_required)):
    return get_attendance_sessions_history(user_id)


@attendance_bp.get("/sessions/{session_id}")
async def session_details(
    session_id: int,
    user_id: int = Depends(token_required)
):
    return get_session_details(session_id)


@attendance_bp.post("/sessions/{session_id}/confirm")
async def confirm_session(
    session_id: int,
    payload: Optional[AttendanceConfirmSchema] = None,
    user_id: int = Depends(token_required)
):
    data = payload.model_dump() if payload else {}
    return confirm_attendance_session(user_id, session_id, data)


@attendance_bp.put("/records/{record_id}")
async def update_record(
    record_id: int,
    payload: AttendanceRecordUpdateSchema,
    user_id: int = Depends(token_required)
):
    return update_attendance_record(user_id, record_id, payload.model_dump())
