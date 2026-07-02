import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import certifi

load_dotenv()

async def check_correct_db():
    MONGODB_URL = os.getenv("MONGODB_URL")
    client = AsyncIOMotorClient(
        MONGODB_URL, 
        tlsCAFile=certifi.where(),
        tls=True,
        connectTimeoutMS=30000,
        serverSelectionTimeoutMS=30000
    )
    
    # Check BOTH databases
    db_correct = client.mockme_ai_db
    db_old = client.mockme_db
    
    try:
        print("="*80)
        print("DATABASE: mockme_ai_db (CORRECT - used by app)")
        print("="*80)
        
        total_users = await db_correct.users.count_documents({})
        print(f"Total users: {total_users}\n")
        
        users = await db_correct.users.find({}).to_list(None)
        for i, user in enumerate(users, 1):
            print(f"{i}. {user.get('user_id')}")
            print(f"   Credits: {user.get('credits', 0)}")
            print(f"   Status: {user.get('status', 'NONE')}")
        
        print("\n" + "="*80)
        print("FESTIVAL BONUS DISTRIBUTION (mockme_ai_db)")
        print("="*80)
        
        # Check festival bonus query
        matching = await db_correct.users.find({
            "$or": [
                {"status": "Active"},
                {"status": {"$exists": False}}
            ]
        }).to_list(None)
        print(f"Users matching festival bonus query: {len(matching)}\n")
        
        for user in matching:
            print(f"  - {user.get('user_id')}: {user.get('credits', 0)} credits")
        
        # Check ledger
        print("\n" + "-"*80)
        ledger_count = await db_correct.credit_ledger.count_documents({"type": "FESTIVAL_BONUS"})
        print(f"Festival bonus entries in ledger: {ledger_count}")
        
        print("\n" + "="*80)
        print("DATABASE: mockme_db (OLD - no longer used)")
        print("="*80)
        
        total_users_old = await db_old.users.count_documents({})
        print(f"Total users: {total_users_old}")
        
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(check_correct_db())
