"""
One-time script to grant Admin privileges to a user in Firebase.

Usage:
  1. Make sure firebase-service-account.json is in the backend folder.
  2. Activate your virtualenv: ..\venv\Scripts\Activate.ps1
  3. Run: python set_admin.py
  4. Sign out and sign back in on the frontend for the claim to take effect.
"""

import firebase_admin
from firebase_admin import credentials, auth

# ─── CONFIG ────────────────────────────────────────────────────────────────
# Replace this with the email you used to register your admin account
ADMIN_EMAIL = "kamal.bharadwj@gmail.com"
# ───────────────────────────────────────────────────────────────────────────

def set_admin_claim():
    # Initialize Firebase Admin
    if not firebase_admin._apps:
        cred = credentials.Certificate("./firebase-service-account.json")
        firebase_admin.initialize_app(cred)

    try:
        user = auth.get_user_by_email(ADMIN_EMAIL)
    except auth.UserNotFoundError:
        print(f"❌ No user found with email: {ADMIN_EMAIL}")
        print("   Make sure you have registered/signed in on the frontend first.")
        return

    # Set the admin custom claim
    auth.set_custom_user_claims(user.uid, {"admin": True})
    print(f"✅ Admin claim granted to: {user.email}")
    print(f"   UID: {user.uid}")
    print()
    print("👉 Next step: Sign out and sign back in on the frontend.")
    print("   The Admin Panel link will appear in the sidebar.")

if __name__ == "__main__":
    set_admin_claim()
