# POST /api/brief/generate
# Resolves the request's niche/content_type to their canonical stored
# names (see src.services.taxonomy), embeds the request into a query,
# retrieves the top 6 similar patterns (preferring the request's
# niche/platform - see retrieval.query_similar_patterns for the
# progressive broadening logic), and calls brief_generator to produce a
# structured brief.

from fastapi import APIRouter

from src.models.schemas import BriefGenerationResponse, BriefRequest
from src.services.brief_generator import (
    generate_brief as generate_brief_from_patterns,
)
from src.services.brief_generator import infer_content_type
from src.services.retrieval import query_similar_patterns
from src.services.taxonomy import canonicalize_content_type, canonicalize_niche

router = APIRouter()


@router.post("/api/brief/generate", response_model=BriefGenerationResponse)
async def generate_brief(request: BriefRequest) -> BriefGenerationResponse:
    """
    Generate a production-ready content brief for the given niche, platform,
    goal, audience, and brand vibe.

    Args:
        request: BriefRequest payload.

    Returns:
        A structured BriefGenerationResponse. niche_recognized is False
        when request.niche didn't confidently resolve to anything in the
        pattern library - the brief still generates (retrieval just
        broadens past niche, same as before), but the caller should
        surface that it's not niche-grounded rather than staying silent
        about it.
    """
    # Resolve to the canonical stored name first (e.g. "skin care" ->
    # "skincare") so retrieval's niche filter isn't defeated by a
    # near-miss spelling - see taxonomy.canonicalize_niche. None means
    # nothing in the library confidently matches; retrieval already
    # handles a None niche by skipping straight to the open tiers.
    canonical_niche = canonicalize_niche(request.niche)
    niche_recognized = canonical_niche is not None

    query = (
        f"{request.niche} {request.platform} content optimised for "
        f"{request.goal}, targeting {request.audience}, with a "
        f"{request.brand_vibe} brand vibe."
    )
    if request.creative_vision:
        query += f" Creative vision: {request.creative_vision}"
    if request.topic:
        query += f" Topic: {request.topic}."

    # No dedicated UI control for this - inferred from creative_vision/topic
    # when not explicitly set. See infer_content_type()'s docstring.
    content_type = infer_content_type(request)
    if content_type:
        content_type = canonicalize_content_type(content_type)
        query += f" Content type: {content_type}."

    patterns = query_similar_patterns(
        query,
        n_results=6,
        niche=canonical_niche,
        platform=request.platform,
        content_type=content_type,
    )
    brief = generate_brief_from_patterns(patterns, request)
    return BriefGenerationResponse(**brief.model_dump(), niche_recognized=niche_recognized)
