"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, ArrowUpDown } from "lucide-react";

export type FilterState = {
  search: string;
  status: string;
  document_type: string;
  source_type: string;
  sort: "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
};

interface DocumentFiltersProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

const STATUS_OPTIONS = [
  { value: "all",        label: "All Statuses" },
  { value: "approved",   label: "Approved" },
  { value: "processed",  label: "Processed" },
  { value: "flagged",    label: "Flagged" },
  { value: "pending",    label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "error",      label: "Error" },
];

const TYPE_OPTIONS = [
  { value: "all",            label: "All Types" },
  { value: "invoice",        label: "Invoice" },
  { value: "receipt",        label: "Receipt" },
  { value: "purchase_order", label: "Purchase Order" },
  { value: "statement",      label: "Statement" },
];

const SOURCE_OPTIONS = [
  { value: "all",    label: "All Sources" },
  { value: "upload", label: "Uploaded" },
  { value: "scan",   label: "Scanned" },
  { value: "manual", label: "Manual Entry" },
];

const SORT_OPTIONS = [
  { value: "date_desc",   label: "Newest First" },
  { value: "date_asc",    label: "Oldest First" },
  { value: "amount_desc", label: "Highest Amount" },
  { value: "amount_asc",  label: "Lowest Amount" },
];

const selectCls =
  "h-9 rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/60 transition-colors hover:bg-muted/50";

export function DocumentFilters({ filters, onChange }: DocumentFiltersProps) {
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search vendor or filename…"
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          className="pl-9 h-9 bg-muted/30 border-border text-sm focus-visible:ring-primary/60"
        />
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-1.5">
        <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <select
          value={filters.status}
          onChange={(e) => set("status", e.target.value)}
          className={selectCls}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-background text-foreground">{o.label}</option>
          ))}
        </select>
      </div>

      {/* Type filter */}
      <select
        value={filters.document_type}
        onChange={(e) => set("document_type", e.target.value)}
        className={selectCls}
      >
        {TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="bg-background text-foreground">{o.label}</option>
        ))}
      </select>

      {/* Source filter */}
      <select
        value={filters.source_type}
        onChange={(e) => set("source_type", e.target.value)}
        className={selectCls}
      >
        {SOURCE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="bg-background text-foreground">{o.label}</option>
        ))}
      </select>

      {/* Sort */}
      <div className="flex items-center gap-1.5">
        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <select
          value={filters.sort}
          onChange={(e) => set("sort", e.target.value as FilterState["sort"])}
          className={selectCls}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-background text-foreground">{o.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
