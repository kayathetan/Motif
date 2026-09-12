# Downloads video files via yt-dlp and extracts representative frames via
# ffmpeg for multimodal LLM input.

def download_video(video_url: str, output_dir: str) -> str:
    """
    Download the video at the lowest available quality via yt-dlp into a
    temp directory.

    Args:
        video_url: Full YouTube video URL.
        output_dir: Directory to download the video into.

    Returns:
        Path to the downloaded video file.
    """
    pass


def extract_frames(video_path: str, duration_seconds: float, output_dir: str) -> list[str]:
    """
    Extract ~10 frames via ffmpeg: the 0-3s hook, one every 5s through the
    middle, and the last 3s CTA moment.

    Args:
        video_path: Path to the downloaded video file.
        duration_seconds: Total video duration in seconds.
        output_dir: Directory to write extracted frame images into.

    Returns:
        A list of file paths to the extracted frames, in chronological order.
    """
    pass
