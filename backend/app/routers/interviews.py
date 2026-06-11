from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from datetime import datetime, timezone
from app.services.database import get_session, get_user, update_session, db
from app.services.auth import get_current_user
from app.services.dropbox_service import DropboxService
from app.services.analysis_builder import build_groq_session_analysis
from app.services.storage import get_storage_dir, get_final_video_path, build_final_interview_video
import os

router = APIRouter(prefix="/api/interviews", tags=["interviews"])

# ... (rest of router functions)

async def finalize_interview_task(session_id: str):
    print(f"\n=== FINALIZE TASK START session={session_id} ===")
    session = await get_session(session_id)
    if not session:
        print(f"WARN: finalize_interview_task: session {session_id} not found in DB")
        return

    user = await get_user(session.get("user_id"))
    tts_clips = session.get("tts_clips", [])

    storage_dir = get_storage_dir()

    # List all recordings for debug
    print(f"DEBUG: All files in {storage_dir} for {session_id}:")
    try:
        for fname in sorted(os.listdir(storage_dir)):
            if session_id in fname:
                fpath = os.path.join(storage_dir, fname)
                print(f"DEBUG:   {fname} ({os.path.getsize(fpath)} bytes)")
    except Exception as e:
        print(f"DEBUG: Could not list storage dir: {e}")

    final_video_path = None

    # Build final interview video by concatenating all clips in chronological order
    # avatar_0.mp4 → user_1.webm → avatar_1.mp4 → user_2.webm → avatar_2.mp4 → ...
    try:
        final_video_path = get_final_video_path(session_id)
        print(f"DEBUG: Building final interview video -> {final_video_path}")
        built = build_final_interview_video(session_id, tts_clips, final_video_path)
        if built:
            print(f"DEBUG: Final interview video built -> {built}")
        else:
            print(f"WARN: Could not build final interview video")
            final_video_path = None
    except Exception as e:
        print(f"FINAL VIDEO BUILD ERROR: {e}")
        final_video_path = None

    # Build Analysis via Groq
    print(f"DEBUG: Building analysis via Groq...")
    try:
        analysis_payload = await build_groq_session_analysis(session)
        print(f"DEBUG: Analysis built successfully")
    except Exception as e:
        print(f"ANALYSIS ERROR: {e}")
        analysis_payload = {"error": "Failed to generate analysis"}

    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # Upload to Dropbox if connected
    if user.get("dropbox_refresh_token"):
        print(f"DEBUG: Dropbox connected - uploading video...")
        try:
            service = DropboxService(user["dropbox_refresh_token"])
            video_url = None
            json_url = None
            upload_path = final_video_path if (final_video_path and os.path.exists(final_video_path)) else None
            if upload_path and os.path.exists(upload_path):
                with open(upload_path, "rb") as f:
                    video_bytes = f.read()
                print(f"DEBUG: Uploading {len(video_bytes)} bytes to Dropbox...")
                video_url, json_url = service.upload_interview(session_id, date_str, video_bytes, analysis_payload)
                print(f"DEBUG: Dropbox upload complete. video_url={video_url}")

            update_payload = {
                "finalized": True,
                "analysis": analysis_payload,
                "finalization_attempted_at": datetime.now(timezone.utc),
                "finalization_error": None
            }
            if video_url:
                update_payload["dropbox_video_url"] = video_url
            if json_url:
                update_payload["dropbox_analysis_url"] = json_url
            await update_session(session_id, update_payload)
            print(f"DEBUG: Session {session_id} finalized successfully in DB")

        except Exception as e:
            print(f"DROPBOX UPLOAD ERROR: {e}")
            await update_session(session_id, {
                "finalized": False,
                "finalization_error": str(e),
                "finalization_attempted_at": datetime.now(timezone.utc),
                "analysis": analysis_payload
            })
    else:
        print(f"DEBUG: Dropbox not connected - saving analysis only")
        await update_session(session_id, {
            "finalized": True,
            "analysis": analysis_payload,
            "finalization_attempted_at": datetime.now(timezone.utc)
        })

    print(f"=== FINALIZE TASK END session={session_id} ===\n")


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

    audio_bytes = await audio.read()
    audio_size = len(audio_bytes)
    print(f"DEBUG: finalize_interview received {audio_size} bytes for session {session_id}")

    if audio_size == 0:
        print(f"WARNING: Empty audio blob for session {session_id}, skipping save")
        raise HTTPException(status_code=400, detail="Empty recording. Please try again.")

    mic_path = get_mic_path(session_id)
    with open(mic_path, "wb") as f:
        f.write(audio_bytes)
    print(f"DEBUG: Saved mic recording to {mic_path} ({audio_size} bytes)")

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

    await update_session(session_id, {
        "finalization_error": None,
    })
    background_tasks.add_task(finalize_interview_task, session_id)
    return {"success": True, "message": "Re-finalization started"}
