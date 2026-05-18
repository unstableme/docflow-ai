import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: string; positive: boolean };
  accent?: "indigo" | "green" | "amber" | "red";
  className?: string;
}

const accentMap = {
  indigo: {
    icon: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-500/20",
    glow: "hover:shadow-indigo-500/10",
    trend: "text-indigo-600 dark:text-indigo-400",
  },
  green: {
    icon: "bg-green-500/15 text-green-600 dark:text-green-400",
    border: "border-green-500/20",
    glow: "hover:shadow-green-500/10",
    trend: "text-green-600 dark:text-green-400",
  },
  amber: {
    icon: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
    glow: "hover:shadow-amber-500/10",
    trend: "text-amber-600 dark:text-amber-400",
  },
  red: {
    icon: "bg-red-500/15 text-red-600 dark:text-red-400",
    border: "border-red-500/20",
    glow: "hover:shadow-red-500/10",
    trend: "text-red-600 dark:text-red-400",
  },
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  accent = "indigo",
  className,
}: StatsCardProps) {
  const colors = accentMap[accent];

  return (
    <div
      className={cn(
        "group relative rounded-2xl border bg-card p-5 transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-0.5",
        colors.border,
        colors.glow,
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <span className={cn("text-xs font-medium", trend.positive ? "text-green-400" : "text-red-400")}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
          )}
        </div>

        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", colors.icon)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
