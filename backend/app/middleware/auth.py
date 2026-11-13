from fastapi import Request, HTTPException, status, Depends
from app.utils.jwt import decode_access_token

def get_current_user_id(request: Request) -> int:
    # 1. Check cookies
    token = request.cookies.get("access_token")

    # 2. Check Authorization header fallback: "Bearer <token>"
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "message": "Unauthorized"}
        )

    try:
        payload = decode_access_token(token)
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"success": False, "message": "Invalid token payload"}
            )
        request.state.user_id = user_id
        return user_id
    except HTTPException:
        raise
    except Exception as e:
        print("Token validation error:", repr(e))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "message": "Invalid or Expired Token"}
        )

token_required = get_current_user_id

# Re-export admin_required and get_current_admin
def admin_required(*args, **kwargs):
    from app.modules.admin.decorator import admin_required as _admin_required
    return _admin_required(*args, **kwargs)

def get_current_admin(*args, **kwargs):
    from app.modules.admin.decorator import get_current_admin as _get_current_admin
    return _get_current_admin(*args, **kwargs)