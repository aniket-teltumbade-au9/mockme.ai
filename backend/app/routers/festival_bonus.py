import os
import logging
from fastapi import APIRouter, HTTPException, Request
from app.models.festival_bonus import FestivalBonusRequest, FestivalBonusResponse
from app.services.credit_service import CreditService
from app.services.email_service import send_email_notification
from app.services.database import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cron", tags=["cron"])


async def check_api_key(request: Request):
    """
    Validates the x-api-key header against CRON_FESTIVAL_API_KEY environment variable.
    
    Raises:
        HTTPException: 401 Unauthorized if API key is missing or invalid
    """
    api_key = request.headers.get("x-api-key")
    expected_key = os.getenv("CRON_FESTIVAL_API_KEY")
    
    if not api_key or api_key != expected_key:
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.post("/festival-bonus")
async def award_festival_bonus(
    payload: FestivalBonusRequest,
    request: Request
) -> FestivalBonusResponse:
    """
    Awards bonus credits to all active users during festival celebrations.
    
    This endpoint:
    1. Validates the x-api-key header
    2. Validates the bonus_amount payload (must be positive integer)
    3. Fetches all users with status="Active" from db.users
    4. Awards credits to each user via CreditService.add_credits()
    5. Sends email notifications to each user
    6. Logs errors and continues on individual user failures
    7. Returns summary of awards and emails sent
    
    Args:
        payload: FestivalBonusRequest with bonus_amount (positive integer)
        request: FastAPI Request object to access headers
        
    Returns:
        FestivalBonusResponse with success status, awarded counts, and message
        
    Raises:
        HTTPException: 401 if API key is invalid, 400 if bonus_amount is invalid
    """
    # Validate API key
    await check_api_key(request)
    
    # Validate bonus_amount (Pydantic will handle Field validation, but we can add extra logging)
    if payload.bonus_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="bonus_amount must be a positive integer (>0)"
        )
    
    bonus_amount = payload.bonus_amount
    awarded_count = 0
    total_credits_distributed = 0
    emails_sent = 0
    errors_encountered = []
    
    try:
        # Fetch all users with status="Active" OR missing status field (treat as active)
        # This handles legacy users that don't have status field set yet
        users = await db.users.find({
            "$or": [
                {"status": "Active"},
                {"status": {"$exists": False}}
            ]
        }).to_list(None)
        logger.info(f"Processing festival bonus for {len(users)} active users with bonus amount: {bonus_amount}")
        
        # Iterate through each user
        for user in users:
            user_id = user.get("user_id")
            
            try:
                # Award credits via CreditService (atomic with ledger entry)
                new_balance = await CreditService.add_credits(
                    user_id=user_id,
                    amount=bonus_amount,
                    credit_type="FESTIVAL_BONUS",
                    reference_id="festival_bonus"
                )
                
                awarded_count += 1
                total_credits_distributed += bonus_amount
                logger.info(f"Awarded {bonus_amount} credits to user {user_id}, new balance: {new_balance}")
                
                # Fetch updated user document for email notification
                user_with_updated_balance = await db.users.find_one({"user_id": user_id})
                
                if user_with_updated_balance:
                    # Send email notification
                    email_sent = await send_email_notification(user_with_updated_balance, bonus_amount)
                    if email_sent:
                        emails_sent += 1
                        logger.info(f"Email notification sent to user {user_id}")
                    else:
                        logger.warning(f"Email notification failed for user {user_id}")
                else:
                    logger.warning(f"Could not fetch updated user document for {user_id}")
                
            except Exception as e:
                error_msg = f"Error awarding bonus to user {user_id}: {str(e)}"
                logger.error(error_msg)
                errors_encountered.append(error_msg)
                # Continue processing other users
                continue
        
        # Build response message
        message = f"Festival bonus successfully distributed to {awarded_count} users"
        if errors_encountered:
            message += f" ({len(errors_encountered)} errors encountered)"
            logger.warning(f"Festival bonus distribution completed with {len(errors_encountered)} errors: {errors_encountered}")
        
        return FestivalBonusResponse(
            success=True,
            users_awarded=awarded_count,
            total_credits_distributed=total_credits_distributed,
            emails_sent=emails_sent,
            message=message
        )
        
    except Exception as e:
        error_msg = f"Unexpected error during festival bonus distribution: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(
            status_code=500,
            detail=error_msg
        )
