# HYDE RAG Chat with Documents

A modern chat-with-documents application that uses the **HYDE (Hypothetical Document Embeddings) RAG** technique to provide intelligent document search and question-answering capabilities.

## 🚀 Features

- **HYDE RAG Technique**: Advanced retrieval method that generates hypothetical documents to improve search relevance
- **Multiple Document Formats**: Support for PDF, DOCX, DOC, and TXT files
- **Real-time Chat Interface**: Modern chat UI with streaming responses
- **Document Collections**: Organize documents into different collections
- **Source Citations**: View the source documents and excerpts used to generate answers
- **Responsive Design**: Beautiful UI that works on desktop and mobile
- **Development-Ready**: Easy setup with tmux for local development

## 🏗️ Architecture

### Backend (Python + FastAPI)
- **FastAPI** web framework with async support
- **LangChain** for HYDE RAG implementation
- **Azure OpenAI** for LLM and embeddings
- **ChromaDB** for vector storage
- **UV** for fast Python package management

### Frontend (React + Next.js)
- **Next.js 14** with App Router
- **Tailwind CSS** for styling
- **React Hook Form** for form handling
- **Bun** for fast package management
- **TypeScript** for type safety

## 📋 Prerequisites

Before you begin, ensure you have installed:

- **Python 3.10+**
- **Node.js 18+** 
- **UV** (Python package manager): `curl -LsSf https://astral.sh/uv/install.sh | sh`
- **Bun** (JavaScript runtime): `curl -fsSL https://bun.sh/install | bash`
- **tmux** (Terminal multiplexer): `brew install tmux` (macOS) or `apt install tmux` (Ubuntu)

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd hyderag
```

### 2. Set Up Environment Variables

Create a `.env` file in the backend directory:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your Azure OpenAI configuration:

```env
AZURE_OPENAI_API_KEY=your_azure_openai_api_key_here
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_CHAT_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME=text-embedding-ada-002
```

### 3. Start Development Environment

Make the scripts executable and start the development environment:

```bash
chmod +x scripts/start-dev.sh
chmod +x scripts/stop-dev.sh
./scripts/start-dev.sh
```

This will:
- Install all dependencies for both frontend and backend
- Start the FastAPI backend on `http://localhost:8000`
- Start the Next.js frontend on `http://localhost:3000`
- Create a tmux session with multiple windows for easy development

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health/

## 🎯 How to Use

### 1. Upload Documents
- Use the sidebar or upload area to add PDF, DOCX, DOC, or TXT files
- Documents are automatically processed and vectorized
- Organize documents into collections

### 2. Start Chatting
- Ask questions about your uploaded documents
- The system uses HYDE RAG to find the most relevant information
- View source citations to see which documents were used

### 3. HYDE RAG Process
1. **Your Question** → System generates a hypothetical document that would answer the question
2. **Hypothetical Document** → Gets embedded using OpenAI embeddings
3. **Vector Search** → Finds similar real documents using the hypothetical embedding
4. **Context Retrieval** → Retrieves relevant document chunks
5. **Answer Generation** → Uses retrieved context to generate the final answer

## 🛠️ Development

### Backend Development

```bash
cd backend

# Install dependencies
uv sync

# Run development server
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
uv run pytest

# Format code
uv run black .
uv run isort .
```

### Frontend Development

```bash
cd frontend

# Install dependencies
bun install

# Run development server
bun dev

# Build for production
bun run build

# Type checking
bun run type-check
```

### Tmux Session Management

```bash
# Attach to existing session
tmux attach-session -t hyderag

# Detach from session (while inside tmux)
Ctrl+B then d

# Switch between windows (while inside tmux)
Ctrl+B then 0  # Backend
Ctrl+B then 1  # Frontend
Ctrl+B then 2  # Logs

# Stop all services
./scripts/stop-dev.sh
```

## 📁 Project Structure

```
hyderag/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── api/routes/     # API endpoints
│   │   ├── core/           # Core configuration and HYDE RAG logic
│   │   ├── services/       # Business logic services
│   │   └── main.py         # FastAPI application
│   ├── pyproject.toml      # Python dependencies and config
│   └── .env.example        # Environment variables template
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router pages
│   │   ├── components/    # React components
│   │   ├── lib/          # Utilities and API client
│   │   └── types/        # TypeScript type definitions
│   ├── package.json      # Node.js dependencies
│   └── tailwind.config.js # Tailwind CSS configuration
├── scripts/               # Development scripts
│   ├── start-dev.sh      # Start development environment
│   └── stop-dev.sh       # Stop development environment
└── README.md             # This file
```

## 🔧 Configuration

### Backend Configuration (backend/.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `AZURE_OPENAI_API_KEY` | Azure OpenAI API key | Required |
| `AZURE_OPENAI_ENDPOINT` | Azure OpenAI endpoint URL | Required |
| `AZURE_OPENAI_API_VERSION` | Azure OpenAI API version | `2024-02-15-preview` |
| `AZURE_OPENAI_CHAT_DEPLOYMENT_NAME` | Chat model deployment name | Required |
| `AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME` | Embedding model deployment name | Required |
| `DEBUG` | Enable debug mode | `true` |
| `HOST` | Backend host | `0.0.0.0` |
| `PORT` | Backend port | `8000` |
| `CORS_ORIGINS` | Allowed CORS origins | `["http://localhost:3000"]` |
| `VECTOR_DB_PATH` | ChromaDB storage path | `./vector_db` |
| `UPLOAD_DIR` | Document upload directory | `./documents` |

### Frontend Configuration

The frontend automatically connects to the backend at `http://localhost:8000`. For production, set `NEXT_PUBLIC_API_URL` environment variable.

## 🔍 API Endpoints

### Health Check
- `GET /api/health/` - Basic health check
- `GET /api/health/detailed` - Detailed health check with configuration

### Documents
- `POST /api/documents/upload` - Upload and process a document
- `GET /api/documents/collections` - List all collections
- `GET /api/documents/supported-types` - Get supported file types
- `DELETE /api/documents/{file_path}` - Delete a document

### Chat
- `POST /api/chat/message` - Send a chat message (HYDE RAG)
- `POST /api/chat/hypothetical-document` - Generate hypothetical document (debugging)
- `GET /api/chat/sessions` - List active chat sessions
- `DELETE /api/chat/sessions/{session_id}` - Clear a chat session

## 🐛 Troubleshooting

### Common Issues

1. **Azure OpenAI Configuration Error**
   - Make sure you've set all required Azure OpenAI variables in `backend/.env`
   - Verify your API key, endpoint, and deployment names are correct
   - Check that your Azure OpenAI resource has the required model deployments

2. **Port Already in Use**
   - Run `./scripts/stop-dev.sh` to stop existing processes
   - Check for other applications using ports 3000 or 8000

3. **Dependencies Installation Failed**
   - Ensure UV and Bun are properly installed
   - Try deleting `node_modules` and reinstalling

4. **tmux Session Issues**
   - Install tmux: `brew install tmux` (macOS) or `apt install tmux` (Ubuntu)
   - Kill existing session: `tmux kill-session -t hyderag`

### Logs

- Backend logs are visible in the tmux backend window
- Frontend logs are visible in the tmux frontend window
- Switch between windows with `Ctrl+B then [0-2]`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [LangChain](https://langchain.com/) for the excellent RAG framework
- [Azure OpenAI](https://azure.microsoft.com/en-us/products/ai-services/openai-service) for enterprise-grade LLM and embedding models
- [ChromaDB](https://www.trychroma.com/) for vector storage
- [FastAPI](https://fastapi.tiangolo.com/) for the modern web framework
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling

---

Built with ❤️ using HYDE RAG technique for enhanced document search and retrieval. 