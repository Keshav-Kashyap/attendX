"""
Idempotent seed & architectural migration script for MCAINT course test data.
Creates/updates rooms, teachers, Semester 1-5 subjects, conflict-free timetables,
enrolled students (no profile_image so user can upload after login), and sample
attendance sessions for end-to-end testing.
"""

import os
import sys
from datetime import date, datetime, timedelta

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)
os.chdir(BASE_DIR)

from dotenv import load_dotenv

load_dotenv()

from app.config.database import connect_db, db
from app.utils.common import hash_password
from app.modules.users.model import User
from app.modules.course.model import (
    Course,
    Semester,
    AcademicYear,
    Section,
    Subject,
    CourseSubject,
    Room,
    SubjectTimetable,
    CourseEnrollment,
)
from app.modules.teacher.model import Teacher, TeacherAssignment
from app.modules.student.model import Student
from app.modules.attendance.model import AttendanceSession, AttendanceRecord
from app.modules.course.timetable_helper import sync_assignment_timetable
from init_db import sync_architecture_and_migrations


ACADEMIC_YEAR = "2026-2027"

ROOMS_DATA = [
    ("Block B, Hall 3", "Block B", 60),
    ("Block A, Room 101", "Block A", 45),
    ("Room 204", "Block A", 50),
    ("Lab 1, CS Dept", "Computer Center", 40),
    ("Lab 2, CS Dept", "Computer Center", 40),
    ("Seminar Hall", "Academic Block", 90),
]

TEACHERS_DATA = [
    {
        "email": "teacher@gmail.com",
        "name": "Teacher",
        "employee_code": "T101",
        "qualification": "M.Tech CSE",
        "specialization": "Computer Fundamentals",
        "phone": "+91 9810000101",
    },
    {
        "email": "kkgoyal@gmail.com",
        "name": "Dr. K.K Goyal",
        "employee_code": "FAC-1002",
        "qualification": "Ph.D.",
        "specialization": "Business Communication & Software Engineering",
        "phone": "+91 9810000102",
    },
    {
        "email": "gunjansingh@gmail.com",
        "name": "Dr. Gunjan Singh",
        "employee_code": "FAC-1003",
        "qualification": "Ph.D. CS",
        "specialization": "C, Java & Operating Systems",
        "phone": "+91 9810000103",
    },
    {
        "email": "neha.verma@gmail.com",
        "name": "Prof. Neha Verma",
        "employee_code": "FAC-1004",
        "qualification": "M.Tech IT",
        "specialization": "Data Structures & Algorithms",
        "phone": "+91 9810000104",
    },
    {
        "email": "vikram.mehta@gmail.com",
        "name": "Dr. Vikram Mehta",
        "employee_code": "FAC-1005",
        "qualification": "Ph.D. CSE",
        "specialization": "Database Systems & Networking",
        "phone": "+91 9810000105",
    },
    {
        "email": "ananya.rao@gmail.com",
        "name": "Prof. Ananya Rao",
        "employee_code": "FAC-1006",
        "qualification": "MCA, M.Tech",
        "specialization": "Web & Mobile Development",
        "phone": "+91 9810000106",
    },
    {
        "email": "rohit.kulkarni@gmail.com",
        "name": "Dr. Rohit Kulkarni",
        "employee_code": "FAC-1007",
        "qualification": "Ph.D. AI",
        "specialization": "AI, ML & Python",
        "phone": "+91 9810000107",
    },
]

# Conflict-free timetable across all rooms and all 7 teachers
SUBJECTS_DATA = [
    # Semester 1
    {
        "sem_num": 1,
        "code": "RCAI101",
        "name": "C Programming",
        "teacher_email": "gunjansingh@gmail.com",
        "room": "Block B, Hall 3",
        "schedule": "Mon, Wed, Fri - 09:00 AM - 10:30 AM",
        "description": "Structured programming fundamentals, pointers, structures, and file I/O in C.",
    },
    {
        "sem_num": 1,
        "code": "RCAI102",
        "name": "Computer Fundamentals",
        "teacher_email": "teacher@gmail.com",
        "room": "Block B, Hall 3",
        "schedule": "Tue, Thu, Sat - 11:45 AM - 01:15 PM",
        "description": "Number systems, digital logic, memory hierarchy, and OS basics.",
    },
    {
        "sem_num": 1,
        "code": "RCAI103",
        "name": "Business Communication",
        "teacher_email": "kkgoyal@gmail.com",
        "room": "Room 204",
        "schedule": "Tue, Thu, Sat - 09:00 AM - 10:30 AM",
        "description": "Technical writing, presentations, and professional communication.",
    },
    {
        "sem_num": 1,
        "code": "RCAI104",
        "name": "Discrete Mathematics",
        "teacher_email": "neha.verma@gmail.com",
        "room": "Block A, Room 101",
        "schedule": "Mon, Wed, Fri - 11:45 AM - 01:15 PM",
        "description": "Set theory, relations, graph theory, combinatorics, and mathematical logic.",
    },
    # Semester 2
    {
        "sem_num": 2,
        "code": "RCAI201",
        "name": "Data Structures using C",
        "teacher_email": "neha.verma@gmail.com",
        "room": "Lab 1, CS Dept",
        "schedule": "Mon, Wed, Fri - 09:00 AM - 10:30 AM",
        "description": "Stacks, queues, linked lists, trees, graphs, sorting, and searching.",
    },
    {
        "sem_num": 2,
        "code": "RCAI202",
        "name": "Database Management Systems",
        "teacher_email": "vikram.mehta@gmail.com",
        "room": "Block A, Room 101",
        "schedule": "Tue, Thu, Sat - 10:30 AM - 12:00 PM",
        "description": "ER modeling, normalization, SQL, indexing, and transaction concurrency.",
    },
    {
        "sem_num": 2,
        "code": "RCAI203",
        "name": "Object Oriented Programming (Java)",
        "teacher_email": "gunjansingh@gmail.com",
        "room": "Block B, Hall 3",
        "schedule": "Tue, Thu, Sat - 02:00 PM - 03:30 PM",
        "description": "OOP design patterns, inheritance, interfaces, exceptions, and collections.",
    },
    {
        "sem_num": 2,
        "code": "RCAI204",
        "name": "Computer Organization & Architecture",
        "teacher_email": "teacher@gmail.com",
        "room": "Room 204",
        "schedule": "Mon, Wed, Fri - 02:00 PM - 03:30 PM",
        "description": "CPU pipeline, RISC/CISC, cache memory, and I/O subsystem design.",
    },
    # Semester 3
    {
        "sem_num": 3,
        "code": "RCAI301",
        "name": "Operating Systems",
        "teacher_email": "gunjansingh@gmail.com",
        "room": "Block B, Hall 3",
        "schedule": "Mon, Wed, Fri - 10:30 AM - 12:00 PM",
        "description": "Process scheduling, deadlocks, virtual memory, and file systems.",
    },
    {
        "sem_num": 3,
        "code": "RCAI302",
        "name": "Python & Data Science",
        "teacher_email": "rohit.kulkarni@gmail.com",
        "room": "Lab 2, CS Dept",
        "schedule": "Tue, Thu, Sat - 09:00 AM - 10:30 AM",
        "description": "NumPy, Pandas, data wrangling, visualization, and statistical modeling.",
    },
    {
        "sem_num": 3,
        "code": "RCAI303",
        "name": "Software Engineering",
        "teacher_email": "kkgoyal@gmail.com",
        "room": "Seminar Hall",
        "schedule": "Mon, Wed, Fri - 12:15 PM - 01:45 PM",
        "description": "SDLC, agile methodologies, UML design, testing, and DevOps basics.",
    },
    {
        "sem_num": 3,
        "code": "RCAI304",
        "name": "Full Stack Web Technologies",
        "teacher_email": "ananya.rao@gmail.com",
        "room": "Lab 1, CS Dept",
        "schedule": "Tue, Thu, Sat - 12:15 PM - 01:45 PM",
        "description": "Modern frontend architecture, REST APIs, authentication, and deployment.",
    },
    # Semester 4
    {
        "sem_num": 4,
        "code": "RCAI401",
        "name": "Design & Analysis of Algorithms",
        "teacher_email": "neha.verma@gmail.com",
        "room": "Block A, Room 101",
        "schedule": "Tue, Thu, Sat - 02:00 PM - 03:30 PM",
        "description": "Divide & conquer, dynamic programming, greedy algorithms, and NP-completeness.",
    },
    {
        "sem_num": 4,
        "code": "RCAI402",
        "name": "Computer Networks",
        "teacher_email": "vikram.mehta@gmail.com",
        "room": "Block B, Hall 3",
        "schedule": "Mon, Wed, Fri - 02:00 PM - 03:30 PM",
        "description": "OSI/TCP-IP stack, routing protocols, congestion control, and socket APIs.",
    },
    {
        "sem_num": 4,
        "code": "RCAI403",
        "name": "React Native Mobile App Dev",
        "teacher_email": "ananya.rao@gmail.com",
        "room": "Lab 2, CS Dept",
        "schedule": "Mon, Wed, Fri - 10:30 AM - 12:00 PM",
        "description": "Cross-platform mobile UI, state management, native APIs, and offline sync.",
    },
    # Semester 5
    {
        "sem_num": 5,
        "code": "RCAI501",
        "name": "Artificial Intelligence & ML",
        "teacher_email": "rohit.kulkarni@gmail.com",
        "room": "Seminar Hall",
        "schedule": "Mon, Wed, Fri - 09:00 AM - 10:30 AM",
        "description": "Search heuristics, supervised learning, neural networks, and face recognition.",
    },
    {
        "sem_num": 5,
        "code": "RCAI502",
        "name": "Cloud Computing & DevOps",
        "teacher_email": "ananya.rao@gmail.com",
        "room": "Lab 1, CS Dept",
        "schedule": "Mon, Wed, Fri - 03:45 PM - 05:15 PM",
        "description": "Containers, CI/CD pipelines, cloud storage, and scalable microservices.",
    },
    {
        "sem_num": 5,
        "code": "RCAI503",
        "name": "Information & Cyber Security",
        "teacher_email": "vikram.mehta@gmail.com",
        "room": "Room 204",
        "schedule": "Tue, Thu, Sat - 03:45 PM - 05:15 PM",
        "description": "Cryptography, network defense, OWASP security, and access control.",
    },
]

STUDENTS_DATA = [
    # Fix/ensure existing Sem 1 test accounts are enrolled properly
    {"email": "student@gmail.com", "name": "student", "roll_number": "S101", "sem_num": 1, "phone": "+91 9820000101", "preserve_password": True},
    {"email": "student2@gmail.com", "name": "Student 2", "roll_number": "S102", "sem_num": 1, "phone": "+91 9820000102", "preserve_password": True},
    {"email": "aravsingh@gmail.com", "name": "Arav Singh", "roll_number": "STU-1003", "sem_num": 1, "phone": "+91 9820000103", "preserve_password": True},
    {"email": "keshavs@gmail.com", "name": "Keshav Student", "roll_number": "STU-1004", "sem_num": 1, "phone": "+91 9820000104", "preserve_password": True},
    # New students across Semesters 1-5 (password: student123, no profile_image)
    {"email": "riya.sharma@gmail.com", "name": "Riya Sharma", "roll_number": "STU-1005", "sem_num": 1, "phone": "+91 9820000105"},
    {"email": "rohan.patel@gmail.com", "name": "Rohan Patel", "roll_number": "STU-1006", "sem_num": 1, "phone": "+91 9820000106"},
    {"email": "priya.nair@gmail.com", "name": "Priya Nair", "roll_number": "STU-1007", "sem_num": 2, "phone": "+91 9820000107"},
    {"email": "aman.verma@gmail.com", "name": "Aman Verma", "roll_number": "STU-1008", "sem_num": 2, "phone": "+91 9820000108"},
    {"email": "sneha.gupta@gmail.com", "name": "Sneha Gupta", "roll_number": "STU-1009", "sem_num": 2, "phone": "+91 9820000109"},
    {"email": "kabir.joshi@gmail.com", "name": "Kabir Joshi", "roll_number": "STU-1010", "sem_num": 3, "phone": "+91 9820000110"},
    {"email": "anushka.roy@gmail.com", "name": "Anushka Roy", "roll_number": "STU-1011", "sem_num": 3, "phone": "+91 9820000111"},
    {"email": "dev.malhotra@gmail.com", "name": "Dev Malhotra", "roll_number": "STU-1012", "sem_num": 3, "phone": "+91 9820000112"},
    {"email": "ishita.kapoor@gmail.com", "name": "Ishita Kapoor", "roll_number": "STU-1013", "sem_num": 4, "phone": "+91 9820000113"},
    {"email": "varun.tiwari@gmail.com", "name": "Varun Tiwari", "roll_number": "STU-1014", "sem_num": 4, "phone": "+91 9820000114"},
    {"email": "tanvi.desai@gmail.com", "name": "Tanvi Desai", "roll_number": "STU-1015", "sem_num": 5, "phone": "+91 9820000115"},
    {"email": "harsh.agarwal@gmail.com", "name": "Harsh Agarwal", "roll_number": "STU-1016", "sem_num": 5, "phone": "+91 9820000116"},
]


def ensure_rooms():
    room_map = {}
    for room_name, building, capacity in ROOMS_DATA:
        room = Room.query.filter(Room.room_name == room_name).first()
        if not room:
            room = Room(
                room_name=room_name,
                building=building,
                capacity=capacity,
                is_active=True,
            )
            db.session.add(room)
            db.session.flush()
        room_map[room_name] = room
    return room_map


def ensure_course_and_semesters():
    course = Course.query.filter(Course.code == "MCAINT").first()
    if not course:
        course = Course(
            name="Integrated Master's of Computer Application",
            code="MCAINT",
            description="5-Year Integrated MCA program covering core CS, Full Stack, Data Science, Cloud, and AI.",
            duration_years=5,
            total_semesters=10,
        )
        db.session.add(course)
        db.session.flush()

    sem_map = {}
    for sem_num in range(1, 11):
        sem = Semester.query.filter(
            Semester.course_id == course.id,
            Semester.semester_number == sem_num,
        ).first()
        if not sem:
            sem = Semester(
                course_id=course.id,
                semester_number=sem_num,
                academic_year=ACADEMIC_YEAR,
            )
            db.session.add(sem)
            db.session.flush()
        sem_map[sem_num] = sem

    ay = AcademicYear.query.filter(AcademicYear.year_name == ACADEMIC_YEAR).first()
    if not ay:
        ay = AcademicYear(
            year_name=ACADEMIC_YEAR,
            start_date=date(2026, 7, 1),
            end_date=date(2027, 6, 30),
            is_active=True,
        )
        db.session.add(ay)
        db.session.flush()

    section_a = Section.query.filter(
        Section.course_id == course.id,
        Section.academic_year_id == ay.id,
        Section.section_name == "A",
    ).first()
    if not section_a:
        section_a = Section(
            course_id=course.id,
            academic_year_id=ay.id,
            section_name="A",
        )
        db.session.add(section_a)
        db.session.flush()

    return course, sem_map, ay, section_a


def ensure_teachers():
    teacher_by_email = {}
    for item in TEACHERS_DATA:
        email = item["email"].strip().lower()
        user = User.query.filter(User.email == email).first()
        if not user:
            user = User(
                username=item["name"],
                email=email,
                password=hash_password("teacher123"),
                role="teacher",
                auth_provider="email",
                is_active=True,
            )
            db.session.add(user)
            db.session.flush()

        teacher = Teacher.query.filter(Teacher.user_id == user.id).first()
        if not teacher:
            teacher = Teacher(
                user_id=user.id,
                employee_code=item["employee_code"],
                phone=item["phone"],
                qualification=item["qualification"],
                specialization=item["specialization"],
                joining_date=date(2024, 8, 1),
                is_active=True,
            )
            db.session.add(teacher)
            db.session.flush()
        else:
            if not teacher.qualification:
                teacher.qualification = item["qualification"]
            if not teacher.specialization:
                teacher.specialization = item["specialization"]
            if not teacher.phone:
                teacher.phone = item["phone"]

        teacher_by_email[email] = teacher
    return teacher_by_email


def ensure_subjects_and_timetable(course, sem_map, ay, section_a, room_map, teacher_by_email):
    subject_by_code = {}
    for item in SUBJECTS_DATA:
        sem = sem_map[item["sem_num"]]
        teacher = teacher_by_email[item["teacher_email"].lower()]
        room_obj = room_map.get(item["room"])

        subject = Subject.query.filter(
            Subject.course_id == course.id,
            Subject.code == item["code"],
        ).first()

        if not subject:
            subject = Subject(
                course_id=course.id,
                semester_id=sem.id,
                teacher_id=teacher.id,
                name=item["name"],
                code=item["code"],
                description=item["description"],
                room=item["room"],
                schedule=item["schedule"],
            )
            db.session.add(subject)
            db.session.flush()
        else:
            subject.name = item["name"]
            subject.semester_id = sem.id
            subject.teacher_id = teacher.id
            subject.description = item["description"]
            subject.room = item["room"]
            subject.schedule = item["schedule"]

        cs = CourseSubject.query.filter(
            CourseSubject.course_id == course.id,
            CourseSubject.semester_id == sem.id,
            CourseSubject.subject_id == subject.id,
        ).first()
        if not cs:
            cs = CourseSubject(
                course_id=course.id,
                semester_id=sem.id,
                subject_id=subject.id,
                academic_year_id=ay.id,
            )
            db.session.add(cs)
            db.session.flush()

        # Keep a clean single active assignment per subject
        existing_assignments = TeacherAssignment.query.filter(
            TeacherAssignment.course_id == course.id,
            TeacherAssignment.subject_id == subject.id,
        ).all()

        assignment = None
        for idx, ex in enumerate(existing_assignments):
            if idx == 0:
                assignment = ex
            else:
                SubjectTimetable.query.filter(SubjectTimetable.assignment_id == ex.id).delete()
                db.session.delete(ex)

        if not assignment:
            assignment = TeacherAssignment(
                course_subject_id=cs.id,
                teacher_id=teacher.id,
                section_id=section_a.id,
                course_id=course.id,
                semester_id=sem.id,
                subject_id=subject.id,
                room=item["room"],
                schedule=item["schedule"],
                academic_year=ACADEMIC_YEAR,
                status="active",
            )
            db.session.add(assignment)
            db.session.flush()
        else:
            assignment.course_subject_id = cs.id
            assignment.teacher_id = teacher.id
            assignment.section_id = section_a.id
            assignment.semester_id = sem.id
            assignment.room = item["room"]
            assignment.schedule = item["schedule"]
            assignment.academic_year = ACADEMIC_YEAR
            assignment.status = "active"

        sync_assignment_timetable(
            assignment.id,
            item["schedule"],
            room_id=room_obj.id if room_obj else None,
        )
        subject_by_code[item["code"]] = subject

    return subject_by_code


def ensure_students(course, sem_map):
    students_by_sem = {i: [] for i in range(1, 11)}
    for item in STUDENTS_DATA:
        email = item["email"].strip().lower()
        sem = sem_map[item["sem_num"]]

        user = User.query.filter(User.email == email).first()
        if not user:
            user = User(
                username=item["name"],
                email=email,
                password=hash_password("student123"),
                role="student",
                auth_provider="email",
                profile_image=None,
                is_active=True,
            )
            db.session.add(user)
            db.session.flush()

        student = Student.query.filter(Student.user_id == user.id).first()
        if not student:
            student = Student(
                user_id=user.id,
                roll_number=item["roll_number"],
                semester_id=sem.id,
                phone=item["phone"],
            )
            db.session.add(student)
            db.session.flush()
        else:
            if not student.semester_id:
                student.semester_id = sem.id
            if not student.phone:
                student.phone = item["phone"]

        enrollment = CourseEnrollment.query.filter(
            CourseEnrollment.student_id == student.id,
            CourseEnrollment.course_id == course.id,
        ).first()
        if not enrollment:
            enrollment = CourseEnrollment(
                student_id=student.id,
                course_id=course.id,
                semester_id=sem.id,
                academic_year=ACADEMIC_YEAR,
                status="active",
            )
            db.session.add(enrollment)
            db.session.flush()
        elif not enrollment.semester_id:
            enrollment.semester_id = sem.id

        students_by_sem[item["sem_num"]].append(student)

    return students_by_sem


def ensure_sample_attendance(course, subject_by_code, students_by_sem):
    """
    Seeds realistic past attendance sessions across Sem 1, Sem 2, Sem 3 so
    dashboards, attendance percentages, and session history are testable immediately.
    """
    sample_sessions = [
        ("SEED-MCA1-101-A", "RCAI101", 1, 5, [0, 1, 2, 3, 4]),
        ("SEED-MCA1-101-B", "RCAI101", 1, 2, [0, 2, 3, 4, 5]),
        ("SEED-MCA1-102-A", "RCAI102", 1, 4, [0, 1, 3, 5]),
        ("SEED-MCA1-104-A", "RCAI104", 1, 1, [0, 1, 2, 3, 4, 5]),
        ("SEED-MCA2-201-A", "RCAI201", 2, 3, [0, 1]),
        ("SEED-MCA2-202-A", "RCAI202", 2, 1, [0, 1, 2]),
        ("SEED-MCA3-301-A", "RCAI301", 3, 2, [0, 2]),
        ("SEED-MCA3-302-A", "RCAI302", 3, 1, [0, 1, 2]),
    ]

    now = datetime.now()
    created_count = 0

    for code, subj_code, sem_num, days_ago, present_indices in sample_sessions:
        existing = AttendanceSession.query.filter(AttendanceSession.session_code == code).first()
        if existing:
            continue

        subj = subject_by_code.get(subj_code)
        sem_students = students_by_sem.get(sem_num, [])
        if not subj or not subj.teacher_id or not sem_students:
            continue

        present_set = set(present_indices)
        total_enrolled = len(sem_students)
        present_count = sum(1 for idx in range(total_enrolled) if idx in present_set)
        absent_count = total_enrolled - present_count

        session_dt = now - timedelta(days=days_ago)
        sess = AttendanceSession(
            session_code=code,
            teacher_id=subj.teacher_id,
            course_id=course.id,
            subject_id=subj.id,
            room=subj.room,
            date=session_dt,
            photos_count=2,
            total_enrolled=total_enrolled,
            total_present=present_count,
            total_absent=absent_count,
        )
        db.session.add(sess)
        db.session.flush()

        for idx, st in enumerate(sem_students):
            is_present = idx in present_set
            rec = AttendanceRecord(
                session_id=sess.id,
                student_id=st.id,
                status="Present" if is_present else "Absent",
                confidence="96.4%" if is_present else None,
                matched_at=session_dt,
                remarks="Seeded classroom test session" if is_present else "Absent in seeded session",
            )
            db.session.add(rec)

        created_count += 1

    return created_count


def main():
    print("Step 1: Connecting to database and applying architectural migrations...")
    connect_db()
    sync_architecture_and_migrations()

    try:
        print("Step 2: Ensuring rooms, MCAINT course, semesters (1-10), and sections...")
        room_map = ensure_rooms()
        course, sem_map, ay, section_a = ensure_course_and_semesters()

        print("Step 3: Seeding/updating teachers...")
        teacher_by_email = ensure_teachers()

        print("Step 4: Creating/updating Semester 1-5 subjects and syncing timetables...")
        subject_by_code = ensure_subjects_and_timetable(
            course, sem_map, ay, section_a, room_map, teacher_by_email
        )

        print("Step 5: Enrolling/creating students across Semesters 1-5...")
        students_by_sem = ensure_students(course, sem_map)

        print("Step 6: Seeding sample attendance sessions...")
        new_sessions = ensure_sample_attendance(course, subject_by_code, students_by_sem)

        db.session.commit()

        print("\n=== SEED COMPLETE ===")
        print(f"Course: {course.code} ({course.name})")
        print(f"Teachers total: {Teacher.query.count()}")
        print(f"Subjects in MCAINT: {Subject.query.filter(Subject.course_id == course.id).count()}")
        print(f"Timetable slots total: {SubjectTimetable.query.count()}")
        print(f"Students total: {Student.query.count()}")
        print(f"New sample attendance sessions added: {new_sessions}")
    except Exception as exc:
        db.session.rollback()
        print("Seed failed:", str(exc))
        raise


if __name__ == "__main__":
    main()

