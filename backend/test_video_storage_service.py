#!/usr/bin/env python3
"""Unit tests for VideoStorageService.getVideoUrl() and deleteVideo() methods."""

import sys
import os
from unittest.mock import MagicMock, patch, call
import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.video_storage import VideoStorageService
import dropbox
import dropbox.exceptions


class TestVideoStorageServiceGetVideoUrl:
    """Test suite for VideoStorageService.getVideoUrl() method."""

    def setup_method(self):
        """Set up test fixtures before each test."""
        # Mock the DropboxService to avoid needing real credentials
        with patch('app.services.video_storage.DropboxService'):
            self.service = VideoStorageService(refresh_token="test_token")
            # Mock the dropbox_service
            self.service.dropbox_service = MagicMock()

    def test_get_video_url_success(self):
        """Test successful retrieval of video URL for existing video."""
        session_id = "test-session-123"
        expected_url = "https://dl.dropboxusercontent.com/s/abc123/test-session-123.mp4"
        
        # Mock the shared link retrieval
        self.service.dropbox_service._get_or_create_shared_link.return_value = expected_url
        
        # Call the method
        result = self.service.getVideoUrl(session_id)
        
        # Verify the result
        assert result == expected_url
        
        # Verify the correct path was requested
        self.service.dropbox_service._get_or_create_shared_link.assert_called_once_with(
            "/MockMe.AI/videos/test-session-123.mp4"
        )

    def test_get_video_url_constructs_correct_path(self):
        """Test that getVideoUrl constructs the correct Dropbox path."""
        session_id = "session-xyz-789"
        self.service.dropbox_service._get_or_create_shared_link.return_value = "https://example.com/link"
        
        self.service.getVideoUrl(session_id)
        
        # Verify the path was constructed correctly
        call_args = self.service.dropbox_service._get_or_create_shared_link.call_args
        assert call_args[0][0] == f"/MockMe.AI/videos/{session_id}.mp4"

    def test_get_video_url_file_not_found_error(self):
        """Test RuntimeError is raised when video file doesn't exist."""
        session_id = "missing-video-session"
        
        # Mock file not found error
        api_error = MagicMock(spec=dropbox.exceptions.ApiError)
        path_error = MagicMock()
        path_error.is_not_found.return_value = True
        api_error.error.is_path.return_value = True
        api_error.error.get_path.return_value = path_error
        
        self.service.dropbox_service._get_or_create_shared_link.side_effect = api_error
        
        # Call should raise RuntimeError
        with pytest.raises(RuntimeError) as exc_info:
            self.service.getVideoUrl(session_id)
        
        assert "Video not found" in str(exc_info.value)
        assert session_id in str(exc_info.value)

    def test_get_video_url_other_dropbox_api_error(self):
        """Test RuntimeError is raised for other Dropbox API errors."""
        session_id = "test-session"
        
        # Mock generic API error (not file not found)
        api_error = dropbox.exceptions.ApiError(
            request_id="test",
            error=MagicMock(),
            http_status=500,
            body="Server error"
        )
        api_error.error.is_path.return_value = False
        
        self.service.dropbox_service._get_or_create_shared_link.side_effect = api_error
        
        # Call should raise RuntimeError
        with pytest.raises(RuntimeError) as exc_info:
            self.service.getVideoUrl(session_id)
        
        assert "Failed to retrieve video URL" in str(exc_info.value)

    def test_get_video_url_unexpected_exception(self):
        """Test RuntimeError is raised for unexpected exceptions."""
        session_id = "test-session"
        
        # Mock unexpected error
        self.service.dropbox_service._get_or_create_shared_link.side_effect = ValueError(
            "Unexpected error"
        )
        
        # Call should raise RuntimeError
        with pytest.raises(RuntimeError) as exc_info:
            self.service.getVideoUrl(session_id)
        
        assert "Failed to retrieve video URL" in str(exc_info.value)

    def test_get_video_url_returns_string(self):
        """Test that getVideoUrl returns a string (the URL)."""
        session_id = "test-session"
        url = "https://dl.dropboxusercontent.com/s/test/video.mp4"
        self.service.dropbox_service._get_or_create_shared_link.return_value = url
        
        result = self.service.getVideoUrl(session_id)
        
        assert isinstance(result, str)
        assert result.startswith("https://")

    def test_get_video_url_with_special_session_id(self):
        """Test getVideoUrl with special characters in session ID."""
        session_id = "session-with-dashes_and_underscores"
        expected_url = "https://example.com/link"
        self.service.dropbox_service._get_or_create_shared_link.return_value = expected_url
        
        result = self.service.getVideoUrl(session_id)
        
        assert result == expected_url
        # Verify the path includes the special characters
        call_args = self.service.dropbox_service._get_or_create_shared_link.call_args
        assert session_id in call_args[0][0]

    def test_get_video_url_logging(self):
        """Test that getVideoUrl logs appropriately."""
        session_id = "test-session"
        url = "https://example.com/video.mp4"
        self.service.dropbox_service._get_or_create_shared_link.return_value = url
        
        with patch.object(self.service.logger, 'info') as mock_logger:
            self.service.getVideoUrl(session_id)
            
            # Verify logging calls
            calls = [call[0][0] for call in mock_logger.call_args_list]
            assert any("Retrieving video URL" in call for call in calls)
            assert any("Successfully retrieved video URL" in call for call in calls)

    def test_get_video_url_error_logging(self):
        """Test that errors are logged appropriately."""
        session_id = "test-session"
        
        api_error = MagicMock(spec=dropbox.exceptions.ApiError)
        path_error = MagicMock()
        path_error.is_not_found.return_value = True
        api_error.error.is_path.return_value = True
        api_error.error.get_path.return_value = path_error
        
        self.service.dropbox_service._get_or_create_shared_link.side_effect = api_error
        
        with patch.object(self.service.logger, 'error') as mock_logger:
            with pytest.raises(RuntimeError):
                self.service.getVideoUrl(session_id)
            
            # Verify error was logged
            assert mock_logger.call_count > 0


def test_get_video_url_integration_path_construction():
    """Integration test: verify path construction matches uploadVideo pattern."""
    with patch('app.services.video_storage.DropboxService'):
        service = VideoStorageService(refresh_token="test_token")
        service.dropbox_service = MagicMock()
        service.dropbox_service._get_or_create_shared_link.return_value = "https://example.com/link"
        
        session_id = "test-123"
        service.getVideoUrl(session_id)
        
        # Get the path used in getVideoUrl
        path_arg = service.dropbox_service._get_or_create_shared_link.call_args[0][0]
        
        # The path should match the pattern used in uploadVideo
        assert path_arg == f"/MockMe.AI/videos/{session_id}.mp4"
        assert path_arg.endswith(".mp4")


class TestVideoStorageServiceDeleteVideo:
    """Test suite for VideoStorageService.deleteVideo() method."""

    def setup_method(self):
        """Set up test fixtures before each test."""
        # Mock the DropboxService to avoid needing real credentials
        with patch('app.services.video_storage.DropboxService'):
            self.service = VideoStorageService(refresh_token="test_token")
            # Mock the dropbox_service and dbx client
            self.service.dropbox_service = MagicMock()
            self.service.dropbox_service.dbx = MagicMock()

    def test_delete_video_success(self):
        """Test successful deletion of video file."""
        session_id = "test-session-123"
        
        # Mock successful deletion
        self.service.dropbox_service.dbx.files_delete.return_value = None
        
        # Call the method
        result = self.service.deleteVideo(session_id)
        
        # Verify the result
        assert result is True
        
        # Verify files_delete was called with correct path
        self.service.dropbox_service.dbx.files_delete.assert_called_once_with(
            "/MockMe.AI/videos/test-session-123.mp4"
        )

    def test_delete_video_constructs_correct_path(self):
        """Test that deleteVideo constructs the correct Dropbox path."""
        session_id = "session-xyz-789"
        self.service.dropbox_service.dbx.files_delete.return_value = None
        
        self.service.deleteVideo(session_id)
        
        # Verify the path was constructed correctly
        call_args = self.service.dropbox_service.dbx.files_delete.call_args
        assert call_args[0][0] == f"/MockMe.AI/videos/{session_id}.mp4"

    def test_delete_video_file_not_found_returns_false(self):
        """Test that file not found returns False instead of raising error."""
        session_id = "missing-video-session"
        
        # Mock file not found error
        api_error = MagicMock(spec=dropbox.exceptions.ApiError)
        path_error = MagicMock()
        path_error.is_not_found.return_value = True
        api_error.error.is_path.return_value = True
        api_error.error.get_path.return_value = path_error
        
        self.service.dropbox_service.dbx.files_delete.side_effect = api_error
        
        # Call should return False, not raise
        result = self.service.deleteVideo(session_id)
        
        assert result is False

    def test_delete_video_other_dropbox_api_error_raises(self):
        """Test that other Dropbox API errors raise RuntimeError."""
        session_id = "test-session"
        
        # Mock generic API error (not file not found)
        api_error = dropbox.exceptions.ApiError(
            request_id="test",
            error=MagicMock(),
            http_status=500,
            body="Server error"
        )
        api_error.error.is_path.return_value = False
        
        self.service.dropbox_service.dbx.files_delete.side_effect = api_error
        
        # Call should raise RuntimeError
        with pytest.raises(RuntimeError) as exc_info:
            self.service.deleteVideo(session_id)
        
        assert "Failed to delete video" in str(exc_info.value)

    def test_delete_video_unexpected_exception_raises(self):
        """Test that unexpected exceptions raise RuntimeError."""
        session_id = "test-session"
        
        # Mock unexpected error
        self.service.dropbox_service.dbx.files_delete.side_effect = ValueError(
            "Unexpected error"
        )
        
        # Call should raise RuntimeError
        with pytest.raises(RuntimeError) as exc_info:
            self.service.deleteVideo(session_id)
        
        assert "Failed to delete video" in str(exc_info.value)

    def test_delete_video_returns_boolean(self):
        """Test that deleteVideo returns a boolean."""
        session_id = "test-session"
        self.service.dropbox_service.dbx.files_delete.return_value = None
        
        result = self.service.deleteVideo(session_id)
        
        assert isinstance(result, bool)
        assert result is True

    def test_delete_video_with_special_session_id(self):
        """Test deleteVideo with special characters in session ID."""
        session_id = "session-with-dashes_and_underscores-123"
        self.service.dropbox_service.dbx.files_delete.return_value = None
        
        result = self.service.deleteVideo(session_id)
        
        assert result is True
        # Verify the path includes the special characters
        call_args = self.service.dropbox_service.dbx.files_delete.call_args
        assert session_id in call_args[0][0]

    def test_delete_video_logging_success(self):
        """Test that deleteVideo logs appropriately on success."""
        session_id = "test-session"
        self.service.dropbox_service.dbx.files_delete.return_value = None
        
        with patch.object(self.service.logger, 'info') as mock_logger:
            self.service.deleteVideo(session_id)
            
            # Verify logging calls
            calls = [call_args[0][0] for call_args in mock_logger.call_args_list]
            assert any("Attempting to delete video" in c for c in calls)
            assert any("Successfully deleted video" in c for c in calls)

    def test_delete_video_logging_file_not_found(self):
        """Test that deleteVideo logs file not found appropriately."""
        session_id = "test-session"
        
        api_error = MagicMock(spec=dropbox.exceptions.ApiError)
        path_error = MagicMock()
        path_error.is_not_found.return_value = True
        api_error.error.is_path.return_value = True
        api_error.error.get_path.return_value = path_error
        
        self.service.dropbox_service.dbx.files_delete.side_effect = api_error
        
        with patch.object(self.service.logger, 'warning') as mock_logger:
            self.service.deleteVideo(session_id)
            
            # Verify warning was logged
            assert mock_logger.call_count > 0
            warning_msg = mock_logger.call_args_list[0][0][0]
            assert "Video file not found" in warning_msg

    def test_delete_video_logging_error(self):
        """Test that errors are logged appropriately."""
        session_id = "test-session"
        
        api_error = dropbox.exceptions.ApiError(
            request_id="test",
            error=MagicMock(),
            http_status=500,
            body="Server error"
        )
        api_error.error.is_path.return_value = False
        
        self.service.dropbox_service.dbx.files_delete.side_effect = api_error
        
        with patch.object(self.service.logger, 'error') as mock_logger:
            with pytest.raises(RuntimeError):
                self.service.deleteVideo(session_id)
            
            # Verify error was logged
            assert mock_logger.call_count > 0

    def test_delete_video_integration_path_matches_upload_pattern(self):
        """Integration test: verify path construction matches uploadVideo and getVideoUrl pattern."""
        with patch('app.services.video_storage.DropboxService'):
            service = VideoStorageService(refresh_token="test_token")
            service.dropbox_service = MagicMock()
            service.dropbox_service.dbx = MagicMock()
            service.dropbox_service.dbx.files_delete.return_value = None
            
            session_id = "test-123"
            service.deleteVideo(session_id)
            
            # Get the path used in deleteVideo
            path_arg = service.dropbox_service.dbx.files_delete.call_args[0][0]
            
            # The path should match the pattern used in uploadVideo and getVideoUrl
            assert path_arg == f"/MockMe.AI/videos/{session_id}.mp4"
            assert path_arg.endswith(".mp4")


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v", "--tb=short"])
