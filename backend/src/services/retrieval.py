# Supabase (Postgres + pgvector) connection and vector search over stored
# content patterns. Table: "patterns" (see backend/sql/schema.sql).

import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv
from pgvector.psycopg import register_vector
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from src.services.embeddings import generate_embedding

# See the matching note in embeddings.py - load_dotenv() with no args
# doesn't reliably find backend/.env depending on the process's cwd.
load_dotenv(Path(__file__).resolve().parents[2] / ".env")

# A shared pool of already-open connections, not a fresh psycopg.connect()
# per call. Measured live: opening one connection against Supabase's
# pooler took ~450ms - TCP + TLS + Postgres auth - against ~45ms for the
# query it was about to run. Every route that touches the DB (brief
# generation, intelligence, the dashboard's profile/briefs fetches) was
# paying that ~450ms tax on every single request; reusing a small set of
# already-open connections across requests removes nearly all of it.
#
# configure=register_vector runs once per underlying connection when the
# pool creates it (pgvector type registration is per-connection state,
# same as before), not on every checkout.
#
# min_size=1 keeps one connection warm from process start rather than
# waiting for the first request to pay for it; max_size=5 is comfortably
# above what this API's traffic needs today without holding open more
# Supabase connections than it will use. open=True so the pool's initial
# connection(s) are already established by the time this module finishes
# importing (main.py imports the routers, which import this), instead of
# lazily on whichever request happens to arrive first.
_pool = ConnectionPool(
    os.environ["DATABASE_URL"],
    min_size=1,
    max_size=5,
    kwargs={"row_factory": dict_row},
    configure=register_vector,
    open=True,
)


def get_connection():
    """
    Borrow a connection from the shared pool.

    Use as a context manager, same as before this was pooled
    (`with get_connection() as conn:`) - the connection returns to the
    pool when the block exits instead of closing, so no caller needed to
    change.
    """
    return _pool.connection()


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


def get_known_content_types() -> list[str]:
    """
    Every content_type ever used, so brief_generator.infer_content_type()
    can be nudged to reuse an existing label instead of inventing a
    near-duplicate ("product_demo" vs "product_demonstration") that
    query_similar_patterns's content_type-scoped tiers won't match (they
    key on the exact string, with no fuzzy matching) - silently pushing
    every such request down to a weaker fallback tier.

    Mirrors pipeline/classify_niche.py's function of the same name rather
    than importing it: pipeline/ and backend/ are kept standalone from
    each other (pipeline/ isn't guaranteed to be on backend's import path
    in a production deploy), same as embeddings.py already duplicates
    pipeline/store_patterns.py's generate_embedding() instead of sharing it.

    Returns:
        Sorted list of known content types. Empty before anything's been
        stored yet.
    """
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("select name from content_types order by name")
            return [row["name"] for row in cur.fetchall()]
