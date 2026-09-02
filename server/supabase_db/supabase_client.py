from supabase import create_client, ClientOptions
from dotenv import load_dotenv
import os

# .env lives at the project root, two levels up from server/
load_dotenv(os.path.join(os.path.dirname(__file__), "../../", ".env"))

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

PHOTOS_BUCKET = "recycling-photos"

# Bypasses RLS. Never expose this key to the frontend.
service_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def user_scoped_client(access_token):
    """Client that carries the caller's own JWT, so sightings/Storage writes are enforced by RLS.

    The Authorization header must be set at construction time (not via client.postgrest.auth(),
    which only patches the postgrest sub-client) so that Storage requests are also sent as the
    caller's authenticated role rather than anon.
    """
    options = ClientOptions(headers={"Authorization": f"Bearer {access_token}"})
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY, options=options)


def get_user_profile_id(access_token):
    """Verifies the JWT and returns (recycling_app_user_profiles.id, auth_user_id), or (None, None) if invalid/anonymous."""
    if not access_token:
        return None, None

    try:
        auth_user = service_client.auth.get_user(access_token).user
    except Exception:
        return None, None

    if not auth_user:
        return None, None

    profile = (
        service_client.table("recycling_app_user_profiles")
        .select("id")
        .eq("auth_user_id", auth_user.id)
        .maybe_single()
        .execute()
    )
    # .maybe_single().execute() returns None outright (not an object with .data = None)
    # when zero rows match.
    profile_id = profile.data["id"] if profile and profile.data else None
    return profile_id, auth_user.id
