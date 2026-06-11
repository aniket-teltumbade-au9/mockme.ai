from datetime import datetime, timezone, timedelta
from app.services.database import db

FREE_VOICES = [
    {"id": "en-us", "name": "English (US)", "lang_code": "en", "flag": "\U0001f1fa\U0001f1f8", "accent": "American"},
    {"id": "en-gb", "name": "English (UK)", "lang_code": "en-gb", "flag": "\U0001f1ec\U0001f1e7", "accent": "British"},
    {"id": "en-in", "name": "English (India)", "lang_code": "en-in", "flag": "\U0001f1ee\U0001f1f3", "accent": "Indian"},
    {"id": "en-au", "name": "English (Australia)", "lang_code": "en-au", "flag": "\U0001f1e6\U0001f1fa", "accent": "Australian"},
    {"id": "en-ca", "name": "English (Canada)", "lang_code": "en-ca", "flag": "\U0001f1e8\U0001f1e6", "accent": "Canadian"},
    {"id": "en-ie", "name": "English (Ireland)", "lang_code": "en-ie", "flag": "\U0001f1ee\U0001f1ea", "accent": "Irish"},
    {"id": "en-za", "name": "English (South Africa)", "lang_code": "en-za", "flag": "\U0001f1ff\U0001f1e6", "accent": "South African"},
]

REFRESH_DAYS = 15


async def get_or_refresh_voices():
    last_meta = await db.voice_meta.find_one({"_id": "voice_cache"})
    now = datetime.now(timezone.utc)

    needs_refresh = False
    if not last_meta:
        needs_refresh = True
    else:
        last_updated = last_meta.get("last_updated")
        if not last_updated:
            needs_refresh = True
        else:
            if last_updated.tzinfo is None:
                last_updated = last_updated.replace(tzinfo=timezone.utc)
            if (now - last_updated) > timedelta(days=REFRESH_DAYS):
                needs_refresh = True

    if needs_refresh:
        await db.voices.delete_many({})
        for v in FREE_VOICES:
            v_copy = v.copy()
            v_copy["created_at"] = now
            await db.voices.insert_one(v_copy)

        await db.voice_meta.update_one(
            {"_id": "voice_cache"},
            {"$set": {"last_updated": now}},
            upsert=True,
        )
        print(f"Voice cache refreshed ({len(FREE_VOICES)} voices)")

    cursor = db.voices.find({}, {"_id": 0})
    voices = []
    async for v in cursor:
        voices.append(v)
    return voices
