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
db = client.mockme_ai_db

# Verify connection on startup (optional but helpful for logs)
async def test_db_connection():
    try:
        await client.admin.command('ping')
        print("MongoDB connection successful")
    except Exception as e:
        err_str = str(e)
        print(f"MongoDB connection failed: {err_str}")
        if "TLSV1_ALERT_INTERNAL_ERROR" in err_str or "SSL handshake failed" in err_str:
            print("")
            print("=" * 70)
            print("MongoDB Atlas SSL Error Detected")
            print("=" * 70)
            print("This usually means your IP is not whitelisted in MongoDB Atlas.")
            print("")
            print("Fix: Go to https://cloud.mongodb.com -> Network Access")
            print("     -> Add IP Address -> Add Current IP (or 0.0.0.0/0 for dev)")
            print("=" * 70)
            print("")

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
        {"$set": dropbox_data, "$setOnInsert": {"user_id": user_id}},
        upsert=True,
    )

async def get_session(session_id: str):
    return await db.interviews.find_one({"sessionId": session_id})

async def update_session(session_id: str, update_data: dict):
    await db.interviews.update_one(
        {"sessionId": session_id},
        {"$set": update_data}
    )

async def get_user_interviews(user_id: str):
    cursor = db.interviews.find({"user_id": user_id}).sort("created_at", -1).limit(20)
    interviews = []
    async for interview in cursor:
        interview["_id"] = str(interview["_id"])
        interviews.append(interview)
    return interviews

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

async def update_progress(user_id: str, session_id: str, gaps: list, feedback: str, performance_score: float = 0.0, hire_verdict: str = None):
    # Fetch existing data
    existing = await db.progress.find_one({"user_id": user_id})
    
    # Fetch session details to get performance score
    session = await db.interviews.find_one({"sessionId": session_id})
    session_score = session.get("performance_score", performance_score) if session else performance_score
    session_verdict = hire_verdict or (session.get("analysis", {}).get("hire_verdict") if session else None)
    session_created = session.get("created_at") if session else datetime.now(timezone.utc)
    
    # Structure for the new snapshot
    new_snapshot = {"timestamp": datetime.now(timezone.utc), "gaps": gaps}
    
    # Session summary with gap resolution info
    session_summary = {
        "session_id": session_id,
        "created_at": session_created,
        "gaps": gaps,
        "performance_score": session_score,
        "hire_verdict": session_verdict,
        "resolved_in_session": None,  # Will be updated when resolved
    }
    
    # Update logic
    await db.progress.update_one(
        {"user_id": user_id},
        {
            "$inc": {"total_interviews": 1},
            "$push": {
                "history": {"session_id": session_id, "date": datetime.now(timezone.utc), "feedback": feedback},
                "skill_gaps_history": new_snapshot,
                "session_summaries": session_summary,
            },
            "$set": {"skill_gaps": list(set((existing.get("skill_gaps", []) if existing else []) + gaps))}
        },
        upsert=True
    )
    
    # Check if any previous session gaps were resolved
    if existing:
        session_summaries = existing.get("session_summaries", [])
        for idx, prev_summary in enumerate(session_summaries):
            prev_gaps = set(prev_summary.get("gaps", []))
            current_gaps = set(gaps)
            
            # Find gaps that were in previous but not in current (resolved)
            resolved = prev_gaps - current_gaps
            if resolved and not prev_summary.get("resolved_in_session"):
                # Mark previous session as having resolved gaps
                await db.progress.update_one(
                    {"user_id": user_id},
                    {
                        "$set": {f"session_summaries.{idx}.resolved_in_session": session_id}
                    }
                )

