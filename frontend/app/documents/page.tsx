"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Upload, CheckCircle2, Trash2, X } from "lucide-react";
import { DocumentsTable } from "@/components/documents/DocumentsTable";
import { DocumentFilters, type FilterState } from "@/components/documents/DocumentFilters";
import { listDocuments, updateDocument, deleteDocument } from "@/lib/api";
import type { Document } from "@/types";

const DEFAULT_FILTERS: FilterState = {
  search: "",
  status: "all",
  document_type: "all",
  source_type: "all",
  sort: "date_desc",
};

const PAGE_SIZE = 8;

export default function DocumentsPage() {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [allDocs, setAllDocs]   = useState<Document[]>([]);
  const [page, setPage]         = useState(1);
  const [loading, startTransition] = useTransition();

  // ── Selection state ──────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Bulk action state ────────────────────────────────────────────────────────
  const [bulkWorking, setBulkWorking] = useState(false);
  const [bulkStatus, setBulkStatus]   = useState<string | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────────────
  const fetchDocs = async (f: FilterState) => {
    const docs = await listDocuments(f);
    setAllDocs(docs);
    setPage(1);
  };

  useEffect(() => {
    startTransition(async () => {
      await fetchDocs(filters);
    });
  }, [filters]);

  // Initial load
  useEffect(() => {
    listDocuments(DEFAULT_FILTERS).then(setAllDocs);
  }, []);

  const refresh = () => {
    startTransition(async () => {
      const docs = await listDocuments(filters);
      setAllDocs(docs);
    });
  };

  // ── Pagination ───────────────────────────────────────────────────────────────
  const totalPages = Math.ceil(allDocs.length / PAGE_SIZE);
  const paginated  = allDocs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Bulk approve — only acts on non-approved docs ────────────────────────────
  const handleBulkApprove = async () => {
    // approvableIds is derived after selectedCount is set; we read from allDocs at call time
    const ids = allDocs
      .filter((d) => selectedIds.has(d.id) && d.status !== "approved")
      .map((d) => d.id);
    if (ids.length === 0) return;
    setBulkWorking(true);
    setBulkStatus(null);
    try {
      await Promise.all(ids.map((id) => updateDocument(id, { status: "approved" })));
      setBulkStatus(`✓ ${ids.length} document${ids.length > 1 ? "s" : ""} approved`);
      setSelectedIds(new Set());
      refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to approve some documents";
      setBulkStatus(`Error: ${msg}`);
    } finally {
      setBulkWorking(false);
    }
  };

  // ── Bulk delete ──────────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} selected document${ids.length > 1 ? "s" : ""}? This cannot be undone.`)) return;
    const adminPassword = window.prompt("Enter admin password to delete selected documents:");
    if (!adminPassword) return;
    setBulkWorking(true);
    setBulkStatus(null);
    const errors: string[] = [];
    // Run sequentially to avoid hammering the API
    for (const id of ids) {
      try {
        await deleteDocument(id, adminPassword);
      } catch (err) {
        errors.push(id);
      }
    }
    const deleted = ids.length - errors.length;
    setBulkStatus(
      errors.length === 0
        ? `✓ ${deleted} document${deleted > 1 ? "s" : ""} deleted`
        : `Deleted ${deleted}, failed ${errors.length}`
    );
    setSelectedIds(new Set());
    refresh();
    setBulkWorking(false);
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkStatus(null);
  };

  const selectedCount = selectedIds.size;

  // Docs that are selected AND not yet approved — the only ones the approve action touches
  const approvableIds = allDocs
    .filter((d) => selectedIds.has(d.id) && d.status !== "approved")
    .map((d) => d.id);
  const approvableCount = approvableIds.length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">All Documents</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {allDocs.length} document{allDocs.length !== 1 ? "s" : ""} found
          </p>
        </div>
        <Link
          href="/upload"
          className="flex items-center gap-2 self-start sm:self-auto rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </Link>
      </div>

      {/* Filters */}
      <DocumentFilters filters={filters} onChange={setFilters} />

      {/* ── Bulk Action Bar ──────────────────────────────────────────────────── */}
      {selectedCount > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 animate-fade-in">
          {/* Count badge */}
          <span className="flex items-center gap-1.5 text-sm font-semibold text-primary">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {selectedCount}
            </span>
            selected
          </span>

          <div className="h-4 w-px bg-border" />

          {/* Approve — only shown when at least one selected doc isn't already approved */}
          {approvableCount > 0 && (
            <button
              onClick={handleBulkApprove}
              disabled={bulkWorking}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-green-500/15 border border-green-500/30 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approve {approvableCount > 1 ? `${approvableCount}` : ""}
            </button>
          )}

          {/* Delete */}
          <button
            onClick={handleBulkDelete}
            disabled={bulkWorking}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm font-medium text-destructive hover:bg-destructive/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete {selectedCount > 1 ? `all ${selectedCount}` : ""}
          </button>

          {/* Status feedback */}
          {bulkStatus && (
            <span className={`text-xs font-medium ${bulkStatus.startsWith("Error") || bulkStatus.includes("failed") ? "text-destructive" : "text-green-500"}`}>
              {bulkStatus}
            </span>
          )}

          {/* Loading indicator */}
          {bulkWorking && (
            <span className="text-xs text-muted-foreground animate-pulse">Working…</span>
          )}

          {/* Clear selection */}
          <button
            onClick={clearSelection}
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <DocumentsTable
        documents={paginated}
        loading={loading}
        onRefresh={refresh}
        selectedIds={selectedIds}
        onSelectionChange={(ids) => {
          setSelectedIds(ids);
          setBulkStatus(null);
        }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ‹
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                page === i + 1
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
