import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from app.config.database import engine
from sqlalchemy import text

def run_migration():
    print(f"Starting database migration on {engine.url.host}/{engine.url.database}...")

    with engine.begin() as conn:
        # Step 1: Ensure courses table exists
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS courses (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(50) UNIQUE NOT NULL,
                description VARCHAR(255),
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
            );
        """))

        # Step 2: Seed default courses if empty
        courses_count = conn.execute(text("SELECT COUNT(*) FROM courses")).scalar()
        if courses_count == 0:
            print("Seeding default courses: MCA, BCA, B.Tech CSE...")
            conn.execute(text("""
                INSERT INTO courses (name, code, description) VALUES
                ('Master of Computer Applications', 'MCA', 'Postgraduate program in computer applications and software engineering'),
                ('Bachelor of Computer Applications', 'BCA', 'Undergraduate program in computer science fundamentals and application development'),
                ('B.Tech Computer Science & Engineering', 'B.Tech CSE', 'Engineering degree program in computing systems and software technologies');
            """))

        # Step 3: Ensure subjects table exists
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS subjects (
                id SERIAL PRIMARY KEY,
                course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(50) NOT NULL,
                semester VARCHAR(20),
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW()
            );
        """))

        # Add subjects.teacher_id and description, drop redundant semester column
        conn.execute(text("""
            ALTER TABLE subjects ADD COLUMN IF NOT EXISTS teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL;
            ALTER TABLE subjects ADD COLUMN IF NOT EXISTS description TEXT;
            ALTER TABLE subjects DROP COLUMN IF EXISTS semester CASCADE;
            DROP TABLE IF EXISTS teacher_availability CASCADE;
            DROP TABLE IF EXISTS teacher_unavailability CASCADE;
        """))

        # Step 4: Seed default subjects if empty
        subjects_count = conn.execute(text("SELECT COUNT(*) FROM subjects")).scalar()
        if subjects_count == 0:
            print("Seeding default subjects...")
            mca_id = conn.execute(text("SELECT id FROM courses WHERE code = 'MCA'")).scalar()
            bca_id = conn.execute(text("SELECT id FROM courses WHERE code = 'BCA'")).scalar()
            btech_id = conn.execute(text("SELECT id FROM courses WHERE code = 'B.Tech CSE'")).scalar()

            if mca_id:
                conn.execute(text("""
                    INSERT INTO subjects (course_id, name, code, semester) VALUES
                    (:cid, 'Computer Vision', 'CS-401', 'Semester 4'),
                    (:cid, 'Machine Learning', 'CS-402', 'Semester 4'),
                    (:cid, 'Cloud Computing & DevOps', 'CS-403', 'Semester 4');
                """), {"cid": mca_id})

            if bca_id:
                conn.execute(text("""
                    INSERT INTO subjects (course_id, name, code, semester) VALUES
                    (:cid, 'Database Management Systems', 'BCA-201', 'Semester 2'),
                    (:cid, 'Web Technologies', 'BCA-202', 'Semester 2'),
                    (:cid, 'Python Programming', 'BCA-203', 'Semester 2');
                """), {"cid": bca_id})

            if btech_id:
                conn.execute(text("""
                    INSERT INTO subjects (course_id, name, code, semester) VALUES
                    (:cid, 'Artificial Intelligence', 'CSE-301', 'Semester 6'),
                    (:cid, 'Data Structures & Algorithms', 'CSE-302', 'Semester 4'),
                    (:cid, 'Operating Systems', 'CSE-303', 'Semester 4');
                """), {"cid": btech_id})

        # Step 5: Ensure teacher_assignments table exists (Issue 2 source of truth)
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS teacher_assignments (
                id SERIAL PRIMARY KEY,
                teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
                course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                room VARCHAR(50) DEFAULT 'Block B, Hall 3',
                schedule VARCHAR(100) DEFAULT 'Mon, Wed, Fri - 10:15 AM',
                academic_year VARCHAR(20) DEFAULT '2026-2027',
                assigned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
                CONSTRAINT uq_teacher_course_subject UNIQUE (teacher_id, course_id, subject_id)
            );
        """))

        # Seed assignments for first teacher if empty
        assign_count = conn.execute(text("SELECT COUNT(*) FROM teacher_assignments")).scalar()
        first_teacher_id = conn.execute(text("SELECT id FROM teachers LIMIT 1")).scalar()
        if assign_count == 0 and first_teacher_id:
            print(f"Seeding teacher assignments for teacher ID {first_teacher_id}...")
            all_subs = conn.execute(text("SELECT id, course_id FROM subjects")).fetchall()
            for sub in all_subs:
                conn.execute(text("""
                    INSERT INTO teacher_assignments (teacher_id, course_id, subject_id, room, schedule)
                    VALUES (:tid, :cid, :sid, 'Block B, Hall 3', 'Mon, Wed, Fri - 10:15 AM')
                    ON CONFLICT ON CONSTRAINT uq_teacher_course_subject DO NOTHING;
                """), {"tid": first_teacher_id, "cid": sub[1], "sid": sub[0]})

        # Step 6: Ensure course_enrollments table exists (Issue 1 source of truth)
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS course_enrollments (
                id SERIAL PRIMARY KEY,
                student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                academic_year VARCHAR(20) DEFAULT '2026-2027',
                semester VARCHAR(20) DEFAULT 'Semester 1',
                status VARCHAR(20) NOT NULL DEFAULT 'active',
                enrolled_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
                CONSTRAINT uq_student_course_enrollment UNIQUE (student_id, course_id)
            );
        """))

        # Issue 1 fix: Migrate existing student courses into course_enrollments before dropping students.course
        students_cols = conn.execute(text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'students' AND column_name = 'course';
        """)).fetchall()

        if students_cols:
            print("Migrating existing student course values into course_enrollments...")
            mca_id = conn.execute(text("SELECT id FROM courses WHERE code = 'MCA'")).scalar()
            all_students = conn.execute(text("SELECT id, course FROM students")).fetchall()
            for s in all_students:
                s_id = s[0]
                s_course = s[1]
                target_cid = mca_id

                if s_course:
                    sc_lower = str(s_course).strip().lower()
                    matched = conn.execute(
                        text("SELECT id FROM courses WHERE LOWER(code) = :c OR LOWER(name) = :c"),
                        {"c": sc_lower}
                    ).scalar()
                    if matched:
                        target_cid = matched

                if target_cid:
                    conn.execute(text("""
                        INSERT INTO course_enrollments (student_id, course_id, academic_year, semester, status)
                        VALUES (:sid, :cid, '2026-2027', 'Semester 1', 'active')
                        ON CONFLICT ON CONSTRAINT uq_student_course_enrollment DO NOTHING;
                    """), {"sid": s_id, "cid": target_cid})

            # Now drop students.course and students.course_id
            print("Dropping redundant students.course and students.course_id columns...")
            conn.execute(text("ALTER TABLE students DROP COLUMN IF EXISTS course CASCADE;"))
            conn.execute(text("ALTER TABLE students DROP COLUMN IF EXISTS course_id CASCADE;"))

        # Step 7: Issue 3 fix: Rebuild attendance_sessions & attendance_records with proper schema
        print("Recreating attendance_sessions and attendance_records with accurate schema...")
        conn.execute(text("DROP TABLE IF EXISTS attendance_records CASCADE;"))
        conn.execute(text("DROP TABLE IF EXISTS attendance_sessions CASCADE;"))

        conn.execute(text("""
            CREATE TABLE attendance_sessions (
                id SERIAL PRIMARY KEY,
                session_code VARCHAR(50) UNIQUE NOT NULL,
                teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
                course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                room VARCHAR(50),
                date TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
                photos_count INTEGER DEFAULT 1 NOT NULL,
                total_enrolled INTEGER DEFAULT 0 NOT NULL,
                total_present INTEGER DEFAULT 0 NOT NULL,
                total_absent INTEGER DEFAULT 0 NOT NULL,
                created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL
            );
        """))

        conn.execute(text("""
            CREATE TABLE attendance_records (
                id SERIAL PRIMARY KEY,
                session_id INTEGER NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
                student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                status VARCHAR(20) DEFAULT 'Present' NOT NULL,
                confidence VARCHAR(20),
                matched_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
                remarks VARCHAR(255),
                CONSTRAINT uq_session_student_attendance UNIQUE (session_id, student_id)
            );
        """))

    print("Database migration completed successfully!")

if __name__ == "__main__":
    run_migration()
