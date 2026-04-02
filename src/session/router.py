from fastapi import APIRouter
from fastapi.responses import FileResponse
from pathlib import Path

from src.session.schemas import SessionCreateSchema, SessionResponseSchema
from src.session.service import setup_session
BASE_DIR = Path(__file__).resolve().parent

router = APIRouter()

@router.get("/")
async def get_dashboard():
    return FileResponse(str(BASE_DIR.parent.parent/"templates"/"dashboard.html"))

@router.post("/sessions/")
async def create_session(session_data: SessionCreateSchema):
    sesID = setup_session(
        class_name=session_data.class_name
    )

    return SessionResponseSchema(
        message="Session created successfully",
        session_id=sesID,
        class_name=session_data.class_name,
        is_active=True
    )

@router.get("/qr")
async def get_qr_page():
    return FileResponse(str(BASE_DIR.parent.parent/"templates"/"qrcode.html"))