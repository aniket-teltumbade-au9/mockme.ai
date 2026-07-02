from pydantic import BaseModel, Field


class FestivalBonusRequest(BaseModel):
    """Request model for festival bonus distribution endpoint."""
    bonus_amount: int = Field(..., gt=0, description="Positive integer amount of bonus credits to award each user")


class FestivalBonusResponse(BaseModel):
    """Response model for festival bonus distribution endpoint."""
    success: bool = Field(..., description="Whether the bonus distribution was successful")
    users_awarded: int = Field(..., description="Number of users who received the bonus")
    total_credits_distributed: int = Field(..., description="Total credits distributed across all users")
    emails_sent: int = Field(..., description="Number of notification emails successfully sent")
    message: str = Field(..., description="Human-readable status message")
