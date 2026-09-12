# POST /api/brief/generate
# Embeds the request into a query, retrieves the top 6 similar patterns,
# and calls brief_generator to produce a structured BriefResponse.
#
# TODO: brief_generator.generate_brief() is still a stub here - the real
# implementation lives on the teammate's brief-generaotr branch, pending a
# fix (model name) + rebase onto main + merge. Until then this endpoint
# returns a hardcoded MOCK_BRIEF_RESPONSE so the frontend can integrate
# against the real contract today. The embed + retrieve step below is real.
# Once generate_brief() lands, swap the final `return MOCK_BRIEF_RESPONSE`
# for `return generate_brief(patterns, request)`.

from fastapi import APIRouter

from src.models.schemas import BriefRequest, BriefResponse
from src.services.retrieval import query_similar_patterns

router = APIRouter()

MOCK_BRIEF_RESPONSE = BriefResponse(
    hook_options=[
        "Stop doing crunches. Do this instead.",
        "This is the only ab exercise you actually need.",
        "30 days of this and my energy completely changed.",
    ],
    content_format="talking head + b-roll cutaways",
    script_outline=[
        {"timestamp": "0-3s", "action": "Deliver the hook direct to camera, bold on-screen text reinforcing it."},
        {"timestamp": "3-10s", "action": "Demonstrate the technique/claim with quick cutaways."},
        {"timestamp": "10-15s", "action": "Deliver the payoff/result."},
        {"timestamp": "15-18s", "action": "CTA: follow for more."},
    ],
    visual_style="handheld, high-contrast lighting, fast cuts every 2-3s",
    pacing="fast",
    audio_direction="trending upbeat track, voiceover ducked under it",
    cta="Follow for more tips like this",
    hashtags=["#fitness", "#fitnesstips", "#tiktokfitness"],
)


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
    # Real embed + retrieve against Supabase. Result is discarded below
    # until generate_brief() is wired in, so this endpoint still exercises
    # the real retrieval path rather than being a pure stub.
    query_similar_patterns(query, n_results=6)

    return MOCK_BRIEF_RESPONSE
