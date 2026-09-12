# Generates text embeddings via OpenAI's text-embedding-3-small model.
# Used by retrieval.py (query embedding) and pipeline/store_patterns.py
# (pattern document embedding).

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

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
