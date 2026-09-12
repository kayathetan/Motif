# POST /api/brief/generate
# Embeds the request into a query, retrieves the top 6 similar patterns
# (preferring the request's niche/platform - see
# retrieval.query_similar_patterns for the progressive broadening logic),
# and calls brief_generator to produce a structured BriefResponse.

from fastapi import APIRouter

from src.models.schemas import BriefRequest, BriefResponse
from src.services.brief_generator import generate_brief as generate_brief_from_patterns
from src.services.retrieval import query_similar_patterns

router = APIRouter()


@router.post("/api/brief/generate", response_model=BriefResponse)
async def generate_brief(request: BriefRequest) -> BriefResponse:
    """
    Generate a production-ready content brief for the given niche, platform,
    goal, audience, and brand vibe.

    Args:
        request: BriefRequest payload.

    Returns:
        A structured BriefResponse.
    """
    query = (
        f"{request.niche} {request.platform} content optimised for "
        f"{request.goal}, targeting {request.audience}, with a "
        f"{request.brand_vibe} brand vibe."
    )
    patterns = query_similar_patterns(
        query, n_results=6, niche=request.niche, platform=request.platform
    )
    return generate_brief_from_patterns(patterns, request)
