import urllib.request
import json
import uuid

BASE_URL = "http://localhost:5001/api/admin"

# First login as admin or test endpoint with admin headers
def test_create_teacher_and_student():
    # Login as admin to get token
    login_url = "http://localhost:5001/api/auth/login"
    login_payload = json.dumps({
        "email": "admin@gmail.com",
        "password": "admin123"
    }).encode("utf-8")
    
    req = urllib.request.Request(
        login_url,
        data=login_payload,
        headers={"Content-Type": "application/json"}
    )
    
    try:
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            token = data.get("access_token")
            print("Admin login successful. Token acquired.")
    except Exception as e:
        print(f"Admin login failed: {e}")
        return

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    # 1. Fetch courses to get course_id and semester
    courses_req = urllib.request.Request(f"{BASE_URL}/courses", headers=headers)
    with urllib.request.urlopen(courses_req) as resp:
        courses_data = json.loads(resp.read().decode("utf-8"))
        courses = courses_data.get("data", [])
        print(f"Courses fetched: {len(courses)} courses found.")
        target_course = courses[0] if courses else None
        print(f"Selected Course: {target_course['code']} (ID: {target_course['id']})")

    # 2. Test create teacher
    test_teacher_email = f"teacher_{uuid.uuid4().hex[:6]}@college.edu"
    teacher_payload = json.dumps({
        "name": "Prof. Test Verma",
        "email": test_teacher_email,
        "password": "teacher123",
        "department": "Computer Science & Engineering",
        "phone": "+91 9999988888"
    }).encode("utf-8")

    t_req = urllib.request.Request(f"{BASE_URL}/teachers", data=teacher_payload, headers=headers)
    with urllib.request.urlopen(t_req) as resp:
        t_data = json.loads(resp.read().decode("utf-8")).get("data", {})
        print("Teacher created successfully:", t_data.get("employee_code"), t_data.get("user", {}).get("name"))

    # 3. Test create student
    test_student_email = f"student_{uuid.uuid4().hex[:6]}@college.edu"
    student_payload = json.dumps({
        "name": "Rohit Kumar Test",
        "email": test_student_email,
        "password": "student123",
        "course_id": target_course["id"],
        "semester": "Semester 1",
        "academic_year": "2026-2027",
        "phone": "+91 8888877777"
    }).encode("utf-8")

    s_req = urllib.request.Request(f"{BASE_URL}/students", data=student_payload, headers=headers)
    with urllib.request.urlopen(s_req) as resp:
        s_data = json.loads(resp.read().decode("utf-8")).get("data", {})
        print("Student created successfully:", s_data.get("roll_number"), s_data.get("user", {}).get("name"))

    # 4. Fetch students list
    list_req = urllib.request.Request(f"{BASE_URL}/students", headers=headers)
    with urllib.request.urlopen(list_req) as resp:
        students_resp = json.loads(resp.read().decode("utf-8"))
        students_list = students_resp.get("data", [])
        print(f"Total students in roster: {len(students_list)}")
        created_match = next((s for s in students_list if s.get("email") == test_student_email), None)
        if created_match:
            print("Found newly enrolled student in roster:", created_match.get("name"), created_match.get("roll_number"), created_match.get("course_code"))
        else:
            print("Warning: Newly enrolled student not found in roster.")

if __name__ == "__main__":
    test_create_teacher_and_student()
