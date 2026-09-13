# Persists and retrieves generated briefs (backend/sql/migrations/
# 0008_add_saved_briefs.sql), so a signed-in user can see their brief
# history on the dashboard and click back into one - see routers/brief.py
# (the write, on every successful generation) and routers/briefs.py (the
# list/fetch reads).

import json

from src.models.schemas import (
    BriefGenerationResponse,
    BriefRequest,
    SavedBrief,
    SavedBriefSummary,
)
from src.services.retrieval import get_connection


def save_generated_brief(
    user_id: str, request: BriefRequest, brief: BriefGenerationResponse
) -> int:
    """
    Insert a newly generated brief into the signed-in user's history.

    Args:
        user_id: Clerk user id (from authenticated_user()).
        request: The BriefRequest that produced this brief - only the
            fields worth a dashboard list item are pulled out as columns
            (see migrations/0008's header); the rest isn't stored.
        brief: The generated BriefGenerationResponse, stored whole.

    Returns:
        The new row's id.
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                insert into saved_briefs (user_id, niche, platform, goal, audience, topic, brief)
                values (%s, %s, %s, %s, %s, %s, %s::jsonb)
                returning id
                """,
                (
                    user_id,
                    request.niche,
                    request.platform,
                    request.goal,
                    request.audience,
                    request.topic,
                    json.dumps(brief.model_dump(mode="json")),
                ),
            )
            new_id = cur.fetchone()["id"]
        conn.commit()
    return new_id


def list_saved_briefs(user_id: str) -> list[SavedBriefSummary]:
    """Every brief saved for this user, most recent first."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select id, niche, platform, goal, audience, topic, created_at
                from saved_briefs
                where user_id = %s
                order by created_at desc
                """,
                (user_id,),
            )
            rows = cur.fetchall()
    return [SavedBriefSummary(**row) for row in rows]


def get_saved_brief(user_id: str, brief_id: int) -> SavedBrief | None:
    """
    Fetch one saved brief in full.

    Filters on user_id as well as id (not id alone) - a signed-in user
    must only ever be able to fetch their own saved briefs, not anyone
    else's by guessing/incrementing an id.

    Returns:
        The SavedBrief, or None if it doesn't exist or belongs to a
        different user - the caller (routers/briefs.py) treats both the
        same way, a 404, rather than leaking which case it was.
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select id, niche, platform, goal, audience, topic, created_at, brief
                from saved_briefs
                where user_id = %s and id = %s
                """,
                (user_id, brief_id),
            )
            row = cur.fetchone()
    return SavedBrief(**row) if row else None
