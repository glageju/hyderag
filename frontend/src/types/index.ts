export interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: Date;
  sources?: DocumentSource[];
}

export interface DocumentSource {
  content: string;
  metadata: Record<string, any>;
  source: string;
}

export interface ChatResponse {
  answer: string;
  sources: DocumentSource[];
  session_id: string;
  question: string;
}

export interface DocumentUpload {
  filename: string;
  file_path: string;
  file_size: number;
  processing_result: {
    collection_name: string;
    chunks_added: number;
    document_ids: string[];
  };
}

export interface Collection {
  name: string;
  document_count?: number;
  created_at?: string;
}

export interface HypotheticalDocument {
  question: string;
  hypothetical_document: string;
}

export interface ApiError {
  detail: string;
  status_code?: number;
} 