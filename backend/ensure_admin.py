import sys
import os
import json

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

try:
    from database import SessionLocal
    from models import User, ALL_PERMISSIONS
    from auth import hash_password
except ImportError:
    # Try importing with package prefix if running from root
    try:
        from backend.database import SessionLocal
        from backend.models import User, ALL_PERMISSIONS
        from backend.auth import hash_password
    except ImportError:
         print("Could not import modules. Make sure you run this from the backend directory or with correct python path.")
         sys.exit(1)

def ensure_admin():
    db = SessionLocal()
    try:
        username = "verify_admin"
        password = "VerifyPass123!"
        
        user = db.query(User).filter(User.username == username).first()
        hashed = hash_password(password)
        
        if user:
            print(f"Updating existing user {username}...")
            user.hashed_password = hashed
            user.role = "admin"
            user.permissions = json.dumps(ALL_PERMISSIONS)
            user.is_active = 1
        else:
            print(f"Creating new user {username}...")
            user = User(
                username=username,
                email="verify_admin@example.com",
                hashed_password=hashed,
                role="admin",
                full_name="Verification Admin",
                is_active=1,
                permissions=json.dumps(ALL_PERMISSIONS)
            )
            db.add(user)
        
        db.commit()
        print(f"User {username} ready with password {password}")
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    ensure_admin()
