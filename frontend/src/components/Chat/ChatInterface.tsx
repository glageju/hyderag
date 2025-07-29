'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { ChatMessage } from '@/types';
import { ChatMessageComponent } from './ChatMessage';
import { sendChatMessage } from '@/lib/api';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onMessageResponse: (response: string, sources: any[]) => void;
  selectedCollection: string;
  sessionId: string;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isConnected: boolean;
}

export function ChatInterface({
  messages,
  onSendMessage,
  onMessageResponse,
  selectedCollection,
  sessionId,
  isLoading,
  setIsLoading,
  isConnected,
}: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading || !isConnected) return;

    const message = inputMessage.trim();
    setInputMessage('');
    onSendMessage(message);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(
        message,
        selectedCollection,
        sessionId,
        5
      );
      
      onMessageResponse(response.answer, response.sources);
    } catch (error) {
      console.error('Error sending message:', error);
      onMessageResponse(
        'Sorry, I encountered an error while processing your message. Please try again.',
        []
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-500 max-w-md">
              Ask questions about your documents. I'll use the HYDE RAG technique to find the most relevant information.
            </p>
            {!isConnected && (
              <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Not connected to backend</span>
              </div>
            )}
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessageComponent key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-3 text-gray-500">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isConnected 
                  ? "Ask a question about your documents..." 
                  : "Connect to backend to start chatting..."
              }
              disabled={!isConnected || isLoading}
              className={cn(
                "w-full resize-none border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                "min-h-[52px] max-h-32",
                (!isConnected || isLoading) && "bg-gray-50 cursor-not-allowed"
              )}
              rows={1}
            />
          </div>
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading || !isConnected}
            className={cn(
              "px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors",
              "disabled:bg-gray-300 disabled:cursor-not-allowed"
            )}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
        
        {!isConnected && (
          <p className="text-sm text-red-600 mt-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Please check your backend connection
          </p>
        )}
      </div>
    </div>
  );
} 