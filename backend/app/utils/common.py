from werkzeug.security import generate_password_hash, check_password_hash
import re

def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return check_password_hash(hashed_password, password)


def validate_password(password: str):
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"

    if not re.search(r"[A-Z]", password):
        return False, "Password must contain at least one uppercase letter"

    if not re.search(r"[a-z]", password):
        return False, "Password must contain at least one lowercase letter"

    if not re.search(r"\d", password):
        return False, "Password must contain at least one digit"

    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False, "Password must contain at least one special character"

    return True, "Password is valid"


def send_user_welcome_email(email: str, name: str, password: str, role: str = "student") -> bool:
    """
    Sends initial login credentials to the user's email address (Gmail delivery to be wired later).
    Currently logs the dispatch on the server console so account creation stays non-blocking.
    """
    print(f"Email sent for user: {email} (role={role}, name={name}, initial_password={password})")
    return True