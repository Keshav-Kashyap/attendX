import os

class Config:
    ENV = (os.getenv("ENV") or os.getenv("ENVIRONMENT") or "development").strip().lower()
    DATABASE_URL = (
        os.getenv("LOCAL_DATABASE_URL") or "postgresql://postgres:postgres@localhost:5432/postgres"
        if ENV == "development"
        else os.getenv("DATABASE_URL")
    )

    SQLALCHEMY_DATABASE_URI = DATABASE_URL

    SQLALCHEMY_TRACK_MODIFICATIONS = False