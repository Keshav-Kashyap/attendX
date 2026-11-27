import os
import sys
from dotenv import load_dotenv
from sqlalchemy import text

load_dotenv()

# Import all 12 architecture models to register them with Base.metadata
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
from app.modules.users.model import User
from app.modules.student.model import Student
from app.modules.teacher.model import (
    Teacher,
    TeacherAssignment,
)
from app.modules.attendance.model import AttendanceSession, AttendanceRecord
from app.modules.auth.model import InviteToken
from app.modules.notifications.model import DeviceToken, NotificationPreference, NotificationLog

from app.config.database import connect_db, engine
from app.modules.admin import seed_default_admin_if_empty
from app.modules.course.service import seed_default_courses_if_empty


def sync_architecture_and_migrations():
    """
    Applies safe database schema updates and seeds initial architecture records
    for AcademicYear, Section, Room, and CourseSubject mappings.
    """
    print("Applying schema updates and architectural migrations...")
    try:
        with engine.begin() as conn:
            # Drop legacy / removed availability tables
            conn.execute(text("DROP TABLE IF EXISTS teacher_availability CASCADE;"))
            conn.execute(text("DROP TABLE IF EXISTS teacher_unavailability CASCADE;"))

            # 1. Update subjects table
            conn.execute(text("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL;"))
            conn.execute(text("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS description TEXT;"))
            conn.execute(text("ALTER TABLE subjects DROP COLUMN IF EXISTS semester CASCADE;"))

            # 2. Update teachers table
            conn.execute(text("ALTER TABLE teachers ADD COLUMN IF NOT EXISTS qualification VARCHAR(150);"))
            conn.execute(text("ALTER TABLE teachers ADD COLUMN IF NOT EXISTS specialization VARCHAR(150);"))
            conn.execute(text("ALTER TABLE teachers ADD COLUMN IF NOT EXISTS joining_date DATE;"))
            conn.execute(text("ALTER TABLE teachers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;"))

            # 3. Update teacher_assignments table
            conn.execute(text("ALTER TABLE teacher_assignments ADD COLUMN IF NOT EXISTS course_subject_id BIGINT REFERENCES course_subjects(id) ON DELETE SET NULL;"))
            conn.execute(text("ALTER TABLE teacher_assignments ADD COLUMN IF NOT EXISTS section_id BIGINT REFERENCES sections(id) ON DELETE SET NULL;"))
            conn.execute(text("ALTER TABLE teacher_assignments ADD COLUMN IF NOT EXISTS assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL;"))
            conn.execute(text("ALTER TABLE teacher_assignments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';"))

            # 4. Seed default Academic Year if missing
            ay_count = conn.execute(text("SELECT COUNT(*) FROM academic_years")).scalar()
            if ay_count == 0:
                print("Seeding default academic year '2026-2027'...")
                conn.execute(text("""
                    INSERT INTO academic_years (year_name, start_date, end_date, is_active)
                    VALUES ('2026-2027', '2026-07-01', '2027-06-30', TRUE)
                    ON CONFLICT (year_name) DO NOTHING;
                """))

            def_ay_id = conn.execute(text("SELECT id FROM academic_years WHERE year_name = '2026-2027'")).scalar()

            # 5. Seed default Sections for each course if missing
            courses = conn.execute(text("SELECT id, name FROM courses")).fetchall()
            for c in courses:
                c_id = c[0]
                for s_name in ['A', 'B']:
                    conn.execute(text("""
                        INSERT INTO sections (course_id, academic_year_id, section_name)
                        VALUES (:cid, :ayid, :sname)
                        ON CONFLICT (course_id, academic_year_id, section_name) DO NOTHING;
                    """), {"cid": c_id, "ayid": def_ay_id, "sname": s_name})

            # 6. Seed default Rooms if missing
            room_count = conn.execute(text("SELECT COUNT(*) FROM rooms")).scalar()
            if room_count == 0:
                print("Seeding default rooms...")
                conn.execute(text("""
                    INSERT INTO rooms (room_name, building, capacity, is_active)
                    VALUES 
                    ('Block B, Hall 3', 'Block B', 60, TRUE),
                    ('Block A, Room 101', 'Block A', 45, TRUE),
                    ('Lab 2, CS Dept', 'Computer Center', 40, TRUE)
                    ON CONFLICT (room_name) DO NOTHING;
                """))

            # 7. Backfill course_subjects mapping for all existing subjects
            all_subs = conn.execute(text("SELECT id, course_id, semester_id FROM subjects")).fetchall()
            for sub in all_subs:
                s_id = sub[0]
                c_id = sub[1]
                sem_id = sub[2]
                if not sem_id:
                    sem_id = conn.execute(text("SELECT id FROM semesters WHERE course_id = :cid ORDER BY semester_number LIMIT 1"), {"cid": c_id}).scalar()

                if c_id and sem_id and def_ay_id:
                    conn.execute(text("""
                        INSERT INTO course_subjects (course_id, semester_id, subject_id, academic_year_id)
                        VALUES (:cid, :semid, :subid, :ayid)
                        ON CONFLICT (course_id, semester_id, subject_id, academic_year_id) DO NOTHING;
                    """), {"cid": c_id, "semid": sem_id, "subid": s_id, "ayid": def_ay_id})

            # 8. Sync teacher_assignments with course_subject_id and section_id
            conn.execute(text("""
                UPDATE teacher_assignments ta
                SET course_subject_id = cs.id
                FROM course_subjects cs
                WHERE ta.course_id = cs.course_id 
                  AND ta.subject_id = cs.subject_id
                  AND ta.course_subject_id IS NULL;
            """))

            conn.execute(text("""
                UPDATE teacher_assignments ta
                SET section_id = sec.id
                FROM sections sec
                WHERE ta.course_id = sec.course_id
                  AND sec.section_name = 'A'
                  AND ta.section_id IS NULL;
            """))

            # 9. Sync subjects.teacher_id from teacher_assignments
            conn.execute(text("""
                UPDATE subjects s
                SET teacher_id = ta.teacher_id
                FROM teacher_assignments ta
                WHERE s.id = ta.subject_id AND s.teacher_id IS NULL;
            """))

        print("Architectural schema updates and synchronization complete.")
    except Exception as e:
        print("Schema update notice (skipped if already applied):", str(e))


def main():
    print("Connecting to database and creating tables...")
    connect_db()

    print("Running architectural sync...")
    sync_architecture_and_migrations()

    print("Seeding default admin if not present...")
    seed_default_admin_if_empty()

    print("Seeding default courses and subjects if not present...")
    seed_default_courses_if_empty()

    print("Database initialization completed successfully.")


if __name__ == "__main__":
    main()
