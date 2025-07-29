'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/Chat/ChatInterface';
import { FileUpload } from '@/components/FileUpload/FileUpload';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { Header } from '@/components/Header/Header';
import { ChatMessage, Collection } from '@/types';
import { generateId } from '@/lib/utils';
import { listCollections, healthCheck } from '@/lib/api';

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>('documents');
  const [collections, setCollections] = useState<string[]>(['documents']);
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  // Initialize session and check API health
  useEffect(() => {
    setSessionId(generateId());
    checkApiHealth();
    loadCollections();
  }, []);

  const checkApiHealth = async () => {
    try {
      setApiStatus('checking');
      await healthCheck();
      setApiStatus('connected');
    } catch (error) {
      setApiStatus('disconnected');
      console.error('API health check failed:', error);
    }
  };

  const loadCollections = async () => {
    try {
      const result = await listCollections();
      setCollections(result.collections);
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  };

  const handleSendMessage = (message: string) => {
    const userMessage: ChatMessage = {
      id: generateId(),
      message,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
  };

  const handleMessageResponse = (response: string, sources: any[]) => {
    const assistantMessage: ChatMessage = {
      id: generateId(),
      message: response,
      isUser: false,
      timestamp: new Date(),
      sources,
    };

    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleClearChat = () => {
    setMessages([]);
    setSessionId(generateId());
  };

  const handleDocumentUploaded = () => {
    loadCollections();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collections={collections}
        selectedCollection={selectedCollection}
        onCollectionChange={setSelectedCollection}
        onClearChat={handleClearChat}
        onDocumentUploaded={handleDocumentUploaded}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          selectedCollection={selectedCollection}
          apiStatus={apiStatus}
          onRetryConnection={checkApiHealth}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex">
          {/* Chat Interface */}
          <div className="flex-1 flex flex-col">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              onMessageResponse={handleMessageResponse}
              selectedCollection={selectedCollection}
              sessionId={sessionId}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
              isConnected={apiStatus === 'connected'}
            />
          </div>

          {/* Upload Area (Desktop) */}
          <div className="hidden lg:block w-80 border-l border-gray-200 bg-white">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Upload Documents
              </h3>
              <FileUpload
                selectedCollection={selectedCollection}
                onUploadComplete={handleDocumentUploaded}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Upload Modal could go here */}
    </div>
  );
} 