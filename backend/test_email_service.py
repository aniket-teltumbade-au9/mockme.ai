"""
Tests for Email Service Integration.

Tests email sending functionality, SMTP configuration, error handling, and email extraction.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import logging
from app.services.email_service import send_email, send_email_notification


class TestSendEmail:
    """Tests for the send_email function."""
    
    @patch.dict("os.environ", {
        "SMTP_HOST": "smtp.mailtrap.io",
        "SMTP_PORT": "2525",
        "SMTP_USER": "test_user",
        "SMTP_PASSWORD": "test_password",
        "SENDER_EMAIL": "noreply@mockme.com"
    })
    @patch("smtplib.SMTP")
    @pytest.mark.asyncio
    async def test_send_email_success(self, mock_smtp):
        """Test successful email sending with valid SMTP configuration."""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        result = await send_email(
            email="user@example.com",
            subject="Test Subject",
            body="Test Body"
        )
        
        assert result is True
        mock_server.starttls.assert_called_once()
        mock_server.login.assert_called_once_with("test_user", "test_password")
        mock_server.sendmail.assert_called_once()
    
    @patch.dict("os.environ", {
        "SMTP_HOST": "smtp.mailtrap.io",
        "SMTP_PORT": "2525",
        "SMTP_USER": "",
        "SMTP_PASSWORD": ""
    })
    @pytest.mark.asyncio
    async def test_send_email_missing_credentials(self, caplog):
        """Test email sending gracefully handles missing SMTP credentials."""
        with caplog.at_level(logging.WARNING):
            result = await send_email(
                email="user@example.com",
                subject="Test Subject",
                body="Test Body"
            )
        
        assert result is False
        assert "SMTP credentials not configured" in caplog.text
    
    @patch.dict("os.environ", {
        "SMTP_HOST": "smtp.mailtrap.io",
        "SMTP_PORT": "2525",
        "SMTP_USER": "test_user",
        "SMTP_PASSWORD": "test_password",
        "SENDER_EMAIL": "noreply@mockme.com"
    })
    @patch("smtplib.SMTP")
    @pytest.mark.asyncio
    async def test_send_email_smtp_error(self, mock_smtp, caplog):
        """Test email sending handles SMTP errors gracefully."""
        import smtplib
        
        mock_smtp.side_effect = smtplib.SMTPException("Connection failed")
        
        with caplog.at_level(logging.ERROR):
            result = await send_email(
                email="user@example.com",
                subject="Test Subject",
                body="Test Body"
            )
        
        assert result is False
        assert "SMTP error" in caplog.text
    
    @patch.dict("os.environ", {
        "SMTP_HOST": "smtp.mailtrap.io",
        "SMTP_PORT": "2525",
        "SMTP_USER": "test_user",
        "SMTP_PASSWORD": "test_password",
        "SENDER_EMAIL": "noreply@mockme.com"
    })
    @patch("smtplib.SMTP")
    @pytest.mark.asyncio
    async def test_send_email_general_exception(self, mock_smtp, caplog):
        """Test email sending handles general exceptions gracefully."""
        mock_smtp.side_effect = Exception("Unexpected error")
        
        with caplog.at_level(logging.ERROR):
            result = await send_email(
                email="user@example.com",
                subject="Test Subject",
                body="Test Body"
            )
        
        assert result is False
        assert "Error sending email" in caplog.text
    
    @patch.dict("os.environ", {
        "SMTP_HOST": "smtp.mailtrap.io",
        "SMTP_PORT": "2525",
        "SMTP_USER": "test_user",
        "SMTP_PASSWORD": "test_password"
    })
    @patch("smtplib.SMTP")
    @pytest.mark.asyncio
    async def test_send_email_uses_environment_variables(self, mock_smtp):
        """Test email sending uses SMTP configuration from environment."""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        result = await send_email(
            email="user@example.com",
            subject="Test",
            body="Body"
        )
        
        assert result is True
        mock_smtp.assert_called_once_with("smtp.mailtrap.io", 2525)
        mock_server.login.assert_called_once_with("test_user", "test_password")
    
    @patch.dict("os.environ", {
        "SMTP_HOST": "smtp.mailtrap.io",
        "SMTP_PORT": "2525",
        "SMTP_USER": "test_user",
        "SMTP_PASSWORD": "test_password",
        "SENDER_EMAIL": "custom@mockme.com"
    })
    @patch("smtplib.SMTP")
    @pytest.mark.asyncio
    async def test_send_email_uses_custom_sender(self, mock_smtp):
        """Test email sending uses custom SENDER_EMAIL from environment."""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server
        
        result = await send_email(
            email="user@example.com",
            subject="Test",
            body="Body"
        )
        
        assert result is True
        # Extract the sender email from the sendmail call
        call_args = mock_server.sendmail.call_args
        assert call_args[0][0] == "custom@mockme.com"  # sender_email


class TestSendEmailNotification:
    """Tests for the send_email_notification function."""
    
    @patch("app.services.email_service.send_email")
    @pytest.mark.asyncio
    async def test_send_notification_extracts_email_priority(self, mock_send):
        """Test email extraction priority: email > google_account_email > dropbox_account_email."""
        mock_send.return_value = True
        
        # Test priority: email field first
        user = {
            "user_id": "user1",
            "credits": 100,
            "email": "primary@example.com",
            "google_account_email": "google@example.com",
            "dropbox_account_email": "dropbox@example.com"
        }
        
        result = await send_email_notification(user, 50)
        
        assert result is True
        mock_send.assert_called_once()
        assert "primary@example.com" in str(mock_send.call_args)
    
    @patch("app.services.email_service.send_email")
    @pytest.mark.asyncio
    async def test_send_notification_uses_google_when_no_email(self, mock_send):
        """Test falls back to google_account_email when email field missing."""
        mock_send.return_value = True
        
        user = {
            "user_id": "user1",
            "credits": 100,
            "google_account_email": "google@example.com",
            "dropbox_account_email": "dropbox@example.com"
        }
        
        result = await send_email_notification(user, 50)
        
        assert result is True
        assert "google@example.com" in str(mock_send.call_args)
    
    @patch("app.services.email_service.send_email")
    @pytest.mark.asyncio
    async def test_send_notification_uses_dropbox_when_others_missing(self, mock_send):
        """Test falls back to dropbox_account_email when others missing."""
        mock_send.return_value = True
        
        user = {
            "user_id": "user1",
            "credits": 100,
            "dropbox_account_email": "dropbox@example.com"
        }
        
        result = await send_email_notification(user, 50)
        
        assert result is True
        assert "dropbox@example.com" in str(mock_send.call_args)
    
    @patch("app.services.email_service.send_email")
    @pytest.mark.asyncio
    async def test_send_notification_no_email_found(self, mock_send, caplog):
        """Test handles missing email gracefully and logs warning."""
        user = {
            "user_id": "user1",
            "credits": 100
        }
        
        with caplog.at_level(logging.WARNING):
            result = await send_email_notification(user, 50)
        
        assert result is False
        assert "No email found" in caplog.text
        mock_send.assert_not_called()
    
    @patch("app.services.email_service.send_email")
    @pytest.mark.asyncio
    async def test_send_notification_includes_bonus_amount_in_subject(self, mock_send):
        """Test email subject includes bonus amount."""
        mock_send.return_value = True
        
        user = {
            "user_id": "user1",
            "credits": 100,
            "email": "user@example.com"
        }
        
        result = await send_email_notification(user, 75)
        
        assert result is True
        call_kwargs = mock_send.call_args
        assert "75" in call_kwargs[0][1]  # subject contains bonus amount
    
    @patch("app.services.email_service.send_email")
    @pytest.mark.asyncio
    async def test_send_notification_includes_new_balance_in_body(self, mock_send):
        """Test email body includes new credit balance."""
        mock_send.return_value = True
        
        user = {
            "user_id": "user1",
            "credits": 100,
            "email": "user@example.com"
        }
        
        result = await send_email_notification(user, 50)
        
        assert result is True
        call_kwargs = mock_send.call_args
        body = call_kwargs[0][2]
        assert "150" in body  # new balance (100 + 50)
    
    @patch("app.services.email_service.send_email")
    @pytest.mark.asyncio
    async def test_send_notification_handles_send_failure(self, mock_send, caplog):
        """Test handles email sending failure gracefully."""
        mock_send.return_value = False
        
        user = {
            "user_id": "user1",
            "credits": 100,
            "email": "user@example.com"
        }
        
        with caplog.at_level(logging.ERROR):
            result = await send_email_notification(user, 50)
        
        assert result is False
        assert "Failed to send email notification" in caplog.text
    
    @patch("app.services.email_service.send_email")
    @pytest.mark.asyncio
    async def test_send_notification_calculates_correct_balance(self, mock_send):
        """Test calculates new balance correctly."""
        mock_send.return_value = True
        
        # Test with different initial balances
        test_cases = [
            (0, 100, 100),
            (50, 25, 75),
            (1000, 100, 1100),
        ]
        
        for initial, bonus, expected_balance in test_cases:
            mock_send.reset_mock()
            
            user = {
                "user_id": "user1",
                "credits": initial,
                "email": "user@example.com"
            }
            
            result = await send_email_notification(user, bonus)
            
            assert result is True
            body = mock_send.call_args[0][2]
            assert str(expected_balance) in body


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
