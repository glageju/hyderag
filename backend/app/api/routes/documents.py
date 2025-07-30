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
    id: str
    filename: str
    file_path: str
    file_size: int
    collection_name: str
    chunks_added: int
    upload_date: str
    file_type: str

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

@router.get("/", response_model=List[DocumentListItem])
async def list_documents(collection_name: Optional[str] = Query(None, description="Filter by collection name")):
    """List all uploaded documents"""
    try:
        documents = document_service.list_documents(collection_name)
        return documents
    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        raise HTTPException(status_code=500, detail="Error listing documents")

@router.get("/{doc_id}", response_model=DocumentListItem)
async def get_document(doc_id: str):
    """Get document details by ID"""
    try:
        document = await document_service.get_document(doc_id)
        return document
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document: {e}")
        raise HTTPException(status_code=500, detail="Error getting document")

@router.delete("/{doc_id}")
async def delete_document(doc_id: str):
    """Delete a document from the system"""
    try:
        result = await document_service.delete_document(doc_id)
        return result
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