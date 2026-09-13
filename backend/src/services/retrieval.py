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
    content_type: str | None = None,
) -> list[dict]:
    """
    Embed the query string and return the top N most similar patterns
    stored in Supabase, ranked by cosine distance (closest first).

    The search progressively broadens rather than hard-filtering, but
    which constraint gets dropped first depends on whether content_type
    was given:

    Without content_type (niche/platform only, as before): same niche +
    same platform first; then same niche, any platform; then fully open.

    With content_type: niche is dropped BEFORE content_type, not after.
    content_type ("product_demo", "culture_relatable", etc.) is what
    determines structural comparability here, not niche/topic - a
    business wanting a "culture" video can draw on culture-content
    patterns from other industries, since a product demo and a culture
    piece from the SAME niche don't share structural DNA the way two
    culture pieces from different niches plausibly do:
      1. niche + platform + content_type
      2. niche + content_type (any platform)
      3. content_type only (ANY niche) - the cross-industry tier
      4. fully open, last resort

    Either way, broadening only happens when a tier returns fewer than
    MIN_PATTERNS_BEFORE_BROADENING rows - this keeps evidence as specific
    as possible without going empty just because one combination is
    sparsely stocked, which it will be, especially early on.

    Args:
        query: Natural language description of the desired content.
        n_results: Number of top matches to return.
        niche: Content niche to prefer, e.g. "fitness". None = not used
            as a filter at all.
        platform: Platform to prefer alongside niche. Ignored if niche is
            None, or once content_type has dropped niche from the tier.
        content_type: Content type to prefer, e.g. "product_demo". See
            above for how this changes the fallback order.

    Returns:
        A list of pattern rows (dicts), each including a `distance` field
        (cosine distance, lower = more similar) so downstream LLM calls can
        weight evidence by retrieval relevance.
    """
    embedding = generate_embedding(query)

    tiers: list[tuple[str | None, tuple]] = []
    if content_type is not None:
        if niche is not None and platform is not None:
            tiers.append(
                (
                    "niche = %s and platform = %s and content_type = %s",
                    (niche, platform, content_type),
                )
            )
        if niche is not None:
            tiers.append(("niche = %s and content_type = %s", (niche, content_type)))
        tiers.append(("content_type = %s", (content_type,)))
    elif niche is not None and platform is not None:
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
