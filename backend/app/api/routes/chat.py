from typing import Optional, List, AsyncGenerator
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import logging
import json

from app.services.chat_service import chat_service

logger = logging.getLogger(__name__)
router = APIRouter()

class ChatMessage(BaseModel):
    message: str
    collection_name: str = "documents"
    session_id: Optional[str] = None
    k: int = 5  # Number of documents to retrieve

class HypotheticalDocumentRequest(BaseModel):
    question: str

class HypotheticalDocumentResponse(BaseModel):
    question: str
    hypothetical_document: str

@router.post("/stream")
async def stream_chat_message(chat_msg: ChatMessage):
    """Stream chat message response using HYDE RAG"""
    
    async def event_stream() -> AsyncGenerator[str, None]:
        try:
            logger.info(f"Starting streaming response for: {chat_msg.message[:50]}...")
            
            # Send initial status
            yield f"data: {json.dumps({'type': 'status', 'message': 'Processing your question...'})}\n\n"
            
            async for chunk in chat_service.stream_response(
                question=chat_msg.message,
                collection_name=chat_msg.collection_name,
                session_id=chat_msg.session_id,
                k=chat_msg.k
            ):
                yield f"data: {json.dumps(chunk)}\n\n"
            
            # Send completion signal
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except Exception as e:
            logger.error(f"Error in streaming response: {e}")
            error_data = {
                'type': 'error',
                'message': f"Error processing message: {str(e)}"
            }
            yield f"data: {json.dumps(error_data)}\n\n"
    
    return StreamingResponse(
        event_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream",
        }
    )

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