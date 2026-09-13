# Generates text embeddings via OpenAI's text-embedding-3-small model.
# Used by retrieval.py (query embedding) and pipeline/store_patterns.py
# (pattern document embedding).

from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

# load_dotenv() with no args searches upward from the current working
# directory - only finds backend/.env if the process happens to be
# launched with cwd=backend/. Point at it explicitly, same fix
# pipeline/*.py already applies (see e.g. youtube_fetcher.py) for the
# identical reason.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

client = OpenAI()

EMBEDDING_MODEL = "text-embedding-3-small"


def generate_embedding(text: str) -> list[float]:
    """
    Generate an embedding vector for the given text using OpenAI's
    text-embedding-3-small model.

    Args:
        text: The input text to embed.

    Returns:
        A list of floats representing the embedding vector (1536 dimensions).
    """
    response = client.embeddings.create(model=EMBEDDING_MODEL, input=text)
    return response.data[0].embedding
