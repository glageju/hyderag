'use client';

import { Menu, RefreshCw, Zap, AlertCircle, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';

interface HeaderProps {
  onToggleSidebar: () => void;
  selectedCollection: string;
  apiStatus: 'connected' | 'disconnected' | 'checking';
  onRetryConnection: () => void;
  onMobileUpload?: () => void;
}

export function Header({ 
  onToggleSidebar, 
  selectedCollection, 
  apiStatus, 
  onRetryConnection,
  onMobileUpload
}: HeaderProps) {
  const getStatusIcon = () => {
    switch (apiStatus) {
      case 'connected':
        return <Zap className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'checking':
        return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusText = () => {
    switch (apiStatus) {
      case 'connected':
        return 'Connected';
      case 'disconnected':
        return 'Disconnected';
      case 'checking':
        return 'Checking...';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 dark:bg-gray-800 dark:border-gray-700 h-16">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 text-gray-500 hover:text-gray-700 lg:hidden dark:text-gray-400 dark:hover:text-gray-200"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                HYDE RAG Chat
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Collection: {selectedCollection}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Mobile Upload Button */}
          {onMobileUpload && (
            <button
              onClick={onMobileUpload}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
              title="Upload Documents"
            >
              <Upload className="w-5 h-5" />
            </button>
          )}

          {/* API Status */}
          <div 
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
              apiStatus === 'connected' && "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
              apiStatus === 'disconnected' && "bg-red-100 text-red-700 cursor-pointer hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30",
              apiStatus === 'checking' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
            )}
            onClick={apiStatus === 'disconnected' ? onRetryConnection : undefined}
          >
            {getStatusIcon()}
            <span>{getStatusText()}</span>
            {apiStatus === 'disconnected' && (
              <RefreshCw className="w-3 h-3 ml-1" />
            )}
          </div>

          {/* HYDE Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full text-sm font-medium dark:bg-primary-900/20 dark:text-primary-400">
            <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
            HYDE RAG
          </div>
        </div>
      </div>
    </header>
  );
} 