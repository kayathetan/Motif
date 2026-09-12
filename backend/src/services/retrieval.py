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


MIN_PATTERNS_BEFORE_BROADENING = 3


def _run_similarity_query(
    cur: psycopg.Cursor,
    embedding: list[float],
    n_results: int,
    where_clause: str | None,
    where_params: tuple,
) -> list[dict]:
    sql = "select *, embedding <=> %s::vector as distance from patterns"
    params: list = [embedding]
    if where_clause:
        sql += f" where {where_clause}"
        params.extend(where_params)
    sql += " order by distance limit %s"
    params.append(n_results)
    cur.execute(sql, params)
    return cur.fetchall()


def query_similar_patterns(
    query: str,
    n_results: int = 6,
    niche: str | None = None,
    platform: str | None = None,
) -> list[dict]:
    """
    Embed the query string and return the top N most similar patterns
    stored in Supabase, ranked by cosine distance (closest first).

    When niche and platform are given, the search progressively broadens
    rather than hard-filtering: same niche + same platform first; if that
    returns fewer than MIN_PATTERNS_BEFORE_BROADENING rows, broaden to the
    same niche across any platform; if still too few, fall back to a fully
    unfiltered search. This keeps evidence grounded in the right niche
    without going empty just because one niche/platform combination is
    sparsely stocked - the library will be small, especially early on.

    Args:
        query: Natural language description of the desired content.
        n_results: Number of top matches to return.
        niche: Content niche to prefer, e.g. "fitness". None = no filtering
            at all (searches the whole table).
        platform: Platform to prefer alongside niche. Ignored if niche is
            None.

    Returns:
        A list of pattern rows (dicts), each including a `distance` field
        (cosine distance, lower = more similar) so downstream LLM calls can
        weight evidence by retrieval relevance.
    """
    embedding = generate_embedding(query)

    tiers: list[tuple[str | None, tuple]] = []
    if niche is not None and platform is not None:
        tiers.append(("niche = %s and platform = %s", (niche, platform)))
        tiers.append(("niche = %s", (niche,)))
    tiers.append((None, ()))  # fully open, last resort

    with get_connection() as conn:
        with conn.cursor() as cur:
            rows: list[dict] = []
            for where_clause, where_params in tiers:
                rows = _run_similarity_query(
                    cur, embedding, n_results, where_clause, where_params
                )
                if len(rows) >= MIN_PATTERNS_BEFORE_BROADENING or where_clause is None:
                    break
            return rows


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
