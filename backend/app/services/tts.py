import io
from gtts import gTTS

# Supported accent codes exposed to the frontend
# lang_code values must match frontend expectations
SUPPORTED_LANGS = {
    "en": {"lang": "en", "tld": "com"},       # Default (US/generic English)
    "en-in": {"lang": "en", "tld": "co.in"},  # Indian English
    "en-gb": {"lang": "en", "tld": "co.uk"},  # British English
    "en-au": {"lang": "en", "tld": "com.au"}, # Australian English
}

def get_audio_bytes(text: str, lang: str = "en-in", tld: str = None) -> bytes:
    if not text or not text.strip():
        return b""

    try:
        # Get language config
        lang_config = SUPPORTED_LANGS.get(lang, {"lang": "en", "tld": "com"})
        
        # Use provided tld or fall back to config
        actual_tld = tld or lang_config["tld"]
        actual_lang = lang_config["lang"]
        
        tts = gTTS(text=text, lang=actual_lang, tld=actual_tld)

        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        return fp.read()
    except Exception as e:
        print(f"TTS Error (gTTS, lang={lang}, tld={tld}): {e}")
        return b""
