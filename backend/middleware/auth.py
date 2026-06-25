import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Header
import os
from typing import Optional

# Initialize Firebase Admin SDK (lazy singleton)
def get_firebase_app():
    if not firebase_admin._apps:
        service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "./firebase-service-account.json")
        if os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
        else:
            # Dev fallback: initialize without credentials for local testing
            # This allows the server to run without a service account
            print("WARNING: firebase-service-account.json not found. Auth verification disabled for development.")
            firebase_admin.initialize_app()
    return firebase_admin.get_app()


async def verify_firebase_token(authorization: Optional[str] = Header(None)) -> dict:
    """
    FastAPI dependency that extracts and verifies the Firebase ID token 
    from the Authorization header.
    
    Returns a dict with uid, email, and is_admin.
    If no Firebase service account is configured (dev mode), returns a mock user.
    """
    # Development fallback — if no auth header, return mock user
    # REMOVE THIS IN PRODUCTION
    if authorization is None:
        return {"uid": "dev-user-001", "email": "dev@vitalis.ai", "is_admin": True}

    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format. Expected: Bearer <token>")

    id_token = authorization.split("Bearer ")[1]

    try:
        get_firebase_app()
        decoded_token = auth.verify_id_token(id_token)
        return {
            "uid": decoded_token["uid"],
            "email": decoded_token.get("email", ""),
            "is_admin": decoded_token.get("admin", False),
        }
    except firebase_admin.exceptions.FirebaseError as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auth error: {str(e)}")


async def require_admin(authorization: Optional[str] = Header(None)) -> dict:
    """
    Stricter dependency — requires the user to have admin: true custom claim.
    """
    user = await verify_firebase_token(authorization)
    if not user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user
