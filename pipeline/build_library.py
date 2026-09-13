# Main entry point: orchestrates the full pipeline (fetch -> process ->
# extract -> store) for every URL in pipeline/data/video_urls.json.
# Standalone script — shares the Supabase store with backend/ but has no
# imports from backend/src/.
#
# Run from the repo root:  python -m pipeline.build_library
# Needs OPENAI_API_KEY, YOUTUBE_API_KEY and DATABASE_URL (see
# backend/.env.example). No system ffmpeg needed - video_processor.py uses
# imageio-ffmpeg's bundled binary.

import json
import logging
import shutil
import tempfile
from pathlib import Path

from pipeline.classify_niche import generate_topic_summary
from pipeline.pattern_extractor import extract_pattern
from pipeline.store_patterns import store_pattern
from pipeline.video_processor import download_video, extract_frames
from pipeline.youtube_fetcher import (
    compute_structural_signals,
    fetch_transcript,
    fetch_video_metadata,
)

URLS_PATH = Path(__file__).parent / "data" / "video_urls.json"

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


def process_video(video_url: str, niche: str, platform: str) -> None:
    """
    Run one video end to end: metadata -> transcript -> signals -> frames ->
    pattern -> stored row.

    Args:
        video_url: Full YouTube video URL.
        niche: Content niche for this URL, from the JSON structure.
        platform: One of "tiktok", "reels", "youtube_shorts".

    Raises:
        Whatever the underlying steps raise. main() catches per video.
    """
    metadata = fetch_video_metadata(video_url)
    log.info("  %s (%s views)", metadata["title"][:64], f"{metadata['views']:,}")

    transcript = fetch_transcript(video_url)
    signals = compute_structural_signals(transcript, metadata["duration_seconds"])
    log.info(
        "  hook %.2fs · cta %.1f%% · wpm %s/%s/%s",
        signals["hook_delivery_seconds"],
        signals["cta_placement_percent"],
        signals["words_per_minute_first_third"],
        signals["words_per_minute_middle_third"],
        signals["words_per_minute_last_third"],
    )

    frame_paths, work_dir = _frames_for(video_url, metadata["duration_seconds"])
    try:
        pattern = extract_pattern(metadata, transcript, signals, frame_paths)
    finally:
        if work_dir:
            shutil.rmtree(work_dir, ignore_errors=True)

    if not pattern:
        raise RuntimeError("extract_pattern returned nothing")

    # The loop is the authority on these two: the JSON structure says which
    # niche and platform a URL was collected under, so whatever the LLM
    # inferred for them is overridden.
    pattern["niche"] = niche
    pattern["platform"] = platform

    # Computed signals beat inferred ones for the same reason.
    pattern["hook_delivery_seconds"] = signals["hook_delivery_seconds"]
    pattern["cta_placement_percent"] = signals["cta_placement_percent"]

    # Best-effort: feeds pipeline/classify_niche.py, not core pattern
    # quality, so a failure here shouldn't skip an otherwise-good video.
    try:
        transcript_text = " ".join(segment["text"] for segment in transcript)
        topic_summary = generate_topic_summary(metadata["title"], transcript_text)
    except Exception as exc:  # noqa: BLE001 - classification input is a nice-to-have
        log.warning("  topic summary unavailable (%s: %s)", type(exc).__name__, exc)
        topic_summary = None

    store_pattern({**metadata, **pattern, "topic_summary": topic_summary})
    log.info("  stored")


def main() -> None:
    """
    Load pipeline/data/video_urls.json and, for every niche/platform/URL,
    run youtube_fetcher -> video_processor -> pattern_extractor ->
    store_patterns. Logs progress per video and skips failures gracefully.
    """
    if not URLS_PATH.exists():
        log.error("No URL list at %s", URLS_PATH)
        return

    catalogue: dict[str, dict[str, list[str]]] = json.loads(
        URLS_PATH.read_text()
    )
    if not catalogue:
        log.warning("%s is empty — nothing to build", URLS_PATH.name)
        return

    total = sum(
        len(urls) for platforms in catalogue.values() for urls in platforms.values()
    )
    log.info("Building pattern library from %d video(s)", total)

    done = 0
    failed: list[tuple[str, str]] = []

    for niche, platforms in catalogue.items():
        for platform, urls in platforms.items():
            for video_url in urls:
                log.info("[%s / %s] %s", niche, platform, video_url)
                try:
                    process_video(video_url, niche, platform)
                    done += 1
                except Exception as exc:  # noqa: BLE001 - one bad video is not fatal
                    log.error("  skipped (%s: %s)", type(exc).__name__, exc)
                    failed.append((video_url, f"{type(exc).__name__}: {exc}"))

    log.info("Done: %d stored, %d skipped", done, len(failed))
    for video_url, reason in failed:
        log.info("  skipped %s — %s", video_url, reason)


if __name__ == "__main__":
    main()
