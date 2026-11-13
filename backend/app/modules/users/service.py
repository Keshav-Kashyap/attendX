from app.config.database import db
from app.modules.users.model import User
from fastapi.responses import JSONResponse


def get_user_by_id(user_id: int):
    try:
        user = User.query.filter(User.id == user_id).first()
        if not user:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "User not found"}
            )

        data = user.to_dict()
        if user.role == "student" and getattr(user, "student_profile", None):
            data["student_profile"] = user.student_profile.to_dict()
        elif user.role == "teacher" and getattr(user, "teacher_profile", None):
            data["teacher_profile"] = user.teacher_profile.to_dict()

        return JSONResponse(
            status_code=200,
            content={"success": True, "data": data}
        )
    except Exception as e:
        print("Get user error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Internal Server Error", "error": str(e)}
        )


def update_user_profile(user_id: int, update_data: dict):
    try:
        user = User.query.filter(User.id == user_id).first()
        if not user:
            return JSONResponse(
                status_code=404,
                content={"success": False, "message": "User not found"}
            )

        username = update_data.get("username")
        profile_image = update_data.get("profile_image") or update_data.get("photo")

        if username:
            user.username = str(username).strip()
        if profile_image:
            user.profile_image = profile_image

        db.session.commit()

        return JSONResponse(
            status_code=200,
            content={"success": True, "message": "User updated successfully", "data": user.to_dict()}
        )
    except Exception as e:
        db.session.rollback()
        print("Update user error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Internal Server Error", "error": str(e)}
        )


def get_all_users(role: str = None):
    try:
        query = User.query
        if role:
            query = query.filter(User.role == role.strip().lower())
        users = query.all()
        return JSONResponse(
            status_code=200,
            content={"success": True, "data": [u.to_dict() for u in users]}
        )
    except Exception as e:
        print("Get all users error:", str(e))
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": "Internal Server Error", "error": str(e)}
        )
