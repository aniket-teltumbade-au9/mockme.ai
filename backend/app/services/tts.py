import io
from gtts import gTTS

# Supported accent codes exposed to the frontend
SUPPORTED_LANGS = {
    "en": "en",       # Default (US/generic English)
    "en-in": "en-IN", # Indian English (gTTS uses 'en' with tld='co.in')
    "en-gb": "en-GB", # British English
    "en-au": "en-AU", # Australian English
}

def get_audio_bytes(text: str, lang: str = "en-in") -> bytes:
    if not text or not text.strip():
        return b""

    try:
        # Indian English — gTTS achieves this via Google India's TLD
        if lang == "en-in":
            tts = gTTS(text=text, lang="en", tld="co.in")
        elif lang == "en-gb":
            tts = gTTS(text=text, lang="en", tld="co.uk")
        elif lang == "en-au":
            tts = gTTS(text=text, lang="en", tld="com.au")
        else:
            tts = gTTS(text=text, lang="en", tld="com")

        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        return fp.read()
    except Exception as e:
        print(f"TTS Error (gTTS, lang={lang}): {e}")
        return b""
