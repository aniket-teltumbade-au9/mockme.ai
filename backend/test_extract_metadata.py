#!/usr/bin/env python3
"""Unit tests for VideoStorageService._extract_metadata() method."""

import sys
import os
import json
import tempfile
from unittest.mock import MagicMock, patch, call
import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.video_storage import VideoStorageService


class TestExtractMetadata:
    """Test suite for VideoStorageService._extract_metadata() method."""

    def setup_method(self):
        """Set up test fixtures before each test."""
        # Mock the DropboxService to avoid needing real credentials
        with patch('app.services.video_storage.DropboxService'):
            self.service = VideoStorageService(refresh_token="test_token")
            # Mock the dropbox_service
            self.service.dropbox_service = MagicMock()

    def test_extract_metadata_returns_dict(self):
        """Test that _extract_metadata returns a dictionary."""
        blob = b"fake video content"
        
        # Mock ffprobe output
        ffprobe_output = {
            "streams": [{
                "codec_name": "h264",
                "width": 1280,
                "height": 720,
                "r_frame_rate": "30/1"
            }],
            "format": {"duration": "10.5"}
        }
        
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout=json.dumps(ffprobe_output),
                stderr=""
            )
            
            result = self.service._extract_metadata(blob)
            
            assert isinstance(result, dict)

    def test_extract_metadata_includes_required_fields(self):
        """Test that _extract_metadata includes all required fields."""
        blob = b"fake video content"
        
        ffprobe_output = {
            "streams": [{
                "codec_name": "h264",
                "width": 1280,
                "height": 720,
                "r_frame_rate": "30/1"
            }],
            "format": {"duration": "10.5"}
        }
        
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout=json.dumps(ffprobe_output),
                stderr=""
            )
            
            result = self.service._extract_metadata(blob)
            
            # Verify all required fields are present
            assert "duration" in result
            assert "codec" in result
            assert "width" in result
            assert "height" in result
            assert "frameRate" in result

    def test_extract_metadata_duration_is_float(self):
        """Test that duration is returned as float in seconds."""
        blob = b"fake video content"
        
        ffprobe_output = {
            "streams": [{
                "codec_name": "h264",
                "width": 1280,
                "height": 720,
                "r_frame_rate": "30/1"
            }],
            "format": {"duration": "1200.5"}
        }
        
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout=json.dumps(ffprobe_output),
                stderr=""
            )
            
            result = self.service._extract_metadata(blob)
            
            assert isinstance(result["duration"], float)
            assert result["duration"] == 1200.5

    def test_extract_metadata_codec_is_string(self):
        """Test that codec is returned as string."""
        blob = b"fake video content"
        
        ffprobe_output = {
            "streams": [{
                "codec_name": "h264",
                "width": 1280,
                "height": 720,
                "r_frame_rate": "30/1"
            }],
            "format": {"duration": "10.5"}
        }
        
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout=json.dumps(ffprobe_output),
                stderr=""
            )
            
            result = self.service._extract_metadata(blob)
            
            assert isinstance(result["codec"], str)
            assert result["codec"] == "h264"

    def test_extract_metadata_width_height_are_int(self):
        """Test that width and height are integers."""
        blob = b"fake video content"
        
        ffprobe_output = {
            "streams": [{
                "codec_name": "h264",
                "width": 1920,
                "height": 1080,
                "r_frame_rate": "30/1"
            }],
            "format": {"duration": "10.5"}
        }
        
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout=json.dumps(ffprobe_output),
                stderr=""
            )
            
            result = self.service._extract_metadata(blob)
            
            assert isinstance(result["width"], int)
            assert isinstance(result["height"], int)
            assert result["width"] == 1920
            assert result["height"] == 1080

    def test_extract_metadata_frameRate_is_float(self):
        """Test that frameRate is returned as float."""
        blob = b"fake video content"
        
        ffprobe_output = {
            "streams": [{
                "codec_name": "h264",
                "width": 1280,
                "height": 720,
                "r_frame_rate": "30/1"
            }],
            "format": {"duration": "10.5"}
        }
        
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout=json.dumps(ffprobe_output),
                stderr=""
            )
            
            result = self.service._extract_metadata(blob)
            
            assert isinstance(result["frameRate"], float)
            assert result["frameRate"] == 30.0

    def test_extract_metadata_different_codecs(self):
        """Test _extract_metadata with different video codecs."""
        blob = b"fake video content"
        
        for codec in ["h264", "vp8", "vp9", "hevc"]:
            ffprobe_output = {
                "streams": [{
                    "codec_name": codec,
                    "width": 1280,
                    "height": 720,
                    "r_frame_rate": "30/1"
                }],
                "format": {"duration": "10.5"}
            }
            
            with patch('subprocess.run') as mock_run:
                mock_run.return_value = MagicMock(
                    returncode=0,
                    stdout=json.dumps(ffprobe_output),
                    stderr=""
                )
                
                result = self.service._extract_metadata(blob)
                
                assert result["codec"] == codec

    def test_extract_metadata_different_resolutions(self):
        """Test _extract_metadata with different resolutions."""
        blob = b"fake video content"
        
        resolutions = [
            (1920, 1080),
            (1280, 720),
            (854, 480),
            (640, 360)
        ]
        
        for width, height in resolutions:
            ffprobe_output = {
                "streams": [{
                    "codec_name": "h264",
                    "width": width,
                    "height": height,
                    "r_frame_rate": "30/1"
                }],
                "format": {"duration": "10.5"}
            }
            
            with patch('subprocess.run') as mock_run:
                mock_run.return_value = MagicMock(
                    returncode=0,
                    stdout=json.dumps(ffprobe_output),
                    stderr=""
                )
                
                result = self.service._extract_metadata(blob)
                
                assert result["width"] == width
                assert result["height"] == height

    def test_extract_metadata_different_frame_rates(self):
        """Test _extract_metadata with different frame rates."""
        blob = b"fake video content"
        
        frame_rates = [
            ("24/1", 24.0),
            ("30/1", 30.0),
            ("60/1", 60.0),
            ("25/1", 25.0),
        ]
        
        for rate_str, expected_rate in frame_rates:
            ffprobe_output = {
                "streams": [{
                    "codec_name": "h264",
                    "width": 1280,
                    "height": 720,
                    "r_frame_rate": rate_str
                }],
                "format": {"duration": "10.5"}
            }
            
            with patch('subprocess.run') as mock_run:
                mock_run.return_value = MagicMock(
                    returncode=0,
                    stdout=json.dumps(ffprobe_output),
                    stderr=""
                )
                
                result = self.service._extract_metadata(blob)
                
                assert result["frameRate"] == expected_rate

    def test_extract_metadata_ffprobe_error_raises_valueerror(self):
        """Test that ffprobe error raises ValueError."""
        blob = b"fake video content"
        
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=1,
                stdout="",
                stderr="Error: invalid video"
            )
            
            with pytest.raises(ValueError) as exc_info:
                self.service._extract_metadata(blob)
            
            assert "Failed to extract video metadata" in str(exc_info.value)

    def test_extract_metadata_invalid_json_raises_valueerror(self):
        """Test that invalid JSON output raises ValueError."""
        blob = b"fake video content"
        
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout="not valid json",
                stderr=""
            )
            
            with pytest.raises(ValueError) as exc_info:
                self.service._extract_metadata(blob)
            
            assert "Invalid metadata format" in str(exc_info.value) or "Failed to extract metadata" in str(exc_info.value)

    def test_extract_metadata_timeout_raises_valueerror(self):
        """Test that subprocess timeout raises ValueError."""
        blob = b"fake video content"
        
        with patch('subprocess.run') as mock_run:
            mock_run.side_effect = OSError("Timeout")
            
            with pytest.raises(ValueError) as exc_info:
                self.service._extract_metadata(blob)
            
            assert "Failed to extract metadata" in str(exc_info.value)

    def test_extract_metadata_fallback_defaults_on_missing_stream_data(self):
        """Test fallback to defaults when stream data is missing."""
        blob = b"fake video content"
        
        # ffprobe output with empty streams
        ffprobe_output = {
            "streams": [],
            "format": {"duration": "10.5"}
        }
        
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout=json.dumps(ffprobe_output),
                stderr=""
            )
            
            result = self.service._extract_metadata(blob)
            
            # Should use defaults
            assert result["codec"] == "h264"
            assert result["width"] == 1280
            assert result["height"] == 720
            assert result["frameRate"] == 30.0

    def test_extract_metadata_fallback_defaults_on_missing_format_data(self):
        """Test fallback when format data is missing."""
        blob = b"fake video content"
        
        ffprobe_output = {
            "streams": [{
                "codec_name": "h264",
                "width": 1280,
                "height": 720,
                "r_frame_rate": "30/1"
            }],
            "format": {}
        }
        
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout=json.dumps(ffprobe_output),
                stderr=""
            )
            
            result = self.service._extract_metadata(blob)
            
            # Should use 0 as default for duration when not found
            assert result["duration"] == 0

    def test_extract_metadata_empty_blob_raises_error(self):
        """Test that empty blob is handled gracefully."""
        blob = b""
        
        ffprobe_output = {
            "streams": [],
            "format": {}
        }
        
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout=json.dumps(ffprobe_output),
                stderr=""
            )
            
            # Should still work, but return defaults
            result = self.service._extract_metadata(blob)
            assert isinstance(result, dict)

    def test_extract_metadata_calls_ffprobe_command(self):
        """Test that _extract_metadata calls ffprobe with correct arguments."""
        blob = b"fake video content"
        
        ffprobe_output = {
            "streams": [{
                "codec_name": "h264",
                "width": 1280,
                "height": 720,
                "r_frame_rate": "30/1"
            }],
            "format": {"duration": "10.5"}
        }
        
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout=json.dumps(ffprobe_output),
                stderr=""
            )
            
            self.service._extract_metadata(blob)
            
            # Verify ffprobe was called
            assert mock_run.called
            call_args = mock_run.call_args
            cmd = call_args[0][0]
            
            # Verify it's an ffprobe command
            assert cmd[0] == "ffprobe"
            assert "-show_entries" in cmd
            assert "stream=codec_name,width,height,r_frame_rate,duration" in cmd

    def test_extract_metadata_cleans_up_temp_file(self):
        """Test that temporary file is cleaned up after metadata extraction."""
        blob = b"fake video content"
        
        ffprobe_output = {
            "streams": [{
                "codec_name": "h264",
                "width": 1280,
                "height": 720,
                "r_frame_rate": "30/1"
            }],
            "format": {"duration": "10.5"}
        }
        
        with patch('subprocess.run') as mock_run:
            with patch('os.remove') as mock_remove:
                mock_run.return_value = MagicMock(
                    returncode=0,
                    stdout=json.dumps(ffprobe_output),
                    stderr=""
                )
                
                self.service._extract_metadata(blob)
                
                # Verify temp file cleanup was called
                assert mock_remove.called

    def test_extract_metadata_logging_on_success(self):
        """Test that _extract_metadata logs appropriately on success."""
        blob = b"fake video content"
        
        ffprobe_output = {
            "streams": [{
                "codec_name": "h264",
                "width": 1280,
                "height": 720,
                "r_frame_rate": "30/1"
            }],
            "format": {"duration": "10.5"}
        }
        
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout=json.dumps(ffprobe_output),
                stderr=""
            )
            
            with patch.object(self.service.logger, 'info') as mock_logger:
                self.service._extract_metadata(blob)
                
                # Verify logging calls
                calls = [call_arg[0][0] for call_arg in mock_logger.call_args_list]
                assert any("Extracting metadata" in c for c in calls)
                assert any("Extracted video metadata" in c for c in calls)

    def test_extract_metadata_logging_on_error(self):
        """Test that _extract_metadata logs errors appropriately."""
        blob = b"fake video content"
        
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=1,
                stdout="",
                stderr="Error: invalid video"
            )
            
            with patch.object(self.service.logger, 'error') as mock_logger:
                with pytest.raises(ValueError):
                    self.service._extract_metadata(blob)
                
                # Verify error was logged
                assert mock_logger.called

    def test_parse_frame_rate_with_fraction(self):
        """Test _parse_frame_rate with fraction format."""
        frame_rate = self.service._parse_frame_rate("30/1")
        assert frame_rate == 30.0
        
        frame_rate = self.service._parse_frame_rate("24000/1001")
        assert abs(frame_rate - 23.976) < 0.01

    def test_parse_frame_rate_with_float(self):
        """Test _parse_frame_rate with float format."""
        frame_rate = self.service._parse_frame_rate("30.0")
        assert frame_rate == 30.0
        
        frame_rate = self.service._parse_frame_rate("23.976")
        assert abs(frame_rate - 23.976) < 0.001

    def test_parse_frame_rate_invalid_returns_default(self):
        """Test _parse_frame_rate returns default for invalid input."""
        frame_rate = self.service._parse_frame_rate("invalid")
        assert frame_rate == 30.0

    def test_parse_frame_rate_zero_denominator_returns_default(self):
        """Test _parse_frame_rate returns default for zero denominator."""
        frame_rate = self.service._parse_frame_rate("30/0")
        assert frame_rate == 30.0

    def test_extract_metadata_with_stream_duration(self):
        """Test extraction when duration is in stream data."""
        blob = b"fake video content"
        
        ffprobe_output = {
            "streams": [{
                "codec_name": "h264",
                "width": 1280,
                "height": 720,
                "r_frame_rate": "30/1",
                "duration": "10.5"
            }],
            "format": {}
        }
        
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout=json.dumps(ffprobe_output),
                stderr=""
            )
            
            result = self.service._extract_metadata(blob)
            
            # Duration should still be parsed correctly
            assert isinstance(result["duration"], float)


class TestExtractMetadataIntegration:
    """Integration tests for _extract_metadata with other methods."""

    def setup_method(self):
        """Set up test fixtures before each test."""
        with patch('app.services.video_storage.DropboxService'):
            self.service = VideoStorageService(refresh_token="test_token")
            self.service.dropbox_service = MagicMock()

    def test_metadata_structure_matches_requirements(self):
        """Test that extracted metadata matches design requirements."""
        blob = b"fake video content"
        
        ffprobe_output = {
            "streams": [{
                "codec_name": "h264",
                "width": 1280,
                "height": 720,
                "r_frame_rate": "30/1"
            }],
            "format": {"duration": "1200.5"}
        }
        
        with patch('subprocess.run') as mock_run:
            mock_run.return_value = MagicMock(
                returncode=0,
                stdout=json.dumps(ffprobe_output),
                stderr=""
            )
            
            metadata = self.service._extract_metadata(blob)
            
            # Verify structure matches design requirements
            # duration (float in seconds)
            assert isinstance(metadata["duration"], float)
            assert metadata["duration"] > 0
            
            # codec (str)
            assert isinstance(metadata["codec"], str)
            assert len(metadata["codec"]) > 0
            
            # width, height (int)
            assert isinstance(metadata["width"], int)
            assert isinstance(metadata["height"], int)
            assert metadata["width"] > 0
            assert metadata["height"] > 0
            
            # frameRate (float)
            assert isinstance(metadata["frameRate"], float)
            assert metadata["frameRate"] > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

