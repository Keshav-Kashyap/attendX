import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Models (Import to ensure SQLAlchemy metadata registration)
from app.modules.course.model import Course, Semester, Subject, CourseEnrollment
from app.modules.users.model import User
from app.modules.student.model import Student
from app.modules.teacher.model import Teacher, TeacherAssignment
from app.modules.attendance.model import AttendanceSession, AttendanceRecord

# Database
from app.config.database import connect_db
from app.modules.course.service import seed_default_courses_if_empty

# Routers
from app.modules.auth.routes import auth_bp
from app.modules.student.routes import student_bp
from app.modules.teacher.routes import teacher_bp
from app.modules.course.routes import course_bp
from app.modules.attendance.routes import attendance_bp
from app.modules.admin import admin_bp, seed_default_admin_if_empty


@asynccontextmanager
async def lifespan(app: FastAPI):
    connect_db()
    seed_default_admin_if_empty()
    yield


app = FastAPI(
    title="AI_ATTENDENCE API",
    description="Backend API for AI_ATTENDENCE platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Session Lifecycle Middleware
@app.middleware("http")
async def db_session_middleware(request, call_next):
    from app.config.database import db
    try:
        response = await call_next(request)
        return response
    except Exception:
        db.session.rollback()
        raise
    finally:
        db.session.remove()

# Register Routers
app.include_router(auth_bp)
app.include_router(student_bp)
app.include_router(teacher_bp)
app.include_router(course_bp)
app.include_router(attendance_bp)
app.include_router(admin_bp)

@app.get("/")
def root():
    return {
        "message": "AI_ATTENDENCE backend is running"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("run:app", host="0.0.0.0", port=5001, reload=True)