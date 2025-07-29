#!/bin/bash

echo "🛑 Stopping HYDE RAG development environment..."

# Kill tmux session
if tmux has-session -t hyderag 2>/dev/null; then
    tmux kill-session -t hyderag
    echo "✅ Tmux session 'hyderag' terminated"
else
    echo "ℹ️  No tmux session 'hyderag' found"
fi

# Kill any remaining processes on the ports
echo "🧹 Cleaning up processes on ports 3000 and 8000..."

# Kill processes on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Kill processes on port 8000 (backend)  
lsof -ti:8000 | xargs kill -9 2>/dev/null || true

echo "✅ Development environment stopped successfully!"
echo "💡 Use ./scripts/start-dev.sh to start again" 