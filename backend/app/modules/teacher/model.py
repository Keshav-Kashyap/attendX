from app.config.database import db
from app.modules.course.model import Course, Semester


class Teacher(db.Model):
    __tablename__ = "teachers"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    employee_code = db.Column(db.String(50), unique=True, nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    qualification = db.Column(db.String(150), nullable=True)
    specialization = db.Column(db.String(150), nullable=True)
    joining_date = db.Column(db.Date, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    coordinator_semester_id = db.Column(db.Integer, db.ForeignKey("semesters.id", ondelete="SET NULL"), unique=True, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    user = db.relationship("User", backref=db.backref("teacher_profile", uselist=False))
    coordinator_semester = db.relationship("Semester", foreign_keys=[coordinator_semester_id], backref=db.backref("class_coordinator", uselist=False, lazy=True))
    assignments = db.relationship("TeacherAssignment", backref="teacher", cascade="all, delete-orphan", lazy=True)

    def to_dict(self):
        coord_sem = self.coordinator_semester
        coord_course_code = coord_sem.course.code if (coord_sem and coord_sem.course) else None
        coord_label = f"{coord_course_code} · Sem {coord_sem.semester_number}" if (coord_sem and coord_course_code) else (coord_sem.name if coord_sem else None)

        return {
            "id": self.id,
            "teacher_id": self.id,
            "user_id": self.user_id,
            "employee_code": self.employee_code,
            "name": self.user.username if self.user else None,
            "email": self.user.email if self.user else None,
            "profile_image": self.user.profile_image if self.user else None,
            "phone": self.phone,
            "qualification": self.qualification,
            "specialization": self.specialization,
            "joining_date": self.joining_date.isoformat() if self.joining_date else None,
            "is_active": self.is_active,
            "coordinator_semester_id": self.coordinator_semester_id,
            "coordinator_semester": coord_sem.name if coord_sem else None,
            "coordinator_semester_number": coord_sem.semester_number if coord_sem else None,
            "coordinator_course": coord_course_code,
            "coordinator_label": coord_label,
            "is_class_coordinator": bool(self.coordinator_semester_id),
            "assignments_count": len(self.assignments) if self.assignments else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class TeacherAssignment(db.Model):
    __tablename__ = "teacher_assignments"

    id = db.Column(db.Integer, primary_key=True)
    course_subject_id = db.Column(db.BigInteger, db.ForeignKey("course_subjects.id", ondelete="CASCADE"), nullable=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id", ondelete="CASCADE"), nullable=False)
    section_id = db.Column(db.BigInteger, db.ForeignKey("sections.id", ondelete="SET NULL"), nullable=True)
    assigned_by = db.Column(db.BigInteger, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = db.Column(db.String(20), default="active", nullable=False)
    assigned_at = db.Column(db.DateTime, server_default=db.func.now())

    # Retain course_id, semester_id, subject_id for backward compatibility
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id", ondelete="CASCADE"), nullable=True)
    semester_id = db.Column(db.Integer, db.ForeignKey("semesters.id", ondelete="SET NULL"), nullable=True)
    subject_id = db.Column(db.Integer, db.ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True)
    room = db.Column(db.String(50), nullable=True, default="Block B, Hall 3")
    schedule = db.Column(db.String(100), nullable=True, default="Mon, Wed, Fri - 10:15 AM")
    academic_year = db.Column(db.String(20), nullable=True, default="2026-2027")

    __table_args__ = (
        db.UniqueConstraint("course_subject_id", "section_id", "teacher_id", name="uq_course_subject_section_teacher"),
    )

    course = db.relationship("Course", backref=db.backref("teacher_assignments", cascade="all, delete-orphan", lazy=True))
    semester_rel = db.relationship("Semester", backref=db.backref("teacher_assignments", lazy=True))
    course_subject = db.relationship("CourseSubject", backref=db.backref("assignments", cascade="all, delete-orphan", lazy=True))
    section = db.relationship("Section", backref=db.backref("assignments", lazy=True))
    assigned_by_user = db.relationship("User", foreign_keys=[assigned_by], lazy=True)

    def to_dict(self):
        c_id = self.course_id or (self.course_subject.course_id if self.course_subject else None)
        c_code = (self.course.code if self.course else None) or (self.course_subject.course.code if self.course_subject and self.course_subject.course else None)
        c_name = (self.course.name if self.course else None) or (self.course_subject.course.name if self.course_subject and self.course_subject.course else None)
        s_id = self.subject_id or (self.course_subject.subject_id if self.course_subject else None)
        s_name = (self.subject.name if self.subject else None) or (self.course_subject.subject.name if self.course_subject and self.course_subject.subject else None)
        s_code = (self.subject.code if self.subject else None) or (self.course_subject.subject.code if self.course_subject and self.course_subject.subject else None)
        sem_id = self.semester_id or (self.course_subject.semester_id if self.course_subject else None)
        sem_num = (self.semester_rel.semester_number if self.semester_rel else None) or (self.course_subject.semester.semester_number if self.course_subject and self.course_subject.semester else None)

        return {
            "id": self.id,
            "assignment_id": self.id,
            "course_subject_id": self.course_subject_id,
            "teacher_id": self.teacher_id,
            "teacher_name": self.teacher.user.username if self.teacher and self.teacher.user else None,
            "teacher_email": self.teacher.user.email if self.teacher and self.teacher.user else None,
            "section_id": self.section_id,
            "section_name": self.section.section_name if self.section else None,
            "course_id": c_id,
            "course_code": c_code,
            "course_name": c_name,
            "semester_id": sem_id,
            "semester_number": sem_num,
            "subject_id": s_id,
            "subject_name": s_name,
            "subject_code": s_code,
            "assigned_by": self.assigned_by,
            "status": self.status,
            "room": self.room,
            "schedule": self.schedule,
            "timetable_slots": [st.to_dict() for st in self.timetable_slots] if getattr(self, "timetable_slots", None) else [],
            "academic_year": self.academic_year,
            "assigned_at": self.assigned_at.isoformat() if self.assigned_at else None,
        }
