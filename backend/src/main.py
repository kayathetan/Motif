# FastAPI application entrypoint: app instance, CORS configuration, and
# router registration.

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routers import brief, intelligence

app = FastAPI(title="Motif Content Intelligence API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(brief.router)
app.include_router(intelligence.router)
