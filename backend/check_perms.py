"""Quick script to check and fix user permissions."""
import json
from database import SessionLocal
from models import User

db = SessionLocal()
users = db.query(User).all()

for u in users:
    perms = json.loads(u.permissions) if u.permissions else {}
    admin_flag = perms.get("can_access_admin", "NOT SET")
    print(f"  {u.username} (role={u.role}): can_access_admin={admin_flag}")

    # Fix: only admin role should have can_access_admin
    if u.role != "admin" and perms.get("can_access_admin"):
        perms["can_access_admin"] = False
        u.permissions = json.dumps(perms)
        print(f"    -> FIXED: revoked can_access_admin from {u.username}")

db.commit()
db.close()
print("\nDone.")
