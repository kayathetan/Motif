# Pydantic request/response models shared across routers and services.

from pydantic import BaseModel
from typing import Literal


class BriefRequest(BaseModel):
    niche: str
    platform: Literal["tiktok", "reels", "youtube_shorts"]
    goal: Literal["reach", "engagement", "shares", "conversions"]
    audience: str
    brand_vibe: Literal["fun", "educational", "aspirational", "raw"]


class BriefResponse(BaseModel):
    hook_options: list[str]  # 3 specific opening lines
    format: str
    script_outline: list[dict]  # [{timestamp: "0-3s", action: "..."}]
    visual_style: str
    pacing: str
    audio_direction: str
    cta: str
    hashtags: list[str]


class Pattern(BaseModel):
    niche: str
    platform: Literal["tiktok", "reels", "youtube_shorts"]
    hook_style: str
    hook_text: str
    hook_delivery_seconds: float
    visual_format: str
    scene_change_frequency: str
    on_screen_text: bool
    camera_style: str
    reveal_order: str
    cta_placement_percent: float
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
    structural_benchmark: dict  # {hook_under_seconds: 2, payoff_before_seconds: 15, cta_after_percent: 80}
    whats_winning: str  # LLM-generated summary
    whats_saturated: str  # LLM-generated summary
