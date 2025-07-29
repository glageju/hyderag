'use client';

import { useState } from 'react';
import { X, FolderOpen, Trash2, Plus, Upload } from 'lucide-react';
import { FileUpload } from '@/components/FileUpload/FileUpload';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collections: string[];
  selectedCollection: string;
  onCollectionChange: (collection: string) => void;
  onClearChat: () => void;
  onDocumentUploaded: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
  collections,
  selectedCollection,
  onCollectionChange,
  onClearChat,
  onDocumentUploaded,
}: SidebarProps) {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Collections
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Collections List */}
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {collections.map((collection) => (
            <button
              key={collection}
              onClick={() => onCollectionChange(collection)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                selectedCollection === collection
                  ? "bg-primary-50 text-primary-700 border border-primary-200"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <FolderOpen className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{collection}</span>
            </button>
          ))}

          {collections.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No collections yet</p>
              <p className="text-xs text-gray-400 mt-1">
                Upload a document to get started
              </p>
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="w-full flex items-center justify-center gap-2 p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload Document
          </button>
          
          {showUpload && (
            <div className="mt-4">
              <FileUpload
                selectedCollection={selectedCollection}
                onUploadComplete={() => {
                  onDocumentUploaded();
                  setShowUpload(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={onClearChat}
            className="w-full flex items-center justify-center gap-2 p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear Chat
          </button>
        </div>
      </div>
    </>
  );
} 