import os
from fastapi import APIRouter, HTTPException
import dropbox
from datetime import datetime, timedelta, timezone
from app.services.database import get_user, update_user_dropbox

router = APIRouter(prefix="/api/dropbox", tags=["dropbox_auth"])

DROPBOX_APP_KEY = os.getenv("DROPBOX_APP_KEY", "")
DROPBOX_APP_SECRET = os.getenv("DROPBOX_APP_SECRET", "")
REDIRECT_URI = os.getenv("DROPBOX_REDIRECT_URI", "http://localhost:3000/dropbox/callback")
CSRF_TOKEN_KEY = "dropbox-auth-csrf-token"

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
            token_access_type='offline'
        )
        flow.code_verifier = code_verifier
        
        # Finish expects a dict-like object for the query params
        res = flow.finish({"code": code, "state": state})
        
        # Get account info to use email as user_id
        dbx = dropbox.Dropbox(res.access_token)
        account = dbx.users_get_current_account()
        user_email = account.email
        
        # Safely get expiry if it exists
        expires_in = getattr(res, 'expires_in', None)
        expiry_delta = datetime.now(timezone.utc) + timedelta(seconds=expires_in) if expires_in else None
        
        await update_user_dropbox(user_email, {
            "dropbox_access_token": res.access_token,
            "dropbox_refresh_token": getattr(res, 'refresh_token', None),
            "dropbox_token_expiry": expiry_delta,
            "dropbox_account_email": user_email 
        })
        
        return {"success": True, "user_id": user_email}
    except Exception as e:
        print(f"Dropbox Callback Error: {e}")
        raise HTTPException(status_code=400, detail=f"OAuth Handshake Failure: {str(e)}")

@router.get("/status")
async def get_dropbox_status(user_id: str):
    user = await get_user(user_id)
    if not user or not user.get("dropbox_refresh_token"):
        return {"connected": False}
    return {"connected": True, "email": user.get("dropbox_account_email")}

@router.post("/disconnect")
async def disconnect_dropbox(user_id: str):
    await update_user_dropbox(user_id, {
        "dropbox_access_token": None,
        "dropbox_refresh_token": None,
        "dropbox_token_expiry": None,
        "dropbox_account_email": None
    })
    return {"success": True}
