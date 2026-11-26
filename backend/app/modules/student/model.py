from app.config.database import db
from app.modules.course.model import Semester


class Student(db.Model):
    __tablename__ = "students"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    roll_number = db.Column(db.String(50), unique=True, nullable=True)
    semester_id = db.Column(db.Integer, db.ForeignKey("semesters.id", ondelete="SET NULL"), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    face_embedding = db.Column(db.JSON, nullable=True)
    voice_embedding = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    user = db.relationship("User", backref=db.backref("student_profile", uselist=False))
    semester_rel = db.relationship("Semester", backref=db.backref("students", lazy=True))

    @property
    def semester(self):
        return self.semester_rel.name if getattr(self, "semester_rel", None) else None

    @semester.setter
    def semester(self, value):
        pass

    @property
    def current_enrollment(self):
        if hasattr(self, "enrollments") and self.enrollments:
            active = [e for e in self.enrollments if getattr(e, "status", None) == "active"]
            return active[0] if active else self.enrollments[0]
        return None

    @property
    def course(self):
        enr = self.current_enrollment
        return enr.course.code if (enr and enr.course) else None

    @property
    def course_id(self):
        enr = self.current_enrollment
        return enr.course_id if enr else None

    @property
    def current_semester(self):
        enr = self.current_enrollment
        return (enr.semester if enr else None) or self.semester or (self.semester_rel.name if self.semester_rel else None)

    def to_dict(self):
        profile_img = self.user.profile_image if self.user else None
        current_enr = self.current_enrollment
        course_code = current_enr.course.code if (current_enr and current_enr.course) else None
        course_name = current_enr.course.name if (current_enr and current_enr.course) else None
        course_id_val = current_enr.course_id if current_enr else None
        sem_id_val = self.semester_id or (current_enr.semester_id if current_enr else None)
        sem_num_val = (self.semester_rel.semester_number if getattr(self, "semester_rel", None) else None) or (current_enr.semester_rel.semester_number if (current_enr and getattr(current_enr, "semester_rel", None)) else None) or 1
        sem_name = f"Semester {sem_num_val}" if sem_num_val else None

        return {
            "id": self.id,
            "user_id": self.user_id,
            "roll_number": self.roll_number,
            "name": self.user.username if self.user else None,
            "email": self.user.email if self.user else None,
            "profile_image": profile_img,
            "course_id": course_id_val,
            "course": course_code,
            "course_name": course_name,
            "semester_id": sem_id_val,
            "semester_number": sem_num_val,
            "semester": sem_name,
            "phone": self.phone,
            "has_face": bool(self.face_embedding or profile_img),
            "has_face_embedding": bool(self.face_embedding),
            "has_voice": bool(self.voice_embedding),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
