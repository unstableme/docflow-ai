// ─── API Client ───────────────────────────────────────────────────────────────
// All FastAPI integration points are centralised here.
// To connect to the real backend, update NEXT_PUBLIC_API_URL in .env.local
// and replace the mock return values with `fetch` calls below.

import type {
  Document,
  DocumentUploadResponse,
  DashboardStats,
  AIQueryResponse,
  ExpenseMetadata,
  DocumentStatus,
} from "@/types";
import { MOCK_DOCUMENTS, MOCK_STATS } from "@/lib/mock-data";

// ── Config ────────────────────────────────────────────────────────────────────
const API_PORT = "8000";
const CONFIGURED_API_URL = process.env.NEXT_PUBLIC_API_URL?.trim();

const isLoopbackHost = (host: string) =>
  host === "localhost" || host === "127.0.0.1" || host === "::1";

const withProtocol = (url: string, protocol = "http:") =>
  /^https?:\/\//i.test(url) ? url : `${protocol}//${url}`;

export function getApiBaseUrl() {
  const fallbackUrl = `http://127.0.0.1:${API_PORT}`;

  if (typeof window === "undefined") {
    return CONFIGURED_API_URL ? withProtocol(CONFIGURED_API_URL).replace(/\/$/, "") : fallbackUrl;
  }

  const frontendHost = window.location.hostname;
  const frontendProtocol = window.location.protocol || "http:";

  if (CONFIGURED_API_URL) {
    const configuredUrl = new URL(withProtocol(CONFIGURED_API_URL, frontendProtocol));

    if (isLoopbackHost(configuredUrl.hostname) && !isLoopbackHost(frontendHost)) {
      configuredUrl.hostname = frontendHost;
      configuredUrl.port = configuredUrl.port || API_PORT;
      configuredUrl.protocol = frontendProtocol;
    }

    return configuredUrl.toString().replace(/\/$/, "");
  }

  if (isLoopbackHost(frontendHost)) {
    return fallbackUrl;
  }

  return `${frontendProtocol}//${frontendHost}:${API_PORT}`;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const API_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { "Content-Type": "application/json" },
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const primaryBase = getApiBaseUrl();
  const url = `${primaryBase}${path}`;
  console.log(`[API] Fetching: ${url}`, init?.method || "GET");

  try {
    const res = await fetchWithTimeout(url, init);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `HTTP ${res.status}`);
    }
    return res.json() as Promise<T>;
  } catch (err) {
    // If the primary URL isn't the loopback fallback, retry against 127.0.0.1
    // This handles the case where the browser is on a LAN IP but the backend
    // only listens on localhost.
    const fallbackBase = `http://127.0.0.1:${API_PORT}`;
    if (primaryBase !== fallbackBase && typeof window !== "undefined") {
      const fallbackUrl = `${fallbackBase}${path}`;
      console.warn(`[API] Primary fetch failed, retrying on fallback: ${fallbackUrl}`, err);
      const res = await fetchWithTimeout(fallbackUrl, init);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      return res.json() as Promise<T>;
    }
    throw err;
  }
}

/**
 * Upload a single document file.
 * TODO: Replace mock with → POST /documents/
 */
export async function uploadDocument(
  file: File,
  source: "upload" | "scan" = "upload",
  onProgress?: (pct: number) => void
): Promise<DocumentUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("source_type", source);

  // Note: Standard fetch doesn't support progress events. 
  // For true progress, we'd use XMLHttpRequest or axios.
  // For now, we simulate full progress on completion.
  const res = await fetch(`${getApiBaseUrl()}/documents/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  onProgress?.(100);
  return res.json();
}

/**
 * Create a document manually via metadata instead of a file.
 */
export async function createManualDocument(data: ExpenseMetadata): Promise<Document> {
  return apiFetch<Document>("/documents/manual", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Fetch a single document by ID.
 */
export async function getDocument(id: string): Promise<Document> {
  return apiFetch<Document>(`/documents/${id}`);
}

/**
 * Update a document (e.g. approve or modify metadata).
 */
export async function updateDocument(id: string, data: { status?: DocumentStatus; metadata?: ExpenseMetadata }): Promise<Document> {
  return apiFetch<Document>(`/documents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Delete a document by ID.
 */
export async function deleteDocument(id: string, adminPassword?: string): Promise<{ message: string; id: string }> {
  return apiFetch<{ message: string; id: string }>(`/documents/${id}`, {
    method: "DELETE",
    headers: adminPassword ? { "X-Admin-Password": adminPassword } : undefined,
  });
}

/**
 * List documents with optional filters.
 */
export async function listDocuments(params?: {
  search?: string;
  status?: string;
  source_type?: string;
  document_type?: string;
  sort?: "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
}): Promise<Document[]> {
  const qs = new URLSearchParams();
  if (params?.status && params.status !== "all") {
    qs.append("status", params.status);
  }
  if (params?.source_type && params.source_type !== "all") {
    qs.append("source_type", params.source_type);
  }
  // Frontend search and sort can still be done client-side if the backend doesn't support all yet
  // but for now let's just fetch the base list.
  
  const documents = await apiFetch<Document[]>(`/documents/?${qs.toString()}`);
  
  // Apply search/sort client-side for better UX if needed
  let filtered = [...documents];
  if (params?.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter((d) =>
      d.metadata?.vendor_name?.toLowerCase().includes(q) ||
      d.filename.toLowerCase().includes(q)
    );
  }
  // ... (sort logic can be added here if desired)
  
  return filtered;
}

/**
 * Get dashboard summary stats.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/documents/stats");
}

/**
 * Send a natural-language query to the AI assistant.
 */
export async function queryAI(question: string): Promise<AIQueryResponse> {
  return apiFetch<AIQueryResponse>("/ai/query", {
    method: "POST",
    body: JSON.stringify({ question }),
  });
}
