# GET /api/briefs, GET /api/briefs/{brief_id}, DELETE /api/briefs/{brief_id}
# Requires a verified Clerk session (see src.services.auth). No rate limit
# here unlike brief.py/intelligence.py - these are plain reads/deletes
# against already-saved rows, no OpenAI call. Writing a saved brief
# happens in routers/brief.py, on every successful /api/brief/generate
# call - there's no separate "save" endpoint.

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from src.models.schemas import SavedBrief, SavedBriefSummary
from src.services.auth import authenticated_user
from src.services.saved_briefs import (
    delete_saved_brief,
    get_saved_brief,
    list_saved_briefs,
)

router = APIRouter()


@router.get("/api/briefs", response_model=list[SavedBriefSummary])
async def get_briefs(
    user_id: Annotated[str, Depends(authenticated_user)],
) -> list[SavedBriefSummary]:
    """The signed-in user's brief history, most recent first."""
    return list_saved_briefs(user_id)


@router.get("/api/briefs/{brief_id}", response_model=SavedBrief)
async def get_brief(
    brief_id: int,
    user_id: Annotated[str, Depends(authenticated_user)],
) -> SavedBrief:
    """
    One saved brief in full, for clicking back into a past result.

    Raises:
        HTTPException(404): No such brief, or it belongs to a different
            user - see saved_briefs.get_saved_brief's docstring for why
            those two cases aren't distinguished.
    """
    brief = get_saved_brief(user_id, brief_id)
    if brief is None:
        raise HTTPException(status_code=404, detail="Brief not found.")
    return brief


@router.delete("/api/briefs/{brief_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_brief(
    brief_id: int,
    user_id: Annotated[str, Depends(authenticated_user)],
) -> None:
    """
    Delete one saved brief from the signed-in user's history.

    Raises:
        HTTPException(404): No such brief, or it belongs to a different
            user - same non-distinction as GET /api/briefs/{brief_id}.
    """
    if not delete_saved_brief(user_id, brief_id):
        raise HTTPException(status_code=404, detail="Brief not found.")
