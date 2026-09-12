# GET /api/intelligence/{niche}/{platform}
# Fetches all stored patterns for the given niche/platform and returns
# an aggregated NicheIntelligenceResponse.

from fastapi import APIRouter, HTTPException

from src.models.schemas import NicheIntelligenceResponse
from src.services.intelligence_aggregator import aggregate_intelligence
from src.services.retrieval import get_patterns_by_niche_platform

router = APIRouter()


@router.get("/api/intelligence/{niche}/{platform}", response_model=NicheIntelligenceResponse)
async def get_niche_intelligence(niche: str, platform: str) -> NicheIntelligenceResponse:
    """
    Return aggregated structural intelligence for a given niche and platform.

    Args:
        niche: Content niche, e.g. "fitness".
        platform: One of "tiktok", "reels", "youtube_shorts".

    Returns:
        A structured NicheIntelligenceResponse.
    """
    patterns = get_patterns_by_niche_platform(niche, platform)
    if not patterns:
        raise HTTPException(
            status_code=404,
            detail=f"No patterns found for niche='{niche}', platform='{platform}'.",
        )
    return aggregate_intelligence(patterns)
