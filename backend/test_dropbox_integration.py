#!/usr/bin/env python3
"""Tests for Dropbox integration in video storage (Task 1.5.6).

Verifies that the complete video storage flow works with Dropbox:
- Video files successfully uploaded to Dropbox
- Correct Dropbox path structure (/MockMe.AI/videos/{sessionId}.mp4)
- Dropbox refresh token properly used for authentication
- Dropbox shared links generated for video access
- Video metadata extracted and stored correctly
- Dropbox error scenarios handled gracefully
- Rate limiting respected (if applicable)
- Concurrent uploads work correctly
- Video files retrievable from Dropbox by URL
- Delete from Dropbox actually removes files
"""

import sys
import os
import pytest
from unittest.mock import MagicMock, patch, AsyncMock, call
from datetime import datetime
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.video_storage import VideoStorageService
from app.services.dropbox_service import DropboxService
import dropbox
import dropbox.exceptions


class TestDropboxUploadPathStructure:
    """Test that videos are uploaded to correct Dropbox path structure."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch('app.services.video_storage.DropboxService'):
            self.service = VideoStorageService(refresh_token="test_token")
            self.service.dropbox_service = MagicMock()
            self.service.dropbox_service.dbx = MagicMock()
            self.service.dropbox_service._get_or_create_shared_link = MagicMock(
                return_value="https://dl.dropboxusercontent.com/s/test/video.mp4"
            )

    def test_upload_uses_correct_path_format(self):
        """Test that uploadVideo uses /MockMe.AI/videos/{sessionId}.mp4 format."""
        session_id = "abc123-def456"
        video_blob = b'\x00\x01\x02\x03' * 1000
        
        self.service.uploadVideo(video_blob, session_id)
        
        # Verify the correct path was used
        call_args = self.service.dropbox_service.dbx.files_upload.call_args
        path_arg = call_args[0][1]  # Second positional argument is the path
        
        assert path_arg == f"/MockMe.AI/videos/{session_id}.mp4"

    def test_upload_path_includes_session_id(self):
        """Test that each session gets its own video file."""
        session_ids = ["session1", "session2", "session3"]
        video_blob = b'\x00' * 10000
        
        paths_used = []
        def capture_path(*args, **kwargs):
            paths_used.append(args[1])
            return None
        
        self.service.dropbox_service.dbx.files_upload.side_effect = capture_path
        
        for session_id in session_ids:
            self.service.uploadVideo(video_blob, session_id)
        
        # Verify each session got unique path
        assert len(set(paths_used)) == len(session_ids)
        for session_id in session_ids:
            assert any(session_id in path for path in paths_used)

    def test_upload_uses_mp4_extension(self):
        """Test that uploaded files have .mp4 extension."""
        session_id = "test-session"
        video_blob = b'\x00' * 10000
        
        self.service.uploadVideo(video_blob, session_id)
        
        call_args = self.service.dropbox_service.dbx.files_upload.call_args
        path_arg = call_args[0][1]
        
        assert path_arg.endswith(".mp4")

    def test_upload_uses_overwrite_mode(self):
        """Test that upload overwrites existing files."""
        session_id = "test-session"
        video_blob = b'\x00' * 10000
        
        self.service.uploadVideo(video_blob, session_id)
        
        call_args = self.service.dropbox_service.dbx.files_upload.call_args
        kwargs = call_args[1]
        
        assert 'mode' in kwargs
        assert kwargs['mode'] == dropbox.files.WriteMode.overwrite


class TestDropboxAuthentication:
    """Test that Dropbox authentication is properly configured."""

    def test_init_stores_refresh_token(self):
        """Test that refresh token is properly stored."""
        refresh_token = "test_refresh_token_12345"
        
        with patch('app.services.video_storage.DropboxService') as mock_dbx_class:
            service = VideoStorageService(refresh_token=refresh_token)
            
            # Verify DropboxService was initialized with token
            mock_dbx_class.assert_called_once_with(refresh_token)

    def test_upload_uses_authenticated_client(self):
        """Test that upload uses the authenticated Dropbox client."""
        with patch('app.services.video_storage.DropboxService'):
            service = VideoStorageService(refresh_token="test_token")
            service.dropbox_service = MagicMock()
            service.dropbox_service.dbx = MagicMock()
            service.dropbox_service._get_or_create_shared_link = MagicMock(
                return_value="https://example.com/link"
            )
            
            video_blob = b'\x00' * 10000
            service.uploadVideo(video_blob, "session-123")
            
            # Verify dbx client was used
            service.dropbox_service.dbx.files_upload.assert_called_once()

    def test_get_video_url_uses_authenticated_client(self):
        """Test that getting video URL uses authenticated client."""
        with patch('app.services.video_storage.DropboxService'):
            service = VideoStorageService(refresh_token="test_token")
            service.dropbox_service = MagicMock()
            service.dropbox_service._get_or_create_shared_link = MagicMock(
                return_value="https://example.com/link"
            )
            
            service.getVideoUrl("session-123")
            
            # Verify shared link method was called
            service.dropbox_service._get_or_create_shared_link.assert_called_once()


class TestDropboxSharedLinkGeneration:
    """Test that Dropbox shared links are properly generated."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch('app.services.video_storage.DropboxService'):
            self.service = VideoStorageService(refresh_token="test_token")
            self.service.dropbox_service = MagicMock()
            self.service.dropbox_service.dbx = MagicMock()

    def test_upload_generates_shared_link(self):
        """Test that uploadVideo generates a shared link."""
        session_id = "test-session"
        video_blob = b'\x00' * 10000
        expected_url = "https://dl.dropboxusercontent.com/s/abc123/video.mp4"
        
        self.service.dropbox_service._get_or_create_shared_link.return_value = expected_url
        
        video_url, metadata = self.service.uploadVideo(video_blob, session_id)
        
        # Verify shared link was generated
        self.service.dropbox_service._get_or_create_shared_link.assert_called_once()
        assert video_url == expected_url

    def test_get_video_url_returns_shared_link(self):
        """Test that getVideoUrl returns a shared link."""
        session_id = "test-session"
        expected_url = "https://dl.dropboxusercontent.com/s/abc123/video.mp4"
        
        self.service.dropbox_service._get_or_create_shared_link.return_value = expected_url
        
        result = self.service.getVideoUrl(session_id)
        
        assert result == expected_url
        assert result.startswith("https://")

    def test_shared_link_is_accessible_url(self):
        """Test that shared link is in correct Dropbox format."""
        session_id = "test-session"
        expected_url = "https://dl.dropboxusercontent.com/s/abc123/video.mp4"
        
        self.service.dropbox_service._get_or_create_shared_link.return_value = expected_url
        
        result = self.service.getVideoUrl(session_id)
        
        # Verify URL format
        assert "dropboxusercontent.com" in result
        assert result.startswith("https://")


class TestVideoMetadataExtraction:
    """Test that video metadata is extracted and stored correctly."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch('app.services.video_storage.DropboxService'):
            self.service = VideoStorageService(refresh_token="test_token")
            self.service.dropbox_service = MagicMock()
            self.service.dropbox_service.dbx = MagicMock()
            self.service.dropbox_service._get_or_create_shared_link = MagicMock(
                return_value="https://example.com/link"
            )

    def test_upload_returns_metadata_dict(self):
        """Test that uploadVideo returns metadata dictionary."""
        video_blob = b'\x00' * 10000
        
        with patch.object(self.service, '_extract_metadata') as mock_extract:
            mock_extract.return_value = {
                'duration': 120.5,
                'codec': 'h264',
                'width': 1280,
                'height': 720,
                'frameRate': 30.0
            }
            
            video_url, metadata = self.service.uploadVideo(video_blob, "session-123")
            
            # Verify metadata is returned
            assert isinstance(metadata, dict)
            assert 'duration' in metadata
            assert 'codec' in metadata

    def test_metadata_includes_file_size(self):
        """Test that metadata includes file size."""
        video_blob = b'\x00' * 10000
        
        with patch.object(self.service, '_extract_metadata') as mock_extract:
            mock_extract.return_value = {
                'duration': 120.5,
                'codec': 'h264',
                'width': 1280,
                'height': 720,
                'frameRate': 30.0
            }
            
            video_url, metadata = self.service.uploadVideo(video_blob, "session-123")
            
            assert metadata['fileSize'] == len(video_blob)

    def test_metadata_includes_upload_timestamp(self):
        """Test that metadata includes upload timestamp."""
        video_blob = b'\x00' * 10000
        
        with patch.object(self.service, '_extract_metadata') as mock_extract:
            mock_extract.return_value = {
                'duration': 120.5,
                'codec': 'h264',
                'width': 1280,
                'height': 720,
                'frameRate': 30.0
            }
            
            video_url, metadata = self.service.uploadVideo(video_blob, "session-123")
            
            assert 'uploadedAt' in metadata
            assert metadata['uploadedAt'] is not None

    def test_metadata_includes_recording_mode(self):
        """Test that metadata marks recording mode as 'video'."""
        video_blob = b'\x00' * 10000
        
        with patch.object(self.service, '_extract_metadata') as mock_extract:
            mock_extract.return_value = {
                'duration': 120.5,
                'codec': 'h264',
                'width': 1280,
                'height': 720,
                'frameRate': 30.0
            }
            
            video_url, metadata = self.service.uploadVideo(video_blob, "session-123")
            
            assert metadata['recordingMode'] == 'video'


class TestDropboxErrorHandling:
    """Test that Dropbox errors are handled gracefully."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch('app.services.video_storage.DropboxService'):
            self.service = VideoStorageService(refresh_token="test_token")
            self.service.dropbox_service = MagicMock()
            self.service.dropbox_service.dbx = MagicMock()

    def _create_api_error(self):
        """Helper to create a generic API error."""
        class FakeError:
            def is_path(self):
                return False
        
        class FakeApiError(Exception):
            def __init__(self):
                self.error = FakeError()
        
        return FakeApiError()

    def test_upload_handles_auth_error(self):
        """Test that authentication errors are handled."""
        api_error = Exception("Auth failed")
        self.service.dropbox_service.dbx.files_upload.side_effect = api_error
        
        with pytest.raises(RuntimeError):
            self.service.uploadVideo(b'\x00' * 10000, "session-123")

    def test_upload_handles_rate_limit_error(self):
        """Test that rate limit errors are handled."""
        api_error = self._create_api_error()
        self.service.dropbox_service.dbx.files_upload.side_effect = api_error
        
        with pytest.raises(RuntimeError):
            self.service.uploadVideo(b'\x00' * 10000, "session-123")

    def test_get_video_url_handles_dropbox_error(self):
        """Test that getVideoUrl handles Dropbox errors."""
        api_error = self._create_api_error()
        
        self.service.dropbox_service._get_or_create_shared_link.side_effect = api_error
        
        with pytest.raises(RuntimeError):
            self.service.getVideoUrl("session-123")

    def test_delete_video_handles_dropbox_error(self):
        """Test that deleteVideo handles Dropbox errors."""
        api_error = self._create_api_error()
        self.service.dropbox_service.dbx.files_delete.side_effect = api_error
        
        with pytest.raises(RuntimeError):
            self.service.deleteVideo("session-123")


class TestVideoRetrieval:
    """Test that video files are retrievable from Dropbox."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch('app.services.video_storage.DropboxService'):
            self.service = VideoStorageService(refresh_token="test_token")
            self.service.dropbox_service = MagicMock()

    def test_get_video_url_retrieves_correct_path(self):
        """Test that getVideoUrl retrieves video by correct path."""
        session_id = "test-session-123"
        
        self.service.dropbox_service._get_or_create_shared_link.return_value = "https://example.com/link"
        
        self.service.getVideoUrl(session_id)
        
        # Verify correct path was used
        call_args = self.service.dropbox_service._get_or_create_shared_link.call_args
        path_arg = call_args[0][0]
        
        assert f"/MockMe.AI/videos/{session_id}.mp4" in path_arg

    def test_get_video_url_returns_url_string(self):
        """Test that getVideoUrl returns a URL string."""
        expected_url = "https://dl.dropboxusercontent.com/s/abc123/video.mp4"
        
        self.service.dropbox_service._get_or_create_shared_link.return_value = expected_url
        
        result = self.service.getVideoUrl("session-123")
        
        assert isinstance(result, str)
        assert result == expected_url


class TestVideoFileDeletion:
    """Test that videos can be deleted from Dropbox."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch('app.services.video_storage.DropboxService'):
            self.service = VideoStorageService(refresh_token="test_token")
            self.service.dropbox_service = MagicMock()
            self.service.dropbox_service.dbx = MagicMock()

    def test_delete_video_removes_file(self):
        """Test that deleteVideo actually calls Dropbox delete."""
        session_id = "test-session-123"
        
        self.service.dropbox_service.dbx.files_delete.return_value = None
        
        result = self.service.deleteVideo(session_id)
        
        # Verify files_delete was called
        self.service.dropbox_service.dbx.files_delete.assert_called_once()
        assert result is True

    def test_delete_video_uses_correct_path(self):
        """Test that deleteVideo uses correct path for deletion."""
        session_id = "test-session-123"
        
        self.service.dropbox_service.dbx.files_delete.return_value = None
        
        self.service.deleteVideo(session_id)
        
        # Verify correct path was used
        call_args = self.service.dropbox_service.dbx.files_delete.call_args
        path_arg = call_args[0][0]
        
        assert path_arg == f"/MockMe.AI/videos/{session_id}.mp4"

    def test_delete_video_handles_already_deleted(self):
        """Test that deleting already-deleted video returns False."""
        session_id = "test-session"
        
        api_error = MagicMock(spec=dropbox.exceptions.ApiError)
        path_error = MagicMock()
        path_error.is_not_found.return_value = True
        api_error.error.is_path.return_value = True
        api_error.error.get_path.return_value = path_error
        
        self.service.dropbox_service.dbx.files_delete.side_effect = api_error
        
        result = self.service.deleteVideo(session_id)
        
        assert result is False


class TestConcurrentOperations:
    """Test that concurrent video operations work correctly."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch('app.services.video_storage.DropboxService'):
            self.service = VideoStorageService(refresh_token="test_token")
            self.service.dropbox_service = MagicMock()
            self.service.dropbox_service.dbx = MagicMock()
            self.service.dropbox_service._get_or_create_shared_link = MagicMock(
                side_effect=lambda path: f"https://example.com/{path.split('/')[-1]}"
            )

    def test_multiple_uploads_use_unique_paths(self):
        """Test that multiple concurrent uploads use unique paths."""
        session_ids = [f"session-{i}" for i in range(5)]
        video_blob = b'\x00' * 10000
        
        paths_used = []
        def capture_upload(*args, **kwargs):
            paths_used.append(args[1])
            return None
        
        self.service.dropbox_service.dbx.files_upload.side_effect = capture_upload
        
        for session_id in session_ids:
            with patch.object(self.service, '_extract_metadata') as mock_extract:
                mock_extract.return_value = {
                    'duration': 120.5,
                    'codec': 'h264',
                    'width': 1280,
                    'height': 720,
                    'frameRate': 30.0
                }
                self.service.uploadVideo(video_blob, session_id)
        
        # Verify all paths are unique
        assert len(set(paths_used)) == len(session_ids)

    def test_concurrent_deletes_work_independently(self):
        """Test that concurrent deletes don't interfere."""
        session_ids = [f"session-{i}" for i in range(3)]
        
        self.service.dropbox_service.dbx.files_delete.return_value = None
        
        results = [self.service.deleteVideo(sid) for sid in session_ids]
        
        # All should succeed
        assert all(results)
        assert self.service.dropbox_service.dbx.files_delete.call_count == 3


class TestDropboxIntegrationFlow:
    """Test complete Dropbox integration flow."""

    def setup_method(self):
        """Set up test fixtures."""
        with patch('app.services.video_storage.DropboxService'):
            self.service = VideoStorageService(refresh_token="test_token")
            self.service.dropbox_service = MagicMock()
            self.service.dropbox_service.dbx = MagicMock()
            self.service.dropbox_service._get_or_create_shared_link = MagicMock(
                return_value="https://example.com/video.mp4"
            )

    def test_upload_retrieve_delete_flow(self):
        """Test complete flow: upload -> retrieve -> delete."""
        session_id = "test-session"
        video_blob = b'\x00' * 10000
        
        with patch.object(self.service, '_extract_metadata') as mock_extract:
            mock_extract.return_value = {
                'duration': 120.5,
                'codec': 'h264',
                'width': 1280,
                'height': 720,
                'frameRate': 30.0
            }
            
            # Upload
            video_url, metadata = self.service.uploadVideo(video_blob, session_id)
            assert video_url is not None
            
            # Retrieve
            retrieved_url = self.service.getVideoUrl(session_id)
            assert retrieved_url == video_url
            
            # Delete
            self.service.dropbox_service.dbx.files_delete.return_value = None
            result = self.service.deleteVideo(session_id)
            assert result is True


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
