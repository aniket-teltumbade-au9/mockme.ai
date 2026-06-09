import uuid
import json
import os
import subprocess
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import Depends, FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.models.session import Session
from app.services.llm import chat_with_llm
from app.services.stt import transcribe_audio
from app.services.tts import get_audio_bytes
from app.utils.parser import parse_llm_response
from app.services.auth import get_current_user
from app.services.database import db, get_user_interviews, get_user_progress, can_start_interview, save_interview_session, update_progress, update_session, test_db_connection

from app.routers import dropbox_auth, interviews, code_runner

@asynccontextmanager
async def lifespan(app: FastAPI):
    await test_db_connection()
    yield

app = FastAPI(lifespan=lifespan)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dropbox_auth.router)
app.include_router(interviews.router)
app.include_router(code_runner.router)

# In-memory session store
sessions = {}

def get_audio_duration(audio_bytes: bytes) -> float:
    """Get duration of audio in seconds using ffprobe."""
    try:
        cmd = [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", "-i", "pipe:0"
        ]
        result = subprocess.run(cmd, input=audio_bytes, capture_output=True, timeout=10)
        if result.returncode == 0:
            return float(result.stdout.decode().strip())
    except Exception as e:
        print(f"Warning: Could not get audio duration: {e}")
    return 0.0

def get_audio_duration_from_file(filepath: str) -> float:
    """Get duration of audio file in seconds using ffprobe."""
    try:
        cmd = [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", "-i", filepath
        ]
        result = subprocess.run(cmd, capture_output=True, timeout=10)
        if result.returncode == 0:
            return float(result.stdout.decode().strip())
    except Exception as e:
        print(f"Warning: Could not get audio duration from file: {e}")
    return 0.0

class StartSessionRequest(BaseModel):
    jd: str

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/api/user/progress")
async def user_progress(current_user: dict = Depends(get_current_user)):
    return await get_user_progress(current_user["user_id"])

@app.get("/api/interviews/history")
async def interview_history(current_user: dict = Depends(get_current_user)):
    return await get_user_interviews(current_user["user_id"])

import time
# ...
@app.get("/api/tts")
async def text_to_speech(
    text: str,
    lang: str = "en-in",
    current_user: dict = Depends(get_current_user),
):
    """Return gTTS MP3 bytes for the given text and accent lang code."""
    start_time = time.time()
    print(f"DEBUG: TTS request started for text: '{text[:20]}...'")
    
    audio_bytes = get_audio_bytes(text, lang)
    
    duration = time.time() - start_time
    print(f"DEBUG: TTS request finished in {duration:.2f}s")
    
    if not audio_bytes:
        return Response(status_code=204)
    return Response(content=audio_bytes, media_type="audio/mpeg")

@app.post("/api/session/start")
async def start_session(
    request: StartSessionRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["user_id"]
    if not await can_start_interview(user_id):
        return {
            "error": "Daily limit reached", 
            "message": "You have already completed your interview for today. Consistency is key, come back tomorrow!"
        }
    
    session_id = str(uuid.uuid4())
    sessions[session_id] = Session(sessionId=session_id, user_id=user_id, created_at=datetime.now(timezone.utc))
    # Store JD in session context (temporarily using currentCodeWorkspace)
    sessions[session_id].currentCodeWorkspace = request.jd 
    
    # Initialize audio duration accumulator
    sessions[session_id].audio_duration_accumulator = 0.0
    
    # Initial message to LLM to get the starting state
    response_text = chat_with_llm([{"role": "user", "content": "Let's start the interview."}], jd_context=request.jd)
    ui_config, voice_script = parse_llm_response(response_text)
    ui_config["voice_script"] = voice_script
    
    sessions[session_id].history.append({"role": "assistant", "content": response_text})
    
    # Generate and save initial TTS audio clip
    tts_audio = get_audio_bytes(voice_script, "en-in")
    tts_audio_duration = get_audio_duration(tts_audio)
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    tts_dir = os.path.join(base_dir, "tts_clips")
    os.makedirs(tts_dir, exist_ok=True)
    
    clip_filename = f"{session_id}_0.mp3"
    clip_path = os.path.join(tts_dir, clip_filename)
    with open(clip_path, "wb") as f:
        f.write(tts_audio)
    
    # Track initial clip at start_time 0.0
    sessions[session_id].tts_clips.append({"path": clip_path, "start_time": 0.0})
    sessions[session_id].audio_duration_accumulator += tts_audio_duration
    
    # Persist session to DB
    await save_interview_session({
        "sessionId": session_id,
        "jd": request.jd,
        "user_id": user_id,
        "status": "active"
    })
    
    return {
        "sessionId": session_id,
        "uiConfig": ui_config
    }

@app.post("/api/interview/respond-audio")
async def respond_audio(
    sessionId: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["user_id"]
    if sessionId not in sessions:
        # Re-initialize session from DB if it exists for this user
        session_data = await db.interviews.find_one({"sessionId": sessionId, "user_id": user_id})
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        sessions[sessionId] = Session(**session_data)

    session = sessions[sessionId]
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Session does not belong to authenticated user")
    
    # Initialize audio duration accumulator if not present
    if not hasattr(session, 'audio_duration_accumulator'):
        session.audio_duration_accumulator = 0.0
        # If restoring from DB, calculate accumulator from existing tts_clips
        if session.tts_clips:
            for clip in session.tts_clips:
                clip_duration = get_audio_duration_from_file(clip.get('path', ''))
                session.audio_duration_accumulator += clip_duration
            # Add estimated user audio duration between clips (assume ~5s per turn if no mic path)
            session.audio_duration_accumulator += len(session.tts_clips) * 5.0
    
    jd = session.currentCodeWorkspace
    
    audio_bytes = await file.read()
    print(f"DEBUG: Received audio, size: {len(audio_bytes)} bytes")
    # Reset file pointer just in case it wasn't at the start (though FastAPI usually handles this)
    await file.seek(0)
    
    # Get user audio duration for timing
    user_audio_duration = get_audio_duration(audio_bytes)
    print(f"DEBUG: User audio duration: {user_audio_duration:.2f}s")
    
    user_text = transcribe_audio(audio_bytes)
    print(f"DEBUG: Transcription result: '{user_text}'")
    
    if not user_text: user_text = "[Silence]"
        
    session.history.append({"role": "user", "content": user_text})
    response_text = chat_with_llm(session.history, jd_context=jd)
    session.history.append({"role": "assistant", "content": response_text})
    
    ui_config, voice_script = parse_llm_response(response_text)
    ui_config["voice_script"] = voice_script
    
    # Generate and save TTS audio clip
    tts_audio = get_audio_bytes(voice_script, "en-in")
    
    # Get TTS audio duration
    tts_audio_duration = get_audio_duration(tts_audio)
    print(f"DEBUG: TTS audio duration: {tts_audio_duration:.2f}s")
    
    # Standardize storage directory (absolute path)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    tts_dir = os.path.join(base_dir, "tts_clips")
    os.makedirs(tts_dir, exist_ok=True)
    
    # Filename structure: {sessionId}_{index}.mp3
    clip_filename = f"{sessionId}_{len(session.tts_clips)}.mp3"
    clip_path = os.path.join(tts_dir, clip_filename)
    with open(clip_path, "wb") as f:
        f.write(tts_audio)
    
    # Track clip metadata with correct start_time (current accumulated duration)
    clip_start_time = session.audio_duration_accumulator
    session.tts_clips.append({"path": clip_path, "start_time": clip_start_time})
    print(f"DEBUG: TTS clip start_time: {clip_start_time:.2f}s")
    
    # Update accumulator: user audio + TTS response
    session.audio_duration_accumulator += user_audio_duration + tts_audio_duration
    
    if 'currentState' in ui_config:
        session.currentState = ui_config['currentState']
        if session.currentState == "STATE_3":
             await update_progress(session.user_id, sessionId, ui_config.get("detectedGaps", []), voice_script)
    
    # Persist history snapshot and tts_clips to DB
    await update_session(sessionId, {
        "history": [h.dict() if hasattr(h, 'dict') else h for h in session.history],
        "tts_clips": session.tts_clips,
        "currentState": session.currentState,
    })
    
    return {
        "uiConfig": ui_config,
        "audio": "", 
        "transcription": user_text
    }

@app.post("/api/interview/respond-code")
async def respond_code(
    sessionId: str,
    code: str,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["user_id"]
    if sessionId not in sessions:
        # Re-initialize session from DB
        session_data = await db.interviews.find_one({"sessionId": sessionId, "user_id": user_id})
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        sessions[sessionId] = Session(**session_data)

    session = sessions[sessionId]
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Session does not belong to authenticated user")
    jd = session.currentCodeWorkspace

    prompt = f"User updated code to:\n```{code}```"
    session.history.append({"role": "user", "content": prompt})
    response_text = chat_with_llm(session.history, jd_context=jd)
    session.history.append({"role": "assistant", "content": response_text})
    
    ui_config, voice_script = parse_llm_response(response_text)
    ui_config["voice_script"] = voice_script
    
    return {
        "uiConfig": ui_config,
        "audio": ""
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
