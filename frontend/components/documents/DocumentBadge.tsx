import { cn } from "@/lib/utils";
import type { DocumentStatus, DocumentType } from "@/types";

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; classes: string; dot: string }
> = {
  pending: { label: "Pending", classes: "bg-zinc-700/60 text-zinc-300 border-zinc-600/50", dot: "bg-zinc-400" },
  processing: { label: "Processing", classes: "bg-blue-500/15 text-blue-400 border-blue-500/30", dot: "bg-blue-400 animate-pulse" },
  processed: { label: "Processed", classes: "bg-green-500/15 text-green-400 border-green-500/30", dot: "bg-green-400" },
  approved: { label: "Approved", classes: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", dot: "bg-emerald-500" },
  flagged: { label: "Flagged", classes: "bg-amber-500/15 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
  error: { label: "Error", classes: "bg-red-500/15 text-red-400 border-red-500/30", dot: "bg-red-400" },
};

interface StatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        config.classes,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

// ─── Document Type Badge ──────────────────────────────────────────────────────

const TYPE_CONFIG: Record<DocumentType, { label: string; classes: string }> = {
  invoice: { label: "Invoice", classes: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25" },
  receipt: { label: "Receipt", classes: "bg-violet-500/15 text-violet-400 border-violet-500/25" },
  purchase_order: { label: "Purchase Order", classes: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25" },
  statement: { label: "Statement", classes: "bg-teal-500/15 text-teal-400 border-teal-500/25" },
  other: { label: "Other", classes: "bg-zinc-700/60 text-zinc-300 border-zinc-600/50" },
};

interface TypeBadgeProps {
  type: DocumentType;
  className?: string;
}

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const config = TYPE_CONFIG[type];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  );
}

// ─── Confidence Score ─────────────────────────────────────────────────────────

export function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const cls =
    pct >= 90 ? "text-green-400 border-green-500/30 bg-green-500/10" :
      pct >= 70 ? "text-amber-400 border-amber-500/30 bg-amber-500/10" :
        "text-red-400   border-red-500/30   bg-red-500/10";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", cls)}>
      {pct}% confidence
    </span>
  );
}
