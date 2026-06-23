import os
import shutil
from fastapi import APIRouter, Depends, HTTPException
from app.services.auth import get_current_user
from app.services.storage import get_storage_dir

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.delete("/recordings/cleanup")
async def cleanup_recordings(current_user: dict = Depends(get_current_user)):
    """
    Clean up all recording files from the recordings directory.
    
    This endpoint removes:
    - All .mp3 files (TTS clips and mixed audio)
    - All .webm files (user turn recordings)
    - All subdirectories
    
    Use with caution - this is irreversible!
    """
    try:
        # get_storage_dir() already returns the recordings directory
        recordings_dir = get_storage_dir()
        
        if not os.path.exists(recordings_dir):
            return {
                "success": True,
                "message": "Recordings directory does not exist",
                "files_deleted": 0,
                "bytes_freed": 0
            }
        
        files_deleted = 0
        bytes_freed = 0
        errors = []
        
        # Walk through all files and subdirectories
        for root, dirs, files in os.walk(recordings_dir, topdown=False):
            # Delete all files
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    file_size = os.path.getsize(file_path)
                    os.remove(file_path)
                    files_deleted += 1
                    bytes_freed += file_size
                    print(f"Deleted: {file_path}")
                except Exception as e:
                    error_msg = f"Failed to delete {file_path}: {str(e)}"
                    errors.append(error_msg)
                    print(f"ERROR: {error_msg}")
            
            # Delete empty subdirectories
            for dir_name in dirs:
                dir_path = os.path.join(root, dir_name)
                try:
                    if os.path.isdir(dir_path) and not os.listdir(dir_path):
                        os.rmdir(dir_path)
                        print(f"Deleted empty directory: {dir_path}")
                except Exception as e:
                    error_msg = f"Failed to delete directory {dir_path}: {str(e)}"
                    errors.append(error_msg)
                    print(f"ERROR: {error_msg}")
        
        # Convert bytes to human-readable format
        bytes_freed_mb = bytes_freed / (1024 * 1024)
        
        response = {
            "success": True,
            "message": f"Cleanup completed. Deleted {files_deleted} files, freed {bytes_freed_mb:.2f} MB",
            "files_deleted": files_deleted,
            "bytes_freed": bytes_freed,
            "bytes_freed_mb": round(bytes_freed_mb, 2),
            "recordings_dir": recordings_dir
        }
        
        if errors:
            response["warnings"] = errors
            response["partial_success"] = True
        
        return response
        
    except Exception as e:
        print(f"CLEANUP ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to cleanup recordings: {str(e)}")


@router.get("/recordings/info")
async def get_recordings_info(current_user: dict = Depends(get_current_user)):
    """
    Get information about recordings directory without deleting anything.
    
    Returns:
    - Total number of files
    - Total size in bytes and MB
    - Breakdown by file type
    """
    try:
        # get_storage_dir() already returns the recordings directory
        recordings_dir = get_storage_dir()
        
        if not os.path.exists(recordings_dir):
            return {
                "exists": False,
                "message": "Recordings directory does not exist",
                "recordings_dir": recordings_dir
            }
        
        total_files = 0
        total_bytes = 0
        file_types = {}
        
        # Walk through all files
        for root, dirs, files in os.walk(recordings_dir):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    file_size = os.path.getsize(file_path)
                    total_files += 1
                    total_bytes += file_size
                    
                    # Track by extension
                    ext = os.path.splitext(file)[1].lower()
                    if ext not in file_types:
                        file_types[ext] = {"count": 0, "bytes": 0}
                    file_types[ext]["count"] += 1
                    file_types[ext]["bytes"] += file_size
                    
                except Exception as e:
                    print(f"Error reading file {file_path}: {str(e)}")
        
        total_mb = total_bytes / (1024 * 1024)
        
        # Add MB to each file type
        for ext in file_types:
            file_types[ext]["mb"] = round(file_types[ext]["bytes"] / (1024 * 1024), 2)
        
        return {
            "exists": True,
            "recordings_dir": recordings_dir,
            "total_files": total_files,
            "total_bytes": total_bytes,
            "total_mb": round(total_mb, 2),
            "file_types": file_types,
            "message": f"Found {total_files} files using {total_mb:.2f} MB"
        }
        
    except Exception as e:
        print(f"INFO ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get recordings info: {str(e)}")


@router.delete("/recordings/session/{session_id}")
async def cleanup_session_recordings(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Clean up recording files for a specific session.
    
    Deletes all files matching the session_id pattern:
    - {session_id}_*.mp3
    - {session_id}_*.webm
    """
    try:
        # get_storage_dir() already returns the recordings directory
        recordings_dir = get_storage_dir()
        
        if not os.path.exists(recordings_dir):
            return {
                "success": True,
                "message": "Recordings directory does not exist",
                "files_deleted": 0
            }
        
        files_deleted = 0
        bytes_freed = 0
        deleted_files = []
        
        # Find and delete all files for this session
        for file in os.listdir(recordings_dir):
            if file.startswith(session_id):
                file_path = os.path.join(recordings_dir, file)
                try:
                    if os.path.isfile(file_path):
                        file_size = os.path.getsize(file_path)
                        os.remove(file_path)
                        files_deleted += 1
                        bytes_freed += file_size
                        deleted_files.append(file)
                        print(f"Deleted: {file_path}")
                except Exception as e:
                    print(f"Error deleting {file_path}: {str(e)}")
        
        bytes_freed_mb = bytes_freed / (1024 * 1024)
        
        return {
            "success": True,
            "message": f"Deleted {files_deleted} files for session {session_id}",
            "session_id": session_id,
            "files_deleted": files_deleted,
            "bytes_freed": bytes_freed,
            "bytes_freed_mb": round(bytes_freed_mb, 2),
            "deleted_files": deleted_files
        }
        
    except Exception as e:
        print(f"SESSION CLEANUP ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to cleanup session recordings: {str(e)}")
