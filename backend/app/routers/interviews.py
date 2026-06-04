from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from datetime import datetime, timezone
from app.services.database import get_session, get_user, update_session, db
from app.services.dropbox_service import DropboxService
from app.services.analysis_builder import build_groq_session_analysis

router = APIRouter(prefix="/api/interviews", tags=["interviews"])

@router.get("/history")
async def get_interview_history(user_id: str):
    cursor = db.interviews.find({"user_id": user_id}).sort("created_at", -1)
    interviews = await cursor.to_list(length=100)
    for i in interviews:
        i["_id"] = str(i["_id"])
    return interviews

async def finalize_interview_task(session_id: str, audio_bytes: bytes):
    session = await get_session(session_id)
    if not session:
        return
    user = await get_user(session.get("user_id"))

    # 1. Build Analysis via Groq
    try:
        analysis_payload = await build_groq_session_analysis(session)
    except Exception as e:
        print(f"Analysis Error: {e}")
        analysis_payload = {"error": "Failed to generate analysis"}
        
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # 2. Upload to Dropbox if connected
    if user.get("dropbox_refresh_token"):
        try:
            service = DropboxService(user["dropbox_refresh_token"])
            audio_url, json_url = service.upload_interview(session_id, date_str, audio_bytes, analysis_payload)
            
            await update_session(session_id, {
                "finalized": True,
                "dropbox_audio_url": audio_url,
                "dropbox_analysis_url": json_url,
                "analysis": analysis_payload,
                "finalization_attempted_at": datetime.now(timezone.utc)
            })
        except Exception as e:
            print(f"Dropbox Upload Error: {e}")
            await update_session(session_id, {
                "finalized": False,
                "finalization_error": str(e),
                "finalization_attempted_at": datetime.now(timezone.utc),
                "analysis": analysis_payload
            })
    else:
        # Save analysis even if dropbox is not connected
        await update_session(session_id, {
            "finalized": True,
            "analysis": analysis_payload,
            "finalization_attempted_at": datetime.now(timezone.utc)
        })

@router.get("/{session_id}/status")
async def get_interview_status(session_id: str):
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"finalized": session.get("finalized", False), "error": session.get("finalization_error")}

@router.post("/{session_id}/finalize")
async def finalize_interview(session_id: str, background_tasks: BackgroundTasks, audio: UploadFile = File(...)):
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    audio_bytes = await audio.read()
    background_tasks.add_task(finalize_interview_task, session_id, audio_bytes)
    
    return {"success": True, "message": "Finalization started in background"}
