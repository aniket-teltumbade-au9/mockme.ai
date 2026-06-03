import os
import io
from groq import Groq
from dotenv import load_dotenv

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def transcribe_audio(audio_bytes):
    try:
        # Groq Whisper is incredibly fast
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = "audio.webm"
        
        translation = client.audio.transcriptions.create(
            file=(audio_file.name, audio_file.read()),
            model="whisper-large-v3",
            response_format="json",
        )
        return translation.text
    except Exception as e:
        print(f"STT Error (Groq): {e}")
        return ""
