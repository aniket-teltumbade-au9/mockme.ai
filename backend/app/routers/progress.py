from fastapi import APIRouter, Depends, HTTPException
from app.services.database import db, get_user_progress
from app.services.auth import get_current_user
from typing import List, Dict, Any
from datetime import datetime, timezone

router = APIRouter(prefix="/api/user/progress", tags=["progress"])

@router.get("/detailed")
async def get_detailed_progress(current_user: dict = Depends(get_current_user)):
    """Get detailed progress including session summaries and resolved gaps."""
    user_id = current_user["user_id"]
    
    try:
        # Fetch progress document from MongoDB
        progress = await db.progress.find_one({"user_id": user_id})
        
        if not progress:
            return {
                "user_id": user_id,
                "total_interviews": 0,
                "sessions": [],
                "average_performance_score": 0.0,
                "gaps_resolved_count": 0,
                "total_gaps_identified": 0,
            }
        
        # Extract session summaries
        session_summaries = progress.get("session_summaries", [])
        
        # Calculate metrics
        total_gaps = len(set(gap for summary in session_summaries for gap in summary.get("gaps", [])))
        
        resolved_count = 0
        for summary in session_summaries:
            if summary.get("resolved_in_session"):
                resolved_count += 1
        
        avg_score = progress.get("average_performance_score", 0.0)
        
        # Build response with session details
        sessions = []
        for summary in session_summaries:
            sessions.append({
                "session_id": summary.get("session_id"),
                "created_at": summary.get("created_at"),
                "gaps": summary.get("gaps", []),
                "resolved_gaps": [g for g in summary.get("gaps", []) 
                                   if _was_gap_resolved(g, summary.get("created_at"), session_summaries)],
                "performance_score": summary.get("performance_score", 0.0),
                "hire_verdict": summary.get("hire_verdict"),
                "resolved_in_session": summary.get("resolved_in_session"),
            })
        
        return {
            "user_id": user_id,
            "total_interviews": progress.get("total_interviews", 0),
            "sessions": sessions,
            "average_performance_score": avg_score,
            "gaps_resolved_count": resolved_count,
            "total_gaps_identified": total_gaps,
            "skill_gaps_history": progress.get("skill_gaps_history", []),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch progress: {str(e)}")

@router.get("")
async def get_progress(current_user: dict = Depends(get_current_user)):
    """Get basic progress summary."""
    user_id = current_user["user_id"]
    progress = await get_user_progress(user_id)
    return progress

def _was_gap_resolved(gap: str, session_date: datetime, all_summaries: List[Dict[str, Any]]) -> bool:
    """Check if a gap was resolved in a subsequent session."""
    if not session_date:
        return False
    
    for summary in all_summaries:
        summary_date = summary.get("created_at")
        if summary_date and summary_date > session_date:
            # If gap is NOT in subsequent session, it was resolved
            if gap not in summary.get("gaps", []):
                return True
    
    return False
