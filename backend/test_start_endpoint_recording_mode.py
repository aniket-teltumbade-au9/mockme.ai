"""Tests for POST /api/session/start endpoint with recordingMode parameter.

This tests task 1.5.1: Test /start endpoint with both 'audio' and 'video' modes.

Requirements:
- Test POST /api/session/start with recordingMode='audio'
- Test POST /api/session/start with recordingMode='video'
- Verify the endpoint accepts the recordingMode parameter
- Verify the response includes recordingMode field
- Verify backward compatibility - start without recordingMode and verify default is 'audio'
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import Depends
from app.main import app
from app.services.auth import get_current_user


@pytest.fixture(scope="module")
def client():
    """Create test client."""
    return TestClient(app)


def mock_auth_user():
    """Mock authenticated user."""
    return {
        "user_id": "test-user-123",
        "email": "test@example.com",
        "dropbox_refresh_token": "test-refresh-token"
    }


# Override the get_current_user dependency for all tests
app.dependency_overrides[get_current_user] = mock_auth_user


class TestStartEndpointRecordingMode:
    """Test suite for /api/session/start endpoint recordingMode parameter."""

    def test_start_with_recording_mode_audio(self, client):
        """Test starting an interview session with recordingMode='audio'."""
        with patch("app.main.can_start_interview") as mock_can_start, \
             patch("app.main.save_interview_session", new_callable=AsyncMock) as mock_save, \
             patch("app.main.get_user_progress") as mock_progress, \
             patch("app.main.chat_with_llm") as mock_chat, \
             patch("app.main.parse_llm_response") as mock_parse, \
             patch("app.main.get_audio_bytes") as mock_audio, \
             patch("app.main.get_storage_dir") as mock_storage, \
             patch("app.main.get_user_resume", new_callable=AsyncMock) as mock_resume, \
             patch("app.main.set_user_resume", new_callable=AsyncMock) as mock_set_resume:
            
            # Setup mocks
            mock_can_start.return_value = True
            mock_progress.return_value = {"total_interviews": 0}
            mock_chat.return_value = '{"currentState": "STATE_0", "voice_script": "Hello", "showCodeWorkspace": false, "progress": 0, "hints": [], "detectedGaps": []}'
            mock_parse.return_value = ({"currentState": "STATE_0", "showCodeWorkspace": False}, "Hello")
            mock_audio.return_value = b"fake_audio_data"
            mock_storage.return_value = "/tmp/test_storage"
            mock_resume.return_value = None
            mock_set_resume.return_value = None
            mock_save.return_value = None
            
            # Make request with recordingMode='audio'
            response = client.post(
                "/api/session/start",
                data={
                    "jd": "Test JD",
                    "recordingMode": "audio",
                },
                files={}
            )
            
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.json()}")
            
            # Verify the request was successful
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            
            response_data = response.json()
            
            # Verify recordingMode is in response
            assert "recordingMode" in response_data, f"recordingMode not found in response. Full response: {response_data}"
            assert response_data["recordingMode"] == "audio", f"Expected 'audio', got {response_data.get('recordingMode')}"

    def test_start_with_recording_mode_video(self, client):
        """Test starting an interview session with recordingMode='video'."""
        with patch("app.main.can_start_interview") as mock_can_start, \
             patch("app.main.save_interview_session", new_callable=AsyncMock) as mock_save, \
             patch("app.main.get_user_progress") as mock_progress, \
             patch("app.main.chat_with_llm") as mock_chat, \
             patch("app.main.parse_llm_response") as mock_parse, \
             patch("app.main.get_audio_bytes") as mock_audio, \
             patch("app.main.get_storage_dir") as mock_storage, \
             patch("app.main.get_user_resume", new_callable=AsyncMock) as mock_resume, \
             patch("app.main.set_user_resume", new_callable=AsyncMock) as mock_set_resume:
            
            # Setup mocks
            mock_can_start.return_value = True
            mock_progress.return_value = {"total_interviews": 0}
            mock_chat.return_value = '{"currentState": "STATE_0", "voice_script": "Hello", "showCodeWorkspace": false, "progress": 0, "hints": [], "detectedGaps": []}'
            mock_parse.return_value = ({"currentState": "STATE_0", "showCodeWorkspace": False}, "Hello")
            mock_audio.return_value = b"fake_audio_data"
            mock_storage.return_value = "/tmp/test_storage"
            mock_resume.return_value = None
            mock_set_resume.return_value = None
            mock_save.return_value = None
            
            # Make request with recordingMode='video'
            response = client.post(
                "/api/session/start",
                data={
                    "jd": "Test JD",
                    "recordingMode": "video",
                },
                files={}
            )
            
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.json()}")
            
            # Verify the request was successful
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            
            response_data = response.json()
            
            # Verify recordingMode is in response
            assert "recordingMode" in response_data, f"recordingMode not found in response. Full response: {response_data}"
            assert response_data["recordingMode"] == "video", f"Expected 'video', got {response_data.get('recordingMode')}"

    def test_start_without_recording_mode_defaults_to_audio(self, client):
        """Test starting an interview session without recordingMode defaults to 'audio'."""
        with patch("app.main.can_start_interview") as mock_can_start, \
             patch("app.main.save_interview_session", new_callable=AsyncMock) as mock_save, \
             patch("app.main.get_user_progress") as mock_progress, \
             patch("app.main.chat_with_llm") as mock_chat, \
             patch("app.main.parse_llm_response") as mock_parse, \
             patch("app.main.get_audio_bytes") as mock_audio, \
             patch("app.main.get_storage_dir") as mock_storage, \
             patch("app.main.get_user_resume", new_callable=AsyncMock) as mock_resume, \
             patch("app.main.set_user_resume", new_callable=AsyncMock) as mock_set_resume:
            
            # Setup mocks
            mock_can_start.return_value = True
            mock_progress.return_value = {"total_interviews": 0}
            mock_chat.return_value = '{"currentState": "STATE_0", "voice_script": "Hello", "showCodeWorkspace": false, "progress": 0, "hints": [], "detectedGaps": []}'
            mock_parse.return_value = ({"currentState": "STATE_0", "showCodeWorkspace": False}, "Hello")
            mock_audio.return_value = b"fake_audio_data"
            mock_storage.return_value = "/tmp/test_storage"
            mock_resume.return_value = None
            mock_set_resume.return_value = None
            mock_save.return_value = None
            
            # Make request WITHOUT recordingMode (backward compatibility test)
            response = client.post(
                "/api/session/start",
                data={
                    "jd": "Test JD",
                },
                files={}
            )
            
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.json()}")
            
            # Verify the request was successful
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            
            response_data = response.json()
            
            # Verify recordingMode defaults to 'audio' for backward compatibility
            assert "recordingMode" in response_data, f"recordingMode not found in response - backward compatibility broken! Full response: {response_data}"
            assert response_data["recordingMode"] == "audio", f"Expected default 'audio', got {response_data.get('recordingMode')}"

    def test_start_with_invalid_recording_mode_defaults_to_audio(self, client):
        """Test that invalid recordingMode values default to 'audio'."""
        with patch("app.main.can_start_interview") as mock_can_start, \
             patch("app.main.save_interview_session", new_callable=AsyncMock) as mock_save, \
             patch("app.main.get_user_progress") as mock_progress, \
             patch("app.main.chat_with_llm") as mock_chat, \
             patch("app.main.parse_llm_response") as mock_parse, \
             patch("app.main.get_audio_bytes") as mock_audio, \
             patch("app.main.get_storage_dir") as mock_storage, \
             patch("app.main.get_user_resume", new_callable=AsyncMock) as mock_resume, \
             patch("app.main.set_user_resume", new_callable=AsyncMock) as mock_set_resume:
            
            # Setup mocks
            mock_can_start.return_value = True
            mock_progress.return_value = {"total_interviews": 0}
            mock_chat.return_value = '{"currentState": "STATE_0", "voice_script": "Hello", "showCodeWorkspace": false, "progress": 0, "hints": [], "detectedGaps": []}'
            mock_parse.return_value = ({"currentState": "STATE_0", "showCodeWorkspace": False}, "Hello")
            mock_audio.return_value = b"fake_audio_data"
            mock_storage.return_value = "/tmp/test_storage"
            mock_resume.return_value = None
            mock_set_resume.return_value = None
            mock_save.return_value = None
            
            # Make request with invalid recordingMode value
            response = client.post(
                "/api/session/start",
                data={
                    "jd": "Test JD",
                    "recordingMode": "invalid_mode",
                },
                files={}
            )
            
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.json()}")
            
            # Verify the request was successful (gracefully defaulting to audio)
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            
            response_data = response.json()
            
            # Verify invalid mode defaults to 'audio'
            assert "recordingMode" in response_data, f"recordingMode not found in response"
            assert response_data["recordingMode"] == "audio", f"Expected 'audio' (fallback for invalid), got {response_data.get('recordingMode')}"

    def test_session_model_stores_recording_mode_correctly(self, client):
        """Test that session model correctly stores recordingMode in both audio and video modes."""
        from app.models.session import Session
        
        # Test creating a session with audio mode
        session_audio = Session(
            sessionId="test-session-audio",
            user_id="test-user",
            recording_mode="audio"
        )
        assert session_audio.recording_mode == "audio", "Session should store recording_mode='audio'"
        
        # Test creating a session with video mode
        session_video = Session(
            sessionId="test-session-video",
            user_id="test-user",
            recording_mode="video"
        )
        assert session_video.recording_mode == "video", "Session should store recording_mode='video'"
        
        # Test that recording_mode persists through model serialization
        session_dict_audio = session_audio.model_dump()
        assert session_dict_audio["recording_mode"] == "audio", "Serialized session should preserve recording_mode='audio'"
        
        session_dict_video = session_video.model_dump()
        assert session_dict_video["recording_mode"] == "video", "Serialized session should preserve recording_mode='video'"


# Cleanup after tests
@pytest.fixture(scope="module", autouse=True)
def cleanup():
    yield
    app.dependency_overrides.clear()


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v", "--tb=short"])