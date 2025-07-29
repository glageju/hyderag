from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from pathlib import Path

from app.core.config import settings
from app.api.routes import health, documents, chat

# Create FastAPI app
app = FastAPI(
    title="HYDE RAG Chat API",
    description="Chat with Documents using HYDE RAG technique",
    version="1.0.0",
    debug=settings.debug
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Mount static files for document serving
if Path(settings.upload_dir).exists():
    app.mount("/documents", StaticFiles(directory=settings.upload_dir), name="documents")

# Include routers
app.include_router(health.router, prefix="/api/health", tags=["health"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print(f"🚀 HYDE RAG API starting on {settings.host}:{settings.port}")
    print(f"📁 Upload directory: {settings.upload_dir}")
    print(f"🗄️ Vector DB path: {settings.vector_db_path}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("👋 HYDE RAG API shutting down...")

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    ) 