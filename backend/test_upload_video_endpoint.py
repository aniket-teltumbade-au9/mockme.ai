"""Tests for POST /api/interviews/{sessionId}/upload-video endpoint."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import HTTPException
import io

from app.main import app
from app.models.video import VideoMetadata
from app.services.auth import get_current_user
from datetime import datetime


# Create test client
client = TestClient(app)

# Mock user for dependency override
mock_current_user_default = {
    "user_id": "test-user-123",
    "email": "test@example.com",
    "dropbox_account_email": "test@example.com"
}


@pytest.fixture
def mock_current_user():
    """Mock authenticated user."""
    return {
        "user_id": "test-user-123",
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


@pytest.fixture
def mock_user_with_dropbox():
    """Mock user with Dropbox credentials."""
    return {
        "user_id": "test-user-123",
        "dropbox_refresh_token": "test-refresh-token",
        "email": "test@example.com"
    }


@pytest.fixture
def sample_video_blob():
    """Sample video blob (small file for testing)."""
    # Simple video blob (just bytes for testing)
    return b"fake_video_data_" * 1000  # ~16KB


class TestUploadVideoEndpoint:
    """Test suite for video upload endpoint."""

    def test_upload_video_success(self, mock_current_user, mock_session, 
                                  mock_user_with_dropbox, sample_video_blob):
        """Test successful video upload."""
        # Override the dependency with our mock
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            # Mock dependencies
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user, \
                 patch("app.routers.interviews.update_session") as mock_update_session:
                
                # Setup mocks
                mock_get_session.return_value = mock_session
                mock_get_user.return_value = mock_user_with_dropbox
                mock_update_session.return_value = None
                
                # Mock VideoStorageService
                with patch("app.routers.interviews.VideoStorageService") as mock_storage_service:
                    mock_storage_instance = MagicMock()
                    mock_storage_service.return_value = mock_storage_instance
                    
                    # Setup video storage response
                    mock_video_url = "https://dl.dropboxusercontent.com/s/test/video.mp4"
                    mock_metadata = {
                        "duration": 120.5,
                        "fileSize": len(sample_video_blob),
                        "codec": "h264",
                        "width": 1280,
                        "height": 720,
                        "frameRate": 30.0,
                        "uploadedAt": "2024-01-15T10:30:00",
                        "recordingMode": "video"
                    }
                    mock_storage_instance.uploadVideo.return_value = (
                        mock_video_url,
                        mock_metadata
                    )
                    
                    # Call endpoint
                    response = client.post(
                        f"/api/interviews/{mock_session['sessionId']}/upload-video",
                        files={"video": ("test.mp4", io.BytesIO(sample_video_blob), "video/mp4")},
                        data={
                            "duration": 120.5,
                            "codec": "h264",
                            "width": 1280,
                            "height": 720,
                            "frameRate": 30.0
                        }
                    )
                    
                    # Verify response
                    assert response.status_code == 200
                    data = response.json()
                    assert data["success"] is True
                    assert data["videoUrl"] == mock_video_url
                    assert data["fileSize"] == len(sample_video_blob)
                    assert data["duration"] == 120.5
                    assert "/MockMe.AI/videos/session-123.mp4" in data["videoPath"]
        finally:
            app.dependency_overrides.clear()

    def test_upload_video_session_not_found(self, mock_current_user, 
                                            sample_video_blob):
        """Test upload fails when session not found."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session:
                
                mock_get_session.return_value = None
                
                response = client.post(
                    "/api/interviews/nonexistent/upload-video",
                    files={"video": ("test.mp4", io.BytesIO(sample_video_blob), "video/mp4")},
                    data={
                        "duration": 120.5,
                        "codec": "h264",
                        "width": 1280,
                        "height": 720,
                        "frameRate": 30.0
                    }
                )
                
                assert response.status_code == 404
                assert "Session not found" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_upload_video_unauthorized(self, mock_current_user, 
                                       sample_video_blob):
        """Test upload fails for unauthorized user."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            other_user_session = {
                "sessionId": "session-123",
                "user_id": "other-user-456",  # Different user
                "recording_mode": "audio"
            }
            
            with patch("app.routers.interviews.get_session") as mock_get_session:
                
                mock_get_session.return_value = other_user_session
                
                response = client.post(
                    "/api/interviews/session-123/upload-video",
                    files={"video": ("test.mp4", io.BytesIO(sample_video_blob), "video/mp4")},
                    data={
                        "duration": 120.5,
                        "codec": "h264",
                        "width": 1280,
                        "height": 720,
                        "frameRate": 30.0
                    }
                )
                
                assert response.status_code == 403
                assert "does not belong to authenticated user" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_upload_video_empty_blob(self, mock_current_user, mock_session):
        """Test upload fails with empty video blob."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session:
                
                mock_get_session.return_value = mock_session
                
                response = client.post(
                    f"/api/interviews/{mock_session['sessionId']}/upload-video",
                    files={"video": ("test.mp4", io.BytesIO(b""), "video/mp4")},
                    data={
                        "duration": 0,
                        "codec": "h264",
                        "width": 1280,
                        "height": 720,
                        "frameRate": 30.0
                    }
                )
                
                assert response.status_code == 400
                assert "cannot be empty" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_upload_video_file_too_large(self, mock_current_user, mock_session):
        """Test upload fails when file exceeds 500 MB limit."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            # Create a blob larger than 500 MB (simulate)
            large_blob = b"x" * (501 * 1024 * 1024)  # 501 MB
            
            with patch("app.routers.interviews.get_session") as mock_get_session:
                
                mock_get_session.return_value = mock_session
                
                response = client.post(
                    f"/api/interviews/{mock_session['sessionId']}/upload-video",
                    files={"video": ("test.mp4", io.BytesIO(large_blob), "video/mp4")},
                    data={
                        "duration": 600,
                        "codec": "h264",
                        "width": 1280,
                        "height": 720,
                        "frameRate": 30.0
                    }
                )
                
                assert response.status_code == 413
                assert "File too large" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_upload_video_no_dropbox_credentials(self, mock_current_user, 
                                                 mock_session, sample_video_blob):
        """Test upload fails when user has no Dropbox credentials."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            user_no_dropbox = {
                "user_id": "test-user-123",
                "dropbox_refresh_token": None,
                "email": "test@example.com"
            }
            
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user:
                
                mock_get_session.return_value = mock_session
                mock_get_user.return_value = user_no_dropbox
                
                response = client.post(
                    f"/api/interviews/{mock_session['sessionId']}/upload-video",
                    files={"video": ("test.mp4", io.BytesIO(sample_video_blob), "video/mp4")},
                    data={
                        "duration": 120.5,
                        "codec": "h264",
                        "width": 1280,
                        "height": 720,
                        "frameRate": 30.0
                    }
                )
                
                assert response.status_code == 500
                assert "Dropbox storage not configured" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_upload_video_storage_error(self, mock_current_user, mock_session,
                                        mock_user_with_dropbox, sample_video_blob):
        """Test upload fails when VideoStorageService raises error."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user, \
                 patch("app.routers.interviews.VideoStorageService") as mock_storage_service:
                
                mock_get_session.return_value = mock_session
                mock_get_user.return_value = mock_user_with_dropbox
                
                # Mock storage service to raise error
                mock_storage_instance = MagicMock()
                mock_storage_service.return_value = mock_storage_instance
                mock_storage_instance.uploadVideo.side_effect = RuntimeError(
                    "Dropbox API error"
                )
                
                response = client.post(
                    f"/api/interviews/{mock_session['sessionId']}/upload-video",
                    files={"video": ("test.mp4", io.BytesIO(sample_video_blob), "video/mp4")},
                    data={
                        "duration": 120.5,
                        "codec": "h264",
                        "width": 1280,
                        "height": 720,
                        "frameRate": 30.0
                    }
                )
                
                assert response.status_code == 500
                assert "Failed to upload video to storage" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_upload_video_invalid_metadata(self, mock_current_user, mock_session,
                                           mock_user_with_dropbox, sample_video_blob):
        """Test upload fails when video metadata extraction fails."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user, \
                 patch("app.routers.interviews.VideoStorageService") as mock_storage_service:
                
                mock_get_session.return_value = mock_session
                mock_get_user.return_value = mock_user_with_dropbox
                
                # Mock storage service to raise ValueError
                mock_storage_instance = MagicMock()
                mock_storage_service.return_value = mock_storage_instance
                mock_storage_instance.uploadVideo.side_effect = ValueError(
                    "Invalid video format"
                )
                
                response = client.post(
                    f"/api/interviews/{mock_session['sessionId']}/upload-video",
                    files={"video": ("test.mp4", io.BytesIO(sample_video_blob), "video/mp4")},
                    data={
                        "duration": 120.5,
                        "codec": "h264",
                        "width": 1280,
                        "height": 720,
                        "frameRate": 30.0
                    }
                )
                
                assert response.status_code == 400
                assert "Invalid video format" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
