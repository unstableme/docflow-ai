import { FileText, Image, CheckCircle2, XCircle, Loader2, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/format";
import type { UploadFile } from "@/types";

interface FileCardProps {
  item: UploadFile;
  onRemove: (id: string) => void;
}

const STATUS_META = {
  idle:       { label: "Ready to upload",  icon: null,        color: "text-muted-foreground" },
  uploading:  { label: "Uploading…",       icon: "spinner",   color: "text-blue-400" },
  success:    { label: "Uploaded",         icon: "check",     color: "text-green-400" },
  error:      { label: "Failed",           icon: "error",     color: "text-red-400" },
};

export function FileCard({ item, onRemove }: FileCardProps) {
  const meta = STATUS_META[item.status];
  const isPdf = item.file.type === "application/pdf";

  return (
    <div
      className={cn(
        "group relative flex items-start gap-4 rounded-xl border p-4 transition-all duration-200",
        item.status === "success" ? "border-green-500/30 bg-green-500/5" :
        item.status === "error"   ? "border-red-500/30 bg-red-500/5" :
        item.status === "uploading" ? "border-blue-500/30 bg-blue-500/5" :
        "border-border bg-card hover:border-border/80"
      )}
    >
      {/* File type icon */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/60 border border-border">
        {isPdf
          ? <FileText className="h-5 w-5 text-red-400" />
          : <Image className="h-5 w-5 text-blue-400" />
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground truncate">{item.file.name}</p>
          {/* Remove button — only when idle or error */}
          {(item.status === "idle" || item.status === "error") && (
            <button
              onClick={() => onRemove(item.id)}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{formatFileSize(item.file.size)}</span>
          <span className="text-muted-foreground/40">·</span>
          <span className={cn("text-xs font-medium flex items-center gap-1", meta.color)}>
            {meta.icon === "spinner" && <Loader2 className="h-3 w-3 animate-spin" />}
            {meta.icon === "check"   && <CheckCircle2 className="h-3 w-3" />}
            {meta.icon === "error"   && <XCircle className="h-3 w-3" />}
            {item.error ?? meta.label}
          </span>
        </div>

        {/* Progress bar */}
        {item.status === "uploading" && (
          <div className="mt-2.5">
            <Progress value={item.progress} className="h-1.5 bg-muted" />
          </div>
        )}
      </div>
    </div>
  );
}
