# GET /api/intelligence/{niche}/{platform}
# Requires a verified Clerk session (see src.services.auth) and enforces a
# per-user rate limit (src.services.rate_limit) before doing any work -
# aggregate_intelligence() makes a paid GPT-4o call, and this route
# previously had neither. Fetches all stored patterns for the given
# niche/platform and returns an aggregated NicheIntelligenceResponse.

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from src.models.schemas import NicheIntelligenceResponse
from src.services.auth import authenticated_user
from src.services.intelligence_aggregator import aggregate_intelligence
from src.services.rate_limit import enforce_intelligence_rate_limit
from src.services.retrieval import get_patterns_by_niche_platform
from src.services.taxonomy import canonicalize_niche

router = APIRouter()


@router.get("/api/intelligence/{niche}/{platform}", response_model=NicheIntelligenceResponse)
async def get_niche_intelligence(
    niche: str,
    platform: str,
    user_id: Annotated[str, Depends(authenticated_user)],
) -> NicheIntelligenceResponse:
    """
    Return aggregated structural intelligence for a given niche and platform.

    Args:
        niche: Content niche, e.g. "fitness". Resolved to its canonical
            stored name by taxonomy.canonicalize_niche before lookup, so
            "skin care" still finds a stored "skincare" niche instead of
            404ing on the exact-string mismatch.
        platform: One of "tiktok", "reels", "youtube_shorts".
        user_id: Injected by Depends(authenticated_user) - this route
            401s before reaching here if the request has no valid Clerk
            session. Also used to key the per-user rate limit below.

    Returns:
        A structured NicheIntelligenceResponse.
    """
    enforce_intelligence_rate_limit(user_id)

    canonical_niche = canonicalize_niche(niche)
    if canonical_niche is None:
        raise HTTPException(
            status_code=404,
            detail=f"No patterns found for niche='{niche}', platform='{platform}'.",
        )
    patterns = get_patterns_by_niche_platform(canonical_niche, platform)
    if not patterns:
        raise HTTPException(
            status_code=404,
            detail=f"No patterns found for niche='{niche}', platform='{platform}'.",
        )
    return aggregate_intelligence(patterns)
