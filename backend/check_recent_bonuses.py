import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import certifi

load_dotenv()

async def check_recent_bonuses():
    MONGODB_URL = os.getenv("MONGODB_URL")
    client = AsyncIOMotorClient(
        MONGODB_URL, 
        tlsCAFile=certifi.where(),
        tls=True,
        connectTimeoutMS=30000,
        serverSelectionTimeoutMS=30000
    )
    db = client.mockme_ai_db
    
    try:
        print("="*80)
        print("RECENT FESTIVAL BONUS DISTRIBUTIONS")
        print("="*80 + "\n")
        
        # Get recent entries (last 2 hours)
        two_hours_ago = datetime.now(timezone.utc) - timedelta(hours=2)
        
        recent = await db.credit_ledger.find({
            "type": "FESTIVAL_BONUS",
            "timestamp": {"$gte": two_hours_ago}
        }).sort([("timestamp", -1)]).to_list(None)
        
        print(f"Festival bonuses in last 2 hours: {len(recent)}\n")
        
        # Group by user
        by_user = {}
        for entry in recent:
            user = entry.get('user_id')
            if user not in by_user:
                by_user[user] = []
            by_user[user].append(entry)
        
        print(f"Users who received bonuses: {len(by_user)}\n")
        
        for user, entries in sorted(by_user.items()):
            total_amount = sum(e.get('amount', 0) for e in entries)
            times = len(entries)
            latest = entries[0].get('timestamp')
            
            print(f"User: {user}")
            print(f"  Times awarded: {times}")
            print(f"  Total amount: {total_amount}")
            print(f"  Latest: {latest}")
            print()
        
        print("="*80)
        print("ALL USERS CURRENT CREDITS")
        print("="*80 + "\n")
        
        users = await db.users.find({}).sort([("user_id", 1)]).to_list(None)
        
        for user in users:
            user_id = user.get('user_id')
            credits = user.get('credits', 0)
            
            # Count how many bonuses they received
            bonus_entries = await db.credit_ledger.find({
                "user_id": user_id,
                "type": "FESTIVAL_BONUS"
            }).to_list(None)
            bonus_count = len(bonus_entries)
            
            print(f"{user_id}")
            print(f"  Credits: {credits}")
            print(f"  Festival bonuses received: {bonus_count}")
            print()
        
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_recent_bonuses())
