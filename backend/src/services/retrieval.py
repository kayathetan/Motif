# Supabase (Postgres + pgvector) connection and vector search over stored
# content patterns. Table: "patterns" (see backend/sql/schema.sql).

import os

import psycopg
from dotenv import load_dotenv
from pgvector.psycopg import register_vector
from psycopg.rows import dict_row

from src.services.embeddings import generate_embedding

load_dotenv()


def get_connection() -> psycopg.Connection:
    """
    Open a new connection to the Supabase Postgres database, with the
    pgvector type adapter registered and dict-style row results enabled.

    Returns:
        An open psycopg Connection. Use as a context manager
        (`with get_connection() as conn:`) so it's closed automatically.
    """
    database_url = os.environ["DATABASE_URL"]
    conn = psycopg.connect(database_url, row_factory=dict_row)
    register_vector(conn)
    return conn


def query_similar_patterns(query: str, n_results: int = 6) -> list[dict]:
    """
    Embed the query string and return the top N most similar patterns
    stored in Supabase, ranked by cosine distance (closest first).

    Args:
        query: Natural language description of the desired content.
        n_results: Number of top matches to return.

    Returns:
        A list of pattern rows (dicts), each including a `distance` field
        (cosine distance, lower = more similar) so downstream LLM calls can
        weight evidence by retrieval relevance.
    """
    embedding = generate_embedding(query)
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                select *, embedding <=> %s::vector as distance
                from patterns
                order by distance
                limit %s
                """,
                (embedding, n_results),
            )
            return cur.fetchall()


def get_patterns_by_niche_platform(niche: str, platform: str) -> list[dict]:
    """
    Fetch all stored patterns matching a given niche and platform, regardless
    of similarity ranking.

    Args:
        niche: Content niche, e.g. "fitness".
        platform: One of "tiktok", "reels", "youtube_shorts".

    Returns:
        A list of matching pattern rows (dicts).
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "select * from patterns where niche = %s and platform = %s",
                (niche, platform),
            )
            return cur.fetchall()
