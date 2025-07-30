from typing import List, Dict, Any, Optional
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_openai import AzureChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import Document
import logging
import uuid

from app.core.config import settings
from app.core.hyde_retriever import hyde_service

logger = logging.getLogger(__name__)

class ChatService:
    """Service for handling chat interactions with HYDE RAG"""
    
    def __init__(self):
        self.llm = AzureChatOpenAI(
            api_key=settings.azure_openai_api_key,
            azure_endpoint=settings.azure_openai_endpoint,
            api_version=settings.azure_openai_api_version,
            deployment_name=settings.azure_openai_chat_deployment_name,
            temperature=0.7,
            max_tokens=500
        )
        self.sessions: Dict[str, ConversationBufferMemory] = {}
        
        # Custom prompt template for RAG responses
        self.prompt_template = PromptTemplate(
            input_variables=["context", "question", "chat_history"],
            template="""You are a helpful AI assistant that answers questions based on the provided context from documents.

Use the following pieces of context to answer the human's question. If you cannot find the answer in the context, say that you don't have enough information to answer the question. Do not make up information.

When you provide an answer, be conversational and helpful. If relevant, mention which document or source the information comes from.

Context from documents:
{context}

Previous conversation:
{chat_history}

Current question: {question}

Please provide a helpful answer based on the context above:"""
        )
    
    def get_or_create_session(self, session_id: str) -> ConversationBufferMemory:
        """Get or create a conversation session"""
        if session_id not in self.sessions:
            self.sessions[session_id] = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True,
                output_key="answer"
            )
        return self.sessions[session_id]
    
    async def get_response(
        self, 
        question: str, 
        collection_name: str = "documents",
        session_id: Optional[str] = None,
        k: int = 5
    ) -> Dict[str, Any]:
        """Get response using HYDE RAG technique"""
        try:
            # Generate session ID if not provided
            if not session_id:
                session_id = str(uuid.uuid4())
            
            # Get conversation memory
            memory = self.get_or_create_session(session_id)
            
            # Setup vector store for HYDE retrieval
            hyde_service.setup_vector_store(collection_name)
            
            # Use HYDE to retrieve relevant documents
            relevant_docs = await hyde_service.retrieve_documents(question, collection_name, k)
            
            # Create context from retrieved documents
            context = "\n\n".join([doc.page_content for doc in relevant_docs])
            
            # Get chat history as string
            chat_history_str = ""
            if memory.chat_memory.messages:
                chat_history_str = "\n".join([
                    f"Human: {msg.content}" if msg.type == "human" else f"Assistant: {msg.content}"
                    for msg in memory.chat_memory.messages[-4:]  # Last 4 messages for context
                ])
            
            # Generate response using the prompt template
            formatted_prompt = self.prompt_template.format(
                context=context,
                question=question,
                chat_history=chat_history_str
            )
            
            logger.info(f"Formatted prompt for question '{question[:50]}...': {formatted_prompt[:200]}...")
            
            # Get LLM response
            llm_response = await self.llm.ainvoke(formatted_prompt)
            answer_text = llm_response if isinstance(llm_response, str) else llm_response.content
            
            # Add to memory
            memory.chat_memory.add_user_message(question)
            memory.chat_memory.add_ai_message(answer_text)
            
            # Extract sources
            sources = []
            for doc in relevant_docs:
                sources.append({
                    "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                    "metadata": doc.metadata,
                    "source": doc.metadata.get("source_file", "Unknown")
                })
            
            response = {
                "answer": answer_text,
                "sources": sources,
                "session_id": session_id,
                "question": question
            }
            
            logger.info(f"Generated response for question: {question[:50]}...")
            return response
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            raise
    
    async def get_hypothetical_document_preview(self, question: str) -> str:
        """Get hypothetical document for debugging purposes"""
        try:
            return hyde_service.get_hypothetical_document(question)
        except Exception as e:
            logger.error(f"Error getting hypothetical document: {e}")
            raise
    
    def clear_session(self, session_id: str) -> bool:
        """Clear a conversation session"""
        if session_id in self.sessions:
            del self.sessions[session_id]
            logger.info(f"Cleared session: {session_id}")
            return True
        return False
    
    def list_sessions(self) -> List[str]:
        """List all active session IDs"""
        return list(self.sessions.keys())

# Global instance
chat_service = ChatService() 