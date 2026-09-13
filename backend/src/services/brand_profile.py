# Persists a signed-in user's brand/organization profile (backend/sql/
# migrations/0007_add_brand_profiles.sql), keyed by Clerk user id - the
# same id src.services.auth.authenticated_user() resolves a verified
# session down to. Collected once during onboarding
# (frontend/src/pages/Onboarding.jsx) and folded into every subsequent
# brief as extra context - see routers/brief.py - rather than a business
# re-typing who they are on every single request.

from src.models.schemas import BrandProfile
from src.services.retrieval import get_connection


def save_brand_profile(user_id: str, profile: BrandProfile) -> None:
    """
    Upsert the given user's brand profile.

    Args:
        user_id: Clerk user id (from authenticated_user()).
        profile: The organization name/description to store.
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                insert into brand_profiles (user_id, organization_name, description, updated_at)
                values (%s, %s, %s, now())
                on conflict (user_id) do update set
                    organization_name = excluded.organization_name,
                    description = excluded.description,
                    updated_at = now()
                """,
                (user_id, profile.organization_name, profile.description),
            )
        conn.commit()


def get_brand_profile(user_id: str) -> BrandProfile | None:
    """
    Fetch the given user's saved brand profile.

    Returns:
        The stored BrandProfile, or None if this user hasn't completed
        onboarding yet - a real, expected state (e.g. they skipped it),
        not an error.
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "select organization_name, description from brand_profiles where user_id = %s",
                (user_id,),
            )
            row = cur.fetchone()
    return BrandProfile(**row) if row else None
