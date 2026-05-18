import Link from "next/link";
import { FileText, ArrowRight, Clock } from "lucide-react";
import { StatusBadge } from "@/components/documents/DocumentBadge";
import type { Document } from "@/types";
import { formatCurrency, formatRelativeDate } from "@/lib/format";

interface RecentUploadsProps {
  documents: Document[];
}

export function RecentUploads({ documents }: RecentUploadsProps) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Recent Uploads</span>
        </div>
        <Link
          href="/documents"
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Document list */}
      <div className="divide-y divide-border">
        {documents.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No documents uploaded yet.
          </p>
        )}
        {documents.map((doc, i) => (
          <Link
            key={doc.id}
            href={`/documents/${doc.id}`}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-accent/40 transition-colors group cursor-pointer"
          >
            {/* File icon */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
              <FileText className="h-4 w-4 text-primary" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                {doc.metadata?.vendor_name ?? doc.filename}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {doc.filename} · {formatRelativeDate(doc.uploaded_at)}
              </p>
            </div>

            {/* Amount + status */}
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {doc.metadata?.total_amount != null ? (
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(doc.metadata.total_amount, doc.metadata.currency)}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
              <StatusBadge status={doc.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
