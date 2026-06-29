import os
import json
import requests
from fastapi import APIRouter, Depends, HTTPException
from google_auth_oauthlib.flow import Flow
from datetime import datetime, timedelta, timezone
from app.services.database import get_user, update_user_google
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/google", tags=["google_auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:7175/google/callback")
GOOGLE_SCOPES = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/drive.file",
]

@router.get("/auth-url")
async def get_google_auth_url():
    if not GOOGLE_CLIENT_ID or GOOGLE_CLIENT_ID == "your_client_id":
        raise HTTPException(status_code=500, detail="Google Client ID not configured")

    # Explicitly structure config to mimic the client_secret.json format
    client_config = {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [REDIRECT_URI],
        }
    }

    flow = Flow.from_client_config(
        client_config,
        scopes=GOOGLE_SCOPES,
        redirect_uri=REDIRECT_URI
    )
    
    auth_url, state = flow.authorization_url(
        prompt='consent', 
        access_type='offline', 
        include_granted_scopes='true'
    )
    
    return {
        "auth_url": auth_url,
        "state": state,
        "code_verifier": flow.code_verifier
    }

@router.get("/callback")
async def google_callback(code: str, state: str, code_verifier: str):
    try:
        client_config = {
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [REDIRECT_URI],
            }
        }
        flow = Flow.from_client_config(
            client_config,
            scopes=GOOGLE_SCOPES,
            redirect_uri=REDIRECT_URI
        )
        flow.code_verifier = code_verifier
        
        # Fix for 'Scope has changed' error: 
        # Clearing the requested scopes prevents the library from performing a strict 
        # comparison between requested and returned scopes, which often fail due to re-ordering.
        flow._scopes = [] 
        flow.fetch_token(code=code)
        
        creds = flow.credentials
        
        # Manually fetch user info using the access token
        user_info_res = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {creds.token}"}
        )
        if user_info_res.status_code != 200:
            raise HTTPException(status_code=user_info_res.status_code, detail="Failed to fetch user info from Google")
        
        user_info = user_info_res.json()
        user_email = user_info.get("email")
        
        expires_in = creds.expiry
        expiry_delta = expires_in if expires_in else None
        
        await update_user_google(user_email, {
            "google_access_token": creds.token,
            "google_refresh_token": creds.refresh_token,
            "google_token_expiry": expiry_delta,
            "google_account_email": user_email,
            "google_display_name": user_info.get("name"),
        })
        
        # Fetch the user from database to get their Dropbox token (if they have one)
        # If user doesn't exist, update_user_google will create them
        user = await get_user(user_email)
        dropbox_access_token = user.get("dropbox_access_token", "") if user else ""
        
        # Return the Google token if no Dropbox token, otherwise prefer Dropbox for consistency
        access_token_to_return = dropbox_access_token or creds.token
        
        return {
            "success": True,
            "user_id": user_email,
            "profile": user_info,
            "access_token": access_token_to_return,
        }
    except Exception as e:
        print(f"Google Callback Error: {e}")
        raise HTTPException(status_code=400, detail=f"OAuth Handshake Failure: {str(e)}")

@router.get("/status")
async def get_google_status(current_user: dict = Depends(get_current_user)):
    user = await get_user(current_user["user_id"])
    if not user or not user.get("google_refresh_token"):
        return {"connected": False}
    return {
        "connected": True,
        "email": user.get("google_account_email"),
        "name": user.get("google_display_name"),
    }

@router.post("/disconnect")
async def disconnect_google(current_user: dict = Depends(get_current_user)):
    await update_user_google(current_user["user_id"], {
        "google_access_token": None,
        "google_refresh_token": None,
        "google_token_expiry": None,
        "google_account_email": None,
        "google_display_name": None,
    })
    return {"success": True}
