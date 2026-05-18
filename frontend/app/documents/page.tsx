"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { DocumentsTable } from "@/components/documents/DocumentsTable";
import { DocumentFilters, type FilterState } from "@/components/documents/DocumentFilters";
import { listDocuments } from "@/lib/api";
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

  // Fetch when filters change
  useEffect(() => {
    startTransition(async () => {
      // TODO: listDocuments() in lib/api.ts — swap mock for real GET /documents/?...
      const docs = await listDocuments(filters);
      setAllDocs(docs);
      setPage(1);
    });
  }, [filters]);

  // Initial load
  useEffect(() => {
    listDocuments(DEFAULT_FILTERS).then(setAllDocs);
  }, []);

  const totalPages = Math.ceil(allDocs.length / PAGE_SIZE);
  const paginated  = allDocs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
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

      {/* Table */}
      <DocumentsTable 
        documents={paginated} 
        loading={loading} 
        onRefresh={() => {
          startTransition(async () => {
             const docs = await listDocuments(filters);
             setAllDocs(docs);
          });
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
