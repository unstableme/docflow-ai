"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { CloudUpload, CheckCircle2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropZone } from "@/components/upload/DropZone";
import { FileCard } from "@/components/upload/FileCard";
import { uploadDocument } from "@/lib/api";
import { localId } from "@/lib/format";
import type { UploadFile } from "@/types";
import { CameraCaptureModal } from "@/components/upload/CameraCaptureModal";

export default function UploadPage() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [isMobile, setIsMobile] = useState(false);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const handleCameraClick = () => {
    if (isMobile) {
      mobileInputRef.current?.click();
    } else {
      setCameraModalOpen(true);
    }
  };

  const handleMobileCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const captured = Array.from(e.target.files ?? []);
    if (captured.length) addFiles(captured, "scan");
    e.target.value = "";
  };

  const addFiles = useCallback((newFiles: File[], source: "upload" | "scan" = "upload") => {
    setFiles((prev) => [
      ...prev,
      ...newFiles.map((f) => ({
        file: f,
        id: localId(),
        status: "idle" as const,
        source: source,
        progress: 0,
      })),
    ]);
  }, []);

  const removeFile = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  const handleUpload = async () => {
    const idleFiles = files.filter((f) => f.status === "idle");
    if (!idleFiles.length) return;
    setUploading(true);

    await Promise.all(
      idleFiles.map(async (item) => {
        // Mark uploading
        setFiles((prev) =>
          prev.map((f) => f.id === item.id ? { ...f, status: "uploading", progress: 0 } : f)
        );
        try {
          // TODO: uploadDocument() in lib/api.ts → POST /documents/
          await uploadDocument(item.file, item.source, (pct) => {
            setFiles((prev) =>
              prev.map((f) => f.id === item.id ? { ...f, progress: pct } : f)
            );
          });
          setFiles((prev) =>
            prev.map((f) => f.id === item.id ? { ...f, status: "success", progress: 100 } : f)
          );
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Upload failed";
          setFiles((prev) =>
            prev.map((f) => f.id === item.id ? { ...f, status: "error", error: msg } : f)
          );
        }
      })
    );

    setUploading(false);
  };

  const clearAll = () =>
    setFiles((prev) => prev.filter((f) => f.status !== "success"));

  const idleCount   = files.filter((f) => f.status === "idle").length;
  const successCount = files.filter((f) => f.status === "success").length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Upload Documents</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload PDF invoices, receipts, or statements. AI will extract structured data automatically.
        </p>
      </div>

      {/* Drop zone */}
      <DropZone onFiles={addFiles} disabled={uploading} />

      {/* Camera Capture Option */}
      <div className="flex justify-center pt-2">
        <Button 
            variant="outline" 
            className="w-full h-11 sm:w-auto flex items-center justify-center gap-2 border-border text-foreground hover:bg-muted shadow-sm rounded-xl font-medium"
            onClick={handleCameraClick}
            disabled={uploading}
        >
            <Camera className="h-4 w-4 text-primary" />
            Use Camera to Scan
        </Button>
        <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={mobileInputRef} 
            onChange={handleMobileCameraCapture} 
        />
      </div>

      <CameraCaptureModal 
        open={cameraModalOpen} 
        onClose={() => setCameraModalOpen(false)} 
        onCapture={(file) => addFiles([file], "scan")} 
      />

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {files.length} file{files.length > 1 ? "s" : ""} selected
            </p>
            {successCount > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear uploaded
              </button>
            )}
          </div>
          <div className="space-y-2">
            {files.map((item) => (
              <FileCard key={item.id} item={item} onRemove={removeFile} />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {files.length > 0 && (
        <div className="flex items-center gap-4">
          <Button
            onClick={handleUpload}
            disabled={uploading || idleCount === 0}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-semibold"
          >
            <CloudUpload className="h-4 w-4" />
            {uploading ? "Uploading…" : `Upload ${idleCount > 0 ? idleCount : ""} File${idleCount !== 1 ? "s" : ""}`}
          </Button>

          {successCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-400 font-medium">
              <CheckCircle2 className="h-4 w-4" />
              {successCount} uploaded successfully
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm font-semibold text-foreground">What happens after upload?</p>
        <div className="space-y-2">
          {[
            { step: "1", text: "File is stored securely and registered in the database" },
            { step: "2", text: "OCR runs to extract raw text from PDFs or images" },
            { step: "3", text: "AI parses vendor name, date, amounts and line items" },
            { step: "4", text: "Document appears in the Documents table with structured data" },
          ].map(({ step, text }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 border border-primary/30 text-[10px] font-bold text-primary mt-0.5">
                {step}
              </div>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
