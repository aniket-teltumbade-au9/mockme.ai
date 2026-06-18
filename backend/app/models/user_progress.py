from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime

class SkillGapSnapshot(BaseModel):
    timestamp: datetime
    gaps: List[str]

class UserProgress(BaseModel):
    user_id: str
    total_interviews: int = 0
    skill_gaps_history: List[SkillGapSnapshot] = []
    average_performance_score: float = 0.0
