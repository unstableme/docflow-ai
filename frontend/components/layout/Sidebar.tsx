"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Upload,
  FileText,
  Bot,
  Zap,
  ChevronRight,
  PenLine,
  PanelLeftClose,
  PanelLeftOpen,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/",          label: "Dashboard",  icon: LayoutDashboard },
  { href: "/upload",    label: "Upload",      icon: Upload },
  { href: "/manual",    label: "Manual Entry", icon: PenLine },
  { href: "/documents", label: "Documents",   icon: FileText },
  { href: "/ai",        label: "AI Assistant",icon: Bot },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar shrink-0 transition-all duration-300 ease-in-out md:static",
        isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        isCollapsed ? "md:w-[72px]" : "md:w-60",
        "w-64"
    )}>
      {/* Absolute Toggle Button (useful when collapsed) */}
      {isCollapsed && (
        <button 
          onClick={() => setIsCollapsed(false)}
          className="absolute -right-3 top-6 bg-card border border-border text-muted-foreground hover:text-foreground shadow-sm rounded-full w-6 h-6 flex items-center justify-center p-0 z-50 hover:bg-muted transition-colors"
          title="Expand Sidebar"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Brand & Inline Toggle */}
      <div className={cn(
          "flex items-center px-4 py-6 border-b border-border overflow-hidden",
          isCollapsed ? "justify-center" : "justify-between"
      )}>
          {isCollapsed ? (
            <Link href="/" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary glow-indigo hover:scale-105 transition-transform" title="DocFlow AI">
                <Zap className="h-5 w-5 text-primary-foreground" />
            </Link>
          ) : (
            <>
              <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer group flex-1 truncate">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary glow-indigo group-hover:scale-105 transition-transform">
                    <Zap className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="flex flex-col leading-tight truncate pr-2">
                    <span className="text-[15px] font-bold tracking-tight text-foreground truncate">DocFlow AI</span>
                    <span className="text-[11px] text-muted-foreground truncate">Finance Intelligence</span>
                  </div>
              </Link>
              <button 
                onClick={() => setIsCollapsed(true)}
                className="hidden md:block p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                title="Collapse Sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
              <button 
                onClick={onMobileClose}
                className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                title="Close Sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </>
          )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1.5 px-3 py-5 overflow-x-hidden">
        {!isCollapsed && (
            <p className="px-2 mb-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 whitespace-nowrap">
            Navigation
            </p>
        )}
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              className={cn(
                "group flex items-center rounded-xl font-medium transition-all duration-150 relative",
                isCollapsed ? "justify-center px-0 h-11 w-11 mx-auto" : "gap-3 px-3 py-2.5 text-sm",
                active
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              title={isCollapsed ? label : undefined}
            >
              <Icon className={cn(
                  "shrink-0 transition-colors", 
                  isCollapsed ? "h-5 w-5" : "h-4 w-4",
                  active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )} />
              {!isCollapsed && <span className="flex-1 truncate">{label}</span>}
              {!isCollapsed && active && <ChevronRight className="h-3.5 w-3.5 text-primary/60 shrink-0" />}
            </Link>
          );
        })}
      </nav>


    </aside>
  );
}
