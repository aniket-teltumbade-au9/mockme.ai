"""Tests for GET /api/interviews/{sessionId}/video-info endpoint.

Tests retrieval of video metadata and playback URLs after successful upload,
validating correct response structure, video accessibility, and authorization.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from datetime import datetime, timezone
import json

from app.main import app
from app.models.video import VideoMetadata
from app.services.auth import get_current_user


# Create test client
client = TestClient(app)


@pytest.fixture
def mock_current_user():
    """Mock authenticated user."""
    return {
        "user_id": "test-user-123",
        "email": "test@example.com"
    }


@pytest.fixture
def mock_current_user_other():
    """Mock another authenticated user."""
    return {
        "user_id": "other-user-456",
        "email": "other@example.com"
    }


@pytest.fixture
def video_metadata_dict():
    """Sample video metadata dictionary."""
    return {
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


@pytest.fixture
def video_metadata_model(video_metadata_dict):
    """Sample VideoMetadata model."""
    return VideoMetadata(**{
        **video_metadata_dict,
        "uploadedAt": datetime.fromisoformat(video_metadata_dict["uploadedAt"].replace("Z", "+00:00"))
    })


@pytest.fixture
def mock_session_with_video(video_metadata_dict):
    """Mock interview session with video metadata."""
    return {
        "sessionId": "session-123",
        "user_id": "test-user-123",
        "recording_mode": "video",
        "videoMetadata": video_metadata_dict
    }


@pytest.fixture
def mock_session_audio_only():
    """Mock interview session with audio only (no video)."""
    return {
        "sessionId": "session-audio-456",
        "user_id": "test-user-123",
        "recording_mode": "audio",
        "videoMetadata": None
    }


@pytest.fixture
def mock_session_other_user(video_metadata_dict):
    """Mock interview session belonging to different user."""
    return {
        "sessionId": "session-other-789",
        "user_id": "other-user-456",
        "recording_mode": "video",
        "videoMetadata": video_metadata_dict
    }


class TestVideoInfoRetrievalSuccess:
    """Test successful video-info retrieval scenarios."""

    def test_get_video_info_success_with_video(self, mock_current_user, 
                                               mock_session_with_video,
                                               video_metadata_dict):
        """Test successful retrieval of video-info for video mode session."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = mock_session_with_video
                
                response = client.get(
                    f"/api/interviews/{mock_session_with_video['sessionId']}/video-info"
                )
                
                # Verify status code
                assert response.status_code == 200
                data = response.json()
                
                # Verify response structure
                assert "sessionId" in data
                assert "recordingMode" in data
                assert "hasVideo" in data
                assert "videoMetadata" in data
                
                # Verify content
                assert data["sessionId"] == "session-123"
                assert data["recordingMode"] == "video"
                assert data["hasVideo"] is True
                
                # Verify video metadata completeness
                video_meta = data["videoMetadata"]
                assert video_meta["videoUrl"] == video_metadata_dict["videoUrl"]
                assert video_meta["duration"] == video_metadata_dict["duration"]
                assert video_meta["fileSize"] == video_metadata_dict["fileSize"]
                assert video_meta["codec"] == video_metadata_dict["codec"]
                assert video_meta["width"] == video_metadata_dict["width"]
                assert video_meta["height"] == video_metadata_dict["height"]
                assert video_meta["frameRate"] == video_metadata_dict["frameRate"]
                assert video_meta["recordingMode"] == "video"
        finally:
            app.dependency_overrides.clear()

    def test_get_video_info_video_url_accessible(self, mock_current_user,
                                                 mock_session_with_video):
        """Test that returned videoUrl is a valid, accessible URL."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = mock_session_with_video
                
                response = client.get(
                    f"/api/interviews/{mock_session_with_video['sessionId']}/video-info"
                )
                
                assert response.status_code == 200
                data = response.json()
                video_url = data["videoMetadata"]["videoUrl"]
                
                # Verify URL format
                assert isinstance(video_url, str)
                assert video_url.startswith("https://")
                assert ".mp4" in video_url or ".webm" in video_url or ".mkv" in video_url
        finally:
            app.dependency_overrides.clear()

    def test_get_video_info_audio_only_mode(self, mock_current_user):
        """Test retrieval of audio-only session returns hasVideo=false."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            # Audio-only session should have no videoMetadata
            audio_session = {
                "sessionId": "session-audio-789",
                "user_id": "test-user-123",
                "recording_mode": "audio",
                "videoMetadata": None
            }
            
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = audio_session
                
                response = client.get(
                    f"/api/interviews/{audio_session['sessionId']}/video-info"
                )
                
                # Should return 404 since there's no video for audio-only session
                assert response.status_code == 404
                assert "No video available" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_get_video_info_different_recording_modes(self, mock_current_user):
        """Test retrieval with different recording modes."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            video_metadata = {
                "videoUrl": "https://dl.dropboxusercontent.com/s/example/video.mp4",
                "duration": 600.0,
                "fileSize": 31457280,
                "codec": "vp8",
                "width": 1024,
                "height": 768,
                "frameRate": 24.0,
                "uploadedAt": "2024-01-14T15:20:00Z",
                "recordingMode": "video"
            }
            
            # Test video mode
            session_video = {
                "sessionId": "session-video-111",
                "user_id": "test-user-123",
                "recording_mode": "video",
                "videoMetadata": video_metadata
            }
            
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = session_video
                
                response = client.get(
                    f"/api/interviews/{session_video['sessionId']}/video-info"
                )
                
                assert response.status_code == 200
                data = response.json()
                assert data["recordingMode"] == "video"
                assert data["hasVideo"] is True
                assert data["videoMetadata"]["recordingMode"] == "video"
        finally:
            app.dependency_overrides.clear()

    def test_get_video_info_metadata_completeness(self, mock_current_user,
                                                  mock_session_with_video):
        """Test that response includes all required metadata fields."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = mock_session_with_video
                
                response = client.get(
                    f"/api/interviews/{mock_session_with_video['sessionId']}/video-info"
                )
                
                assert response.status_code == 200
                data = response.json()
                video_meta = data["videoMetadata"]
                
                # Verify all required fields are present
                required_fields = [
                    "videoUrl", "duration", "fileSize", "codec",
                    "width", "height", "frameRate", "uploadedAt", "recordingMode"
                ]
                for field in required_fields:
                    assert field in video_meta, f"Missing field: {field}"
                    assert video_meta[field] is not None
                    
                # Verify numeric fields have correct types
                assert isinstance(video_meta["duration"], (int, float))
                assert isinstance(video_meta["fileSize"], int)
                assert isinstance(video_meta["width"], int)
                assert isinstance(video_meta["height"], int)
                assert isinstance(video_meta["frameRate"], (int, float))
        finally:
            app.dependency_overrides.clear()


class TestVideoInfoAuthorizationAndAccess:
    """Test authorization and access control for video-info retrieval."""

    def test_get_video_info_unauthorized_user(self, mock_current_user,
                                              mock_current_user_other,
                                              mock_session_with_video):
        """Test that users can only retrieve their own session's video info."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user_other
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session:
                # Session belongs to test-user-123, but we're accessing as other-user-456
                mock_get_session.return_value = mock_session_with_video
                
                response = client.get(
                    f"/api/interviews/{mock_session_with_video['sessionId']}/video-info"
                )
                
                assert response.status_code == 403
                assert "does not belong to authenticated user" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_get_video_info_own_session_allowed(self, mock_current_user,
                                                mock_session_with_video):
        """Test that users can retrieve video info for their own sessions."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = mock_session_with_video
                
                response = client.get(
                    f"/api/interviews/{mock_session_with_video['sessionId']}/video-info"
                )
                
                assert response.status_code == 200
                data = response.json()
                assert data["sessionId"] == mock_session_with_video["sessionId"]
        finally:
            app.dependency_overrides.clear()


class TestVideoInfoErrorHandling:
    """Test error scenarios and edge cases."""

    def test_get_video_info_session_not_found(self, mock_current_user):
        """Test 404 error when session doesn't exist."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = None
                
                response = client.get(
                    "/api/interviews/nonexistent-session/video-info"
                )
                
                assert response.status_code == 404
                assert "Session not found" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_get_video_info_no_video_available(self, mock_current_user):
        """Test 404 error when session has no video metadata."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            session_no_video = {
                "sessionId": "session-no-video",
                "user_id": "test-user-123",
                "recording_mode": "audio",
                "videoMetadata": None
            }
            
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = session_no_video
                
                response = client.get(
                    f"/api/interviews/{session_no_video['sessionId']}/video-info"
                )
                
                assert response.status_code == 404
                assert "No video available" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_get_video_info_server_error(self, mock_current_user, mock_session_with_video):
        """Test 500 error when unexpected server error occurs."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.side_effect = RuntimeError("Database connection error")
                
                response = client.get(
                    f"/api/interviews/{mock_session_with_video['sessionId']}/video-info"
                )
                
                assert response.status_code == 500
                assert "Error retrieving video info" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_get_video_info_empty_video_metadata(self, mock_current_user):
        """Test handling of empty videoMetadata dictionary."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            session_empty_metadata = {
                "sessionId": "session-empty",
                "user_id": "test-user-123",
                "recording_mode": "video",
                "videoMetadata": {}  # Empty but present
            }
            
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = session_empty_metadata
                
                response = client.get(
                    f"/api/interviews/{session_empty_metadata['sessionId']}/video-info"
                )
                
                # Empty metadata should result in 404 (insufficient video data)
                assert response.status_code == 404
        finally:
            app.dependency_overrides.clear()


class TestVideoInfoMultipleUploadModes:
    """Test video-info retrieval for different upload scenarios."""

    def test_get_video_info_after_successful_upload(self, mock_current_user,
                                                    mock_session_with_video):
        """Test retrieval immediately after successful video upload."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session:
                # Simulate the state after upload_video endpoint
                mock_get_session.return_value = mock_session_with_video
                
                response = client.get(
                    f"/api/interviews/{mock_session_with_video['sessionId']}/video-info"
                )
                
                assert response.status_code == 200
                data = response.json()
                
                # Verify the structure matches what upload_video would set
                assert data["hasVideo"] is True
                assert data["recordingMode"] == "video"
                assert data["videoMetadata"]["videoUrl"].startswith("https://")
        finally:
            app.dependency_overrides.clear()

    def test_get_video_info_with_various_codecs(self, mock_current_user):
        """Test retrieval of videos recorded with different codecs."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            codecs = ["h264", "vp8", "vp9"]
            
            for codec in codecs:
                video_metadata = {
                    "videoUrl": f"https://dl.dropboxusercontent.com/s/test/{codec}.mp4",
                    "duration": 120.0,
                    "fileSize": 10485760,
                    "codec": codec,
                    "width": 1280,
                    "height": 720,
                    "frameRate": 30.0,
                    "uploadedAt": "2024-01-15T10:30:00Z",
                    "recordingMode": "video"
                }
                
                session = {
                    "sessionId": f"session-{codec}",
                    "user_id": "test-user-123",
                    "recording_mode": "video",
                    "videoMetadata": video_metadata
                }
                
                with patch("app.routers.interviews.get_session") as mock_get_session:
                    mock_get_session.return_value = session
                    
                    response = client.get(
                        f"/api/interviews/{session['sessionId']}/video-info"
                    )
                    
                    assert response.status_code == 200
                    data = response.json()
                    assert data["videoMetadata"]["codec"] == codec
        finally:
            app.dependency_overrides.clear()

    def test_get_video_info_with_various_resolutions(self, mock_current_user):
        """Test retrieval of videos with different resolutions."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            resolutions = [
                (640, 480),
                (1024, 768),
                (1280, 720),
                (1920, 1080)
            ]
            
            for width, height in resolutions:
                video_metadata = {
                    "videoUrl": "https://dl.dropboxusercontent.com/s/test/video.mp4",
                    "duration": 120.0,
                    "fileSize": 10485760,
                    "codec": "h264",
                    "width": width,
                    "height": height,
                    "frameRate": 30.0,
                    "uploadedAt": "2024-01-15T10:30:00Z",
                    "recordingMode": "video"
                }
                
                session = {
                    "sessionId": f"session-{width}x{height}",
                    "user_id": "test-user-123",
                    "recording_mode": "video",
                    "videoMetadata": video_metadata
                }
                
                with patch("app.routers.interviews.get_session") as mock_get_session:
                    mock_get_session.return_value = session
                    
                    response = client.get(
                        f"/api/interviews/{session['sessionId']}/video-info"
                    )
                    
                    assert response.status_code == 200
                    data = response.json()
                    assert data["videoMetadata"]["width"] == width
                    assert data["videoMetadata"]["height"] == height
        finally:
            app.dependency_overrides.clear()


class TestVideoInfoResponseFormat:
    """Test response format and serialization."""

    def test_get_video_info_response_json_valid(self, mock_current_user,
                                               mock_session_with_video):
        """Test that response is valid JSON."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = mock_session_with_video
                
                response = client.get(
                    f"/api/interviews/{mock_session_with_video['sessionId']}/video-info"
                )
                
                assert response.status_code == 200
                # Verify response is valid JSON
                data = response.json()
                assert isinstance(data, dict)
        finally:
            app.dependency_overrides.clear()

    def test_get_video_info_datetime_serialization(self, mock_current_user):
        """Test that datetime fields are properly serialized."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            video_metadata = {
                "videoUrl": "https://dl.dropboxusercontent.com/s/test/video.mp4",
                "duration": 120.0,
                "fileSize": 10485760,
                "codec": "h264",
                "width": 1280,
                "height": 720,
                "frameRate": 30.0,
                "uploadedAt": "2024-01-15T10:30:00Z",
                "recordingMode": "video"
            }
            
            session = {
                "sessionId": "session-datetime",
                "user_id": "test-user-123",
                "recording_mode": "video",
                "videoMetadata": video_metadata
            }
            
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = session
                
                response = client.get(
                    f"/api/interviews/{session['sessionId']}/video-info"
                )
                
                assert response.status_code == 200
                data = response.json()
                # uploadedAt should be a string (ISO format)
                assert isinstance(data["videoMetadata"]["uploadedAt"], str)
        finally:
            app.dependency_overrides.clear()


class TestVideoInfoIntegration:
    """Integration tests combining upload and retrieval."""

    def test_video_info_matches_upload_response(self, mock_current_user):
        """Test that video-info response is consistent with upload response."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            # Simulate the metadata that would be set by upload_video
            video_metadata = {
                "videoUrl": "https://dl.dropboxusercontent.com/s/mock/sessionId.mp4",
                "duration": 1200.5,
                "fileSize": 52428800,
                "codec": "h264",
                "width": 1280,
                "height": 720,
                "frameRate": 30.0,
                "uploadedAt": "2024-01-15T10:30:00Z",
                "recordingMode": "video"
            }
            
            session = {
                "sessionId": "session-123",
                "user_id": "test-user-123",
                "recording_mode": "video",
                "videoMetadata": video_metadata
            }
            
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = session
                
                response = client.get(
                    f"/api/interviews/{session['sessionId']}/video-info"
                )
                
                assert response.status_code == 200
                data = response.json()
                
                # Verify consistency with upload metadata
                assert data["videoMetadata"]["videoUrl"] == video_metadata["videoUrl"]
                assert data["videoMetadata"]["duration"] == video_metadata["duration"]
                assert data["videoMetadata"]["fileSize"] == video_metadata["fileSize"]
                assert data["videoMetadata"]["codec"] == video_metadata["codec"]
        finally:
            app.dependency_overrides.clear()


class TestVideoInfoEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_get_video_info_with_very_short_video(self, mock_current_user):
        """Test retrieval of very short videos (< 1 second)."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            video_metadata = {
                "videoUrl": "https://dl.dropboxusercontent.com/s/test/short.mp4",
                "duration": 0.5,  # Very short
                "fileSize": 1024,
                "codec": "h264",
                "width": 1280,
                "height": 720,
                "frameRate": 30.0,
                "uploadedAt": "2024-01-15T10:30:00Z",
                "recordingMode": "video"
            }
            
            session = {
                "sessionId": "session-short",
                "user_id": "test-user-123",
                "recording_mode": "video",
                "videoMetadata": video_metadata
            }
            
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = session
                
                response = client.get(
                    f"/api/interviews/{session['sessionId']}/video-info"
                )
                
                assert response.status_code == 200
                data = response.json()
                assert data["videoMetadata"]["duration"] == 0.5
        finally:
            app.dependency_overrides.clear()

    def test_get_video_info_with_very_long_video(self, mock_current_user):
        """Test retrieval of very long videos (> 1 hour)."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            video_metadata = {
                "videoUrl": "https://dl.dropboxusercontent.com/s/test/long.mp4",
                "duration": 7200.0,  # 2 hours
                "fileSize": 1073741824,  # 1 GB
                "codec": "h264",
                "width": 1280,
                "height": 720,
                "frameRate": 30.0,
                "uploadedAt": "2024-01-15T10:30:00Z",
                "recordingMode": "video"
            }
            
            session = {
                "sessionId": "session-long",
                "user_id": "test-user-123",
                "recording_mode": "video",
                "videoMetadata": video_metadata
            }
            
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = session
                
                response = client.get(
                    f"/api/interviews/{session['sessionId']}/video-info"
                )
                
                assert response.status_code == 200
                data = response.json()
                assert data["videoMetadata"]["duration"] == 7200.0
                assert data["videoMetadata"]["fileSize"] == 1073741824
        finally:
            app.dependency_overrides.clear()

    def test_get_video_info_with_max_file_size(self, mock_current_user):
        """Test retrieval of max-size videos (close to 500 MB limit)."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            max_size = 500 * 1024 * 1024  # 500 MB
            video_metadata = {
                "videoUrl": "https://dl.dropboxusercontent.com/s/test/max.mp4",
                "duration": 3600.0,  # 1 hour
                "fileSize": max_size - 1024,  # Just under limit
                "codec": "h264",
                "width": 1280,
                "height": 720,
                "frameRate": 30.0,
                "uploadedAt": "2024-01-15T10:30:00Z",
                "recordingMode": "video"
            }
            
            session = {
                "sessionId": "session-max-size",
                "user_id": "test-user-123",
                "recording_mode": "video",
                "videoMetadata": video_metadata
            }
            
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = session
                
                response = client.get(
                    f"/api/interviews/{session['sessionId']}/video-info"
                )
                
                assert response.status_code == 200
                data = response.json()
                assert data["videoMetadata"]["fileSize"] == max_size - 1024
        finally:
            app.dependency_overrides.clear()

    def test_get_video_info_with_zero_frame_rate(self, mock_current_user):
        """Test handling of unusual frameRate values."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            video_metadata = {
                "videoUrl": "https://dl.dropboxusercontent.com/s/test/video.mp4",
                "duration": 120.0,
                "fileSize": 10485760,
                "codec": "h264",
                "width": 1280,
                "height": 720,
                "frameRate": 0.0,  # Edge case
                "uploadedAt": "2024-01-15T10:30:00Z",
                "recordingMode": "video"
            }
            
            session = {
                "sessionId": "session-zero-fps",
                "user_id": "test-user-123",
                "recording_mode": "video",
                "videoMetadata": video_metadata
            }
            
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = session
                
                response = client.get(
                    f"/api/interviews/{session['sessionId']}/video-info"
                )
                
                # Should still work and return the value
                assert response.status_code == 200
                data = response.json()
                assert data["videoMetadata"]["frameRate"] == 0.0
        finally:
            app.dependency_overrides.clear()

    def test_get_video_info_special_characters_in_url(self, mock_current_user):
        """Test handling of special characters in video URL."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            video_metadata = {
                "videoUrl": "https://dl.dropboxusercontent.com/s/abc123def456/my%20video%20file%202024.mp4",
                "duration": 120.0,
                "fileSize": 10485760,
                "codec": "h264",
                "width": 1280,
                "height": 720,
                "frameRate": 30.0,
                "uploadedAt": "2024-01-15T10:30:00Z",
                "recordingMode": "video"
            }
            
            session = {
                "sessionId": "session-special",
                "user_id": "test-user-123",
                "recording_mode": "video",
                "videoMetadata": video_metadata
            }
            
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = session
                
                response = client.get(
                    f"/api/interviews/{session['sessionId']}/video-info"
                )
                
                assert response.status_code == 200
                data = response.json()
                assert "%20" in data["videoMetadata"]["videoUrl"]
        finally:
            app.dependency_overrides.clear()

    def test_get_video_info_repeated_requests(self, mock_current_user,
                                             mock_session_with_video):
        """Test multiple consecutive requests return consistent data."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = mock_session_with_video
                
                # Make multiple requests
                responses = []
                for _ in range(3):
                    response = client.get(
                        f"/api/interviews/{mock_session_with_video['sessionId']}/video-info"
                    )
                    responses.append(response.json())
                
                # Verify all responses are identical
                assert responses[0] == responses[1]
                assert responses[1] == responses[2]
                
                # Verify structure
                for resp in responses:
                    assert resp["sessionId"] == "session-123"
                    assert resp["hasVideo"] is True
        finally:
            app.dependency_overrides.clear()


class TestVideoInfoWithDifferentUserScenarios:
    """Test various multi-user scenarios."""

    def test_get_video_info_multiple_users_different_sessions(self):
        """Test that different users can only access their own video info."""
        user1 = {"user_id": "user-1", "email": "user1@example.com"}
        user2 = {"user_id": "user-2", "email": "user2@example.com"}
        
        video_metadata = {
            "videoUrl": "https://dl.dropboxusercontent.com/s/test/video.mp4",
            "duration": 120.0,
            "fileSize": 10485760,
            "codec": "h264",
            "width": 1280,
            "height": 720,
            "frameRate": 30.0,
            "uploadedAt": "2024-01-15T10:30:00Z",
            "recordingMode": "video"
        }
        
        session_user1 = {
            "sessionId": "session-user1",
            "user_id": "user-1",
            "recording_mode": "video",
            "videoMetadata": video_metadata
        }
        
        session_user2 = {
            "sessionId": "session-user2",
            "user_id": "user-2",
            "recording_mode": "video",
            "videoMetadata": video_metadata
        }
        
        try:
            # User 1 accesses their own session
            app.dependency_overrides[get_current_user] = lambda: user1
            
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = session_user1
                
                response = client.get(f"/api/interviews/{session_user1['sessionId']}/video-info")
                assert response.status_code == 200
            
            # User 1 tries to access User 2's session
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = session_user2
                
                response = client.get(f"/api/interviews/{session_user2['sessionId']}/video-info")
                assert response.status_code == 403
                assert "does not belong to authenticated user" in response.json()["detail"]
            
            # User 2 accesses their own session
            app.dependency_overrides[get_current_user] = lambda: user2
            
            with patch("app.routers.interviews.get_session") as mock_get_session:
                mock_get_session.return_value = session_user2
                
                response = client.get(f"/api/interviews/{session_user2['sessionId']}/video-info")
                assert response.status_code == 200
        finally:
            app.dependency_overrides.clear()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
