# ChromaDB client setup and vector search over stored content patterns.
# Persists to backend/chroma_db/, collection name "content_patterns".

import chromadb

CHROMA_PATH = "backend/chroma_db"
COLLECTION_NAME = "content_patterns"


def get_collection():
    """
    Initialise (or connect to) the persistent ChromaDB client and return
    the "content_patterns" collection.

    Returns:
        A ChromaDB Collection instance.
    """
    pass


def query_similar_patterns(query: str, n_results: int = 6) -> list[dict]:
    """
    Embed the query string and return the top N most similar patterns
    stored in ChromaDB.

    Args:
        query: Natural language description of the desired content.
        n_results: Number of top matches to return.

    Returns:
        A list of pattern records (documents + metadata) ranked by similarity.
    """
    pass


def get_patterns_by_niche_platform(niche: str, platform: str) -> list[dict]:
    """
    Fetch all stored patterns matching a given niche and platform, regardless
    of similarity ranking.

    Args:
        niche: Content niche, e.g. "fitness".
        platform: One of "tiktok", "reels", "youtube_shorts".

    Returns:
        A list of matching pattern records (documents + metadata).
    """
    pass
