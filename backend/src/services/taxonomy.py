# Canonicalizes free-text niche/content_type labels against the niches/
# content_types lookup tables (backend/sql/schema.sql), by embedding
# similarity - the same "compare against an embedding, don't require an
# exact string" idea as pipeline/classify_niche.py, applied to labels
# instead of video content.
#
# Why this exists: niche is the one field a human free-types (Inputs.jsx),
# and retrieval.py/intelligence.py previously matched it with plain
# `niche = %s` equality. "skin care" typed against a stored "skincare"
# niche matched nothing and silently fell through to fully-open retrieval -
# this closes that gap without requiring the user to type the exact stored
# string.
#
# Distinct from classify_niche.py's centroid matching: that compares a
# VIDEO's topic summary against the average topic embedding of everything
# already classified into a niche, to decide what a video is about. This
# compares a short LABEL string (a niche/content_type name) against other
# label strings, to decide whether two spellings mean the same category.
# Different kind of text, different thresholds - not reusable as one
# function.

import os

from src.services.embeddings import generate_embedding
from src.services.retrieval import get_connection

# Starting heuristic, not yet tuned against live data the way
# classify_niche.py's thresholds were ("confirmed live" in its comments) -
# short label strings that are true synonyms ("skin care" / "skincare")
# should score well above this; unrelated niches ("fitness" / "finance")
# should score well below it. Revisit once real free-text niche input
# accumulates.
LABEL_MATCH_THRESHOLD = float(os.getenv("LABEL_MATCH_THRESHOLD", "0.82"))


def _canonicalize(raw: str, table: str, *, auto_create: bool) -> str | None:
    """
    Resolve a free-text label to its canonical stored name in `table`.

    Args:
        raw: The free-text label to resolve (e.g. what a user typed, or
            what an LLM produced).
        table: "niches" or "content_types" - always a hardcoded literal
            from the wrappers below, never derived from `raw` or other
            external input.
        auto_create: If no confident match exists, insert `raw` (stripped)
            as a brand-new canonical row and return it. If False, return
            None instead - see canonicalize_niche's docstring for why
            niche doesn't auto-create.

    Returns:
        The canonical name, or None if nothing matched and auto_create is
        False. Never fabricates a match - "no confident match" is a real,
        returned outcome, same principle as classify_niche.py.
    """
    normalized = raw.strip()
    if not normalized:
        return None

    with get_connection() as conn:
        with conn.cursor() as cur:
            # Cheap exact-match fast path, so the common case (typed the
            # real name, or picked it from a list) never pays for an
            # embedding call.
            cur.execute(f"select name from {table} where name = %s", (normalized,))
            row = cur.fetchone()
            if row:
                return row["name"]

            embedding = generate_embedding(normalized)
            cur.execute(
                f"""
                select name, 1 - (embedding <=> %s::vector) as similarity
                from {table}
                where embedding is not null
                order by embedding <=> %s::vector
                limit 1
                """,
                (embedding, embedding),
            )
            best = cur.fetchone()
            if best and best["similarity"] >= LABEL_MATCH_THRESHOLD:
                return best["name"]

            if not auto_create:
                return None

            cur.execute(
                f"""
                insert into {table} (name, embedding) values (%s, %s::vector)
                on conflict (name) do nothing
                """,
                (normalized, embedding),
            )
        conn.commit()
    return normalized


def canonicalize_niche(raw: str) -> str | None:
    """
    Resolve a free-text niche (Inputs.jsx) to its canonical stored name.

    Never auto-creates a new niche row: unlike content_type, niche is
    typed by end users with no curation gate, so treating every unmatched
    string as a "new niche" would fill the table with typos and one-off
    phrasing. A genuinely new niche only ever gets created by the
    ingestion pipeline actually storing patterns for it (see
    pipeline/build_library.py's module docstring) - this function only
    normalizes matching against niches that are already real.

    Args:
        raw: The niche string as typed on Inputs.jsx.

    Returns:
        The canonical niche name, or None if nothing in the library
        confidently matches - callers should treat that as "not in the
        pattern library yet", not silently retry with the raw string.
    """
    return _canonicalize(raw, "niches", auto_create=False)


def canonicalize_content_type(raw: str) -> str:
    """
    Resolve a content_type label to its canonical stored name, creating a
    new one if nothing matches closely enough.

    Auto-creates on no match, matching content_type's existing fully
    self-growing design (get_known_content_types() already nudges the LLM
    toward reuse via a prompt; this adds an embedding-verified merge on
    top, so a near-duplicate that slips past the prompt nudge - e.g.
    "product_demonstration" next to an existing "product_demo" - still
    collapses into the existing label instead of fragmenting the library).

    Args:
        raw: A content_type label, from pattern_extractor.py's extraction
            or brief_generator.infer_content_type's inference.

    Returns:
        The canonical content_type name (always non-None - a content_type
        with no confident match becomes the new canonical entry, since
        there's nothing more grounded to fall back to here).
    """
    canonical = _canonicalize(raw, "content_types", auto_create=True)
    assert canonical is not None  # auto_create=True never returns None
    return canonical
