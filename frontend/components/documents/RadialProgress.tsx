"use client";

import { cn } from "@/lib/utils";

interface RadialProgressProps {
  value: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function RadialProgress({
  value,
  size = 80,
  strokeWidth = 8,
  className,
}: RadialProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - value * circumference;

  const color = 
    value >= 0.9 ? "text-green-500" :
    value >= 0.7 ? "text-amber-500" :
                   "text-red-500";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-1000 ease-in-out", color)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-sm font-bold text-foreground">{Math.round(value * 100)}%</span>
        <span className="text-[8px] uppercase tracking-tighter text-muted-foreground font-semibold">Match</span>
      </div>
    </div>
  );
}
