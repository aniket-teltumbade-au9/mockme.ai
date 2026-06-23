import os
import dropbox
import dropbox.exceptions
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from datetime import datetime, timedelta, timezone

from app.services.database import get_user, update_user_dropbox

security = HTTPBearer(auto_error=False)

DROPBOX_APP_KEY = os.getenv("DROPBOX_APP_KEY", "")
DROPBOX_APP_SECRET = os.getenv("DROPBOX_APP_SECRET", "")


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
        raise HTTPException(status_code=401, detail="Dropbox bearer token required")

    token = credentials.credentials
    try:
        account = dropbox.Dropbox(token).users_get_current_account()
    except dropbox.exceptions.AuthError as e:
        # Try to get user and refresh their token if available
        print(f"Access token invalid: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired Dropbox token") from e
    except Exception as e:
        raise HTTPException(status_code=401, detail="Could not validate Dropbox token") from e

    user = await get_user(account.email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    user["dropbox_account_email"] = account.email
    user["dropbox_display_name"] = account.name.display_name
    return user
