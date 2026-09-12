# Sends metadata, transcript, computed signals, and frames to GPT-4o
# (multimodal) to extract a structured Pattern via JSON output mode.

def extract_pattern(metadata: dict, transcript: list[dict], signals: dict, frame_paths: list[str]) -> dict:
    """
    Call GPT-4o (multimodal, structured JSON output) to extract a structured
    Pattern from the video's metadata, transcript, computed structural
    signals, and extracted frames.

    Args:
        metadata: Video metadata from youtube_fetcher.fetch_video_metadata.
        transcript: Transcript segments from youtube_fetcher.fetch_transcript.
        signals: Computed structural signals from youtube_fetcher.compute_structural_signals.
        frame_paths: Extracted frame file paths from video_processor.extract_frames.

    Returns:
        A dict matching the Pattern schema.
    """
    pass
