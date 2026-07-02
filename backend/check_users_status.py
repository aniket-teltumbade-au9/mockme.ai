import asyncio
import os
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import certifi

load_dotenv()

async def comprehensive_check():
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
        # Get all collections
        collections = await db.list_collection_names()
        print(f"Collections in database: {collections}\n")
        
        # Count users
        total_users = await db.users.count_documents({})
        print(f"Total users in collection: {total_users}\n")
        
        # List ALL users with full details
        print("All users in database:")
        print("="*80)
        users = await db.users.find({}).to_list(None)
        for user in users:
            print(f"\nUser ID: {user.get('user_id')}")
            print(f"  Credits: {user.get('credits', 0)}")
            print(f"  Status: {user.get('status', 'NONE')}")
            print(f"  Display Name: {user.get('dropbox_display_name', 'N/A')}")
            print(f"  Dropbox Email: {user.get('dropbox_account_email', 'N/A')}")
            print(f"  Google Email: {user.get('google_account_email', 'N/A')}")
            print(f"  Email: {user.get('email', 'N/A')}")
        
        print("\n" + "="*80)
        print("\nLast 10 ledger entries:")
        ledger = await db.credit_ledger.find({}).sort([("timestamp", -1)]).limit(10).to_list(None)
        for entry in ledger:
            print(f"\n  {entry.get('timestamp')} - {entry.get('user_id')}")
            print(f"    Type: {entry.get('type')}, Amount: {entry.get('amount')}")
        
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(comprehensive_check())
