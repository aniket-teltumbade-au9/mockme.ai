import os
import dropbox
import dropbox.exceptions
import requests
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from datetime import datetime, timedelta, timezone
import json
import base64

from app.services.database import get_user, update_user_dropbox, update_user_google

security = HTTPBearer(auto_error=False)

DROPBOX_APP_KEY = os.getenv("DROPBOX_APP_KEY", "")
DROPBOX_APP_SECRET = os.getenv("DROPBOX_APP_SECRET", "")


def _decode_id_token(id_token: str | None) -> dict:
    """Decode JWT token from Google/Dropbox OAuth."""
    if not id_token:
        return {}
    try:
        payload = id_token.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        return json.loads(base64.urlsafe_b64decode(payload).decode("utf-8"))
    except Exception:
        return {}


async def _validate_dropbox_token(token: str) -> tuple[dict, str]:
    """Validate Dropbox token and return (user_dict, email)."""
    try:
        account = dropbox.Dropbox(token).users_get_current_account()
        user = await get_user(account.email)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user["dropbox_account_email"] = account.email
        user["dropbox_display_name"] = account.name.display_name
        return user, account.email
    except dropbox.exceptions.AuthError as e:
        raise HTTPException(status_code=401, detail="Invalid or expired Dropbox token") from e
    except Exception as e:
        raise HTTPException(status_code=401, detail="Could not validate Dropbox token") from e


async def _validate_google_token(token: str) -> tuple[dict, str]:
    """Validate Google token and return (user_dict, email)."""
    try:
        # Verify the Google token
        user_info_res = requests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if user_info_res.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        
        user_info = user_info_res.json()
        user_email = user_info.get("email")
        
        if not user_email:
            raise HTTPException(status_code=401, detail="Could not get email from Google token")
        
        user = await get_user(user_email)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        user["google_account_email"] = user_email
        user["google_display_name"] = user_info.get("name")
        return user, user_email
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Could not validate Google token") from e


async def _refresh_access_token(user_email: str, refresh_token: str) -> str | None:
    """
    Use Dropbox refresh token to get a new access token.
    Updates the database with the new access token and expiry time.
    Returns the new access token, or None if refresh fails.
    """
    if not refresh_token or not DROPBOX_APP_KEY or not DROPBOX_APP_SECRET:
        return None
    
    try:
        # Use oauth2_refresh_token to get a fresh access token
        dbx = dropbox.Dropbox(
            oauth2_refresh_token=refresh_token,
            app_key=DROPBOX_APP_KEY,
            app_secret=DROPBOX_APP_SECRET,
        )
        
        # This call will refresh the token internally
        account = dbx.users_get_current_account()
        
        # Extract the new access token from the dbx instance
        # The Dropbox SDK automatically refreshes and stores it internally
        if hasattr(dbx, '_oauth2_access_token'):
            new_access_token = dbx._oauth2_access_token
            new_expiry = datetime.now(timezone.utc) + timedelta(hours=4)
            
            # Update the database
            await update_user_dropbox(user_email, {
                "dropbox_access_token": new_access_token,
                "dropbox_token_expiry": new_expiry,
            })
            
            return new_access_token
    except Exception as e:
        print(f"Token refresh failed: {e}")
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Bearer token required")

    token = credentials.credentials
    
    # Try Dropbox first
    try:
        user, email = await _validate_dropbox_token(token)
        return user
    except HTTPException as dropbox_error:
        pass
    
    # Then try Google
    try:
        user, email = await _validate_google_token(token)
        return user
    except HTTPException as google_error:
        pass
    
    # If both fail, return the Dropbox error
    raise HTTPException(status_code=401, detail="Invalid or expired token")
