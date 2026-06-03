from pydantic import BaseModel
from typing import List, Optional

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

class Session(BaseModel):
    sessionId: str
    currentState: str = "STATE_0"
    history: List[dict] = []
    detectedGaps: List[str] = []
    currentCodeWorkspace: str = ""
