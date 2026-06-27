"""Video storage service for uploading and managing video files in Dropbox."""

import json
import subprocess
import tempfile
import os
from typing import Tuple, Dict, Any
from datetime import datetime
import logging

import dropbox
import dropbox.exceptions
import dropbox.files

from app.logger import logger
from app.services.dropbox_service import DropboxService


class VideoStorageService:
    """Service for managing video storage in Dropbox.
    
    Handles video uploads with metadata extraction, shared link generation,
    and error handling following the DropboxService pattern.
    """

    def __init__(self, refresh_token: str):
        """Initialize VideoStorageService with Dropbox credentials.
        
        Args:
            refresh_token: Dropbox refresh token for authentication
        """
        self.dropbox_service = DropboxService(refresh_token)
        self.logger = logger

    def uploadVideo(
        self, blob: bytes, sessionId: str
    ) -> Tuple[str, Dict[str, Any]]:
        """Upload video blob to Dropbox and extract metadata.
        
        Uploads video to /MockMe.AI/videos/{sessionId}.mp4, extracts technical
        metadata (duration, fileSize, codec, dimensions, frameRate), and returns
        a publicly accessible shared link.
        
        Args:
            blob: Video file bytes to upload
            sessionId: Unique session identifier
            
        Returns:
            Tuple of (video_url, metadata_dict) where:
            - video_url (str): Publicly accessible Dropbox shared link
            - metadata_dict (dict): Video metadata including duration, fileSize,
              codec, width, height, frameRate, uploadedAt, recordingMode
              
        Raises:
            ValueError: If video blob is empty or metadata extraction fails
            RuntimeError: If Dropbox upload fails
        """
        try:
            if not blob or len(blob) == 0:
                raise ValueError("Video blob cannot be empty")

            # Upload video to Dropbox
            video_path = f"/MockMe.AI/videos/{sessionId}.mp4"
            self.logger.info(
                f"Uploading video for session {sessionId} to {video_path} "
                f"(size: {len(blob)} bytes)"
            )

            self.dropbox_service.dbx.files_upload(
                blob,
                video_path,
                mode=dropbox.files.WriteMode.overwrite,
            )
            self.logger.info(f"Successfully uploaded video to {video_path}")

            # Extract metadata from blob
            metadata = self._extract_metadata(blob)
            metadata["uploadedAt"] = datetime.utcnow().isoformat()
            metadata["recordingMode"] = "video"
            metadata["fileSize"] = len(blob)

            # Get shared link for public access
            video_url = self.dropbox_service._get_or_create_shared_link(
                video_path
            )
            self.logger.info(
                f"Generated shared link for video: {video_url}"
            )

            return video_url, metadata

        except ValueError as e:
            self.logger.error(f"Invalid video blob: {str(e)}")
            raise
        except dropbox.exceptions.ApiError as e:
            self.logger.error(
                f"Dropbox API error uploading video for session {sessionId}: "
                f"{str(e)}"
            )
            raise RuntimeError(
                f"Failed to upload video to Dropbox: {str(e)}"
            ) from e
        except Exception as e:
            self.logger.error(
                f"Unexpected error during video upload for session {sessionId}: "
                f"{str(e)}"
            )
            raise

    def _extract_metadata(self, blob: bytes) -> Dict[str, Any]:
        """Extract video metadata using ffprobe.
        
        Extracts duration, codec, resolution, and frame rate from video blob.
        Falls back to safe defaults if ffprobe is unavailable.
        
        Args:
            blob: Video file bytes
            
        Returns:
            Dictionary containing:
            - duration (float): Duration in seconds
            - codec (str): Video codec name (e.g., 'h264', 'vp8')
            - width (int): Frame width in pixels
            - height (int): Frame height in pixels
            - frameRate (float): Frames per second
            
        Raises:
            ValueError: If video metadata cannot be extracted
        """
        temp_file = None
        try:
            # Write blob to temporary file for ffprobe analysis
            with tempfile.NamedTemporaryFile(
                delete=False, suffix=".mp4"
            ) as temp:
                temp.write(blob)
                temp_file = temp.name

            self.logger.info(
                f"Extracting metadata from video "
                f"(temp file: {temp_file}, size: {len(blob)} bytes)"
            )

            # Use ffprobe to extract metadata
            cmd = [
                "ffprobe",
                "-v",
                "error",
                "-select_streams",
                "v:0",
                "-show_entries",
                "stream=codec_name,width,height,r_frame_rate,duration",
                "-show_entries",
                "format=duration",
                "-of",
                "json",
                temp_file,
            ]

            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=30
            )

            if result.returncode != 0:
                self.logger.warning(
                    f"ffprobe error extracting metadata: {result.stderr}"
                )
                raise ValueError("Failed to extract video metadata")

            data = json.loads(result.stdout)
            self.logger.info(f"FFprobe output: {data}")

            # Extract from streams first, then format as fallback
            stream_data = {}
            if data.get("streams") and len(data["streams"]) > 0:
                stream = data["streams"][0]
                stream_data = {
                    "codec": stream.get("codec_name", "h264"),
                    "width": stream.get("width", 1280),
                    "height": stream.get("height", 720),
                    "frameRate": self._parse_frame_rate(
                        stream.get("r_frame_rate", "30/1")
                    ),
                }

            format_data = data.get("format", {})
            duration = float(
                format_data.get("duration", stream_data.get("duration", 0))
            )

            metadata = {
                "duration": duration,
                "codec": stream_data.get("codec", "h264"),
                "width": stream_data.get("width", 1280),
                "height": stream_data.get("height", 720),
                "frameRate": stream_data.get("frameRate", 30.0),
            }

            self.logger.info(f"Extracted video metadata: {metadata}")
            return metadata

        except subprocess.TimeoutExpired:
            self.logger.error("ffprobe command timed out")
            raise ValueError("Metadata extraction timed out")
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse ffprobe output: {str(e)}")
            raise ValueError("Invalid metadata format")
        except Exception as e:
            self.logger.error(f"Error extracting metadata: {str(e)}")
            raise ValueError(f"Failed to extract metadata: {str(e)}")
        finally:
            # Clean up temporary file
            if temp_file and os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                    self.logger.info(f"Cleaned up temporary file: {temp_file}")
                except Exception as e:
                    self.logger.warning(
                        f"Failed to clean up temp file {temp_file}: {str(e)}"
                    )

    def getVideoUrl(self, sessionId: str) -> str:
        """Retrieve stored video URL for a session.
        
        Returns the publicly accessible Dropbox shared link for the video
        associated with the given sessionId. Video must have been previously
        uploaded via uploadVideo().
        
        Args:
            sessionId: Session identifier
            
        Returns:
            Publicly accessible video URL
            
        Raises:
            RuntimeError: If video not found or link generation fails
        """
        try:
            video_path = f"/MockMe.AI/videos/{sessionId}.mp4"
            self.logger.info(
                f"Retrieving video URL for session {sessionId} at {video_path}"
            )

            # Use DropboxService to get or create shared link
            video_url = self.dropbox_service._get_or_create_shared_link(
                video_path
            )
            self.logger.info(
                f"Successfully retrieved video URL for session {sessionId}: "
                f"{video_url}"
            )
            return video_url

        except dropbox.exceptions.ApiError as e:
            # Handle file not found error
            if (
                e.error.is_path()
                and e.error.get_path().is_not_found()
            ):
                self.logger.error(
                    f"Video not found for session {sessionId} at {video_path}"
                )
                raise RuntimeError(
                    f"Video not found for session {sessionId}"
                ) from e
            # Handle other Dropbox API errors
            self.logger.error(
                f"Dropbox API error retrieving video URL for session "
                f"{sessionId}: {str(e)}"
            )
            raise RuntimeError(
                f"Failed to retrieve video URL: {str(e)}"
            ) from e
        except Exception as e:
            self.logger.error(
                f"Unexpected error retrieving video URL for session {sessionId}: "
                f"{str(e)}"
            )
            raise RuntimeError(
                f"Failed to retrieve video URL: {str(e)}"
            ) from e

    def deleteVideo(self, sessionId: str) -> bool:
        """Delete video file from Dropbox.
        
        Removes the video file associated with the session from Dropbox storage.
        Used when deleting interview sessions.
        
        Args:
            sessionId: Session identifier
            
        Returns:
            True if deletion successful, False if file not found
            
        Raises:
            RuntimeError: If Dropbox API error occurs
        """
        try:
            video_path = f"/MockMe.AI/videos/{sessionId}.mp4"
            self.logger.info(
                f"Attempting to delete video for session {sessionId} at {video_path}"
            )

            self.dropbox_service.dbx.files_delete(video_path)
            self.logger.info(
                f"Successfully deleted video for session {sessionId}"
            )
            return True

        except dropbox.exceptions.ApiError as e:
            # Handle file not found error
            if (
                e.error.is_path()
                and e.error.get_path().is_not_found()
            ):
                self.logger.warning(
                    f"Video file not found for session {sessionId} at {video_path}"
                )
                return False
            # Handle other Dropbox API errors
            self.logger.error(
                f"Dropbox API error deleting video for session {sessionId}: "
                f"{str(e)}"
            )
            raise RuntimeError(
                f"Failed to delete video from Dropbox: {str(e)}"
            ) from e
        except Exception as e:
            self.logger.error(
                f"Unexpected error deleting video for session {sessionId}: "
                f"{str(e)}"
            )
            raise RuntimeError(
                f"Failed to delete video: {str(e)}"
            ) from e

    def _parse_frame_rate(self, frame_rate_str: str) -> float:
        """Parse frame rate from ffprobe format (e.g., '30/1' or '30').
        
        Args:
            frame_rate_str: Frame rate string from ffprobe
            
        Returns:
            Frame rate as float
        """
        try:
            if "/" in frame_rate_str:
                numerator, denominator = frame_rate_str.split("/")
                return float(numerator) / float(denominator)
            return float(frame_rate_str)
        except (ValueError, ZeroDivisionError):
            self.logger.warning(
                f"Could not parse frame rate '{frame_rate_str}', "
                f"defaulting to 30.0"
            )
            return 30.0
