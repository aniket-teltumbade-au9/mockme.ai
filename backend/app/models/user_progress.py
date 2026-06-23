from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

class SkillGapSnapshot(BaseModel):
    timestamp: datetime
    gaps: List[str]

class SessionSummary(BaseModel):
    session_id: str
    created_at: datetime
    gaps: List[str]
    resolved_in_session: Optional[str] = None
    performance_score: float = 0.0
    hire_verdict: Optional[str] = None

class UserProgress(BaseModel):
    user_id: str
    total_interviews: int = 0
    skill_gaps_history: List[SkillGapSnapshot] = []
    session_summaries: List[SessionSummary] = []
    average_performance_score: float = 0.0
