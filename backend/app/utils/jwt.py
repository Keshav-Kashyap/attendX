import jwt
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY"
)
def create_access_token(user_id, role=None):
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=7)
    }
    if role:
        payload["role"] = role

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm="HS256"
    )

def decode_access_token(token):
    return jwt.decode(
        token,
        JWT_SECRET_KEY,
        algorithms=["HS256"]
    )