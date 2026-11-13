from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from .service import (
    login_user,
    register_user,
    get_current_user,
    logout_user,
    change_user_password
)
from app.middleware.auth import token_required

auth_bp = APIRouter(
    prefix="/api/auth",
    tags=["auth"]
)


class RegisterSchema(BaseModel):
    email: str
    password: str
    username: Optional[str] = None
    role: Optional[str] = "student"
    auth_provider: Optional[str] = "email"
    course: Optional[str] = None
    course_id: Optional[int] = None
    roll_number: Optional[str] = None
    employee_code: Optional[str] = None
    identifier: Optional[str] = None
    phone: Optional[str] = None


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


@auth_bp.post("/logout")
async def logout():
    return logout_user()
