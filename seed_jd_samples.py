import json
import os
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
if not MONGODB_URL:
    raise ValueError("MONGODB_URL not found in environment variables or .env file")

client = AsyncIOMotorClient(
    MONGODB_URL, 
    tlsCAFile=certifi.where(),
    tls=True
)
db = client.mockme_ai_db

async def seed_db():
    print("Starting seeding process...")
    
    with open('jds_output.json', 'r', encoding='utf-8') as f:
        jds = json.load(f)
    print(f"Loaded {len(jds)} JDs from jds_output.json.")

    # Clear existing samples to avoid duplicates
    await db.jd_samples.delete_many({})
    print("Cleared existing jd_samples collection.")

    # Insert new samples
    if jds:
        await db.jd_samples.insert_many(jds)
        print(f"Successfully seeded {len(jds)} JDs into MongoDB.")
    else:
        print("No JDs to seed.")

    print("Seeding complete.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_db())
