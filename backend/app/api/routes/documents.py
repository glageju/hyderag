from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from pydantic import BaseModel
import logging

from app.services.document_service import document_service

logger = logging.getLogger(__name__)
router = APIRouter()

class DocumentResponse(BaseModel):
    filename: str
    file_path: str
    file_size: int
    processing_result: dict

class DocumentListItem(BaseModel):
    filename: str
    file_path: str
    collection_name: str
    upload_date: str

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    collection_name: str = Query(default="documents", description="Collection name for the document")
):
    """Upload and process a document"""
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")
        
        logger.info(f"Uploading document: {file.filename} to collection: {collection_name}")
        
        result = await document_service.upload_and_process(file, collection_name)
        
        return DocumentResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@router.get("/collections")
async def list_collections():
    """List all available document collections"""
    try:
        collections = document_service.list_collections()
        return {"collections": collections}
    except Exception as e:
        logger.error(f"Error listing collections: {e}")
        raise HTTPException(status_code=500, detail="Error listing collections")

@router.delete("/{file_path:path}")
async def delete_document(file_path: str):
    """Delete a document from the system"""
    try:
        success = await document_service.delete_document(file_path)
        if success:
            return {"message": "Document deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Document not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(status_code=500, detail="Error deleting document")

@router.get("/supported-types")
async def get_supported_file_types():
    """Get list of supported file types"""
    return {
        "supported_types": [".pdf", ".docx", ".doc", ".txt"],
        "descriptions": {
            ".pdf": "PDF documents",
            ".docx": "Microsoft Word documents (new format)",
            ".doc": "Microsoft Word documents (legacy format)",
            ".txt": "Plain text files"
        }
    } 