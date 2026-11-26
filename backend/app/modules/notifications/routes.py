from typing import Optional
from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.config.database import db
from app.middleware.auth import token_required
from app.modules.notifications.fcm import send_push_to_users
from app.modules.notifications.model import DeviceToken, NotificationPreference

notifications_bp = APIRouter(
    prefix="/api/notifications",
    tags=["notifications"],
)


class DeviceTokenSchema(BaseModel):
    token: str
    platform: Optional[str] = "android"


class DeviceTokenDeleteSchema(BaseModel):
    token: str


class NotificationPreferencesSchema(BaseModel):
    class_reminders: Optional[bool] = None
    coordinator_alerts: Optional[bool] = None
    attendance_alerts: Optional[bool] = None


@notifications_bp.post("/device-token")
async def register_device_token(
    payload: DeviceTokenSchema,
    user_id: int = Depends(token_required),
):
    clean_token = (payload.token or "").strip()
    if not clean_token:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Device token is required."},
        )

    clean_platform = (payload.platform or "android").strip().lower()[:20]
    existing = DeviceToken.query.filter(DeviceToken.token == clean_token).first()
    if existing:
        existing.user_id = user_id
        existing.platform = clean_platform
        existing.is_active = True
    else:
        existing = DeviceToken(
            user_id=user_id,
            token=clean_token,
            platform=clean_platform,
            is_active=True,
        )
        db.session.add(existing)

    db.session.commit()
    print(f"[FCM] Registered device token for user_id={user_id}, platform={clean_platform}", flush=True)
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": "Device token registered.",
            "data": existing.to_dict(),
        },
    )


@notifications_bp.delete("/device-token")
async def unregister_device_token(
    payload: DeviceTokenDeleteSchema,
    user_id: int = Depends(token_required),
):
    clean_token = (payload.token or "").strip()
    if not clean_token:
        return JSONResponse(
            status_code=400,
            content={"success": False, "message": "Device token is required."},
        )

    row = DeviceToken.query.filter(
        DeviceToken.token == clean_token,
        DeviceToken.user_id == user_id,
    ).first()
    if row:
        row.is_active = False
        db.session.commit()

    return JSONResponse(
        status_code=200,
        content={"success": True, "message": "Device token unregistered."},
    )


@notifications_bp.get("/preferences")
async def get_preferences(user_id: int = Depends(token_required)):
    pref = NotificationPreference.query.filter(NotificationPreference.user_id == user_id).first()
    if not pref:
        pref = NotificationPreference(user_id=user_id)
        db.session.add(pref)
        db.session.commit()

    return JSONResponse(
        status_code=200,
        content={"success": True, "data": pref.to_dict()},
    )


@notifications_bp.put("/preferences")
async def update_preferences(
    payload: NotificationPreferencesSchema,
    user_id: int = Depends(token_required),
):
    pref = NotificationPreference.query.filter(NotificationPreference.user_id == user_id).first()
    if not pref:
        pref = NotificationPreference(user_id=user_id)
        db.session.add(pref)

    if payload.class_reminders is not None:
        pref.class_reminders = bool(payload.class_reminders)
    if payload.coordinator_alerts is not None:
        pref.coordinator_alerts = bool(payload.coordinator_alerts)
    if payload.attendance_alerts is not None:
        pref.attendance_alerts = bool(payload.attendance_alerts)

    db.session.commit()
    print(f"[FCM] Registered device token for user_id={user_id}, platform={clean_platform}", flush=True)
    return JSONResponse(
        status_code=200,
        content={"success": True, "message": "Notification preferences updated.", "data": pref.to_dict()},
    )


@notifications_bp.post("/test")
async def send_test_notification(user_id: int = Depends(token_required)):
    sent = send_push_to_users(
        user_ids=[user_id],
        title="attendX Test Notification",
        body="FCM push notifications are working on your device!",
        data={"type": "test"},
    )
    return JSONResponse(
        status_code=200,
        content={
            "success": True,
            "message": f"Sent test notification to {sent} device(s).",
            "sent_count": sent,
        },
    )
