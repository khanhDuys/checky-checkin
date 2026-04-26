from fastapi import APIRouter, Depends, HTTPException, Header
from pathlib import Path
from src.login.service import verify_and_login_user
BASE_DIR = Path(__file__).resolve().parent

router = APIRouter()

def get_token_from_header(authorization: str = Header(None)):
    """Helper function to rip the word 'Bearer ' off the token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token format")
    return authorization.split("Bearer ")[1]

@router.post("/verify")
def login(token: str = Depends(get_token_from_header)):
    """
    The endpoint React calls. It takes the token and hands it to service.py.
    """
    user_data = verify_and_login_user(token)
    
    return {
        "message": "Login successful!",
        "user": user_data
    }    


