# Pydantic request/response models shared across routers and services.

from datetime import datetime

from pydantic import BaseModel, Field, field_validator
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
    """
    One beat of the shot-by-shot script outline. Deliberately shot-list
    specific (format/camera/lighting/on-screen text/audio per beat, not
    just "what happens") - a beat that only says what happens and leaves
    the how to the reader isn't something a team or creator can shoot
    from without a separate planning pass, which defeats the point of a
    production-ready brief. Field descriptions double as the instruction
    to the model (OpenAI structured outputs sends these to the model as
    part of the schema) - see brief_generator.py's header on this pattern.

    Every field added here after timestamp/action shipped is `| None`
    even though brief_generator.py always fills them in for a NEW
    generation: saved_briefs.py stores each generated brief as a JSONB
    blob (see migrations/0008) and reloads it straight into this same
    model on GET /api/briefs/{id} - a brief saved before this field
    existed has no key for it at all, and a required field would turn
    every pre-existing saved brief into a 500 the moment someone clicks
    back into it. BriefContent.jsx already renders a missing value as a
    blank line rather than erroring, so this degrades instead of breaking.
    """

    timestamp: str = Field(description='Time range for this beat, e.g. "0-2s".')
    duration_seconds: float | None = Field(
        default=None, description="This beat's length in seconds, e.g. 2."
    )
    heading: str | None = Field(
        default=None,
        description='Short scene label a producer would use to refer to this beat in conversation, '
        '2-4 words, e.g. "Result first", "Setup and tension" - not a restatement of the action.',
    )
    action: str = Field(
        description="What happens in this beat and, briefly, why this choice follows from the retrieved "
        "evidence - one to two sentences, specific enough to shoot from directly."
    )
    shot_style: str | None = Field(
        default=None,
        description='The overall format of this beat, e.g. "Talking head, no voiceover yet" or '
        '"Product macro, no face in frame".',
    )
    camera: str | None = Field(
        default=None,
        description='Framing and camera movement, e.g. "Close-up, handheld, slight push in" or '
        '"Medium, static on tripod".',
    )
    lighting: str | None = Field(
        default=None,
        description='The lighting setup for this beat, e.g. "Soft window key, front-left 45°", or '
        '"Unchanged - hold continuity" when it should match the previous beat.',
    )
    on_screen_caption: str | None = Field(
        default=None,
        description="The exact on-screen text overlay for this beat, verbatim, e.g. \"3 weeks\". "
        "Null if this beat has no on-screen text.",
    )
    on_screen_text_style: str | None = Field(
        default=None,
        description='How the caption is styled and placed, e.g. "lowercase, bottom third". '
        'If on_screen_caption is null, explain why, e.g. "None - let the voice carry."',
    )
    audio: str | None = Field(
        default=None,
        description='Audio direction for this beat, e.g. "Trending audio cold, full volume" or '
        '"Voice in, music ducks under".',
    )


class HookOption(BaseModel):
    """
    One of the three hook choices. A bare opening line leaves the reader
    to guess which of the three to pick and how to actually perform it -
    style/why_it_works/delivery_note answer exactly that, per user
    feedback that the plain-string version read as too empty.
    """

    text: str = Field(description="The hook line itself - what's said or shown in the opening 1-3 seconds.")
    style: str = Field(
        description='Short style tag for this hook, e.g. "Bold claim", "Pattern interrupt", "Question hook", '
        '"Result first" - reuse a hook_style already visible in the retrieved patterns where one genuinely fits, '
        "rather than inventing a near-duplicate label."
    )
    why_it_works: str = Field(
        description="One line tying this hook back to the retrieved evidence - which pattern(s) it draws on "
        "and why that structure suits this niche/goal. Do not cite a statistic that isn't in the supplied evidence."
    )
    delivery_note: str = Field(
        description="How to perform it - pacing, tone, where the emphasis lands, e.g. \"Deadpan, straight to "
        'camera, no pause before the payoff word."'
    )


class BriefResponse(BaseModel):
    hook_options: list[HookOption] = Field(min_length=3, max_length=3)  # 3 specific opening lines
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

    @field_validator("hook_options", mode="before")
    @classmethod
    def _coerce_legacy_hook_options(cls, value):
        """
        hook_options used to be list[str] before this field existed - see
        the same backward-compatibility concern documented on ScriptBeat.
        A brief saved under the old shape has plain strings in its stored
        JSONB (migrations/0008); without this, GET /api/briefs/{id} would
        500 the moment someone clicked back into one of those. Wrap a bare
        string into a HookOption with the new fields left blank rather
        than fabricating a style/rationale for a hook that never had one.
        """
        if not isinstance(value, list):
            return value
        return [
            {"text": item, "style": "", "why_it_works": "", "delivery_note": ""}
            if isinstance(item, str)
            else item
            for item in value
        ]


class ReferenceVideo(BaseModel):
    """
    One real video from the pattern library that this brief's evidence
    actually drew on - code-appended from the retrieved pattern rows in
    routers/brief.py, not asked of the LLM. A clickable, checkable URL is
    the one thing a plain LLM wrapper (no pattern library to retrieve
    from) structurally cannot produce.
    """

    video_url: str
    title: str
    views: int
    content_type: str


class EvidenceSummary(BaseModel):
    """
    A pure-code summary of the patterns actually retrieved for this
    brief (see services.intelligence_aggregator.summarize_evidence) plus
    a plain-language disclosure of how targeted the match was (see
    retrieval.TIER_LABELS). No LLM call and no LLM-authored numbers here -
    the whole point is that this is checkable against the reference
    videos below it, not another confident-sounding claim from the same
    model that wrote the creative copy.
    """

    pattern_count: int
    tier_label: str
    dominant_format: str | None = None
    dominant_format_percent: float | None = None
    avg_hook_delivery_seconds: float | None = None
    top_cta: str | None = None
    top_cta_percent: float | None = None
    reference_videos: list[ReferenceVideo] = Field(default_factory=list)


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
    # None (not required) for the same backward-compatibility reason as
    # ScriptBeat/HookOption's newer fields: a brief saved before this
    # field existed has no key for it in its stored JSONB, and this
    # shouldn't 500 GET /api/briefs/{id} for those.
    evidence: EvidenceSummary | None = None


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
