from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from PIL import Image, UnidentifiedImageError
import base64
import io
import os

from supabase_db.supabase_client import get_user_profile_id
from supabase_db.identify_service import identify_submitted_image, get_material_info, save_submission

# .env lives at the project root, one level up from server/
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB, post client-side resize/compression

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
app = Flask(__name__)

CORS(app, origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:5173"])


def bearer_token():
    """Extracts the bearer token from the Authorization header of the request."""

    auth_header = request.headers.get("Authorization", "")

    if auth_header.startswith("Bearer "):
        return auth_header[len("Bearer "):]
    
    return None


@app.route('/api/health', methods=['GET'])
def test():
    return jsonify({'message': 'App is running'}), 200


@app.route('/api/identify', methods=['POST'])
def identify_item():
    """Identifies an item's material type, then joins to general recycling guidance.
    Submissions are only saved for authenticated callers; anon requests just return the result.
    """

    data = request.get_json(silent=True)

    if not data or 'image' not in data or 'mimeType' not in data:
        return jsonify({'error': 'Missing image or mimeType'}), 400

    # Validate base64 image data
    try:
        image_bytes = base64.b64decode(data['image'])

    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid base64 image data'}), 400

    # Validate image size (about 5 MB max)
    if len(image_bytes) > MAX_IMAGE_BYTES:
        return jsonify({'error': f'Image exceeds max size of {MAX_IMAGE_BYTES} bytes'}), 400

    # Validate that the image is a valid image file
    try:
        Image.open(io.BytesIO(image_bytes)).verify()
    except UnidentifiedImageError:
        return jsonify({'error': 'File is not a valid image'}), 400

    # Call Gemini API to identify the material of the item in the image
    try:
        identification_result = identify_submitted_image(image_bytes, data['mimeType'])

    except Exception as e:
        print(f'Gemini identify error: {e}')
        return jsonify({'error': 'Identification failed'}), 500

    result = identification_result.model_dump()

    # No identifiable item found in photo or it doesn't contain a recyclable item; 
    # return the result without recycling guidance
    if not identification_result.contains_recyclable_item:
        return jsonify(result), 200

    # Join to the general recycling info table for guidance on this material type
    try:
        material_info = get_material_info(identification_result.material_type)

    except Exception as e:
        print(f'Material info lookup error: {e}')
        return jsonify({'error': 'Material info lookup failed'}), 500

    if material_info:
        result.update({
            'category': material_info['category'],
            'display_name': material_info['display_name'],
            'is_recyclable': material_info['is_generally_recyclable'],
            'instructions': material_info['instructions'],
            'source_url': material_info['source_url'],
        })

    result['saved'] = False

    # Only authenticated users get a personal submission saved
    access_token = bearer_token()
    user_profile_id, auth_user_id = get_user_profile_id(access_token)

    # If the user is authenticated, save the submission to the database.
    # If saving fails, log the error but still return the identification result.
    if user_profile_id:
        try:
            submission_id = save_submission(
                user_profile_id, auth_user_id, access_token, identification_result, image_bytes
            )
            result['saved'] = True
            result['submission_id'] = submission_id

        except Exception as e:
            # Identification still succeeded; only the save failed.
            print(f'Submission save error: {e}')

    return jsonify(result), 200


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)