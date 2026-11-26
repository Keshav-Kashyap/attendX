from app.config.database import db


class Course(db.Model):
    __tablename__ = "courses"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(255), nullable=True)
    duration_years = db.Column(db.Integer, default=3, nullable=False)
    total_semesters = db.Column(db.Integer, default=6, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    semesters = db.relationship("Semester", backref="course", cascade="all, delete-orphan", order_by="Semester.semester_number", lazy=True)
    subjects = db.relationship("Subject", backref="course", cascade="all, delete-orphan", lazy=True)
    enrollments = db.relationship("CourseEnrollment", backref="course", cascade="all, delete-orphan", lazy=True)

    def to_dict(self, include_subjects=False, include_semesters=False):
        ordered_semesters = sorted(self.semesters, key=lambda s: s.semester_number) if self.semesters else []

        data = {
            "id": self.id,
            "name": self.name,
            "code": self.code,
            "description": self.description,
            "duration_years": self.duration_years or 3,
            "total_semesters": len(ordered_semesters) if ordered_semesters else (self.total_semesters or 0),
            "subjects_count": len(self.subjects) if self.subjects else 0,
            "enrolled_students_count": len(self.enrollments) if self.enrollments else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_semesters:
            data["semester_details"] = [s.to_dict(include_subjects=False) for s in ordered_semesters]
        if include_subjects:
            data["subjects"] = [s.to_dict(include_course=False) for s in self.subjects] if self.subjects else []
        return data


class Semester(db.Model):
    __tablename__ = "semesters"

    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    semester_number = db.Column(db.Integer, nullable=False)
    academic_year = db.Column(db.String(20), nullable=True, default="2026-2027")
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    __table_args__ = (
        db.UniqueConstraint("course_id", "semester_number", name="uq_course_semester_number"),
    )

    subjects = db.relationship("Subject", backref="semester_rel", cascade="all, delete-orphan", lazy=True)

    @property
    def name(self):
        return f"Semester {self.semester_number}"

    def to_dict(self, include_subjects=False):
        coord_teacher = getattr(self, "class_coordinator", None)
        data = {
            "id": self.id,
            "course_id": self.course_id,
            "semester_number": self.semester_number,
            "academic_year": self.academic_year,
            "coordinator_teacher_id": coord_teacher.id if coord_teacher else None,
            "coordinator_teacher_name": coord_teacher.user.username if (coord_teacher and coord_teacher.user) else None,
            "subjects_count": len(self.subjects) if self.subjects else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_subjects and self.subjects:
            data["subjects"] = [s.to_dict(include_course=False) for s in self.subjects]
        return data


class AcademicYear(db.Model):
    __tablename__ = "academic_years"

    id = db.Column(db.BigInteger, primary_key=True)
    year_name = db.Column(db.String(20), unique=True, nullable=False)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    is_active = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "year_name": self.year_name,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "end_date": self.end_date.isoformat() if self.end_date else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Section(db.Model):
    __tablename__ = "sections"

    id = db.Column(db.BigInteger, primary_key=True)
    course_id = db.Column(db.BigInteger, db.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    academic_year_id = db.Column(db.BigInteger, db.ForeignKey("academic_years.id", ondelete="SET NULL"), nullable=True)
    section_name = db.Column(db.String(20), nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    __table_args__ = (
        db.UniqueConstraint("course_id", "academic_year_id", "section_name", name="uq_course_year_section"),
    )

    course = db.relationship("Course", backref=db.backref("sections", cascade="all, delete-orphan", lazy=True))
    academic_year = db.relationship("AcademicYear", backref=db.backref("sections", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "course_id": self.course_id,
            "course_name": self.course.name if self.course else None,
            "academic_year_id": self.academic_year_id,
            "academic_year": self.academic_year.year_name if self.academic_year else None,
            "section_name": self.section_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Subject(db.Model):
    __tablename__ = "subjects"

    id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    semester_id = db.Column(db.Integer, db.ForeignKey("semesters.id", ondelete="SET NULL"), nullable=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text, nullable=True)
    room = db.Column(db.String(50), nullable=True)
    schedule = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    teacher = db.relationship("Teacher", foreign_keys=[teacher_id], lazy=True)
    assignments = db.relationship("TeacherAssignment", backref="subject", cascade="all, delete-orphan", lazy=True)

    @property
    def semester(self):
        return self.semester_rel.name if getattr(self, "semester_rel", None) else None

    @semester.setter
    def semester(self, value):
        if value:
            import re
            nums = re.findall(r"\d+", str(value))
            if nums and self.course_id:
                s_obj = Semester.query.filter(
                    Semester.course_id == self.course_id,
                    Semester.semester_number == int(nums[0])
                ).first()
                if s_obj:
                    self.semester_id = s_obj.id

    def to_dict(self, include_course=True):
        primary_a = self.assignments[0] if getattr(self, "assignments", None) else None

        assigned_teacher_id = self.teacher_id or (primary_a.teacher_id if primary_a else None)
        teacher_obj = self.teacher or (primary_a.teacher if primary_a else None)
        teacher_name = teacher_obj.user.username if (teacher_obj and teacher_obj.user) else None
        teacher_email = teacher_obj.user.email if (teacher_obj and teacher_obj.user) else None
        sem_num = self.semester_rel.semester_number if getattr(self, "semester_rel", None) else None

        data = {
            "id": self.id,
            "subject_id": self.id,
            "course_id": self.course_id,
            "semester_id": self.semester_id,
            "semester_number": sem_num,
            "semester": f"Semester {sem_num}" if sem_num else None,
            "teacher_id": assigned_teacher_id,
            "teacher_name": teacher_name,
            "teacher_email": teacher_email,
            "name": self.name,
            "code": self.code,
            "description": self.description,
            "room": (primary_a.room if primary_a and primary_a.room else self.room),
            "schedule": (primary_a.schedule if primary_a and primary_a.schedule else self.schedule),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_course and self.course:
            data["course_code"] = self.course.code
            data["course_name"] = self.course.name

        if self.assignments:
            data["assigned_teachers"] = [
                {
                    "assignment_id": a.id,
                    "teacher_id": a.teacher_id,
                    "teacher_name": a.teacher.user.username if (a.teacher and a.teacher.user) else None,
                    "teacher_email": a.teacher.user.email if (a.teacher and a.teacher.user) else None,
                    "room": a.room,
                    "schedule": a.schedule,
                    "academic_year": a.academic_year,
                }
                for a in self.assignments
            ]
        else:
            data["assigned_teachers"] = []

        return data


class CourseSubject(db.Model):
    __tablename__ = "course_subjects"

    id = db.Column(db.BigInteger, primary_key=True)
    course_id = db.Column(db.BigInteger, db.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    semester_id = db.Column(db.BigInteger, db.ForeignKey("semesters.id", ondelete="SET NULL"), nullable=True)
    subject_id = db.Column(db.BigInteger, db.ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    academic_year_id = db.Column(db.BigInteger, db.ForeignKey("academic_years.id", ondelete="SET NULL"), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    __table_args__ = (
        db.UniqueConstraint("course_id", "semester_id", "subject_id", "academic_year_id", name="uq_course_sem_sub_year"),
    )

    course = db.relationship("Course", backref=db.backref("course_subjects", cascade="all, delete-orphan", lazy=True))
    semester = db.relationship("Semester", backref=db.backref("course_subjects", lazy=True))
    subject = db.relationship("Subject", backref=db.backref("course_subjects", cascade="all, delete-orphan", lazy=True))
    academic_year = db.relationship("AcademicYear", backref=db.backref("course_subjects", lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "course_id": self.course_id,
            "course_name": self.course.name if self.course else None,
            "course_code": self.course.code if self.course else None,
            "semester_id": self.semester_id,
            "subject_id": self.subject_id,
            "subject_name": self.subject.name if self.subject else None,
            "subject_code": self.subject.code if self.subject else None,
            "academic_year_id": self.academic_year_id,
            "academic_year": self.academic_year.year_name if self.academic_year else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Room(db.Model):
    __tablename__ = "rooms"

    id = db.Column(db.BigInteger, primary_key=True)
    room_name = db.Column(db.String(50), unique=True, nullable=False)
    building = db.Column(db.String(100), nullable=True)
    capacity = db.Column(db.Integer, nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {
            "id": self.id,
            "room_name": self.room_name,
            "building": self.building,
            "capacity": self.capacity,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class SubjectTimetable(db.Model):
    __tablename__ = "subject_timetable"

    id = db.Column(db.BigInteger, primary_key=True)
    assignment_id = db.Column(db.BigInteger, db.ForeignKey("teacher_assignments.id", ondelete="CASCADE"), nullable=False)
    room_id = db.Column(db.BigInteger, db.ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True)
    day_of_week = db.Column(db.SmallInteger, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    effective_from = db.Column(db.Date, nullable=True)
    effective_until = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    assignment = db.relationship("TeacherAssignment", backref=db.backref("timetable_slots", cascade="all, delete-orphan", lazy=True))
    room = db.relationship("Room", backref=db.backref("timetable_slots", lazy=True))

    def to_dict(self):
        day_names = {1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday", 7: "Sunday"}
        return {
            "id": self.id,
            "timetable_id": self.id,
            "assignment_id": self.assignment_id,
            "room_id": self.room_id,
            "room_name": self.room.room_name if self.room else None,
            "day_of_week": self.day_of_week,
            "day_name": day_names.get(self.day_of_week, str(self.day_of_week)),
            "start_time": self.start_time.strftime("%H:%M:%S") if self.start_time else None,
            "end_time": self.end_time.strftime("%H:%M:%S") if self.end_time else None,
            "effective_from": self.effective_from.isoformat() if self.effective_from else None,
            "effective_until": self.effective_until.isoformat() if self.effective_until else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class CourseEnrollment(db.Model):
    __tablename__ = "course_enrollments"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    semester_id = db.Column(db.Integer, db.ForeignKey("semesters.id", ondelete="SET NULL"), nullable=True)
    academic_year = db.Column(db.String(20), nullable=True, default="2026-2027")
    status = db.Column(db.String(20), nullable=False, default="active")
    enrolled_at = db.Column(db.DateTime, server_default=db.func.now())

    __table_args__ = (
        db.UniqueConstraint("student_id", "course_id", name="uq_student_course_enrollment"),
    )

    student = db.relationship("Student", backref=db.backref("enrollments", cascade="all, delete-orphan", lazy=True))

    @property
    def semester(self):
        return self.semester_rel.name if getattr(self, "semester_rel", None) else None

    @semester.setter
    def semester(self, value):
        if value:
            import re
            nums = re.findall(r"\d+", str(value))
            if nums and self.course_id:
                s_obj = Semester.query.filter(
                    Semester.course_id == self.course_id,
                    Semester.semester_number == int(nums[0])
                ).first()
                if s_obj:
                    self.semester_id = s_obj.id

    def to_dict(self):
        sem_name = self.semester
        return {
            "id": self.id,
            "student_id": self.student_id,
            "student_name": self.student.user.username if self.student and self.student.user else None,
            "roll_number": self.student.roll_number if self.student else None,
            "course_id": self.course_id,
            "semester_id": self.semester_id,
            "course_code": self.course.code if self.course else None,
            "course_name": self.course.name if self.course else None,
            "status": self.status,
            "academic_year": self.academic_year,
            "semester": sem_name,
            "enrolled_at": self.enrolled_at.isoformat() if self.enrolled_at else None,
        }
