import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import certifi

load_dotenv()

async def verify_ledger():
    MONGODB_URL = os.getenv("MONGODB_URL")
    client = AsyncIOMotorClient(
        MONGODB_URL, 
        tlsCAFile=certifi.where(),
        tls=True,
        connectTimeoutMS=30000,
        serverSelectionTimeoutMS=30000
    )
    db = client.mockme_db
    
    try:
        # Check festival bonus entries
        festival_entries = await db.credit_ledger.find({"type": "FESTIVAL_BONUS"}).to_list(None)
        print(f"Festival Bonus ledger entries: {len(festival_entries)}\n")
        
        for entry in festival_entries:
            print(f"  User: {entry.get('user_id')}")
            print(f"  Amount: {entry.get('amount')}")
            print(f"  Type: {entry.get('type')}")
            print(f"  Timestamp: {entry.get('timestamp')}")
            print(f"  Reference: {entry.get('reference_id')}\n")
            
        print("="*60)
        print("Total festival bonus credits distributed:", sum(e.get('amount', 0) for e in festival_entries))
        
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(verify_ledger())
