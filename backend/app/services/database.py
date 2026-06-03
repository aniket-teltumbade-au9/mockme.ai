import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL:
    raise ValueError("MONGODB_URL not found in environment variables or .env file")

client = AsyncIOMotorClient(MONGODB_URL)
db = client.mockme_db

async def get_user_progress():
    # Simplistic single-user progress for now
    progress = await db.progress.find_one({"user_id": "default_user"})
    if not progress:
        progress = {"user_id": "default_user", "total_interviews": 0, "skill_gaps": [], "history": []}
        await db.progress.insert_one(progress)
    
    # Convert ObjectId to string for JSON serialization
    if progress and "_id" in progress:
        progress["_id"] = str(progress["_id"])
    return progress

async def can_start_interview():
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    existing = await db.interviews.find_one({
        "user_id": "default_user",
        "created_at": {"$gte": today}
    })
    return existing is None

async def save_interview_session(session_data):
    session_data["created_at"] = datetime.now(timezone.utc)
    await db.interviews.insert_one(session_data)

async def update_progress(session_id, gaps, feedback):
    await db.progress.update_one(
        {"user_id": "default_user"},
        {
            "$inc": {"total_interviews": 1},
            "$push": {"history": {"session_id": session_id, "date": datetime.now(timezone.utc), "feedback": feedback}},
            "$set": {"skill_gaps": list(set(gaps))} # Update unique gaps
        }
    )
