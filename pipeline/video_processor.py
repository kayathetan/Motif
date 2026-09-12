# Downloads video files via yt-dlp and extracts representative frames via
# ffmpeg for multimodal LLM input.
#
# Uses imageio-ffmpeg's bundled ffmpeg binary rather than a system install -
# no `brew install ffmpeg` required (which can take 30-60+ min or hang
# entirely on macOS versions without prebuilt bottles - hit exactly that
# building this). Nothing to install beyond requirements.txt.

import os

import ffmpeg
import imageio_ffmpeg
import yt_dlp

FFMPEG_BINARY = imageio_ffmpeg.get_ffmpeg_exe()

HOOK_FRAME_SECONDS = 1.5  # midpoint of the 0-3s hook window
MIDDLE_FRAME_INTERVAL_SECONDS = 5.0
CTA_WINDOW_SECONDS = 3.0  # last 3s of the video


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
    os.makedirs(output_dir, exist_ok=True)
    ydl_opts = {
        # Video-only, smallest available - we only need frames, not audio
        # or resolution.
        "format": "worstvideo[ext=mp4]/worstvideo/worst",
        "outtmpl": os.path.join(output_dir, "%(id)s.%(ext)s"),
        "quiet": True,
        "no_warnings": True,
        "noprogress": True,
    }
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=True)
        return ydl.prepare_filename(info)


def _compute_frame_timestamps(duration_seconds: float) -> list[float]:
    """
    Build the list of timestamps to sample: the hook (0-3s midpoint), one
    every 5s through the middle, and the CTA moment (last 3s midpoint).
    Degrades gracefully for short videos instead of producing overlapping
    or out-of-range timestamps.
    """
    hook_t = min(HOOK_FRAME_SECONDS, duration_seconds / 2)
    cta_t = max(duration_seconds - HOOK_FRAME_SECONDS, hook_t)

    timestamps = [hook_t]

    # Middle frames: every 5s, stopping before the CTA window starts.
    cta_window_start = max(duration_seconds - CTA_WINDOW_SECONDS, hook_t)
    t = MIDDLE_FRAME_INTERVAL_SECONDS
    while t < cta_window_start:
        timestamps.append(t)
        t += MIDDLE_FRAME_INTERVAL_SECONDS

    # Only add the CTA frame if it's meaningfully distinct from the last
    # middle frame (avoids a near-duplicate on short videos).
    if cta_t - timestamps[-1] > 0.5:
        timestamps.append(cta_t)

    return timestamps


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
    os.makedirs(output_dir, exist_ok=True)
    timestamps = _compute_frame_timestamps(duration_seconds)

    frame_paths = []
    for i, t in enumerate(timestamps):
        frame_path = os.path.join(output_dir, f"frame_{i:02d}_{t:.1f}s.jpg")
        (
            ffmpeg
            .input(video_path)
            # ss on the output side (not input) forces accurate,
            # decode-based seeking rather than fast keyframe seeking - the
            # fast path can silently fail to land on a valid frame on
            # short/low-bitrate clips with sparse keyframes. These are
            # short clips (<60s), so the slower accurate seek is cheap.
            .output(frame_path, ss=t, vframes=1, loglevel="error")
            .overwrite_output()
            .run(cmd=FFMPEG_BINARY, capture_stdout=True, capture_stderr=True)
        )
        frame_paths.append(frame_path)

    return frame_paths
