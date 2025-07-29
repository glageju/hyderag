from fastapi import APIRouter
from datetime import datetime
from app.core.config import settings

router = APIRouter()

@router.get("/")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "HYDE RAG API",
        "version": "1.0.0"
    }

@router.get("/detailed")
async def detailed_health_check():
    """Detailed health check with configuration info"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "HYDE RAG API",
        "version": "1.0.0",
        "config": {
            "debug": settings.debug,
            "vector_db_path": settings.vector_db_path,
            "upload_dir": settings.upload_dir,
        },
        "dependencies": {
            "azure_openai_configured": bool(settings.azure_openai_api_key and settings.azure_openai_endpoint),
            "vector_db_accessible": True,  # Could add actual check
        }
    } 