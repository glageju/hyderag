'use client';

import { useState } from 'react';
import { X, FolderOpen, Trash2, Plus } from 'lucide-react';
import { DocumentList } from '@/components/Documents/DocumentList';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collections: string[];
  selectedCollection: string;
  onCollectionChange: (collection: string) => void;
  onClearChat: () => void;
  onDocumentUploaded: () => void;
  refreshTrigger?: number;
}

export function Sidebar({
  isOpen,
  onClose,
  collections,
  selectedCollection,
  onCollectionChange,
  onClearChat,
  onDocumentUploaded,
  refreshTrigger,
}: SidebarProps) {

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
        <div className="p-4 space-y-2 border-b border-gray-200">
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

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto">
          <DocumentList
            selectedCollection={selectedCollection}
            onDocumentDeleted={onDocumentUploaded}
            refreshTrigger={refreshTrigger}
          />
        </div>



        {/* Actions */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={onClearChat}
            className="w-full flex items-center justify-center gap-2 p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
      </div>
    </>
  );
} 