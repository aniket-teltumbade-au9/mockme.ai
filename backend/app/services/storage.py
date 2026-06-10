import os
import subprocess
import shutil
import glob

def get_storage_dir() -> str:
    """Return the absolute path to the recordings storage directory.
    All audio files (mic turns, TTS clips, mixed output) are kept here permanently."""
    base = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    path = os.path.join(base, "recordings")
    os.makedirs(path, exist_ok=True)
    return path

def get_mic_path(session_id: str) -> str:
    """Path to the combined mic recording (built from turn clips at STATE_3)."""
    return os.path.join(get_storage_dir(), f"{session_id}_mic.mp3")

def get_tts_clip_path(session_id: str, index: int) -> str:
    """Path to a Sarah TTS response clip."""
    return os.path.join(get_storage_dir(), f"{session_id}_sarah_{index}.mp3")

def get_turn_audio_path(session_id: str, turn_index: int) -> str:
    """Path to a user mic turn recording."""
    return os.path.join(get_storage_dir(), f"{session_id}_turn_{turn_index}.webm")

def get_mixed_path(session_id: str) -> str:
    """Path to the final mixed audio (mic + TTS combined)."""
    return os.path.join(get_storage_dir(), f"{session_id}_mixed.mp3")

def concatenate_turn_audio(session_id: str) -> str:
    """Concatenate all turn audio files into one mic mp3 using ffmpeg.
    Scans the storage dir by glob to find all turn files (handles gaps from code-only turns).
    Returns the path to the combined file, or empty string on failure."""
    output_path = get_mic_path(session_id)

    # Scan for existing turn files by glob (handles gaps from code-only turns)
    pattern = os.path.join(get_storage_dir(), f"{session_id}_turn_*.webm")
    all_turn_files = sorted(glob.glob(pattern))
    existing = [p for p in all_turn_files if os.path.exists(p)]

    if not existing:
        print(f"WARN: No turn audio files found for session {session_id} (glob: {pattern})")
        return ""

    print(f"DEBUG: Concatenating {len(existing)} turn files for session {session_id}")
    for p in existing:
        sz = os.path.getsize(p)
        print(f"DEBUG:   turn file: {p} ({sz} bytes)")

    # Convert all turn webm files to wav, then concat wavs, then encode to mp3
    # This is more reliable than concat demuxer which requires identical codec params
    wav_dir = get_storage_dir()
    wav_files = []
    for i, webm_path in enumerate(existing):
        wav_path = os.path.join(wav_dir, f"{session_id}_turn_{i}_temp.wav")
        cmd_convert = [
            "ffmpeg", "-y", "-i", webm_path,
            "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "1",
            wav_path
        ]
        r = subprocess.run(cmd_convert, capture_output=True, text=True, timeout=30)
        if r.returncode == 0 and os.path.exists(wav_path):
            wav_files.append(wav_path)
            print(f"DEBUG: Converted {webm_path} -> {wav_path}")
        else:
            print(f"WARN: Failed to convert {webm_path} to wav: {r.stderr[:200]}")

    if not wav_files:
        print(f"ERROR: No turn files could be converted to wav")
        # Fallback: copy the last existing turn raw
        shutil.copy2(existing[-1], output_path)
        print(f"DEBUG: Fallback - copied raw turn to {output_path}")
        return output_path

    if len(wav_files) == 1:
        # Single file - convert wav to mp3 directly
        cmd = [
            "ffmpeg", "-y", "-i", wav_files[0],
            "-acodec", "libmp3lame", "-q:a", "2",
            output_path
        ]
        subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        os.remove(wav_files[0])
        print(f"DEBUG: Single turn mp3 -> {output_path} ({os.path.getsize(output_path)} bytes)")
        return output_path

    # Multiple wav files - concatenate via concat filter using subprocess (avoid ffmpeg-python API issues)
    cmd = ["ffmpeg", "-y"]
    for w in wav_files:
        cmd += ["-i", w]
    filter_inputs = "".join(f"[{i}:a]" for i in range(len(wav_files)))
    filter_str = f"{filter_inputs}concat=n={len(wav_files)}:v=0:a=1[aout]"
    cmd += ["-filter_complex", filter_str, "-map", "[aout]", "-c:a", "libmp3lame", "-q:a", "2", output_path]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if result.returncode == 0 and os.path.exists(output_path) and os.path.getsize(output_path) > 0:
        print(f"DEBUG: Concatenated {len(wav_files)} turns to {output_path} ({os.path.getsize(output_path)} bytes)")
    else:
        print(f"FFMPEG concat error: {result.stderr[:300]}")
        # Fallback: convert last wav to mp3
        cmd = ["ffmpeg", "-y", "-i", wav_files[-1], "-c:a", "libmp3lame", "-q:a", "2", output_path]
        subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        print(f"DEBUG: Fallback - last wav to mp3 -> {output_path}")

    # Cleanup temp wav files
    for w in wav_files:
        try:
            if os.path.exists(w):
                os.remove(w)
        except Exception:
            pass

    return output_path
