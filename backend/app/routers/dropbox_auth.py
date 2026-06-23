import os
import base64
import json
from fastapi import APIRouter, Depends, HTTPException
import dropbox
from datetime import datetime, timedelta, timezone
from app.services.database import get_user, update_user_dropbox
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/dropbox", tags=["dropbox_auth"])

DROPBOX_APP_KEY = os.getenv("DROPBOX_APP_KEY", "")
DROPBOX_APP_SECRET = os.getenv("DROPBOX_APP_SECRET", "")
REDIRECT_URI = os.getenv("DROPBOX_REDIRECT_URI", "http://localhost:7175/dropbox/callback")
CSRF_TOKEN_KEY = "dropbox-auth-csrf-token"
DROPBOX_SCOPES = [
    "openid",
    "profile",
    "email",
    "account_info.read",
    "files.content.write",
    "sharing.read",
    "sharing.write",
]

@router.get("/auth-url")
async def get_dropbox_auth_url(user_id: str | None = None):
    if not DROPBOX_APP_KEY or DROPBOX_APP_KEY == "your_app_key":
        raise HTTPException(status_code=500, detail="Dropbox App Key not configured")

    session: dict = {}
    # ... (rest of the function)
    flow = dropbox.DropboxOAuth2Flow(
        DROPBOX_APP_KEY,
        REDIRECT_URI,
        session,
        CSRF_TOKEN_KEY,
        use_pkce=True,
        token_access_type='offline',
        scope=DROPBOX_SCOPES,
    )
    auth_url = flow.start()

    # flow.start() writes the actual random CSRF token into session[CSRF_TOKEN_KEY]
    # We must return that exact value so the callback can reconstruct the flow
    actual_state = session[CSRF_TOKEN_KEY]

    return {
        "auth_url": auth_url,
        "code_verifier": flow.code_verifier,
        "state": actual_state,
    }

@router.get("/callback")
async def dropbox_callback(code: str, code_verifier: str, state: str):
    try:
        # Reconstruct the session with the state we received back
        session = {CSRF_TOKEN_KEY: state}
        
        flow = dropbox.DropboxOAuth2Flow(
            DROPBOX_APP_KEY, 
            REDIRECT_URI,
            session,
            CSRF_TOKEN_KEY,
            use_pkce=True, 
            token_access_type='offline',
            scope=DROPBOX_SCOPES,
        )
        flow.code_verifier = code_verifier
        
        # Finish expects a dict-like object for the query params
        res = flow.finish({"code": code, "state": state})
        
        identity_claims = _decode_id_token(getattr(res, "id_token", None))
        account = dropbox.Dropbox(res.access_token).users_get_current_account()
        user_email = identity_claims.get("email") or account.email
        
        # Safely get expiry if it exists
        expires_in = getattr(res, 'expires_in', None)
        expiry_delta = datetime.now(timezone.utc) + timedelta(seconds=expires_in) if expires_in else None
        
        await update_user_dropbox(user_email, {
            "dropbox_access_token": res.access_token,
            "dropbox_refresh_token": getattr(res, 'refresh_token', None),
            "dropbox_token_expiry": expiry_delta,
            "dropbox_account_email": user_email,
            "dropbox_subject": identity_claims.get("sub"),
            "dropbox_display_name": identity_claims.get("name") or account.name.display_name,
            "dropbox_email_verified": identity_claims.get("email_verified"),
            "dropbox_scope": getattr(res, 'scope', None),
        })
        
        return {
            "success": True,
            "user_id": user_email,
            "access_token": res.access_token,
            "token_expiry": expiry_delta,
            "scopes": getattr(res, "scope", None),
            "profile": {
                "email": user_email,
                "name": identity_claims.get("name") or account.name.display_name,
                "email_verified": identity_claims.get("email_verified"),
            },
        }
    except Exception as e:
        print(f"Dropbox Callback Error: {e}")
        raise HTTPException(status_code=400, detail=f"OAuth Handshake Failure: {str(e)}")

@router.get("/status")
async def get_dropbox_status(current_user: dict = Depends(get_current_user)):
    user = await get_user(current_user["user_id"])
    if not user or not user.get("dropbox_refresh_token"):
        return {"connected": False}
    return {
        "connected": True,
        "email": user.get("dropbox_account_email"),
        "name": user.get("dropbox_display_name"),
        "scopes": user.get("dropbox_scope"),
    }

@router.post("/refresh-token")
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """
    Refresh the Dropbox access token using the refresh token.
    This endpoint should be called when the frontend receives a 401 error.
    """
    user_email = current_user.get("user_id")
    refresh_token = current_user.get("dropbox_refresh_token")
    
    if not refresh_token:
        raise HTTPException(status_code=400, detail="No refresh token available")
    
    try:
        # Use the refresh token to get a new access token
        dbx = dropbox.Dropbox(
            oauth2_refresh_token=refresh_token,
            app_key=os.getenv("DROPBOX_APP_KEY"),
            app_secret=os.getenv("DROPBOX_APP_SECRET"),
        )
        
        # Make a call to trigger the refresh
        account = dbx.users_get_current_account()
        
        # Get the new access token from the SDK
        new_access_token = getattr(dbx, '_oauth2_access_token', None)
        
        if new_access_token:
            new_expiry = datetime.now(timezone.utc) + timedelta(hours=4)
            
            # Update the database with the new token
            await update_user_dropbox(user_email, {
                "dropbox_access_token": new_access_token,
                "dropbox_token_expiry": new_expiry,
            })
            
            return {
                "success": True,
                "access_token": new_access_token,
                "token_expiry": new_expiry,
            }
        else:
            raise HTTPException(status_code=500, detail="Could not extract new access token")
            
    except dropbox.exceptions.AuthError as e:
        raise HTTPException(status_code=401, detail=f"Failed to refresh token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token refresh failed: {str(e)}")

@router.post("/disconnect")
async def disconnect_dropbox(current_user: dict = Depends(get_current_user)):
    await update_user_dropbox(current_user["user_id"], {
        "dropbox_access_token": None,
        "dropbox_refresh_token": None,
        "dropbox_token_expiry": None,
        "dropbox_account_email": None,
        "dropbox_scope": None,
        "dropbox_subject": None,
        "dropbox_display_name": None,
        "dropbox_email_verified": None,
    })
    return {"success": True}


def _decode_id_token(id_token: str | None) -> dict:
    if not id_token:
        return {}
    try:
        payload = id_token.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        return json.loads(base64.urlsafe_b64decode(payload).decode("utf-8"))
    except Exception:
        return {}
