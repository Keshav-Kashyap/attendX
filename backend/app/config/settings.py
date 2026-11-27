import os

class Config:
    ENV = (os.getenv("ENV") or os.getenv("ENVIRONMENT") or "production").strip().lower()
    # Always prioritize DATABASE_URL (Neon PostgreSQL)
    DATABASE_URL = (
        os.getenv("DATABASE_URL")
        or os.getenv("LOCAL_DATABASE_URL")
        or "postgresql://postgres:postgres@localhost:5432/postgres"
    )

    SQLALCHEMY_DATABASE_URI = DATABASE_URL

    SQLALCHEMY_TRACK_MODIFICATIONS = False