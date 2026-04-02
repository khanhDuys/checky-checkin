from fastapi import APIRouter
from fastapi.responses import FileResponse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

router = APIRouter()

@router.get("/checkin")
async def get_dashboard():
    return FileResponse(str(BASE_DIR.parent.parent/"templates"/"student.html"))
