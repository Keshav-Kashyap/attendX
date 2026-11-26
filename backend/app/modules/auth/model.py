from datetime import datetime
from app.config.database import db


class InviteToken(db.Model):
    __tablename__ = "invite_tokens"

    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(96), unique=True, nullable=False, index=True)
    role = db.Column(db.String(20), nullable=False, default="student")
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id", ondelete="CASCADE"), nullable=True)
    semester_id = db.Column(db.Integer, db.ForeignKey("semesters.id", ondelete="CASCADE"), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_used = db.Column(db.Boolean, nullable=False, default=False)
    used_at = db.Column(db.DateTime, nullable=True)
    used_by_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
