# Pydantic request/response models shared across routers and services.

from datetime import datetime

from pydantic import BaseModel, Field
from typing import Literal


class BriefRequest(BaseModel):
    niche: str
    platform: Literal["tiktok", "reels", "youtube_shorts"]
    goal: Literal["reach", "engagement", "shares", "conversions"]
    audience: str
    brand_vibe: Literal["fun", "educational", "aspirational", "raw"]
    # Optional: what KIND of video (product_demo, culture_relatable,
    # testimonial_ugc, etc.) - orthogonal to niche. When set, retrieval
    # prioritizes dropping niche before content_type in its fallback
    # order, not the other way around: a business wanting a "culture"
    # video can draw on culture-content patterns from other industries,
    # since content type is what determines structural comparability
    # here, not the product/topic. See retrieval.query_similar_patterns.
    content_type: str | None = None
    # These already exist in the frontend's campaign-inputs flow (Vision.jsx
    # collects all of them) but previously never reached the backend at
    # all - api.js's toBriefRequest() only forwarded niche/platform/goal/
    # audience/brand_vibe. Optional here so existing callers don't break.
    creative_vision: str | None = None  # free-text creative direction
    topic: str | None = None  # one-line subject, e.g. "our new serum launch"
    resources: list[str] | None = None  # e.g. ["Phone only", "Tripod"]
    duration: str | None = None  # target length, e.g. "0:45"
    constraints: str | None = None  # brand guidelines, legal, etc.
    # Populated server-side in routers/brief.py from the account's saved
    # brand_profiles row (see services/brand_profile.py), not sent by the
    # frontend - there's no client input for either field. Plain
    # attributes here (not Field(exclude=...)) since generate_brief()
    # dumps the whole request straight into the LLM prompt payload
    # (brief_generator.py's user_request) and this context belongs there.
    organization_name: str | None = None
    brand_description: str | None = None


class BrandProfile(BaseModel):
    """
    A signed-in user's brand/organization context, collected once during
    onboarding (frontend/src/pages/Onboarding.jsx) rather than re-entered
    on every brief. See services/brand_profile.py and routers/profile.py.
    """

    organization_name: str
    description: str | None = None


class ScriptBeat(BaseModel):
    timestamp: str  # e.g. "0-3s"
    action: str


class BriefResponse(BaseModel):
    hook_options: list[str] = Field(min_length=3, max_length=3)  # 3 specific opening lines
    # Named content_format, not format: a field literally named "format"
    # is unreliable under OpenAI's structured outputs - confirmed by direct
    # testing to return garbage (e.g. the schema's own class name) in most
    # generations, purely because of the field name. See brief_generator.py.
    content_format: str
    script_outline: list[ScriptBeat]
    visual_style: str
    pacing: str
    audio_direction: str
    cta: str
    hashtags: list[str]


class BriefGenerationResponse(BriefResponse):
    """
    The actual /api/brief/generate response shape: BriefResponse plus
    niche_recognized, added by the router after generation - not part of
    BriefResponse itself, since BriefResponse doubles as the OpenAI
    structured-output schema in brief_generator.py (text_format=
    BriefResponse). Adding niche_recognized there would make the LLM
    itself responsible for producing a value for a field it has no way to
    judge, and OpenAI's strict structured-output mode requires every
    schema property to be filled in regardless of a Python-side default
    (see brief_generator.py's header for the strict-mode gotchas already
    hit here) - wasted model attention on a field the router immediately
    overwrites anyway.

    niche_recognized is False when the request's niche didn't confidently
    resolve to anything in the pattern library (see
    src.services.taxonomy.canonicalize_niche). The brief still generates -
    retrieval broadens past niche automatically either way - but the
    frontend should say so rather than implying it's niche-grounded when
    it isn't.
    """

    niche_recognized: bool = True


class SavedBriefSummary(BaseModel):
    """
    List-view shape for GET /api/briefs - enough to render a clickable
    row on the dashboard's brief history without pulling every saved
    brief's full generated content just to list them. See
    services/saved_briefs.py and backend/sql/migrations/0008.
    """

    id: int
    niche: str
    platform: Literal["tiktok", "reels", "youtube_shorts"]
    goal: Literal["reach", "engagement", "shares", "conversions"]
    audience: str
    topic: str | None = None
    created_at: datetime


class SavedBrief(SavedBriefSummary):
    """Full shape for GET /api/briefs/{id} - the list fields plus the
    actual generated brief content."""

    brief: BriefGenerationResponse


class Pattern(BaseModel):
    niche: str
    platform: Literal["tiktok", "reels", "youtube_shorts"]
    # What KIND of video this is (e.g. "product_demo", "routine_tutorial",
    # "reaction_commentary", "culture_relatable", "haul_roundup",
    # "educational_explainer", "testimonial_ugc",
    # "before_after_transformation") - orthogonal to niche/topic. A
    # product demo and a culture piece from the same niche don't share
    # structural DNA; a culture piece from two different niches plausibly
    # does. See BriefRequest.content_type and retrieval.py.
    content_type: str
    hook_style: str
    hook_text: str
    hook_delivery_seconds: float
    visual_format: str
    scene_change_frequency: str
    on_screen_text: bool
    camera_style: str
    reveal_order: str
    payoff_seconds: float
    cta_type: str
    # None, not a number, when no verbal/on-screen CTA phrase was detected
    # in the transcript - see youtube_fetcher.compute_structural_signals.
    # A silently-defaulted 0.0 previously corrupted structural_benchmark's
    # cta_after_percent average (confirmed live).
    cta_placement_percent: float | None
    pacing: str
    emotional_trigger: str
    success_factors: list[str]


class NicheIntelligenceResponse(BaseModel):
    dominant_format: str
    dominant_format_percent: float
    avg_hook_delivery_seconds: float
    top_emotional_trigger: str
    avg_views: int
    top_cta_types: list[dict]  # [{cta: "follow", percent: 58}]
    top_content_types: list[dict]  # [{content_type: "product_demo", percent: 58}]
    structural_benchmark: dict  # {hook_under_seconds: 2, payoff_before_seconds: 15, cta_after_percent: 80}
    whats_winning: str  # LLM-generated summary
    whats_saturated: str  # LLM-generated summary
