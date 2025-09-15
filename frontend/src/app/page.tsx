'use client';

import { useState, useEffect } from 'react';
import { ChatInterface } from '@/components/Chat/ChatInterface';
import { FileUpload } from '@/components/FileUpload/FileUpload';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { Header } from '@/components/Header/Header';
import { ChatMessage } from '@/types';
import { generateId } from '@/lib/utils';
import { listCollections, healthCheck } from '@/lib/api';
import { useChatHistory } from '@/hooks/useChatHistory';
import { Upload, X } from 'lucide-react';
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function Home() {
  const { messages, sessionId, addMessage, clearHistory, startNewChat, setMessages, getAllSessions, loadSession } = useChatHistory();
  const [selectedCollection, setSelectedCollection] = useState<string>('documents');
  const [collections, setCollections] = useState<string[]>(['documents']);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileUploadOpen, setMobileUploadOpen] = useState(false);
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
    <ThemeProvider>
      <div className="flex h-full bg-gray-50 dark:bg-gray-900">
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
        <div className="flex-1 flex flex-col h-full">
          {/* Header */}
          <Header
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            selectedCollection={selectedCollection}
            apiStatus={apiStatus}
            onRetryConnection={checkApiHealth}
            onMobileUpload={() => setMobileUploadOpen(true)}
          />

          {/* Main Chat Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Chat Interface */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <ChatInterface
                messages={messages}
                onSendMessage={handleSendMessage}
                onMessageResponse={handleMessageResponse}
                selectedCollection={selectedCollection}
                sessionId={sessionId}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                isConnected={apiStatus === 'connected'}
                onMobileUpload={() => setMobileUploadOpen(true)}
              />
            </div>

            {/* Upload Area (Desktop) */}
            <div className="hidden lg:block w-80 border-l border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
              <div className="h-full flex flex-col justify-between">
                <div className="flex-1 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 dark:text-gray-100">
                    Upload Documents
                  </h3>
                  <FileUpload
                    selectedCollection={selectedCollection}
                    onUploadComplete={handleDocumentUploaded}
                  />
                </div>
                <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex items-center min-h-[52px]">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Upload PDFs, text files, or documents to get started.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Upload Modal */}
        {mobileUploadOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg dark:bg-gray-800">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 dark:bg-gray-800">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        Upload Documents
                      </h3>
                      <button
                        onClick={() => setMobileUploadOpen(false)}
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:bg-gray-800 dark:hover:text-gray-300 dark:ring-offset-gray-800"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    <FileUpload
                      selectedCollection={selectedCollection}
                      onUploadComplete={() => {
                        handleDocumentUploaded();
                        setMobileUploadOpen(false);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
} 