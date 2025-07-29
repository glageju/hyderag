from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import logging

from app.services.chat_service import chat_service

logger = logging.getLogger(__name__)
router = APIRouter()

class ChatMessage(BaseModel):
    message: str
    collection_name: str = "documents"
    session_id: Optional[str] = None
    k: int = 5  # Number of documents to retrieve

class ChatResponse(BaseModel):
    answer: str
    sources: List[dict]
    session_id: str
    question: str

class HypotheticalDocumentRequest(BaseModel):
    question: str

class HypotheticalDocumentResponse(BaseModel):
    question: str
    hypothetical_document: str

@router.post("/message", response_model=ChatResponse)
async def send_chat_message(chat_msg: ChatMessage):
    """Send a chat message and get HYDE RAG response"""
    try:
        logger.info(f"Processing chat message: {chat_msg.message[:50]}...")
        
        response = await chat_service.get_response(
            question=chat_msg.message,
            collection_name=chat_msg.collection_name,
            session_id=chat_msg.session_id,
            k=chat_msg.k
        )
        
        return ChatResponse(**response)
        
    except Exception as e:
        logger.error(f"Error processing chat message: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")

@router.post("/hypothetical-document", response_model=HypotheticalDocumentResponse)
async def get_hypothetical_document(request: HypotheticalDocumentRequest):
    """Generate hypothetical document for debugging HYDE technique"""
    try:
        hypothetical_doc = await chat_service.get_hypothetical_document_preview(request.question)
        
        return HypotheticalDocumentResponse(
            question=request.question,
            hypothetical_document=hypothetical_doc
        )
        
    except Exception as e:
        logger.error(f"Error generating hypothetical document: {e}")
        raise HTTPException(status_code=500, detail=f"Error generating hypothetical document: {str(e)}")

@router.get("/sessions")
async def list_chat_sessions():
    """List all active chat sessions"""
    try:
        sessions = chat_service.list_sessions()
        return {"sessions": sessions, "count": len(sessions)}
    except Exception as e:
        logger.error(f"Error listing sessions: {e}")
        raise HTTPException(status_code=500, detail="Error listing sessions")

@router.delete("/sessions/{session_id}")
async def clear_chat_session(session_id: str):
    """Clear a specific chat session"""
    try:
        success = chat_service.clear_session(session_id)
        if success:
            return {"message": f"Session {session_id} cleared successfully"}
        else:
            raise HTTPException(status_code=404, detail="Session not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error clearing session: {e}")
        raise HTTPException(status_code=500, detail="Error clearing session") 