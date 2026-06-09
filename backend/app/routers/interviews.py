from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from datetime import datetime, timezone
from app.services.database import get_session, get_user, update_session, db
from app.services.auth import get_current_user
from app.services.dropbox_service import DropboxService
from app.services.analysis_builder import build_groq_session_analysis
from app.services.audio_mixer import mix_audio
import os

router = APIRouter(prefix="/api/interviews", tags=["interviews"])

# ... (rest of router functions)

async def finalize_interview_task(session_id: str):
    session = await get_session(session_id)
    if not session or not session.get("raw_mic_path"):
        return
        
    user = await get_user(session.get("user_id"))
    mic_path = session["raw_mic_path"]
    mixed_path = f"mixed_{session_id}.mp3"

    # 1. Mix with TTS clips
    try:
        await mix_audio(mic_path, session.get("tts_clips", []), mixed_path)
    except Exception as e:
        print(f"Mixing Error: {e}")
        mixed_path = mic_path # Fallback

    # 2. Build Analysis via Groq
    try:
        analysis_payload = await build_groq_session_analysis(session)
    except Exception as e:
        print(f"Analysis Error: {e}")
        analysis_payload = {"error": "Failed to generate analysis"}
        
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # 3. Upload to Dropbox if connected
    if user.get("dropbox_refresh_token"):
        try:
            service = DropboxService(user["dropbox_refresh_token"])
            with open(mixed_path, "rb") as f:
                mixed_bytes = f.read()
            audio_url, json_url = service.upload_interview(session_id, date_str, mixed_bytes, analysis_payload)
            
            await update_session(session_id, {
                "finalized": True,
                "dropbox_audio_url": audio_url,
                "dropbox_analysis_url": json_url,
                "analysis": analysis_payload,
                "finalization_attempted_at": datetime.now(timezone.utc),
                "finalization_error": None
            })
            
            # SUCCESS CLEANUP: Temporarily disabled (Cleanup will be handled by a scheduled job)
            # if os.path.exists(mic_path): os.remove(mic_path)
            # for clip in session.get("tts_clips", []):
            #     if os.path.exists(clip['path']): os.remove(clip['path'])
                
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
        # Cleanup clips since we are done (Temporarily disabled)
        # for clip in session.get("tts_clips", []):
        #     if os.path.exists(clip['path']): os.remove(clip['path'])

    # Temp cleanup
    if os.path.exists(mixed_path) and mixed_path != mic_path: os.remove(mixed_path)


@router.get("/{session_id}/status")
async def get_interview_status(session_id: str, current_user: dict = Depends(get_current_user)):
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.get("user_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Session does not belong to authenticated user")
    return {"finalized": session.get("finalized", False), "error": session.get("finalization_error")}

@router.post("/{session_id}/finalize")
async def finalize_interview(
    session_id: str,
    background_tasks: BackgroundTasks,
    audio: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.get("user_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Session does not belong to authenticated user")
        
    # Use absolute path to ensure consistency
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    raw_dir = os.path.join(base_dir, "tts_clips")
    os.makedirs(raw_dir, exist_ok=True)
    # Consistent pattern: {sessionId}_mic.mp3
    mic_path = os.path.join(raw_dir, f"{session_id}_mic.mp3")
    
    audio_bytes = await audio.read()
    with open(mic_path, "wb") as f:
        f.write(audio_bytes)
        
    await update_session(session_id, {
        "raw_mic_path": mic_path,
        "finalized": False,
        "finalization_error": None
    })
    
    background_tasks.add_task(finalize_interview_task, session_id)
    return {"success": True, "message": "Finalization started in background"}

@router.post("/{session_id}/refinalize")
async def refinalize_interview(
    session_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
):
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.get("user_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Session does not belong to authenticated user")
        
    mic_path = session.get("raw_mic_path")
    if not mic_path or not os.path.exists(mic_path):
        raise HTTPException(
            status_code=400, 
            detail=f"Raw recording not found at {mic_path}. Re-upload required."
        )
        
    background_tasks.add_task(finalize_interview_task, session_id)
    return {"success": True, "message": "Re-finalization started"}
