# GET /api/intelligence/{niche}/{platform}
# Fetches all stored patterns for the given niche/platform and returns an
# aggregated NicheIntelligenceResponse.
#
# Open to anonymous callers on purpose, unlike POST /api/brief/generate.
# This route is a read of already-stored data, and the one paid GPT-4o
# call inside aggregate_intelligence() is cached per niche/platform (see
# _CACHE below), so serving the /demo link real market data costs at most
# one call per niche per TTL window rather than one per visitor. Brief
# generation stays behind authenticated_user because nothing there is
# cacheable - every brief is a distinct prompt.
#
# Defence ordering is deliberate: the cache bounds spend, the rate limit
# is only a courtesy throttle. An anonymous caller is keyed by client IP,
# which is both shared (NAT) and forgeable (X-Forwarded-For), so it could
# not bound cost on its own.

import os
import time
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request

from src.models.schemas import NicheIntelligenceResponse
from src.services.auth import optional_user
from src.services.intelligence_aggregator import aggregate_intelligence
from src.services.rate_limit import (
    enforce_demo_intelligence_rate_limit,
    enforce_intelligence_rate_limit,
)
from src.services.retrieval import get_patterns_by_niche_platform
from src.services.taxonomy import canonicalize_niche

router = APIRouter()

# Stored patterns only change when pipeline/build_library.py runs, which is
# an offline batch job - so a response is safe to reuse for a while. A TTL
# rather than explicit invalidation because the pipeline is a separate
# process with no channel to this one; the window is the staleness we
# accept in exchange for not paying per request.
_CACHE_TTL_SECONDS = int(os.getenv("INTELLIGENCE_CACHE_TTL_SECONDS", "900"))

# (canonical_niche, platform) -> (stored_at_monotonic, response)
_CACHE: dict[tuple[str, str], tuple[float, NicheIntelligenceResponse]] = {}


def _client_key(request: Request) -> str:
    """
    Best-effort identifier for an anonymous caller.

    Behind Railway's edge (and Vercel's /api rewrite) request.client.host
    is a proxy, not the visitor - so the leftmost X-Forwarded-For entry is
    used when present. That header is client-supplied and trivially
    forged; see this module's header for why that is tolerable here.
    """
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.get("/api/intelligence/{niche}/{platform}", response_model=NicheIntelligenceResponse)
async def get_niche_intelligence(
    niche: str,
    platform: str,
    request: Request,
    user_id: Annotated[str | None, Depends(optional_user)],
) -> NicheIntelligenceResponse:
    """
    Return aggregated structural intelligence for a given niche and platform.

    Args:
        niche: Content niche, e.g. "fitness". Resolved to its canonical
            stored name by taxonomy.canonicalize_niche before lookup, so
            "skin care" still finds a stored "skincare" niche instead of
            404ing on the exact-string mismatch.
        platform: One of "tiktok", "reels", "youtube_shorts".
        request: Used only to derive a rate-limit key for anonymous callers.
        user_id: Clerk user id, or None for an anonymous caller. This route
            serves both - see the module header.

    Returns:
        A structured NicheIntelligenceResponse.
    """
    # Rate limit before any work, and on the strongest key available: a
    # verified Clerk id where there is one, falling back to client IP.
    if user_id is not None:
        enforce_intelligence_rate_limit(user_id)
    else:
        enforce_demo_intelligence_rate_limit(_client_key(request))

    canonical_niche = canonicalize_niche(niche)
    if canonical_niche is None:
        raise HTTPException(
            status_code=404,
            detail=f"No patterns found for niche='{niche}', platform='{platform}'.",
        )

    # Checked after canonicalisation so the key is the resolved niche -
    # "skincare" and "skin care" must not occupy separate cache entries.
    cache_key = (canonical_niche, platform)
    cached = _CACHE.get(cache_key)
    if cached is not None and time.monotonic() - cached[0] < _CACHE_TTL_SECONDS:
        return cached[1]

    patterns = get_patterns_by_niche_platform(canonical_niche, platform)
    if not patterns:
        # Not cached: a niche with no patterns today may have them after
        # the next pipeline run, and caching a 404 would outlast that.
        raise HTTPException(
            status_code=404,
            detail=f"No patterns found for niche='{niche}', platform='{platform}'.",
        )

    response = aggregate_intelligence(patterns)
    _CACHE[cache_key] = (time.monotonic(), response)
    return response
