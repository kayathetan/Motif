# FastAPI application entrypoint: app instance, CORS configuration, and
# router registration.
#
# No auth middleware here on purpose - auth is per-route
# (Depends(authenticated_user), see src/services/auth.py), not global,
# since it only applies to the two routes that actually cost money
# (brief.py, intelligence.py). allow_origins=["*"] is safe alongside that:
# CORS only controls which browser origins may read the response, it's
# not the access control - and this API takes its own Authorization
# header rather than cookies (allow_credentials=False), so there's no
# credentialed-request-from-anywhere risk that a stricter origin list
# would close.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routers import brief, briefs, intelligence, profile

app = FastAPI(title="Motif Content Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(brief.router)
app.include_router(briefs.router)
app.include_router(intelligence.router)
app.include_router(profile.router)
