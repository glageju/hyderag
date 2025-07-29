# HYDE RAG Backend

FastAPI backend for the HYDE RAG Chat with Documents application.

## Features

- FastAPI web framework with async support
- LangChain for HYDE RAG implementation
- OpenAI integration for LLM and embeddings
- ChromaDB for vector storage
- Document processing (PDF, DOCX, DOC, TXT)

## Development

```bash
# Install dependencies
uv sync

# Run development server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit:
- API Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/api/health/ 