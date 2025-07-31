from typing import List, Optional, Dict, Any, AsyncGenerator
from langchain.prompts import PromptTemplate
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain.schema import Document
import logging
import asyncio

from app.core.config import settings

logger = logging.getLogger(__name__)

class HYDERetrieverService:
    """HYDE (Hypothetical Document Embeddings) Retriever Service"""
    
    def __init__(self):
        
        self.llm = AzureChatOpenAI(
            api_key=settings.azure_openai_api_key,
            azure_endpoint=settings.azure_openai_endpoint,
            api_version=settings.azure_openai_api_version,
            deployment_name=settings.azure_openai_chat_deployment_name,
            temperature=0.0,
            timeout=30  # Add timeout
        )
        self.embeddings = AzureOpenAIEmbeddings(
            api_key=settings.azure_openai_api_key,
            azure_endpoint=settings.azure_openai_endpoint,
            api_version=settings.azure_openai_api_version,
            deployment=settings.azure_openai_embedding_deployment_name
        )
        self.vector_store: Optional[Chroma] = None
        
        # HYDE prompt template
        self.hyde_prompt = PromptTemplate(
            input_variables=["question"],
            template="""Please write a detailed passage that would appear in a document to answer this question.

Write as if you are an expert author writing a comprehensive document section that directly addresses the question.
Be specific, informative, and authoritative in your response.

Question: {question}

Document passage:"""
        )
    
    def load_vector_store(self, collection_name: str = "documents") -> Chroma:
        """Load or create vector store for the given collection"""
        try:
            self.vector_store = Chroma(
                collection_name=collection_name,
                embedding_function=self.embeddings,
                persist_directory=settings.vector_db_path
            )
            logger.info(f"Loaded vector store for collection: {collection_name}")
            return self.vector_store
        except Exception as e:
            logger.error(f"Error loading vector store: {e}")
            raise
    
    def setup_vector_store(self, collection_name: str = "documents") -> Chroma:
        """Setup vector store for HYDE retrieval"""
        try:
            # Load vector store
            self.vector_store = self.load_vector_store(collection_name)
            logger.info(f"Vector store setup complete for collection: {collection_name}")
            return self.vector_store
            
        except Exception as e:
            logger.error(f"Error setting up vector store: {e}")
            raise
    
    async def generate_hypothetical_document(self, query: str) -> str:
        """Generate hypothetical document for the given query"""
        try:
            # Format the prompt directly
            formatted_prompt = self.hyde_prompt.format(question=query)
            
            logger.info(f"Calling LLM for hypothetical document generation...")
            logger.info(f"Prompt: {formatted_prompt[:200]}...")
            
            # Use LLM directly for better control
            try:
                response = await self.llm.ainvoke(formatted_prompt)
                
                # Extract the response text
                hypothetical_doc = response if isinstance(response, str) else response.content
                
                logger.info(f"Generated hypothetical document for query: {query[:50]}...")
                logger.info(f"Hypothetical document length: {len(hypothetical_doc)} characters")
                return hypothetical_doc.strip()
            except Exception as e:
                logger.error(f"Error generating hypothetical document: {e}")
                logger.error(f"LLM configuration: endpoint={settings.azure_openai_endpoint}, deployment={settings.azure_openai_chat_deployment_name}")
                raise
            
        except Exception as e:
            logger.error(f"Error generating hypothetical document: {e}")
            raise
    
    async def retrieve_documents(
        self, 
        query: str, 
        collection_name: str = "documents",
        k: int = 5
    ) -> List[Document]:
        """Retrieve relevant documents using HYDE technique"""
        try:
            # Setup vector store if not already done
            if not self.vector_store:
                self.setup_vector_store(collection_name)
            
            # Step 1: Generate hypothetical document
            hypothetical_doc = await self.generate_hypothetical_document(query)
            
            # Step 2: Embed the hypothetical document
            hypothetical_embedding = await self.embeddings.aembed_query(hypothetical_doc)
            
            # Step 3: Search for similar documents using hypothetical document embedding
            # Use the vector store's similarity search with the hypothetical document embedding
            similar_docs = self.vector_store.similarity_search_by_vector(
                hypothetical_embedding,
                k=k
            )
            
            logger.info(f"HYDE retrieval complete: {len(similar_docs)} documents for query: {query[:50]}...")
            return similar_docs
            
        except Exception as e:
            logger.error(f"Error in HYDE retrieval: {e}")
            raise
    
    async def stream_retrieve_documents(
        self, 
        query: str, 
        collection_name: str = "documents",
        k: int = 5
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream HYDE retrieval process with intermediate updates"""
        try:
            # Setup vector store if not already done
            if not self.vector_store:
                self.setup_vector_store(collection_name)
            
            logger.info(f"Starting HYDE streaming retrieval for: {query[:50]}...")
            
            # Step 1: Generate hypothetical document with streaming updates
            yield {
                'type': 'status',
                'message': 'Creating hypothetical document...',
                'step': 'hyde_document_generation'
            }
            
            hypothetical_doc = await self.generate_hypothetical_document(query)
            
            logger.info(f"Generated hypothetical document: {hypothetical_doc[:100]}...")
            
            yield {
                'type': 'status',
                'message': 'Hypothetical document created',
                'step': 'hyde_document_complete',
                'preview': hypothetical_doc[:200] + "..." if len(hypothetical_doc) > 200 else hypothetical_doc
            }
            
            # Step 2: Embed the hypothetical document
            yield {
                'type': 'status',
                'message': 'Creating embedding for hypothetical document...',
                'step': 'embedding_generation'
            }
            
            hypothetical_embedding = await self.embeddings.aembed_query(hypothetical_doc)
            
            logger.info(f"Generated embedding for hypothetical document (dimension: {len(hypothetical_embedding)})")
            
            yield {
                'type': 'status',
                'message': 'Embedding created, searching for similar documents...',
                'step': 'similarity_search'
            }
            
            # Step 3: Search for similar documents
            similar_docs = self.vector_store.similarity_search_by_vector(
                hypothetical_embedding,
                k=k
            )
            
            logger.info(f"HYDE streaming retrieval complete: {len(similar_docs)} documents found")
            
            yield {
                'type': 'status',
                'message': f'Found {len(similar_docs)} relevant documents',
                'step': 'search_complete',
                'documents_found': len(similar_docs),
                'sources': [doc.metadata.get("source_file", "Unknown") for doc in similar_docs]
            }
            
        except Exception as e:
            logger.error(f"Error in HYDE streaming retrieval: {e}")
            yield {
                'type': 'error',
                'message': f"Error in document retrieval: {str(e)}",
                'step': 'retrieval_error'
            }

    def get_hypothetical_document(self, query: str) -> str:
        """Generate hypothetical document for debugging/inspection (synchronous version)"""
        try:
            # Format the prompt directly
            formatted_prompt = self.hyde_prompt.format(question=query)
            
            # Use LLM directly for better control
            response = self.llm.invoke(formatted_prompt)
            hypothetical_doc = response if isinstance(response, str) else response.content
            return hypothetical_doc.strip()
        except Exception as e:
            logger.error(f"Error generating hypothetical document: {e}")
            raise

# Global instance
hyde_service = HYDERetrieverService() 