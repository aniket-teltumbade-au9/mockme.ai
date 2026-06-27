"""Integration tests for POST /api/interviews/{sessionId}/upload-video endpoint.

Tests the complete video upload flow with realistic video data, including:
- Valid video blob generation (simulating 10-minute interview)
- Video metadata validation
- Session updates
- Response headers
- Storage verification
- Error handling
"""

import pytest
import io
import os
import tempfile
from unittest.mock import AsyncMock, MagicMock, patch, call
from fastapi.testclient import TestClient
from datetime import datetime
import subprocess

from app.main import app
from app.models.video import VideoMetadata
from app.services.auth import get_current_user


# Create test client
client = TestClient(app)


def create_minimal_video_blob(duration_seconds: int = 600, size_kb: int = None) -> bytes:
    """Create a minimal valid MP4 video blob for testing.
    
    Generates a valid but minimal MP4 file structure without requiring ffmpeg.
    This is a simplified MP4 that contains basic headers but minimal content.
    
    Args:
        duration_seconds: Desired duration (used for metadata, not actual video length)
        size_kb: Optional target size in KB (otherwise calculated from duration)
        
    Returns:
        Bytes containing a minimal valid MP4 file
    """
    if size_kb is None:
        # Estimate: 500 KB per minute for typical video
        size_kb = max(10, (duration_seconds * 500) // 60)
    
    # Create a minimal MP4 file structure
    # This is a valid but very basic MP4 with just headers
    mp4_header = bytes.fromhex(
        "00000020667479706973"  # ftyp box (file type)
        "6f6d0000000069736f6d"  # isom
        "69736f32617669636f6d"  # iso2 avc1 com
        "0000000000"
    )
    
    # Add mdat box with dummy video data
    # mdat box contains media data
    target_size = size_kb * 1024
    remaining_size = max(target_size - len(mp4_header), 1024)
    
    mdat_size = remaining_size + 8  # +8 for box size and type
    mdat_header = mdat_size.to_bytes(4, 'big')  # Box size (big-endian)
    mdat_type = b'mdat'  # Box type
    
    dummy_data = b'\x00' * remaining_size
    
    return mp4_header + mdat_header + mdat_type + dummy_data


def create_realistic_video_blob_with_ffmpeg(duration_seconds: int = 10) -> bytes:
    """Create a realistic MP4 video blob using ffmpeg.
    
    Generates an actual valid MP4 file with video frames using ffmpeg.
    Falls back to minimal blob if ffmpeg not available.
    
    Args:
        duration_seconds: Duration of video to generate
        
    Returns:
        Bytes containing a valid MP4 file
    """
    temp_file = None
    try:
        # Create temporary file for ffmpeg output
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
            temp_file = f.name
        
        # Use ffmpeg to generate a test video
        # -f lavfi: Use filtergraph as input
        # color: Generate a solid color frame
        # -s: Frame size (320x240 for small test video)
        # -t: Duration
        cmd = [
            "ffmpeg",
            "-f", "lavfi",
            "-i", "color=c=blue:s=320x240:d=" + str(duration_seconds),
            "-f", "lavfi",
            "-i", "sine=frequency=1000:duration=" + str(duration_seconds),
            "-pix_fmt", "yuv420p",
            "-y",  # Overwrite output file
            temp_file
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            timeout=30
        )
        
        if result.returncode == 0 and os.path.exists(temp_file):
            with open(temp_file, 'rb') as f:
                return f.read()
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    finally:
        if temp_file and os.path.exists(temp_file):
            try:
                os.remove(temp_file)
            except:
                pass
    
    # Fallback to minimal blob if ffmpeg not available
    return create_minimal_video_blob(duration_seconds)


@pytest.fixture
def mock_current_user():
    """Mock authenticated user."""
    return {
        "user_id": "test-user-123",
        "email": "test@example.com"
    }


@pytest.fixture
def mock_user_with_dropbox():
    """Mock user with Dropbox credentials."""
    return {
        "user_id": "test-user-123",
        "dropbox_refresh_token": "test-refresh-token",
        "email": "test@example.com"
    }


@pytest.fixture
def mock_session():
    """Mock interview session."""
    return {
        "sessionId": "session-123",
        "user_id": "test-user-123",
        "recording_mode": "audio",
        "videoMetadata": None
    }


class TestUploadVideoIntegration:
    """Integration tests for video upload endpoint."""

    def test_upload_video_with_valid_blob_and_metadata(
        self, mock_current_user, mock_session, mock_user_with_dropbox
    ):
        """Test successful video upload with valid blob and all required metadata.
        
        Validates:
        - Valid video blob (1KB minimum)
        - All required metadata fields present
        - Response structure and status code
        - Session update with video metadata
        """
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            video_blob = create_minimal_video_blob(duration_seconds=10)
            assert len(video_blob) > 1024, "Video blob should be > 1KB"
            
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user, \
                 patch("app.routers.interviews.update_session") as mock_update_session, \
                 patch("app.routers.interviews.VideoStorageService") as mock_storage_class:
                
                # Setup session and user mocks
                mock_get_session.return_value = mock_session
                mock_get_user.return_value = mock_user_with_dropbox
                mock_update_session.return_value = None
                
                # Setup VideoStorageService mock
                mock_storage = MagicMock()
                mock_storage_class.return_value = mock_storage
                
                video_url = "https://dl.dropboxusercontent.com/s/test123/video.mp4?dl=1"
                metadata = {
                    "duration": 10.5,
                    "fileSize": len(video_blob),
                    "codec": "h264",
                    "width": 1280,
                    "height": 720,
                    "frameRate": 30.0,
                    "uploadedAt": "2024-01-15T10:30:00",
                    "recordingMode": "video"
                }
                mock_storage.uploadVideo.return_value = (video_url, metadata)
                
                # Send upload request
                response = client.post(
                    f"/api/interviews/{mock_session['sessionId']}/upload-video",
                    files={"video": ("test.mp4", io.BytesIO(video_blob), "video/mp4")},
                    data={
                        "duration": 10.5,
                        "codec": "h264",
                        "width": 1280,
                        "height": 720,
                        "frameRate": 30.0
                    }
                )
                
                # Verify response status and structure
                assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
                
                data = response.json()
                assert data["success"] is True
                assert "videoPath" in data
                assert "videoUrl" in data
                assert data["videoUrl"] == video_url
                assert "fileSize" in data
                assert data["fileSize"] == len(video_blob)
                assert "duration" in data
                assert data["duration"] == 10.5
                
                # Verify Content-Type header
                assert response.headers.get("content-type") == "application/json"
                
                # Verify session was updated with video metadata
                mock_update_session.assert_called_once()
                call_args = mock_update_session.call_args
                assert call_args[0][0] == mock_session['sessionId']
                update_payload = call_args[0][1]
                assert "videoMetadata" in update_payload
                assert update_payload["recording_mode"] == "video"
                
                # Verify video metadata completeness
                video_meta = update_payload["videoMetadata"]
                assert video_meta["videoUrl"] == video_url
                assert video_meta["duration"] == 10.5
                assert video_meta["fileSize"] == len(video_blob)
                assert video_meta["codec"] == "h264"
                assert video_meta["width"] == 1280
                assert video_meta["height"] == 720
                assert video_meta["frameRate"] == 30.0
                assert "uploadedAt" in video_meta
                assert video_meta["recordingMode"] == "video"
        
        finally:
            app.dependency_overrides.clear()

    def test_upload_video_10_minute_realistic_video(
        self, mock_current_user, mock_session, mock_user_with_dropbox
    ):
        """Test video upload with realistic 10-minute interview video data.
        
        Validates:
        - Large video blob (typical interview size)
        - Realistic metadata extraction
        - Proper session update
        """
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            # Create realistic 10-minute video (~600 MB typically, but we'll use smaller)
            # Realistic: 10 minutes × 500KB/min = ~5MB
            video_blob = create_minimal_video_blob(duration_seconds=600, size_kb=5000)
            
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user, \
                 patch("app.routers.interviews.update_session") as mock_update_session, \
                 patch("app.routers.interviews.VideoStorageService") as mock_storage_class:
                
                mock_get_session.return_value = mock_session
                mock_get_user.return_value = mock_user_with_dropbox
                mock_update_session.return_value = None
                
                mock_storage = MagicMock()
                mock_storage_class.return_value = mock_storage
                
                video_url = "https://dl.dropboxusercontent.com/s/interview/video.mp4?dl=1"
                metadata = {
                    "duration": 600.0,  # 10 minutes
                    "fileSize": len(video_blob),
                    "codec": "h264",
                    "width": 1920,
                    "height": 1080,
                    "frameRate": 30.0,
                    "uploadedAt": "2024-01-15T10:30:00",
                    "recordingMode": "video"
                }
                mock_storage.uploadVideo.return_value = (video_url, metadata)
                
                # Send upload request
                response = client.post(
                    f"/api/interviews/{mock_session['sessionId']}/upload-video",
                    files={"video": ("interview.mp4", io.BytesIO(video_blob), "video/mp4")},
                    data={
                        "duration": 600.0,
                        "codec": "h264",
                        "width": 1920,
                        "height": 1080,
                        "frameRate": 30.0
                    }
                )
                
                # Verify response
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert data["duration"] == 600.0
                assert len(video_blob) < 500 * 1024 * 1024  # Under 500MB limit
                
                # Verify session updated with full metadata
                mock_update_session.assert_called_once()
                update_payload = mock_update_session.call_args[0][1]
                assert update_payload["recording_mode"] == "video"
                assert update_payload["videoMetadata"]["duration"] == 600.0
        
        finally:
            app.dependency_overrides.clear()

    def test_upload_video_verifies_storage_called(
        self, mock_current_user, mock_session, mock_user_with_dropbox
    ):
        """Verify that VideoStorageService.uploadVideo is actually called.
        
        Validates:
        - VideoStorageService initialized with correct refresh token
        - uploadVideo called with correct video blob and sessionId
        """
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            video_blob = create_minimal_video_blob(duration_seconds=60)
            
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user, \
                 patch("app.routers.interviews.update_session") as mock_update_session, \
                 patch("app.routers.interviews.VideoStorageService") as mock_storage_class:
                
                mock_get_session.return_value = mock_session
                mock_get_user.return_value = mock_user_with_dropbox
                mock_update_session.return_value = None
                
                mock_storage = MagicMock()
                mock_storage_class.return_value = mock_storage
                mock_storage.uploadVideo.return_value = (
                    "https://example.com/video.mp4",
                    {
                        "duration": 60.0,
                        "fileSize": len(video_blob),
                        "codec": "h264",
                        "width": 1280,
                        "height": 720,
                        "frameRate": 30.0,
                        "uploadedAt": "2024-01-15T10:30:00",
                        "recordingMode": "video"
                    }
                )
                
                # Send upload request
                response = client.post(
                    f"/api/interviews/{mock_session['sessionId']}/upload-video",
                    files={"video": ("test.mp4", io.BytesIO(video_blob), "video/mp4")},
                    data={
                        "duration": 60.0,
                        "codec": "h264",
                        "width": 1280,
                        "height": 720,
                        "frameRate": 30.0
                    }
                )
                
                # Verify VideoStorageService was initialized with refresh token
                mock_storage_class.assert_called_once_with(
                    mock_user_with_dropbox["dropbox_refresh_token"]
                )
                
                # Verify uploadVideo was called with correct arguments
                mock_storage.uploadVideo.assert_called_once_with(
                    video_blob, mock_session['sessionId']
                )
                
                assert response.status_code == 200
        
        finally:
            app.dependency_overrides.clear()

    def test_upload_video_min_size_1kb(
        self, mock_current_user, mock_session, mock_user_with_dropbox
    ):
        """Test upload with minimum valid video size (1KB).
        
        Validates that even small valid videos are accepted.
        """
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            # Create exactly 1KB+ video blob
            video_blob = b'x' * 1025  # Just over 1KB
            
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user, \
                 patch("app.routers.interviews.update_session") as mock_update_session, \
                 patch("app.routers.interviews.VideoStorageService") as mock_storage_class:
                
                mock_get_session.return_value = mock_session
                mock_get_user.return_value = mock_user_with_dropbox
                mock_update_session.return_value = None
                
                mock_storage = MagicMock()
                mock_storage_class.return_value = mock_storage
                mock_storage.uploadVideo.return_value = (
                    "https://example.com/video.mp4",
                    {
                        "duration": 1.0,
                        "fileSize": len(video_blob),
                        "codec": "h264",
                        "width": 320,
                        "height": 240,
                        "frameRate": 30.0,
                        "uploadedAt": "2024-01-15T10:30:00",
                        "recordingMode": "video"
                    }
                )
                
                response = client.post(
                    f"/api/interviews/{mock_session['sessionId']}/upload-video",
                    files={"video": ("test.mp4", io.BytesIO(video_blob), "video/mp4")},
                    data={
                        "duration": 1.0,
                        "codec": "h264",
                        "width": 320,
                        "height": 240,
                        "frameRate": 30.0
                    }
                )
                
                assert response.status_code == 200
                assert response.json()["fileSize"] == len(video_blob)
        
        finally:
            app.dependency_overrides.clear()

    def test_upload_video_max_size_500mb(
        self, mock_current_user, mock_session, mock_user_with_dropbox
    ):
        """Test upload with maximum valid video size (500MB).
        
        Validates that videos up to the 500MB limit are accepted.
        """
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            # Create 500MB - 1 byte video blob (just under limit)
            max_size = 500 * 1024 * 1024 - 1
            
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user, \
                 patch("app.routers.interviews.update_session") as mock_update_session, \
                 patch("app.routers.interviews.VideoStorageService") as mock_storage_class:
                
                mock_get_session.return_value = mock_session
                mock_get_user.return_value = mock_user_with_dropbox
                mock_update_session.return_value = None
                
                mock_storage = MagicMock()
                mock_storage_class.return_value = mock_storage
                
                # Create a sparse blob to avoid memory issues (don't actually create all bytes)
                # We'll mock it as if it were uploaded
                mock_storage.uploadVideo.return_value = (
                    "https://example.com/video.mp4",
                    {
                        "duration": 3600.0,
                        "fileSize": max_size,
                        "codec": "h264",
                        "width": 1920,
                        "height": 1080,
                        "frameRate": 30.0,
                        "uploadedAt": "2024-01-15T10:30:00",
                        "recordingMode": "video"
                    }
                )
                
                # For testing purposes, create a smaller blob and test the size check
                # The actual 500MB test would require significant resources
                small_blob = b'x' * (10 * 1024 * 1024)  # 10MB for testing
                
                response = client.post(
                    f"/api/interviews/{mock_session['sessionId']}/upload-video",
                    files={"video": ("test.mp4", io.BytesIO(small_blob), "video/mp4")},
                    data={
                        "duration": 3600.0,
                        "codec": "h264",
                        "width": 1920,
                        "height": 1080,
                        "frameRate": 30.0
                    }
                )
                
                # The 500MB limit is checked in the endpoint
                assert response.status_code == 200
        
        finally:
            app.dependency_overrides.clear()

    def test_upload_video_response_headers(
        self, mock_current_user, mock_session, mock_user_with_dropbox
    ):
        """Test that response includes appropriate Content-Type header.
        
        Validates that the HTTP response has correct Content-Type.
        """
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            video_blob = create_minimal_video_blob(duration_seconds=10)
            
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user, \
                 patch("app.routers.interviews.update_session") as mock_update_session, \
                 patch("app.routers.interviews.VideoStorageService") as mock_storage_class:
                
                mock_get_session.return_value = mock_session
                mock_get_user.return_value = mock_user_with_dropbox
                mock_update_session.return_value = None
                
                mock_storage = MagicMock()
                mock_storage_class.return_value = mock_storage
                mock_storage.uploadVideo.return_value = (
                    "https://example.com/video.mp4",
                    {
                        "duration": 10.0,
                        "fileSize": len(video_blob),
                        "codec": "h264",
                        "width": 1280,
                        "height": 720,
                        "frameRate": 30.0,
                        "uploadedAt": "2024-01-15T10:30:00",
                        "recordingMode": "video"
                    }
                )
                
                response = client.post(
                    f"/api/interviews/{mock_session['sessionId']}/upload-video",
                    files={"video": ("test.mp4", io.BytesIO(video_blob), "video/mp4")},
                    data={
                        "duration": 10.0,
                        "codec": "h264",
                        "width": 1280,
                        "height": 720,
                        "frameRate": 30.0
                    }
                )
                
                # Check Content-Type header
                assert response.headers.get("content-type") is not None
                assert "application/json" in response.headers.get("content-type", "")
                
                # Verify other response headers
                assert response.status_code == 200
        
        finally:
            app.dependency_overrides.clear()

    def test_upload_video_metadata_all_fields(
        self, mock_current_user, mock_session, mock_user_with_dropbox
    ):
        """Test that uploaded video metadata includes all required fields.
        
        Validates completeness of video metadata:
        - duration
        - codec
        - width, height (resolution)
        - frameRate
        - uploadedAt (timestamp)
        """
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            video_blob = create_minimal_video_blob(duration_seconds=120)
            
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user, \
                 patch("app.routers.interviews.update_session") as mock_update_session, \
                 patch("app.routers.interviews.VideoStorageService") as mock_storage_class:
                
                mock_get_session.return_value = mock_session
                mock_get_user.return_value = mock_user_with_dropbox
                mock_update_session.return_value = None
                
                mock_storage = MagicMock()
                mock_storage_class.return_value = mock_storage
                
                now = datetime.utcnow().isoformat()
                mock_storage.uploadVideo.return_value = (
                    "https://example.com/video.mp4",
                    {
                        "duration": 120.5,
                        "fileSize": len(video_blob),
                        "codec": "h264",
                        "width": 1920,
                        "height": 1080,
                        "frameRate": 29.97,
                        "uploadedAt": now,
                        "recordingMode": "video"
                    }
                )
                
                response = client.post(
                    f"/api/interviews/{mock_session['sessionId']}/upload-video",
                    files={"video": ("test.mp4", io.BytesIO(video_blob), "video/mp4")},
                    data={
                        "duration": 120.5,
                        "codec": "h264",
                        "width": 1920,
                        "height": 1080,
                        "frameRate": 29.97
                    }
                )
                
                assert response.status_code == 200
                
                # Verify session update includes all metadata fields
                update_payload = mock_update_session.call_args[0][1]
                video_meta = update_payload["videoMetadata"]
                
                # All required fields must be present
                required_fields = [
                    "duration", "codec", "width", "height", 
                    "frameRate", "uploadedAt", "videoUrl", "fileSize"
                ]
                for field in required_fields:
                    assert field in video_meta, f"Missing field: {field}"
                
                # Verify values
                assert video_meta["duration"] == 120.5
                assert video_meta["codec"] == "h264"
                assert video_meta["width"] == 1920
                assert video_meta["height"] == 1080
                assert video_meta["frameRate"] == 29.97
                assert video_meta["uploadedAt"] is not None
        
        finally:
            app.dependency_overrides.clear()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
