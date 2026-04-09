from fastapi import APIRouter
from fastapi.responses import FileResponse
from pathlib import Path
# from database import db

from src.session.schemas import SessionCreateSchema, SessionResponseSchema
from src.session.service import setup_session
BASE_DIR = Path(__file__).resolve().parent

router = APIRouter()

@router.post("/sessions/")
async def create_session(session_data: SessionCreateSchema):
    session_info = setup_session(
        class_name=session_data.class_name
    )

    return SessionResponseSchema(
        message="Session created successfully",
        session_id=session_info["session_ID"],
        seed=session_info["seed"],
        class_name=session_data.class_name,
        is_active=True
    )

@router.post("/sessions/{session_id}/close")
def close_session(session_id: str):
    # 1. Find the exact session in Firebase
    #doc_ref = db.collection("sessions").document(session_id)
    #
    ## 2. Flip it to False! 
    #doc_ref.update({
    #    "is_active": False
    #})
    
    return {"message": "Session locked!"}