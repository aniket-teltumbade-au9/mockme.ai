import os
import io
import subprocess
import tempfile
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def transcribe_audio(audio_bytes):
    try:
        # Create a temporary file to store incoming audio
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp_in:
            tmp_in.write(audio_bytes)
            tmp_in.flush()
            input_path = tmp_in.name
            
        output_path = input_path + ".wav"
        
        # Transcode to WAV using ffmpeg
        try:
            subprocess.run(
                ["ffmpeg", "-i", input_path, "-ar", "16000", "-ac", "1", output_path],
                check=True, capture_output=True, text=False
            )
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg Error: {e.stderr.decode()}")
            raise
        
        # Read the WAV file
        with open(output_path, "rb") as f:
            audio_data = f.read()
            
        # Cleanup
        os.remove(input_path)
        os.remove(output_path)
        
        # Groq Whisper
        audio_file = io.BytesIO(audio_data)
        audio_file.name = "audio.wav"
        
        translation = client.audio.transcriptions.create(
            file=(audio_file.name, audio_file.read()),
            model="whisper-large-v3",
            response_format="json",
        )
        return translation.text
    except Exception as e:
        print(f"STT Error (Groq): {e}")
        return ""
