# Sends metadata, transcript, computed signals, and frames to GPT-4o
# (multimodal) to extract a structured Pattern via JSON output mode.
#
# Structured output convention: client.responses.parse(text_format=Model) -
# NOT client.responses.create() with a hand-built schema dict, which 400s
# under strict mode (Pydantic's model_json_schema() never sets
# additionalProperties: false). See backend/src/services/brief_generator.py
# for the full writeup of this and a second gotcha (avoid field names that
# collide with JSON Schema keywords, e.g. "format").
#
# hook_delivery_seconds and cta_placement_percent are NOT requested from the
# model - they're already computed in code by
# youtube_fetcher.compute_structural_signals, and passed through as-is so
# the two pipeline tracks never disagree on the same number. niche/platform
# aren't requested either - build_library.py already knows them from the
# video_urls.json loop and sets them itself.
#
# Standalone: no imports from backend/src/ (this module has its own OpenAI
# client, same as store_patterns.py needs its own DB connection).

import base64
import mimetypes
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel

# load_dotenv() with no args searches upward from the current working
# directory - useless here, since backend/.env is a sibling of pipeline/,
# not a parent. Point at it explicitly so this works regardless of where
# the script is invoked from (matches the shared credentials in
# backend/.env.example: OPENAI_API_KEY, YOUTUBE_API_KEY, DATABASE_URL).
load_dotenv(Path(__file__).resolve().parent.parent / "backend" / ".env")

client = OpenAI()
PATTERN_MODEL = os.getenv("PATTERN_MODEL", "gpt-4o")

SYSTEM_PROMPT = """
You are a short-form video structural analyst. You are given a handful of
frames sampled chronologically from a video (the opening hook, several
frames through the middle, and the closing CTA moment), its transcript, and
some already-computed timing signals.

Your job is to name the STRUCTURAL PATTERN this video follows - not to
describe what happens in it. Think like someone reverse-engineering why
this video performs, not someone writing a caption for it.

For each field:
- hook_style: name the technique (e.g. "bold claim", "pattern interrupt",
  "cold open result", "relatable pain point") - not a description of this
  video's specific hook.
- hook_text: the actual opening line/on-screen text, verbatim from the
  transcript or frames.
- visual_format: the shooting/editing format (e.g. "talking head + b-roll
  cutaways", "split screen comparison", "before/after montage").
- scene_change_frequency: how often the shot changes (e.g. "every 2-3s",
  "every 5s", "single continuous shot").
- on_screen_text: whether on-screen text/captions reinforce the audio.
- camera_style: the camera treatment (e.g. "handheld, close-up", "static
  tripod, wide shot").
- reveal_order: the structural sequence as a short arrow chain, e.g.
  "claim -> demonstration -> payoff -> cta".
- payoff_seconds: your best estimate, from the frames and transcript
  pacing, of when the main payoff/reveal lands (seconds from start). This
  is often a visual moment (e.g. a before/after cut), not necessarily a
  transcript keyword - use the frames' relative position for this judgment.
- cta_type: the category of call to action (e.g. "follow", "shop_now",
  "comment", "share", "visit_link", "save"). Pick the closest category,
  don't invent a new one unless truly nothing fits.
- pacing: overall pacing (e.g. "fast", "medium", "slow").
- emotional_trigger: the primary emotional mechanism driving engagement
  (e.g. "curiosity", "surprise", "validation", "aspiration", "urgency").
- success_factors: 2-4 short, specific observations about why this
  structure likely works - grounded in what you can actually see/read, not
  generic advice.

Ground every judgment in the supplied frames, transcript, and signals. Do
not invent details you can't see or read.
"""


class _ExtractedPattern(BaseModel):
    hook_style: str
    hook_text: str
    visual_format: str
    scene_change_frequency: str
    on_screen_text: bool
    camera_style: str
    reveal_order: str
    payoff_seconds: float
    cta_type: str
    pacing: str
    emotional_trigger: str
    success_factors: list[str]


def _frame_to_data_uri(frame_path: str) -> str:
    """Read a frame file and encode it as a base64 data: URI."""
    mime_type, _ = mimetypes.guess_type(frame_path)
    mime_type = mime_type or "image/jpeg"
    with open(frame_path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode("utf-8")
    return f"data:{mime_type};base64,{encoded}"


def _build_context_text(metadata: dict, transcript: list[dict], signals: dict) -> str:
    transcript_text = " ".join(segment["text"] for segment in transcript)
    return f"""
VIDEO METADATA:
- title: {metadata.get('title')}
- views: {metadata.get('views')}
- duration_seconds: {metadata.get('duration_seconds')}

COMPUTED SIGNALS (already measured in code - use as context, do not
re-derive these two numbers):
- hook_delivery_seconds: {signals.get('hook_delivery_seconds')}
- cta_placement_percent: {signals.get('cta_placement_percent')}
- words_per_minute (first/middle/last third): \
{signals.get('words_per_minute_first_third')} / \
{signals.get('words_per_minute_middle_third')} / \
{signals.get('words_per_minute_last_third')}

TRANSCRIPT:
{transcript_text}

The attached images are frames sampled chronologically from this video,
starting with the hook and ending with the CTA moment.
"""


def extract_pattern(
    metadata: dict,
    transcript: list[dict],
    signals: dict,
    frame_paths: list[str],
) -> dict[str, Any]:
    """
    Call GPT-4o (multimodal, structured JSON output) to extract a structured
    Pattern from the video's metadata, transcript, computed structural
    signals, and extracted frames.

    Args:
        metadata: Video metadata from youtube_fetcher.fetch_video_metadata.
        transcript: Transcript segments from youtube_fetcher.fetch_transcript.
        signals: Computed structural signals from youtube_fetcher.compute_structural_signals.
        frame_paths: Extracted frame file paths from video_processor.extract_frames,
            in chronological order.

    Returns:
        A dict matching every Pattern field except niche/platform (set by
        build_library.py from the video_urls.json loop, not guessed here).
    """
    content: list[dict] = [
        {"type": "input_text", "text": _build_context_text(metadata, transcript, signals)},
    ]
    for frame_path in frame_paths:
        content.append(
            {"type": "input_image", "image_url": _frame_to_data_uri(frame_path)}
        )

    response = client.responses.parse(
        model=PATTERN_MODEL,
        input=[
            {"role": "developer", "content": SYSTEM_PROMPT},
            {"role": "user", "content": content},
        ],
        text_format=_ExtractedPattern,
    )

    if response.output_parsed is None:
        raise RuntimeError("Model returned no parseable pattern.")

    extracted = response.output_parsed.model_dump()

    # hook_delivery_seconds / cta_placement_percent are code-computed, not
    # model-derived - pass them through as-is (see module docstring).
    extracted["hook_delivery_seconds"] = signals["hook_delivery_seconds"]
    extracted["cta_placement_percent"] = signals["cta_placement_percent"]

    return extracted
