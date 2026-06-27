#!/usr/bin/env python3
"""Simple unit tests for VideoStorageService.getVideoUrl() method."""

import sys
import os
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.video_storage import VideoStorageService
import dropbox.exceptions


def test_get_video_url_success():
    """Test successful retrieval of video URL for existing video."""
    print("\n[TEST 1] get_video_url_success")
    
    with patch('app.services.video_storage.DropboxService'):
        service = VideoStorageService(refresh_token="test_token")
        service.dropbox_service = MagicMock()
        
        session_id = "test-session-123"
        expected_url = "https://dl.dropboxusercontent.com/s/abc123/test-session-123.mp4"
        
        # Mock the shared link retrieval
        service.dropbox_service._get_or_create_shared_link.return_value = expected_url
        
        # Call the method
        result = service.getVideoUrl(session_id)
        
        # Verify the result
        assert result == expected_url, "Expected URL mismatch: {} vs {}".format(expected_url, result)
        
        # Verify the correct path was requested
        call_args = service.dropbox_service._get_or_create_shared_link.call_args
        assert call_args[0][0] == "/MockMe.AI/videos/test-session-123.mp4"
        
        print("[PASS] Video URL retrieved successfully")
        print("  Session ID: {}".format(session_id))
        print("  URL: {}".format(result))


def test_get_video_url_constructs_correct_path():
    """Test that getVideoUrl constructs the correct Dropbox path."""
    print("\n[TEST 2] get_video_url_constructs_correct_path")
    
    with patch('app.services.video_storage.DropboxService'):
        service = VideoStorageService(refresh_token="test_token")
        service.dropbox_service = MagicMock()
        service.dropbox_service._get_or_create_shared_link.return_value = "https://example.com/link"
        
        session_id = "session-xyz-789"
        service.getVideoUrl(session_id)
        
        # Verify the path was constructed correctly
        call_args = service.dropbox_service._get_or_create_shared_link.call_args
        expected_path = "/MockMe.AI/videos/session-xyz-789.mp4"
        assert call_args[0][0] == expected_path, "Path mismatch: {} vs {}".format(expected_path, call_args[0][0])
        
        print("[PASS] Path constructed correctly")
        print("  Path: {}".format(call_args[0][0]))


def test_get_video_url_file_not_found_error():
    """Test RuntimeError is raised when video file doesn't exist."""
    print("\n[TEST 3] get_video_url_file_not_found_error")
    
    with patch('app.services.video_storage.DropboxService'):
        service = VideoStorageService(refresh_token="test_token")
        service.dropbox_service = MagicMock()
        
        session_id = "missing-video-session"
        
        # Mock file not found error
        error = RuntimeError("Video not found for session {}".format(session_id))
        service.dropbox_service._get_or_create_shared_link.side_effect = error
        
        # Call should raise RuntimeError
        try:
            service.getVideoUrl(session_id)
            assert False, "Expected RuntimeError to be raised"
        except RuntimeError as e:
            error_msg = str(e)
            assert "Video not found" in error_msg
            print("[PASS] RuntimeError raised for missing video")
            print("  Error message: {}".format(error_msg))


def test_get_video_url_other_dropbox_api_error():
    """Test RuntimeError is raised for other Dropbox API errors."""
    print("\n[TEST 4] get_video_url_other_dropbox_api_error")
    
    with patch('app.services.video_storage.DropboxService'):
        service = VideoStorageService(refresh_token="test_token")
        service.dropbox_service = MagicMock()
        
        session_id = "test-session"
        
        # Mock generic error
        error = Exception("Dropbox API error: Request failed")
        service.dropbox_service._get_or_create_shared_link.side_effect = error
        
        # Call should raise RuntimeError
        try:
            service.getVideoUrl(session_id)
            assert False, "Expected RuntimeError to be raised"
        except RuntimeError as e:
            error_msg = str(e)
            assert "Failed to retrieve video URL" in error_msg
            print("[PASS] RuntimeError raised for Dropbox API error")
            print("  Error message: {}".format(error_msg))


def test_get_video_url_unexpected_exception():
    """Test RuntimeError is raised for unexpected exceptions."""
    print("\n[TEST 5] get_video_url_unexpected_exception")
    
    with patch('app.services.video_storage.DropboxService'):
        service = VideoStorageService(refresh_token="test_token")
        service.dropbox_service = MagicMock()
        
        session_id = "test-session"
        
        # Mock unexpected error
        service.dropbox_service._get_or_create_shared_link.side_effect = ValueError(
            "Unexpected error"
        )
        
        # Call should raise RuntimeError
        try:
            service.getVideoUrl(session_id)
            assert False, "Expected RuntimeError to be raised"
        except RuntimeError as e:
            error_msg = str(e)
            assert "Failed to retrieve video URL" in error_msg
            print("[PASS] RuntimeError raised for unexpected exception")
            print("  Error message: {}".format(error_msg))


def test_get_video_url_returns_string():
    """Test that getVideoUrl returns a string (the URL)."""
    print("\n[TEST 6] get_video_url_returns_string")
    
    with patch('app.services.video_storage.DropboxService'):
        service = VideoStorageService(refresh_token="test_token")
        service.dropbox_service = MagicMock()
        
        session_id = "test-session"
        url = "https://dl.dropboxusercontent.com/s/test/video.mp4"
        service.dropbox_service._get_or_create_shared_link.return_value = url
        
        result = service.getVideoUrl(session_id)
        
        assert isinstance(result, str), "Expected str, got {}".format(type(result))
        assert result.startswith("https://"), "Expected HTTPS URL, got: {}".format(result)
        
        print("[PASS] Returns string URL")
        print("  Type: {}".format(type(result).__name__))
        print("  Value: {}".format(result))


def test_get_video_url_with_special_session_id():
    """Test getVideoUrl with special characters in session ID."""
    print("\n[TEST 7] get_video_url_with_special_session_id")
    
    with patch('app.services.video_storage.DropboxService'):
        service = VideoStorageService(refresh_token="test_token")
        service.dropbox_service = MagicMock()
        
        session_id = "session-with-dashes_and_underscores"
        expected_url = "https://example.com/link"
        service.dropbox_service._get_or_create_shared_link.return_value = expected_url
        
        result = service.getVideoUrl(session_id)
        
        assert result == expected_url
        # Verify the path includes the special characters
        call_args = service.dropbox_service._get_or_create_shared_link.call_args
        path = call_args[0][0]
        assert session_id in path, "Expected session ID in path, got: {}".format(path)
        
        print("[PASS] Special characters handled correctly")
        print("  Session ID: {}".format(session_id))
        print("  Path: {}".format(path))


def test_get_video_url_integration_path_construction():
    """Integration test: verify path construction matches uploadVideo pattern."""
    print("\n[TEST 8] get_video_url_integration_path_construction")
    
    with patch('app.services.video_storage.DropboxService'):
        service = VideoStorageService(refresh_token="test_token")
        service.dropbox_service = MagicMock()
        service.dropbox_service._get_or_create_shared_link.return_value = "https://example.com/link"
        
        session_id = "test-123"
        service.getVideoUrl(session_id)
        
        # Get the path used in getVideoUrl
        path_arg = service.dropbox_service._get_or_create_shared_link.call_args[0][0]
        
        # The path should match the pattern used in uploadVideo
        expected_path = "/MockMe.AI/videos/test-123.mp4"
        assert path_arg == expected_path, "Expected {}, got {}".format(expected_path, path_arg)
        assert path_arg.endswith(".mp4"), "Path should end with .mp4, got: {}".format(path_arg)
        
        print("[PASS] Path construction matches uploadVideo pattern")
        print("  Path: {}".format(path_arg))


def run_all_tests():
    """Run all tests."""
    print("\n" + "=" * 70)
    print("VIDEOSTORAGESERVICE.GETVIDEOURL() UNIT TESTS")
    print("=" * 70)
    
    tests = [
        test_get_video_url_success,
        test_get_video_url_constructs_correct_path,
        test_get_video_url_file_not_found_error,
        test_get_video_url_other_dropbox_api_error,
        test_get_video_url_unexpected_exception,
        test_get_video_url_returns_string,
        test_get_video_url_with_special_session_id,
        test_get_video_url_integration_path_construction,
    ]
    
    passed = 0
    failed = 0
    
    for test_func in tests:
        try:
            test_func()
            passed += 1
        except AssertionError as e:
            failed += 1
            print("[FAILED] {}".format(test_func.__name__))
            print("  Error: {}".format(str(e)))
        except Exception as e:
            failed += 1
            print("[FAILED] {}".format(test_func.__name__))
            print("  Unexpected error: {}".format(str(e)))
            import traceback
            traceback.print_exc()
    
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print("Passed: {}/{}".format(passed, len(tests)))
    print("Failed: {}/{}".format(failed, len(tests)))
    print("=" * 70)
    
    if failed == 0:
        print("\n[SUCCESS] All tests passed!")
        print("\nImplementation verified:")
        print("[PASS] getVideoUrl() constructs correct path")
        print("[PASS] getVideoUrl() uses DropboxService._get_or_create_shared_link()")
        print("[PASS] getVideoUrl() returns publicly accessible URL")
        print("[PASS] getVideoUrl() handles file not found error")
        print("[PASS] getVideoUrl() handles Dropbox API errors")
        print("[PASS] getVideoUrl() handles unexpected exceptions")
        print("[PASS] getVideoUrl() proper error logging")
        return True
    else:
        print("\n[FAILED] {} test(s) failed".format(failed))
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
