import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL:
    raise ValueError("MONGODB_URL not found in environment variables or .env file")

# Use certifi's CA file to avoid SSL handshake errors on some systems
client = AsyncIOMotorClient(
    MONGODB_URL, 
    tlsCAFile=certifi.where(),
    tls=True,
    connectTimeoutMS=30000,
    serverSelectionTimeoutMS=30000
)
db = client.mockme_db

# Verify connection on startup (optional but helpful for logs)
async def test_db_connection():
    try:
        await client.admin.command('ping')
        print("MongoDB connection successful")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")

async def get_user(user_id: str):
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        new_user: dict = {"user_id": user_id, "dropbox_refresh_token": None}
        await db.users.insert_one(new_user)
        new_user["_id"] = str(new_user["_id"])
        return new_user
    user["_id"] = str(user["_id"])
    return user

async def update_user_dropbox(user_id: str, dropbox_data: dict):
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": dropbox_data}
    )

async def get_session(session_id: str):
    return await db.interviews.find_one({"sessionId": session_id})

async def update_session(session_id: str, update_data: dict):
    await db.interviews.update_one(
        {"sessionId": session_id},
        {"$set": update_data}
    )

async def get_user_progress(user_id: str):
    progress = await db.progress.find_one({"user_id": user_id})
    if not progress:
        new_progress: dict = {"user_id": user_id, "total_interviews": 0, "skill_gaps": [], "history": []}
        await db.progress.insert_one(new_progress)
        new_progress["_id"] = str(new_progress["_id"])
        return new_progress
    progress["_id"] = str(progress["_id"])
    return progress

async def can_start_interview(user_id: str) -> bool:
    # Set DISABLE_RATE_LIMIT=true in .env to bypass the daily limit during development
    if os.getenv("DISABLE_RATE_LIMIT", "").lower() in ("1", "true", "yes"):
        return True
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    existing = await db.interviews.find_one({
        "user_id": user_id,
        "created_at": {"$gte": today}
    })
    return existing is None

async def save_interview_session(session_data):
    session_data["created_at"] = datetime.now(timezone.utc)
    await db.interviews.insert_one(session_data)

async def update_progress(user_id: str, session_id: str, gaps: list, feedback: str):
    # Fetch existing gaps and merge — avoids wiping gaps from prior sessions
    existing = await db.progress.find_one({"user_id": user_id})
    existing_gaps: list = existing.get("skill_gaps", []) if existing else []
    merged_gaps = list(set(existing_gaps + gaps))
    await db.progress.update_one(
        {"user_id": user_id},
        {
            "$inc": {"total_interviews": 1},
            "$push": {"history": {"session_id": session_id, "date": datetime.now(timezone.utc), "feedback": feedback}},
            "$set": {"skill_gaps": merged_gaps}
        },
        upsert=True
    )
