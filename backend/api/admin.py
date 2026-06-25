from fastapi import APIRouter, Depends, HTTPException
from middleware.auth import require_admin
import firebase_admin
from firebase_admin import auth
import os

router = APIRouter()


@router.get("/patients")
async def list_patients(admin_user: dict = Depends(require_admin)):
    """
    Returns all registered Firebase users for the admin panel.
    """
    try:
        # Initialize Firebase app if not already done
        if not firebase_admin._apps:
            service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "./firebase-service-account.json")
            if os.path.exists(service_account_path):
                from firebase_admin import credentials
                cred = credentials.Certificate(service_account_path)
                firebase_admin.initialize_app(cred)

        patients = []
        # Paginate through all users
        page = auth.list_users()
        while page:
            for user in page.users:
                patients.append({
                    "uid": user.uid,
                    "email": user.email or "",
                    "displayName": user.display_name or "",
                    "photoURL": user.photo_url or "",
                    "creationTime": user.user_metadata.creation_timestamp and
                        __import__('datetime').datetime.fromtimestamp(
                            user.user_metadata.creation_timestamp / 1000
                        ).isoformat(),
                    "lastSignInTime": user.user_metadata.last_sign_in_timestamp and
                        __import__('datetime').datetime.fromtimestamp(
                            user.user_metadata.last_sign_in_timestamp / 1000
                        ).isoformat(),
                    "disabled": user.disabled,
                })
            page = page.get_next_page()

        return {"patients": patients, "total": len(patients)}

    except Exception as e:
        # If Firebase is not configured, return mock data for development
        mock_patients = [
            {
                "uid": "dev-user-001",
                "email": "john.doe@example.com",
                "displayName": "John Doe",
                "photoURL": "",
                "creationTime": "2026-06-01T10:00:00",
                "lastSignInTime": "2026-06-25T08:00:00",
                "disabled": False,
            },
            {
                "uid": "dev-user-002",
                "email": "jane.smith@example.com",
                "displayName": "Jane Smith",
                "photoURL": "",
                "creationTime": "2026-06-10T14:30:00",
                "lastSignInTime": "2026-06-24T16:00:00",
                "disabled": False,
            },
        ]
        return {"patients": mock_patients, "total": len(mock_patients), "note": "Dev mode — using mock data"}


@router.get("/patients/{uid}/documents")
async def get_patient_documents(uid: str, admin_user: dict = Depends(require_admin)):
    """
    Returns a summary of documents uploaded by a specific patient.
    """
    # In a full implementation, query ChromaDB for documents with metadata uid=uid
    return {
        "uid": uid,
        "documents": [],
        "message": "Document listing per patient coming in next release."
    }
