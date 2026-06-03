import io
from gtts import gTTS

def get_audio_bytes(text):
    if not text or not text.strip():
        return b""
        
    try:
        # gTTS uses Google Translate's TTS API (free and no models)
        tts = gTTS(text=text, lang='en')
        
        # Save to a bytes buffer
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        
        return fp.read()
    except Exception as e:
        print(f"TTS Error (gTTS): {e}")
        # Return an empty byte string or a tiny silent wav if possible
        # For now, return empty bytes which frontend should handle or skip
        return b""
