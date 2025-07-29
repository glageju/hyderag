'use client';

import { useState } from 'react';
import { User, Bot, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from '@/types';
import { formatTimestamp, truncateText } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessage;
}

export function ChatMessageComponent({ message }: ChatMessageProps) {
  const [showSources, setShowSources] = useState(false);

  return (
    <div className={cn(
      "flex gap-3 animate-fade-in",
      message.isUser ? "justify-end" : "justify-start"
    )}>
      {!message.isUser && (
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-primary-600" />
        </div>
      )}
      
      <div className={cn(
        "max-w-3xl",
        message.isUser ? "order-first" : ""
      )}>
        <div className={cn(
          "px-4 py-3 rounded-lg",
          message.isUser 
            ? "bg-primary-600 text-white ml-auto" 
            : "bg-white border border-gray-200 shadow-sm"
        )}>
          {message.isUser ? (
            <p className="whitespace-pre-wrap">{message.message}</p>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  code: ({ children }) => (
                    <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto text-sm">
                      {children}
                    </pre>
                  ),
                }}
              >
                {message.message}
              </ReactMarkdown>
            </div>
          )}
        </div>
        
        {/* Sources */}
        {!message.isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>{message.sources.length} source{message.sources.length !== 1 ? 's' : ''}</span>
              {showSources ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
            
            {showSources && (
              <div className="mt-2 space-y-2">
                {message.sources.map((source, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700">
                        {source.source || 'Unknown Source'}
                      </span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                      {truncateText(source.content, 200)}
                    </p>
                    {source.metadata && Object.keys(source.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {source.metadata.page && (
                          <span>Page {source.metadata.page}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Timestamp */}
        <div className={cn(
          "text-xs text-gray-500 mt-1",
          message.isUser ? "text-right" : "text-left"
        )}>
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
      
      {message.isUser && (
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-gray-600" />
        </div>
      )}
    </div>
  );
} 