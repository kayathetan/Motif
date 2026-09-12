# Synthesises a structured, production-ready content brief from retrieved
# structural patterns using GPT-4o structured JSON output.
#
# Structured output convention (applies to every GPT-4o call in this
# project): use OpenAI Structured Outputs via .parse(), passing the
# Pydantic response model directly, e.g.
#
#   from openai import OpenAI
#   client = OpenAI()
#   completion = client.beta.chat.completions.parse(
#       model="gpt-4o",
#       messages=[...],
#       response_format=BriefResponse,
#   )
#   brief: BriefResponse = completion.choices[0].message.parsed
#
# This guarantees the output matches BriefResponse exactly - no manual
# JSON-schema writing or hand-rolled validation needed. Requires
# openai>=1.40.0 (see requirements.txt).
#
# For local development/testing without live Supabase retrieval, use the
# fixtures in sample_patterns.py:
#   from src.services.sample_patterns import SAMPLE_PATTERNS

from src.models.schemas import BriefRequest, BriefResponse


def generate_brief(patterns: list[dict], request: BriefRequest) -> BriefResponse:
    """
    Call GPT-4o to synthesise a BriefResponse by reasoning over retrieved
    structural patterns from top performers, applying them to the user's
    goal, audience, and brand vibe.

    Args:
        patterns: Top-N retrieved pattern records (see Pattern schema shape),
            fetched by services/retrieval.py from Supabase/pgvector.
        request: The user's brief request parameters.

    Returns:
        A structured BriefResponse.
    """
    pass
