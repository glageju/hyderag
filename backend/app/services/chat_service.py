from typing import List, Dict, Any, Optional, AsyncGenerator
from langchain.memory import ConversationBufferMemory
from langchain_openai import AzureChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.schema import Document
from langchain.callbacks.base import AsyncCallbackHandler
import logging
import uuid
import asyncio

from app.core.config import settings
from app.core.hyde_retriever import hyde_service

logger = logging.getLogger(__name__)

class StreamingCallbackHandler(AsyncCallbackHandler):
    """Callback handler for streaming LLM responses"""
    
    def __init__(self):
        self.tokens = []
        self.finished = False
    
    async def on_llm_new_token(self, token: str, **kwargs) -> None:
        """Called when the LLM emits a new token"""
        self.tokens.append(token)
    
    async def on_llm_start(self, serialized, prompts, **kwargs) -> None:
        """Called when the LLM starts"""
        logger.info("LLM started generating response")
    
    async def on_llm_end(self, response, **kwargs) -> None:
        """Called when the LLM finishes"""
        self.finished = True
        logger.info("LLM finished generating response")

class ChatService:
    """Service for handling chat interactions with HYDE RAG"""
    
    def __init__(self):
        logger.info(f"Initializing ChatService with Azure OpenAI settings:")
        logger.info(f"  Endpoint: {settings.azure_openai_endpoint}")
        logger.info(f"  Chat Deployment: {settings.azure_openai_chat_deployment_name}")
        logger.info(f"  API Version: {settings.azure_openai_api_version}")
        
        self.llm = AzureChatOpenAI(
            api_key=settings.azure_openai_api_key,
            azure_endpoint=settings.azure_openai_endpoint,
            api_version=settings.azure_openai_api_version,
            deployment_name=settings.azure_openai_chat_deployment_name,
            temperature=0.7,
            max_tokens=500,
            timeout=30  # Add timeout
        )
        
        # Streaming LLM with callbacks
        self.streaming_llm = AzureChatOpenAI(
            api_key=settings.azure_openai_api_key,
            azure_endpoint=settings.azure_openai_endpoint,
            api_version=settings.azure_openai_api_version,
            deployment_name=settings.azure_openai_chat_deployment_name,
            temperature=0.7,
            max_tokens=500,
            streaming=True,
            timeout=30  # Add timeout
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
    
    async def stream_response(
        self, 
        question: str, 
        collection_name: str = "documents",
        session_id: Optional[str] = None,
        k: int = 5
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream response using HYDE RAG technique with intermediate updates"""
        try:
            # Generate session ID if not provided
            if not session_id:
                session_id = str(uuid.uuid4())
            
            logger.info(f"Starting streaming response for session {session_id}")
            
            # Get conversation memory
            memory = self.get_or_create_session(session_id)
            
            # Stream update: Starting HYDE process
            yield {
                'type': 'status',
                'message': 'Generating hypothetical document...',
                'step': 'hyde_generation'
            }
            
            # Setup vector store for HYDE retrieval
            hyde_service.setup_vector_store(collection_name)
            
            # Use HYDE to retrieve relevant documents with streaming updates
            async for chunk in hyde_service.stream_retrieve_documents(question, collection_name, k):
                yield chunk
            
            # Get the final documents
            relevant_docs = await hyde_service.retrieve_documents(question, collection_name, k)
            
            # Stream update: Retrieved documents
            yield {
                'type': 'status',
                'message': f'Retrieved {len(relevant_docs)} relevant documents',
                'step': 'documents_retrieved',
                'count': len(relevant_docs)
            }
            
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
            
            logger.info(f"Starting LLM response generation for: {question[:50]}...")
            
            # Stream update: Starting response generation
            yield {
                'type': 'status',
                'message': 'Generating response...',
                'step': 'response_generation'
            }
            
            # Setup streaming callback
            callback_handler = StreamingCallbackHandler()
            
            # Stream LLM response
            accumulated_text = ""
            response_task = asyncio.create_task(
                self.streaming_llm.ainvoke(formatted_prompt, config={"callbacks": [callback_handler]})
            )
            
            # Stream tokens as they come
            last_token_count = 0
            logger.info("Starting token streaming loop")
            while not callback_handler.finished:
                await asyncio.sleep(0.05)  # Smaller delay for more responsive streaming
                
                if len(callback_handler.tokens) > last_token_count:
                    new_tokens = callback_handler.tokens[last_token_count:]
                    new_text = "".join(new_tokens)
                    accumulated_text += new_text
                    last_token_count = len(callback_handler.tokens)
                    

                    
                    yield {
                        'type': 'token',
                        'content': new_text
                    }
                    
                    # Add a small delay to make streaming more visible
                    await asyncio.sleep(0.05)  # Increased delay for more visible streaming
            
            # Wait for the response to complete
            llm_response = await response_task
            final_answer = llm_response if isinstance(llm_response, str) else llm_response.content
            
            # Ensure we have the complete response
            if accumulated_text != final_answer:
                remaining_text = final_answer[len(accumulated_text):]
                if remaining_text:
                    yield {
                        'type': 'token',
                        'content': remaining_text,
                        'accumulated': final_answer
                    }
                    accumulated_text = final_answer
            
            # Add to memory
            memory.chat_memory.add_user_message(question)
            memory.chat_memory.add_ai_message(final_answer)
            
            # Extract sources
            sources = []
            for doc in relevant_docs:
                sources.append({
                    "content": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                    "metadata": doc.metadata,
                    "source": doc.metadata.get("source_file", "Unknown")
                })
            
            # Send final response with sources
            yield {
                'type': 'final_response',
                'answer': final_answer,
                'sources': sources,
                'session_id': session_id,
                'question': question
            }
            
            logger.info(f"Completed streaming response for: {question[:50]}...")
            
        except Exception as e:
            logger.error(f"Error in streaming response: {e}")
            yield {
                'type': 'error',
                'message': f"Error generating response: {str(e)}"
            }

    def list_sessions(self) -> List[str]:
        """List all active session IDs"""
        return list(self.sessions.keys())

# Global instance
chat_service = ChatService() 