from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.session.router import router as dashboard_router
from src.student.router import router as student_router
from src.login.router import router as login_router

app = FastAPI(title="Checky")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_router, tags=["dashboard"], prefix="/dashboard")
app.include_router(student_router, tags=["student"], prefix="/student")
app.include_router(login_router, tags=["login"], prefix="/login")

@app.get("/")
async def root():
    return {"status": "online"}
