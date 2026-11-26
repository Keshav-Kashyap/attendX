from app.config.database import db


class AttendanceSession(db.Model):
    __tablename__ = "attendance_sessions"

    id = db.Column(db.Integer, primary_key=True)
    session_code = db.Column(db.String(50), unique=True, nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    room = db.Column(db.String(50), nullable=True)
    date = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)
    photos_count = db.Column(db.Integer, default=1, nullable=False)
    total_enrolled = db.Column(db.Integer, default=0, nullable=False)
    total_present = db.Column(db.Integer, default=0, nullable=False)
    total_absent = db.Column(db.Integer, default=0, nullable=False)
    is_confirmed = db.Column(db.Boolean, default=False, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)

    teacher = db.relationship("Teacher", backref=db.backref("attendance_sessions", cascade="all, delete-orphan", lazy=True))
    course = db.relationship("Course", backref=db.backref("attendance_sessions", cascade="all, delete-orphan", lazy=True))
    subject = db.relationship("Subject", backref=db.backref("attendance_sessions", cascade="all, delete-orphan", lazy=True))
    records = db.relationship("AttendanceRecord", backref="session", cascade="all, delete-orphan", lazy=True)

    def to_dict(self, include_records=True):
        course_name = self.course.name if self.course else None
        course_code = self.course.code if self.course else None
        subject_name = self.subject.name if self.subject else None
        subject_code = self.subject.code if self.subject else None

        data = {
            "id": self.id,
            "session_id": self.session_code,
            "session_code": self.session_code,
            "teacher_id": self.teacher_id,
            "teacher_name": self.teacher.user.username if self.teacher and self.teacher.user else None,
            "course_id": self.course_id,
            "course": course_code or course_name,
            "course_code": course_code,
            "course_name": course_name,
            "subject_id": self.subject_id,
            "subject": subject_name or subject_code,
            "subject_name": subject_name,
            "subject_code": subject_code,
            "room": self.room,
            "date": self.date.isoformat() if self.date else None,
            "photos_count": self.photos_count,
            "total_enrolled": self.total_enrolled,
            "total_present": self.total_present,
            "total_detected": self.total_present,
            "total_absent": self.total_absent,
            "is_confirmed": bool(self.is_confirmed),
            "attendance_rate": f"{round((self.total_present / max(self.total_enrolled, 1)) * 100)}%",
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_records and self.records:
            data["present_students"] = [r.to_dict() for r in self.records if r.status == "Present"]
            data["absent_students"] = [r.to_dict() for r in self.records if r.status == "Absent"]
        else:
            data["present_students"] = []
            data["absent_students"] = []
        return data


class AttendanceRecord(db.Model):
    __tablename__ = "attendance_records"

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="Present")
    confidence = db.Column(db.String(20), nullable=True)
    matched_at = db.Column(db.DateTime, server_default=db.func.now(), nullable=False)
    remarks = db.Column(db.String(255), nullable=True)

    __table_args__ = (
        db.UniqueConstraint("session_id", "student_id", name="uq_session_student_attendance"),
    )

    student = db.relationship("Student", backref=db.backref("attendance_records", cascade="all, delete-orphan", lazy=True))

    def to_dict(self):
        user_rec = self.student.user if self.student else None
        return {
            "id": self.id,
            "session_id": self.session_id,
            "student_id": self.student_id,
            "name": user_rec.username if user_rec else None,
            "roll_number": self.student.roll_number if self.student else None,
            "course": self.student.course if self.student else None,
            "profile_image": user_rec.profile_image if user_rec else None,
            "status": self.status,
            "confidence": self.confidence,
            "matched_at": self.matched_at.isoformat() if self.matched_at else None,
            "remarks": self.remarks,
        }
