import os
import uuid
import aiofiles
import json
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime
from fastapi import UploadFile, HTTPException

from langchain_community.document_loaders import (
    PyPDFLoader, 
    UnstructuredWordDocumentLoader,
    TextLoader
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_openai import AzureOpenAIEmbeddings
from langchain.schema import Document
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

class DocumentService:
    """Service for handling document upload, processing, and vectorization"""
    
    def __init__(self):
        self.embeddings = AzureOpenAIEmbeddings(
            api_key=settings.azure_openai_api_key,
            azure_endpoint=settings.azure_openai_endpoint,
            api_version=settings.azure_openai_api_version,
            deployment=settings.azure_openai_embedding_deployment_name
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        self.supported_types = [".pdf", ".docx", ".doc", ".txt"]
        self.metadata_file = Path(settings.upload_dir) / "documents_metadata.json"
    
    def _load_metadata(self) -> Dict[str, Any]:
        """Load document metadata from file"""
        try:
            if self.metadata_file.exists():
                with open(self.metadata_file, 'r') as f:
                    return json.load(f)
            return {}
        except Exception as e:
            logger.error(f"Error loading metadata: {e}")
            return {}
    
    def _save_metadata(self, metadata: Dict[str, Any]) -> None:
        """Save document metadata to file"""
        try:
            with open(self.metadata_file, 'w') as f:
                json.dump(metadata, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"Error saving metadata: {e}")
    
    def _add_document_metadata(self, doc_id: str, filename: str, file_path: str, 
                              file_size: int, collection_name: str, chunks_added: int) -> None:
        """Add document metadata"""
        metadata = self._load_metadata()
        metadata[doc_id] = {
            "id": doc_id,
            "filename": filename,
            "file_path": file_path,
            "file_size": file_size,
            "collection_name": collection_name,
            "chunks_added": chunks_added,
            "upload_date": datetime.utcnow().isoformat(),
            "file_type": Path(filename).suffix.lower()
        }
        self._save_metadata(metadata)
    
    def _remove_document_metadata(self, doc_id: str) -> bool:
        """Remove document metadata"""
        metadata = self._load_metadata()
        if doc_id in metadata:
            del metadata[doc_id]
            self._save_metadata(metadata)
            return True
        return False
    
    async def save_uploaded_file(self, file: UploadFile) -> str:
        """Save uploaded file to disk and return file path"""
        try:
            # Generate unique filename
            file_extension = Path(file.filename).suffix.lower()
            if file_extension not in self.supported_types:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Unsupported file type. Supported types: {self.supported_types}"
                )
            
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = Path(settings.upload_dir) / unique_filename
            
            # Save file
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            logger.info(f"File saved: {file_path}")
            return str(file_path)
            
        except Exception as e:
            logger.error(f"Error saving file: {e}")
            raise HTTPException(status_code=500, detail=f"Error saving file: {str(e)}")
    
    async def process_document(self, file_path: str) -> List[Document]:
        """Process document and split into chunks"""
        try:
            file_extension = Path(file_path).suffix.lower()
            
            # Choose appropriate loader
            if file_extension == ".pdf":
                loader = PyPDFLoader(file_path)
            elif file_extension in [".docx", ".doc"]:
                loader = UnstructuredWordDocumentLoader(file_path)
            elif file_extension == ".txt":
                loader = TextLoader(file_path, encoding="utf-8")
            else:
                raise ValueError(f"Unsupported file type: {file_extension}")
            
            # Load document
            documents = loader.load()
            
            # Add metadata
            for doc in documents:
                doc.metadata.update({
                    "source_file": Path(file_path).name,
                    "file_path": file_path,
                    "file_type": file_extension
                })
            
            # Split documents into chunks
            chunks = self.text_splitter.split_documents(documents)
            
            logger.info(f"Processed document {file_path} into {len(chunks)} chunks")
            return chunks
            
        except Exception as e:
            logger.error(f"Error processing document {file_path}: {e}")
            raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")
    
    async def add_to_vector_store(
        self, 
        chunks: List[Document], 
        collection_name: str = "documents"
    ) -> Dict[str, Any]:
        """Add document chunks to vector store"""
        try:
            # Create or get existing vector store
            vector_store = Chroma(
                collection_name=collection_name,
                embedding_function=self.embeddings,
                persist_directory=settings.vector_db_path
            )
            
            # Add documents to vector store
            ids = vector_store.add_documents(chunks)
            
            # Persist the vector store
            vector_store.persist()
            
            result = {
                "collection_name": collection_name,
                "chunks_added": len(chunks),
                "document_ids": ids
            }
            
            logger.info(f"Added {len(chunks)} chunks to collection {collection_name}")
            return result
            
        except Exception as e:
            logger.error(f"Error adding documents to vector store: {e}")
            raise HTTPException(status_code=500, detail=f"Error adding to vector store: {str(e)}")
    
    async def upload_and_process(
        self, 
        file: UploadFile, 
        collection_name: str = "documents"
    ) -> Dict[str, Any]:
        """Complete pipeline: upload, process, and vectorize document"""
        try:
            # Generate document ID
            doc_id = str(uuid.uuid4())
            
            # Save file
            file_path = await self.save_uploaded_file(file)
            
            # Get file size
            file_size = file.size if hasattr(file, 'size') and file.size else 0
            if file_size == 0:
                # Fallback: get file size from saved file
                file_size = Path(file_path).stat().st_size
            
            # Process document
            chunks = await self.process_document(file_path)
            
            # Add to vector store
            vector_result = await self.add_to_vector_store(chunks, collection_name)
            
            # Save metadata
            self._add_document_metadata(
                doc_id=doc_id,
                filename=file.filename,
                file_path=file_path,
                file_size=file_size,
                collection_name=collection_name,
                chunks_added=vector_result["chunks_added"]
            )
            
            result = {
                "id": doc_id,
                "filename": file.filename,
                "file_path": file_path,
                "file_size": file_size,
                "processing_result": vector_result
            }
            
            return result
            
        except Exception as e:
            logger.error(f"Error in upload and process pipeline: {e}")
            raise
    
    def list_collections(self) -> List[str]:
        """List all available collections in vector store"""
        try:
            # This is a simplified version - ChromaDB doesn't have a direct way to list collections
            # You might want to maintain a separate record of collections
            vector_store = Chroma(
                embedding_function=self.embeddings,
                persist_directory=settings.vector_db_path
            )
            
            # For now, return default collection
            return ["documents"]
            
        except Exception as e:
            logger.error(f"Error listing collections: {e}")
            return ["documents"]
    
    def list_documents(self, collection_name: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all uploaded documents with metadata"""
        try:
            metadata = self._load_metadata()
            documents = list(metadata.values())
            
            # Filter by collection if specified
            if collection_name:
                documents = [doc for doc in documents if doc.get("collection_name") == collection_name]
            
            # Sort by upload date (newest first)
            documents.sort(key=lambda x: x.get("upload_date", ""), reverse=True)
            
            logger.info(f"Listed {len(documents)} documents")
            return documents
            
        except Exception as e:
            logger.error(f"Error listing documents: {e}")
            return []
    
    async def delete_document(self, doc_id: str) -> Dict[str, Any]:
        """Delete document from filesystem, vector store, and metadata"""
        try:
            metadata = self._load_metadata()
            
            if doc_id not in metadata:
                raise HTTPException(status_code=404, detail="Document not found")
            
            doc_info = metadata[doc_id]
            file_path = doc_info["file_path"]
            
            # Delete file from filesystem
            if Path(file_path).exists():
                Path(file_path).unlink()
                logger.info(f"Deleted file: {file_path}")
            
            # Remove from metadata
            self._remove_document_metadata(doc_id)
            
            # Note: ChromaDB doesn't have easy document deletion by source
            # For now, we'll track this as a limitation
            # In a production system, you might want to:
            # 1. Use a vector store that supports document deletion
            # 2. Rebuild the vector store periodically
            # 3. Use document IDs in vector store metadata for selective deletion
            
            result = {
                "id": doc_id,
                "filename": doc_info["filename"],
                "message": "Document deleted successfully",
                "note": "Document removed from filesystem and metadata. Vector embeddings may persist until vector store is rebuilt."
            }
            
            logger.info(f"Deleted document: {doc_info['filename']}")
            return result
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error deleting document: {e}")
            raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")
    
    async def get_document(self, doc_id: str) -> Dict[str, Any]:
        """Get document metadata by ID"""
        try:
            metadata = self._load_metadata()
            
            if doc_id not in metadata:
                raise HTTPException(status_code=404, detail="Document not found")
            
            return metadata[doc_id]
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error getting document: {e}")
            raise HTTPException(status_code=500, detail=f"Error getting document: {str(e)}")

# Global instance
document_service = DocumentService() 