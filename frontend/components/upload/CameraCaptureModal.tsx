"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CameraCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
}

export function CameraCaptureModal({ open, onClose, onCapture }: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasCaptured, setHasCaptured] = useState(false);
  
  const playShutterSound = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.1);
    } catch(e) {
        // ignore setup errors
    }
  };

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" }, 
        audio: false 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      console.error(err);
      setError("Unable to access camera. Please check permissions or ensure you are using HTTPS.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (open) {
      setHasCaptured(false);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open]);

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    playShutterSound();
    
    setHasCaptured(true);
    setTimeout(() => setHasCaptured(false), 150);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: "image/jpeg" });
      onCapture(file);
      onClose();
    }, "image/jpeg", 0.9);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in p-4">
      <div className="relative w-full max-w-lg bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2"><Camera className="h-4 w-4"/> Document Scanner</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="relative bg-black aspect-[3/4] sm:aspect-[4/3] flex flex-col items-center justify-center overflow-hidden">
          {error ? (
            <p className="text-destructive text-sm font-medium p-6 text-center">{error}</p>
          ) : (
            <>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              {hasCaptured && <div className="absolute inset-0 bg-white opacity-80 z-10 transition-opacity duration-150" />}
            </>
          )}
        </div>

        <div className="p-4 flex justify-center border-t border-border bg-muted/20">
          {!error ? (
            <Button 
                onClick={handleCapture}
                title="Capture Document"
                className="rounded-full w-16 h-16 border-4 border-primary/30 p-0 hover:scale-105 transition-transform bg-primary flex items-center justify-center overflow-hidden shadow-lg shadow-primary/20"
            >
                <div className="w-12 h-12 bg-card rounded-full flex items-center justify-center shadow-inner">
                    <Camera className="h-6 w-6 text-primary" />
                </div>
            </Button>
          ) : (
            <Button onClick={startCamera} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" /> Retry Camera
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
