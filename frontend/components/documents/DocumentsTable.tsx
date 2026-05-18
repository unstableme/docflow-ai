"use client";

import { useRouter } from "next/navigation";
import { FileText, Edit2, Trash2 } from "lucide-react";
import { StatusBadge, TypeBadge } from "@/components/documents/DocumentBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import { deleteDocument } from "@/lib/api";
import type { Document } from "@/types";

interface DocumentsTableProps {
  documents: Document[];
  loading?: boolean;
  onRefresh?: () => void;
}

export function DocumentsTable({ documents, loading, onRefresh }: DocumentsTableProps) {
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this document?")) {
      try {
        await deleteDocument(id);
        onRefresh?.();
      } catch (err) {
        console.error("Failed to delete document:", err);
      }
    }
  };

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.push(`/documents/${id}?edit=true`);
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
              <div className="h-9 w-9 rounded-lg bg-muted/60" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-40 rounded bg-muted/60" />
                <div className="h-3 w-24 rounded bg-muted/40" />
              </div>
              <div className="h-3.5 w-20 rounded bg-muted/40" />
              <div className="h-6 w-20 rounded-full bg-muted/40" />
              <div className="h-3.5 w-16 rounded bg-muted/30" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 gap-3">
        <FileText className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm font-medium text-muted-foreground">No documents found</p>
        <p className="text-xs text-muted-foreground/60">Try adjusting your filters or upload new documents</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Table header */}
      <div className="hidden md:grid grid-cols-[2fr_0.8fr_0.8fr_1fr_1fr_0.8fr_100px] gap-4 px-5 py-3 border-b border-border bg-muted/20">
        {["Vendor / File", "Type", "Source", "Amount", "Date", "Status", "Actions"].map((h) => (
          <span key={h} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground last:text-right">
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {documents.map((doc) => (
          <div
            key={doc.id}
            onClick={() => router.push(`/documents/${doc.id}`)}
            className="w-full group flex md:grid md:grid-cols-[2fr_0.8fr_0.8fr_1fr_1fr_0.8fr_100px] items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors duration-150"
            style={{ cursor: 'pointer' }}
          >
            {/* Vendor / file */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                  {doc.metadata?.vendor_name ?? "—"}
                </p>
                <p className="text-xs text-muted-foreground truncate">{doc.filename}</p>
              </div>
            </div>

            {/* Type */}
            <div>
              <TypeBadge type={doc.document_type} />
            </div>

            {/* Source */}
            <div className="hidden md:block">
              <span className="text-[13px] font-medium text-muted-foreground capitalize">
                {doc.source_type === "scan" ? "Scanned" : doc.source_type === "manual" ? "Manual" : "Uploaded"}
              </span>
            </div>

            {/* Amount */}
            <div>
              <span className="text-sm font-semibold text-foreground">
                {doc.metadata?.total_amount != null
                  ? formatCurrency(doc.metadata.total_amount, doc.metadata.currency)
                  : <span className="text-muted-foreground font-normal">—</span>
                }
              </span>
            </div>

            {/* Date */}
            <div>
              <span className="text-sm text-muted-foreground">
                {doc.metadata?.transaction_date
                  ? formatDate(doc.metadata.transaction_date)
                  : formatDate(doc.uploaded_at)}
              </span>
            </div>

            {/* Status */}
            <div>
              <StatusBadge status={doc.status} />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={(e) => handleEdit(e, doc.id)}
                className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200"
                style={{ cursor: 'pointer' }}
                title="Edit document"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => handleDelete(e, doc.id)}
                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200"
                style={{ cursor: 'pointer' }}
                title="Delete document"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
