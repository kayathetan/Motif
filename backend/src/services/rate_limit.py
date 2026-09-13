# Minimal per-user request rate limiting for the two paid
# (GPT-4o-calling) routes - POST /api/brief/generate and
# GET /api/intelligence/... - closing the "no rate limiting" half of the
# open-ended-OpenAI-bill risk (auth.py closes the "no auth at all" half).
# Without both, a single authenticated user could still loop-call either
# route indefinitely.
#
# In-memory, fixed-window counter keyed by Clerk user id (from
# auth.authenticated_user) - deliberately simple rather than a
# token-bucket/sliding-window scheme, since the goal is capping worst-case
# spend per user, not precise traffic shaping.
#
# Known limitation, called out rather than hidden: this state lives in
# one process's memory, so it's only correct for a single uvicorn worker -
# which is what this project actually runs today (see main.py/README).
# Running multiple worker processes or instances would let each one
# enforce its own separate count (e.g. 4 workers effectively quadruples
# the real cap), which needs a shared store (Redis, or a Postgres table
# alongside the existing Supabase connection) instead of this dict. Not
# built now because nothing here runs more than one worker yet -
# documenting it so it isn't silently wrong if that changes later.

import os
import time
from collections import defaultdict

from fastapi import HTTPException, status

_WINDOW_SECONDS = 3600


class _FixedWindowLimiter:
    def __init__(self, limit_per_hour: int):
        self._limit = limit_per_hour
        # user_id -> (window_start, count_in_window), window_start in
        # time.monotonic() seconds so this is immune to wall-clock jumps.
        self._counts: dict[str, tuple[float, int]] = defaultdict(lambda: (0.0, 0))

    def check(self, user_id: str) -> None:
        """
        Record one request for `user_id` and raise HTTPException(429) if
        that exceeds the limit for the current hour-long window.
        """
        now = time.monotonic()
        window_start, count = self._counts[user_id]
        if now - window_start >= _WINDOW_SECONDS:
            window_start, count = now, 0
        if count >= self._limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded ({self._limit}/hour). Try again later.",
            )
        self._counts[user_id] = (window_start, count + 1)


_brief_limiter = _FixedWindowLimiter(int(os.getenv("BRIEF_RATE_LIMIT_PER_HOUR", "20")))
_intelligence_limiter = _FixedWindowLimiter(
    int(os.getenv("INTELLIGENCE_RATE_LIMIT_PER_HOUR", "60"))
)
# Anonymous (demo-link) callers of GET /api/intelligence/..., keyed by
# client IP rather than Clerk user id. Tighter than the signed-in cap
# because the key is weaker: an IP is shared by everyone behind a NAT and
# is spoofable via X-Forwarded-For, so this is a courtesy throttle, not a
# spend control. What actually bounds spend on that route is its response
# cache - see routers/intelligence.py. Ordering matters: if this were the
# only protection, forging the header would defeat it entirely.
_demo_intelligence_limiter = _FixedWindowLimiter(
    int(os.getenv("DEMO_INTELLIGENCE_RATE_LIMIT_PER_HOUR", "30"))
)


def enforce_brief_rate_limit(user_id: str) -> None:
    """Raise HTTPException(429) if `user_id` has exceeded the brief-generation rate limit."""
    _brief_limiter.check(user_id)


def enforce_intelligence_rate_limit(user_id: str) -> None:
    """Raise HTTPException(429) if `user_id` has exceeded the intelligence rate limit."""
    _intelligence_limiter.check(user_id)


def enforce_demo_intelligence_rate_limit(client_key: str) -> None:
    """
    Raise HTTPException(429) if an anonymous caller has exceeded the demo
    intelligence rate limit.

    Args:
        client_key: An identifier for the anonymous caller, normally a
            client IP. Not trustworthy (see the limiter's own comment) -
            do not rely on this alone to bound cost.
    """
    _demo_intelligence_limiter.check(client_key)
