"""
Tests for Festival Bonus Scheduler endpoint.

Tests API key validation, bonus distribution, email notifications, and error handling.
"""

import pytest
import os
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.models.festival_bonus import FestivalBonusRequest, FestivalBonusResponse


client = TestClient(app)


class TestCheckAPIKey:
    """Tests for API key validation."""
    
    def test_missing_api_key(self):
        """Test endpoint rejects request without x-api-key header."""
        response = client.post(
            "/api/cron/festival-bonus",
            json={"bonus_amount": 100}
        )
        
        assert response.status_code == 401
        assert "Unauthorized" in response.json()["detail"]
    
    def test_invalid_api_key(self):
        """Test endpoint rejects request with invalid x-api-key."""
        response = client.post(
            "/api/cron/festival-bonus",
            json={"bonus_amount": 100},
            headers={"x-api-key": "wrong-key"}
        )
        
        assert response.status_code == 401
        assert "Unauthorized" in response.json()["detail"]
    
    def test_valid_api_key(self):
        """Test endpoint accepts valid x-api-key header."""
        valid_key = os.getenv("CRON_FESTIVAL_API_KEY", "test-festival-api-key-12345")
        
        # This will fail on database query, but proves key was accepted
        response = client.post(
            "/api/cron/festival-bonus",
            json={"bonus_amount": 100},
            headers={"x-api-key": valid_key}
        )
        
        # Should not get 401 for API key (might be 500 from db, but API key was accepted)
        assert response.status_code != 401


class TestBonusAmountValidation:
    """Tests for bonus_amount payload validation."""
    
    def setup_method(self):
        """Set up valid API key for each test."""
        self.valid_key = os.getenv("CRON_FESTIVAL_API_KEY", "test-festival-api-key-12345")
        self.headers = {"x-api-key": self.valid_key}
    
    def test_missing_bonus_amount(self):
        """Test endpoint returns 422 when bonus_amount is missing."""
        response = client.post(
            "/api/cron/festival-bonus",
            json={},
            headers=self.headers
        )
        
        assert response.status_code == 422  # Pydantic validation error
    
    def test_zero_bonus_amount(self):
        """Test endpoint returns 422 when bonus_amount is zero."""
        response = client.post(
            "/api/cron/festival-bonus",
            json={"bonus_amount": 0},
            headers=self.headers
        )
        
        # Pydantic validates the > 0 constraint
        assert response.status_code == 422
    
    def test_negative_bonus_amount(self):
        """Test endpoint returns 422 when bonus_amount is negative."""
        response = client.post(
            "/api/cron/festival-bonus",
            json={"bonus_amount": -50},
            headers=self.headers
        )
        
        # Pydantic validates the > 0 constraint
        assert response.status_code == 422
    
    def test_valid_positive_bonus_amount(self):
        """Test endpoint accepts positive integer bonus_amount."""
        valid_key = os.getenv("CRON_FESTIVAL_API_KEY", "test-festival-api-key-12345")
        
        # This will pass validation and potentially process
        response = client.post(
            "/api/cron/festival-bonus",
            json={"bonus_amount": 100},
            headers={"x-api-key": valid_key}
        )
        
        # Should not get validation error (might be 500 from db query, but validation passed)
        assert response.status_code != 422


class TestResponseModel:
    """Tests for response model structure."""
    
    def test_valid_response_model(self):
        """Test FestivalBonusRequest and FestivalBonusResponse models are valid."""
        # Test request model
        request = FestivalBonusRequest(bonus_amount=100)
        assert request.bonus_amount == 100
        
        # Test response model
        response = FestivalBonusResponse(
            success=True,
            users_awarded=5,
            total_credits_distributed=500,
            emails_sent=5,
            message="Festival bonus distributed successfully"
        )
        assert response.success is True
        assert response.users_awarded == 5
        assert response.total_credits_distributed == 500
        assert response.emails_sent == 5
        assert response.message == "Festival bonus distributed successfully"
    
    def test_request_model_validation_positive(self):
        """Test FestivalBonusRequest validates positive integer."""
        with pytest.raises(ValueError):
            FestivalBonusRequest(bonus_amount=0)
    
    def test_request_model_validation_negative(self):
        """Test FestivalBonusRequest validates rejects negative."""
        with pytest.raises(ValueError):
            FestivalBonusRequest(bonus_amount=-10)


class TestEndpointStructure:
    """Tests for endpoint structure and requirements alignment."""
    
    def test_endpoint_path(self):
        """Test endpoint path is /api/cron/festival-bonus."""
        valid_key = os.getenv("CRON_FESTIVAL_API_KEY", "test-festival-api-key-12345")
        
        # Try the correct path
        response = client.post(
            "/api/cron/festival-bonus",
            json={"bonus_amount": 50},
            headers={"x-api-key": valid_key}
        )
        
        # Should not get 404
        assert response.status_code != 404
    
    def test_endpoint_method_is_post(self):
        """Test endpoint only accepts POST method."""
        valid_key = os.getenv("CRON_FESTIVAL_API_KEY", "test-festival-api-key-12345")
        
        # Try GET method
        response = client.get(
            "/api/cron/festival-bonus",
            headers={"x-api-key": valid_key}
        )
        
        # Should not accept GET
        assert response.status_code in [405, 404]  # Method not allowed or not found
    
    def test_requires_api_key_header(self):
        """Test endpoint requires x-api-key header."""
        # Send without header
        response = client.post(
            "/api/cron/festival-bonus",
            json={"bonus_amount": 50}
        )
        
        # Should return 401
        assert response.status_code == 401
    
    def test_accepts_json_payload(self):
        """Test endpoint accepts JSON payload."""
        valid_key = os.getenv("CRON_FESTIVAL_API_KEY", "test-festival-api-key-12345")
        
        # Send JSON payload
        response = client.post(
            "/api/cron/festival-bonus",
            json={"bonus_amount": 50},
            headers={"x-api-key": valid_key}
        )
        
        # Should not get parsing error
        assert response.status_code != 422  # Not unprocessable entity


if __name__ == "__main__":
    pytest.main([__file__, "-v"])


class TestBonusAwardLogic:
    """Tests for bonus award distribution logic.
    
    Validates Requirements 3.1, 3.2, 3.3, 3.4, 3.5
    """
    
    @pytest.mark.asyncio
    async def test_award_bonus_to_three_users(self):
        """Test bonus awarded to 3 active users with mocked database and services."""
        valid_key = os.getenv("CRON_FESTIVAL_API_KEY", "test-festival-api-key-12345")
        
        # Create 3 mock active users
        mock_users = [
            {
                "user_id": "user1",
                "email": "user1@example.com",
                "credits": 10,
                "status": "Active"
            },
            {
                "user_id": "user2",
                "email": "user2@example.com",
                "credits": 20,
                "status": "Active"
            },
            {
                "user_id": "user3",
                "email": "user3@example.com",
                "credits": 30,
                "status": "Active"
            }
        ]
        
        bonus_amount = 50
        
        with patch("app.routers.festival_bonus.db") as mock_db, \
             patch("app.routers.festival_bonus.CreditService.add_credits", new_callable=AsyncMock) as mock_add_credits, \
             patch("app.routers.festival_bonus.send_email_notification", new_callable=AsyncMock) as mock_send_email:
            
            # Mock database find() to return our test users
            mock_cursor = AsyncMock()
            mock_cursor.to_list = AsyncMock(return_value=mock_users)
            mock_db.users.find.return_value = mock_cursor
            
            # Mock find_one for updated balance lookups
            mock_db.users.find_one = AsyncMock(side_effect=mock_users)
            
            # Mock CreditService to return new balance
            mock_add_credits.side_effect = [
                60,  # user1: 10 + 50
                70,  # user2: 20 + 50
                80   # user3: 30 + 50
            ]
            
            # Mock email sending to return True (success)
            mock_send_email.return_value = True
            
            # Make the request
            response = client.post(
                "/api/cron/festival-bonus",
                json={"bonus_amount": bonus_amount},
                headers={"x-api-key": valid_key}
            )
            
            # Verify response
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            assert data["users_awarded"] == 3
            assert data["total_credits_distributed"] == 150  # 50 * 3
            assert data["emails_sent"] == 3
            
            # Verify CreditService.add_credits was called 3 times with correct parameters
            assert mock_add_credits.call_count == 3
            for i, call in enumerate(mock_add_credits.call_args_list):
                assert call.kwargs["user_id"] == f"user{i+1}"
                assert call.kwargs["amount"] == bonus_amount
                assert call.kwargs["credit_type"] == "FESTIVAL_BONUS"
            
            # Verify send_email_notification was called 3 times
            assert mock_send_email.call_count == 3
    
    @pytest.mark.asyncio
    async def test_award_bonus_with_correct_parameters(self):
        """Test CreditService.add_credits is called with correct parameters."""
        valid_key = os.getenv("CRON_FESTIVAL_API_KEY", "test-festival-api-key-12345")
        
        mock_users = [
            {
                "user_id": "test_user",
                "email": "test@example.com",
                "credits": 100,
                "status": "Active"
            }
        ]
        
        bonus_amount = 75
        
        with patch("app.routers.festival_bonus.db") as mock_db, \
             patch("app.routers.festival_bonus.CreditService.add_credits", new_callable=AsyncMock) as mock_add_credits, \
             patch("app.routers.festival_bonus.send_email_notification", new_callable=AsyncMock) as mock_send_email:
            
            # Mock database
            mock_cursor = AsyncMock()
            mock_cursor.to_list = AsyncMock(return_value=mock_users)
            mock_db.users.find.return_value = mock_cursor
            mock_db.users.find_one = AsyncMock(return_value=mock_users[0])
            
            # Mock services
            mock_add_credits.return_value = 175  # 100 + 75
            mock_send_email.return_value = True
            
            # Make request
            response = client.post(
                "/api/cron/festival-bonus",
                json={"bonus_amount": bonus_amount},
                headers={"x-api-key": valid_key}
            )
            
            # Verify parameters
            assert response.status_code == 200
            mock_add_credits.assert_called_once_with(
                user_id="test_user",
                amount=bonus_amount,
                credit_type="FESTIVAL_BONUS",
                reference_id="festival_bonus"
            )
    
    @pytest.mark.asyncio
    async def test_response_includes_correct_counts(self):
        """Test response includes correct user count and total credits distributed."""
        valid_key = os.getenv("CRON_FESTIVAL_API_KEY", "test-festival-api-key-12345")
        
        mock_users = [
            {"user_id": f"user{i}", "email": f"user{i}@example.com", "credits": i*10, "status": "Active"}
            for i in range(1, 6)  # 5 users
        ]
        
        bonus_amount = 100
        
        with patch("app.routers.festival_bonus.db") as mock_db, \
             patch("app.routers.festival_bonus.CreditService.add_credits", new_callable=AsyncMock) as mock_add_credits, \
             patch("app.routers.festival_bonus.send_email_notification", new_callable=AsyncMock) as mock_send_email:
            
            # Mock database
            mock_cursor = AsyncMock()
            mock_cursor.to_list = AsyncMock(return_value=mock_users)
            mock_db.users.find.return_value = mock_cursor
            mock_db.users.find_one = AsyncMock(side_effect=mock_users)
            
            # Mock services
            mock_add_credits.return_value = 100
            mock_send_email.return_value = True
            
            # Make request
            response = client.post(
                "/api/cron/festival-bonus",
                json={"bonus_amount": bonus_amount},
                headers={"x-api-key": valid_key}
            )
            
            # Verify response counts
            assert response.status_code == 200
            data = response.json()
            assert data["users_awarded"] == 5
            assert data["total_credits_distributed"] == 500  # 100 * 5
            assert data["emails_sent"] == 5
    
    @pytest.mark.asyncio
    async def test_error_handling_one_user_fails(self):
        """Test error handling: one user fails, verify error is logged and processing continues.
        
        Validates Requirement 3.4 and 3.5
        """
        valid_key = os.getenv("CRON_FESTIVAL_API_KEY", "test-festival-api-key-12345")
        
        mock_users = [
            {"user_id": "user1", "email": "user1@example.com", "credits": 10, "status": "Active"},
            {"user_id": "user2", "email": "user2@example.com", "credits": 20, "status": "Active"},
            {"user_id": "user3", "email": "user3@example.com", "credits": 30, "status": "Active"}
        ]
        
        bonus_amount = 50
        
        with patch("app.routers.festival_bonus.db") as mock_db, \
             patch("app.routers.festival_bonus.CreditService.add_credits", new_callable=AsyncMock) as mock_add_credits, \
             patch("app.routers.festival_bonus.send_email_notification", new_callable=AsyncMock) as mock_send_email, \
             patch("app.routers.festival_bonus.logger") as mock_logger:
            
            # Mock database
            mock_cursor = AsyncMock()
            mock_cursor.to_list = AsyncMock(return_value=mock_users)
            mock_db.users.find.return_value = mock_cursor
            mock_db.users.find_one = AsyncMock(side_effect=mock_users)
            
            # Mock CreditService: user2 fails
            def add_credits_side_effect(**kwargs):
                if kwargs["user_id"] == "user2":
                    raise Exception("Database error for user2")
                return 60 if kwargs["user_id"] == "user1" else 80
            
            mock_add_credits.side_effect = add_credits_side_effect
            
            # Mock email sending
            mock_send_email.return_value = True
            
            # Make request
            response = client.post(
                "/api/cron/festival-bonus",
                json={"bonus_amount": bonus_amount},
                headers={"x-api-key": valid_key}
            )
            
            # Verify endpoint continues processing despite error
            assert response.status_code == 200
            data = response.json()
            assert data["success"] is True
            
            # Only user1 and user3 were awarded (user2 failed)
            assert data["users_awarded"] == 2
            assert data["total_credits_distributed"] == 100  # 50 * 2
            
            # Verify CreditService was called 3 times (all 3 users attempted)
            assert mock_add_credits.call_count == 3
            
            # Verify error was logged
            mock_logger.error.assert_called()
    
    @pytest.mark.asyncio
    async def test_email_notification_called_for_each_user(self):
        """Test send_email_notification is called for each user.
        
        Validates Requirement 4.1 and 4.2
        """
        valid_key = os.getenv("CRON_FESTIVAL_API_KEY", "test-festival-api-key-12345")
        
        mock_users = [
            {"user_id": "user1", "email": "user1@example.com", "credits": 10, "status": "Active"},
            {"user_id": "user2", "google_account_email": "user2@gmail.com", "credits": 20, "status": "Active"},
            {"user_id": "user3", "dropbox_account_email": "user3@dropbox.com", "credits": 30, "status": "Active"}
        ]
        
        bonus_amount = 50
        
        with patch("app.routers.festival_bonus.db") as mock_db, \
             patch("app.routers.festival_bonus.CreditService.add_credits", new_callable=AsyncMock) as mock_add_credits, \
             patch("app.routers.festival_bonus.send_email_notification", new_callable=AsyncMock) as mock_send_email:
            
            # Mock database
            mock_cursor = AsyncMock()
            mock_cursor.to_list = AsyncMock(return_value=mock_users)
            mock_db.users.find.return_value = mock_cursor
            mock_db.users.find_one = AsyncMock(side_effect=mock_users)
            
            # Mock services
            mock_add_credits.return_value = 60
            mock_send_email.return_value = True
            
            # Make request
            response = client.post(
                "/api/cron/festival-bonus",
                json={"bonus_amount": bonus_amount},
                headers={"x-api-key": valid_key}
            )
            
            # Verify send_email_notification was called 3 times with each user
            assert response.status_code == 200
            assert mock_send_email.call_count == 3
            
            # Verify each call received the user document and bonus amount
            for i, call in enumerate(mock_send_email.call_args_list):
                user_arg = call[0][0]
                bonus_arg = call[0][1]
                assert user_arg["user_id"] == f"user{i+1}"
                assert bonus_arg == bonus_amount
