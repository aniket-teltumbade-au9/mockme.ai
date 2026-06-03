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
    detectedGaps: List[str] = []
    currentCodeWorkspace: str = ""
    jd: Optional[str] = None
    
    # Finalization fields
    finalized: bool = False
    dropbox_audio_url: Optional[str] = None
    dropbox_analysis_url: Optional[str] = None
    recording_available: bool = False
    finalization_attempted_at: Optional[datetime] = None
    finalization_error: Optional[str] = None
    analysis: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None

class User(BaseModel):
    user_id: str
    dropbox_access_token: Optional[str] = None
    dropbox_refresh_token: Optional[str] = None
    dropbox_token_expiry: Optional[datetime] = None
    dropbox_account_email: Optional[str] = None
