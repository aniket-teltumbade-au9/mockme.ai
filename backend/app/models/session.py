from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

class EditorConfig(BaseModel):
    language: str = "javascript"
    codeContent: str = ""

class UIConfig(BaseModel):
    currentState: str = "STATE_0"
    showCodeWorkspace: bool = False
    progress: int = 0
    hints: List[str] = []
    detectedGaps: List[str] = []
    editorConfig: EditorConfig = EditorConfig()
    voice_script: Optional[str] = None

class Session(BaseModel):
    sessionId: str
    user_id: str = "default_user"
    currentState: str = "STATE_0"
    history: List[dict] = []
    tts_clips: List[Dict[str, Any]] = [] # Track clips: {'path': str, 'start_time': float}
    detectedGaps: List[str] = []
    currentCodeWorkspace: str = ""
    jd: Optional[str] = None
    topic: Optional[str] = None # New field
    is_rehearsal: bool = False # Rehearsal mode flag
    persona: Optional[str] = None
    experience_level: Optional[str] = None
    voice_lang: str = "en-in"
    day_number: int = 1
    performance_score: float = 50.0
    
    # Finalization fields
    finalized: bool = False
    dropbox_audio_url: Optional[str] = None
    dropbox_analysis_url: Optional[str] = None
    google_audio_url: Optional[str] = None
    google_analysis_url: Optional[str] = None
    recording_available: bool = False
    finalization_attempted_at: Optional[datetime] = None
    finalization_error: Optional[str] = None
    analysis: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    audio_duration_accumulator: float = 0.0

class User(BaseModel):
    user_id: str
    dropbox_access_token: Optional[str] = None
    dropbox_refresh_token: Optional[str] = None
    dropbox_token_expiry: Optional[datetime] = None
    dropbox_account_email: Optional[str] = None
    dropbox_scope: Optional[List[str]] = None
    dropbox_subject: Optional[str] = None
    dropbox_display_name: Optional[str] = None
    dropbox_email_verified: Optional[bool] = None
    google_access_token: Optional[str] = None
    google_refresh_token: Optional[str] = None
    google_token_expiry: Optional[datetime] = None
    google_account_email: Optional[str] = None
    google_display_name: Optional[str] = None
