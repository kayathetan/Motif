# Aggregates stored patterns for a niche/platform into a market intelligence
# report: code-computed statistics plus one LLM call for qualitative synthesis.

from src.models.schemas import NicheIntelligenceResponse


def aggregate_intelligence(patterns: list[dict]) -> NicheIntelligenceResponse:
    """
    Aggregate all patterns for a niche/platform into a NicheIntelligenceResponse.

    Computes format distribution, average hook delivery, most common emotional
    trigger, average views, CTA distribution, and structural benchmarks in code,
    then makes one LLM call to synthesise whats_winning and whats_saturated
    from the aggregated success_factors.

    Args:
        patterns: All pattern records for a given niche/platform.

    Returns:
        A structured NicheIntelligenceResponse.
    """
    pass
