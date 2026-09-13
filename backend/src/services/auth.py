# FastAPI dependency that verifies a Clerk session on the incoming
# request, per Clerk's own FastAPI integration pattern (clerk-backend-api's
# authenticate_request() - see https://github.com/clerk/fastapi-example,
# the official reference this module's shape is taken from).
#
# Before this, main.py had no auth of any kind: POST /api/brief/generate
# and GET /api/intelligence/... - each triggering a paid GPT-4o call -
# were reachable by anyone who could reach the server, and Protected.jsx
# was a client-side route gate only (it never attached a token, because
# api.js never asked Clerk for one). Both routes now require
# Depends(authenticated_user), which 401s unless the request carries a
# real, verified Clerk session token - see api.js's authenticatedFetch().
#
# Two dependencies, deliberately different:
#
#   authenticated_user  - hard gate, 401s without a verified session. Used
#                         by POST /api/brief/generate, which spends an
#                         unbounded GPT-4o budget per call.
#   optional_user       - returns None instead of 401ing for an
#                         unauthenticated request, so a route can serve
#                         anonymous demo traffic on its own terms. Used by
#                         GET /api/intelligence/..., which is a read of
#                         already-stored data whose one LLM call is cached
#                         (see routers/intelligence.py).
#
# Demo mode (frontend/src/demo.js) still grants no token. The difference is
# that the intelligence route now chooses to serve a tokenless request
# rather than the frontend refusing to make one - a judge following the
# /demo link sees real aggregated data instead of a "sign up" card. Brief
# generation stays gated, because nothing there is cacheable.

import os

from clerk_backend_api import AuthenticateRequestOptions, authenticate_request
from fastapi import HTTPException, Request, status

# Comma-separated list of origins allowed to present a session to this
# API. Defaults to the Vite dev server (vite.config.js) so this works out
# of the box locally; set CLERK_AUTHORIZED_PARTIES for any other
# deployment - see .env.example.
_AUTHORIZED_PARTIES = [
    origin.strip()
    for origin in os.getenv(
        "CLERK_AUTHORIZED_PARTIES", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if origin.strip()
]

_UNAUTHENTICATED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated.",
    headers={"WWW-Authenticate": "Bearer"},
)


async def authenticated_user(request: Request) -> str:
    """
    FastAPI dependency: verifies the request carries a valid Clerk session
    and returns the signed-in user's Clerk id.

    Reads the token the same way clerk_backend_api always does - an
    `Authorization: Bearer <token>` header first, falling back to the
    `__session` cookie - so nothing here dictates how the frontend must
    send it. FastAPI's Request satisfies the `.headers` mapping the SDK
    actually needs; no adapter required.

    Returns:
        The Clerk user id (the verified token's `sub` claim).

    Raises:
        HTTPException(401): No session, or the token failed verification
            (expired, wrong audience/party, tampered, etc). Deliberately
            the same response for every failure reason - "no token" and
            "bad token" aren't different information a caller should get
            back.
    """
    request_state = authenticate_request(
        request,
        AuthenticateRequestOptions(
            secret_key=os.environ["CLERK_SECRET_KEY"],
            authorized_parties=_AUTHORIZED_PARTIES,
        ),
    )
    if not request_state.is_signed_in or not request_state.payload:
        raise _UNAUTHENTICATED

    user_id = request_state.payload.get("sub")
    if not user_id:
        raise _UNAUTHENTICATED
    return user_id


async def optional_user(request: Request) -> str | None:
    """
    FastAPI dependency: like authenticated_user, but returns None for an
    unauthenticated request instead of raising 401.

    For routes that serve anonymous demo traffic while still wanting to
    recognise a real signed-in user (to key a per-user rate limit, say).
    The caller decides what an anonymous request is allowed to do - this
    only reports which case it is.

    Every failure collapses to None, including a token that was present
    but failed verification. That is correct for the only caller: a read
    route treats "no session" and "bad session" identically, as anonymous,
    and a caller that must distinguish them should use authenticated_user
    instead. A missing CLERK_SECRET_KEY would also land here rather than
    erroring loudly - acceptable only because this returns None, so the
    route degrades to its anonymous path instead of silently granting
    signed-in access.

    Returns:
        The Clerk user id, or None if the request has no valid session.
    """
    try:
        request_state = authenticate_request(
            request,
            AuthenticateRequestOptions(
                secret_key=os.environ["CLERK_SECRET_KEY"],
                authorized_parties=_AUTHORIZED_PARTIES,
            ),
        )
    except Exception:  # noqa: BLE001 - see docstring: anonymous is the safe fallback
        return None
    if not request_state.is_signed_in or not request_state.payload:
        return None
    return request_state.payload.get("sub") or None
