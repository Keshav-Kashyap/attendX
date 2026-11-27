import os
from dotenv import load_dotenv
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    BigInteger,
    SmallInteger,
    String,
    Text,
    DateTime,
    Date,
    Time,
    JSON,
    ForeignKey,
    func,
    text,
    Float,
    Boolean,
    CheckConstraint,
    UniqueConstraint
)
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session, relationship, backref

load_dotenv()

ENV = os.getenv("ENV")

# Always prioritize DATABASE_URL (Neon PostgreSQL)
DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("LOCAL_DATABASE_URL")

if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
    elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
    # Strip channel_binding=require if present, as psycopg2-binary/Neon pooler can drop connections with it
    DATABASE_URL = DATABASE_URL.replace("&channel_binding=require", "").replace("channel_binding=require&", "").replace("?channel_binding=require", "")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=280,
    pool_timeout=30,
    pool_size=10,
    max_overflow=20
)

SessionFactory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db_session = scoped_session(SessionFactory)

Base = declarative_base()
Base.query = db_session.query_property()

class DBProxy:
    Model = Base
    Column = Column
    Integer = Integer
    BigInteger = BigInteger
    SmallInteger = SmallInteger
    String = String
    Text = Text
    DateTime = DateTime
    Date = Date
    Time = Time
    JSON = JSON
    ForeignKey = ForeignKey
    Float = Float
    Boolean = Boolean
    CheckConstraint = CheckConstraint
    UniqueConstraint = UniqueConstraint
    func = func
    relationship = staticmethod(relationship)
    backref = staticmethod(backref)
    session = db_session

db = DBProxy()

def get_db():
    session = db_session()
    try:
        yield session
    finally:
        session.close()

def connect_db():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        Base.metadata.create_all(bind=engine)
        print(f"Database connected successfully to {engine.url.host}/{engine.url.database}")
    except Exception as e:
        print(f"Database connection failed: {e}")