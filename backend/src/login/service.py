from fastapi import HTTPException
from firebase_admin import auth
from database import db

def verify_and_login_user(token: str):
    try:
        #verify
        decoded_token = auth.verify_id_token(token)
        
        uid = decoded_token.get("uid")
        email = decoded_token.get("email")
        
        name = decoded_token.get("name", "Unknown Name")


        teachers_query = db.collection("teachers").where("email", "==", email).limit(1).get()

        if not teachers_query:
            print(f"LOGIN DENIED: UNREGISTERED EMAIL {email}")
            raise HTTPException(
                status_code=403, 
                detail="ACCESS DENIED. EMAIL NOT REGISTERED"
            )

        # 4. If they exist, extract their actual Firestore data
        teacher_doc = teachers_query[0].to_dict()
        
        # Grab the specific fields you defined in your database schema
        db_role = teacher_doc.get("role", "teacher")
        db_subject = teacher_doc.get("subject", "Unknown Subject")

        print(f"Teacher logged in successfully: {email} ({db_subject})")

        return {
            "uid": uid,
            "email": email,
            "name": name,
            "role": db_role,
            "subject": db_subject
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token or authentication error: {str(e)}")