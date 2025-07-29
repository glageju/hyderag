#!/bin/bash

# HYDE RAG Development Environment Startup Script
echo "🚀 Starting HYDE RAG development environment..."

# Check if tmux is installed
if ! command -v tmux &> /dev/null; then
    echo "❌ tmux is not installed. Please install tmux first."
    echo "On macOS: brew install tmux"
    echo "On Ubuntu/Debian: sudo apt-get install tmux"
    exit 1
fi

# Kill existing session if it exists
tmux kill-session -t hyderag 2>/dev/null

# Create new tmux session
tmux new-session -d -s hyderag -n main

# Window 1: Backend (FastAPI)
tmux rename-window -t hyderag:0 'backend'
tmux send-keys -t hyderag:backend 'echo "🐍 Starting Backend (FastAPI + LangChain HYDE RAG)..."' Enter
tmux send-keys -t hyderag:backend 'cd backend' Enter
tmux send-keys -t hyderag:backend 'echo "📦 Installing dependencies with uv..."' Enter
tmux send-keys -t hyderag:backend 'uv sync' Enter
tmux send-keys -t hyderag:backend 'echo "⚡ Starting FastAPI server..."' Enter
tmux send-keys -t hyderag:backend 'uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000' Enter

# Window 2: Frontend (Next.js)
tmux new-window -t hyderag -n 'frontend'
tmux send-keys -t hyderag:frontend 'echo "⚛️  Starting Frontend (Next.js + Tailwind CSS)..."' Enter
tmux send-keys -t hyderag:frontend 'cd frontend' Enter
tmux send-keys -t hyderag:frontend 'echo "📦 Installing dependencies with bun..."' Enter
tmux send-keys -t hyderag:frontend 'bun install' Enter
tmux send-keys -t hyderag:frontend 'echo "🌐 Starting Next.js development server..."' Enter
tmux send-keys -t hyderag:frontend 'bun dev' Enter

# Window 3: Logs/Monitoring
tmux new-window -t hyderag -n 'logs'
tmux send-keys -t hyderag:logs 'echo "📊 HYDE RAG Development Environment"' Enter
tmux send-keys -t hyderag:logs 'echo "================================="' Enter
tmux send-keys -t hyderag:logs 'echo "🐍 Backend:  http://localhost:8000"' Enter
tmux send-keys -t hyderag:logs 'echo "⚛️  Frontend: http://localhost:3000"' Enter
tmux send-keys -t hyderag:logs 'echo "📚 API Docs: http://localhost:8000/docs"' Enter
tmux send-keys -t hyderag:logs 'echo "🔍 Health:   http://localhost:8000/api/health/"' Enter
tmux send-keys -t hyderag:logs 'echo ""' Enter
tmux send-keys -t hyderag:logs 'echo "💡 Tips:"' Enter
tmux send-keys -t hyderag:logs 'echo "   - Use Ctrl+B then number to switch windows"' Enter
tmux send-keys -t hyderag:logs 'echo "   - Use Ctrl+B then d to detach from session"' Enter
tmux send-keys -t hyderag:logs 'echo "   - Use tmux attach-session -t hyderag to reattach"' Enter
tmux send-keys -t hyderag:logs 'echo "   - Use ./scripts/stop-dev.sh to stop all services"' Enter
tmux send-keys -t hyderag:logs 'echo ""' Enter
tmux send-keys -t hyderag:logs 'echo "⚠️  Make sure to set your Azure OpenAI configuration in backend/.env"' Enter
tmux send-keys -t hyderag:logs 'echo "   Required: AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT"' Enter
tmux send-keys -t hyderag:logs 'echo "   Required: AZURE_OPENAI_CHAT_DEPLOYMENT_NAME, AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME"' Enter

# Set default window to backend
tmux select-window -t hyderag:backend

# Attach to session
echo "🎉 HYDE RAG development environment is starting up!"
echo "📋 Available tmux windows:"
echo "   0: backend  - FastAPI server with HYDE RAG"
echo "   1: frontend - Next.js development server" 
echo "   2: logs     - Information and monitoring"
echo ""
echo "🔗 URLs will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""

# Attach to tmux session
tmux attach-session -t hyderag 