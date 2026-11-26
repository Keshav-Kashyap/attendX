from app.config.database import db


class DeviceToken(db.Model):
    __tablename__ = "device_tokens"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token = db.Column(db.Text, nullable=False, unique=True)
    platform = db.Column(db.String(20), nullable=False, default="android")
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)
    updated_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        onupdate=db.func.now(),
        nullable=False,
    )

    user = db.relationship("User", backref=db.backref("device_tokens", cascade="all, delete-orphan", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "platform": self.platform,
            "is_active": self.is_active,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class NotificationPreference(db.Model):
    __tablename__ = "notification_preferences"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )
    class_reminders = db.Column(db.Boolean, nullable=False, default=True)
    coordinator_alerts = db.Column(db.Boolean, nullable=False, default=True)
    attendance_alerts = db.Column(db.Boolean, nullable=False, default=True)
    updated_at = db.Column(
        db.DateTime,
        server_default=db.func.now(),
        onupdate=db.func.now(),
        nullable=False,
    )

    user = db.relationship(
        "User",
        backref=db.backref("notification_preference", uselist=False, cascade="all, delete-orphan", lazy=True),
    )

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "class_reminders": self.class_reminders,
            "coordinator_alerts": self.coordinator_alerts,
            "attendance_alerts": self.attendance_alerts,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class NotificationLog(db.Model):
    __tablename__ = "notification_logs"

    id = db.Column(db.Integer, primary_key=True)
    dedup_key = db.Column(db.String(180), unique=True, nullable=False, index=True)
    notification_type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.Text, nullable=False)
    sent_count = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)
