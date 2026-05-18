"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
}

const ACCEPTED = [".pdf", ".jpg", ".jpeg", ".png", ".webp"];
const ACCEPTED_MIME = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export function DropZone({ onFiles, disabled }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files).filter((f) =>
        ACCEPTED_MIME.includes(f.type)
      );
      if (files.length) onFiles(files);
    },
    [onFiles, disabled]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files);
    // Reset so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 transition-all duration-200 cursor-pointer select-none",
        dragging
          ? "border-primary bg-primary/10 scale-[1.01]"
          : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Animated icon */}
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl border transition-all duration-300",
          dragging
            ? "border-primary bg-primary/20 scale-110 glow-indigo"
            : "border-border bg-card"
        )}
      >
        {dragging ? (
          <CloudUpload className="h-8 w-8 text-primary animate-bounce" />
        ) : (
          <Upload className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      <div className="text-center">
        <p className="text-base font-semibold text-foreground">
          {dragging ? "Drop files here" : "Drag & drop files"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          or <span className="text-primary font-medium">click to browse</span>
        </p>
        <p className="mt-3 text-xs text-muted-foreground/60">
          Supports: PDF, JPG, PNG, WEBP · Max 20 MB per file
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}
