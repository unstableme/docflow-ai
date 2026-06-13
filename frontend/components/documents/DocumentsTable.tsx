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
  /** IDs currently selected for bulk action */
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

export function DocumentsTable({
  documents,
  loading,
  onRefresh,
  selectedIds,
  onSelectionChange,
}: DocumentsTableProps) {
  const router = useRouter();

  // ── Selection helpers ────────────────────────────────────────────────────────
  const allSelected = documents.length > 0 && documents.every((d) => selectedIds.has(d.id));
  const someSelected = !allSelected && documents.some((d) => selectedIds.has(d.id));

  const toggleAll = () => {
    if (allSelected) {
      // deselect all visible docs
      const next = new Set(selectedIds);
      documents.forEach((d) => next.delete(d.id));
      onSelectionChange(next);
    } else {
      const next = new Set(selectedIds);
      documents.forEach((d) => next.add(d.id));
      onSelectionChange(next);
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  // ── Per-row actions ──────────────────────────────────────────────────────────
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    const adminPassword = window.prompt("Enter admin password to delete this document:");
    if (!adminPassword) return;
    try {
      await deleteDocument(id, adminPassword);
      onRefresh?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete document";
      window.alert(message);
      console.error("Failed to delete document:", err);
    }
  };

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.push(`/documents/${id}?edit=true`);
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
              <div className="h-4 w-4 rounded bg-muted/60" />
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

  // ── Empty state ──────────────────────────────────────────────────────────────
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 gap-3">
        <FileText className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm font-medium text-muted-foreground">No documents found</p>
        <p className="text-xs text-muted-foreground/60">Try adjusting your filters or upload new documents</p>
      </div>
    );
  }

  // ── Checkbox component ───────────────────────────────────────────────────────
  const Checkbox = ({
    checked,
    indeterminate = false,
    onChange,
  }: {
    checked: boolean;
    indeterminate?: boolean;
    onChange: () => void;
  }) => (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      aria-checked={indeterminate ? "mixed" : checked}
      role="checkbox"
      className={`
        h-4 w-4 shrink-0 rounded border transition-all duration-150 flex items-center justify-center
        ${checked || indeterminate
          ? "bg-primary border-primary"
          : "border-border bg-transparent hover:border-primary/60"
        }
      `}
    >
      {indeterminate && !checked && (
        <span className="block h-0.5 w-2 rounded-full bg-primary-foreground" />
      )}
      {checked && (
        <svg className="h-2.5 w-2.5 text-primary-foreground" viewBox="0 0 10 10" fill="none">
          <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );

  // ── Table ────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full rounded-2xl border border-border bg-card overflow-hidden">
      {/* Table header */}
      <div className="hidden md:grid grid-cols-[28px_2fr_0.8fr_0.8fr_1fr_1fr_0.8fr_100px] gap-4 px-5 py-3 border-b border-border bg-muted/20 items-center">
        {/* Select-all checkbox */}
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={toggleAll}
        />
        {["Vendor / File", "Type", "Source", "Amount", "Date", "Status", "Actions"].map((h) => (
          <span key={h} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground last:text-right">
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {documents.map((doc) => {
          const isSelected = selectedIds.has(doc.id);
          return (
            <div
              key={doc.id}
              onClick={() => router.push(`/documents/${doc.id}`)}
              className={`
                w-full group grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-3 px-4 py-4 transition-colors duration-150 cursor-pointer
                md:grid-cols-[28px_2fr_0.8fr_0.8fr_1fr_1fr_0.8fr_100px] md:items-center md:gap-4 md:px-5
                ${isSelected ? "bg-primary/5 hover:bg-primary/8" : "hover:bg-accent/30"}
              `}
            >
              {/* Row checkbox */}
              <div className="hidden md:flex items-center">
                <Checkbox
                  checked={isSelected}
                  onChange={() => toggleOne(doc.id)}
                />
              </div>

              {/* Vendor / file */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile checkbox */}
                <div className="flex md:hidden items-center">
                  <Checkbox
                    checked={isSelected}
                    onChange={() => toggleOne(doc.id)}
                  />
                </div>
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
              <div className="flex justify-end md:block">
                <TypeBadge type={doc.document_type} />
              </div>

              {/* Source */}
              <div className="hidden md:block">
                <span className="text-[13px] font-medium text-muted-foreground capitalize">
                  {doc.source_type === "scan" ? "Scanned" : doc.source_type === "manual" ? "Manual" : "Uploaded"}
                </span>
              </div>

              {/* Amount */}
              <div className="min-w-0">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:hidden">
                  Amount
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {doc.metadata?.total_amount != null
                    ? formatCurrency(doc.metadata.total_amount, doc.metadata.currency)
                    : <span className="text-muted-foreground font-normal">—</span>
                  }
                </span>
              </div>

              {/* Date */}
              <div className="min-w-0 text-right md:text-left">
                <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground md:hidden">
                  Date
                </span>
                <span className="text-sm text-muted-foreground">
                  {doc.metadata?.transaction_date
                    ? formatDate(doc.metadata.transaction_date)
                    : formatDate(doc.uploaded_at)}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center md:block">
                <StatusBadge status={doc.status} />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={(e) => handleEdit(e, doc.id)}
                  className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
                  title="Edit document"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => handleDelete(e, doc.id)}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all duration-200 cursor-pointer"
                  title="Delete document"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
