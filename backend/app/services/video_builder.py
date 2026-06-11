import subprocess
import os

AVATAR_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "static",
    "sarah-avatar.png",
)


def create_avatar_video(audio_path: str, output_path: str) -> bool:
    """Create an MP4 video from the static avatar image + TTS audio.
    Uses ffmpeg: loop avatar image for the duration of the audio, encode as h264.
    Returns True on success."""
    if not os.path.exists(AVATAR_PATH):
        print(f"ERROR: Avatar image not found at {AVATAR_PATH}")
        return False

    cmd = [
        "ffmpeg", "-y",
        "-loop", "1",
        "-i", AVATAR_PATH,
        "-i", audio_path,
        "-c:v", "libx264",
        "-tune", "stillimage",
        "-c:a", "aac",
        "-b:a", "64k",
        "-shortest",
        "-pix_fmt", "yuv420p",
        output_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        print(f"ERROR creating avatar video: {result.stderr[:300]}")
        return False

    if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        print(f"DEBUG: Avatar video created -> {output_path} ({os.path.getsize(output_path)} bytes)")
        return True

    print(f"ERROR: Avatar video output missing at {output_path}")
    return False


def extract_audio_from_video(video_path: str, output_wav_path: str) -> bool:
    """Extract audio from a video file as 16kHz mono WAV for transcription."""
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        output_wav_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        print(f"ERROR extracting audio: {result.stderr[:300]}")
        return False
    return os.path.exists(output_wav_path) and os.path.getsize(output_wav_path) > 0
