# Generates text embeddings via OpenAI's text-embedding-3-small model.
# Used by retrieval.py (query embedding) and pipeline/store_patterns.py
# (pattern document embedding).

import os
from openai import OpenAI


def generate_embedding(text: str) -> list[float]:
    """
    Generate an embedding vector for the given text using OpenAI's
    text-embedding-3-small model.

    Args:
        text: The input text to embed.

    Returns:
        A list of floats representing the embedding vector.
    """
    pass
