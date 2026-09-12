# GET /api/intelligence/{niche}/{platform}
# Fetches all stored patterns for the given niche/platform and returns
# an aggregated NicheIntelligenceResponse.

from fastapi import APIRouter

from src.models.schemas import NicheIntelligenceResponse

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
    pass
