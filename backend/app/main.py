import uuid
import json
import base64
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.models.session import Session, UIConfig
from app.services.llm import chat_with_llm
from app.services.stt import transcribe_audio
from app.services.tts import get_audio_bytes
from app.utils.parser import parse_llm_response
from app.services.database import get_user_progress, can_start_interview, save_interview_session, update_progress

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store
sessions = {}

class StartSessionRequest(BaseModel):
    jd: str

@app.get("/api/user/progress")
async def user_progress():
    return await get_user_progress()

@app.post("/api/session/start")
async def start_session(request: StartSessionRequest):
    if not await can_start_interview():
        return {
            "error": "Daily limit reached", 
            "message": "You have already completed your interview for today. Consistency is key, come back tomorrow!"
        }
    
    session_id = str(uuid.uuid4())
    sessions[session_id] = Session(sessionId=session_id)
    # Store JD in session context (temporarily using currentCodeWorkspace)
    sessions[session_id].currentCodeWorkspace = request.jd 
    
    # Initial message to LLM to get the starting state
    response_text = chat_with_llm([{"role": "user", "content": "Let's start the interview."}], jd_context=request.jd)
    ui_config, voice_script = parse_llm_response(response_text)
    ui_config["voice_script"] = voice_script
    
    sessions[session_id].history.append({"role": "assistant", "content": response_text})
    
    # Persist session to DB
    await save_interview_session({
        "sessionId": session_id,
        "jd": request.jd,
        "user_id": "default_user",
        "status": "active"
    })
    
    return {
        "sessionId": session_id,
        "uiConfig": ui_config
    }

@app.post("/api/interview/respond-audio")
async def respond_audio(sessionId: str = Form(...), file: UploadFile = File(...)):
    if sessionId not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[sessionId]
    jd = session.currentCodeWorkspace
    
    audio_bytes = await file.read()
    user_text = transcribe_audio(audio_bytes)
    
    if not user_text: user_text = "[Silence]"
        
    session.history.append({"role": "user", "content": user_text})
    response_text = chat_with_llm(session.history, jd_context=jd)
    session.history.append({"role": "assistant", "content": response_text})
    
    ui_config, voice_script = parse_llm_response(response_text)
    ui_config["voice_script"] = voice_script
    
    if 'currentState' in ui_config:
        session.currentState = ui_config['currentState']
        if session.currentState == "STATE_3":
             await update_progress(sessionId, ui_config.get("detectedGaps", []), voice_script)
    
    return {
        "uiConfig": ui_config,
        "audio": "", 
        "transcription": user_text
    }

@app.post("/api/interview/respond-code")
async def respond_code(sessionId: str, code: str):
    if sessionId not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[sessionId]
    jd = session.currentCodeWorkspace
    
    # Send code update to LLM
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
