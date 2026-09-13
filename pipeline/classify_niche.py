# Classifies a candidate video's niche via embedding similarity against
# existing niches' centroid embeddings, escalating to a conservative LLM
# check for ambiguous cases. Adapted from the three-tier confidence-gated
# pattern in https://github.com/keyuedeng/moirejournal (cosine similarity
# against exemplar embeddings, with an LLM tie-breaker in the ambiguous
# band) - there applied to identity-concept nodes, here to content niches.
#
# Why this instead of just asking an LLM "what niche is this?": it grounds
# the decision in comparison to already human-verified examples rather
# than an ungrounded guess, and it degrades safely - "no confident match"
# is a real, returned outcome, not something that gets silently forced
# into the nearest category. That's exactly the failure mode that put
# basketball-interview content into the "tech" niche: nothing forced that
# call to say "I'm not sure."
#
# Standalone: no imports from backend/src/ (same rule as the rest of
# pipeline/).

import os
from pathlib import Path

import psycopg
from dotenv import load_dotenv
from openai import OpenAI
from pgvector.psycopg import register_vector
from pydantic import BaseModel

from pipeline.store_patterns import generate_embedding

load_dotenv(Path(__file__).resolve().parent.parent / "backend" / ".env")

client = OpenAI()
CLASSIFIER_MODEL = os.getenv("CLASSIFIER_MODEL", "gpt-4o-mini")

# Starting points taken directly from the reference implementation's
# proven thresholds. >= HIGH auto-accepts; [MID, HIGH) escalates to an LLM
# check; < MID for every niche means no confident match at all.
HIGH_THRESHOLD = 0.70
MID_THRESHOLD = 0.55

# A centroid built from only 1-2 examples is narrow, not necessarily
# unrepresentative - confirmed live: a genuinely correct tech-gadget match
# scored 0.425 (well below MID) purely because the tech niche's one
# reference video was a differently-styled multi-gadget roundup rather
# than a single-product review. Holding a brand-new niche to the same bar
# as a mature one blocks it from ever growing past its first example.
# Below this count, both thresholds relax by SPARSE_NICHE_DISCOUNT.
MATURE_NICHE_SIZE = 3
SPARSE_NICHE_DISCOUNT = 0.15


def _cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = sum(x * x for x in a) ** 0.5
    mag_b = sum(y * y for y in b) ** 0.5
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


class _TopicSummary(BaseModel):
    topic_summary: str


def generate_topic_summary(title: str, transcript_text: str) -> str:
    """
    Distill a video down to one or two plain sentences about what it is
    actually about - deliberately excluding anything structural.

    This is a different axis from Pattern's fields on purpose: hook_style,
    pacing, camera_style etc. describe HOW a video is made; this describes
    WHAT it is about. Mixing the two in one embedding is what made the
    original document/embedding columns useless for niche classification
    (confirmed live - a plain topic description scored far too low against
    them, even for genuinely correct matches).

    Args:
        title: The video's title.
        transcript_text: Full transcript text (segments joined).

    Returns:
        A short, structure-free topic description.
    """
    prompt = f"""
Describe ONLY what this video's content is actually about - the subject,
product, activity, or topic - in one or two plain sentences.

Do NOT mention hook style, pacing, camera work, editing, on-screen text,
scene changes, or any other structural/production detail. Just the topic,
as if summarising it to someone who will never watch it.

Title: {title}

Transcript: {transcript_text}
"""
    response = client.responses.parse(
        model=CLASSIFIER_MODEL,
        input=[{"role": "user", "content": prompt}],
        text_format=_TopicSummary,
    )
    if response.output_parsed is None:
        raise RuntimeError("Model returned no parseable topic summary.")
    return response.output_parsed.topic_summary


def compute_niche_centroids() -> dict[str, tuple[list[float], int]]:
    """
    Average topic_embedding per niche, computed from every pattern
    currently stored that has one. This is the exemplar a new candidate
    gets compared against - grounded in content a human already verified
    belongs in that niche.

    Uses topic_embedding, not the structural-pattern embedding column -
    see generate_topic_summary()'s docstring for why they can't be mixed.

    Returns:
        {niche: (centroid_embedding, example_count)}. example_count lets
        the caller relax thresholds for a niche that's still sparse - see
        MATURE_NICHE_SIZE. Empty dict if no rows have a topic_embedding
        yet (e.g. before backfilling older rows).
    """
    with psycopg.connect(os.environ["DATABASE_URL"]) as conn:
        # Without this, the vector column comes back as its raw string
        # representation ("[0.001,0.002,...]"), not a list of floats -
        # confirmed live, list() on that string silently gives a list of
        # characters instead of erroring.
        register_vector(conn)
        with conn.cursor() as cur:
            cur.execute(
                "select niche, topic_embedding from patterns "
                "where topic_embedding is not null"
            )
            rows = cur.fetchall()

    by_niche: dict[str, list[list[float]]] = {}
    for niche, embedding in rows:
        # register_vector() returns a pgvector.Vector wrapper, not a plain
        # list, when numpy isn't installed - confirmed live.
        by_niche.setdefault(niche, []).append(embedding.to_list())

    centroids: dict[str, tuple[list[float], int]] = {}
    for niche, embeddings in by_niche.items():
        dims = len(embeddings[0])
        centroid = [
            sum(e[i] for e in embeddings) / len(embeddings) for i in range(dims)
        ]
        centroids[niche] = (centroid, len(embeddings))
    return centroids


class _NicheFitCheck(BaseModel):
    fits: bool
    reason: str


def _llm_niche_check(description: str, niche: str) -> bool:
    """
    Conservative tie-breaker for the ambiguous similarity band. Mirrors the
    "broad similarity is NOT enough" guardrail from the reference pattern:
    confirm only when the content itself genuinely belongs in this niche,
    not just because it's associated with it (e.g. posted by a company in
    that space).
    """
    prompt = f"""
You are checking whether a video's content genuinely belongs in an
existing content niche - not whether it is loosely associated with it.

Content description:
"{description}"

Candidate niche: "{niche}"

Confirm ONLY if this video's actual subject matter is what a viewer
searching for "{niche}" content would expect to find. Being posted by a
company or creator associated with "{niche}" is NOT enough on its own -
judge the content itself. Broad similarity is NOT enough.
"""
    response = client.responses.parse(
        model=CLASSIFIER_MODEL,
        input=[{"role": "user", "content": prompt}],
        text_format=_NicheFitCheck,
    )
    return response.output_parsed is not None and response.output_parsed.fits


def classify_niche(topic_summary: str) -> tuple[str | None, float, str]:
    """
    Classify a candidate video's niche from a plain topic summary of its
    content (see generate_topic_summary()), via embedding similarity
    against existing niches' centroids.

    Args:
        topic_summary: Structure-free description of what the video is
            actually about - not who posted it, not what industry they're
            in, and not how it's shot/paced/edited.

    Returns:
        (niche, similarity, decision). niche is None when nothing matched
        confidently - never force a fit. decision is one of "auto",
        "llm_confirmed", "llm_rejected", "below_threshold",
        "no_existing_niches", kept so a human can audit why a call was
        made rather than trusting a black box.
    """
    centroids = compute_niche_centroids()
    if not centroids:
        return None, 0.0, "no_existing_niches"

    embedding = generate_embedding(topic_summary)
    scored = sorted(
        (
            (niche, _cosine_similarity(embedding, centroid), count)
            for niche, (centroid, count) in centroids.items()
        ),
        key=lambda triple: triple[1],
        reverse=True,
    )
    best_niche, best_similarity, best_count = scored[0]

    # See MATURE_NICHE_SIZE's docstring note: a sparse niche's centroid is
    # narrow, not necessarily wrong, so it gets a lower bar until it's
    # grown a few examples.
    discount = SPARSE_NICHE_DISCOUNT if best_count < MATURE_NICHE_SIZE else 0.0
    high_threshold = HIGH_THRESHOLD - discount
    mid_threshold = MID_THRESHOLD - discount

    if best_similarity >= high_threshold:
        return best_niche, best_similarity, "auto"

    if best_similarity >= mid_threshold:
        if _llm_niche_check(topic_summary, best_niche):
            return best_niche, best_similarity, "llm_confirmed"
        return None, best_similarity, "llm_rejected"

    return None, best_similarity, "below_threshold"
