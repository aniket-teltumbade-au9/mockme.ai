from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks
from datetime import datetime, timezone
from app.services.database import get_session, get_user, update_session, db
from app.services.auth import get_current_user
from app.services.dropbox_service import DropboxService
from app.services.analysis_builder import build_groq_session_analysis
from app.services.audio_mixer import mix_audio
from app.services.storage import get_storage_dir, get_mic_path, get_mixed_path
import os

router = APIRouter(prefix="/api/interviews", tags=["interviews"])

# ... (rest of router functions)

async def finalize_interview_task(session_id: str, mic_path_override: str | None = None):
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

    # Determine mic path: use override if provided, else fall back to DB
    mic_path = mic_path_override or session.get("raw_mic_path")
    if mic_path and not os.path.exists(mic_path):
        print(f"WARN: mic_path from DB/override doesn't exist: {mic_path}")
        mic_path = None

    # If no mic path, try to build it from turn files on-the-fly
    if not mic_path:
        print(f"DEBUG: No mic_path found. Attempting to build from turn files...")
        try:
            from app.services.storage import concatenate_turn_audio
            # Count how many turn files exist
            turn_count = 0
            while True:
                tp = os.path.join(storage_dir, f"{session_id}_turn_{turn_count}.webm")
                if os.path.exists(tp):
                    turn_count += 1
                else:
                    break
            if turn_count > 0:
                mic_path = concatenate_turn_audio(session_id)
                if mic_path and os.path.exists(mic_path):
                    print(f"DEBUG: Built mic from {turn_count} turn files -> {mic_path}")
                    # Persist so future retries find it
                    await update_session(session_id, {"raw_mic_path": mic_path})
                else:
                    mic_path = None
            else:
                print(f"WARN: No turn files found to build mic")
        except Exception as e:
            print(f"ERROR building mic from turns: {e}")
            mic_path = None

    has_mic = mic_path and os.path.exists(mic_path)
    print(f"DEBUG: Final mic_path={mic_path} exists={has_mic}")
    if has_mic:
        print(f"DEBUG: mic file size={os.path.getsize(mic_path)} bytes")

    mixed_path = None

    # Mix with TTS clips if mic recording exists
    if has_mic:
        try:
            mixed_path = get_mixed_path(session_id)
            print(f"DEBUG: Mixing audio mic={mic_path} + {len(tts_clips)} tts clips -> {mixed_path}")
            await mix_audio(mic_path, tts_clips, mixed_path)
            print(f"DEBUG: Mixed audio saved -> {mixed_path} ({os.path.getsize(mixed_path)} bytes)")
        except Exception as e:
            print(f"MIXING ERROR: {e}")
            mixed_path = mic_path
    else:
        print(f"WARN: No mic recording available for mixing session {session_id}")

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
        print(f"DEBUG: Dropbox connected - uploading...")
        try:
            service = DropboxService(user["dropbox_refresh_token"])
            audio_url = None
            json_url = None
            upload_audio_path = mixed_path if (mixed_path and os.path.exists(mixed_path)) else mic_path
            if upload_audio_path and os.path.exists(upload_audio_path):
                with open(upload_audio_path, "rb") as f:
                    mixed_bytes = f.read()
                print(f"DEBUG: Uploading {len(mixed_bytes)} bytes to Dropbox...")
                audio_url, json_url = service.upload_interview(session_id, date_str, mixed_bytes, analysis_payload)
                print(f"DEBUG: Dropbox upload complete. audio_url={audio_url}")

            update_payload = {
                "finalized": True,
                "analysis": analysis_payload,
                "finalization_attempted_at": datetime.now(timezone.utc),
                "finalization_error": None
            }
            if audio_url:
                update_payload["dropbox_audio_url"] = audio_url
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

    background_tasks.add_task(finalize_interview_task, session_id, mic_path)
    return {"success": True, "message": "Finalization started in background"}

@router.post("/{session_id}/refinalize")
async def refinalize_interview(
    session_id: str,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user),
    audio: UploadFile = File(None),
):
    session = await get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.get("user_id") != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Session does not belong to authenticated user")

    mic_path = None
    if audio:
        audio_bytes = await audio.read()
        audio_size = len(audio_bytes)
        print(f"DEBUG: refinalize received {audio_size} bytes for session {session_id}")
        if audio_size > 0:
            mic_path = get_mic_path(session_id)
            with open(mic_path, "wb") as f:
                f.write(audio_bytes)
            print(f"DEBUG: Saved re-uploaded mic to {mic_path} ({audio_size} bytes)")
    else:
        # No audio uploaded — rebuild combined mic from turn files
        print(f"DEBUG: refinalize rebuilding mic from turn files for session {session_id}")
        try:
            from app.services.storage import concatenate_turn_audio
            built = concatenate_turn_audio(session_id)
            if built and os.path.exists(built):
                mic_path = built
                print(f"DEBUG: Rebuilt mic from turns -> {mic_path} ({os.path.getsize(mic_path)} bytes)")
        except Exception as e:
            print(f"ERROR rebuilding mic on refinalize: {e}")

    await update_session(session_id, {
        "raw_mic_path": mic_path,
        "finalization_error": None if mic_path else "No mic audio available",
    })
    background_tasks.add_task(finalize_interview_task, session_id, mic_path)
    return {"success": True, "message": "Re-finalization started"}
