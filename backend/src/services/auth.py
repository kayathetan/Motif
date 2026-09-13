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
# Demo mode (frontend/src/demo.js) deliberately grants no token - see its
# own docstring ("grants no token and no backend access... deliberate").
# A demo visitor hitting this dependency 401s same as anyone else with no
# token; the frontend is expected to not call these routes at all in demo
# mode (see api.js), not for this to special-case a no-token request.

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
