from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
import uuid

from system_prompt import identification_prompt
from schemas import RecyclingIdentification, RECYCLING_IDENTIFICATION_SCHEMA
from supabase_db.supabase_client import service_client, user_scoped_client, PHOTOS_BUCKET

# .env lives at the project root, two levels up from server/supabase/
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))

gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))


def identify_submitted_image(image_bytes, mime_type):
    """Calls Gemini to identify the material of the object in the image. Raises on failure."""
    response = gemini_client.models.generate_content(
        model='gemini-2.5-flash',
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            'Identify the material of the item in this image.',
        ],
        config=types.GenerateContentConfig(
            system_instruction=identification_prompt,
            response_mime_type='application/json',
            response_schema=RECYCLING_IDENTIFICATION_SCHEMA,
        ),
    )

    # Validate the response against the Pydantic model, which will raise if the schema is invalid.
    return RecyclingIdentification.model_validate_json(response.text)


def get_material_info(material_type):
    """Looks up recycling guidance for a material_type from the general info table.

    Returns None if material_type is falsy or has no matching row (ideally should not happen for
    values Gemini returns, since its response is restricted to seeded material_types).
    """
    if not material_type:
        return None

    row = (
        service_client.table("recycling_app_material_info")
        .select("*")
        .eq("material_type", material_type)
        .maybe_single()
        .execute()
    )
    return row.data if row else None


def save_submission(user_profile_id, auth_user_id, access_token, identification_result, image_bytes):
    """Uploads the image to the caller's own Storage folder and inserts a submitted_items row.

    Both operations use the caller's own JWT, so Storage/RLS policies enforce ownership
    even if this function were ever called incorrectly. The Storage path must be keyed by
    auth_user_id (not user_profiles.id) since that's what the RLS policy checks via auth.uid().
    """
    client = user_scoped_client(access_token)
    path = f"{auth_user_id}/{uuid.uuid4()}.jpg"

    client.storage.from_(PHOTOS_BUCKET).upload(
        path, image_bytes, {"content-type": "image/jpeg"}
    )
    image_url = client.storage.from_(PHOTOS_BUCKET).get_public_url(path)

    inserted = (
        client.table("recycling_app_submitted_items")
        .insert({
            "user_id": user_profile_id,
            "image_url": image_url,
            "material_type": identification_result.material_type,
            "item_description": identification_result.item_description,
            "confidence": identification_result.confidence,
        })
        .execute()
    )
    return inserted.data[0]["id"]
