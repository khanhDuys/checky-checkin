from fastapi import HTTPException
from firebase_admin import auth
from database import db
import pyotp
import re
def verifyStudent(token: str):
    try:
        #verify
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        match = re.search(r"student(\d{6})@ptnk\.edu\.vn", email)        
        if not match:            
            print(f"LOGIN DENIED: STUDENT EMAIL BAD FORMAT {email}")
            raise HTTPException(
                status_code=403, 
                detail="ACCESS DENIED. EMAIL BAD FORMAT"
            )
        student_id = match.group(1)
        student_query = db.collection("students").document(student_id).get()
        student_doc = student_query.to_dict()
        db_name = student_doc.get("Họ tên", "name")
        db_class = student_doc.get("Lớp", "class")
        print(f"Student logged in successfully: {email} ({db_name})")
        return {
            "uid": uid,
            "email": email,
            "name": db_name,
            "class": db_class,
            "subject": student_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token or authentication error: {str(e)}")
    
def verify_totp(seed: str, totp: str) -> bool:
    return pyotp.TOTP(seed, digits=6, interval=15, digest="SHA1").verify(totp, valid_window=1)