import dropbox
import dropbox.exceptions
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.database import get_user

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Dropbox bearer token required")

    token = credentials.credentials
    try:
        account = dropbox.Dropbox(token).users_get_current_account()
    except dropbox.exceptions.AuthError as e:
        raise HTTPException(status_code=401, detail="Invalid or expired Dropbox token") from e
    except Exception as e:
        raise HTTPException(status_code=401, detail="Could not validate Dropbox token") from e

    user = await get_user(account.email)
    user["dropbox_account_email"] = account.email
    user["dropbox_display_name"] = account.name.display_name
    return user
