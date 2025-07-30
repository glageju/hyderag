'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/Chat/ChatInterface';
import { FileUpload } from '@/components/FileUpload/FileUpload';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { Header } from '@/components/Header/Header';
import { ChatMessage, Collection } from '@/types';
import { generateId } from '@/lib/utils';
import { listCollections, healthCheck } from '@/lib/api';
import { useChatHistory } from '@/hooks/useChatHistory';

export default function Home() {
  const { messages, sessionId, addMessage, clearHistory, startNewChat, setMessages, getAllSessions, loadSession } = useChatHistory();
  const [selectedCollection, setSelectedCollection] = useState<string>('documents');
  const [collections, setCollections] = useState<string[]>(['documents']);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Initialize and check API health
  useEffect(() => {
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

    addMessage(userMessage);
  };

  const handleMessageResponse = (response: string, sources: any[]) => {
    const assistantMessage: ChatMessage = {
      id: generateId(),
      message: response,
      isUser: false,
      timestamp: new Date(),
      sources,
    };

    addMessage(assistantMessage);
  };

  const handleClearChat = () => {
    startNewChat();
  };

  const handleDocumentUploaded = () => {
    loadCollections();
    // Small delay to ensure backend has processed the upload
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 500);
  };

  const handleDeleteChatSession = (deletedSessionId: string) => {
    // If the deleted session is the current one, clear the chat
    if (deletedSessionId === sessionId) {
      handleClearChat();
    }
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
        refreshTrigger={refreshTrigger}
        currentSessionId={sessionId}
        onLoadSession={loadSession}
        onDeleteSession={handleDeleteChatSession}
        getAllSessions={getAllSessions}
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