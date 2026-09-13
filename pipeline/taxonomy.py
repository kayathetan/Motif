# Canonicalizes a content_type label against the content_types lookup
# table (backend/sql/schema.sql), by embedding similarity. Mirrors
# backend/src/services/taxonomy.py's canonicalize_content_type - kept as a
# separate copy rather than an import, same reason store_patterns.py
# duplicates embeddings.py: pipeline/ shares the database with backend/
# but has no import dependency on it.
#
# Why this exists on top of get_known_content_types()'s prompt nudge
# (pattern_extractor.py): the nudge only helps when the model happens to
# notice a near-duplicate itself. This is a second, verified line of
# defense - a genuinely near-duplicate label ("product_demonstration" next
# to an existing "product_demo") still collapses into the existing one
# even if the prompt nudge didn't catch it.
#
# Only content_type lives here. niche does NOT get an equivalent
# auto-creating canonicalizer in the pipeline: classify_niche.py already
# has a stricter, more deliberate mechanism for niche (embedding
# similarity against a niche's actual content, with an LLM confirmation
# band, and "no confident match" as a real outcome) - duplicating a looser
# label-only canonicalizer here would undermine that, not complement it.

import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv
from psycopg.rows import dict_row

from pipeline.store_patterns import generate_embedding

load_dotenv(Path(__file__).resolve().parent.parent / "backend" / ".env")

# Same starting heuristic as backend/src/services/taxonomy.py - keep the
# two in sync if this gets tuned.
LABEL_MATCH_THRESHOLD = float(os.getenv("LABEL_MATCH_THRESHOLD", "0.82"))


def canonicalize_content_type(raw: str) -> str:
    """
    Resolve a content_type label to its canonical stored name, creating a
    new one if nothing matches closely enough.

    Args:
        raw: A content_type label, as extracted by
            pattern_extractor.extract_pattern.

    Returns:
        The canonical content_type name - always non-None, since a
        content_type with no confident match becomes the new canonical
        entry (same self-growing design as before this existed, just
        collision-checked now instead of only prompt-nudged).
    """
    normalized = raw.strip()

    # No register_vector() here - unlike classify_niche.py's
    # compute_niche_centroids(), nothing here ever reads a vector column's
    # value back into Python (only `<=>` distance/similarity, which comes
    # back as a plain float); an explicit %s::vector cast on the write
    # side is enough, same as store_patterns.py.
    with psycopg.connect(os.environ["DATABASE_URL"], row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "select name from content_types where name = %s", (normalized,)
            )
            row = cur.fetchone()
            if row:
                return row["name"]

            embedding = generate_embedding(normalized)
            cur.execute(
                """
                select name, 1 - (embedding <=> %s::vector) as similarity
                from content_types
                where embedding is not null
                order by embedding <=> %s::vector
                limit 1
                """,
                (embedding, embedding),
            )
            best = cur.fetchone()
            if best and best["similarity"] >= LABEL_MATCH_THRESHOLD:
                return best["name"]

            # store_patterns.store_pattern() also inserts content_type
            # (as a safety net for callers that bypass extract_pattern) -
            # inserting it here up front means the very next near-duplicate
            # already has something to match against, without waiting for
            # store_pattern() to run.
            cur.execute(
                """
                insert into content_types (name, embedding) values (%s, %s::vector)
                on conflict (name) do nothing
                """,
                (normalized, embedding),
            )
        conn.commit()
    return normalized
