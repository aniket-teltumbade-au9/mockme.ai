from fastapi import APIRouter, HTTPException
from app.services.database import db
from app.models.jd_sample import JDSampleResponse
from typing import List
from bson import ObjectId

router = APIRouter(prefix="/api/jd-samples", tags=["jd-samples"])

@router.get("", response_model=List[JDSampleResponse])
async def get_jd_samples(skip: int = 0, limit: int = 50):
    """Fetch predefined JD samples with pagination."""
    try:
        samples = await db.jd_samples.find().skip(skip).limit(limit).to_list(length=None)
        
        # Convert MongoDB ObjectId to string for JSON serialization
        result = []
        for sample in samples:
            sample["id"] = str(sample.get("_id", ""))
            result.append(JDSampleResponse(**sample))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch JD samples: {str(e)}")

@router.get("/{sample_id}", response_model=JDSampleResponse)
async def get_jd_sample(sample_id: str):
    """Fetch a specific JD sample by ID."""
    try:
        # Try to convert to ObjectId if valid MongoDB ID format
        try:
            obj_id = ObjectId(sample_id)
            sample = await db.jd_samples.find_one({"_id": obj_id})
        except:
            # Fallback: try to find by day_number
            day_num = int(sample_id)
            sample = await db.jd_samples.find_one({"day_number": day_num})
        
        if not sample:
            raise HTTPException(status_code=404, detail="JD sample not found")
        
        sample["id"] = str(sample.get("_id", ""))
        return JDSampleResponse(**sample)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch JD sample: {str(e)}")

@router.get("/count/total")
async def count_jd_samples():
    """Get the total count of JD samples."""
    try:
        count = await db.jd_samples.count_documents({})
        return {"total": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to count JD samples: {str(e)}")
