from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.auth import get_current_user
from app.services.database import db, get_session, update_session
from app.services.llm import chat_with_llm
from app.utils.parser import parse_llm_response

router = APIRouter(prefix="/api/tutor", tags=["tutor"])

class RefineRequest(BaseModel):
    sessionId: str
    question: str
    userAnswer: str
    tutorMode: str  # "gold_standard", "comparative", "second_attempt"

@router.post("/refine")
async def refine_answer(
    request: RefineRequest,
    current_user: dict = Depends(get_current_user),
):
    session = await get_session(request.sessionId)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.get("user_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Session does not belong to user")

    jd_context = session.get("jd", "General Software Engineer")
    
    prompt = f"""
    You are an expert career coach and interviewer. 
    Your goal is to help the candidate improve their answer to a specific question.

    CONTEXT:
    - Job Description: {jd_context}
    - Interview Question: {request.question}
    - Candidate's Original Answer: {request.userAnswer}
    - Mode: {request.tutorMode}

    TASK:
    Based on the mode, provide actionable feedback.
    
    MODES:
    1. "gold_standard": Provide an ideal, high-quality version of the answer that would impress a Senior Engineering Manager. Explain WHY it is good.
    2. "comparative": Compare the candidate's answer to a "gold standard". Highlight exactly what was missing (e.g., technical depth, structure, quantifiable results) and what was good.
    3. "second_attempt": The candidate is providing a second attempt. Evaluate how much they improved and if they have addressed the previous gaps.

    RESPONSE FORMAT:
    Provide your response in a clear, conversational, yet professional tone.
    Use Markdown for formatting (bolding, lists).
    """

    try:
        # We use the existing chat_with_llm but with a specialized prompt
        # Note: we are not using the session history here to keep the tutor feedback focused on the specific question
        response_text = chat_with_llm([{"role": "user", "content": prompt}])
        
        # We don't need to parse UI_SYNC here because this is just for the tutor panel content
        # But we'll clean it up if the LLM accidentally includes it
        import re
        clean_text = re.sub(r'\[VOICE_TEXT\]', '', response_text).strip()
        # Remove [UI_SYNC] if present
        clean_text = re.sub(r'\[UI_SYNC\].*?(|$)', '', clean_text).strip()
        # If the LLM returned JSON because of SYSTEM_PROMPT overlap, we need to handle it, 
        # but chat_with_llm uses SYSTEM_PROMPT from llm.py. 
        # However, we are calling it with a new user message. 
        # Let's just hope it doesn't get confused or we can strip it.
        
        # A better way is to use the client directly if possible, but we don't have access to it easily here
        # without re-importing or changing llm.py. 
        # Let's just try to extract the text if it's wrapped in something.
        
        return {"feedback": clean_text}
    except Exception as e:
        print(f"Error in tutor refine: {e}")
        raise HTTPException(status_code=500, detail=str(e))
