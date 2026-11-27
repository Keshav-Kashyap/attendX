"""
Comprehensive migration script to migrate all schema tables and data
from local PostgreSQL to Neon PostgreSQL.

Usage:
    python migrate_to_neon.py
    python migrate_to_neon.py --neon-url "postgresql://user:pass@ep-xyz.region.aws.neon.tech/attendx?sslmode=require"
"""

import argparse
import json
import os
import sys
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, text, inspect

# Ensure backend root is on sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

load_dotenv()

# Import all SQLAlchemy models to register Base.metadata
from app.config.database import Base
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
from app.modules.teacher.model import Teacher, TeacherAssignment
from app.modules.attendance.model import AttendanceSession, AttendanceRecord
from app.modules.auth.model import InviteToken
from app.modules.notifications.model import DeviceToken, NotificationPreference, NotificationLog


TABLE_MIGRATION_ORDER = [
    "users",
    "courses",
    "semesters",
    "academic_years",
    "sections",
    "rooms",
    "teachers",
    "subjects",
    "course_subjects",
    "teacher_assignments",
    "subject_timetable",
    "students",
    "course_enrollments",
    "attendance_sessions",
    "attendance_records",
    "invite_tokens",
    "device_tokens",
    "notification_preferences",
    "notification_logs",
]


def format_postgres_url(raw_url: str) -> str:
    """Ensures psycopg2 driver dialect prefix is present."""
    if not raw_url:
        return ""
    clean = raw_url.strip()
    if clean.startswith("postgres://"):
        clean = clean.replace("postgres://", "postgresql+psycopg2://", 1)
    elif clean.startswith("postgresql://") and not clean.startswith("postgresql+"):
        clean = clean.replace("postgresql://", "postgresql+psycopg2://", 1)
    return clean


def is_dummy_neon_url(url: str) -> bool:
    """Checks if the URL is still using sample/dummy credentials."""
    if not url:
        return True
    lower = url.lower()
    return "your_neon_password" in lower or "ep-sample-pooler" in lower or "your_password" in lower


def apply_schema_updates(engine):
    """Applies necessary schema alteration statements safely."""
    print("Applying column updates and architectural schema alignments...")
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL;"))
        conn.execute(text("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS description TEXT;"))
        conn.execute(text("ALTER TABLE teachers ADD COLUMN IF NOT EXISTS qualification VARCHAR(150);"))
        conn.execute(text("ALTER TABLE teachers ADD COLUMN IF NOT EXISTS specialization VARCHAR(150);"))
        conn.execute(text("ALTER TABLE teachers ADD COLUMN IF NOT EXISTS joining_date DATE;"))
        conn.execute(text("ALTER TABLE teachers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;"))
        conn.execute(text("ALTER TABLE teachers ADD COLUMN IF NOT EXISTS coordinator_semester_id INTEGER REFERENCES semesters(id) ON DELETE SET NULL;"))
        conn.execute(text("ALTER TABLE teacher_assignments ADD COLUMN IF NOT EXISTS course_subject_id BIGINT REFERENCES course_subjects(id) ON DELETE SET NULL;"))
        conn.execute(text("ALTER TABLE teacher_assignments ADD COLUMN IF NOT EXISTS section_id BIGINT REFERENCES sections(id) ON DELETE SET NULL;"))
        conn.execute(text("ALTER TABLE teacher_assignments ADD COLUMN IF NOT EXISTS assigned_by BIGINT REFERENCES users(id) ON DELETE SET NULL;"))
        conn.execute(text("ALTER TABLE teacher_assignments ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';"))


def migrate_data(source_engine, target_engine):
    """Migrates all rows from source (local) to target (Neon) table by table."""
    source_inspector = inspect(source_engine)
    available_source_tables = set(source_inspector.get_table_names())

    print("\nStarting data migration from local PostgreSQL to Neon...")

    with target_engine.begin() as target_conn:
        # Clean target tables first to avoid unique constraint conflicts with stale rows
        tables_to_truncate = ", ".join([f'"{t}"' for t in reversed(TABLE_MIGRATION_ORDER)])
        target_conn.execute(text(f"TRUNCATE TABLE {tables_to_truncate} RESTART IDENTITY CASCADE;"))

        with source_engine.connect() as source_conn:
            for table_name in TABLE_MIGRATION_ORDER:
                if table_name not in available_source_tables:
                    print(f"Skipping '{table_name}' (not present in source).")
                    continue

                # Read all rows from local source
                src_rows = source_conn.execute(text(f"SELECT * FROM {table_name}")).fetchall()
                if not src_rows:
                    print(f"[{table_name}] 0 rows in source. Skipping.")
                    continue

                col_names = list(source_conn.execute(text(f"SELECT * FROM {table_name} LIMIT 0")).keys())
                col_names_str = ", ".join([f'"{c}"' for c in col_names])
                placeholders = ", ".join([f":{c}" for c in col_names])

                # Check if table has 'id' primary key for conflict resolution
                has_id = "id" in col_names
                if has_id:
                    update_clause = ", ".join([f'"{c}" = EXCLUDED."{c}"' for c in col_names if c != "id"])
                    if update_clause:
                        insert_sql = f"""
                            INSERT INTO "{table_name}" ({col_names_str})
                            VALUES ({placeholders})
                            ON CONFLICT (id) DO UPDATE SET {update_clause};
                        """
                    else:
                        insert_sql = f"""
                            INSERT INTO "{table_name}" ({col_names_str})
                            VALUES ({placeholders})
                            ON CONFLICT (id) DO NOTHING;
                        """
                else:
                    insert_sql = f"""
                        INSERT INTO "{table_name}" ({col_names_str})
                        VALUES ({placeholders});
                    """

                # Serialize dict/list (JSON columns) and execute inserts
                rows_as_dicts = []
                for row in src_rows:
                    row_dict = {}
                    for col, val in zip(col_names, row):
                        if isinstance(val, (dict, list)):
                            row_dict[col] = json.dumps(val)
                        else:
                            row_dict[col] = val
                    rows_as_dicts.append(row_dict)

                target_conn.execute(text(insert_sql), rows_as_dicts)

                # Reset sequence for auto-increment if table has an id column
                if has_id:
                    try:
                        seq_sql = f"""
                            SELECT setval(
                                pg_get_serial_sequence('"{table_name}"', 'id'),
                                COALESCE(MAX(id), 1),
                                MAX(id) IS NOT NULL
                            ) FROM "{table_name}";
                        """
                        target_conn.execute(text(seq_sql))
                    except Exception:
                        pass

                print(f"[{table_name}] Migrated {len(src_rows)} rows successfully.")

    print("\nData migration finished successfully!")


def run_migration(neon_url: str = None, local_url: str = None):
    neon_url = neon_url or os.getenv("DATABASE_URL")
    local_url = local_url or os.getenv("LOCAL_DATABASE_URL")

    if not neon_url or is_dummy_neon_url(neon_url):
        print("\n[ERROR] Valid Neon database URL not found!")
        print("Line 18 in .env currently contains a placeholder:")
        print(f"  DATABASE_URL={neon_url}")
        print("\nPlease update line 18 in .env with your actual Neon PostgreSQL connection string, or run:")
        print('  python migrate_to_neon.py --neon-url "postgresql://neondb_owner:YOUR_ACTUAL_PASSWORD@ep-xyz.region.aws.neon.tech/attendx?sslmode=require"')
        return False

    neon_url_clean = format_postgres_url(neon_url)
    local_url_clean = format_postgres_url(local_url)

    print(f"Source (Local): {local_url_clean.split('@')[-1]}")
    print(f"Target (Neon):  {neon_url_clean.split('@')[-1]}")

    print("\nStep 1: Connecting to Local Database...")
    source_engine = create_engine(local_url_clean)
    with source_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("Local database connected successfully.")

    print("\nStep 2: Connecting to Neon Database...")
    target_engine = create_engine(neon_url_clean, pool_pre_ping=True)
    with target_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("Neon database connected successfully.")

    print("\nStep 3: Creating all missing tables on Neon...")
    Base.metadata.create_all(bind=target_engine)
    print("All SQLAlchemy tables verified / created on Neon.")

    print("\nStep 4: Applying schema updates...")
    apply_schema_updates(target_engine)

    print("\nStep 5: Migrating data from local to Neon...")
    migrate_data(source_engine, target_engine)

    print("\nStep 6: Verifying Neon row counts...")
    target_inspector = inspect(target_engine)
    neon_tables = target_inspector.get_table_names()
    with target_engine.connect() as conn:
        for t in sorted(neon_tables):
            cnt = conn.execute(text(f'SELECT COUNT(*) FROM "{t}"')).scalar()
            print(f"  - {t}: {cnt} rows")

    print("\n=== MIGRATION COMPLETE ===")
    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Migrate local AttendX database to Neon PostgreSQL.")
    parser.add_argument("--neon-url", help="Target Neon database connection string")
    parser.add_argument("--local-url", help="Source local database connection string")
    args = parser.parse_args()

    success = run_migration(neon_url=args.neon_url, local_url=args.local_url)
    if not success:
        sys.exit(1)
