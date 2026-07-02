from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from app.services.database import db
from bson import ObjectId

class CreditService:
    WELCOME_BONUS = 10
    DAILY_VISIT_REWARD = 1
    STREAK_THRESHOLD = 5
    STREAK_BONUS = 3
    INTERVIEW_COST = 2
    INTERVIEW_COMPLETION_REWARD = 3
    PERFORMANCE_JACKPOT = 3
    DECAY_THRESHOLD_DAYS = 5
    DECAY_AMOUNT = -1

    @staticmethod
    async def add_credits(user_id: str, amount: int, credit_type: str, reference_id: Optional[str] = None):
        """
        Atomically adds credits to a user's account and records the transaction in the ledger.
        """
        # Update user balance and status
        # If credits become > 0, status is no longer 'Suspended'
        update_query = {"$inc": {"credits": amount}}
        
        # Use return_document=True with return_new=True to get the UPDATED document
        user = await db.users.find_one_and_update(
            {"user_id": user_id},
            update_query,
            return_document=True,
            upsert=True
        )
        
        # find_one_and_update returns the document BEFORE the update by default
        # We need to fetch the updated document or calculate the new balance manually
        updated_user = await db.users.find_one({"user_id": user_id})
        new_balance = updated_user.get("credits", 0) if updated_user else 0
        status = updated_user.get("status", "Active") if updated_user else "Active"
        
        if new_balance > 0 and status == "Suspended":
            await db.users.update_one({"user_id": user_id}, {"$set": {"status": "Active"}})
        elif new_balance <= 0:
            await db.users.update_one({"user_id": user_id}, {"$set": {"status": "Suspended"}})

        # Record in ledger
        ledger_entry = {
            "user_id": user_id,
            "amount": amount,
            "type": credit_type,
            "timestamp": datetime.now(timezone.utc),
            "reference_id": reference_id
        }
        await db.credit_ledger.insert_one(ledger_entry)
        
        return new_balance

    @staticmethod
    async def deduct_credits(user_id: str, amount: int, credit_type: str, reference_id: Optional[str] = None) -> bool:
        """
        Atomically deducts credits. Returns True if successful, False if insufficient funds.
        """
        # Ensure user has enough credits
        result = await db.users.find_one_and_update(
            {"user_id": user_id, "credits": {"$gte": amount}},
            {"$inc": {"credits": -amount}},
            return_document=True
        )
        
        if not result:
            return False
        
        new_balance = result.get("credits", 0)
        if new_balance <= 0:
            await db.users.update_one({"user_id": user_id}, {"$set": {"status": "Suspended"}})
        
        # Record in ledger
        ledger_entry = {
            "user_id": user_id,
            "amount": -amount,
            "type": credit_type,
            "timestamp": datetime.now(timezone.utc),
            "reference_id": reference_id
        }
        await db.credit_ledger.insert_one(ledger_entry)
        
        return True

    @staticmethod
    async def process_daily_visit(user_id: str) -> Dict[str, Any]:
        """
        Handles daily check-in: +1 credit, streak tracking, and streak bonuses.
        """
        now = datetime.now(timezone.utc)
        today = now.date()
        
        user = await db.users.find_one({"user_id": user_id})
        if not user:
            # Welcome Bonus for new users
            await CreditService.add_credits(user_id, CreditService.WELCOME_BONUS, "WELCOME_BONUS")
            # Create user record
            await db.users.insert_one({
                "user_id": user_id, 
                "credits": CreditService.WELCOME_BONUS, 
                "visit_streak": 1, 
                "last_visit_date": now,
                "status": "Active"
            })
            return {"balance": CreditService.WELCOME_BONUS, "streak": 1}

        last_visit_str = user.get("last_visit_date")
        last_visit_date = None
        if last_visit_str:
            # Handle both string and datetime from MongoDB
            if isinstance(last_visit_str, str):
                from dateutil import parser
                last_visit_date = parser.parse(last_visit_str).date()
            else:
                last_visit_date = last_visit_str.date()

        if last_visit_date == today:
            # Already visited today
            return {"balance": user.get("credits", 0), "streak": user.get("visit_streak", 0)}

        # Update streak
        streak = user.get("visit_streak", 0)
        if last_visit_date == today - timedelta(days=1):
            streak += 1
        else:
            streak = 1

        # Award daily credit
        await CreditService.add_credits(user_id, CreditService.DAILY_VISIT_REWARD, "DAILY_VISIT")
        
        # Streak bonus
        bonus_awarded = False
        if streak == CreditService.STREAK_THRESHOLD:
            await CreditService.add_credits(user_id, CreditService.STREAK_BONUS, "STREAK_BONUS")
            bonus_awarded = True

        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"visit_streak": streak, "last_visit_date": now}}
        )
        
        updated_user = await db.users.find_one({"user_id": user_id})
        return {
            "balance": updated_user.get("credits", 0), 
            "streak": streak, 
            "bonus_awarded": bonus_awarded
        }

    @staticmethod
    async def handle_interview_start(user_id: str, session_id: str) -> bool:
        """
        Deducts cost to start an interview.
        """
        success = await CreditService.deduct_credits(
            user_id, 
            CreditService.INTERVIEW_COST, 
            "INTERVIEW_START", 
            session_id
        )
        if success:
            await db.users.update_one(
                {"user_id": user_id}, 
                {"$set": {"last_interview_date": datetime.now(timezone.utc), "status": "Active"}}
            )
        return success

    @staticmethod
    async def handle_interview_complete(user_id: str, session_id: str, hire_verdict: Optional[str] = None) -> int:
        """
        Awards completion credits and performance jackpot.
        """
        total_reward = CreditService.INTERVIEW_COMPLETION_REWARD
        reward_type = "INTERVIEW_COMPLETE"
        
        if hire_verdict == "Successful Hire":
            total_reward += CreditService.PERFORMANCE_JACKPOT
            reward_type = "INTERVIEW_JACKPOT"
            
        return await CreditService.add_credits(user_id, total_reward, reward_type, session_id)

    @staticmethod
    async def apply_daily_decay():
        """
        Cron job: Find users who haven't interviewed in 5 days, mark as Rusty, and deduct 1 credit.
        """
        now = datetime.now(timezone.utc)
        threshold_date = now - timedelta(days=CreditService.DECAY_THRESHOLD_DAYS)
        
        # Find users who:
        # 1. Last interview was > 5 days ago (or never interviewed)
        # 2. Are not already "Suspended" (can't decay below 0 meaningfully if already suspended)
        # Actually, decay can hit 0.
        
        cursor = db.users.find({
            "$or": [
                {"last_interview_date": {"$lt": threshold_date}},
                {"last_interview_date": {"$exists": False}}
            ],
            "status": {"$ne": "Suspended"}
        })
        
        processed_count = 0
        async for user in cursor:
            user_id = user["user_id"]
            
            # Mark as Rusty
            await db.users.update_one({"user_id": user_id}, {"$set": {"status": "Rusty"}})
            
            # Deduct credit (cap at 0)
            current_credits = user.get("credits", 0)
            if current_credits > 0:
                amount = max(CreditService.DECAY_AMOUNT, -current_credits)
                await CreditService.add_credits(user_id, amount, "SKILL_DECAY")
            
            processed_count += 1
            
        return processed_count
