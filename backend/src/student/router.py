from fastapi import APIRouter, Depends, HTTPException, Header
from pathlib import Path
from src.student.service import verifyStudent, verify_totp
from src.student.schemas import TOTPSchema
from database import db
BASE_DIR = Path(__file__).resolve().parent

BASE_DIR = Path(__file__).resolve().parent

router = APIRouter()

def get_token_from_header(authorization: str = Header(None)):
    """Helper function to rip the word 'Bearer ' off the token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token format")
    return authorization.split("Bearer ")[1]

@router.post("/verify")
def login(verify_data: TOTPSchema, token: str = Depends(get_token_from_header)):
    # 1. Authenticate the student
    user_data = verifyStudent(token)
    
    # 2. Query the EXACT collection name shown in your Firebase console
    # Note the str() cast to prevent the UUID error from earlier!
    doc_ref = db.collection("attendance_sessions").document(str(verify_data.session_id))
    ses_query = doc_ref.get()
    
    # 3. CRITICAL: Stop the crash if the document doesn't exist
    if not ses_query.exists:
        raise HTTPException(
            status_code=404, 
            detail="Mã QR không tồn tại hoặc đã bị xóa."
        )

    # 4. Now it is safe to convert to dict and get the seed
    ses_data = ses_query.to_dict()
    ses_seed = ses_data.get("seed")
    
    # 5. Verify the TOTP
    statusQR = verify_totp(seed=ses_seed, totp=verify_data.totp)
    if not statusQR:
        raise HTTPException(status_code=403, detail="Mã xác thực QR không chính xác")
        
    return {
        "message": "Login successful!",
        "user": user_data
    }