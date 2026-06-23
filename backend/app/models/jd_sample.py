from pydantic import BaseModel
from typing import Optional, Dict, Any

class JDSampleMetadata(BaseModel):
    company: str
    experience: str
    location: str
    industry_preference: str

class JDSample(BaseModel):
    day_number: int
    role: str
    description: str
    metadata: JDSampleMetadata

class JDSampleResponse(BaseModel):
    id: Optional[str] = None
    day_number: int
    role: str
    description: str
    metadata: Dict[str, Any]
