import subprocess
import os

async def mix_audio(mic_audio_path: str, tts_clips: list[dict], output_path: str):
    """
    Mixes mic audio with multiple TTS clips based on their timestamps.

    tts_clips format: [{'path': str, 'start_time': float}]
    """
    # Build ffmpeg command using subprocess (avoids ffmpeg-python's multi-stream mapping bug)
    cmd = ["ffmpeg", "-y"]

    # Add all inputs
    cmd += ["-i", mic_audio_path]
    for clip in tts_clips:
        cmd += ["-i", clip['path']]

    # Build filter_complex
    filter_complex = ""
    input_labels = []

    for i, clip in enumerate(tts_clips):
        start_ms = int(clip['start_time'] * 1000)
        filter_complex += f"[{i+1}:a]adelay={start_ms}|{start_ms}[a{i+1}];"
        input_labels.append(f"[a{i+1}]")

    # Mic audio with no delay
    filter_complex += f"[0:a]adelay=0|0[a0];"
    input_labels = ["[a0]"] + input_labels

    # Mix all labels
    filter_complex += "".join(input_labels) + f"amix=inputs={len(tts_clips) + 1}:dropout_transition=0[aout]"

    cmd += ["-filter_complex", filter_complex, "-map", "[aout]", output_path]

    print(f"DEBUG: Running mix command with {len(tts_clips) + 1} inputs -> {output_path}")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)

    if result.returncode != 0:
        stderr = result.stderr[-500:] if result.stderr else "unknown"
        print(f"FFmpeg mix error: {stderr}")
        raise Exception(f"ffmpeg error (see stderr output for detail): {stderr}")

    if os.path.exists(output_path):
        print(f"DEBUG: Mixed audio saved -> {output_path} ({os.path.getsize(output_path)} bytes)")
    else:
        print(f"ERROR: Mixed audio not created at {output_path}")
        raise Exception("Mixed audio file not created")
