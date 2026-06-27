from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, BackgroundTasks, Form
from datetime import datetime, timezone
from typing import Optional
from app.services.database import get_session, get_user, update_session, db
from app.services.auth import get_current_user
from app.services.dropbox_service import DropboxService
from app.services.analysis_builder import build_groq_session_analysis
from app.services.storage import get_storage_dir, get_mic_path, get_mixed_path, build_final_interview_audio
from app.services.video_storage import VideoStorageService
from app.models.video import VideoMetadata
from app.logger import logger
import os

router = APIRouter(prefix="/api/interviews", tags=["interviews"])

# ... (rest of router functions)

async def finalize_interview_task(session_id: str, mic_path_override: Optional[str] = None):
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

    # Build final interview audio by concatenating all clips in chronological order
    # (sarah_0 → turn_1 → sarah_1 → turn_2 → sarah_2 → ...)
    # This replaces the broken overlay-based mix that created overlapping chaos.
    try:
        mixed_path = get_mixed_path(session_id)
        print(f"DEBUG: Building final interview audio chronologically -> {mixed_path}")
        built = build_final_interview_audio(session_id, tts_clips, mixed_path)
        if built:
            print(f"DEBUG: Final interview audio built -> {built}")
        else:
            print(f"WARN: Could not build final interview audio (no clips?)")
            mixed_path = None
    except Exception as e:
        print(f"FINAL AUDIO BUILD ERROR: {e}")
        mixed_path = None

    # Fallback to combined mic if final audio couldn't be built
    if not mixed_path and has_mic:
        mixed_path = mic_path
        print(f"DEBUG: Falling back to combined mic -> {mixed_path}")

    # Build Analysis via Groq
    print(f"DEBUG: Building analysis via Groq...")
    try:
        analysis_payload = await build_groq_session_analysis(session)
        
        # Add remediation plan if it exists in session
        if session.get("remediation_plan"):
            analysis_payload["remediation_plan"] = session["remediation_plan"]
            print(f"DEBUG: Added remediation_plan to analysis")
        
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


@router.post("/{sessionId}/upload-video")
async def upload_video(
    sessionId: str,
    video: UploadFile = File(...),
    duration: float = Form(...),
    codec: str = Form(...),
    width: int = Form(...),
    height: int = Form(...),
    frameRate: float = Form(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload recorded video blob to storage.
    
    Accepts multipart/form-data with video file and metadata. Integrates with
    VideoStorageService to store video in Dropbox and extract additional metadata.
    
    Args:
        sessionId: Unique session identifier
        video: Binary video file blob
        duration: Recording duration in seconds
        codec: Video codec (e.g., 'h264', 'vp8')
        width: Frame width in pixels
        height: Frame height in pixels
        frameRate: Frames per second
        current_user: Authenticated user from dependency
        
    Returns:
        {
            "success": bool,
            "videoPath": str,
            "videoUrl": str,
            "fileSize": int,
            "duration": float
        }
        
    Raises:
        HTTPException: 400 (invalid video), 403 (unauthorized), 
                      404 (session not found), 413 (file too large), 
                      500 (storage error)
    """
    try:
        # Verify session exists and belongs to current user
        session = await get_session(sessionId)
        if not session:
            logger.warning(f"Upload video: session {sessionId} not found")
            raise HTTPException(status_code=404, detail="Session not found")
        
        if session.get("user_id") != current_user["user_id"]:
            logger.warning(
                f"Upload video: user {current_user['user_id']} "
                f"unauthorized for session {sessionId}"
            )
            raise HTTPException(
                status_code=403, 
                detail="Session does not belong to authenticated user"
            )
        
        # Read video blob from upload
        video_bytes = await video.read()
        
        if not video_bytes or len(video_bytes) == 0:
            logger.warning(f"Upload video: empty video blob for session {sessionId}")
            raise HTTPException(status_code=400, detail="Video blob cannot be empty")
        
        # Check file size limit (500 MB)
        max_size = 500 * 1024 * 1024  # 500 MB in bytes
        if len(video_bytes) > max_size:
            logger.warning(
                f"Upload video: file too large for session {sessionId} "
                f"({len(video_bytes)} bytes, max {max_size})"
            )
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is 500 MB"
            )
        
        logger.info(
            f"Upload video: received video for session {sessionId} "
            f"({len(video_bytes)} bytes)"
        )
        
        # Get user's Dropbox credentials
        user = await get_user(current_user["user_id"])
        if not user or not user.get("dropbox_refresh_token"):
            logger.error(
                f"Upload video: no Dropbox credentials for user {current_user['user_id']}"
            )
            raise HTTPException(
                status_code=500,
                detail="Dropbox storage not configured for user"
            )
        
        # Initialize VideoStorageService and upload
        try:
            video_storage = VideoStorageService(user["dropbox_refresh_token"])
            video_url, metadata = video_storage.uploadVideo(video_bytes, sessionId)
            logger.info(
                f"Upload video: successfully uploaded video for session {sessionId} "
                f"to URL {video_url}"
            )
            
            # Build VideoMetadata model for storage
            video_metadata = VideoMetadata(
                videoUrl=video_url,
                duration=metadata.get("duration", duration),
                fileSize=metadata.get("fileSize", len(video_bytes)),
                codec=metadata.get("codec", codec),
                width=metadata.get("width", width),
                height=metadata.get("height", height),
                frameRate=metadata.get("frameRate", frameRate),
                uploadedAt=datetime.fromisoformat(metadata.get("uploadedAt")),
                recordingMode=metadata.get("recordingMode", "video")
            )
            
            # Update session with video metadata
            await update_session(
                sessionId,
                {
                    "videoMetadata": video_metadata.model_dump(),
                    "recording_mode": "video"
                }
            )
            logger.info(f"Upload video: session {sessionId} updated with video metadata")
            
            # Return success response
            return {
                "success": True,
                "videoPath": f"/MockMe.AI/videos/{sessionId}.mp4",
                "videoUrl": video_url,
                "fileSize": len(video_bytes),
                "duration": metadata.get("duration", duration)
            }
        
        except ValueError as e:
            logger.error(f"Upload video: validation error for session {sessionId}: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))
        except RuntimeError as e:
            logger.error(f"Upload video: storage error for session {sessionId}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to upload video to storage")
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Upload video: unexpected error for session {sessionId}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/{sessionId}/video-info")
async def get_video_info(
    sessionId: str,
    current_user: dict = Depends(get_current_user),
):
    """Retrieve video metadata and playback URL for a session.
    
    Returns video information including the playback URL, duration, file size,
    codec, resolution, and frame rate. Used by the frontend to display video
    in the results panel and enable playback.
    
    Args:
        sessionId: Unique session identifier
        current_user: Authenticated user from dependency
        
    Returns:
        {
            "sessionId": str,
            "recordingMode": str ("audio" | "video"),
            "hasVideo": bool,
            "videoMetadata": {
                "videoUrl": str,
                "duration": float,
                "fileSize": int,
                "codec": str,
                "width": int,
                "height": int,
                "frameRate": float,
                "uploadedAt": datetime,
                "recordingMode": str
            }
        }
        
    Raises:
        HTTPException: 403 (unauthorized), 404 (session or video not found),
                      500 (error retrieving video info)
    """
    try:
        # Verify session exists and belongs to current user
        session = await get_session(sessionId)
        if not session:
            logger.warning(f"Video info: session {sessionId} not found")
            raise HTTPException(status_code=404, detail="Session not found")
        
        if session.get("user_id") != current_user["user_id"]:
            logger.warning(
                f"Video info: user {current_user['user_id']} "
                f"unauthorized for session {sessionId}"
            )
            raise HTTPException(
                status_code=403, 
                detail="Session does not belong to authenticated user"
            )
        
        # Get video metadata from session
        video_metadata_dict = session.get("videoMetadata")
        
        # Check if video exists
        if not video_metadata_dict:
            logger.info(f"Video info: no video found for session {sessionId}")
            raise HTTPException(
                status_code=404,
                detail="No video available for this session"
            )
        
        # Get the recording mode from session (default to 'audio')
        recording_mode = session.get("recording_mode", "audio")
        
        # Build the video metadata object for response
        # videoMetadata could be stored as dict or VideoMetadata model
        if isinstance(video_metadata_dict, dict):
            video_metadata = VideoMetadata(
                videoUrl=video_metadata_dict.get("videoUrl", ""),
                duration=video_metadata_dict.get("duration", 0.0),
                fileSize=video_metadata_dict.get("fileSize", 0),
                codec=video_metadata_dict.get("codec", "unknown"),
                width=video_metadata_dict.get("width", 0),
                height=video_metadata_dict.get("height", 0),
                frameRate=video_metadata_dict.get("frameRate", 0.0),
                uploadedAt=video_metadata_dict.get("uploadedAt", datetime.utcnow()),
                recordingMode=video_metadata_dict.get("recordingMode", recording_mode)
            )
        else:
            # Already a VideoMetadata model
            video_metadata = video_metadata_dict
        
        logger.info(
            f"Video info: retrieved video info for session {sessionId}, "
            f"hasVideo=True"
        )
        
        # Return the video info response
        return {
            "sessionId": sessionId,
            "recordingMode": recording_mode,
            "hasVideo": True,
            "videoMetadata": video_metadata.dict()
        }
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Video info: unexpected error for session {sessionId}: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving video info")


@router.delete("/{sessionId}/video")
async def delete_video(
    sessionId: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete video file and metadata for a session.
    
    Removes the video file from Dropbox storage and clears video metadata
    from the session. Used when users want to remove recorded video from
    an interview session.
    
    Args:
        sessionId: Unique session identifier
        current_user: Authenticated user from dependency
        
    Returns:
        {
            "success": bool,
            "message": str
        }
        
    Raises:
        HTTPException: 403 (unauthorized), 404 (session or video not found),
                      500 (deletion error)
    """
    try:
        # Verify session exists and belongs to current user
        session = await get_session(sessionId)
        if not session:
            logger.warning(f"Delete video: session {sessionId} not found")
            raise HTTPException(status_code=404, detail="Session not found")
        
        if session.get("user_id") != current_user["user_id"]:
            logger.warning(
                f"Delete video: user {current_user['user_id']} "
                f"unauthorized for session {sessionId}"
            )
            raise HTTPException(
                status_code=403, 
                detail="Session does not belong to authenticated user"
            )
        
        # Check if video metadata exists in session
        video_metadata_dict = session.get("videoMetadata")
        if not video_metadata_dict:
            logger.info(f"Delete video: no video found for session {sessionId}")
            raise HTTPException(
                status_code=404,
                detail="No video available for this session"
            )
        
        # Get user's Dropbox credentials
        user = await get_user(current_user["user_id"])
        if not user or not user.get("dropbox_refresh_token"):
            logger.error(
                f"Delete video: no Dropbox credentials for user {current_user['user_id']}"
            )
            raise HTTPException(
                status_code=500,
                detail="Dropbox storage not configured for user"
            )
        
        # Initialize VideoStorageService and delete video
        try:
            video_storage = VideoStorageService(user["dropbox_refresh_token"])
            deleted = video_storage.deleteVideo(sessionId)
            
            if not deleted:
                # Video file not found in storage (already deleted or never uploaded)
                logger.warning(
                    f"Delete video: video file not found in storage for session {sessionId}"
                )
            
            # Clear video metadata from session regardless of storage state
            # This ensures the session is marked as having no video
            await update_session(
                sessionId,
                {
                    "videoMetadata": None,
                    "recording_mode": "audio"
                }
            )
            
            logger.info(f"Delete video: successfully deleted video for session {sessionId}")
            
            return {
                "success": True,
                "message": "Video deleted successfully"
            }
        
        except RuntimeError as e:
            logger.error(f"Delete video: storage error for session {sessionId}: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to delete video from storage")
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Delete video: unexpected error for session {sessionId}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
