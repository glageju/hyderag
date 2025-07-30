'use client';

import { useState, useEffect } from 'react';
import { Clock, MessageSquare, Trash2 } from 'lucide-react';
import { ChatMessage } from '@/types';

interface ChatSession {
  sessionId: string;
  title: string;
  lastMessage: Date;
  messageCount: number;
}

interface ChatHistoryProps {
  currentSessionId: string;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession?: (sessionId: string) => void;
  getAllSessions: () => string[];
}

export function ChatHistory({ 
  currentSessionId, 
  onLoadSession, 
  onDeleteSession,
  getAllSessions 
}: ChatHistoryProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChatSessions = () => {
    try {
      setLoading(true);
      const sessionIds = getAllSessions();
      console.log('Found session IDs:', sessionIds); // Debug log
      const chatSessions: ChatSession[] = [];

      sessionIds.forEach(sessionId => {
        try {
          const key = `hyderag_chat_history_${sessionId}`;
          console.log('Looking for key:', key); // Debug log
          const savedHistory = localStorage.getItem(key);
          if (savedHistory) {
            const messages: ChatMessage[] = JSON.parse(savedHistory);
            if (messages.length > 0) {
              const lastMessage = new Date(messages[messages.length - 1].timestamp);
              const firstUserMessage = messages.find(m => m.isUser === true);
              const title = firstUserMessage 
                ? firstUserMessage.message.slice(0, 50) + (firstUserMessage.message.length > 50 ? '...' : '')
                : `Chat ${sessionId.slice(0, 8)}`;

              chatSessions.push({
                sessionId,
                title,
                lastMessage,
                messageCount: messages.length
              });
            }
          }
        } catch (error) {
          console.error(`Error parsing session ${sessionId}:`, error);
        }
      });

      // Sort by last message date (newest first)
      chatSessions.sort((a, b) => b.lastMessage.getTime() - a.lastMessage.getTime());
      console.log('Loaded chat sessions:', chatSessions.length); // Debug log
      setSessions(chatSessions);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChatSessions();
  }, [currentSessionId]); // Reload when current session changes

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent session loading when clicking delete
    if (confirm('Are you sure you want to delete this chat session?')) {
      try {
        localStorage.removeItem(`hyderag_chat_history_${sessionId}`);
                  if (sessionId === currentSessionId) {
            localStorage.removeItem('hyderag_session_id');
          }
        loadChatSessions(); // Refresh the list
        if (onDeleteSession) {
          onDeleteSession(sessionId);
        }
      } catch (error) {
        console.error('Error deleting session:', error);
      }
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No chat history yet</p>
        <p className="text-xs mt-1">Start a conversation to see it here</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="px-4 py-2 text-sm font-medium text-gray-700 border-b">
        Chat History ({sessions.length})
      </h3>
      <div className="max-h-64 overflow-y-auto">
        {sessions.map((session) => (
          <div
            key={session.sessionId}
            onClick={() => onLoadSession(session.sessionId)}
            className={`mx-2 p-3 rounded-lg cursor-pointer transition-colors group hover:bg-gray-50 ${
              session.sessionId === currentSessionId 
                ? 'bg-blue-50 border border-blue-200' 
                : 'border border-transparent'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session.title}
                </p>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{formatRelativeTime(session.lastMessage)}</span>
                  <span className="mx-1">•</span>
                  <span>{session.messageCount} messages</span>
                </div>
              </div>
              <button
                onClick={(e) => handleDeleteSession(session.sessionId, e)}
                className="ml-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all"
                title="Delete chat session"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 