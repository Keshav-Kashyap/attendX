import asyncio
from functools import wraps
from typing import Optional, Callable
from fastapi import Request, HTTPException, status, Depends
from app.utils.jwt import decode_access_token
from app.modules.users.model import User


def get_current_admin(request: Request) -> User:

    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "message": "Authentication required. No token provided."}
        )

    try:
        payload = decode_access_token(token)
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"success": False, "message": "Invalid token payload: user_id missing."}
            )
    except HTTPException:
        raise
    except Exception as e:
        print("Admin token decode error:", repr(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "message": "Invalid or expired token."}
        )

    user = User.query.filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"success": False, "message": "User account not found."}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"success": False, "message": "User account has been deactivated."}
        )

    if str(user.role).strip().lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "success": False,
                "message": f"Access denied: Admin role required. Current role is '{user.role}'."
            }
        )

    request.state.user_id = user.id
    request.state.current_user = user
    return user


def admin_required(target: Optional[Callable] = None):

    # Case 1: Called directly by FastAPI Depends(admin_required)
    if isinstance(target, Request):
        return get_current_admin(target)

    # Case 2: Used as a decorator: @admin_required
    if callable(target):
        func = target

        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            request = kwargs.get("request")
            if not request:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            if not request:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"success": False, "message": "Request context missing for @admin_required"}
                )

            admin_user = get_current_admin(request)
            kwargs["current_admin"] = admin_user

            if asyncio.iscoroutinefunction(func):
                return await func(*args, **kwargs)
            return func(*args, **kwargs)

        return async_wrapper

    # Case 3: Used with arguments @admin_required()
    def decorator(fn):
        @wraps(fn)
        async def wrapper(*args, **kwargs):
            request = kwargs.get("request")
            if not request:
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break

            if not request:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={"success": False, "message": "Request context missing for @admin_required"}
                )

            admin_user = get_current_admin(request)
            kwargs["current_admin"] = admin_user

            if asyncio.iscoroutinefunction(fn):
                return await fn(*args, **kwargs)
            return fn(*args, **kwargs)

        return wrapper

    return decorator
