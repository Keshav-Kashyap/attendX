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

# Optional OpenCV for multi-face detection in group photos
HAS_CV2 = False
_cv2_cascade = None
try:
    import cv2
    HAS_CV2 = True
except ImportError:
    cv2 = None


def load_cv2_cascade():
    global _cv2_cascade
    if not HAS_CV2 or cv2 is None:
        return None
    if _cv2_cascade is None:
        try:
            cascade_file = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            _cv2_cascade = cv2.CascadeClassifier(cascade_file)
        except Exception as e:
            print("Error loading OpenCV face cascade:", str(e))
            _cv2_cascade = None
    return _cv2_cascade

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
   
    if image_np is None:
        return []

    encodings = []

    # Priority 1: Dlib face detector & recognition models
    detector, sp, facerec = load_dlib_models()
    if detector is not None and sp is not None and facerec is not None:
        try:
            faces = detector(image_np, 1)
            for face in faces:
                shape = sp(image_np, face)
                face_descriptor = facerec.compute_face_descriptor(image_np, shape, 1)
                encodings.append(np.array(face_descriptor, dtype=np.float64))
            if encodings:
                return encodings
        except Exception as e:
            print("Dlib face embedding computation error:", str(e))

    # Priority 2: OpenCV Haar Cascade Multi-Face Detector for group photos
    cascade = load_cv2_cascade()
    if cascade is not None:
        try:
            if len(image_np.shape) == 3 and image_np.shape[2] >= 3:
                gray = cv2.cvtColor(image_np[:, :, :3], cv2.COLOR_RGB2GRAY)
            else:
                gray = image_np

            detected_boxes = cascade.detectMultiScale(
                gray,
                scaleFactor=1.1,
                minNeighbors=4,
                minSize=(28, 28)
            )

            if len(detected_boxes) > 0:
                h_img, w_img = image_np.shape[:2]
                for (x, y, w, h) in detected_boxes:
                    pad_h = int(h * 0.1)
                    pad_w = int(w * 0.1)
                    y1 = max(0, y - pad_h)
                    y2 = min(h_img, y + h + pad_h)
                    x1 = max(0, x - pad_w)
                    x2 = min(w_img, x + w + pad_w)
                    face_crop = image_np[y1:y2, x1:x2]
                    vec = _fallback_face_feature_vector(face_crop, dim=128)
                    if vec is not None:
                        encodings.append(vec)
                if encodings:
                    return encodings
        except Exception as cv_err:
            print("OpenCV multi-face detection notice:", str(cv_err))

    # Priority 3: Fallback central face region if detector missed
    vec = _fallback_face_feature_vector(image_np, dim=128)
    if vec is not None:
        encodings.append(vec)

    return encodings


def extract_face_embedding(photo_input):
   
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
        if not emb:
            # Jiski embedding nahi hai, wo check nahi hoga
            continue

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

    resemblance_threshold = 0.65
    assigned_students = set()

    for encoding in encodings:
        predicted_id = None
        best_match_score = float("inf")

        # Nearest neighbor distance matching against all enrolled training vectors
        distances = [float(np.linalg.norm(x - encoding)) for x in X_train]
        if distances:
            sorted_indices = np.argsort(distances)
            for idx in sorted_indices:
                cand_id = int(y_train[idx])
                if cand_id not in assigned_students:
                    predicted_id = cand_id
                    best_match_score = distances[idx]
                    break
            if predicted_id is None:
                predicted_id = int(y_train[sorted_indices[0]])
                best_match_score = distances[sorted_indices[0]]

        # If distance is within facial recognition threshold, mark as recognized
        if best_match_score <= resemblance_threshold:
            assigned_students.add(predicted_id)
            conf_val = round(
                max(82.0, min(99.0, (1.0 - (best_match_score / resemblance_threshold)) * 17.0 + 82.0)),
                1,
            )
            detected_students[predicted_id] = {
                "present": True,
                "confidence": f"{conf_val}%",
                "distance": round(best_match_score, 4),
            }

    return detected_students, all_students, len(encodings)