# Aggregates stored patterns for a niche/platform into a market intelligence
# report: code-computed statistics plus one LLM call for qualitative synthesis.
#
# Structured output convention: client.responses.parse(text_format=Model)
# (see brief_generator.py's header comment for the full convention and why
# hand-building the schema via .create() 400s).

import os
from collections import Counter
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel

from src.models.schemas import NicheIntelligenceResponse

# See the matching note in embeddings.py - load_dotenv() with no args
# doesn't reliably find backend/.env depending on the process's cwd.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

client = OpenAI()
AGGREGATOR_MODEL = os.getenv("AGGREGATOR_MODEL", "gpt-4o")

TOP_CTA_TYPES_LIMIT = 3
TOP_CONTENT_TYPES_LIMIT = 5

SYSTEM_PROMPT = """
You are a content strategy analyst summarising structural patterns across a
set of top-performing short-form videos in one niche and platform.

You will be given the combined list of "success_factors" gathered from
multiple high-performing videos. Identify:

- whats_winning: a concise 2-4 sentence summary of the structural
  approaches that are clearly working right now, based on factors that
  repeat across multiple videos.
- whats_saturated: a concise 2-4 sentence summary of approaches that
  appear to be losing effectiveness or feel overused/generic based on the
  evidence. If nothing in the evidence suggests saturation, say so
  honestly rather than inventing a trend.

Ground every claim in the supplied success_factors. Do not invent
statistics, examples, or trends that are not implied by the evidence.
"""


class _TrendSynthesis(BaseModel):
    whats_winning: str
    whats_saturated: str


def _synthesise_trends(success_factors: list[str]) -> _TrendSynthesis:
    """
    Single LLM call: given all success_factors pooled across retrieved
    patterns, synthesise whats_winning / whats_saturated summaries.
    """
    response = client.responses.parse(
        model=AGGREGATOR_MODEL,
        input=[
            {"role": "developer", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": "success_factors observed across the retrieved patterns:\n"
                + "\n".join(f"- {factor}" for factor in success_factors),
            },
        ],
        text_format=_TrendSynthesis,
    )
    if response.output_parsed is None:
        raise RuntimeError("Model returned no parseable trend synthesis.")
    return response.output_parsed


def aggregate_intelligence(patterns: list[dict]) -> NicheIntelligenceResponse:
    """
    Aggregate all patterns for a niche/platform into a NicheIntelligenceResponse.

    Computes format distribution, average hook delivery, most common emotional
    trigger, average views, CTA distribution, and structural benchmarks in code,
    then makes one LLM call to synthesise whats_winning and whats_saturated
    from the aggregated success_factors.

    Args:
        patterns: All pattern records (rows) for a given niche/platform, as
            returned by services.retrieval.get_patterns_by_niche_platform.

    Returns:
        A structured NicheIntelligenceResponse.
    """
    if not patterns:
        raise ValueError("aggregate_intelligence requires at least one pattern.")

    total = len(patterns)

    format_counts = Counter(p["visual_format"] for p in patterns)
    dominant_format, dominant_format_count = format_counts.most_common(1)[0]
    dominant_format_percent = round(dominant_format_count / total * 100, 1)

    avg_hook_delivery_seconds = round(
        sum(p["hook_delivery_seconds"] for p in patterns) / total, 2
    )

    trigger_counts = Counter(p["emotional_trigger"] for p in patterns)
    top_emotional_trigger = trigger_counts.most_common(1)[0][0]

    avg_views = round(sum(p["views"] for p in patterns) / total)

    cta_counts = Counter(p["cta_type"] for p in patterns)
    top_cta_types = [
        {"cta": cta, "percent": round(count / total * 100, 1)}
        for cta, count in cta_counts.most_common(TOP_CTA_TYPES_LIMIT)
    ]

    # content_type is orthogonal to niche (product_demo vs culture_relatable
    # etc.) - this is the axis retrieval.py's content_type tiers filter on,
    # and what a business would browse before asking for a specific type.
    content_type_counts = Counter(p["content_type"] for p in patterns)
    top_content_types = [
        {"content_type": ct, "percent": round(count / total * 100, 1)}
        for ct, count in content_type_counts.most_common(TOP_CONTENT_TYPES_LIMIT)
    ]

    # Postgres numeric columns (hook_delivery_seconds, payoff_seconds,
    # cta_placement_percent) come back from psycopg as Decimal, not float.
    # structural_benchmark is a plain dict (not a typed model), so nothing
    # coerces that for us the way NicheIntelligenceResponse's typed float
    # fields do - confirmed live: without float() here, these serialise as
    # JSON strings ("1.2") instead of numbers (1.2).
    # cta_placement_percent is None (not 0) when no CTA phrase was
    # detected for a pattern - see youtube_fetcher.py. Averaging None in
    # as 0 would silently claim "top performers front-load their CTA"
    # when the real story is "detection found nothing" for some of them -
    # exclude those instead of counting them as zero.
    known_cta_placements = [
        float(p["cta_placement_percent"])
        for p in patterns
        if p["cta_placement_percent"] is not None
    ]

    structural_benchmark = {
        "hook_under_seconds": round(
            float(max(p["hook_delivery_seconds"] for p in patterns)), 1
        ),
        "payoff_before_seconds": round(
            float(sum(p["payoff_seconds"] for p in patterns)) / total, 1
        ),
        "cta_after_percent": (
            round(sum(known_cta_placements) / len(known_cta_placements), 1)
            if known_cta_placements
            else None
        ),
        # How much evidence cta_after_percent actually rests on, reported
        # alongside it rather than left for the reader to assume. The
        # average excludes patterns with no detected CTA (above), so it can
        # legitimately be one video's value presented next to a CTA-type
        # breakdown showing most videos have no CTA at all - two true
        # numbers that read as contradictory without the sample size.
        "cta_measured_count": len(known_cta_placements),
        "cta_total_count": total,
    }

    all_success_factors = [
        factor for p in patterns for factor in p["success_factors"]
    ]
    trends = _synthesise_trends(all_success_factors)

    return NicheIntelligenceResponse(
        dominant_format=dominant_format,
        dominant_format_percent=dominant_format_percent,
        avg_hook_delivery_seconds=avg_hook_delivery_seconds,
        top_emotional_trigger=top_emotional_trigger,
        avg_views=avg_views,
        top_cta_types=top_cta_types,
        top_content_types=top_content_types,
        structural_benchmark=structural_benchmark,
        whats_winning=trends.whats_winning,
        whats_saturated=trends.whats_saturated,
    )
