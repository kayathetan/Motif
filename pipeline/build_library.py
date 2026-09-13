# Main entry point: orchestrates the full pipeline (fetch -> classify ->
# process -> extract -> store) for every URL in pipeline/data/video_urls.json.
# Standalone script — shares the Supabase store with backend/ but has no
# imports from backend/src/.
#
# Run from the repo root:  python -m pipeline.build_library
# Needs OPENAI_API_KEY, YOUTUBE_API_KEY and DATABASE_URL (see
# backend/.env.example). No system ffmpeg needed - video_processor.py uses
# imageio-ffmpeg's bundled binary.
#
# video_urls.json is a flat list of URLs with no niche attached - niche is
# determined by pipeline.classify_niche against the niches that already
# exist in the table, not assigned by the curator. This needs at least one
# seeded example per niche to classify against (classify_niche returns
# "no_existing_niches" on an empty table) - it grows an already-seeded
# library, it doesn't bootstrap one from nothing.

import json
import logging
import shutil
import tempfile
from pathlib import Path

from youtube_transcript_api import NoTranscriptFound, TranscriptsDisabled

from pipeline.classify_niche import (
    classify_niche,
    generate_topic_summary,
    invalidate_niche_centroid_cache,
)
from pipeline.pattern_extractor import extract_pattern
from pipeline.store_patterns import store_pattern
from pipeline.video_processor import download_video, extract_frames
from pipeline.youtube_fetcher import (
    compute_structural_signals,
    fetch_transcript,
    fetch_video_metadata,
)

URLS_PATH = Path(__file__).parent / "data" / "video_urls.json"
DEFAULT_PLATFORM = "youtube_shorts"

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s  %(levelname)-7s %(message)s"
)
log = logging.getLogger("build_library")


def _frames_for(video_url: str, duration_seconds: float) -> tuple[list[str], str | None]:
    """
    Download the video and pull representative frames.

    Wrapped separately from the rest of the chain because this is the only
    step needing yt-dlp and ffmpeg on the machine. If it fails the video is
    still worth keeping: transcript and computed signals carry the structural
    fields, and the extractor can work from an empty frame list.

    Returns a (frame_paths, work_dir) pair rather than using
    tempfile.TemporaryDirectory() as a context manager here: that would
    delete the directory - and the frame files this function just
    returned - the instant this function returns, before process_video()'s
    later extract_pattern() call ever gets to read them (confirmed live:
    FileNotFoundError on every frame). The caller owns cleanup instead, via
    the returned work_dir, once it's actually done with the frames.

    Returns:
        (frame_paths, work_dir). frame_paths is empty and work_dir is None
        if extraction was not possible - nothing left to clean up.
    """
    work_dir = tempfile.mkdtemp()
    try:
        video_path = download_video(video_url, work_dir)
        return extract_frames(video_path, duration_seconds, work_dir) or [], work_dir
    except Exception as exc:  # noqa: BLE001 - frames are a nice-to-have
        log.warning("  frames unavailable (%s: %s)", type(exc).__name__, exc)
        shutil.rmtree(work_dir, ignore_errors=True)
        return [], None


def process_video(video_url: str, platform: str = DEFAULT_PLATFORM) -> bool:
    """
    Run one video end to end: metadata -> transcript -> signals -> topic
    classification -> frames -> pattern -> stored row.

    Classification happens before the expensive multimodal step on
    purpose: metadata + transcript are cheap (a couple of API calls), full
    pattern extraction is not (frame download + GPT-4o vision). A video
    with no confident niche match is skipped before paying for that.

    A video with captions disabled (TranscriptsDisabled/NoTranscriptFound)
    no longer fails outright: topic/content classification falls back to
    the video's description, while structural timing signals
    (hook_delivery_seconds, cta_placement_percent, words-per-minute) stay
    at their honest "unknown" defaults rather than being fabricated from
    untimed text - see compute_structural_signals's docstring. Any other
    transcript-fetch error (blocked, unavailable, etc.) still propagates
    as a real failure.

    Args:
        video_url: Full YouTube video URL.
        platform: One of "tiktok", "reels", "youtube_shorts". Not
            classified - the URL list is all YouTube Shorts for now, so
            this just defaults rather than being inferred per video.

    Returns:
        True if a pattern was stored, False if skipped for lack of a
        confident niche match (not an error - main() tallies this
        separately from real failures).

    Raises:
        Whatever the underlying steps raise, for a real failure.
        main() catches per video.
    """
    metadata = fetch_video_metadata(video_url)
    log.info("  %s (%s views)", metadata["title"][:64], f"{metadata['views']:,}")

    try:
        transcript = fetch_transcript(video_url)
    except (TranscriptsDisabled, NoTranscriptFound) as exc:
        # Captions genuinely don't exist for this video - a real, expected
        # outcome, not a network/blocking failure (those still propagate
        # normally). Degrade rather than skip: fall back to the video's
        # description for topic/content classification below, but leave
        # transcript itself empty so compute_structural_signals() reports
        # its own honest "unknown" defaults (hook_delivery_seconds=0.0,
        # cta_placement_percent=None) instead of fabricating timing off
        # untimed text - see that function's docstring.
        log.warning(
            "  no transcript (%s) - falling back to description for "
            "topic/content classification; timing signals unavailable",
            type(exc).__name__,
        )
        transcript = []

    signals = compute_structural_signals(transcript, metadata["duration_seconds"])
    log.info(
        "  hook %.2fs · cta %s · wpm %s/%s/%s",
        signals["hook_delivery_seconds"],
        f"{signals['cta_placement_percent']:.1f}%"
        if signals["cta_placement_percent"] is not None
        else "n/a",
        signals["words_per_minute_first_third"],
        signals["words_per_minute_middle_third"],
        signals["words_per_minute_last_third"],
    )

    transcript_text = " ".join(segment["text"] for segment in transcript)
    # Text for topic summary / pattern extraction context only - never fed
    # back into compute_structural_signals above, which already ran against
    # the real (possibly empty) transcript. A description has no per-word
    # timestamps, so treating it as a transcript there would fabricate
    # hook/CTA/pacing numbers from text that was never actually timed.
    context_transcript = transcript
    if not transcript_text:
        transcript_text = metadata.get("description") or ""
        context_transcript = (
            [{"text": transcript_text, "start": 0.0}] if transcript_text else []
        )
    topic_summary = generate_topic_summary(metadata["title"], transcript_text)
    niche, similarity, decision = classify_niche(topic_summary)
    log.info(
        "  topic: %s -> niche=%s (similarity %.3f, %s)",
        topic_summary, niche, similarity, decision,
    )

    if niche is None:
        log.info("  skipped - no confident niche match")
        return False

    frame_paths, work_dir = _frames_for(video_url, metadata["duration_seconds"])
    try:
        pattern = extract_pattern(metadata, context_transcript, signals, frame_paths)
    finally:
        if work_dir:
            shutil.rmtree(work_dir, ignore_errors=True)

    if not pattern:
        raise RuntimeError("extract_pattern returned nothing")

    # classify_niche() is the authority on niche now, not a curator - see
    # module docstring. Still overriding whatever extract_pattern's own
    # multimodal read might have guessed, for the same reason as before:
    # a grounded decision beats an ungrounded one.
    pattern["niche"] = niche
    pattern["platform"] = platform

    # Computed signals beat inferred ones for the same reason.
    pattern["hook_delivery_seconds"] = signals["hook_delivery_seconds"]
    pattern["cta_placement_percent"] = signals["cta_placement_percent"]

    store_pattern({**metadata, **pattern, "topic_summary": topic_summary})
    log.info("  stored")

    # This video's topic_embedding just changed (or grew) the niche it
    # belongs to - drop the cached centroids so the next video in this
    # run classifies against up-to-date data instead of a stale snapshot
    # from before this store. See classify_niche.compute_niche_centroids.
    invalidate_niche_centroid_cache()
    return True


def main() -> None:
    """
    Load pipeline/data/video_urls.json (a flat list of URLs) and run
    youtube_fetcher -> classify_niche -> video_processor -> pattern_extractor
    -> store_patterns for each. Logs progress per video, skips a video with
    no confident niche match, and skips (rather than aborts) a real failure.
    """
    if not URLS_PATH.exists():
        log.error("No URL list at %s", URLS_PATH)
        return

    urls: list[str] = json.loads(URLS_PATH.read_text())
    if not urls:
        log.warning("%s is empty — nothing to build", URLS_PATH.name)
        return

    log.info("Building pattern library from %d video(s)", len(urls))

    stored = 0
    unclassified: list[str] = []
    failed: list[tuple[str, str]] = []

    for video_url in urls:
        log.info("%s", video_url)
        try:
            if process_video(video_url):
                stored += 1
            else:
                unclassified.append(video_url)
        except Exception as exc:  # noqa: BLE001 - one bad video is not fatal
            log.error("  skipped (%s: %s)", type(exc).__name__, exc)
            failed.append((video_url, f"{type(exc).__name__}: {exc}"))

    log.info(
        "Done: %d stored, %d unclassified, %d failed",
        stored, len(unclassified), len(failed),
    )
    for video_url in unclassified:
        log.info("  no confident niche match: %s", video_url)
    for video_url, reason in failed:
        log.info("  failed %s — %s", video_url, reason)


if __name__ == "__main__":
    main()
