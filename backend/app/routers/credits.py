from fastapi import APIRouter, Depends, HTTPException
from app.services.auth import get_current_user
from app.services.credit_service import CreditService
from app.services.database import db
from typing import Dict, Any

router = APIRouter(prefix="/api/credits", tags=["credits"])

@router.post("/claim-daily")
async def claim_daily_visit(current_user: dict = Depends(get_current_user)):
    """Claim daily visit credit and update streak."""
    user_id = current_user["user_id"]
    result = await CreditService.process_daily_visit(user_id)
    return result

@router.get("/status")
async def get_credit_status(current_user: dict = Depends(get_current_user)):
    """Get current balance, streak, and market-readiness status."""
    user_id = current_user["user_id"]
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        # This should not happen if user is authenticated
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "balance": user.get("credits", 0),
        "streak": user.get("visit_streak", 0),
        "status": user.get("status", "Active"),
        "last_visit": user.get("last_visit_date")
    }

@router.post("/cron/daily-skill-decay")
async def trigger_skill_decay():
    """
    Triggered by external cron to handle skill decay for inactive users.
    WARNING: In production, this should be protected by an API key or internal network only.
    """
    processed_count = await CreditService.apply_daily_decay()
    return {"processed_users": processed_count, "status": "success"}
