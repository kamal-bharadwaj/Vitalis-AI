from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gemini_api_key: str = ""
    database_url: str = "sqlite:///./test.db" # MVP local fallback DB

    class Config:
        env_file = ".env"

settings = Settings()

app = FastAPI(title="Vitalis AI Backend", description="API for Healthcare Assistant")

# CORS middleware to allow Next.js frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev purposes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api.chat import router as chat_router
from api.upload import router as upload_router
from api.recipes import router as recipes_router

app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(upload_router, prefix="/api/upload", tags=["upload"])
app.include_router(recipes_router, prefix="/api/recipes", tags=["recipes"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Vitalis AI API is running."}
