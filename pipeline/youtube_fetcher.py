# Fetches YouTube video metadata and transcripts, and computes structural
# signals (hook delivery, CTA placement, pacing) from the transcript in code.

import os
import re
from pathlib import Path

from dotenv import load_dotenv
from googleapiclient.discovery import build
from youtube_transcript_api import YouTubeTranscriptApi

# load_dotenv() with no args searches upward from the current working
# directory, which never reaches backend/.env - it's a sibling of
# pipeline/, not a parent. Point at it explicitly (confirmed live: this
# raised KeyError on YOUTUBE_API_KEY when run from the repo root).
load_dotenv(Path(__file__).resolve().parent.parent / "backend" / ".env")

# Words that carry no content, so they don't count as the hook landing.
# "so", "basically", "okay" are the classic YouTube throat-clearing openers.
_FILLER = {
    "a", "ah", "alright", "am", "an", "and", "are", "as", "at", "basically",
    "be", "been", "but", "er", "erm", "guys", "hello", "hey", "hi", "honestly",
    "i", "if", "in", "is", "it", "just", "kinda", "like", "literally", "me",
    "my", "actually", "obviously", "of", "oh", "ok", "okay", "on", "or", "right",
    "so", "sort", "that", "the", "then", "there", "they", "this", "to", "today",
    "um", "uh", "was", "we", "welcome", "well", "what", "yeah", "you", "your",
}

# Phrases that mark a call to action. Ordered longest-first at match time so
# "link in bio" wins over a bare "link".
_CTA_PHRASES = [
    "link in bio", "link in my bio", "link below", "check the link",
    "comment below", "let me know", "drop a comment", "tell me",
    "follow for more", "follow me for", "subscribe", "hit follow",
    "save this", "save it for", "share this", "send this to",
    "would you try", "try it and", "sign up", "get started", "shop now",
    "swipe up", "click the", "dm me", "message me",
]

_WORD = re.compile(r"[a-z0-9']+")


def _video_id(video_url: str) -> str:
    """
    Extract the 11-character video id from any YouTube URL shape:
    watch?v=, youtu.be/, /shorts/, /embed/.

    Args:
        video_url: Full YouTube video URL.

    Returns:
        The video id.

    Raises:
        ValueError: If no id can be found in the URL.
    """
    patterns = (
        r"(?:v=|/shorts/|/embed/|youtu\.be/)([A-Za-z0-9_-]{11})",
        r"^([A-Za-z0-9_-]{11})$",  # a bare id, so callers can pass either
    )
    for pattern in patterns:
        match = re.search(pattern, video_url)
        if match:
            return match.group(1)
    raise ValueError(f"No YouTube video id in URL: {video_url!r}")


def _iso8601_to_seconds(duration: str) -> float:
    """
    Convert an ISO 8601 duration as returned by the YouTube API
    (e.g. "PT1M23S", "PT45S", "PT1H2M3S") into seconds.

    Args:
        duration: ISO 8601 duration string.

    Returns:
        Duration in seconds.
    """
    match = re.fullmatch(
        r"P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?", duration
    )
    if not match:
        raise ValueError(f"Unparseable ISO 8601 duration: {duration!r}")
    days, hours, minutes, seconds = (float(g or 0) for g in match.groups())
    return days * 86400 + hours * 3600 + minutes * 60 + seconds


def fetch_video_metadata(video_url: str) -> dict:
    """
    Fetch video metadata via the YouTube Data API: title, views, likes,
    duration, tags.

    Keys match the metadata columns in backend/sql/schema.sql exactly, so the
    result can be merged straight into a pattern record.

    Args:
        video_url: Full YouTube video URL.

    Returns:
        A dict of metadata fields.

    Raises:
        ValueError: If the video id can't be parsed, or the API returns no
            item for it (deleted, private or region-blocked).
    """
    youtube = build("youtube", "v3", developerKey=os.environ["YOUTUBE_API_KEY"])
    video_id = _video_id(video_url)

    response = (
        youtube.videos()
        .list(part="snippet,statistics,contentDetails", id=video_id)
        .execute()
    )
    items = response.get("items", [])
    if not items:
        raise ValueError(f"YouTube returned no video for id {video_id!r}")

    item = items[0]
    statistics = item.get("statistics", {})

    # likes and comments can be hidden by the uploader; views effectively
    # always exist. schema.sql allows null for likes/comment_count only.
    def _optional_int(key: str) -> int | None:
        value = statistics.get(key)
        return int(value) if value is not None else None

    return {
        "video_url": video_url,
        "title": item["snippet"]["title"],
        "views": int(statistics.get("viewCount", 0)),
        "likes": _optional_int("likeCount"),
        "comment_count": _optional_int("commentCount"),
        "duration_seconds": _iso8601_to_seconds(
            item["contentDetails"]["duration"]
        ),
        "published_at": item["snippet"]["publishedAt"],
    }


def fetch_transcript(video_url: str) -> list[dict]:
    """
    Fetch the video's transcript with timestamps via youtube-transcript-api.

    Not every video has captions. This deliberately lets the library's
    exception propagate — build_library.py catches it per video, logs it and
    moves on, rather than this function papering over a missing transcript
    and returning something that looks empty but valid.

    Args:
        video_url: Full YouTube video URL.

    Returns:
        A list of transcript segments, each with text and start time.
    """
    segments = YouTubeTranscriptApi().fetch(_video_id(video_url))
    return [
        {"text": segment.text, "start": float(segment.start)}
        for segment in segments
    ]


def _words_per_minute(segments: list[dict], span_seconds: float) -> float:
    """Word count across the given segments, normalised to words per minute."""
    if span_seconds <= 0:
        return 0.0
    words = sum(len(_WORD.findall(s["text"].lower())) for s in segments)
    return round(words / (span_seconds / 60), 1)


def compute_structural_signals(
    transcript: list[dict], duration_seconds: float
) -> dict:
    """
    Compute structural signals from the transcript in code (no LLM):
    hook_delivery_seconds (timestamp of first non-filler content word),
    cta_placement_percent (position of CTA keywords as % of total duration),
    and words_per_minute across the first/middle/last thirds of the transcript.

    Deterministic by design: these are the numbers the LLM must not be
    allowed to invent, because the whole product rests on them.

    Args:
        transcript: Transcript segments as returned by fetch_transcript.
        duration_seconds: Total video duration in seconds.

    Returns:
        A dict of computed structural signals.
    """
    if not transcript or duration_seconds <= 0:
        return {
            "hook_delivery_seconds": 0.0,
            "cta_placement_percent": None,
            "words_per_minute_first_third": 0.0,
            "words_per_minute_middle_third": 0.0,
            "words_per_minute_last_third": 0.0,
        }

    # --- hook: the first word that actually says something -----------------
    hook_delivery_seconds = 0.0
    for segment in transcript:
        words = _WORD.findall(segment["text"].lower())
        content = [w for w in words if w not in _FILLER]
        if content:
            # Approximate within the segment: assume even delivery across it,
            # and offset by however many filler words came first.
            first_index = words.index(content[0])
            per_word = 0.0
            if len(words) > 1:
                # crude but stable: segments are short, ~2-4s
                per_word = 0.35
            hook_delivery_seconds = round(
                segment["start"] + first_index * per_word, 2
            )
            break

    # --- CTA: where the first call to action appears -----------------------
    # None, not 0.0, when no phrase matches - confirmed live that this was
    # previously indistinguishable from "the CTA opens the video", which
    # silently corrupted structural_benchmark.cta_after_percent (multiple
    # stored patterns had no verbal CTA at all, yet averaged in as 0%,
    # implying "top performers front-load their CTA" when the real story
    # was "detection found nothing"). A video can still have a real,
    # visible-only CTA (an end card, an on-screen button) that this
    # phrase-matching can't see - None honestly says "unknown", not "zero".
    cta_placement_percent = None
    for segment in transcript:
        text = segment["text"].lower()
        if any(phrase in text for phrase in _CTA_PHRASES):
            cta_placement_percent = round(
                min(segment["start"] / duration_seconds, 1.0) * 100, 1
            )
            break

    # --- pacing: words per minute across thirds ----------------------------
    third = duration_seconds / 3
    buckets: list[list[dict]] = [[], [], []]
    for segment in transcript:
        index = min(int(segment["start"] // third), 2) if third > 0 else 0
        buckets[index].append(segment)

    return {
        "hook_delivery_seconds": hook_delivery_seconds,
        "cta_placement_percent": cta_placement_percent,
        "words_per_minute_first_third": _words_per_minute(buckets[0], third),
        "words_per_minute_middle_third": _words_per_minute(buckets[1], third),
        "words_per_minute_last_third": _words_per_minute(buckets[2], third),
    }
