# GET/PUT /api/profile
# Requires a verified Clerk session (see src.services.auth). No rate limit
# here unlike brief.py/intelligence.py - this never calls OpenAI, it's a
# plain read/write against brand_profiles.

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from src.models.schemas import BrandProfile
from src.services.auth import authenticated_user
from src.services.brand_profile import get_brand_profile, save_brand_profile

router = APIRouter()


@router.get("/api/profile", response_model=BrandProfile)
async def get_profile(user_id: Annotated[str, Depends(authenticated_user)]) -> BrandProfile:
    """
    Return the signed-in user's saved brand profile.

    Raises:
        HTTPException(404): This user hasn't completed onboarding yet -
            same "expected, not an error" treatment as intelligence.py's
            404 for a niche with no patterns yet.
    """
    profile = get_brand_profile(user_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="No brand profile saved yet.")
    return profile


@router.put("/api/profile", response_model=BrandProfile)
async def put_profile(
    profile: BrandProfile,
    user_id: Annotated[str, Depends(authenticated_user)],
) -> BrandProfile:
    """Create or update the signed-in user's brand profile."""
    save_brand_profile(user_id, profile)
    return profile
