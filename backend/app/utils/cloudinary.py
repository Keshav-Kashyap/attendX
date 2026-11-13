import os
import cloudinary
import cloudinary.uploader


def configure_cloudinary():
    """
    Configures cloudinary from environment variables.
    Supports either CLOUDINARY_URL or individual credentials:
    CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
    """
    cloudinary_url = os.getenv("CLOUDINARY_URL")
    if cloudinary_url:
        cloudinary.config(cloudinary_url=cloudinary_url.strip())
        return True

    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    if cloud_name and api_key and api_secret:
        cloudinary.config(
            cloud_name=cloud_name.strip(),
            api_key=api_key.strip(),
            api_secret=api_secret.strip(),
            secure=True
        )
        return True

    return False


def upload_image_to_cloudinary(image_input, folder="attendx/students", public_id=None):
    """
    Uploads an image to Cloudinary.

    Args:
        image_input: base64 string, data URI, file path, or bytes.
        folder: Cloudinary folder path (default: 'attendx/students').
        public_id: Optional unique public ID for the file in Cloudinary.

    Returns:
        secure_url (str) on success, or None on failure / not configured.
    """
    if not image_input or not isinstance(image_input, (str, bytes)):
        return None

    # If it is already a hosted Cloudinary URL, avoid redundant re-upload
    if isinstance(image_input, str) and (image_input.startswith("http://") or image_input.startswith("https://")):
        if "cloudinary.com" in image_input:
            return image_input

    is_configured = configure_cloudinary()
    if not is_configured:
        print("[Cloudinary] Cloudinary credentials not configured in environment variables.")
        return None

    try:
        upload_options = {
            "folder": folder,
            "resource_type": "image",
            "overwrite": True,
        }
        if public_id:
            upload_options["public_id"] = str(public_id)

        result = cloudinary.uploader.upload(image_input, **upload_options)
        secure_url = result.get("secure_url") or result.get("url")
        if secure_url:
            print(f"[Cloudinary] Image uploaded successfully: {secure_url}")
        return secure_url

    except Exception as e:
        print(f"[Cloudinary] Upload failed: {str(e)}")
        return None
