from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class PriorityLevel(str, Enum):
    """Priority levels for technical and communication gaps."""
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class PrioritizedGap(BaseModel):
    """Represents a technical or knowledge gap prioritized by impact."""
    category: str  # e.g., "System Design", "Algorithms", "Code Quality"
    priority: PriorityLevel  # Critical, High, Medium, Low
    frequency: int  # How many times this gap appeared in the interview
    impact_score: float  # 0-100 based on relevance and position
    detected_in: str  # e.g., "technical_dive", "coding_round", "behavioral"


class TopicInfo(BaseModel):
    """Detailed information about a technical topic to learn."""
    concept: str  # Core concept definition (2-3 sentences)
    subtopics: List[str]  # Specific areas within the topic to focus on
    competencies: List[str]  # Skills and knowledge areas required
    pitfalls: List[str]  # Common mistakes or misconceptions to avoid


class ResolutionStep(BaseModel):
    """A single step in the resolution path for addressing a gap."""
    step_number: int  # 1-4 (Understand, Practice, Demonstrate, Validate)
    title: str  # Step title (e.g., "Understand", "Practice", "Demonstrate", "Validate")
    description: str  # Detailed description of what to do in this step
    activities: List[str]  # Specific activities or exercises for this step
    time_estimate: str  # Estimated time to complete (e.g., "1-2 hours")
    resources: List["StudyResource"]  # Resources relevant to this step


class ResolutionPath(BaseModel):
    """Complete path for resolving a specific gap."""
    gap_category: str  # The gap this path addresses
    steps: List[ResolutionStep]  # The 4 steps (Understand, Practice, Demonstrate, Validate)
    estimated_total_time: str  # Total time estimate (e.g., "5-7 hours")


class StudyResource(BaseModel):
    """A curated external learning resource."""
    id: str  # Unique resource identifier
    title: str  # Resource title
    author: Optional[str] = None  # Author name if applicable
    type: str  # Resource type: book, course, blog, documentation, tutorial, practice, guide
    url: str  # Direct link to the resource
    categories: List[str]  # Which gaps or topics this resource addresses


class CommunicationGap(BaseModel):
    """Represents a gap in communication or soft skills."""
    category: str  # e.g., "Clarity", "Structure", "Conciseness", "Active Listening", "Confidence", "Technical Vocabulary"
    severity: PriorityLevel  # Critical, High, Medium, Low
    description: str  # Description of the gap
    candidate_response: str  # Actual quote or paraphrase from transcript showing the issue
    improvement_tips: List[str]  # 3-5 actionable tips to address this gap
    sample_improved_response: str  # Example of how to handle the situation better
    related_tactic: Optional[Dict[str, Any]] = None  # Related behavioral tactic from BEHAVIORAL_TACTICS


class HolisticGuidance(BaseModel):
    """Cross-domain analysis and integrated guidance."""
    gap_relationships: List[Dict[str, Any]]  # Connections between tech and communication gaps
    recommended_sequence: List[str]  # Order in which to address gaps (by category)
    dependency_map: Dict[str, Any]  # Visualization data showing gap dependencies
    action_checklist: List[Dict[str, Any]]  # Action items grouped by timeline and priority


class TransformationAnalysis(BaseModel):
    """Analysis of a critical moment with elite-level response comparison."""
    critical_moment: str  # Context of where the candidate stumbled
    candidate_original: str  # Candidate's actual response (truncated)
    elite_response: str  # Expert-level response to the same question/scenario
    why_better: str  # Explanation of what makes the elite response better


class ImprovementPlan(BaseModel):
    """Complete improvement plan generated from interview analysis."""
    session_id: str  # Reference to the interview session
    session_date: str  # Date of the interview session
    overall_score: int  # Overall performance score (0-100)
    hire_verdict: str  # Hiring decision: "Hire", "No Hire", "Maybe"
    
    # Multi-component analysis
    technical_analysis: Dict[str, Any]  # Contains gaps, topic_info, resolution_paths
    communication_analysis: Dict[str, Any]  # Contains gaps organized by category
    holistic_guidance: HolisticGuidance  # Cross-domain relationships and guidance
    transformation_analysis: TransformationAnalysis  # Critical moment with elite response
    resources_analysis: Dict[str, Any]  # All curated resources with filtering metadata
    
    # Metadata
    generated_at: datetime  # When the plan was generated
    cache_expires_at: Optional[datetime] = None  # When the cached plan expires (90 days)


# Enable model updates to support forward references
ResolutionStep.model_rebuild()
