# POST /api/brief/generate
# Requires a verified Clerk session (see src.services.auth) and enforces a
# per-user rate limit (src.services.rate_limit) before doing any work -
# this route triggers a paid GPT-4o call, and previously had neither.
# Resolves the request's niche/content_type to their canonical stored
# names (see src.services.taxonomy), embeds the request into a query,
# retrieves the top 6 similar patterns (preferring the request's
# niche/platform - see retrieval.query_similar_patterns for the
# progressive broadening logic), and calls brief_generator to produce a
# structured brief.

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from src.models.schemas import BriefGenerationResponse, BriefRequest
from src.services.auth import authenticated_user
from src.services.brief_generator import (
    generate_brief as generate_brief_from_patterns,
)
from src.services.brief_generator import infer_content_type
from src.services.rate_limit import enforce_brief_rate_limit
from src.services.retrieval import query_similar_patterns
from src.services.taxonomy import canonicalize_content_type, canonicalize_niche

router = APIRouter()


@router.post("/api/brief/generate", response_model=BriefGenerationResponse)
async def generate_brief(
    request: BriefRequest,
    user_id: Annotated[str, Depends(authenticated_user)],
) -> BriefGenerationResponse:
    """
    Generate a production-ready content brief for the given niche, platform,
    goal, audience, and brand vibe.

    Args:
        request: BriefRequest payload.
        user_id: Injected by Depends(authenticated_user) - this route
            401s before reaching here if the request has no valid Clerk
            session. Also used to key the per-user rate limit below.

    Returns:
        A structured BriefGenerationResponse. niche_recognized is False
        when request.niche didn't confidently resolve to anything in the
        pattern library - the brief still generates (retrieval just
        broadens past niche, same as before), but the caller should
        surface that it's not niche-grounded rather than staying silent
        about it.
    """
    enforce_brief_rate_limit(user_id)

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
    # generate_brief_from_patterns() documents that it raises RuntimeError
    # on an OpenAI failure or an unparseable response. Left uncaught,
    # that became a bare 500 with no detail - api.js's error message to
    # the user was just "Internal Server Error" instead of anything
    # actionable, and a transient OpenAI failure looked identical to a
    # real bug to whoever saw it.
    try:
        brief = generate_brief_from_patterns(patterns, request)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Brief generation failed: {exc}",
        ) from exc
    return BriefGenerationResponse(**brief.model_dump(), niche_recognized=niche_recognized)
