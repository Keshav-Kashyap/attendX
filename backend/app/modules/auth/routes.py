import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from .model import InviteToken
from .service import (
    login_user,
    register_user,
    get_current_user,
    logout_user,
    change_user_password
)
from app.config.database import db
from app.middleware.auth import token_required
from app.modules.admin.decorator import get_current_admin
from app.modules.users.model import User

auth_bp = APIRouter(
    prefix="/api/auth",
    tags=["auth"]
)


class RegisterSchema(BaseModel):
    invite_token: Optional[str] = None
    email: str
    password: str
    username: Optional[str] = None
    role: Optional[str] = "student"
    auth_provider: Optional[str] = "email"
    course: Optional[str] = None
    course_id: Optional[int] = None
    semester_id: Optional[int] = None
    roll_number: Optional[str] = None
    employee_code: Optional[str] = None
    identifier: Optional[str] = None
    phone: Optional[str] = None
    profile_image: Optional[str] = None
    photo: Optional[str] = None
    qualification: Optional[str] = None
    specialization: Optional[str] = None


class InviteTokenCreateSchema(BaseModel):
    role: str = "student"
    course_id: Optional[int] = None
    semester_id: Optional[int] = None
    expires_in_minutes: Optional[int] = 15


class LoginSchema(BaseModel):
    password: str
    login: Optional[str] = None
    email: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None


class ChangePasswordSchema(BaseModel):
    old_password: str
    new_password: str


@auth_bp.post("/register")
async def register(payload: RegisterSchema):
    return register_user(payload.model_dump())


@auth_bp.post("/login")
async def login(payload: LoginSchema):
    return login_user(payload.model_dump())


@auth_bp.get("/me")
async def me(user_id: int = Depends(token_required)):
    return get_current_user(user_id)


@auth_bp.post("/change-password")
async def change_password(payload: ChangePasswordSchema, user_id: int = Depends(token_required)):
    return change_user_password(user_id, payload.model_dump())


@auth_bp.post("/invite-token")
async def create_invite_token(
    payload: InviteTokenCreateSchema,
    admin_user: User = Depends(get_current_admin),
):
    from app.modules.course.model import Course, Semester

    role = str(payload.role or "student").strip().lower()
    if role not in ("student", "teacher"):
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Invite role must be 'student' or 'teacher'."},
        )

    course_id = None
    semester_id = None
    if role == "student":
        if not payload.course_id:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "course_id is required for student invite."},
            )
        course = Course.query.filter(Course.id == payload.course_id).first()
        if not course:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "Selected course not found."},
            )
        course_id = course.id

        sem = None
        if payload.semester_id:
            sem = Semester.query.filter(
                Semester.id == payload.semester_id,
                Semester.course_id == course.id,
            ).first()
            if not sem:
                sem = Semester.query.filter(
                    Semester.semester_number == payload.semester_id,
                    Semester.course_id == course.id,
                ).first()
        if not sem:
            sem = Semester.query.filter(Semester.course_id == course.id).order_by(
                Semester.semester_number.asc()
            ).first()
        if sem:
            semester_id = sem.id

    ttl_minutes = max(1, min(int(payload.expires_in_minutes or 15), 1440))
    now = datetime.utcnow()
    expires_at = now + timedelta(minutes=ttl_minutes)
    raw_token = secrets.token_urlsafe(24)

    invite = InviteToken(
        token=raw_token,
        role=role,
        course_id=course_id,
        semester_id=semester_id,
        created_by=admin_user.id,
        expires_at=expires_at,
        is_used=False,
    )
    db.session.add(invite)
    db.session.commit()

    return JSONResponse(
        status_code=201,
        content={
            "success": True,
            "data": {
                "token": raw_token,
                "role": role,
                "course_id": course_id,
                "semester_id": semester_id,
                "expires_in_minutes": ttl_minutes,
                "expires_at": expires_at.isoformat() + "Z",
            },
        },
    )


@auth_bp.get("/invite-info")
async def invite_info(token: Optional[str] = None):
    from app.modules.course.model import Course, Semester

    if not token or not str(token).strip():
        return JSONResponse(
            status_code=400,
            content={"success": False, "valid": False, "message": "Invite token is required."},
        )

    invite = InviteToken.query.filter(InviteToken.token == str(token).strip()).first()
    if not invite:
        return JSONResponse(
            status_code=404,
            content={"success": False, "valid": False, "message": "Invalid invite link."},
        )
    if invite.is_used:
        return JSONResponse(
            status_code=410,
            content={
                "success": False,
                "valid": False,
                "message": "This invite link has already been used.",
            },
        )
    if invite.expires_at < datetime.utcnow():
        return JSONResponse(
            status_code=410,
            content={
                "success": False,
                "valid": False,
                "message": "This invite link has expired. Ask your admin for a new QR/link.",
            },
        )

    course_data = None
    semester_data = None
    if invite.course_id:
        course = Course.query.filter(Course.id == invite.course_id).first()
        if course:
            course_data = {
                "id": course.id,
                "name": course.name,
                "code": course.code,
            }
            if invite.semester_id:
                sem = Semester.query.filter(Semester.id == invite.semester_id).first()
                if sem:
                    semester_data = {
                        "id": sem.id,
                        "semester_number": sem.semester_number,
                    }

    return {
        "success": True,
        "valid": True,
        "data": {
            "role": invite.role,
            "course": course_data,
            "semester": semester_data,
            "expires_at": invite.expires_at.isoformat() + "Z",
        },
    }


@auth_bp.post("/logout")
async def logout():
    return logout_user()
