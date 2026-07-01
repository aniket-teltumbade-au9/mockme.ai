import uuid
import json
import os
import subprocess

# Interview personas and default structure
DEFAULT_PERSONAS = {
    "Calm": "You are a calm and patient interviewer. You ask questions gently and allow the candidate to think.",
    "Strict": "You are a strict and direct interviewer. You give concise prompts and expect detailed answers.",
    "Friendly": "You are a warm, friendly interviewer. You make the candidate feel comfortable and guide them with encouraging feedback.",
    "Technical": "You are a deeply technical interviewer. You focus on system design, algorithms, data structures, and low-level implementation details.",
    "Behavioral": "You are a behavioral-focused interviewer. You ask about past experiences, leadership, conflict resolution, teamwork, and soft skills.",
    "Challenging": "You are a challenging interviewer. You ask tough, pressure-test questions and push the candidate to defend their choices.",
    "Experienced Peer": "You are a peer-level senior engineer. You discuss architecture, trade-offs, and real-world engineering challenges collegially."
}

DEFAULT_INTERVIEW_STRUCTURE = """1. STATE_0 (Introduction): Brief intro.\n2. STATE_1 (Deep Tech Dive): Ask a few technical questions.\n3. STATE_2 (Coding Round): Present a coding challenge. No time pressure, focus on thought process.\n4. STATE_3 (Conclusion): Summarize and decide hiring."""
from app.logger import logger
from typing import Optional
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import Depends, FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.models.session import Session
from app.services.llm import chat_with_llm, generate_coding_problem
from app.services.stt import transcribe_audio
from app.services.tts import get_audio_bytes
from app.utils.parser import parse_llm_response
from app.services.auth import get_current_user
from app.services.database import db, get_user_interviews, get_user_progress, can_start_interview, save_interview_session, update_progress, update_session, test_db_connection, get_user_resume, set_user_resume
from app.services.credit_service import CreditService
from app.services.storage import get_storage_dir, get_tts_clip_path, get_mic_path, get_turn_audio_path, concatenate_turn_audio

from app.services.voice_service import get_or_refresh_voices
from app.services.dropbox_service import DropboxService

from app.routers import dropbox_auth, interviews, code_runner, jd_samples, progress, focused_sessions, admin, tutor, credits, google_auth
from app.routers.interviews import finalize_interview_task

@asynccontextmanager
async def lifespan(app: FastAPI):


    # Load shared resources (e.g., database connection pools, ML models)
    await test_db_connection()
    print("Application is starting up...")
    yield
    # Clean up resources (e.g., close connections)
    print("Application is shutting down...")

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
app.include_router(jd_samples.router)
app.include_router(progress.router)
app.include_router(focused_sessions.router)
app.include_router(admin.router)
app.include_router(tutor.router)
app.include_router(credits.router)
app.include_router(google_auth.router)

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
            val = result.stdout.decode().strip()
            if val and val != "N/A":
                return float(val)
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
            val = result.stdout.decode().strip()
            if val and val != "N/A":
                return float(val)
    except Exception as e:
        print(f"Warning: Could not get audio duration from file: {e}")
    return 0.0


@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/api/user/progress")
async def user_progress(current_user: dict = Depends(get_current_user)):
    return await get_user_progress(current_user["user_id"])

@app.get("/api/interviews/history")
async def interview_history(current_user: dict = Depends(get_current_user)):
    return await get_user_interviews(current_user["user_id"])

@app.get("/api/user/resume")
async def get_resume(current_user: dict = Depends(get_current_user)):
    """Retrieve the currently stored resume for the user."""
    resume = await get_user_resume(current_user["user_id"])
    return resume or {"resume_url": None, "resume_filename": None}

@app.get("/api/voices")
async def list_voices():
    voices = await get_or_refresh_voices()
    return voices

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

from app.services.database import db, get_user_interviews, get_user_progress, can_start_interview, save_interview_session, update_progress, update_session, test_db_connection, get_user_resume, set_user_resume

# ... (keep existing imports and DEFAULT_PERSONAS, DEFAULT_INTERVIEW_STRUCTURE)
# ... (keep app definition and middleware)

# ... (keep existing routers inclusion)

# ... (keep sessions store and audio duration helpers)

# ... (keep health, user_progress, interview_history, list_voices, text_to_speech)

@app.post("/api/session/start")
async def start_session(
    jd: Optional[str] = Form(None),
    topic: Optional[str] = Form(None),
    is_rehearsal: bool = Form(False),
    persona: Optional[str] = Form(None),
    voice_lang: Optional[str] = Form("en-in"),
    resume: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["user_id"]
    
    # --- Credit Check & Deduction ---
    if not await CreditService.handle_interview_start(user_id, str(uuid.uuid4())): # Temporary session_id for ledger
        return {
            "error": "Insufficient Credits",
            "message": "You need at least 2 credits to start an interview. Log in daily or complete quick drills to earn more!"
        }

    if not await can_start_interview(user_id):
        return {
            "error": "Daily limit reached",
            "message": "You have already completed your interview for today. Consistency is key, come back tomorrow!"
        }

    session_id = str(uuid.uuid4())
    # Set JD or Topic as the context
    context = jd if jd else f"Topic-Specific Interview on: {topic}" if topic else "General Software Engineer"
    session = Session(sessionId=session_id, user_id=user_id, created_at=datetime.now(timezone.utc), topic=topic, jd=context, is_rehearsal=is_rehearsal)
    sessions[session_id] = session

    # --- Resume Handling (Vault) ---
    resume_url = None
    resume_filename = None

    if resume:
        # New resume uploaded: save to Cloud Storage and then to User Profile
        if current_user.get("dropbox_refresh_token"):
            try:
                service = DropboxService(current_user["dropbox_refresh_token"])
                resume_bytes = await resume.read()
                resume_url = service.upload_resume(session_id, resume.filename, resume_bytes)
                resume_filename = resume.filename
                # Persist to User Profile
                await set_user_resume(user_id, resume_url, resume_filename)
                print(f"DEBUG: New resume uploaded to Dropbox: {resume_url}")
            except Exception as e:
                print(f"ERROR uploading resume to Dropbox: {e}")
        elif current_user.get("google_refresh_token"):
            try:
                from app.services.google_drive_service import GoogleDriveService
                service = GoogleDriveService(current_user["google_refresh_token"])
                resume_bytes = await resume.read()
                resume_url = service.upload_resume(session_id, resume.filename, resume_bytes)
                resume_filename = resume.filename
                # Persist to User Profile
                await set_user_resume(user_id, resume_url, resume_filename)
                print(f"DEBUG: New resume uploaded to Google Drive: {resume_url}")
            except Exception as e:
                print(f"ERROR uploading resume to Google Drive: {e}")
        else:
            print("WARN: Resume provided but no Cloud Storage token")
    else:
        # No new resume: check User Profile for a stored one
        stored_resume = await get_user_resume(user_id)
        if stored_resume:
            resume_url = stored_resume["resume_url"]
            resume_filename = stored_resume["resume_filename"]
            print(f"DEBUG: Using persisted resume from profile: {resume_url}")

    # Store session metadata
    session.currentCodeWorkspace = jd
    session.persona = persona
    session.voice_lang = voice_lang or "en-in"
    
    # Calculate day number and initial performance score
    progress = await get_user_progress(user_id)
    session.day_number = progress.get("total_interviews", 0) + 1
    session.performance_score = 50.0 # Default starting score
    
    # Build LLM prompt context
    if persona:
        persona_desc = DEFAULT_PERSONAS.get(persona, persona)
        jd_context = persona_desc
    else:
        # Construct JD context including resume URL if available
        jd_content = jd or ""
        if resume_url:
            jd_content += f"\n\nCandidate Resume: {resume_url}"
            
        jd_context = f"Job Description (Day {session.day_number}):\n{jd_content}\n\nInterview Structure:\n{DEFAULT_INTERVIEW_STRUCTURE}"
    
    # Initialize audio duration accumulator
    session.audio_duration_accumulator = 0.0
    
    # Initial message to LLM to get the starting state
    response_text = chat_with_llm([{"role": "user", "content": "Let's start the interview."}], jd_context=jd_context)
    ui_config, voice_script = parse_llm_response(response_text)
    ui_config["voice_script"] = voice_script
    
    session.history.append({"role": "assistant", "content": voice_script})
    
    # Generate and save initial TTS audio clip
    tts_audio = get_audio_bytes(voice_script, session.voice_lang)
    tts_audio_duration = get_audio_duration(tts_audio)
    
    storage_dir = get_storage_dir()
    clip_path = get_tts_clip_path(session_id, 0)
    with open(clip_path, "wb") as f:
        f.write(tts_audio)
    print(f"DEBUG: Saved initial TTS clip to {clip_path}")
    
    # Track initial clip at start_time 0.0
    session.tts_clips.append({"path": clip_path, "start_time": 0.0})
    session.audio_duration_accumulator += tts_audio_duration
    
    # Persist session to DB
    await save_interview_session({
        "sessionId": session_id,
        "jd": jd,
        "persona": persona,
        "resume_url": resume_url,
        "voice_lang": voice_lang or "en-in",
        "user_id": user_id,
        "status": "active",
        "day_number": session.day_number,
        "performance_score": session.performance_score
    })
    
    return {
        "sessionId": session_id,
        "uiConfig": ui_config
    }

@app.post("/api/interview/respond-audio")
async def respond_audio(
    background_tasks: BackgroundTasks,
    sessionId: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["user_id"]
    print(f"\n=== RESPOND-AUDIO START session={sessionId} user={user_id} ===")

    if sessionId not in sessions:
        session_data = await db.interviews.find_one({"sessionId": sessionId, "user_id": user_id})
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        sessions[sessionId] = Session(**session_data)

    session = sessions[sessionId]
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Session does not belong to authenticated user")

    if not session.currentCodeWorkspace and session.jd:
        session.currentCodeWorkspace = session.jd

    if session.audio_duration_accumulator == 0.0 and session.tts_clips:
        for clip in session.tts_clips:
            clip_duration = get_audio_duration_from_file(clip.get('path', ''))
            session.audio_duration_accumulator += clip_duration

    jd = session.currentCodeWorkspace
    audio_bytes = await file.read()
    logger.info(f"Turn audio received: {len(audio_bytes)} bytes, filename={file.filename}")

    user_audio_duration = get_audio_duration(audio_bytes)
    logger.info(f"Turn audio duration: {user_audio_duration:.2f}s")

    user_text = transcribe_audio(audio_bytes)
    logger.info(f"Transcription: '{user_text}'")
    if not user_text:
        user_text = "[Silence]"

    session.history.append({"role": "user", "content": user_text})
    response_text = chat_with_llm(session.history, jd_context=jd, coding_problem=session.currentCodeWorkspace)
    
    ui_config, voice_script = parse_llm_response(response_text)
    ui_config["voice_script"] = voice_script
    
    session.history.append({"role": "assistant", "content": voice_script})

    tts_audio = get_audio_bytes(voice_script, session.voice_lang)
    tts_audio_duration = get_audio_duration(tts_audio)
    print(f"DEBUG: TTS audio generated: {len(tts_audio)} bytes, duration={tts_audio_duration:.2f}s")

    storage_dir = get_storage_dir()
    turn_index = len(session.tts_clips)

    # --- SAVE USER TURN AUDIO ---
    user_turn_path = get_turn_audio_path(sessionId, turn_index)
    with open(user_turn_path, "wb") as f:
        f.write(audio_bytes)
    print(f"DEBUG: Saved TURN #{turn_index} audio -> {user_turn_path} ({len(audio_bytes)} bytes)")

    # --- SAVE SARAH TTS CLIP ---
    tts_path = get_tts_clip_path(sessionId, turn_index)
    with open(tts_path, "wb") as f:
        f.write(tts_audio)
    print(f"DEBUG: Saved SARAH #{turn_index} TTS -> {tts_path} ({len(tts_audio)} bytes)")

    clip_start_time = session.audio_duration_accumulator
    session.tts_clips.append({"path": tts_path, "start_time": clip_start_time})
    session.audio_duration_accumulator += user_audio_duration + tts_audio_duration
    print(f"DEBUG: Accumulator now={session.audio_duration_accumulator:.2f}s turn_count={turn_index + 1}")

    # --- VALIDATE STATE ---
    allowed_states = ["STATE_0", "STATE_1", "STATE_2", "STATE_3"]
    if 'currentState' in ui_config and ui_config['currentState'] in allowed_states:
        session.currentState = ui_config['currentState']
        print(f"DEBUG: Valid State Transition -> {session.currentState}")
    else:
        print(f"WARNING: Invalid or missing state in LLM response, staying in {session.currentState}")
        ui_config['currentState'] = session.currentState

    if session.currentState == "STATE_2":
        # Generate problem only if not already done
        if "Title:" not in session.currentCodeWorkspace:
            print(f"DEBUG: Generating dynamic coding problem for session {sessionId}")
            problem = generate_coding_problem(session.jd or "General SWE", session.day_number, session.performance_score)
            session.currentCodeWorkspace = f"Title: {problem['title']}\nDescription: {problem['description']}"
            ui_config["editorConfig"] = {
                "language": "javascript",
                "codeContent": problem['starter_code'].get("javascript", "")
            }
                
    if session.currentState == "STATE_3":
        print(f"=== STATE_3 REACHED - Auto-finalizing session {sessionId} ===")

        # Generate remediation plan
        from app.services.remediation import generate_remediation_plan
        gaps = ui_config.get("detectedGaps", [])
        remediation_plan = generate_remediation_plan(gaps)

        # Store remediation plan in session for frontend access
        await update_session(sessionId, {
            "remediation_plan": remediation_plan
        })

        await update_progress(session.user_id, sessionId, gaps, voice_script)


        # Build combined mic from all turn recordings
        print(f"DEBUG: Building combined mic from turn files...")
        combined_mic_path = concatenate_turn_audio(sessionId)
        if combined_mic_path and os.path.exists(combined_mic_path):
            print(f"DEBUG: Combined mic saved -> {combined_mic_path} ({os.path.getsize(combined_mic_path)} bytes)")
            await update_session(sessionId, {
                "raw_mic_path": combined_mic_path,
                "finalized": False,
                "finalization_error": None,
            })
            background_tasks.add_task(finalize_interview_task, sessionId, combined_mic_path)
            print(f"DEBUG: finalize_interview_task scheduled for {sessionId}")
        else:
            print(f"ERROR: Failed to build combined mic for session {sessionId}")

    await update_session(sessionId, {
        "history": [h.dict() if hasattr(h, 'dict') else h for h in session.history],
        "tts_clips": session.tts_clips,
        "currentState": session.currentState,
        "audio_duration_accumulator": session.audio_duration_accumulator,
    })
    print(f"=== RESPOND-AUDIO END session={sessionId} ===\n")

    return {
        "uiConfig": ui_config,
        "audio": "",
        "transcription": user_text
    }

@app.post("/api/interview/aftersave")
async def aftersave_interview(
    background_tasks: BackgroundTasks,
    sessionId: str = Form(...),
    audio: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["user_id"]
    if sessionId not in sessions:
        session_data = await db.interviews.find_one({"sessionId": sessionId, "user_id": user_id})
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        sessions[sessionId] = Session(**session_data)

    session = sessions[sessionId]
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Session does not belong to authenticated user")

    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty recording.")

    mic_path = get_mic_path(sessionId)
    with open(mic_path, "wb") as f:
        f.write(audio_bytes)
    print(f"DEBUG: aftersave saved mic audio to {mic_path} ({len(audio_bytes)} bytes)")

    await update_session(sessionId, {
        "raw_mic_path": mic_path,
        "finalized": False,
        "finalization_error": None
    })

    background_tasks.add_task(finalize_interview_task, sessionId, mic_path)
    return {"success": True, "message": "Auto-finalization triggered after last recording"}

class RespondCodeRequest(BaseModel):
    sessionId: str
    code: str

@app.post("/api/interview/respond-code")
async def respond_code(
    background_tasks: BackgroundTasks,
    request: RespondCodeRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["user_id"]
    sessionId = request.sessionId
    code = request.code
    if sessionId not in sessions:
        session_data = await db.interviews.find_one({"sessionId": sessionId, "user_id": user_id})
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        sessions[sessionId] = Session(**session_data)

    session = sessions[sessionId]
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Session does not belong to authenticated user")

    # Ensure interview context is restored for DB-recovered sessions
    if not session.currentCodeWorkspace and session.jd:
        session.currentCodeWorkspace = session.jd

    # Recalculate audio duration accumulator from existing clips for restored sessions
    if session.audio_duration_accumulator == 0.0 and session.tts_clips:
        for clip in session.tts_clips:
            clip_duration = get_audio_duration_from_file(clip.get('path', ''))
            session.audio_duration_accumulator += clip_duration
    
    jd = session.currentCodeWorkspace

    prompt = f"User updated code to:\n```{code}```"
    session.history.append({"role": "user", "content": prompt})
    response_text = chat_with_llm(session.history, jd_context=jd, coding_problem=session.currentCodeWorkspace)
    
    ui_config, voice_script = parse_llm_response(response_text)
    ui_config["voice_script"] = voice_script
    
    session.history.append({"role": "assistant", "content": voice_script})

    # Generate and save TTS audio clip
    tts_audio = get_audio_bytes(voice_script, session.voice_lang)
    tts_audio_duration = get_audio_duration(tts_audio)

    storage_dir = get_storage_dir()
    clip_index = len(session.tts_clips)
    clip_path = get_tts_clip_path(sessionId, clip_index)
    with open(clip_path, "wb") as f:
        f.write(tts_audio)
    print(f"DEBUG: Saved code response TTS clip to {clip_path}")

    clip_start_time = session.audio_duration_accumulator
    session.tts_clips.append({"path": clip_path, "start_time": clip_start_time})
    session.audio_duration_accumulator += tts_audio_duration

    # --- VALIDATE STATE ---
    allowed_states = ["STATE_0", "STATE_1", "STATE_2", "STATE_3"]
    if 'currentState' in ui_config and ui_config['currentState'] in allowed_states:
        session.currentState = ui_config['currentState']
        print(f"DEBUG: Valid State Transition (respond-code) -> {session.currentState}")
    else:
        print(f"WARNING: Invalid or missing state in LLM response (respond-code), staying in {session.currentState}")
        ui_config['currentState'] = session.currentState

    if session.currentState == "STATE_3":
        print(f"=== STATE_3 REACHED - Auto-finalizing session {sessionId} ===")

        # Generate remediation plan
        from app.services.remediation import generate_remediation_plan
        gaps = ui_config.get("detectedGaps", [])
        remediation_plan = generate_remediation_plan(gaps)

        # Store remediation plan in session for frontend access
        await update_session(sessionId, {
            "remediation_plan": remediation_plan
        })

        await update_progress(session.user_id, sessionId, gaps, voice_script)

        # Build combined mic from all turn recordings
        combined_mic_path = concatenate_turn_audio(sessionId)
        if combined_mic_path and os.path.exists(combined_mic_path):
            print(f"DEBUG: Combined mic saved -> {combined_mic_path} ({os.path.getsize(combined_mic_path)} bytes)")
            await update_session(sessionId, {
                "raw_mic_path": combined_mic_path,
                "finalized": False,
                "finalization_error": None,
            })
            background_tasks.add_task(finalize_interview_task, sessionId, combined_mic_path)
            print(f"DEBUG: finalize_interview_task scheduled for {sessionId}")
        else:
            print(f"ERROR: Failed to build combined mic for session {sessionId} (via respond-code)")

    await update_session(sessionId, {
        "history": session.history,
        "tts_clips": session.tts_clips,
        "currentState": session.currentState,
        "audio_duration_accumulator": session.audio_duration_accumulator,
    })
    
    return {
        "uiConfig": ui_config,
        "audio": ""
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
