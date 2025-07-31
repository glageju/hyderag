from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field
import os
import logging
from pathlib import Path

# Configure logging for streaming responses
def setup_logging():
    """Setup logging configuration for HyDE RAG streaming"""
    log_format = '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
    
    # Create logs directory if it doesn't exist
    Path("./logs").mkdir(exist_ok=True)
    
    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('./logs/hyderag.log'),
            logging.FileHandler('./logs/streaming.log')  # Dedicated streaming log
        ]
    )
    
    # Set specific log levels for different components
    logging.getLogger("app.services.chat_service").setLevel(logging.INFO)
    logging.getLogger("app.core.hyde_retriever").setLevel(logging.INFO)
    logging.getLogger("app.api.routes.chat").setLevel(logging.INFO)
    
    # Reduce noise from external libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("langchain").setLevel(logging.WARNING)

class Settings(BaseSettings):
    # API Configuration
    debug: bool = Field(default=True, env="DEBUG")
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    cors_origins: List[str] = Field(default=["http://localhost:3000"], env="CORS_ORIGINS")
    
    # Azure OpenAI Configuration
    azure_openai_api_key: str = Field(..., env="AZURE_OPENAI_API_KEY")
    azure_openai_endpoint: str = Field(..., env="AZURE_OPENAI_ENDPOINT")
    azure_openai_api_version: str = Field(default="2023-12-01-preview", env="AZURE_OPENAI_API_VERSION")
    azure_openai_chat_deployment_name: str = Field(..., env="AZURE_OPENAI_CHAT_DEPLOYMENT_NAME")
    azure_openai_embedding_deployment_name: str = Field(..., env="AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME")
    
    # Database Configuration
    vector_db_path: str = Field(default="./vector_db", env="VECTOR_DB_PATH")
    upload_dir: str = Field(default="./documents", env="UPLOAD_DIR")
    
    # Security
    secret_key: str = Field(default="your-secret-key-change-this", env="SECRET_KEY")
    algorithm: str = Field(default="HS256", env="ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    

    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Ensure directories exist
        Path(self.vector_db_path).mkdir(parents=True, exist_ok=True)
        Path(self.upload_dir).mkdir(parents=True, exist_ok=True)

# Global settings instance
settings = Settings()

# Setup logging when settings are loaded
setup_logging() 