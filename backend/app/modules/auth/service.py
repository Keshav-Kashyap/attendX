from datetime import datetime
from app.config.database import db
from sqlalchemy import or_
from app.modules.users.model import User
from app.modules.student.model import Student
from app.modules.teacher.model import Teacher
from app.modules.auth.model import InviteToken
from app.utils.common import hash_password, verify_password, validate_password
from app.utils.jwt import create_access_token
from fastapi.responses import JSONResponse

VALID_ROLES = {"student", "teacher", "admin"}


def register_user(user_data: dict):
    try:
        invite_token = user_data.get("invite_token")
        if not invite_token or not str(invite_token).strip():
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "A valid invite token is required for registration."
                }
            )

        invite = InviteToken.query.filter(
            InviteToken.token == str(invite_token).strip()
        ).first()
        if not invite:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "Invalid invite link."
                }
            )
        if invite.is_used:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "This invite link has already been used."
                }
            )
        if invite.expires_at < datetime.utcnow():
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "This invite link has expired. Ask your admin for a new QR/link."
                }
            )

        email = user_data.get("email")
        password = user_data.get("password")
        username = user_data.get("username")
        # Enforce role, course, and semester strictly from the verified invite token
        role = invite.role
        auth_provider = user_data.get("auth_provider", "email")

        if not email or not password:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "Email and password are required"
                }
            )

        email = str(email).strip().lower()
        if not username:
            username = email.split("@")[0].strip()
        else:
            username = str(username).strip()

        if not username:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "Username is required"
                }
            )

        # Normalize and validate role
        role = str(role).strip().lower() if role else "student"
        if role not in VALID_ROLES:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": f"Invalid role '{role}'. Allowed roles are: student, teacher, admin"
                }
            )

        # Check if email already exists (only email is unique, username can be duplicate)
        existing_user = User.query.filter(User.email == email).first()

        if existing_user:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "User with this email already exists"
                }
            )

        # Validate password strength
        is_valid, message = validate_password(password)
        if not is_valid:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": message
                }
            )

        hashed_password = hash_password(password)

        photo = user_data.get("profile_image") or user_data.get("photo") or user_data.get("photo_url")

        user = User(
            username=username,
            email=email,
            password=hashed_password,
            role=role,
            profile_image=photo,
            auth_provider=auth_provider,
            is_active=True
        )

        db.session.add(user)
        db.session.flush()

        student_profile_data = None
        teacher_profile_data = None

        if role == "student":
            roll_number = user_data.get("roll_number") or user_data.get("identifier")
            phone = user_data.get("phone")
            course_id = invite.course_id
            semester_id = invite.semester_id
            course = None
            clean_roll = str(roll_number).strip().upper() if roll_number else None

            if clean_roll:
                existing_student = Student.query.filter(Student.roll_number == clean_roll).first()
                if existing_student:
                    return JSONResponse(
                        status_code=400,
                        content={
                            "success": False,
                            "message": f"Roll number '{clean_roll}' is already registered with another student."
                        }
                    )
            else:
                # Auto-increment STU-XXXX roll number sequentially
                existing_rolls = Student.query.with_entities(Student.roll_number).all()
                max_num = 1000
                for (r_val,) in existing_rolls:
                    if r_val and str(r_val).upper().startswith("STU-"):
                        suffix = str(r_val).upper().split("STU-", 1)[1]
                        if suffix.isdigit():
                            max_num = max(max_num, int(suffix))
                next_num = max(max_num + 1, 1000 + Student.query.count() + 1)
                clean_roll = f"STU-{next_num}"
                while Student.query.filter(Student.roll_number == clean_roll).first():
                    next_num += 1
                    clean_roll = f"STU-{next_num}"

            student = Student(
                user_id=user.id,
                roll_number=clean_roll,
                phone=str(phone).strip() if phone else None
            )
            db.session.add(student)
            db.session.flush()

            if photo:
                from app.modules.attendance.ml.face_pipeline import extract_face_embedding
                from app.utils.cloudinary import upload_image_to_cloudinary

                computed_face_emb, face_err = extract_face_embedding(photo)
                if not computed_face_emb:
                    db.session.rollback()
                    return JSONResponse(
                        status_code=400,
                        content={
                            "success": False,
                            "message": face_err or "Could not detect a clear face in your photo. Please upload a clear front-facing photo."
                        }
                    )
                student.face_embedding = computed_face_emb

                clean_identifier = clean_roll or str(student.id)
                cloudinary_url = upload_image_to_cloudinary(
                    photo,
                    folder="attendx/students",
                    public_id=f"student_{student.id}_{clean_identifier}"
                )
                if cloudinary_url:
                    user.profile_image = cloudinary_url

            if course or course_id:
                from app.modules.course.model import Course, CourseEnrollment, Semester
                from sqlalchemy import func
                matched_course = None
                if course_id:
                    matched_course = Course.query.filter(Course.id == course_id).first()
                if not matched_course and course:
                    clean_c = str(course).strip()
                    matched_course = Course.query.filter(
                        or_(
                            func.lower(Course.code) == func.lower(clean_c),
                            func.lower(Course.name) == func.lower(clean_c),
                            Course.code.ilike(f"%{clean_c}%"),
                            Course.name.ilike(f"%{clean_c}%")
                        )
                    ).first()
                if not matched_course:
                    matched_course = Course.query.first()

                if matched_course:
                    matched_semester = None
                    if semester_id:
                        matched_semester = Semester.query.filter(
                            Semester.id == semester_id,
                            Semester.course_id == matched_course.id
                        ).first()
                        if not matched_semester:
                            matched_semester = Semester.query.filter(
                                Semester.semester_number == semester_id,
                                Semester.course_id == matched_course.id
                            ).first()
                    if not matched_semester:
                        matched_semester = Semester.query.filter(
                            Semester.course_id == matched_course.id
                        ).order_by(Semester.semester_number.asc()).first()

                    enrollment = CourseEnrollment(
                        student_id=student.id,
                        course_id=matched_course.id,
                        semester_id=matched_semester.id if matched_semester else None,
                        academic_year="2026-2027",
                        status="active"
                    )
                    db.session.add(enrollment)
                    db.session.flush()

            student_profile_data = student.to_dict()

        elif role == "teacher":
            employee_code = (
                user_data.get("employee_code")
                or user_data.get("identifier")
                or user_data.get("roll_number")
            )
            phone = user_data.get("phone")
            clean_code = str(employee_code).strip() if employee_code else None

            if clean_code:
                existing_teacher = Teacher.query.filter(Teacher.employee_code == clean_code).first()
                if existing_teacher:
                    return JSONResponse(
                        status_code=400,
                        content={
                            "success": False,
                            "message": f"Faculty code '{clean_code}' is already registered with another teacher."
                        }
                    )

            teacher = Teacher(
                user_id=user.id,
                employee_code=clean_code,
                phone=str(phone).strip() if phone else None,
                qualification=str(user_data.get("qualification")).strip() if user_data.get("qualification") else None,
                specialization=str(user_data.get("specialization")).strip() if user_data.get("specialization") else None,
            )
            db.session.add(teacher)
            db.session.flush()
            teacher_profile_data = teacher.to_dict()

        invite.is_used = True
        invite.used_at = datetime.utcnow()
        invite.used_by_user_id = user.id
        db.session.commit()

        return JSONResponse(
            status_code=201,
            content={
                "success": True,
                "message": "User registered successfully",
                "data": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                    "profile_image": user.profile_image,
                    "student_profile": student_profile_data,
                    "teacher_profile": teacher_profile_data
                }
            }
        )

    except Exception as e:
        db.session.rollback()
        print("Registration error:", str(e))
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Internal Server Error",
                "error": str(e)
            }
        )


def login_user(user_data: dict):
    try:
        login_identifier = (
            user_data.get("login")
            or user_data.get("email")
            or user_data.get("username")
        )
        password = user_data.get("password")

        if not login_identifier or not password:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "Email/username and password are required"
                }
            )

        login_identifier = str(login_identifier).strip()

        user = User.query.filter(
            or_(
                User.email == login_identifier.lower(),
                User.username == login_identifier
            )
        ).first()

        if not user:
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "message": "Invalid email/username or password"
                }
            )

        if not user.is_active:
            return JSONResponse(
                status_code=403,
                content={
                    "success": False,
                    "message": "Account is inactive. Please contact administrator"
                }
            )

        if not user.password or not verify_password(password, user.password):
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "message": "Invalid email/username or password"
                }
            )


        token = create_access_token(user.id, role=user.role)

        student_data = None
        if user.role == "student" and getattr(user, "student_profile", None):
            student_data = user.student_profile.to_dict()

        teacher_data = None
        if user.role == "teacher" and getattr(user, "teacher_profile", None):
            teacher_data = user.teacher_profile.to_dict()

        response = JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Login successful",
                "data": {
                    "token": token,
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "role": user.role,
                        "profile_image": user.profile_image,
                        "is_active": user.is_active,
                        "student_profile": student_data,
                        "teacher_profile": teacher_data
                    }
                }
            }
        )

        response.set_cookie(
            key="access_token",
            value=token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=7 * 24 * 3600
        )

        return response

    except Exception as e:
        db.session.rollback()
        print("Login error:", str(e))
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Internal Server Error",
                "error": str(e)
            }
        )


def get_current_user(user_id: int):
    try:
        user = User.query.filter(User.id == user_id).first()
        if not user:
            return JSONResponse(
                status_code=404,
                content={
                    "success": False,
                    "message": "User not found"
                }
            )

        student_data = None
        if user.role == "student" and getattr(user, "student_profile", None):
            student_data = user.student_profile.to_dict()

        teacher_data = None
        if user.role == "teacher" and getattr(user, "teacher_profile", None):
            teacher_data = user.teacher_profile.to_dict()

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": {
                    "id": user.id,
                    "user_id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role,
                    "profile_image": user.profile_image,
                    "is_active": user.is_active,
                    "student_profile": student_data,
                    "teacher_profile": teacher_data
                }
            }
        )

    except Exception as e:
        return JSONResponse(
            status_code=401,
            content={
                "success": False,
                "message": "Unauthorized"
            }
        )


def logout_user():
    response = JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": "Logout successful"
        }
    )

    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=False,
        samesite="lax"
    )

    return response


def change_user_password(user_id: int, payload: dict):
    try:
        old_password = payload.get("old_password")
        new_password = payload.get("new_password")

        if not old_password or not new_password:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Both old and new password are required"}
            )

        user = User.query.filter(User.id == user_id).first()
        if not user:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "User not found"}
            )

        if not verify_password(old_password, user.password):
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": "Current password is incorrect"}
            )

        is_valid, err_msg = validate_password(new_password)
        if not is_valid:
            return JSONResponse(
                status_code=400,
                content={"success": False, "message": err_msg}
            )

        user.password = hash_password(new_password)
        invite.is_used = True
        invite.used_at = datetime.utcnow()
        invite.used_by_user_id = user.id
        db.session.commit()

        return JSONResponse(
            status_code=200,
            content={"success": True, "message": "Password updated successfully"}
        )
    except Exception as e:
        db.session.rollback()
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Failed to update password", "error": str(e)}
        )