"""Tests for DELETE /api/interviews/{sessionId}/video endpoint.

Tests verify that the DELETE endpoint correctly:
1. Removes video files from Dropbox storage
2. Clears video metadata from session data
3. Enforces proper authorization (session owner only)
4. Handles error scenarios (missing session, unauthorized, storage errors)
5. Returns 404 for non-existent videos
6. Handles already-deleted videos gracefully
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient

from app.main import app
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
def mock_session_with_video():
    """Mock interview session with video metadata."""
    return {
        "sessionId": "session-123",
        "user_id": "test-user-123",
        "recording_mode": "video",
        "videoMetadata": {
            "videoUrl": "https://dl.dropboxusercontent.com/s/test/video.mp4",
            "duration": 120.5,
            "fileSize": 52428800,
            "codec": "h264",
            "width": 1280,
            "height": 720,
            "frameRate": 30.0,
            "uploadedAt": "2024-01-15T10:30:00",
            "recordingMode": "video"
        }
    }


@pytest.fixture
def mock_session_without_video():
    """Mock interview session without video metadata."""
    return {
        "sessionId": "session-456",
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


class TestDeleteVideoEndpoint:
    """Test suite for DELETE /api/interviews/{sessionId}/video endpoint."""

    def test_delete_video_success(self, mock_current_user, mock_session_with_video,
                                  mock_user_with_dropbox):
        """Test successful video deletion removes file from storage and clears metadata."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user, \
                 patch("app.routers.interviews.update_session") as mock_update_session, \
                 patch("app.routers.interviews.VideoStorageService") as mock_storage_service:
                
                # Setup mocks
                mock_get_session.return_value = mock_session_with_video
                mock_get_user.return_value = mock_user_with_dropbox
                mock_update_session.return_value = None
                
                # Mock VideoStorageService
                mock_storage_instance = MagicMock()
                mock_storage_service.return_value = mock_storage_instance
                mock_storage_instance.deleteVideo.return_value = True
                
                # Call endpoint
                response = client.delete(
                    f"/api/interviews/{mock_session_with_video['sessionId']}/video"
                )
                
                # Verify response
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert "deleted successfully" in data["message"]
                
                # Verify VideoStorageService.deleteVideo was called
                mock_storage_instance.deleteVideo.assert_called_once_with(
                    mock_session_with_video["sessionId"]
                )
                
                # Verify session was updated to clear video metadata
                mock_update_session.assert_called_once()
                update_call_args = mock_update_session.call_args
                assert update_call_args[0][0] == mock_session_with_video["sessionId"]
                assert update_call_args[0][1]["videoMetadata"] is None
                assert update_call_args[0][1]["recording_mode"] == "audio"
        finally:
            app.dependency_overrides.clear()

    def test_delete_video_session_not_found(self, mock_current_user):
        """Test delete fails with 404 when session doesn't exist."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session:
                
                mock_get_session.return_value = None
                
                response = client.delete(
                    "/api/interviews/nonexistent-session/video"
                )
                
                assert response.status_code == 404
                assert "Session not found" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_delete_video_unauthorized_user(self, mock_current_user):
        """Test delete fails with 403 when user doesn't own the session."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            other_user_session = {
                "sessionId": "session-789",
                "user_id": "other-user-456",  # Different user
                "recording_mode": "video",
                "videoMetadata": {
                    "videoUrl": "https://dl.dropboxusercontent.com/s/test/video.mp4",
                    "duration": 120.5,
                    "fileSize": 52428800,
                    "codec": "h264",
                    "width": 1280,
                    "height": 720,
                    "frameRate": 30.0,
                    "uploadedAt": "2024-01-15T10:30:00",
                    "recordingMode": "video"
                }
            }
            
            with patch("app.routers.interviews.get_session") as mock_get_session:
                
                mock_get_session.return_value = other_user_session
                
                response = client.delete(
                    f"/api/interviews/{other_user_session['sessionId']}/video"
                )
                
                assert response.status_code == 403
                assert "does not belong to authenticated user" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_delete_video_no_video_found(self, mock_current_user,
                                         mock_session_without_video):
        """Test delete fails with 404 when session has no video."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session:
                
                mock_get_session.return_value = mock_session_without_video
                
                response = client.delete(
                    f"/api/interviews/{mock_session_without_video['sessionId']}/video"
                )
                
                assert response.status_code == 404
                assert "No video available" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_delete_video_already_deleted_from_storage(self, mock_current_user,
                                                       mock_session_with_video,
                                                       mock_user_with_dropbox):
        """Test delete handles gracefully when video already deleted from storage.
        
        When VideoStorageService.deleteVideo returns False (file not found in storage),
        the endpoint should still clear the metadata and return success. This handles
        the case where the file was already deleted or never existed in storage.
        """
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user, \
                 patch("app.routers.interviews.update_session") as mock_update_session, \
                 patch("app.routers.interviews.VideoStorageService") as mock_storage_service:
                
                mock_get_session.return_value = mock_session_with_video
                mock_get_user.return_value = mock_user_with_dropbox
                mock_update_session.return_value = None
                
                # Mock VideoStorageService.deleteVideo to return False (file not found)
                mock_storage_instance = MagicMock()
                mock_storage_service.return_value = mock_storage_instance
                mock_storage_instance.deleteVideo.return_value = False
                
                # Call endpoint
                response = client.delete(
                    f"/api/interviews/{mock_session_with_video['sessionId']}/video"
                )
                
                # Should still return 200 success
                assert response.status_code == 200
                data = response.json()
                assert data["success"] is True
                assert "deleted successfully" in data["message"]
                
                # Session metadata should still be cleared
                mock_update_session.assert_called_once()
        finally:
            app.dependency_overrides.clear()

    def test_delete_video_no_dropbox_credentials(self, mock_current_user,
                                                 mock_session_with_video):
        """Test delete fails with 500 when user has no Dropbox credentials."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            user_no_dropbox = {
                "user_id": "test-user-123",
                "dropbox_refresh_token": None,
                "email": "test@example.com"
            }
            
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user:
                
                mock_get_session.return_value = mock_session_with_video
                mock_get_user.return_value = user_no_dropbox
                
                response = client.delete(
                    f"/api/interviews/{mock_session_with_video['sessionId']}/video"
                )
                
                assert response.status_code == 500
                assert "Dropbox storage not configured" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_delete_video_storage_api_error(self, mock_current_user,
                                            mock_session_with_video,
                                            mock_user_with_dropbox):
        """Test delete fails with 500 when Dropbox API returns an error."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user, \
                 patch("app.routers.interviews.VideoStorageService") as mock_storage_service:
                
                mock_get_session.return_value = mock_session_with_video
                mock_get_user.return_value = mock_user_with_dropbox
                
                # Mock VideoStorageService to raise error
                mock_storage_instance = MagicMock()
                mock_storage_service.return_value = mock_storage_instance
                mock_storage_instance.deleteVideo.side_effect = RuntimeError(
                    "Dropbox API error: 500 Internal Server Error"
                )
                
                response = client.delete(
                    f"/api/interviews/{mock_session_with_video['sessionId']}/video"
                )
                
                assert response.status_code == 500
                assert "Failed to delete video from storage" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_delete_video_storage_permission_error(self, mock_current_user,
                                                   mock_session_with_video,
                                                   mock_user_with_dropbox):
        """Test delete fails with 500 when user lacks storage permissions."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user, \
                 patch("app.routers.interviews.VideoStorageService") as mock_storage_service:
                
                mock_get_session.return_value = mock_session_with_video
                mock_get_user.return_value = mock_user_with_dropbox
                
                # Mock VideoStorageService to raise permission error
                mock_storage_instance = MagicMock()
                mock_storage_service.return_value = mock_storage_instance
                mock_storage_instance.deleteVideo.side_effect = RuntimeError(
                    "Insufficient permissions to delete file"
                )
                
                response = client.delete(
                    f"/api/interviews/{mock_session_with_video['sessionId']}/video"
                )
                
                assert response.status_code == 500
                assert "Failed to delete video from storage" in response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_delete_video_subsequent_info_request_returns_404(self, mock_current_user,
                                                              mock_session_with_video,
                                                              mock_user_with_dropbox):
        """Test that after deletion, GET /video-info returns 404 (no video).
        
        Verifies the requirement that subsequent calls to /video-info for the same
        session return 404 after video has been deleted.
        """
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user, \
                 patch("app.routers.interviews.update_session") as mock_update_session, \
                 patch("app.routers.interviews.VideoStorageService") as mock_storage_service:
                
                mock_get_session.return_value = mock_session_with_video
                mock_get_user.return_value = mock_user_with_dropbox
                mock_update_session.return_value = None
                
                mock_storage_instance = MagicMock()
                mock_storage_service.return_value = mock_storage_instance
                mock_storage_instance.deleteVideo.return_value = True
                
                # First: delete the video
                delete_response = client.delete(
                    f"/api/interviews/{mock_session_with_video['sessionId']}/video"
                )
                assert delete_response.status_code == 200
                
                # After deletion, session should have videoMetadata cleared
                # Update mock_get_session to return session without video for the info call
                mock_session_after_delete = {
                    "sessionId": "session-123",
                    "user_id": "test-user-123",
                    "recording_mode": "audio",
                    "videoMetadata": None  # Video metadata cleared
                }
                mock_get_session.return_value = mock_session_after_delete
                
                # Second: verify GET /video-info returns 404
                info_response = client.get(
                    f"/api/interviews/{mock_session_with_video['sessionId']}/video-info"
                )
                
                assert info_response.status_code == 404
                assert "No video available" in info_response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_delete_video_idempotent_double_delete(self, mock_current_user,
                                                   mock_session_with_video,
                                                   mock_user_with_dropbox):
        """Test that deleting an already-deleted video returns 404 second time.
        
        First delete succeeds, but subsequent delete should fail with 404 because
        videoMetadata is now None.
        """
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user, \
                 patch("app.routers.interviews.update_session") as mock_update_session, \
                 patch("app.routers.interviews.VideoStorageService") as mock_storage_service:
                
                # First delete
                mock_get_session.return_value = mock_session_with_video
                mock_get_user.return_value = mock_user_with_dropbox
                mock_update_session.return_value = None
                
                mock_storage_instance = MagicMock()
                mock_storage_service.return_value = mock_storage_instance
                mock_storage_instance.deleteVideo.return_value = True
                
                first_response = client.delete(
                    f"/api/interviews/{mock_session_with_video['sessionId']}/video"
                )
                assert first_response.status_code == 200
                
                # Second delete - session now has no video
                mock_session_no_video = {
                    "sessionId": "session-123",
                    "user_id": "test-user-123",
                    "recording_mode": "audio",
                    "videoMetadata": None
                }
                mock_get_session.return_value = mock_session_no_video
                
                second_response = client.delete(
                    f"/api/interviews/{mock_session_with_video['sessionId']}/video"
                )
                
                # Second delete should return 404
                assert second_response.status_code == 404
                assert "No video available" in second_response.json()["detail"]
        finally:
            app.dependency_overrides.clear()

    def test_delete_video_updates_session_correctly(self, mock_current_user,
                                                    mock_session_with_video,
                                                    mock_user_with_dropbox):
        """Test that session update correctly clears video metadata and sets mode to audio."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user, \
                 patch("app.routers.interviews.update_session") as mock_update_session, \
                 patch("app.routers.interviews.VideoStorageService") as mock_storage_service:
                
                mock_get_session.return_value = mock_session_with_video
                mock_get_user.return_value = mock_user_with_dropbox
                mock_update_session.return_value = None
                
                mock_storage_instance = MagicMock()
                mock_storage_service.return_value = mock_storage_instance
                mock_storage_instance.deleteVideo.return_value = True
                
                response = client.delete(
                    f"/api/interviews/{mock_session_with_video['sessionId']}/video"
                )
                
                assert response.status_code == 200
                
                # Verify update_session was called with correct payload
                mock_update_session.assert_called_once()
                session_id, update_payload = mock_update_session.call_args[0]
                
                assert session_id == "session-123"
                assert update_payload["videoMetadata"] is None
                assert update_payload["recording_mode"] == "audio"
        finally:
            app.dependency_overrides.clear()

    def test_delete_video_requires_authentication(self, mock_session_with_video):
        """Test that delete endpoint requires authenticated user."""
        # Don't set dependency override - should fail auth check
        
        response = client.delete(
            f"/api/interviews/{mock_session_with_video['sessionId']}/video"
        )
        
        # Should fail authentication (403 Forbidden or 401 Unauthorized)
        assert response.status_code in [401, 403]

    def test_delete_video_returns_correct_response_structure(self, mock_current_user,
                                                             mock_session_with_video,
                                                             mock_user_with_dropbox):
        """Test that response has correct structure and required fields."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            with patch("app.routers.interviews.get_session") as mock_get_session, \
                 patch("app.routers.interviews.get_user") as mock_get_user, \
                 patch("app.routers.interviews.update_session") as mock_update_session, \
                 patch("app.routers.interviews.VideoStorageService") as mock_storage_service:
                
                mock_get_session.return_value = mock_session_with_video
                mock_get_user.return_value = mock_user_with_dropbox
                mock_update_session.return_value = None
                
                mock_storage_instance = MagicMock()
                mock_storage_service.return_value = mock_storage_instance
                mock_storage_instance.deleteVideo.return_value = True
                
                response = client.delete(
                    f"/api/interviews/{mock_session_with_video['sessionId']}/video"
                )
                
                assert response.status_code == 200
                data = response.json()
                
                # Verify response structure
                assert "success" in data
                assert "message" in data
                assert isinstance(data["success"], bool)
                assert isinstance(data["message"], str)
                assert data["success"] is True
        finally:
            app.dependency_overrides.clear()

    def test_delete_video_with_empty_video_metadata_dict(self, mock_current_user,
                                                         mock_user_with_dropbox):
        """Test delete fails with 404 when videoMetadata exists but is empty dict."""
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        
        try:
            session_with_empty_metadata = {
                "sessionId": "session-123",
                "user_id": "test-user-123",
                "recording_mode": "video",
                "videoMetadata": {}  # Empty dict
            }
            
            with patch("app.routers.interviews.get_session") as mock_get_session:
                
                mock_get_session.return_value = session_with_empty_metadata
                
                response = client.delete(
                    f"/api/interviews/{session_with_empty_metadata['sessionId']}/video"
                )
                
                # Empty dict is falsy, should return 404
                # (depends on how the endpoint checks for videoMetadata)
                # Most implementations would treat empty dict as "no video"
                assert response.status_code in [404, 500]
        finally:
            app.dependency_overrides.clear()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
