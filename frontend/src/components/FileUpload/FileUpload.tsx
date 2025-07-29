'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { uploadDocument, getSupportedFileTypes } from '@/lib/api';
import { formatFileSize, isValidFileType } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  selectedCollection: string;
  onUploadComplete: () => void;
}

interface UploadStatus {
  file: File;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  result?: any;
}

export function FileUpload({ selectedCollection, onUploadComplete }: FileUploadProps) {
  const [uploads, setUploads] = useState<UploadStatus[]>([]);
  const [supportedTypes] = useState(['.pdf', '.docx', '.doc', '.txt']);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const validFiles = acceptedFiles.filter(file => 
      isValidFileType(file, supportedTypes)
    );

    if (validFiles.length === 0) {
      alert('Please upload supported file types: PDF, DOCX, DOC, TXT');
      return;
    }

    // Initialize upload status for each file
    const newUploads: UploadStatus[] = validFiles.map(file => ({
      file,
      status: 'uploading' as const,
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Upload files sequentially
    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const uploadIndex = uploads.length + i;

      try {
        const result = await uploadDocument(file, selectedCollection);
        
        setUploads(prev => prev.map((upload, idx) =>
          idx === uploadIndex
            ? { ...upload, status: 'success', result }
            : upload
        ));
      } catch (error: any) {
        setUploads(prev => prev.map((upload, idx) =>
          idx === uploadIndex
            ? { 
                ...upload, 
                status: 'error', 
                error: error.response?.data?.detail || error.message || 'Upload failed'
              }
            : upload
        ));
      }
    }

    // Call completion callback after all uploads
    onUploadComplete();
  }, [selectedCollection, onUploadComplete, uploads.length, supportedTypes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
    },
    multiple: true,
  });

  const clearUploads = () => {
    setUploads([]);
  };

  const getStatusIcon = (status: UploadStatus['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary-400 bg-primary-50"
            : "border-gray-300 hover:border-gray-400"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto mb-3 text-gray-400" />
        {isDragActive ? (
          <p className="text-primary-600">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              <span className="font-medium">Click to upload</span> or drag and drop
            </p>
            <p className="text-sm text-gray-500">
              PDF, DOCX, DOC, TXT files supported
            </p>
          </div>
        )}
      </div>

      {/* Collection Info */}
      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <strong>Collection:</strong> {selectedCollection}
      </div>

      {/* Upload Status */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Upload Status ({uploads.length})
            </h4>
            <button
              onClick={clearUploads}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {uploads.map((upload, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                {getStatusIcon(upload.status)}
                <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {upload.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(upload.file.size)}
                  </p>
                  {upload.status === 'error' && upload.error && (
                    <p className="text-xs text-red-600 mt-1">
                      {upload.error}
                    </p>
                  )}
                  {upload.status === 'success' && upload.result && (
                    <p className="text-xs text-green-600 mt-1">
                      {upload.result.processing_result.chunks_added} chunks added
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supported Types */}
      <div className="text-xs text-gray-500">
        <strong>Supported formats:</strong> PDF, Microsoft Word (DOCX, DOC), Plain Text (TXT)
      </div>
    </div>
  );
} 