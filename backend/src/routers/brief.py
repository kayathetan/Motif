# POST /api/brief/generate
# Embeds the request into a query, retrieves the top 6 similar patterns,
# and calls brief_generator to produce a structured BriefResponse.

from fastapi import APIRouter

from src.models.schemas import BriefRequest, BriefResponse

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
    pass
