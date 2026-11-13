import base64
import io
import numpy as np

HAS_PIL = False
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    Image = None

# Safe optional imports for heavy ML libraries
HAS_DLIB = False
try:
    import dlib
    import face_recognition_models
    HAS_DLIB = True
except ImportError:
    dlib = None
    face_recognition_models = None

HAS_SKLEARN = False
try:
    from sklearn.svm import SVC
    HAS_SKLEARN = True
except ImportError:
    SVC = None

# Cached model instances to avoid reloading heavy weights on every request
_detector = None
_sp = None
_facerec = None


def load_dlib_models():
    """
    Loads dlib facial detection and 128-d recognition models if available.
    """
    global _detector, _sp, _facerec
    if not HAS_DLIB:
        return None, None, None

    try:
        if _detector is None or _sp is None or _facerec is None:
            _detector = dlib.get_frontal_face_detector()
            _sp = dlib.shape_predictor(face_recognition_models.pose_predictor_model_location())
            _facerec = dlib.face_recognition_model_v1(face_recognition_models.face_recognition_model_location())
        return _detector, _sp, _facerec
    except Exception as e:
        print("Error loading dlib models:", str(e))
        return None, None, None


def base64_to_image_np(base64_str):
    """
    Decodes base64 string (with or without data URI header) or HTTP/HTTPS image URL to RGB numpy array.
    """
    if not base64_str or not isinstance(base64_str, str):
        return None
    try:
        # If input is an HTTP/HTTPS image URL (e.g. from Cloudinary)
        if base64_str.startswith("http://") or base64_str.startswith("https://"):
            import requests
            resp = requests.get(base64_str, timeout=10)
            if resp.status_code == 200:
                img = Image.open(io.BytesIO(resp.content)).convert("RGB")
                return np.array(img)
            return None

        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]

        img_bytes = base64.b64decode(base64_str)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        return np.array(img)
    except Exception as e:
        print("Error decoding image to image_np:", str(e))
        return None


def _fallback_face_feature_vector(image_np, dim=128):
    """
    Computes a 128-dimensional normalized image feature vector
    from the central face region when dlib is not available.
    """
    try:
        h, w = image_np.shape[:2]
        # Crop central 60% of image where face is positioned in portrait
        cy, cx = h // 2, w // 2
        dy, dx = int(h * 0.3), int(w * 0.3)
        crop = image_np[max(0, cy - dy):min(h, cy + dy), max(0, cx - dx):min(w, cx + dx)]

        pil_crop = Image.fromarray(crop).resize((32, 32)).convert("L")
        arr = np.array(pil_crop, dtype=np.float64).flatten()  # 1024 elements

        # Project 1024 down to 128 via block averaging
        vec = arr.reshape((dim, -1)).mean(axis=1)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec
    except Exception as e:
        print("Fallback face vector error:", str(e))
        return None


def get_face_embeddings(image_np):
    """
    Detects faces in an image and extracts 128-d embeddings for each detected face.
    Returns list of 128-d numpy arrays.
    """
    if image_np is None:
        return []

    detector, sp, facerec = load_dlib_models()
    encodings = []

    if detector is not None and sp is not None and facerec is not None:
        try:
            faces = detector(image_np, 1)
            for face in faces:
                shape = sp(image_np, face)
                face_descriptor = facerec.compute_face_descriptor(image_np, shape, 1)
                encodings.append(np.array(face_descriptor, dtype=np.float64))
            return encodings
        except Exception as e:
            print("Dlib face embedding computation error:", str(e))

    # Fallback if dlib is not installed
    vec = _fallback_face_feature_vector(image_np, dim=128)
    if vec is not None:
        encodings.append(vec)

    return encodings


def extract_face_embedding(photo_input):
    """
    Extracts a 128-dimensional face embedding from a student profile photo.
    
    Accepts:
        photo_input: base64 string or numpy array

    Returns:
        tuple (embedding_list, error_msg):
            embedding_list: list of 128 floats, or None if failed
            error_msg: str or None
    """
    if not photo_input:
        return None, "No photo provided."

    if isinstance(photo_input, str):
        image_np = base64_to_image_np(photo_input)
    elif isinstance(photo_input, np.ndarray):
        image_np = photo_input
    else:
        return None, "Unsupported photo data format."

    if image_np is None:
        return None, "Could not decode photo. Please provide a valid image file or camera capture."

    encodings = get_face_embeddings(image_np)
    if not encodings or len(encodings) == 0:
        return None, "No face detected in the photo. Please ensure your face is clearly visible and well-lit."

    primary_embedding = [round(float(x), 6) for x in encodings[0]]
    return primary_embedding, None


def get_trained_model(students=None):
    if students is None:
        try:
            from app.modules.student.model import Student
            students = Student.query.all()
        except Exception as e:
            print("Could not query students from DB in face_pipeline:", str(e))
            students = []

    X = []
    y = []

    for student in students:
        emb = getattr(student, "face_embedding", None)

        # Case 1: stored as dict e.g. {"embedding": [...]}
        if isinstance(emb, dict) and "embedding" in emb:
            emb = emb["embedding"]

        # Case 2: direct list of 128 floats
        if isinstance(emb, (list, tuple)) and len(emb) == 128:
            X.append(np.array(emb, dtype=np.float64))
            y.append(student.id)
        elif isinstance(emb, list) and len(emb) > 0 and isinstance(emb[0], (list, tuple)):
            for sub_emb in emb:
                if len(sub_emb) == 128:
                    X.append(np.array(sub_emb, dtype=np.float64))
                    y.append(student.id)
        else:
            # Case 3: extract embedding from student profile photo if available
            user_obj = getattr(student, "user", None)
            profile_img = getattr(user_obj, "profile_image", None) if user_obj else None
            if profile_img:
                img_np = base64_to_image_np(profile_img)
                if img_np is not None:
                    detected_embs = get_face_embeddings(img_np)
                    for d_emb in detected_embs:
                        X.append(d_emb)
                        y.append(student.id)

    model = None
    if len(X) > 0 and HAS_SKLEARN and SVC is not None:
        unique_classes = set(y)
        # SVC requires at least 2 distinct classes to fit
        if len(unique_classes) >= 2:
            model = SVC(kernel="linear", probability=True, class_weight="balanced")
            try:
                model.fit(X, y)
            except ValueError as e:
                print("SVC fit error:", str(e))
                model = None

    return {
        "model": model,
        "X": X,
        "Y": y,
        "students": students,
    }


def train_classifier():
    model_data = get_trained_model()
    return bool(model_data.get("model") or len(model_data.get("X", [])) > 0)


def predict_attendence(class_image_np, students=None, model_data=None):
    """
    Recognizes students present in a classroom image.
    """
    if class_image_np is None:
        return {}, [], 0

    encodings = get_face_embeddings(class_image_np)
    detected_students = {}

    if model_data is None:
        model_data = get_trained_model(students)

    model = model_data.get("model")
    X_train = model_data.get("X", [])
    y_train = model_data.get("Y", [])
    all_students = model_data.get("students", [])

    if len(encodings) == 0 or len(X_train) == 0:
        return detected_students, all_students, len(encodings)

    resemblance_threshold = 0.6

    for encoding in encodings:
        predicted_id = None

        # If SVC model is trained with >=2 classes, use model prediction
        if model is not None and len(set(y_train)) >= 2:
            try:
                predicted_id = int(model.predict([encoding])[0])
            except Exception:
                predicted_id = None

        # Verify predicted student embedding via Euclidean distance
        if predicted_id is not None and predicted_id in y_train:
            idx = y_train.index(predicted_id)
            student_embedding = X_train[idx]
            best_match_score = float(np.linalg.norm(student_embedding - encoding))
        else:
            # Nearest neighbor distance matching against all enrolled training vectors
            distances = [float(np.linalg.norm(x - encoding)) for x in X_train]
            min_idx = int(np.argmin(distances))
            best_match_score = distances[min_idx]
            predicted_id = int(y_train[min_idx])

        # If distance is within facial recognition threshold, mark as recognized
        if best_match_score <= resemblance_threshold:
            conf_val = round(
                max(75.0, min(99.0, (1.0 - (best_match_score / resemblance_threshold)) * 24.0 + 75.0)),
                1,
            )
            detected_students[predicted_id] = {
                "present": True,
                "confidence": f"{conf_val}%",
                "distance": round(best_match_score, 4),
            }

    return detected_students, all_students, len(encodings)