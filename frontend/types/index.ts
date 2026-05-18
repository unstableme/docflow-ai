// ─── Shared TypeScript Types ──────────────────────────────────────────────────
// These mirror the FastAPI Pydantic schemas in backend/app/schemas/document.py

export type DocumentStatus = "pending" | "processing" | "processed" | "flagged" | "error" | "approved";
export type DocumentType = "invoice" | "receipt" | "purchase_order" | "statement" | "other";

export interface ExpenseItem {
  description: string;
  quantity: number;
  unit_price: number | null;
  total_price: number;
}

export interface ExpenseMetadata {
  vendor_name: string | null;
  transaction_date: string | null; // ISO date string
  total_amount: number | null;
  currency: string;
  tax_amount: number | null;
  category: string | null;
  line_items: ExpenseItem[];
  confidence_score: number; // 0.0 – 1.0
}

export interface Document {
  id: string;
  filename: string;
  file_type: string; // MIME type e.g. "application/pdf"
  document_type: DocumentType;
  status: DocumentStatus;
  uploaded_at: string; // ISO datetime string
  source_type: "manual" | "upload" | "scan";
  metadata: ExpenseMetadata | null;
}

// ─── API Response shapes ──────────────────────────────────────────────────────

export interface DocumentUploadResponse {
  id: string;
  status: DocumentStatus;
  message: string;
  metadata: ExpenseMetadata | null;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface AIQueryResponse {
  answer: string;
  sources: string[]; // document IDs referenced
  timestamp: string;
}

// ─── UI-only helpers ──────────────────────────────────────────────────────────

export interface UploadFile {
  file: File;
  id: string; // local temp ID
  status: "idle" | "uploading" | "success" | "error";
  source: "upload" | "scan";
  progress: number; // 0–100
  error?: string;
  response?: DocumentUploadResponse;
}

export interface DashboardStats {
  totalDocuments: number;
  processedDocuments: number;
  flaggedDocuments: number;
  totalBilledAmount: number;
  currency: string;
}
