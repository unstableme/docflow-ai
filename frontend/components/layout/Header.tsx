"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Bell, Sun, Moon, Menu, Home, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/":          { title: "Dashboard",    subtitle: "Overview of your financial documents" },
  "/upload":    { title: "Upload",       subtitle: "Add new documents for AI processing" },
  "/manual":    { title: "Manual Entry", subtitle: "Enter document data manually" },
  "/documents": { title: "Documents",    subtitle: "Browse, search and filter all documents" },
  "/ai":        { title: "AI Assistant", subtitle: "Ask questions about your document data" },
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => setMounted(true), []);

  // Match /documents/[id] routes
  const key = pathname.startsWith("/documents/")
    ? "/documents"
    : pathname;

  const info = PAGE_TITLES[key] ?? { title: "DocFlow AI", subtitle: "" };

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-background/80 backdrop-blur px-4 sm:px-6 lg:px-8 py-4 shrink-0">
      {/* Mobile Menu Toggle & Logo/Home */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground"
          aria-label="Open Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/" className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl bg-primary glow-indigo" title="Home">
          <Zap className="h-5 w-5 text-primary-foreground" />
        </Link>
        
        <div className="flex flex-col">
          <h1 className="text-lg font-bold tracking-tight text-foreground leading-tight">{info.title}</h1>
          <p className="text-xs text-muted-foreground hidden sm:block font-medium">{info.subtitle}</p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Global search bar */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search documents…"
            className="pl-9 h-9 w-64 bg-muted/10 border-border text-sm focus-visible:ring-primary/60 placeholder:text-muted-foreground/50 transition-all focus:w-80 cursor-text"
          />
        </div>

        <div className="flex items-center gap-1.5 border-r border-border pr-4 mr-2">
          {/* Theme toggle */}
          <button 
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground cursor-pointer"
            title="Toggle theme"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* Notification bell */}
          <button className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground cursor-pointer">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2.5 right-2.5 h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          </button>
        </div>

        {/* User Profile */}
        <button className="flex items-center gap-3 p-1 rounded-xl hover:bg-muted/40 transition-colors group cursor-pointer">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 text-xs font-bold text-primary select-none group-hover:scale-105 transition-transform">
            FT
          </div>
          <div className="hidden sm:flex flex-col items-start leading-none pr-2 text-left">
            <span className="text-[13px] font-semibold text-foreground">Finance Team</span>
            <span className="text-[10px] text-muted-foreground mt-0.5">Admin Account</span>
          </div>
        </button>
      </div>
    </header>
  );
}


