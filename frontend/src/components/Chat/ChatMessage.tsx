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
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-primary-900/20">
          <Bot className="w-4 h-4 text-primary-600 dark:text-primary-400" />
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
            : "bg-white border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700"
        )}>
          {message.isUser ? (
            <p className="whitespace-pre-wrap">{message.message}</p>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  code: ({ children }) => (
                    <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm dark:bg-gray-700 dark:text-gray-200">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto text-sm dark:bg-gray-700 dark:text-gray-200">
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
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors dark:text-gray-400 dark:hover:text-gray-200"
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
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm dark:bg-gray-700 dark:border-gray-600"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {source.source || 'Unknown Source'}
                      </span>
                    </div>
                    <p className="text-gray-600 leading-relaxed dark:text-gray-300">
                      {truncateText(source.content, 200)}
                    </p>
                    {source.metadata && Object.keys(source.metadata).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
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
          "text-xs text-gray-500 mt-1 dark:text-gray-400",
          message.isUser ? "text-right" : "text-left"
        )}>
          {formatTimestamp(message.timestamp)}
        </div>
      </div>
      
      {message.isUser && (
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 dark:bg-gray-700">
          <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
        </div>
      )}
    </div>
  );
} 