from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from datetime import datetime, timezone
from app.services.database import get_session, get_user, update_session, db
from app.services.dropbox_service import DropboxService
from app.services.analysis_builder import build_groq_session_analysis
from app.services.audio_mixer import mix_audio
import os

router = APIRouter(prefix="/api/interviews", tags=["interviews"])

# ... (rest of router functions)

async def finalize_interview_task(session_id: str, mic_audio_bytes: bytes):
    session = await get_session(session_id)
    if not session:
        return
    user = await get_user(session.get("user_id"))

    # 1. Save mic recording temporarily
    mic_path = f"tmp_{session_id}.webm"
    mixed_path = f"mixed_{session_id}.mp3"
    with open(mic_path, "wb") as f:
        f.write(mic_audio_bytes)

    # 2. Mix with TTS clips
    try:
        await mix_audio(mic_path, session.get("tts_clips", []), mixed_path)
    except Exception as e:
        print(f"Mixing Error: {e}")
        mixed_path = mic_path # Fallback

    # 3. Build Analysis via Groq
    try:
        analysis_payload = await build_groq_session_analysis(session)
    except Exception as e:
        print(f"Analysis Error: {e}")
        analysis_payload = {"error": "Failed to generate analysis"}
        
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # 4. Upload to Dropbox if connected
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

    # Cleanup
    if os.path.exists(mic_path): os.remove(mic_path)
    if os.path.exists(mixed_path) and mixed_path != mic_path: os.remove(mixed_path)


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
