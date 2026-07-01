"""
Analysis Router - Endpoints for comprehensive interview analysis and improvement plans

Provides endpoints to retrieve, refresh, and filter improvement plans generated from
interview analysis. Plans are cached for 90 days and can be force-regenerated.

Caching Implementation:
- In-memory cache with 90-day TTL
- Cache key format: improvement_plan:{session_id}
- TTL: 7776000 seconds (90 days)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, Tuple

from app.services.auth import get_current_user
from app.services.database import get_session
from app.services.comprehensive_analysis import ComprehensiveAnalysisGenerator
from app.models.analysis import ImprovementPlan

# Initialize router
router = APIRouter(prefix="/api/analysis", tags=["analysis"])

# In-memory cache for improvement plans (90-day TTL)
# Dict maps session_id -> (ImprovementPlan, expiry_datetime)
_improvement_plan_cache: Dict[str, Tuple[ImprovementPlan, datetime]] = {}


def _is_cache_expired(session_id: str) -> bool:
    """Check if a cached plan has expired (90 days TTL)."""
    if session_id not in _improvement_plan_cache:
        return True
    
    cached_plan, expiry_time = _improvement_plan_cache[session_id]
    return datetime.now(timezone.utc) > expiry_time


async def _get_cached_plan(session_id: str) -> Optional[ImprovementPlan]:
    """Retrieve cached improvement plan if it exists and hasn't expired."""
    if session_id in _improvement_plan_cache and not _is_cache_expired(session_id):
        return _improvement_plan_cache[session_id][0]
    return None


async def _cache_plan(session_id: str, plan: ImprovementPlan) -> None:
    """Cache an improvement plan with 90-day TTL."""
    expiry_time = datetime.now(timezone.utc) + timedelta(days=90)
    _improvement_plan_cache[session_id] = (plan, expiry_time)


async def _generate_improvement_plan(session_id: str) -> ImprovementPlan:
    """
    Generate an improvement plan from interview analysis.
    
    Retrieves the session, checks it's finalized and has analysis,
    then uses ComprehensiveAnalysisGenerator to build the plan.
    """
    # Retrieve session
    session = await get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Interview session not found"
        )
    
    # Check if session is finalized
    if not session.get("finalized"):
        raise HTTPException(
            status_code=400,
            detail="Analysis is still being processed. Please return in a few moments."
        )
    
    # Check if session has analysis
    analysis = session.get("analysis")
    if not analysis:
        raise HTTPException(
            status_code=400,
            detail="Interview analysis is not available. This session may not have completed analysis generation."
        )
    
    # Check if there are any gaps to analyze
    skill_gaps = analysis.get("skill_gaps", [])
    communication_gaps_obj = analysis.get("communication_assessment", {})
    communication_gaps = communication_gaps_obj.get("gaps", []) if isinstance(communication_gaps_obj, dict) else []
    
    if not skill_gaps and not communication_gaps:
        # Return a special response indicating no gaps found
        raise HTTPException(
            status_code=200,
            detail="No specific areas for improvement were identified in this interview. Great job!"
        )
    
    # Extract gaps using the service
    generator = ComprehensiveAnalysisGenerator()
    
    try:
        # Extract technical gaps and prioritize
        technical_gaps_list = generator.extract_technical_gaps(analysis)
        prioritized_gaps = generator.assign_priority(technical_gaps_list, analysis)
        
        # Build topic info for each gap
        topic_info_map = {}
        for gap in prioritized_gaps:
            topic_info = generator.build_topic_info(gap.category)
            if topic_info:
                topic_info_map[gap.category] = topic_info.model_dump()
        
        # Build resolution paths
        resolution_paths = generator.build_resolution_paths(technical_gaps_list)
        
        # Curate resources for all gaps
        curated_resources, coverage_gaps = generator.curate_resources(technical_gaps_list)
        
        # Extract and categorize communication gaps
        communication_gaps_list = generator.extract_communication_gaps(analysis)
        
        # Build holistic guidance
        holistic_guidance = generator.build_holistic_guidance(prioritized_gaps, communication_gaps_list)
        
        # Build transformation analysis
        transformations = analysis.get("transformations", [])
        transformation_analysis = None
        if transformations and len(transformations) > 0:
            first_transformation = transformations[0]
            transformation_analysis = {
                "critical_moment": first_transformation.get("context", "Interview challenge"),
                "candidate_original": first_transformation.get("candidate_response", "")[:300],
                "elite_response": first_transformation.get("elite_response", "")[:500],
                "why_better": first_transformation.get("analysis", "")
            }
        
        # Compile technical analysis
        technical_analysis = {
            "gaps": [gap.model_dump() for gap in prioritized_gaps],
            "topic_info": topic_info_map,
            "resolution_paths": [path.model_dump() for path in resolution_paths],
            "coverage_gaps": coverage_gaps
        }
        
        # Compile communication analysis
        communication_analysis = {
            "gaps": [gap.model_dump() for gap in communication_gaps_list],
            "total_score": communication_gaps_obj.get("overall_score", 0) if isinstance(communication_gaps_obj, dict) else 0
        }
        
        # Compile resources analysis
        resources_analysis = {
            "resources": [r.model_dump() for r in curated_resources],
            "total_count": len(curated_resources),
            "coverage_gaps": coverage_gaps,
            "available_types": list(set(r.type for r in curated_resources))
        }
        
        # Create improvement plan
        session_date = session.get("created_at")
        if isinstance(session_date, datetime):
            session_date_str = session_date.isoformat()
        else:
            session_date_str = datetime.now(timezone.utc).isoformat()
        
        improvement_plan = ImprovementPlan(
            session_id=session_id,
            session_date=session_date_str,
            overall_score=int(session.get("performance_score", 0)),
            hire_verdict=analysis.get("hire_verdict", "Maybe"),
            technical_analysis=technical_analysis,
            communication_analysis=communication_analysis,
            holistic_guidance=holistic_guidance.model_dump() if holistic_guidance else {},
            transformation_analysis=transformation_analysis or {},
            resources_analysis=resources_analysis,
            generated_at=datetime.now(timezone.utc),
            cache_expires_at=datetime.now(timezone.utc) + timedelta(days=90)
        )
        
        return improvement_plan
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error generating improvement plan for session {session_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Failed to generate improvement plan"
        )


@router.get("/{session_id}")
async def get_improvement_plan(
    session_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Retrieve cached improvement plan or generate if not cached.
    
    Returns the improvement plan for a completed interview session.
    Plans are cached for 90 days for performance.
    
    **Requirements: 8.1, 8.2, 9.1**
    
    Args:
        session_id: The interview session ID
        current_user: Authenticated user from Bearer token
        
    Returns:
        Dict with success status and improvement plan data
        
    Raises:
        404: Session not found
        400: Session not finalized or no analysis available
        500: Generation failed
    """
    try:
        # Check cache first
        cached_plan = await _get_cached_plan(session_id)
        if cached_plan:
            return {
                "success": True,
                "plan": cached_plan.model_dump(),
                "from_cache": True
            }
        
        # Generate new plan
        plan = await _generate_improvement_plan(session_id)
        
        # Cache the plan
        await _cache_plan(session_id, plan)
        
        return {
            "success": True,
            "plan": plan.model_dump(),
            "from_cache": False
        }
        
    except HTTPException as e:
        if e.status_code == 200:
            # Special case for "no gaps" scenario
            return {
                "success": True,
                "message": e.detail,
                "plan": None
            }
        raise
    except Exception as e:
        print(f"Error in get_improvement_plan: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Unable to load analysis. Please try again."
        )


@router.post("/{session_id}/refresh")
async def refresh_improvement_plan(
    session_id: str,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Force regenerate an improvement plan, bypassing cache.
    
    Regenerates the improvement plan for a session even if a cached
    version exists. The new plan replaces the cached version.
    
    **Requirements: 8.2**
    
    Args:
        session_id: The interview session ID
        current_user: Authenticated user from Bearer token
        
    Returns:
        Dict with success status and regenerated plan
        
    Raises:
        404: Session not found
        400: Session not finalized or no analysis available
        500: Regeneration failed
    """
    try:
        # Generate new plan (bypassing cache)
        plan = await _generate_improvement_plan(session_id)
        
        # Update cache with new plan
        await _cache_plan(session_id, plan)
        
        return {
            "success": True,
            "message": "Plan regenerated successfully",
            "plan": plan.model_dump()
        }
        
    except HTTPException as e:
        if e.status_code == 200:
            return {
                "success": True,
                "message": e.detail,
                "plan": None
            }
        raise
    except Exception as e:
        print(f"Error in refresh_improvement_plan: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Failed to regenerate analysis. Please try again."
        )


@router.get("/{session_id}/resources")
async def get_resources(
    session_id: str,
    filter_type: Optional[str] = Query(None, description="Filter resources by type (e.g., 'book', 'course')"),
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get resources for a session's gaps with optional type filtering.
    
    Returns all curated resources related to the gaps detected in
    an interview session. Results can be filtered by resource type.
    
    **Requirements: 8.1**
    
    Args:
        session_id: The interview session ID
        filter_type: Optional resource type to filter by
        current_user: Authenticated user from Bearer token
        
    Returns:
        Dict with resources list and metadata
        
    Raises:
        404: Session not found
        400: Session not finalized or no analysis available
        500: Query failed
    """
    try:
        # Retrieve session to verify it exists and is finalized
        session = await get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=404,
                detail="Interview session not found"
            )
        
        if not session.get("finalized"):
            raise HTTPException(
                status_code=400,
                detail="Analysis is still being processed. Please return in a few moments."
            )
        
        analysis = session.get("analysis")
        if not analysis:
            raise HTTPException(
                status_code=400,
                detail="Interview analysis is not available."
            )
        
        # Extract gaps
        generator = ComprehensiveAnalysisGenerator()
        technical_gaps_list = generator.extract_technical_gaps(analysis)
        
        # Curate resources
        curated_resources, coverage_gaps = generator.curate_resources(
            technical_gaps_list,
            filter_type=filter_type
        )
        
        # Get unique types
        available_types = list(set(r.type for r in curated_resources))
        
        return {
            "success": True,
            "resources": [r.model_dump() for r in curated_resources],
            "total_count": len(curated_resources),
            "filtered_count": len(curated_resources),
            "available_types": available_types,
            "coverage_gaps": coverage_gaps,
            "filter_applied": filter_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_resources: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve resources. Please try again."
        )
