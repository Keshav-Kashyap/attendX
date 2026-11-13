from app.config.database import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(50), nullable=False)
    password = db.Column(db.String(255), nullable=True)
    role = db.Column(db.String(20), nullable=False, default="student")
    profile_image = db.Column(db.Text, nullable=True)
    auth_provider = db.Column(db.String(20), nullable=False, default="email")
    provider_id = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now(), nullable=False)

    __table_args__ = (
        db.CheckConstraint("role IN ('student', 'teacher', 'admin')"),
        db.CheckConstraint("auth_provider IN ('email', 'google')"),
        db.UniqueConstraint("auth_provider", "provider_id"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "role": self.role,
            "profile_image": self.profile_image,
            "auth_provider": self.auth_provider,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

