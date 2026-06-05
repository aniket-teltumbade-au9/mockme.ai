import ffmpeg
import os

async def mix_audio(mic_audio_path: str, tts_clips: list[dict], output_path: str):
    """
    Mixes mic audio with multiple TTS clips based on their timestamps.
    
    tts_clips format: [{'path': str, 'start_time': float}]
    """
    # 1. Prepare inputs: Mic (0) + all TTS clips (1...N)
    inputs = [ffmpeg.input(mic_audio_path)]
    for clip in tts_clips:
        inputs.append(ffmpeg.input(clip['path']))
        
    # 2. Build the filter complex
    # Example for 1 mic + 2 TTS:
    # [0:a]adelay=0|0[a0];
    # [1:a]adelay=1000|1000[a1];
    # [2:a]adelay=5000|5000[a2];
    # [a0][a1][a2]amix=inputs=3[aout]
    
    filter_complex = ""
    input_labels = []
    
    for i, clip in enumerate(tts_clips):
        start_ms = int(clip['start_time'] * 1000)
        filter_complex += f"[{i+1}:a]adelay={start_ms}|{start_ms}[a{i+1}];"
        input_labels.append(f"[a{i+1}]")
    
    # Include mic audio (delay 0)
    filter_complex += f"[0:a]adelay=0|0[a0];"
    input_labels = ["[a0]"] + input_labels
    
    # Mix all labels
    filter_complex += "".join(input_labels) + f"amix=inputs={len(tts_clips) + 1}:dropout_transition=0[aout]"
    
    try:
        # Execute ffmpeg
        (
            ffmpeg
            .output(*inputs, "aout", output_path, filter_complex=filter_complex, map="[aout]")
            .overwrite_output()
            .run(capture_stdout=True, capture_stderr=True)
        )
        
    except ffmpeg.Error as e:
        print(f"FFmpeg error: {e.stderr.decode()}")
        raise
