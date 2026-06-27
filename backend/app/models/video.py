"""Video metadata models for recording and playback functionality."""

from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class VideoMetadata(BaseModel):
    """
    Metadata for recorded video files.
    
    Stores technical information about video recordings including duration,
    file size, codec, resolution, and frame rate. Used for both storage
    metadata tracking and API responses.
    
    Attributes:
        videoUrl (str): URL/path to the stored video file, typically from Dropbox
        duration (float): Recording duration in seconds
        fileSize (int): File size in bytes
        codec (str): Video codec used (e.g., 'h264', 'vp8', 'vp9')
        width (int): Video frame width in pixels
        height (int): Video frame height in pixels
        frameRate (float): Frames per second of the video
        uploadedAt (datetime): ISO timestamp when video was uploaded to storage
        recordingMode (str): Recording mode - either 'audio' or 'video'
    """
    
    videoUrl: str
    duration: float  # seconds
    fileSize: int  # bytes
    codec: str  # 'h264', 'vp8', 'vp9', etc.
    width: int  # pixels
    height: int  # pixels
    frameRate: float  # frames per second
    uploadedAt: datetime
    recordingMode: str  # 'audio' or 'video'

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "videoUrl": "https://dl.dropboxusercontent.com/s/example/video.mp4",
                "duration": 1200.5,
                "fileSize": 52428800,
                "codec": "h264",
                "width": 1280,
                "height": 720,
                "frameRate": 30.0,
                "uploadedAt": "2024-01-15T10:30:00Z",
                "recordingMode": "video"
            }
        }
    )


class RecordingInfo(BaseModel):
    """
    Recording information for an interview session.
    
    Provides comprehensive recording status and metadata including whether
    video was recorded, audio duration, and optional video metadata.
    
    Attributes:
        sessionId (str): Unique identifier for the interview session
        recordingMode (str): Recording mode selected for session - 'audio' or 'video'
        audioLength (float): Duration of audio recording in seconds
        hasVideo (bool): Whether video was successfully recorded
        videoMetadata (Optional[VideoMetadata]): Video metadata if video was recorded
        videoDuration (Optional[float]): Video duration in seconds (if available)
    """
    
    sessionId: str
    recordingMode: str  # 'audio' or 'video'
    audioLength: float  # seconds
    hasVideo: bool
    videoMetadata: Optional[VideoMetadata] = None
    videoDuration: Optional[float] = None

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "sessionId": "550e8400-e29b-41d4-a716-446655440000",
                "recordingMode": "video",
                "audioLength": 1200.5,
                "hasVideo": True,
                "videoDuration": 1200.5,
                "videoMetadata": {
                    "videoUrl": "https://dl.dropboxusercontent.com/s/example/video.mp4",
                    "duration": 1200.5,
                    "fileSize": 52428800,
                    "codec": "h264",
                    "width": 1280,
                    "height": 720,
                    "frameRate": 30.0,
                    "uploadedAt": "2024-01-15T10:30:00Z",
                    "recordingMode": "video"
                }
            }
        }
    )
