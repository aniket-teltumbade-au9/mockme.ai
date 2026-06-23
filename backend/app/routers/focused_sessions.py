from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File
from typing import List, Optional
from datetime import datetime, timezone
from app.services.auth import get_current_user
from app.services.database import db, get_session, get_user_progress
import uuid

router = APIRouter(prefix="/api/session", tags=["focused-sessions"])

@router.post("/start-focused")
async def start_focused_interview(
    previous_session_id: str = Form(...),
    focus_gaps: List[str] = Form(...),
    persona: Optional[str] = Form(None),
    voice_lang: Optional[str] = Form("en-in"),
    current_user: dict = Depends(get_current_user),
):
    """
    Start a focused interview targeting specific gaps from a previous session.
    
    This endpoint allows users to retry an interview with specific focus areas,
    enabling targeted practice on identified weaknesses.
    """
    user_id = current_user["user_id"]
    
    try:
        # Fetch previous session to get context
        previous_session = await get_session(previous_session_id)
        if not previous_session:
            raise HTTPException(status_code=404, detail="Previous session not found")
        
        if previous_session.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Session does not belong to authenticated user")
        
        # Validate focus_gaps
        if not focus_gaps or len(focus_gaps) == 0:
            raise HTTPException(status_code=400, detail="Must select at least one gap to focus on")
        
        if len(focus_gaps) > 10:
            raise HTTPException(status_code=400, detail="Cannot focus on more than 10 gaps")
        
        # Create new session
        session_id = str(uuid.uuid4())
        
        # Build focus context string
        focus_context = ", ".join(focus_gaps)
        
        # Prepare original JD with focus annotation
        original_jd = previous_session.get("jd", "")
        focused_jd = (
            f"{original_jd}\n\n"
            f"[FOCUSED RETRY]: This is a targeted re-interview focusing specifically on these areas "
            f"where the candidate previously struggled:\n"
            f"• {focus_context}\n\n"
            f"Interviewer: Probe deeper on these topics. Ask follow-up questions that really test understanding. "
            f"Challenge assumptions and look for concrete examples. This is a focused assessment."
        )
        
        # Store focused session metadata
        focused_session_data = {
            "sessionId": session_id,
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc),
            "status": "active",
            "jd": focused_jd,
            "persona": persona,
            "voice_lang": voice_lang or "en-in",
            "is_focused_retry": True,
            "previous_session_id": previous_session_id,
            "focus_gaps": focus_gaps,
            "day_number": previous_session.get("day_number", 1),
            "performance_score": 50.0,
            "history": [],
            "tts_clips": [],
            "currentState": "STATE_0",
            "audio_duration_accumulator": 0.0,
        }
        
        await db.interviews.insert_one(focused_session_data)
        
        return {
            "sessionId": session_id,
            "focusedContext": f"Focused on: {focus_context}",
            "previousSessionId": previous_session_id,
            "focusGaps": focus_gaps,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start focused session: {str(e)}")

@router.get("/focused-sessions/history")
async def get_focused_sessions_history(
    current_user: dict = Depends(get_current_user),
):
    """Get list of all focused retry sessions for the user."""
    user_id = current_user["user_id"]
    
    try:
        cursor = db.interviews.find({
            "user_id": user_id,
            "is_focused_retry": True
        }).sort("created_at", -1).limit(20)
        
        sessions = []
        async for session in cursor:
            sessions.append({
                "sessionId": session.get("sessionId"),
                "created_at": session.get("created_at"),
                "previous_session_id": session.get("previous_session_id"),
                "focus_gaps": session.get("focus_gaps", []),
                "finalized": session.get("finalized", False),
                "analysis": session.get("analysis"),
            })
        
        return sessions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch focused sessions: {str(e)}")

@router.get("/session/{session_id}/focused-info")
async def get_focused_session_info(
    session_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get focused retry information for a session."""
    user_id = current_user["user_id"]
    
    try:
        session = await get_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        if session.get("user_id") != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        if not session.get("is_focused_retry"):
            raise HTTPException(status_code=400, detail="This is not a focused retry session")
        
        return {
            "sessionId": session_id,
            "previous_session_id": session.get("previous_session_id"),
            "focus_gaps": session.get("focus_gaps", []),
            "created_at": session.get("created_at"),
            "finalized": session.get("finalized", False),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch focused session info: {str(e)}")
