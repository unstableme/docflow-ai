"use client";

import { cn } from "@/lib/utils";

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  className?: string;
}

export function SpendingChart({ data, height = 160, className }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 0);
  const safeMax = max === 0 ? 1 : max;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-stretch justify-between h-[160px] gap-2 px-1">
        {data.map((item, i) => {
          const percentage = (item.value / safeMax) * 100;
          return (
            <div key={item.label} className="group relative flex flex-1 flex-col items-center justify-end gap-2 h-full">
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-white text-[10px] px-2 py-1 rounded border border-zinc-700 pointer-events-none z-10 whitespace-nowrap">
                ${item.value.toLocaleString()}
              </div>

              {/* Bar */}
              <div className="w-full flex-1 flex flex-col justify-end min-h-0">
                <div
                  className="w-full rounded-t-md bg-primary/30 hover:bg-primary/50 border-t border-x border-primary/40 transition-all duration-500 ease-out"
                  style={{
                    height: `${percentage}%`,
                    transitionDelay: `${i * 50}ms`,
                  }}
                />
              </div>

              {/* Label */}
              <span className="text-[10px] text-muted-foreground font-medium uppercase truncate w-full text-center shrink-0">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
